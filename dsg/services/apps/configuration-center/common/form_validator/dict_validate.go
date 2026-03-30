package form_validator

import (
	"fmt"
	"regexp"

	domain "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/dict"
)

// 不是整数类型的类型和正则表达式
func getNotNumDictTypeRegex(dataType string) string {
	dictTypeRegex := map[string]string{
		"data-processing":  "^[0-9a-zA-Z]+$", //字符串（数字或字母）
		"field-type":       "^[0-9]+$",       //字符串（数字）
		"org-code":         "^[0-9a-zA-Z]+$", //字符串（数字或字母）
		"division-code":    "^[0-9]+$",       //字符串（数字）
		"center-dept-code": "^[0-9]+$",       //字符串（数字）
		"catalog-tag":      "^[0-9]+$",       //字符串（数字）
		"system-class":     "^[0-9]+$",       //字符串（数字）
		"schedule-type":    "^[0-9a-zA-Z]+$", //字符串（数字或字母）
	}
	return dictTypeRegex[dataType]
}

func getNotNumDictTypeRegexDisplay(dataType string) string {
	dictTypeRegex := map[string]string{
		"data-processing":  "该类型只能输入数字或字母", //字符串（数字或字母）
		"field-type":       "该类型只能输入数字",    //字符串（数字）
		"org-code":         "该类型只能输入数字或字母", //字符串（数字或字母）
		"division-code":    "该类型只能输入数字",    //字符串（数字）
		"center-dept-code": "该类型只能输入数字",    //字符串（数字）
		"catalog-tag":      "该类型只能输入数字",    //字符串（数字）
		"system-class":     "该类型只能输入数字",    //字符串（数字）
		"schedule-type":    "该类型只能输入数字或字母", //字符串（数字或字母）
	}
	return dictTypeRegex[dataType]
}

func GetDictTypeRegex(dataType string) string {
	dictTypeRegex := getNotNumDictTypeRegex(dataType)
	if dictTypeRegex == "" { //默认数字或字母正则表达式
		dictTypeRegex = "^[0-9a-zA-Z]+$"
	}
	return dictTypeRegex
}

func GetDictTypeRegexDisplay(dataType string) string {
	display := getNotNumDictTypeRegexDisplay(dataType)
	if display == "" { //默认整数正则表达式
		display = "该类型只能输入数字和字母"
	}
	return display
}

func GetDictTypeValidate(dataType string, dictKeys []string) (bool, error) {
	if dictKeys == nil || len(dictKeys) == 0 { //空值放行
		return true, nil
	}
	regex := GetDictTypeRegex(dataType)
	var validErrors ValidErrors
	for _, key := range dictKeys {
		matched, err := regexp.MatchString(regex, key)
		if err != nil {
			return false, err
		}
		if !matched {
			validErrors = append(validErrors, &ValidError{
				//Key:     "dict_check_type_key_error_" + dataType,
				Message: fmt.Sprintf("值:%s,%s;", key, GetDictTypeRegexDisplay(dataType)),
			})
		}
	}
	if validErrors != nil || len(validErrors) > 0 {
		return false, validErrors
	}
	return true, nil
}

func GetDictTypeValidateArray(dictTypeKeys []*domain.DictTypeKey) (bool, error) {
	var validErrors ValidErrors
	if dictTypeKeys == nil || len(dictTypeKeys) == 0 {
		validErrors = append(validErrors, &ValidError{
			Key:     "dict_check_type_key_error",
			Message: "请求字典类型和值不能为空",
		})
		return false, validErrors
	}
	for _, dictTypeKey := range dictTypeKeys {
		regex := GetDictTypeRegex(dictTypeKey.DictType)
		matched, err := regexp.MatchString(regex, dictTypeKey.DictKey)
		if err != nil {
			return false, err
		}
		if !matched {
			validErrors = append(validErrors, &ValidError{
				Key:     "dict_check_type_key_error_" + dictTypeKey.DictType,
				Message: fmt.Sprintf("类型%s值%s,%s", dictTypeKey.DictType, dictTypeKey.DictKey, GetDictTypeRegexDisplay(dictTypeKey.DictType)),
			})
		}
	}
	if validErrors != nil || len(validErrors) > 0 {
		return false, validErrors
	}
	return true, nil
}
