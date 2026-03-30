package form_validator

import (
	"encoding/json"
	"errors"
	"fmt"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/gin-gonic/gin/binding"
	ut "github.com/go-playground/universal-translator"
	"github.com/go-playground/validator/v10"
)

type ValidError struct {
	Key     string `json:"key"`
	Message string `json:"message"`
}

type ValidErrors []*ValidError

func (v *ValidError) Error() string {
	return fmt.Sprintf("key: %v, msg: %v", v.Key, v.Message)
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

// BindAndValid bind data from form and  validate
func BindAndValid(c *gin.Context, v interface{}) (bool, error) {
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

// BindQueryAndValid parse and validate parameters in query
func BindQueryAndValid(c *gin.Context, v interface{}) (bool, error) {
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

// BindUriAndValid parse and validate parameters in uri
func BindUriAndValid(c *gin.Context, v interface{}) (bool, error) {
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

func BindJsonAndValid(c *gin.Context, v interface{}) (bool, error) {
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
			Key:     field[strings.Index(field, ".")+1:],
			Message: err,
		})
	}
	return errs
}

func IsBindError(c *gin.Context, err error) (bool, error) {
	if err == nil {
		return false, nil
	}

	var sliceValidatorErrors SliceValidationError
	var validatorErrors validator.ValidationErrors
	if !errors.As(err, &sliceValidatorErrors) && !errors.As(err, &validatorErrors) {
		return false, err
	}

	if validatorErrors != nil {
		sliceValidatorErrors = append(sliceValidatorErrors, validatorErrors)
	}

	var errs SliceValidationError
	for i := range sliceValidatorErrors {
		validatorErrors = nil
		if errors.As(sliceValidatorErrors[i], &validatorErrors) {
			for _, err := range genStructError(validatorErrors.Translate(getTrans(c))) {
				errs = append(errs, err)
			}
		} else {
			errs = append(errs, sliceValidatorErrors[i])
		}
	}

	return true, errs
}

// BindStructAndValid parse and validate parameters in uri
func BindStructAndValid(v interface{}) (bool, error) {
	err := binding.Validator.ValidateStruct(v)
	if err != nil {
		validatorErrors, ok := err.(validator.ValidationErrors)
		if !ok {
			return false, err
		}
		trans, _ := uniTrans.FindTranslator("zh")
		return false, genStructError(validatorErrors.Translate(trans))
	}

	return true, nil
}
