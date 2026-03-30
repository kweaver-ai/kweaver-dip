package form_validator

import (
	"encoding/json"
	"fmt"
	"mime/multipart"
	"net/url"
	"reflect"
	"strings"

	"github.com/jinzhu/copier"
	"github.com/kweaver-ai/dsg/services/apps/session/common/units"

	"github.com/gin-gonic/gin"
	"github.com/gin-gonic/gin/binding"
	val "github.com/go-playground/validator/v10"
)

type ValidError struct {
	Key     string
	Message string
}

type ValidErrors []*ValidError

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
func BindAndValid(c *gin.Context, v interface{}) (bool, ValidErrors) {
	var errs ValidErrors
	err := c.ShouldBind(v)
	if err != nil {
		verrs, ok := err.(val.ValidationErrors)
		if !ok {
			return false, errs
		}
		return false, genStructError(verrs.Translate(Trans))
	}
	return true, nil
}

// BindFormAndValid parse and validate parameters in form-data
func BindFormAndValid(c *gin.Context, v interface{}) (bool, error) {
	c.Request.ParseForm()
	values := c.Request.PostForm
	if values == nil {
		values = make(url.Values)
	}
	addPathValue(c, values)
	errs := BindFromRequest(values, v)
	if errs != nil {
		return false, errs
	}
	err := Validator.ValidateStruct(v)
	if err != nil {
		validatorErrors, ok := err.(val.ValidationErrors)
		if !ok {
			return false, err
		}
		return false, genStructError(validatorErrors.Translate(Trans))
	}
	return true, nil
}

// BindFormDataAndValid parse and validate parameters in formData
func BindFormDataAndValid(c *gin.Context, v interface{}) (bool, error) {
	values := make(url.Values)
	multiForm, err1 := c.MultipartForm()
	if err1 == nil && multiForm != nil {
		for k, vs := range multiForm.Value {
			values[k] = vs
		}
		// add multipartFile
		for key, fileHeader := range multiForm.File {
			header := new(multipart.FileHeader)
			copier.Copy(header, fileHeader[0])
			values[key] = []string{fmt.Sprintf("%p", header)}
		}
	}
	addPathValue(c, values)
	errs := BindFromRequest(values, v)
	if errs != nil {
		return false, errs
	}
	err := Validator.ValidateStruct(v)
	if err != nil {
		validatorErrors, ok := err.(val.ValidationErrors)
		if !ok {
			return false, err
		}
		return false, genStructError(validatorErrors.Translate(Trans))
	}
	return true, nil
}

// BindQueryAndValid parse and validate parameters in query
func BindQueryAndValid(c *gin.Context, v interface{}) (bool, error) {
	values := c.Request.URL.Query()
	if values == nil {
		values = make(url.Values)
	}
	addPathValue(c, values)
	errs := BindFromRequest(values, v)
	if errs != nil {
		return false, errs
	}
	err := Validator.ValidateStruct(v)
	if err != nil {
		validatorErrors, ok := err.(val.ValidationErrors)
		if !ok {
			return false, err
		}
		return false, genStructError(validatorErrors.Translate(Trans))
	}
	return true, nil
}

// BindUriAndValid parse and validate parameters in uri
func BindUriAndValid(c *gin.Context, v interface{}) (bool, error) {
	err := c.ShouldBindUri(v)
	if err != nil {
		validatorErrors, ok := err.(val.ValidationErrors)
		if !ok {
			return false, err
		}

		return false, genStructError(validatorErrors.Translate(Trans))
	}

	return true, nil
}

func BindJsonAndValid(c *gin.Context, v interface{}) (bool, error) {
	values := c.Request.URL.Query()
	if values == nil {
		values = make(url.Values)
	}
	addPathValue(c, values)
	errs := BindFromRequest(values, v)
	if errs != nil {
		return false, errs
	}
	err := c.ShouldBindBodyWith(v, binding.JSON)
	if err != nil {
		if validatorErrors, ok := err.(val.ValidationErrors); ok {
			return false, genStructError(validatorErrors.Translate(Trans))
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

func ValidateStruct(v any) (bool, ValidErrors) {
	var errs ValidErrors
	err := Validator.ValidateStruct(v)
	if err != nil {
		validatorErrors, ok := err.(val.ValidationErrors)
		if !ok {
			return false, errs
		}
		return false, genStructError(validatorErrors.Translate(Trans))
	}
	return true, nil
}

// BindFromRequest  validate input from request,
// values: url.Values =>  from request.Form, request.url.query, c.param
// v     : receiver pointer
func BindFromRequest(values url.Values, v any) ValidErrors {
	var validErrors ValidErrors

	rType := reflect.TypeOf(v)
	vType := reflect.ValueOf(v)
	if rType.Kind() != reflect.Struct {
		rType = rType.Elem()
		vType = vType.Elem()
	}
	filedNum := rType.NumField()
	for i := 0; i < filedNum; i++ {
		typeField := rType.Field(i)
		valueField := vType.Field(i)
		if valueField.Kind() == reflect.Struct {
			subFieldNum := typeField.Type.NumField()
			for j := 0; j < subFieldNum; j++ {
				subTypeField := typeField.Type.Field(j)
				subValueField := valueField.Field(j)
				errs := bindField(subTypeField, subValueField, values)
				if errs != nil {
					validErrors = append(validErrors, errs...)
				}
			}
		} else {
			errs := bindField(typeField, valueField, values)
			if errs != nil {
				validErrors = append(validErrors, errs...)
			}
		}

	}
	return validErrors
}

func bindField(typeField reflect.StructField, valueField reflect.Value, values url.Values) ValidErrors {
	formTag := typeField.Tag.Get("form")
	vs := strings.Split(formTag, ",")
	vsLen := len(vs)
	if vsLen > 2 {
		panic(fmt.Sprintf("invalid validate syntax %s", formTag))
	}
	if vs[vsLen-1] == "omitempty" || vs[vsLen-1] == "-" {
		return nil
	}
	name := typeField.Name
	if len(vs) <= 2 && vs[0] != "" {
		name = vs[0]
	}
	value := values.Get(name)
	if value == "" {
		if len(vs) == 2 {
			value = strings.TrimPrefix(vs[1], "default=")
		}
	}
	if value == "" {
		return nil
	}
	err := units.SetWithProperType(value, valueField, typeField)
	if err == nil {
		return nil
	}
	var validErrors ValidErrors
	validErrors = append(validErrors, &ValidError{
		Key:     name,
		Message: "请输入符合要求的数据类型和数据范围",
	})
	return validErrors
}

func addPathValue(c *gin.Context, values url.Values) {
	for _, param := range c.Params {
		values.Set(param.Key, param.Value)
	}
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

// genPropValidError gen single ValidError for property 'prop'
func genPropValidError(fields map[string]string, prop string) ValidErrors {
	var errs ValidErrors
	for _, err := range fields {
		errs = append(errs, &ValidError{
			Key:     prop,
			Message: err,
		})
	}
	return errs
}
