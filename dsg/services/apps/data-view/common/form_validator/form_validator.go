package form_validator

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/gin-gonic/gin/binding"
	universal_translator "github.com/go-playground/universal-translator"
	"github.com/go-playground/validator/v10"
	"github.com/kweaver-ai/TelemetrySDK-Go/exporter/v2/ar_trace"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/util"
	"go.opentelemetry.io/otel/trace"
	"strings"
)

// BindAndValid bind data from form and  validate
func BindAndValid(c *gin.Context, v interface{}) (bool, error) {
	newCtx := util.StartSpan(c)
	defer util.End(newCtx)

	var err error
	b := binding.Default(c.Request.Method, c.ContentType())
	switch b {
	case binding.Query:
		err = customQuery.Bind(c, v)

	case binding.Form:
		err = customForm.Bind(c, v)

	case binding.FormMultipart:
		err = customFormMultipart.Bind(c, v)
	}

	if err != nil {
		validatorErrors, ok := err.(validator.ValidationErrors)
		if !ok {
			return false, err
		}

		return false, genStructError(validatorErrors.Translate(getTrans(c)))
	}

	return true, nil
}

// BindFormAndValid parse and validate parameters in form-data
func BindFormAndValid(c *gin.Context, v interface{}) (bool, error) {
	newCtx := util.StartSpan(c)
	defer util.End(newCtx)

	if err := customForm.Bind(c, v); err != nil {
		validatorErrors, ok := err.(validator.ValidationErrors)
		if !ok {
			return false, err
		}
		return false, genStructError(validatorErrors.Translate(getTrans(c)))
	}
	return true, nil
}

// BindQueryAndValid parse and validate parameters in query
func BindQueryAndValid(c *gin.Context, v interface{}) (bool, error) {
	newCtx := util.StartSpan(c)
	defer util.End(newCtx)

	if err := customQuery.Bind(c, v); err != nil {
		validatorErrors, ok := err.(validator.ValidationErrors)
		if !ok {
			return false, err
		}
		return false, genStructError(validatorErrors.Translate(getTrans(c)))
	}
	return true, nil
}

// BindUriAndValid parse and validate parameters in uri
func BindUriAndValid(c *gin.Context, v interface{}) (bool, error) {
	newCtx := util.StartSpan(c)
	defer util.End(newCtx)

	err := c.ShouldBindUri(v)
	if err != nil {
		validatorErrors, ok := err.(validator.ValidationErrors)
		if !ok {
			return false, err
		}

		return false, genStructError(validatorErrors.Translate(getTrans(c)))
	}

	return true, nil
}

func BindJsonAndValidV2(c *gin.Context, v interface{}) (bool, error) {
	newCtx := util.StartSpan(c)
	defer util.End(newCtx)

	err := c.ShouldBindJSON(v)
	if err != nil {
		if validatorErrors, ok := err.(validator.ValidationErrors); ok {
			return false, genStructError(validatorErrors.Translate(getTrans(c)))
		}
		if isBindError, err1 := IsBindError(c, err); isBindError {
			return false, err1
		}
		if jsonUnmarshalTypeError, ok := err.(*json.UnmarshalTypeError); ok {
			var validErrors ValidErrors
			validErrors = append(validErrors, &ValidError{
				Key:     jsonUnmarshalTypeError.Field,
				Message: "请输入符合要求的数据类型和数据范围",
			})
			return false, validErrors
		}

		if jsonUnsupportedTypeError, ok := err.(*json.UnsupportedTypeError); ok {
			var validErrors ValidErrors
			validErrors = append(validErrors, &ValidError{
				Key:     jsonUnsupportedTypeError.Type.Name(),
				Message: "不支持的json数据类型",
			})
			return false, validErrors
		}

		if jsonUnsupportedValueError, ok := err.(*json.UnsupportedValueError); ok {
			var validErrors ValidErrors
			validErrors = append(validErrors, &ValidError{
				Key:     jsonUnsupportedValueError.Str,
				Message: "不支持的json数据值",
			})
			return false, validErrors
		}

		return false, err
	}
	return true, nil
}

// BindUriAndValidByBatch parse and validate parameters in uri
func BindUriAndValidByBatch(c *gin.Context, v interface{}) (bool, error) {
	_, span := ar_trace.Tracer.Start(c, "BindUriAndValidByBatch")
	defer span.End()
	m := make(map[string][]string)
	for _, v := range c.Params {
		ids := strings.Split(v.Value, ",")
		m[v.Key] = ids
	}
	err := binding.Uri.BindUri(m, v)
	if err != nil {
		validatorErrors, ok := err.(validator.ValidationErrors)
		if !ok {
			return false, err
		}
		return false, genStructError(validatorErrors.Translate(getTrans(c)))
	}
	return true, nil
}

// GetRequestBodyKey get common key in reqStruct and excludeStruct, and exclude properties required in 'exclude'
func GetRequestBodyKey(c *gin.Context, reqStruct any, excludeStruct any) ([]string, error) {
	bodyMap, err := getOrmJsonBody(c)
	if err != nil {
		return nil, err
	}
	if err1 := filterUselessInputKeys(reqStruct, bodyMap); err1 != nil {
		return nil, err1
	}
	excludeKeyMap := getRequiredKeys(excludeStruct)

	var validErrors ValidErrors
	for k, v := range bodyMap {
		excludeValue, ok := excludeKeyMap[k]
		if ok && fmt.Sprintf("%v", excludeValue) == fmt.Sprintf("%v", v) {
			validErrors = append(validErrors, &ValidError{
				Key:     k,
				Message: fmt.Sprintf("参数[%s]不可置空", k),
			})
		}
	}
	if len(validErrors) > 0 {
		return nil, validErrors
	}
	modifiable := make([]string, 0)
	for k, _ := range bodyMap {
		modifiable = append(modifiable, k)
	}
	return modifiable, nil
}

func ValidateStruct(v any) (bool, ValidErrors) {
	var errs ValidErrors
	err := binding.Validator.ValidateStruct(v)
	if err != nil {
		validatorErrors, ok := err.(validator.ValidationErrors)
		if !ok {
			return false, errs
		}
		zhTranslator, _ := uniTrans.GetTranslator("zh")
		return false, genStructError(validatorErrors.Translate(zhTranslator))
	}
	return true, nil
}

// genStructError remove struct name in validate error, then return ValidErrors
func genStructError(fields map[string]string) ValidErrors {
	var errs ValidErrors
	// removeTopStruct 去除字段名中的结构体名称标识
	// refer from:https://github.com/go-playground/validator/issues/633#issuecomment-654382345
	for field, err := range fields {
		errs = append(errs, &ValidError{
			//Key:     field[strings.LastIndex(field, ".")+1:],
			Key:     field[strings.Index(field, ".")+1:],
			Message: err,
		})
	}
	return errs
}

func getLocale(c *gin.Context) []string {
	acceptLanguage := c.GetHeader("Accept-Language")
	ret := make([]string, 0)
	for _, lang := range strings.Split(acceptLanguage, ",") {
		if len(lang) == 0 {
			continue
		}

		ret = append(ret, strings.SplitN(lang, ";", 2)[0])
	}

	return ret
}

func getTrans(c *gin.Context) universal_translator.Translator {
	locales := getLocale(c)

	trans, _ := uniTrans.FindTranslator(locales...)
	return trans
}

func InsertSpan(ctx context.Context, name string) trace.Span {
	newCtx, span := ar_trace.Tracer.Start(ctx, name)
	ctx = newCtx
	return span
}
