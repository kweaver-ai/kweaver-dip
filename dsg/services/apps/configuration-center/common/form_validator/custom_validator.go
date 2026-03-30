package form_validator

import (
	"fmt"
	"reflect"
	"regexp"
	"strings"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/constant"

	"github.com/gin-gonic/gin/binding"
	"github.com/go-playground/validator/v10"

	"github.com/kweaver-ai/idrm-go-frame/core/enum"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

type SliceValidationError []error

// Error concatenates all error elements in SliceValidationError into a single string separated by \n.
func (err SliceValidationError) Error() string {
	n := len(err)
	switch n {
	case 0:
		return ""
	default:
		var b strings.Builder
		if err[0] != nil {
			_, _ = fmt.Fprintf(&b, "[%d]: %s", 0, err[0].Error())
		}
		if n > 1 {
			for i := 1; i < n; i++ {
				if err[i] != nil {
					b.WriteString("\n")
					_, _ = fmt.Fprintf(&b, "[%d]: %s", i, err[i].Error())
				}
			}
		}
		return b.String()
	}
}

type customValidator struct {
	Validate *validator.Validate
}

func NewCustomValidator() binding.StructValidator {
	v := validator.New()
	v.SetTagName("binding")
	return &customValidator{
		Validate: v,
	}
}

func (v *customValidator) ValidateStruct(obj any) error {
	if obj == nil {
		return nil
	}

	value := reflect.Indirect(reflect.ValueOf(obj))
	switch value.Kind() {
	case reflect.Struct:
		return v.Validate.Struct(obj)

	case reflect.Slice, reflect.Array:
		count := value.Len()
		validateRet := make(SliceValidationError, 0)
		for i := 0; i < count; i++ {
			itemVal := value.Index(i)
			if itemVal.Kind() != reflect.Ptr && itemVal.CanAddr() {
				itemVal = itemVal.Addr()
			}

			if err := v.ValidateStruct(itemVal.Interface()); err != nil {
				validateRet = append(validateRet, err)
			}
		}

		if len(validateRet) == 0 {
			return nil
		}

		return validateRet

	default:
		return nil
	}
}

func (v *customValidator) Engine() any {
	return v.Validate
}

func VerifyName(fl validator.FieldLevel) bool {
	f := fl.Field().String()
	f = strings.TrimSpace(f)
	fl.Field().SetString(f)
	compile := regexp.MustCompile("^[a-zA-Z0-9\u4e00-\u9fa5-_]+$")
	if !compile.Match([]byte(f)) {
		return false
	}

	return true
}
func VerifyNameReduceSpace(fl validator.FieldLevel) bool {
	f := fl.Field().String()

	f = strings.TrimSpace(f)
	fl.Field().SetString(f)

	compile := regexp.MustCompile("^[a-zA-Z0-9\u4e00-\u9fa5-_]+$")
	if !compile.Match([]byte(f)) {
		return false
	}

	return true
}

func VerifyName255(fl validator.FieldLevel) bool {
	f := fl.Field().String()
	f = strings.TrimSpace(f)
	fl.Field().SetString(f)
	if len([]rune(f)) > 255 {
		return false
	}
	compile := regexp.MustCompile("^[a-zA-Z0-9\u4e00-\u9fa5-_]+$")
	return compile.Match([]byte(f))
}

func VerifyNameStandard(fl validator.FieldLevel) bool {
	f := fl.Field().String()

	f = strings.TrimSpace(f)
	//if strings.HasPrefix(f, "-") || strings.HasPrefix(f, "_") {
	//	return false
	//}
	fl.Field().SetString(f)
	if len([]rune(f)) > 128 {
		return false
	}
	compile := regexp.MustCompile("^[a-zA-Z0-9\u4e00-\u9fa5-_]*$")
	return compile.Match([]byte(f))
}

func VerifyUniformCreditCode(fl validator.FieldLevel) bool {
	f := fl.Field().String()
	f = strings.TrimSpace(f)
	fl.Field().SetString(f)
	//  ^[^_IOZSVa-z\W]{2}\d{6}[^_IOZSVa-z\W]{10}$
	if len([]rune(f)) == 0 {
		return true
	}
	compile := regexp.MustCompile("^([0-9A-HJ-NPQRTUWXY]{2}\\d{6}[0-9A-HJ-NPQRTUWXY]{10}|[1-9]\\d{14})$")
	return compile.Match([]byte(f))
}

func VerifyFirmUniformCreditCode(fl validator.FieldLevel) bool {
	f := fl.Field().String()
	f = strings.TrimSpace(f)
	fl.Field().SetString(f)
	//  ^[^_IOZSVa-z\W]{2}\d{6}[^_IOZSVa-z\W]{10}$
	if len([]rune(f)) != 15 && len([]rune(f)) != 18 {
		return false
	}
	compile := regexp.MustCompile("^[0-9A-HJ-NPQRTUW-Y]{15}$|^[0-9A-HJ-NPQRTUW-Y]{18}$")
	return compile.Match([]byte(f))
}

func VerifyPhoneNumber(fl validator.FieldLevel) bool {
	f := fl.Field().String()
	f = strings.TrimSpace(f)
	fl.Field().SetString(f)
	if len([]rune(f)) == 0 {
		return true
	}
	if len([]rune(f)) < 3 || len([]rune(f)) > 20 {
		return false
	}
	compile := regexp.MustCompile("^([0-9-+])*$")
	return compile.Match([]byte(f))
}

func VerifyDescription(fl validator.FieldLevel) bool {
	f := fl.Field().String()
	f = strings.TrimSpace(f)
	fl.Field().SetString(f)
	compile := regexp.MustCompile("^[!-~a-zA-Z0-9_\u4e00-\u9fa5 ！￥……（）——“”：；，。？、‘’《》｛｝【】·\\s]*$")
	if !compile.Match([]byte(f)) {
		return false
	}

	return true
}

func VerifyDescriptionReduceSpace(fl validator.FieldLevel) bool {
	f := fl.Field().String()

	f = strings.TrimSpace(f)
	fl.Field().SetString(f)

	compile := regexp.MustCompile("^[!-~a-zA-Z0-9_\u4e00-\u9fa5 ！￥……（）——“”：；，。？、‘’《》｛｝【】·\\s]*$")
	if !compile.Match([]byte(f)) {
		return false
	}

	return true
}

// VerifySpecialCharacters 检测字符串中是否包含指定字符
func VerifySpecialCharacters(fl validator.FieldLevel) bool {
	spcChar := []string{`,`, `?`, `*`, `|`, `{`, `}`, `\`, `/`, `$`, `、`, `·`, "`", `'`, `"`, `#`, `!`, `^`}
	f := fl.Field().String()
	return !strings.ContainsAny(f, strings.Join(spcChar, "")) && len(f) > 1
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

func validColor(fl validator.FieldLevel) bool {
	f := fl.Field().String()
	return constant.ValidColor(f)
}

func validIcon(fl validator.FieldLevel) bool {
	f := fl.Field().String()
	return constant.ValidIcon(f)
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
		if constant.ValidTaskTypeString(arr[i]) {
			return false
		}
		return false
	}
	f = strings.Join(arr, ",")
	fl.Field().SetString(f)
	return true
}

func VerifyMultiObjectType(fl validator.FieldLevel) bool {
	f := fl.Field().String()
	f = strings.TrimSpace(f)
	fl.Field().SetString(f)
	if f == "" {
		return true
	}

	arr := strings.Split(f, ",")
	for i := 0; i < len(arr); i++ {
		arr[i] = strings.TrimSpace(arr[i])
		if _, ok := constant.ObjectTypeStringToObjectType[constant.ObjectTypeString(arr[i])]; !ok {
			return false
		}
	}
	f = strings.Join(arr, ",")
	fl.Field().SetString(f)
	return true
}
func VerifyBase64(fl validator.FieldLevel) bool {
	f := fl.Field().String()
	f = strings.TrimSpace(f)
	fl.Field().SetString(f)
	compile := regexp.MustCompile("^[a-zA-Z0-9+/]*=*$")
	if !compile.Match([]byte(f)) {
		return false
	}
	return true
}

func VerifyHost(fl validator.FieldLevel) bool {
	f := fl.Field().String()
	if regexp.MustCompile("^[0-9a-zA-Z\\n\\n]([-.\\\\w]*[0-9a-zA-Z])*$").Match([]byte(f)) {
		return true //url
	}
	if regexp.MustCompile("^(?:(?:1[0-9][0-9]\\\\.)|(?:2[0-4][0-9]\\\\.)|(?:25[0-5]\\\\.)|(?:[1-9][0-9]\\\\.)|(?:[0-9]\\\\.)){3}(?:(?:1[0-9][0-9])|(?:2[0-4][0-9])|(?:25[0-5])|(?:[1-9][0-9])|(?:[0-9]))").Match([]byte(f)) {
		return true //ipv4
	}
	if regexp.MustCompile("\\b(?:[a-fA-F0-9]{1,4}:){7}[a-fA-F0-9]{1,4}\\b").Match([]byte(f)) {
		return true //ipv6
	}
	return false
}
func VerifyHostSimple(fl validator.FieldLevel) bool {
	f := fl.Field().String()
	f = strings.TrimSpace(f)
	fl.Field().SetString(f)
	if regexp.MustCompile("^[a-zA-Z0-9.:]*$").Match([]byte(f)) {
		return true
	}
	return false
}

func VerifyObjectName(fl validator.FieldLevel) bool {
	f := fl.Field().String()
	f = strings.TrimSpace(f)
	fl.Field().SetString(f)
	if len([]rune(f)) > 128 {
		return false
	}
	compile := regexp.MustCompile("^[^\\\\/:*?\"|]*$")
	return compile.Match([]byte(f))
}

func VerifyObjectName255(fl validator.FieldLevel) bool {
	f := fl.Field().String()
	f = strings.TrimSpace(f)
	fl.Field().SetString(f)
	if len([]rune(f)) > 255 {
		return false
	}
	compile := regexp.MustCompile("^[^\\\\/:*?\"|]*$")
	return compile.Match([]byte(f))
}

func verifyEnum(fl validator.FieldLevel) bool {
	params := fl.Param()
	value := fl.Field().String()
	if params == "" {
		panic("empty validator parameter")
	}
	ps := strings.Split(params, " ")
	if len(ps) > 2 {
		panic("invalid validator parameter number")
	}
	//获取是否可以为空参数
	canEmpty := ""
	if len(ps) == 2 {
		canEmpty = ps[1]
	}
	//可以为空，返回正确
	if canEmpty == "noChar" && value == "" {
		return true
	}
	if canEmpty != "noChar" && value == "" {
		return false
	}
	//正式判断是否是正确的枚举
	objectName := ps[0]
	all := enum.Values(objectName)
	if len(all) <= 0 {
		panic(fmt.Sprintf("valid validator enum type:%v", objectName))
	}
	for _, obj := range all {
		if value == obj {
			return true
		}
	}
	return false
}

func VerifyEmail(fl validator.FieldLevel) bool {
	f := fl.Field().String()
	f = strings.TrimSpace(f)
	fl.Field().SetString(f)
	if len([]rune(f)) == 0 {
		return true
	}
	// 邮箱长度限制
	if len([]rune(f)) < 5 || len([]rune(f)) > 128 {
		return false
	}
	// 正则表达式匹配邮箱格式
	compile := regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)
	return compile.Match([]byte(f))
}

// verifyAuditType
func verifyAuditType(fl validator.FieldLevel) bool {
	f := fl.Field().String()
	f = strings.TrimSpace(f)
	fl.Field().SetString(f)
	if f == "" {
		return true
	}
	if !enum.Is[constant.AuditType](f) {
		return false
	}
	return true
}
