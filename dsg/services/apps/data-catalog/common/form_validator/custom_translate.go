package form_validator

import (
	"fmt"
	"reflect"
	"strings"

	ut "github.com/go-playground/universal-translator"
	"github.com/go-playground/validator/v10"
	"github.com/kweaver-ai/idrm-go-frame/core/enum"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

// EnumTranslation add additional replacement, "{0}的值必须是{1}之一",
func EnumTranslation(tran ut.Translator, fe validator.FieldError) string {
	enumObject := fe.Param()
	all := enum.Values(enumObject)
	params := strings.Join(all, ",")
	t, err := tran.T(fe.Tag(), fe.Field(), params)
	if err != nil {
		fmt.Printf("警告: 翻译字段错误: %s", err)
		return fe.(error).Error()
	}
	return t
}

func uniqueTranslation(tran ut.Translator, fe validator.FieldError) string {
	param := fe.Field()
	for {
		if fe.Value() == nil {
			log.Warnf("warning: error translating FieldError: %s", fe.Error())
			return fe.Error()
		}

		value := reflect.ValueOf(fe.Value())
		if value.Kind() != reflect.Array || value.Kind() != reflect.Slice {
			log.Warnf("warning: error translation FieldError: %s", fe.Error())
			return fe.Error()
		}

		if value.Len() == 0 {
			// no item
			break
		}

		if len(fe.Param()) == 0 {
			// no param
			break
		}

		firstItem := reflect.Indirect(value.Index(0))
		if firstItem.Kind() != reflect.Struct {
			// item no struct
			break
		}

		if fld, ok := firstItem.Type().FieldByName(fe.Param()); ok {
			param = registerTagName(fld)
		}

		break
	}

	msg, err := tran.T(fe.Tag(), param)
	if err != nil {
		log.Warnf("warning: error translating FieldError: %s", err)
		return fe.Error()
	}

	return msg
}
