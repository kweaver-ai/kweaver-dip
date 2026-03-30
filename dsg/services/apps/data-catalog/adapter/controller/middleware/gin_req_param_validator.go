package middleware

import (
	"context"
	"errors"
	"reflect"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/trace_util"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

const (
	RequestParamObjectKey = "09_qwerqwer_request_param_object_powierjljg_lk029ujhgf"

	ParamTypeStructTag = "param_type"

	ParamTypeUri   = "uri"
	ParamTypeQuery = "query"
	ParamTypeBody  = "body"

	ParamTypeBodyContentTypeJson = "json"
	ParamTypeBodyContentTypeForm = "form"
)

func GinReqParamValidator[T any]() gin.HandlerFunc {
	return func(c *gin.Context) {
		trace_util.TraceA0R0(c, "request param validation", func(ctx context.Context) {
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
					validatorFunc = form_validator.BindUriAndValid

				case ParamTypeQuery:
					validatorFunc = form_validator.BindQueryAndValid

				case ParamTypeBody:
					if len(p) < 1 {
						p = ParamTypeBodyContentTypeJson
					}

					switch p {
					case ParamTypeBodyContentTypeJson:
						validatorFunc = form_validator.BindJsonAndValid

					case ParamTypeBodyContentTypeForm:
						validatorFunc = form_validator.BindFormAndValid

					default:
						panic("not support param type")
					}

				default:
					panic("not support param type")
				}

				if _, err := validatorFunc(c, fieldValue.Addr().Interface()); err != nil {
					log.WithContext(ctx).Errorf("failed to binding req param, err: %v", err)
					c.Abort()
					form_validator.ReqParamErrorHandle(c, err)
					return
				}
			}

			c.Set(RequestParamObjectKey, value.Addr().Interface())
		})

		c.Next()
	}
}

func GetReqParam[T any](c *gin.Context) (*T, error) {
	value, exists := c.Get(RequestParamObjectKey)
	if !exists {
		log.WithContext(c.Request.Context()).Errorf("ctx not request param object")
		return nil, errors.New("ctx not request param object")
	}

	return value.(*T), nil
}
