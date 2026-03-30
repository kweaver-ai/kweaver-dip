package form_validator

import (
	"context"
	"errors"
	"reflect"
	"strings"

	"github.com/gin-gonic/gin"
	my_errorcode "github.com/kweaver-ai/dsg/services/apps/data-subject/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-subject/common/util"
	"github.com/kweaver-ai/idrm-go-common/errorcode"
	log "github.com/kweaver-ai/idrm-go-frame/core/logx/zapx"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
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
				validatorFunc = BindJsonAndValidV2

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
				ginx.ResBadRequestJson(c, errorcode.Detail(my_errorcode.DataSubjectInvalidParameter, err))
				return nil
			}
			ginx.ResBadRequestJson(c, errorcode.Desc(my_errorcode.DataSubjectRequestParameterError))
			return nil
		}
	}
	return value.Addr().Interface().(*T)
}

func ValidOld[T any](c *gin.Context) {
	util.TraceA0R0(c, func(ctx context.Context) {
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
				c.Abort()
				ReqParamErrorHandle(c, err)
				return
			}
		}

		c.Set(RequestParamObjectKey, value.Addr().Interface())
	})

	c.Next()
}
func GetReqParam[T any](c *gin.Context) (*T, error) {
	value, exists := c.Get(RequestParamObjectKey)
	if !exists {
		log.Errorf("ctx not request param object")
		return nil, errors.New("ctx not request param object")
	}

	return value.(*T), nil
}
