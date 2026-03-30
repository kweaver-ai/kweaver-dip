package form_validator

import (
	"fmt"

	"github.com/kweaver-ai/dsg/services/apps/session/common/units"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"

	"reflect"
	"strings"

	"github.com/gin-gonic/gin/binding"
	"github.com/go-playground/locales/en"
	"github.com/go-playground/locales/zh"
	"github.com/go-playground/locales/zh_Hant_TW"
	ut "github.com/go-playground/universal-translator"
	validator "github.com/go-playground/validator/v10"
	en_translations "github.com/go-playground/validator/v10/translations/en"
	zh_translations "github.com/go-playground/validator/v10/translations/zh"

	"regexp"
)

var (
	Validator  *CustomValidator
	Trans      ut.Translator
	validators []ValidatorInfo
)

const (
	CustomValidatorMode   = "CustomValidatorMode"
	CustomTranslationMode = "CustomTranslationMode"
)

func init() {
	registerValidator()
}

type ValidatorInfo struct {
	Name      string
	Type      string
	Validator validator.Func
	RemindMsg string
}

func addValidators(t string, name string, validator validator.Func, msg string) {
	validatorInfo := ValidatorInfo{
		Type:      t,
		Name:      name,
		Validator: validator,
		RemindMsg: msg,
	}
	validators = append(validators, validatorInfo)
}

func registerValidator() {
	addValidators(CustomValidatorMode, "VerifyName", VerifyName, "{0}长度必须不超过128，仅支持中英文、数字、下划线及中划线")
	addValidators(CustomValidatorMode, "VerifyNameNotRequired", VerifyNameNotRequired, "{0}长度必须不超过128，仅支持中英文、数字、下划线及中划线")
	addValidators(CustomValidatorMode, "VerifyNameEN", VerifyNameEN, "{0}长度必须不超过128，仅支持英文、数字、下划线")
	addValidators(CustomValidatorMode, "VerifyNameENStandard", VerifyNameENStandard, "{0}长度必须不超过128，仅支持英文、数字、下划线、中划线，且不能以下划线和中划线开头")
	addValidators(CustomValidatorMode, "VerifyNameStandard", VerifyNameStandard, "{0}长度必须不超过128，仅支持中英文、数字、下划线、中划线，且不能以下划线和中划线开头")
	addValidators(CustomValidatorMode, "VerifyNameENNotRequired", VerifyNameENNotRequired, "{0}长度必须不超过128，仅支持英文、数字、下划线")
	addValidators(CustomValidatorMode, "VerifyNameStandardNotRequired", VerifyNameStandardNotRequired, "{0}长度必须不超过128，仅支持中英文、数字以及_ -  、（ ）")
	addValidators(CustomValidatorMode, "VerifyNameNotTrimSpace", VerifyNameNotTrimSpace, "{0}长度必须不超过128，仅支持中英文、数字、下划线及中划线")
	addValidators(CustomValidatorMode, "VerifyDescription128", VerifyDescription128, "{0}长度必须不超过128，仅支持中英文、数字及键盘上的特殊字符")
	addValidators(CustomValidatorMode, "VerifyDescription255", VerifyDescription255, "{0}长度必须不超过255，仅支持中英文、数字及键盘上的特殊字符")
	addValidators(CustomValidatorMode, "VerifyDescription255Must", VerifyDescription255Must, "{0}长度必须不超过255，仅支持中英文、数字及键盘上的特殊字符")
	addValidators(CustomValidatorMode, "VerifyOperationLogicArray", VerifyOperationLogicArray, "{0}元素的长度必须不超过128，仅支持中英文、数字及键盘上的特殊字符")
	addValidators(CustomValidatorMode, "VerifyStandardDescription", VerifyStandardDescription, "{0}长度必须在0-128之间，仅支持中英文、数字及键盘上的特殊字符")
	addValidators(CustomValidatorMode, "VerifyFusionField", VerifyFusionField, "{0}长度必须不超过128，仅支持中英文、数字以及_ -  、（ ）")
	addValidators(CustomValidatorMode, "integer", integer, "参数必须是正整数")
	addValidators(CustomValidatorMode, "variableSort", variableSort, "")
	addValidators(CustomValidatorMode, "variableDirection", variableDirection, "")
	addValidators(CustomValidatorMode, "VerifyFillingDate", verifyFillingDate, "{0}必须是合理的日期")
	addValidators(CustomValidatorMode, "TrimSpace", trimSpace, "")

	addValidators(CustomTranslationMode, "unique", nil, "{0}在数组中重复")
	addValidators(CustomValidatorMode, "VerifyUnit", VerifyUnit, "{0}长度必须不超过128")
}

func SetupValidator() error {
	Validator = NewCustomValidator()
	Validator.Engine()
	binding.Validator = Validator

	return nil
}

func InitTrans(locale string) (err error) {

	if v, ok := binding.Validator.Engine().(*validator.Validate); ok {

		uni := ut.New(en.New(), zh.New(), zh_Hant_TW.New())
		Trans, _ = uni.GetTranslator(locale)
		v.RegisterTagNameFunc(func(field reflect.StructField) string {
			return strings.ToLower(field.Name)
		})

		switch locale {
		case "zh":
			err = zh_translations.RegisterDefaultTranslations(v, Trans)
			break
		case "en":
			err = en_translations.RegisterDefaultTranslations(v, Trans)
			break
		default:
			err = zh_translations.RegisterDefaultTranslations(v, Trans)
			break
		}
		if err != nil {
			return err
		}

	}
	if err1 := BindingCustomValidator(); err1 != nil {
		log.Error(err1.Error())
		return err1
	}
	return nil
}

// BindingCustomValidator bind custom Validator
func BindingCustomValidator() error {
	trans := Trans
	if v, ok := binding.Validator.Engine().(*validator.Validate); ok {
		v.RegisterTagNameFunc(registerTagName)
		for _, info := range validators {
			// only register translate
			if info.Type == CustomTranslationMode && info.RemindMsg != "" {
				// register validator validation remind msg
				if err := v.RegisterTranslation(info.Name, trans, registerTranslator(info.Name, info.RemindMsg), translate); err != nil {
					log.Errorf("register validation remind msg %v error %v", info.Name, err)
					return err
				}
				continue
			}
			// register customer  validator
			if err := v.RegisterValidation(info.Name, info.Validator); err != nil {
				log.Errorf("register validator %v error %v", info.Name, err)
				return err
			}
			// 如果没有自定义提示就跳过
			if info.RemindMsg == "" {
				continue
			}
			// register validator validation remind msg
			if err := v.RegisterTranslation(info.Name, trans, registerTranslator(info.Name, info.RemindMsg), translate); err != nil {
				log.Errorf("register validation remind msg %v error %v", info.Name, err)
				return err
			}
		}
		return nil
	}
	return fmt.Errorf("binding Validator Engine transfer error ")
}

// registerTranslator 为自定义字段添加翻译功能
func registerTranslator(tag string, msg string) validator.RegisterTranslationsFunc {
	return func(trans ut.Translator) error {
		if err := trans.Add(tag, msg, false); err != nil {
			return err
		}
		return nil
	}
}

// translate 自定义字段的翻译方法
func translate(trans ut.Translator, fe validator.FieldError) string {
	tag := fe.Tag()
	fd := fe.Field()
	if tag == "unique" {
		v := reflect.ValueOf(fe.Value())
		if v.Len() >= 1 {
			firstItem := v.Index(0)
			fvt := firstItem.Type()
			if fvt.Kind() == reflect.Struct {
				s, ok := fvt.FieldByName(fe.Param())
				if ok {
					subField := units.FindTagName(s, "form")
					fd += "." + subField
				}
			}
		}
	}
	msg, err := trans.T(tag, fd)
	if err != nil {
		panic(fe.(error).Error())
	}
	return msg
}

func CheckKeyWord(keyword *string) bool {
	*keyword = strings.TrimSpace(*keyword)
	if len([]rune(*keyword)) > 128 {
		return false
	}
	return regexp.MustCompile("^[a-zA-Z0-9\u4e00-\u9fa5-_]*$").Match([]byte(*keyword))
}
func CheckUUIDNotRequired(uuid string) bool {
	if uuid == "" {
		return true
	}
	uUIDRegexString := "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"
	return regexp.MustCompile(uUIDRegexString).Match([]byte(uuid))
}
func registerTagName(field reflect.StructField) string {
	label := units.FindTagName(field, "form")
	if label == "" {
		jsonTagName := units.FindTagName(field, "json")
		if jsonTagName == "" {
			return strings.ToLower(field.Name)
		}
		return jsonTagName
	}
	return label
}
