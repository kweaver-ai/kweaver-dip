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
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/util"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
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
		tag:           "VerifyNameStandard",
		validatorFunc: VerifyNameStandard,
		trans: map[string]string{
			"zh": "{0}长度必须不超过128，仅支持中英文、数字、下划线及中划线",
			"en": "{0}长度必须不超过128，仅支持中英文、数字、下划线及中划线",
		},
	},
	{
		tag:           "VerifyRange",
		validatorFunc: VerifyRange,
		trans: map[string]string{
			"zh": "{0}长度必须不超过128，仅支持中英文、数字、下划线及中划线，且不能以下划线和中划线开头",
			"en": "{0}长度必须不超过128，仅支持中英文、数字、下划线及中划线，且不能以下划线和中划线开头",
		},
	},
	{
		tag:           "VerifyNameStandardLimitPrefix",
		validatorFunc: VerifyNameStandardLimitPrefix,
		trans: map[string]string{
			"zh": "{0}长度必须不超过128，仅支持中英文、数字、下划线及中划线，且不能以下划线和中划线开头",
			"en": "{0}长度必须不超过128，仅支持中英文、数字、下划线及中划线，且不能以下划线和中划线开头",
		},
	},
	{
		tag:           "VerifyNameENStandard",
		validatorFunc: VerifyNameENStandard,
		trans: map[string]string{
			"zh": "{0}长度必须不超过32，仅支持英文、数字、下划线、中划线，且不能以下划线和中划线开头",
			"en": "{0}长度必须不超过32，仅支持英文、数字、下划线、中划线，且不能以下划线和中划线开头",
		},
	},
	{
		tag:           "VerifyDataRelatedMatters",
		validatorFunc: VerifyDataRelatedMatters,
		trans: map[string]string{
			"zh": "{0}仅支持英文、数字、下划线、中划线、分号",
			"en": "{0}仅支持英文、数字、下划线、中划线、分号",
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
		tag:           "VerifyDescription",
		validatorFunc: VerifyDescription,
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
		translationFunc: uniqueTranslation,
	},
	{
		tag:                      "TrimSpace",
		validatorFunc:            TrimSpace,
		callValidationEvenIfNull: true,
		trans: map[string]string{
			"zh": "{0}值不可修改",
			"en": "{0}值不可修改",
		},
	},
	{
		tag: "required_if",
		trans: map[string]string{
			"zh": "{0}为必填字段",
			"en": "{0} is a required field",
		},
	},
	{
		tag: "required_unless",
		trans: map[string]string{
			"zh": "{0}为必填字段",
			"en": "{0} is a required field",
		},
	},
	{
		tag:           "VerifyUUIDArray",
		validatorFunc: VerifyUUIDArray,
		trans: map[string]string{
			"zh": "{0}元素必须为uuid",
			"en": "{0}元素必须为uuid",
		},
	},
	{
		tag:           "VerifyModelID",
		validatorFunc: verifyModelID,
		trans: map[string]string{
			"zh": "{0}必须是大于0的字符串整数",
			"en": "{0}必须是大于0的字符串整数",
		},
	},
	{
		tag:           "VerifyVertexID",
		validatorFunc: VerifyVertexID,
		trans: map[string]string{
			"zh": "{0}必须为32位uuid",
			"en": "{0}必须为32位uuid",
		},
	},
	{
		tag:           "VerifyVersion",
		validatorFunc: VerifyVersion,
		trans: map[string]string{
			"zh": "{0}元素必须为有效版本号",
			"en": "{0}元素必须为有效版本号",
		},
	},
	{
		tag:           "VerifyMultiSnowflakeIDString",
		validatorFunc: VerifyMultiSnowflakeIDString,
		trans: map[string]string{
			"zh": "{0}元素必须为以逗号分隔的正整数ID",
			"en": "{0}元素必须为以逗号分隔的正整数ID",
		},
	},
	{
		tag:           "VerifyMultiUUIDString",
		validatorFunc: VerifyMultiUUIDString,
		trans: map[string]string{
			"zh": "{0}元素必须为多个uuid的拼接字符且必须以英文逗号进行分隔",
			"en": "{0}元素必须为多个uuid的拼接字符且必须以英文逗号进行分隔",
		},
	},
	{
		tag:           "ValidateAdministrativeCode",
		validatorFunc: ValidateAdministrativeCode,
		trans: map[string]string{
			"zh": "行政区划代码校验失败",
			"en": "行政区划代码校验失败",
		},
	},
	{
		tag:           "LocalDate",
		validatorFunc: ValidateLocalDateString,
		trans: map[string]string{
			"zh": "日期格式校验失败，正确日期格式：2006-01-02",
			"en": "日期格式校验失败，正确日期格式：2006-01-02",
		},
	},
	{
		tag:           "LocalTime",
		validatorFunc: ValidateLocalTimeString,
		trans: map[string]string{
			"zh": "时间格式校验失败，正确时间格式：15:04:05",
			"en": "时间格式校验失败，正确时间格式：15:04:05",
		},
	},
	{
		tag:           "LocalDateTime",
		validatorFunc: ValidateLocalDateTimeString,
		trans: map[string]string{
			"zh": "日期时间格式校验失败，正确时日期间格式：2006-01-02 15:04:05",
			"en": "日期时间格式校验失败，正确时日期间格式：2006-01-02 15:04:05",
		},
	},
	{
		tag:           "ValidateTimeString",
		validatorFunc: ValidateTimeString,
		trans: map[string]string{
			"zh": "时间校验失败",
			"en": "时间校验失败",
		},
	},
	{
		tag:           "KeywordTrimSpace",
		validatorFunc: KeywordTrimSpace,
		trans:         map[string]string{},
	},
	{
		tag:           "InjectStack",
		validatorFunc: InjectStack,
	},
	{
		tag:           "verifyEnum",
		validatorFunc: VerifyEnum,
		trans: map[string]string{
			"zh": "{0}的值必须是[{1}]其中之一",
			"en": "{0}的值必须是[{1}]其中之一",
		},
		translationFunc: EnumTranslation,
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
			err := v.RegisterTranslation(customerValidator.tag, tran, registerTranslator(customerValidator.tag, msg, true), tranFunc)
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

func SetupValidator() error {
	customV := NewCustomValidator().(*customValidator)
	binding.Validator = customV

	return initTrans(customV.Validate)
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
