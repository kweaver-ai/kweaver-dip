package form_validator

import (
	"encoding/json"
	"fmt"
	"net/url"
	"reflect"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/gin-gonic/gin/binding"
	val "github.com/go-playground/validator/v10"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/util"
)

// BindJsonAndValid 请换一种方法 => BindJsonAndValidV2
func BindJsonAndValid(c *gin.Context, v interface{}) (bool, error) {
	//_, span := ar_trace.Tracer.Start(c, "BindJsonAndValid")

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
	err := util.SetWithProperType(value, valueField, typeField)
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
