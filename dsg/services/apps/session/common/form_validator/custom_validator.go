package form_validator

import (
	"reflect"
	"regexp"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/xuri/excelize/v2"

	validator "github.com/go-playground/validator/v10"
)

type CustomValidator struct {
	Once     sync.Once
	Validate *validator.Validate
}

func NewCustomValidator() *CustomValidator {
	return &CustomValidator{}
}

func (v *CustomValidator) ValidateStruct(obj interface{}) error {
	if kindOfData(obj) == reflect.Struct {
		v.lazyinit()
		if err := v.Validate.Struct(obj); err != nil {
			return err
		}
	}

	return nil
}

func (v *CustomValidator) Engine() interface{} {
	v.lazyinit()
	return v.Validate
}

func (v *CustomValidator) lazyinit() {
	v.Once.Do(func() {
		v.Validate = validator.New()
		v.Validate.SetTagName("binding")
	})
}

func kindOfData(data interface{}) reflect.Kind {
	value := reflect.ValueOf(data)
	valueType := value.Kind()

	if valueType == reflect.Ptr {
		valueType = value.Elem().Kind()
	}
	return valueType
}

// VerifyName Must Have
func VerifyName(fl validator.FieldLevel) bool {
	f := fl.Field().String()
	f = strings.TrimSpace(f)
	fl.Field().SetString(f)

	if len([]rune(f)) > 128 {
		return false
	}
	compile := regexp.MustCompile("^[a-zA-Z0-9\u4e00-\u9fa5-_]+$")
	return compile.Match([]byte(f))
}

// VerifyNameNotRequired not required
func VerifyNameNotRequired(fl validator.FieldLevel) bool {
	f := fl.Field().String()
	f = strings.TrimSpace(f)
	fl.Field().SetString(f)

	if len([]rune(f)) > 128 {
		return false
	}
	compile := regexp.MustCompile("^[a-zA-Z0-9\u4e00-\u9fa5-_]*$")
	return compile.Match([]byte(f))
}

func VerifyNameEN(fl validator.FieldLevel) bool {
	f := fl.Field().String()
	f = strings.TrimSpace(f)
	fl.Field().SetString(f)
	if len([]rune(f)) > 128 {
		return false
	}
	compile := regexp.MustCompile("^[a-zA-Z0-9_]+$")
	return compile.Match([]byte(f))
}
func VerifyNameStandard(fl validator.FieldLevel) bool {
	f := fl.Field().String()

	f = strings.TrimSpace(f)
	if strings.HasPrefix(f, "-") || strings.HasPrefix(f, "_") {
		return false
	}
	fl.Field().SetString(f)
	if len([]rune(f)) > 128 {
		return false
	}
	compile := regexp.MustCompile("^[a-zA-Z0-9\u4e00-\u9fa5-_]+$")
	return compile.Match([]byte(f))
}
func VerifyNameENStandard(fl validator.FieldLevel) bool {
	f := fl.Field().String()
	f = strings.TrimSpace(f)
	if strings.HasPrefix(f, "-") || strings.HasPrefix(f, "_") {
		return false
	}
	fl.Field().SetString(f)
	if len([]rune(f)) > 128 {
		return false
	}
	compile := regexp.MustCompile("^[a-zA-Z0-9-_]+$")
	return compile.Match([]byte(f))
}

func VerifyNameENNotRequired(fl validator.FieldLevel) bool {
	f := fl.Field().String()
	f = strings.TrimSpace(f)
	fl.Field().SetString(f)
	if len([]rune(f)) > 128 {
		return false
	}
	compile := regexp.MustCompile("^[a-zA-Z0-9_]*$")
	return compile.Match([]byte(f))
}
func VerifyNameStandardNotRequired(fl validator.FieldLevel) bool {
	f := fl.Field().String()

	f = strings.TrimSpace(f)
	fl.Field().SetString(f)
	if len([]rune(f)) > 128 {
		return false
	}
	compile := regexp.MustCompile("^[a-zA-Z0-9\u4e00-\u9fa5-_（）、()]*$")
	return compile.Match([]byte(f))
}

func VerifyNameNotTrimSpace(fl validator.FieldLevel) bool {
	f := fl.Field().String()

	if len([]rune(f)) > 128 {
		return false
	}
	compile := regexp.MustCompile("^[a-zA-Z0-9\u4e00-\u9fa5-_]+$")
	return compile.Match([]byte(f))
}

func VerifyStandardDescription(fl validator.FieldLevel) bool {
	f := fl.Field().String()
	if f == "" {
		return true // Not required
	}

	if len([]rune(f)) > 128 {
		return false
	}
	compile := regexp.MustCompile("^[!-~a-zA-Z0-9_\u4e00-\u9fa5 ！￥……（）——“”：；，。？、‘’《》｛｝【】·\\s]+$")
	return compile.Match([]byte(f))
}

func VerifyFusionField(fl validator.FieldLevel) bool {
	f := fl.Field().String()
	f = strings.TrimSpace(f)
	if f == "" {
		return false // Not required
	}

	arr := strings.Split(f, "\\")
	for i := 0; i < len(arr); i++ {
		arr[i] = strings.TrimSpace(arr[i])
		if len([]rune(arr[i])) > 128 {
			return false
		}
		compile := regexp.MustCompile("^[a-zA-Z0-9\u4e00-\u9fa5-_、（）()]+$")
		if !compile.Match([]byte(arr[i])) {
			return false
		}
	}
	f = strings.Join(arr, "\\")
	fl.Field().SetString(f)
	return true
}

// VerifyDescription128  allow multi spaces
func VerifyDescription128(fl validator.FieldLevel) bool {
	// can be empty
	f := fl.Field().String()
	f = strings.TrimSpace(f)
	fl.Field().SetString(f)
	if len([]rune(f)) > 128 {
		return false
	}
	compile := regexp.MustCompile("^[!-~a-zA-Z0-9_\u4e00-\u9fa5 ！￥……（）——“”：；，。？、‘’《》｛｝【】·\\s]*$")
	return compile.Match([]byte(f))
}

// VerifyDescription255  allow multi spaces
func VerifyDescription255(fl validator.FieldLevel) bool {
	// can be empty
	f := fl.Field().String()
	f = strings.TrimSpace(f)
	fl.Field().SetString(f)
	if len([]rune(f)) > 255 {
		return false
	}
	compile := regexp.MustCompile("^[!-~a-zA-Z0-9_\u4e00-\u9fa5 ！￥……（）——“”：；，。？、‘’《》｛｝【】·\\s]*$")
	return compile.Match([]byte(f))
}

// VerifyDescription255Must Not allow space/multi spaces
func VerifyDescription255Must(fl validator.FieldLevel) bool {
	// must have
	f := fl.Field().String()
	f = strings.TrimSpace(f)
	fl.Field().SetString(f)
	if len([]rune(f)) > 255 {
		return false
	}
	compile := regexp.MustCompile("^[!-~a-zA-Z0-9_\u4e00-\u9fa5 ！￥……（）——“”：；，。？、‘’《》｛｝【】·\\s]+$")
	if !compile.Match([]byte(f)) {
		return false
	}
	return true
}

func VerifyOperationLogicArray(fl validator.FieldLevel) bool {

	arr := fl.Field().Interface()
	arr1 := arr.([]string)
	// if arr1 == nil || len(arr1) == 0 {
	//	return false
	// }
	// if len(arr1) == 1 && strings.TrimSpace(arr1[0]) == "" {
	//	return false
	// }
	cnt := 0
	for _, f := range arr1 {
		f = strings.TrimSpace(f)
		if len([]rune(f)) > 255 {
			return false
		}
		if f == "" {
			cnt++
		}
		compile := regexp.MustCompile("^[!-~a-zA-Z0-9_\u4e00-\u9fa5 ！￥……（）——“”：；，。？、‘’《》｛｝【】·\\s]*$")
		if !compile.Match([]byte(f)) {
			return false
		}
	}
	// if cnt == len(arr1) {
	//	return false
	// }
	return true
}

func variableSort(fl validator.FieldLevel) bool {
	f := fl.Field().String()
	if f == "" {
		return true // Not required
	}
	if f == "create_time" || f == "update_time" {
		return true
	}
	return false
}
func variableDirection(fl validator.FieldLevel) bool {
	f := fl.Field().String()
	if f == "" {
		return true // Not required
	}
	if f == "asc" || f == "desc" {
		return true
	}
	return false
}

func integer(fl validator.FieldLevel) bool {
	f := fl.Field().String()
	if f == "" {
		return false
	}
	_, err := strconv.Atoi(f)
	if err != nil {
		return false
	}
	return true
}

func verifyFillingDate(fl validator.FieldLevel) bool {
	f := fl.Field().String()

	if len([]rune(f)) > 32 {
		return false
	}

	if d, err := strconv.ParseFloat(f, 64); err == nil {
		// 60在excel解释为1900/2/29，该日期实际不存在，不是一个合理的日期
		if d == 60 {
			return false
		}

		_, err = excelize.ExcelDateToTime(d, false)
		if err != nil {
			return false
		}

		return true
	}

	if regexp.MustCompile(`^\d{4}年\d{1,2}月\d{1,2}日$`).Match([]byte(f)) {
		_, err := time.Parse("2006年1月2日", f)
		if err != nil {
			return false
		}

		return true
	}

	if regexp.MustCompile(`^\d{4}/\d{1,2}/\d{1,2}$`).Match([]byte(f)) {
		_, err := time.Parse("2006/1/2", f)
		if err != nil {
			return false
		}

		return true
	}

	return false
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

// VerifyUnit  allow multi spaces
func VerifyUnit(fl validator.FieldLevel) bool {
	// can be empty
	f := fl.Field().String()
	f = strings.TrimSpace(f)
	fl.Field().SetString(f)
	if len([]rune(f)) > 128 {
		return false
	}
	return true
}
