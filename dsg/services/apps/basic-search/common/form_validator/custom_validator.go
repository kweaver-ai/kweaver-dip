package form_validator

import (
	"fmt"
	"reflect"
	"regexp"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin/binding"
	"github.com/go-playground/validator/v10"
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

	compile := regexp.MustCompile("^[a-zA-Z0-9\u4e00-\u9fa5-_]+$")
	if !compile.Match([]byte(f)) {
		return false
	}

	return true
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
	compile := regexp.MustCompile("^[a-zA-Z0-9\u4e00-\u9fa5-_]+$")
	return compile.Match([]byte(f))
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
	f = strings.TrimSpace(f)
	fl.Field().SetString(f)
	compile := regexp.MustCompile("^[!-~a-zA-Z0-9_\u4e00-\u9fa5 ！￥……（）——“”：；，。？、‘’《》｛｝【】·\\s]+$")
	return compile.Match([]byte(f))
}

func TrimSpace(fl validator.FieldLevel) bool {
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
		if omit {
			return true
		}

		log.Errorf("id string show is empty")
		return false
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

func VerifyVersion(fl validator.FieldLevel) bool {
	f := fl.Field().String()
	f = strings.TrimSpace(f)
	fl.Field().SetString(f)
	if len(f) != 7 {
		return false
	}
	compile := regexp.MustCompile("^([0-9]\\.){3}[0-9]{1}$")
	return compile.Match([]byte(f))
}
