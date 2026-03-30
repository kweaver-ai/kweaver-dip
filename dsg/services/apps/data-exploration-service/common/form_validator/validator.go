package form_validator

import (
	"errors"
	"reflect"
	"strings"

	"github.com/gin-gonic/gin/binding"
	"github.com/go-playground/locales/en"
	"github.com/go-playground/locales/zh"
	ut "github.com/go-playground/universal-translator"
	"github.com/go-playground/validator/v10"
	enTranslations "github.com/go-playground/validator/v10/translations/en"
	zhTranslations "github.com/go-playground/validator/v10/translations/zh"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/common/util"
	log "github.com/kweaver-ai/idrm-go-frame/core/logx/zapx"
)

var (
	uniTrans *ut.UniversalTranslator
)

var customerValidators = []*struct {
	tag                      string
	validatorFunc            validator.Func
	callValidationEvenIfNull bool
	trans                    map[string]string
	translationFunc          validator.TranslationFunc
}{
	{
		tag:           "VerifyName",
		validatorFunc: VerifyName,
		trans: map[string]string{
			"zh": "{0}仅支持中英文、数字、下划线及中划线",
			"en": "{0}仅支持中英文、数字、下划线及中划线",
		},
	},
	{
		tag:           "VerifyNameReduceSpace",
		validatorFunc: VerifyNameReduceSpace,
		trans: map[string]string{
			"zh": "{0}仅支持中英文、数字、下划线及中划线",
			"en": "{0}仅支持中英文、数字、下划线及中划线",
		},
	},
	{
		tag:           "VerifyName255",
		validatorFunc: VerifyName255,
		trans: map[string]string{
			"zh": "{0}长度必须不超过255，仅支持中英文、数字、下划线及中划线",
			"en": "{0}长度必须不超过255，仅支持中英文、数字、下划线及中划线",
		},
	},
	{
		tag:           "VerifyNameStandard",
		validatorFunc: VerifyNameStandard,
		trans: map[string]string{
			"zh": "{0}长度必须不超过128，仅支持中英文、数字、下划线及中划线",
			"en": "{0}长度必须不超过128，仅支持中英文、数字、下划线及中划线",
		},
	},
	{
		tag:           "VerifyUniformCreditCode",
		validatorFunc: VerifyUniformCreditCode,
		trans: map[string]string{
			"zh": "不符合规范",
			"en": "不符合规范",
		},
	},
	{
		tag:           "VerifyPhoneNumber",
		validatorFunc: VerifyPhoneNumber,
		trans: map[string]string{
			"zh": "电话号码只能包含数字及+、-，长度范围 3~20 个字符",
			"en": "电话号码只能包含数字及+、-，长度范围 3~20 个字符",
		},
	},
	{
		tag:           "VerifyDescription",
		validatorFunc: VerifyDescription,
		trans: map[string]string{
			"zh": "{0}仅支持中英文、数字及键盘上的特殊字符",
			"en": "{0}仅支持中英文、数字及键盘上的特殊字符",
		},
	},
	{
		tag:           "VerifyDescriptionReduceSpace",
		validatorFunc: VerifyDescriptionReduceSpace,
		trans: map[string]string{
			"zh": "{0}仅支持中英文、数字及键盘上的特殊字符",
			"en": "{0}仅支持中英文、数字及键盘上的特殊字符",
		},
	},
	{
		tag: "unique",
		trans: map[string]string{
			"zh": "{0}在数组中重复",
		},
		translationFunc: func(tran ut.Translator, fe validator.FieldError) string {
			param := fe.Field()
			for {
				if fe.Value() == nil {
					log.Warnf("warning: error translating FieldError: %s", fe.Error())
					return fe.Error()
				}

				value := reflect.ValueOf(fe.Value())
				if value.Kind() != reflect.Array || value.Kind() != reflect.Slice {
					log.Warnf("warning: error translation FieldError: %s", fe.Error())
					return fe.Error()
				}

				if value.Len() == 0 {
					// no item
					break
				}

				if len(fe.Param()) == 0 {
					// no param
					break
				}

				firstItem := reflect.Indirect(value.Index(0))
				if firstItem.Kind() != reflect.Struct {
					// item no struct
					break
				}

				if fld, ok := firstItem.Type().FieldByName(fe.Param()); ok {
					param = registerTagName(fld)
				}

				break
			}

			msg, err := tran.T(fe.Tag(), param)
			if err != nil {
				log.Warnf("warning: error translating FieldError: %s", err)
				return fe.Error()
			}

			return msg
		},
	},
	{
		tag:                      "TrimSpace",
		validatorFunc:            trimSpace,
		callValidationEvenIfNull: true,
		trans: map[string]string{
			"zh": "{0}值不可修改",
			"en": "{0}值不可修改",
		},
	},
	{
		tag: "required_if_custom",
		trans: map[string]string{
			"zh": "{0}为必填字段",
			"en": "{0} is a required field",
		},
	},
	{
		tag: "required_unless_custom",
		trans: map[string]string{
			"zh": "{0}为必填字段",
			"en": "{0} is a required field",
		},
	},
	{
		tag:           "VerifyObjectName",
		validatorFunc: VerifyObjectName,
		trans: map[string]string{
			"zh": "{0}长度必须不超过128，不支持\\ / : * ? \" | 特殊字符",
			"en": "{0}长度必须不超过128，不支持\\ / : * ? \" | 特殊字符",
		},
	},
	{
		tag:           "VerifyObjectName255",
		validatorFunc: VerifyObjectName255,
		trans: map[string]string{
			"zh": "{0}长度必须不超过255，不支持\\ / : * ? \" | 特殊字符",
			"en": "{0}长度必须不超过255，不支持\\ / : * ? \" | 特殊字符",
		},
	},
	{
		tag:           "VerifyBase64",
		validatorFunc: VerifyBase64,
		trans: map[string]string{
			"zh": "{0}必须是RFC base64 StdEncoding 格式",
			"en": "{0}必须是RFC base64 StdEncoding 格式",
		},
	},
	{
		tag:           "VerifyHost",
		validatorFunc: VerifyHost,
		trans: map[string]string{
			"zh": "{0}不符合规范",
			"en": "{0}不符合规范",
		},
	},
	{
		tag:           "VerifyHostSimple",
		validatorFunc: VerifyHostSimple,
		trans: map[string]string{
			"zh": "{0}只能包含 （英文）（数字）（.）（:）",
			"en": "{0}只能包含 （英文）（数字）（.）（:）",
		},
	},
	{
		tag:           "VerifyModelID",
		validatorFunc: verifyModelID,
		trans: map[string]string{
			"zh": "{0}不符合要求",
			"en": "{0}不符合要求",
		},
	},
}

func registerCustomerValidationAndTranslation(v *validator.Validate) error {
	for _, customerValidator := range customerValidators {
		if len(customerValidator.tag) == 0 {
			err := errors.New("tag is empty")
			log.Errorf("failed to customer validator, err: %v", err)
			return err
		}

		if customerValidator.validatorFunc == nil && len(customerValidator.trans) == 0 {
			err := errors.New("customer validator func is nil")
			log.Errorf("failed to customer validator, err: %v", err)
			return err
		}

		if customerValidator.validatorFunc != nil {
			err := v.RegisterValidation(customerValidator.tag, customerValidator.validatorFunc, customerValidator.callValidationEvenIfNull)
			if err != nil {
				log.Errorf("failed to register customer validation, tag: %v, err: %v", customerValidator.tag, err)
				return err
			}
		}

		for loc, msg := range customerValidator.trans {
			tran, found := uniTrans.GetTranslator(loc)
			if !found {
				log.Warnf("no register locale translator, locale: %v", loc)
				continue
			}

			tranFunc := customerValidator.translationFunc
			if tranFunc == nil {
				tranFunc = translate
			}
			err := v.RegisterTranslation(customerValidator.tag, tran, registerTranslator(customerValidator.tag, msg), tranFunc)
			if err != nil {
				log.Errorf("failed to register customer translation, tag: %v, locale: %v, err: %v", customerValidator.tag, loc, err)
				return err
			}
		}
	}

	return nil
}

func registerCustomerTagName(v *validator.Validate) {
	v.RegisterTagNameFunc(registerTagName)
}

func SetupValidator() {
	customV := NewCustomValidator().(*customValidator)
	binding.Validator = customV

	if err := initTrans(customV.Validate); err != nil {
		panic(err)
	}
}

func initTrans(v *validator.Validate) error {
	zhT := zh.New()
	uniTrans = ut.New(zhT, zhT, en.New())
	enTran, _ := uniTrans.GetTranslator("en")
	zhTran, _ := uniTrans.GetTranslator("zh")

	err := enTranslations.RegisterDefaultTranslations(v, enTran)
	if err != nil {
		log.Errorf("failed to register en translations, err: %v", err)
		return err
	}

	err = zhTranslations.RegisterDefaultTranslations(v, zhTran)
	if err != nil {
		log.Errorf("failed to register zh translations, err: %v", err)
		return err
	}

	registerCustomerTagName(v)

	return registerCustomerValidationAndTranslation(v)
}

// registerTranslator 为自定义字段添加翻译功能
func registerTranslator(tag string, msg string, overrides ...bool) validator.RegisterTranslationsFunc {
	return func(trans ut.Translator) error {
		override := false
		if len(overrides) > 0 {
			override = overrides[0]
		}

		if err := trans.Add(tag, msg, override); err != nil {
			return err
		}
		return nil
	}
}

// translate 自定义字段的翻译方法
func translate(trans ut.Translator, fe validator.FieldError) string {
	msg, err := trans.T(fe.Tag(), fe.Field())
	if err != nil {
		log.Warnf("warning: error translating FieldError: %s", err)
		return fe.Error()
	}

	return msg
}

func registerTagName(field reflect.StructField) string {
	var name string
	for _, tagName := range []string{"name", "uri", "form", "json"} {
		name = util.FindTagName(field, tagName)
		if len(name) > 0 {
			return name
		}
	}

	return strings.ToLower(field.Name)
}
