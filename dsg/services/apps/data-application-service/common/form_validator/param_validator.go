package form_validator

import (
	"errors"
	"reflect"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/idrm-go-common/errorcode"
	log "github.com/kweaver-ai/idrm-go-frame/core/logx/zapx"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

const (
	ParamTypeStructTag = "param_type"

	ParamTypeUri   = "path"
	ParamTypeQuery = "query"
	ParamTypeBody  = "body"

	ParamTypeBodyContentTypeJson = "json"
	ParamTypeBodyContentTypeForm = "form"
)

func Valid[T any](c *gin.Context) *T {
	t := new(T)
	value := reflect.ValueOf(t)

	for value.Kind() == reflect.Pointer {
		if value.IsNil() {
			value = reflect.New(value.Elem().Type())
		}

		value = value.Elem()
	}

	if value.Kind() != reflect.Struct {
		panic("req param T must struct")
	}

	typ := value.Type()
	for i := 0; i < typ.NumField(); i++ {
		fieldType := typ.Field(i)
		fieldValue := value.Field(i)

		if !fieldType.Anonymous {
			continue
		}

		if fieldValue.Kind() != reflect.Struct {
			panic("struct field must struct")
		}

		paramType := fieldType.Tag.Get(ParamTypeStructTag)
		if len(paramType) < 1 {
			continue
		}

		idx := strings.Index(paramType, "=")
		var p string
		if idx > 0 {
			p = paramType[idx+1:]
			paramType = paramType[:idx]
		}

		var validatorFunc func(c *gin.Context, v interface{}) (bool, error)
		switch paramType {
		case ParamTypeUri:
			validatorFunc = BindUriAndValid

		case ParamTypeQuery:
			validatorFunc = BindQueryAndValid

		case ParamTypeBody:
			if len(p) < 1 {
				p = ParamTypeBodyContentTypeJson
			}

			switch p {
			case ParamTypeBodyContentTypeJson:
				validatorFunc = BindJsonAndValid

			case ParamTypeBodyContentTypeForm:
				validatorFunc = BindFormAndValid

			default:
				panic("not support param type")
			}

		default:
			panic("not support param type")
		}

		if _, err := validatorFunc(c, fieldValue.Addr().Interface()); err != nil {
			log.Errorf("failed to binding req param, err: %v", err)
			if errors.As(err, &ValidErrors{}) {
				ginx.ResBadRequestJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
				return nil
			}
			ginx.ResBadRequestJson(c, errorcode.Desc(errorcode.PublicInvalidParameterJson))
			return nil
		}
	}
	return value.Addr().Interface().(*T)
}
