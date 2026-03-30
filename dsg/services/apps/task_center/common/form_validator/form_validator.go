package form_validator

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/kweaver-ai/dsg/services/apps/task_center/common/errorcode"

	ut "github.com/go-playground/universal-translator"
	"go.opentelemetry.io/otel/trace"

	"github.com/kweaver-ai/TelemetrySDK-Go/exporter/v2/ar_trace"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/util"
	"github.com/kweaver-ai/idrm-go-common/util/validation/field"

	"github.com/gin-gonic/gin"
	"github.com/gin-gonic/gin/binding"
	validator "github.com/go-playground/validator/v10"
)

type ValidError struct {
	Key     string `json:"key"`
	Message string `json:"message"`
}

// NewValidErrorForFieldError 根据 field.Error 创建 ValidError
func NewValidErrorForFieldError(err *field.Error) *ValidError {
	if err == nil {
		return nil
	}

	var msg string
	switch err.Type {
	case field.ErrorTypeRequired:
		msg = fmt.Sprintf("%s 为必填字段", err.Field)
	default:
		msg = err.ErrorBody()
	}
	return &ValidError{
		Key:     err.Field,
		Message: msg,
	}
}

type ValidErrors []*ValidError

// NewValidErrorsForFieldErrorList 根据 field.ErrorList 创建 ValidErrors
func NewValidErrorsForFieldErrorList(errList field.ErrorList) (result ValidErrors) {
	for _, err := range errList {
		result = append(result, NewValidErrorForFieldError(err))
	}
	return
}

func (v *ValidError) Error() string {
	return v.Message
}

func (v ValidErrors) Error() string {
	return strings.Join(v.Errors(), ",")
}

func (v ValidErrors) Errors() []string {
	var errs []string
	for _, err := range v {
		errs = append(errs, err.Error())
	}

	return errs
}

// BindAndValid bind data from form and  validate
func BindAndValid(c *gin.Context, v interface{}) (bool, error) {
	newCtx := util.StartSpan(c)
	defer util.End(newCtx)

	b := binding.Default(c.Request.Method, c.ContentType())
	switch b {
	case binding.Query:
		b = customQuery

	case binding.Form:
		b = customForm

	case binding.FormMultipart:
		b = customFormMultipart
	}

	err := c.ShouldBindWith(v, b)
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

	err := c.ShouldBindWith(v, customForm)
	if err != nil {
		validatorErrors, ok := err.(validator.ValidationErrors)
		if !ok {
			return false, err
		}

		return false, genStructError(validatorErrors.Translate(getTrans(c)))
	}

	return true, nil
}

func BindQuery[T any](c *gin.Context) (*T, error) {
	t := new(T)
	if _, err := BindQueryAndValid(c, t); err != nil {
		return nil, errorcode.Detail(errorcode.PublicInvalidParameter, err)
	}
	return t, nil
}

// BindQueryAndValid parse and validate parameters in query
func BindQueryAndValid(c *gin.Context, v interface{}) (bool, error) {
	newCtx := util.StartSpan(c)
	defer util.End(newCtx)

	err := c.ShouldBindWith(v, customQuery)
	if err != nil {
		validatorErrors, ok := err.(validator.ValidationErrors)
		if !ok {
			return false, err
		}
		return false, genStructError(validatorErrors.Translate(getTrans(c)))
	}
	return true, nil
}

func BindUri[T any](c *gin.Context) (*T, error) {
	t := new(T)
	_, err := BindUriAndValid(c, t)
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicInvalidParameter, err)
	}
	return t, nil
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

func BindJson[T any](c *gin.Context) (*T, error) {
	t := new(T)
	_, err := BindJsonAndValid(c, t)
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicInvalidParameter, err)
	}
	return t, nil
}

func BindJsonAndValid(c *gin.Context, v interface{}) (bool, error) {
	newCtx := util.StartSpan(c)
	defer util.End(newCtx)

	err := c.ShouldBindJSON(v)
	if err != nil {
		if validatorErrors, ok := err.(validator.ValidationErrors); ok {
			return false, genStructError(validatorErrors.Translate(getTrans(c)))
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

func getTrans(c *gin.Context) ut.Translator {
	locales := getLocale(c)

	trans, _ := uniTrans.FindTranslator(locales...)
	return trans
}

func InsertSpan(ctx context.Context, name string) trace.Span {
	newCtx, span := ar_trace.Tracer.Start(ctx, name)
	ctx = newCtx
	return span
}
