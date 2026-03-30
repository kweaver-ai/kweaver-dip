package form_validator

import (
	"fmt"
	"reflect"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/constant"
	"github.com/kweaver-ai/idrm-go-frame/core/enum"

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
func VerifyRange(fl validator.FieldLevel) bool {
	f := fl.Field().String()
	f = strings.TrimSpace(f)
	fl.Field().SetString(f)
	if len([]rune(f)) > 128 {
		return false
	}
	compile := regexp.MustCompile("^[a-zA-Z0-9\u4e00-\u9fa5]+[a-zA-Z0-9\u4e00-\u9fa5_-]*$")
	return compile.Match([]byte(f))
}
func VerifyDataRelatedMatters(fl validator.FieldLevel) bool {
	f := fl.Field().String()

	f = strings.TrimSpace(f)
	fl.Field().SetString(f)
	if len([]rune(f)) > 128 {
		return false
	}
	compile := regexp.MustCompile("^[a-zA-Z0-9\u4e00-\u9fa5-_;]+$")
	return compile.Match([]byte(f))
}

func VerifyNameENStandard(fl validator.FieldLevel) bool {
	f := fl.Field().String()
	f = strings.TrimSpace(f)
	if strings.HasPrefix(f, "-") || strings.HasPrefix(f, "_") {
		return false
	}
	fl.Field().SetString(f)
	if len([]rune(f)) > 32 {
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
	compile := regexp.MustCompile("^[!-~a-zA-Z0-9_\u4e00-\u9fa5 ！￥……（）——“”：；，。？、‘’《》｛｝【】·\\s]*$")
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

// VerifyMultiSnowflakeIDString 校验入参以雪花ID以逗号分隔
func VerifyMultiSnowflakeIDString(fl validator.FieldLevel) bool {
	f := fl.Field().String()
	f = strings.TrimSpace(f)
	fl.Field().SetString(f)
	if f == "" {
		return true
	}

	arr := strings.Split(f, ",")
	for i := 0; i < len(arr); i++ {
		arr[i] = strings.TrimSpace(arr[i])
		num, err := strconv.ParseUint(arr[i], 10, 64)
		if err != nil || num == 0 {
			return false
		}
	}
	f = strings.Join(arr, ",")
	fl.Field().SetString(f)
	return true
}

func VerifyDescriptionString(f string, length int) bool {
	f = strings.TrimSpace(f)
	if len([]rune(f)) > length {
		return false
	}
	compile := regexp.MustCompile("^[!-~a-zA-Z0-9_\u4e00-\u9fa5 ！￥……（）——“”：；，。？、‘’《》｛｝【】·\\s]*$")
	return compile.Match([]byte(f))
}

func VerifyVertexID(fl validator.FieldLevel) bool {
	f := fl.Field().String()
	f = strings.TrimSpace(f)
	fl.Field().SetString(f)
	compile := regexp.MustCompile("^[0-9a-f]{8}[0-9a-f]{4}[0-9a-f]{4}[0-9a-f]{4}[0-9a-f]{12}$")
	return compile.Match([]byte(f))
}

func VerifyMultiUUIDString(fl validator.FieldLevel) bool {
	f := fl.Field().String()
	f = strings.TrimSpace(f)
	fl.Field().SetString(f)
	if f == "" {
		return false
	}

	arr := strings.Split(f, ",")
	for _, uuidStr := range arr {
		uUIDRegexString := "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"
		compile := regexp.MustCompile(uUIDRegexString)
		if !compile.Match([]byte(uuidStr)) {
			return false
		}
	}
	f = strings.Join(arr, ",")
	fl.Field().SetString(f)
	return true
}

// ValidateAdministrativeCode 校验两位行政区划代码
func ValidateAdministrativeCode(fl validator.FieldLevel) bool {
	f := fl.Field().String()
	if f == "" {
		return true
	}

	twoDigitPattern := `^[0-9]{2}$`
	twoDigitRegex := regexp.MustCompile(twoDigitPattern)

	// 检查是否匹配两位行政区划代码
	return twoDigitRegex.MatchString(f)
}

// ValidateLocalDateString 校验日期字符串 2006-01-02
func ValidateLocalDateString(fl validator.FieldLevel) bool {
	f := fl.Field().String()
	if f == "" {
		return true
	}
	_, err := time.Parse("2006-01-02", f)
	return err == nil
}

// ValidateLocalTimeString 校验时间字符串 15:04:05
func ValidateLocalTimeString(fl validator.FieldLevel) bool {
	f := fl.Field().String()
	if f == "" {
		return true
	}
	_, err := time.Parse("15:04:05", f)
	return err == nil
}

// ValidateLocalDateTimeString 校验时间字符串 2006-01-02 15:04:05
func ValidateLocalDateTimeString(fl validator.FieldLevel) bool {
	f := fl.Field().String()
	if f == "" {
		return true
	}
	_, err := time.Parse(constant.LOCAL_TIME_FORMAT, f)
	return err == nil
}

// ValidateTimeString 校验时间字符串
func ValidateTimeString(fl validator.FieldLevel) bool {
	f := fl.Field().String()
	if f == "" {
		return true
	}
	timePattern := `^([01][0-9]|2[0-3]):([0-5][0-9])$`

	timeRegex := regexp.MustCompile(timePattern)

	// 检查是否匹配时间格式
	return timeRegex.MatchString(f)
}

func injectFieldValue(name string, src, dst reflect.Value) {
	if dst.Kind() == reflect.Pointer && !dst.IsNil() {
		dst = dst.Elem()
	}
	switch dst.Kind() {
	case reflect.Struct:
		matchField := dst.FieldByName(name)
		if matchField.CanSet() && matchField.IsZero() && matchField.Kind() == src.Kind() {
			matchField.Set(src)
		}
		for i := 0; i < dst.NumField(); i++ {
			injectFieldValue(name, src, dst.Field(i))
		}
	case reflect.Slice:
		for i := 0; i < dst.Len(); i++ {
			injectFieldValue(name, src, dst.Index(i))
		}
	}
}

func InjectStack(fl validator.FieldLevel) (valid bool) {
	injectFieldValue(fl.FieldName(), fl.Field(), fl.Parent())
	return true
}

func VerifyNameStandardLimitPrefix(fl validator.FieldLevel) bool {
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

func VerifyEnum(fl validator.FieldLevel) bool {
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

func KeywordTrimSpace(fl validator.FieldLevel) bool {
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

	special := strings.NewReplacer(`\`, `\\`, `%`, `\%`, `'`, `\'`)
	value.SetString(special.Replace(strings.TrimSpace(value.String())))

	return true
}
