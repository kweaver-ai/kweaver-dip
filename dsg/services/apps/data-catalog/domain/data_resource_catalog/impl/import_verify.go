package impl

import (
	"errors"
	"fmt"
	"reflect"
	"regexp"
	"strings"

	"github.com/go-playground/locales/en"
	"github.com/go-playground/locales/zh"
	ut "github.com/go-playground/universal-translator"
	"github.com/go-playground/validator/v10"
	enTranslations "github.com/go-playground/validator/v10/translations/en"
	zhTranslations "github.com/go-playground/validator/v10/translations/zh"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/form_validator"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

var v *validator.Validate

func GetValidator() *validator.Validate {
	return v
}

func init() {
	v = validator.New()
	zhT := zh.New()
	uniTrans = ut.New(zhT, zhT, en.New())
	enTran, _ := uniTrans.GetTranslator("en")
	zhTran, _ := uniTrans.GetTranslator("zh")
	err := enTranslations.RegisterDefaultTranslations(v, enTran)
	if err != nil {
		log.Errorf("failed to register en translations, err: %v", err)
	}

	err = zhTranslations.RegisterDefaultTranslations(v, zhTran)
	if err != nil {
		log.Errorf("failed to register zh translations, err: %v", err)
	}
	registerCustomerValidation(v)
}
func registerCustomerValidation(v *validator.Validate) {
	var err error
	v.RegisterTagNameFunc(func(fld reflect.StructField) string {
		name := fld.Tag.Get("excel")
		if name == "" {
			name = fld.Name
		}
		return name
	})
	if err = v.RegisterValidation("VerifyNameStandard", form_validator.VerifyNameStandard); err != nil {
		log.Error(err.Error())
	}
	if err = v.RegisterValidation("VerifyDateTimeRange", VerifyDateTimeRange); err != nil {
		log.Error(err.Error())
	}
	if err = v.RegisterValidation("VerifyDataRelatedMatters", VerifyDataRelatedMatters); err != nil {
		log.Error(err.Error())
	}
	if err = v.RegisterValidation("VerifyRange", VerifyRange); err != nil {
		log.Error(err.Error())
	}
}

// VerifyDateTimeRange 自定义校验函数：验证时间范围格式是否合法
func VerifyDateTimeRange(fl validator.FieldLevel) bool {
	value := fl.Field().String()
	if value == "" {
		return true // 空值由 required 控制
	}

	// 匹配单日期或区间格式
	re := regexp.MustCompile(`^\d{4}/\d{2}/\d{2}(-\d{4}/\d{2}/\d{2})?$`)
	if !re.MatchString(value) {
		return false
	}

	parts := strings.Split(value, "-")
	for _, part := range parts {
		if !isValidDate(part) {
			return false
		}
	}

	return true
}

// isValidDate 检查是否是合法的日期格式 YYYY/MM/DD
func isValidDate(dateStr string) bool {
	if len(dateStr) != 10 {
		return false
	}
	var year, month, day int
	n, _ := fmt.Sscanf(dateStr, "%d/%d/%d", &year, &month, &day)
	if n != 3 {
		return false
	}

	if year < 1900 || year > 2100 {
		return false
	}
	if month < 1 || month > 12 {
		return false
	}
	if day < 1 || day > 31 {
		return false
	}

	return true
}

// VerifyDataRelatedMatters 自定义校验函数：验证数据所属事项格式是否合法
func VerifyDataRelatedMatters(fl validator.FieldLevel) bool {
	value := fl.Field().String()

	// 每个部分只能包含中英文、数字、下划线和中划线
	re := regexp.MustCompile(`^[\p{L}\d_-]+$`) // \p{L} 表示任意语言的字母
	for _, item := range strings.Split(value, ";") {
		if len(item) > 128 {
			return false
		}
		item = strings.TrimSpace(item)
		if item == "" {
			continue
		}
		if !re.MatchString(item) {
			return false
		}
	}

	return true
}

func VerifyRange(fl validator.FieldLevel) bool {
	value := fl.Field().String()

	// 不允许以下划线或中划线开头
	if strings.HasPrefix(value, "_") || strings.HasPrefix(value, "-") {
		return false
	}

	// 每个部分只能包含中英文、数字、下划线和中划线
	re := regexp.MustCompile(`^[\p{L}\d_-]+$`) // \p{L} 表示任意语言的字母
	return re.MatchString(value)
}

func HandleValidError(err error) error {
	validatorErrors, ok := err.(validator.ValidationErrors)
	if !ok {
		return err
	}
	var errs ValidErrors
	for _, validatorError := range validatorErrors {
		//validatorError.Type().Field().Tag.Get("excel")
		//validatorError.Type().FieldByName()
		errs = append(errs, &ValidError{
			Key:     validatorError.Field()[strings.Index(validatorError.Field(), ".")+1:],
			Message: validatorError.Error(),
		})
	}
	return errs
}

var (
	uniTrans *ut.UniversalTranslator
)

func HandleValidError2(err error) error {
	var validatorErrors validator.ValidationErrors
	ok := errors.As(err, &validatorErrors)
	if !ok {
		return err
	}
	var errs ValidErrors
	zhTranslator, _ := uniTrans.GetTranslator("zh")
	for field, err2 := range validatorErrors.Translate(zhTranslator) {
		errs = append(errs, &ValidError{
			Key:     field[strings.Index(field, ".")+1:],
			Message: err2,
		})
	}
	return errs
}

type ValidError struct {
	Key     string `json:"key"`
	Message string `json:"message"`
}

type ValidErrors []*ValidError

func (v *ValidError) Error() string {
	return v.Message
}

func (v ValidErrors) Error() string {
	return strings.Join(v.Errors(), ",")
}

func (v ValidErrors) Errors() []string {
	var errs []string
	for _, err := range v {
		errs = append(errs, err.Error())
	}

	return errs
}
