package form_validator

import (
	"fmt"
	"net"
	"net/url"
	"reflect"
	"regexp"
	"strings"

	"github.com/gin-gonic/gin/binding"
	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"

	auth_service "github.com/kweaver-ai/idrm-go-common/api/auth-service/v1"
	"github.com/kweaver-ai/idrm-go-common/util/sets"
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

func VerifyNumeric(fl validator.FieldLevel) bool {
	f := fl.Field().String()

	compile := regexp.MustCompile("^[1-9][0-9]*$")
	if !compile.Match([]byte(f)) {
		return false
	}

	return true
}

func URL(fl validator.FieldLevel) bool {
	f := fl.Field().String()
	if strings.Contains(f, " ") {
		return false
	}

	compile := regexp.MustCompile("^/[!-~]*$")
	if !compile.Match([]byte(f)) {
		return false
	}

	return true
}

func HOST(fl validator.FieldLevel) bool {
	f := fl.Field().String()
	if strings.Contains(f, " ") {
		return false
	}

	if !strings.HasPrefix(f, "http://") && !strings.HasPrefix(f, "https://") {
		return false
	}

	parse, err := url.Parse(f)
	if err != nil {
		return false
	}

	//if parse.Path != "" || parse.RawQuery != "" {
	//	return false
	//}

	//port := parse.Port()
	//if port != "" {
	//	p, err := strconv.Atoi(port)
	//	if err != nil {
	//		return false
	//	}
	//
	//	if p > 65535 {
	//		return false
	//	}
	//}

	host := parse.Hostname()

	domain := regexp.MustCompile(`^[a-zA-Z0-9][-.a-zA-Z0-9]*$`)
	ip := net.ParseIP(host)

	if !domain.Match([]byte(host)) && ip == nil {
		return false
	}

	return true
}

func PHONE(fl validator.FieldLevel) bool {
	f := fl.Field().String()
	if strings.Contains(f, " ") {
		return false
	}

	compile := regexp.MustCompile("^1[3456789]\\d{9}$")
	if !compile.Match([]byte(f)) {
		return false
	}

	return true
}

func ServiceName(fl validator.FieldLevel) bool {
	f := fl.Field().String()
	f = strings.TrimSpace(f)
	fl.Field().SetString(f)
	if len([]rune(f)) > 128 {
		return false
	}

	compile := regexp.MustCompile("^[a-zA-Z0-9\u4e00-\u9fa5]*$")
	if !compile.Match([]byte(f)) {
		return false
	}

	return true
}

func VerifyName(fl validator.FieldLevel) bool {
	f := fl.Field().String()
	f = strings.TrimSpace(f)
	fl.Field().SetString(f)
	if len([]rune(f)) > 128 {
		return false
	}

	compile := regexp.MustCompile("^[a-zA-Z0-9\u4e00-\u9fa5-_]*$")
	if !compile.Match([]byte(f)) {
		return false
	}

	return true
}

func VerifyNameEn(fl validator.FieldLevel) bool {
	f := fl.Field().String()
	f = strings.TrimSpace(f)
	fl.Field().SetString(f)
	if len([]rune(f)) > 128 {
		return false
	}

	compile := regexp.MustCompile("^[a-zA-Z0-9-_]*$")
	if !compile.Match([]byte(f)) {
		return false
	}

	return true
}

func VerifyDataType(fl validator.FieldLevel) bool {
	f := fl.Field().String()
	f = strings.TrimSpace(f)
	fl.Field().SetString(f)
	if len([]rune(f)) > 128 {
		return false
	}

	compile := regexp.MustCompile("^[a-zA-Z0-9()]+$")
	if !compile.Match([]byte(f)) {
		return false
	}

	return true
}

// nameStandardRegexp 匹配英文，数字，连字符，中划线，下划线，中文，全角括号
var nameStandardRegexp = regexp.MustCompile("^[a-zA-Z0-9\u4e00-\u9fa5\uff08-\uff09-_]*$")

func VerifyNameStandard(fl validator.FieldLevel) bool {
	return nameStandardRegexp.MatchString(fl.Field().String())
}

func VerifyUniformCreditCode(fl validator.FieldLevel) bool {
	f := fl.Field().String()
	fl.Field().SetString(f)
	//  ^[^_IOZSVa-z\W]{2}\d{6}[^_IOZSVa-z\W]{10}$
	if len([]rune(f)) == 0 {
		return true
	}
	compile := regexp.MustCompile("^([0-9A-HJ-NPQRTUWXY]{2}\\d{6}[0-9A-HJ-NPQRTUWXY]{10}|[1-9]\\d{14})$")
	return compile.Match([]byte(f))
}

func VerifyDescription(fl validator.FieldLevel) bool {
	f := fl.Field().String()

	compile := regexp.MustCompile("^[!-~a-zA-Z0-9_\u4e00-\u9fa5 ！￥……（）——“”：；，。？、‘’《》｛｝【】·\\s]*$")
	if !compile.Match([]byte(f)) {
		return false
	}

	return true
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

func VerifyUUIDArray(fl validator.FieldLevel) bool {
	arr := fl.Field().Interface()
	arr1 := arr.([]string)

	for _, f := range arr1 {
		uUIDRegexString := "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"
		compile := regexp.MustCompile(uUIDRegexString)
		if !compile.Match([]byte(f)) {
			return false
		}
	}
	return true
}

func alphaNumUnicode(fl validator.FieldLevel) bool {
	panic("unimplemented")
}

// 支持的访问者类型
var supportedSubjectTypes = sets.New[string](
	string(auth_service.SubjectAPP),
	string(auth_service.SubjectUser),
)

func auth_subject(fl validator.FieldLevel) bool {
	subjectType, subjectID, found := strings.Cut(fl.Field().String(), ":")
	if !found {
		return false
	}
	if !supportedSubjectTypes.Has(subjectType) {
		return false
	}
	if _, err := uuid.Parse(subjectID); err != nil {
		return false
	}
	return true
}
