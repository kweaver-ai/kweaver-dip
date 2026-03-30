package form_validator

import (
	"fmt"
	"reflect"
	"regexp"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin/binding"
	"github.com/go-playground/validator/v10"
	log "github.com/kweaver-ai/idrm-go-frame/core/logx/zapx"
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

func verifyModelID(fl validator.FieldLevel) bool {
	value := fl.Field()
	if value.Kind() == reflect.Pointer {
		if value.IsNil() {
			return true
		}

		value = value.Elem()
	}

	if value.Kind() != reflect.String {
		log.Warnf("field type not is string, kind: [%v]", value.Kind())
		return false
	}

	omit := fl.Param() == "omit"

	idStr := strings.TrimSpace(value.String())
	if len(idStr) == 0 {
		return true
		// if omit {
		// 	return true
		// }

		// log.Errorf("id string show is empty")
		// return false
	}

	ui64, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		log.Errorf("id real type is not uint64, err: %v", err)
		return false
	}

	if !omit && ui64 < 1 {
		log.Error("id lt 1")
		return false
	}

	value.SetString(idStr)

	return true
}
