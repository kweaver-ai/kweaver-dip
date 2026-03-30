package form_validator

import (
	"fmt"
	"reflect"
	"regexp"
	"strings"
	"time"
	"unicode/utf8"

	validator "github.com/go-playground/validator/v10"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/util"
	"github.com/kweaver-ai/dsg/services/apps/task_center/domain/tenant_application"
	"github.com/kweaver-ai/idrm-go-frame/core/enum"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

// maxLen max size verify for string
func maxLen(fl validator.FieldLevel) bool {
	field := fl.Field()
	param := fl.Param()

	length := util.AsInt(param)
	if length <= 0 {
		panic(fmt.Errorf("invalid len %d", length))
	}

	switch field.Kind() {
	case reflect.String:
		return int64(utf8.RuneCountInString(field.String())) <= length
	case reflect.Slice, reflect.Map, reflect.Array:
		return int64(field.Len()) <= length
	default:
		panic(fmt.Errorf("invalid type %v", field.Kind()))
	}
}

// verifyName Must Have
func verifyName(fl validator.FieldLevel) bool {
	f := fl.Field().String()
	f = strings.TrimSpace(f)
	fl.Field().SetString(f)

	if len([]rune(f)) > 128 {
		return false
	}
	compile := regexp.MustCompile("^[a-zA-Z0-9\u4e00-\u9fa5-_]+$")
	return compile.Match([]byte(f))
}

// verifyNameNotRequired not required
func verifyNameNotRequired(fl validator.FieldLevel) bool {
	f := fl.Field().String()
	f = strings.TrimSpace(f)
	fl.Field().SetString(f)

	if len([]rune(f)) > 128 {
		return false
	}
	compile := regexp.MustCompile("^[a-zA-Z0-9\u4e00-\u9fa5-_]*$")
	return compile.Match([]byte(f))
}

// verifyNameTask Must Have
func verifyNameTask(fl validator.FieldLevel) bool {
	f := fl.Field().String()
	f = strings.TrimSpace(f)
	fl.Field().SetString(f)

	if len([]rune(f)) > 32 {
		return false
	}
	compile := regexp.MustCompile("^[a-zA-Z0-9\u4e00-\u9fa5-_]*$")
	return compile.Match([]byte(f))
}

func trimSpace(fl validator.FieldLevel) bool {
	value := fl.Field()
	if value.Kind() == reflect.Ptr {
		if value.IsNil() {
			// is nil, no validate
			return true
		}

		value = value.Elem()
	}

	if value.Kind() != reflect.String {
		log.Warnf("field type not is string, kind: [%v]", value.Kind())
		return true
	}

	if !value.CanSet() {
		log.Warnf("field not can set, struct name: [%v], field name: [%v]", fl.Top().Type().Name(), fl.StructFieldName())
		return false
	}

	value.SetString(strings.TrimSpace(value.String()))

	return true
}

//func verifyNameEn255(fl validator.FieldLevel) bool {
//	f := fl.Field().String()
//	f = strings.TrimSpace(f)
//	if len([]rune(f)) > 255 {
//		return false
//	}
//	compile := regexp.MustCompile("^[a-zA-Z0-9-_]+$")
//	if !compile.Match([]byte(f)) {
//		return false
//	}
//	fl.Field().SetString(f)
//	return true
//}
//func verifyNameEN(fl validator.FieldLevel) bool {
//	f := fl.Field().String()
//	if f == "" {
//		return true //Not required
//	}
//	f = strings.TrimSpace(f)
//	if len([]rune(f)) > 128 {
//		return false
//	}
//	compile := regexp.MustCompile("^[a-zA-Z0-9_]+$")
//	if !compile.Match([]byte(f)) {
//		return false
//	}
//	fl.Field().SetString(f)
//	return true
//}

//// verifyDescription128  allow multi spaces
//func verifyDescription128(fl validator.FieldLevel) bool {
//	//can be empty
//	f := fl.Field().String()
//	f = strings.TrimSpace(f)
//	if len([]rune(f)) > 128 {
//		return false
//	}
//	compile := regexp.MustCompile("^[!-~a-zA-Z0-9_\u4e00-\u9fa5 ！￥……（）——“”：；，。？、‘’《》｛｝【】·\\s]*$")
//	if !compile.Match([]byte(f)) {
//		return false
//	}
//	fl.Field().SetString(f)
//	return true
//}

// verifyDescription255  allow multi spaces
func verifyDescription255(fl validator.FieldLevel) bool {
	//can be empty
	f := fl.Field().String()
	f = strings.TrimSpace(f)
	if len([]rune(f)) > 255 {
		return false
	}
	compile := regexp.MustCompile("^[!-~a-zA-Z0-9_\u4e00-\u9fa5 ！￥……（）——“”：；，。？、‘’《》｛｝【】·\\s]*$")
	if !compile.Match([]byte(f)) {
		return false
	}
	fl.Field().SetString(f)
	return true
}

//// verifyDescription255Must Not allow space/multi spaces
//func verifyDescription255Must(fl validator.FieldLevel) bool {
//	// must have
//	f := fl.Field().String()
//	f = strings.TrimSpace(f)
//	if len([]rune(f)) > 255 {
//		return false
//	}
//	compile := regexp.MustCompile("^[!-~a-zA-Z0-9_\u4e00-\u9fa5 ！￥……（）——“”：；，。？、‘’《》｛｝【】·\\s]+$")
//	if !compile.Match([]byte(f)) {
//		return false
//	}
//	fl.Field().SetString(f)
//	return true
//}

// verifyMultiStatus
func verifyMultiStatus(fl validator.FieldLevel) bool {

	f := fl.Field().String()
	f = strings.TrimSpace(f)
	fl.Field().SetString(f)
	if f == "" {
		return true
	}

	arr := strings.Split(f, ",")
	for i := 0; i < len(arr); i++ {
		arr[i] = strings.TrimSpace(arr[i])
		if !enum.Is[constant.CommonStatus](arr[i]) {
			return false
		}
	}
	f = strings.Join(arr, ",")
	fl.Field().SetString(f)
	return true
}

// verifyMultiTaskType
func verifyMultiTaskType(fl validator.FieldLevel) bool {

	f := fl.Field().String()
	f = strings.TrimSpace(f)
	fl.Field().SetString(f)
	if f == "" {
		return true
	}

	arr := strings.Split(f, ",")
	for i := 0; i < len(arr); i++ {
		arr[i] = strings.TrimSpace(arr[i])
		if !enum.Is[constant.TaskType](arr[i]) {
			return false
		}
	}
	f = strings.Join(arr, ",")
	fl.Field().SetString(f)
	return true
}

// verifyTaskType
func verifyTaskType(fl validator.FieldLevel) bool {
	f := fl.Field().String()
	f = strings.TrimSpace(f)
	fl.Field().SetString(f)
	if f == "" {
		return true
	}
	if !enum.Is[constant.TaskType](f) {
		return false
	}
	return true
}

// verifyMultiPriority
func verifyMultiPriority(fl validator.FieldLevel) bool {
	f := fl.Field().String()
	f = strings.TrimSpace(f)
	fl.Field().SetString(f)
	if f == "" {
		return true
	}

	arr := strings.Split(f, ",")
	for i := 0; i < len(arr); i++ {
		arr[i] = strings.TrimSpace(arr[i])
		if !enum.Is[constant.CommonPriority](arr[i]) {
			return false
		}
	}
	f = strings.Join(arr, ",")
	fl.Field().SetString(f)
	return true
}

func verifyDeadline(fl validator.FieldLevel) bool {
	f := fl.Field().Int()
	if f == 0 {
		return true
	}
	now := time.Now().Unix()
	return f > now
}
func verifyMultiUuid(fl validator.FieldLevel) bool {
	f := fl.Field().String()
	f = strings.TrimSpace(f)
	fl.Field().SetString(f)
	if f == "" {
		return true
	}

	uUIDRegexString := "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"
	regexPattern := regexp.MustCompile(uUIDRegexString)

	arr := strings.Split(f, ",")
	for i := 0; i < len(arr); i++ {
		arr[i] = strings.TrimSpace(arr[i])
		if !regexPattern.MatchString(arr[i]) {
			return false
		}
	}
	f = strings.Join(arr, ",")
	fl.Field().SetString(f)
	return true
}
func verifyUuidNotRequired(fl validator.FieldLevel) bool {
	f := fl.Field().String()
	f = strings.TrimSpace(f)
	fl.Field().SetString(f)
	if f == "" {
		return true
	}

	uUIDRegexString := "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"
	regexPattern := regexp.MustCompile(uUIDRegexString)

	strings.TrimSpace(f)
	if !regexPattern.MatchString(f) {
		return false
	}
	return true
}

func CheckKeyWord(keyword *string) bool {
	*keyword = strings.TrimSpace(*keyword)
	if len([]rune(*keyword)) > 128 {
		return false
	}
	return regexp.MustCompile("^[a-zA-Z0-9\u4e00-\u9fa5-_]*$").Match([]byte(*keyword))
}

func CheckKeyWord32(keyword *string) bool {
	*keyword = strings.TrimSpace(*keyword)
	if len([]rune(*keyword)) > 32 {
		return false
	}
	return regexp.MustCompile("^[a-zA-Z0-9\u4e00-\u9fa5-_]*$").Match([]byte(*keyword))
}

func VerifyXssString(fl validator.FieldLevel) bool {
	// can be empty
	f := fl.Field().String()
	f = strings.TrimSpace(f)
	f = util.XssEscape(f)
	fl.Field().SetString(f)
	return true
}

func VerifyPhone(fl validator.FieldLevel) bool {
	f := fl.Field().String()
	if f == "" {
		return true
	}
	compile := regexp.MustCompile("^[0-9-\\+]{3,20}$")
	if !compile.Match([]byte(f)) {
		return false
	}

	return true
}

func VerifyTenantApplicationDataAccountList(fl validator.FieldLevel) bool {
	data := fl.Top().Interface().(*tenant_application.TenantApplicationCreateReq)
	if data.SubmitType == "submit" {
		return len(data.DatabaseAccountList) > 0
	}
	return true
}

func VerifyTenantApplicationDataAccountUpdateList(fl validator.FieldLevel) bool {
	data := fl.Top().Interface().(*tenant_application.TenantApplicationUpdateReq)
	if data.SubmitType == "submit" {
		return len(data.DatabaseAccountList) > 0
	}
	return true
}
