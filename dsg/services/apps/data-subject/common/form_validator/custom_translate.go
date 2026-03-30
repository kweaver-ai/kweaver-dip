package form_validator

import (
	"fmt"
	"strings"

	ut "github.com/go-playground/universal-translator"
	"github.com/go-playground/validator/v10"
	"github.com/kweaver-ai/idrm-go-frame/core/enum"
)

// maxLenTranslation add additional replacement, "{0}的长度必须不超过{1}",
func maxLenTranslation(tran ut.Translator, fe validator.FieldError) string {
	t, err := tran.T(fe.Tag(), fe.Field(), fe.Param())
	if err != nil {
		fmt.Printf("警告: 翻译字段错误: %s", err)
		return fe.(error).Error()
	}
	return t
}

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
