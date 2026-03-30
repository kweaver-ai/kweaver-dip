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

	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/util"
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
		tag:           "VerifyNumeric",
		validatorFunc: VerifyNumeric,
		trans: map[string]string{
			"zh": "{0}必须是大于0的字符串整数",
			"en": "{0}必须是大于0的字符串整数",
		},
	},
	{
		tag:           "URL",
		validatorFunc: URL,
		trans: map[string]string{
			"zh": "{0}仅支持英文、数字以及键盘上的特殊字符，且只能以 （/）开头",
			"en": "{0}仅支持英文、数字以及键盘上的特殊字符，且只能以 （/）开头",
		},
		translationFunc: func(tran ut.Translator, fe validator.FieldError) string {
			switch fe.Field() {
			case "service_path":
				t, _ := tran.T(fe.Tag(), "服务路径")
				return t
			case "backend_service_path":
				t, _ := tran.T(fe.Tag(), "后台服务路径")
				return t
			}
			t, _ := tran.T(fe.Tag(), fe.Field())
			return t
		},
	},
	{
		tag:           "HOST",
		validatorFunc: HOST,
		trans: map[string]string{
			"zh": "{0}仅支持以http://或https://开头，IP支持IPv4、IPv6，示例： https://www.x.cn",
			"en": "{0}仅支持以http://或https://开头，IP支持IPv4、IPv6，示例： https://www.x.cn",
		},
		translationFunc: func(tran ut.Translator, fe validator.FieldError) string {
			switch fe.Field() {
			case "backend_service_host":
				t, _ := tran.T(fe.Tag(), "后台服务域名/IP")
				return t
			}
			t, _ := tran.T(fe.Tag(), fe.Field())
			return t
		},
	},
	{
		tag:           "PHONE",
		validatorFunc: PHONE,
		trans: map[string]string{
			"zh": "{0}联系方式请输入正确格式的手机号码",
			"en": "{0}联系方式请输入正确格式的手机号码",
		},
	},
	{
		tag:           "ServiceName",
		validatorFunc: ServiceName,
		trans: map[string]string{
			"zh": "{0}长度必须不超过128，仅支持中英文、数字",
			"en": "{0}长度必须不超过128，仅支持中英文、数字",
		},
	},
	{
		tag:           "VerifyName",
		validatorFunc: VerifyName,
		trans: map[string]string{
			"zh": "{0}长度必须不超过128，仅支持中英文、数字、下划线及中划线",
			"en": "{0}长度必须不超过128，仅支持中英文、数字、下划线及中划线",
		},
	},
	{
		tag:           "VerifyNameEn",
		validatorFunc: VerifyNameEn,
		trans: map[string]string{
			"zh": "{0}长度必须不超过128，仅支持英文、数字、下划线及中划线",
			"en": "{0}长度必须不超过128，仅支持英文、数字、下划线及中划线",
		},
	},
	{
		tag:           "VerifyDataType",
		validatorFunc: VerifyDataType,
		trans: map[string]string{
			"zh": "{0}长度必须不超过128，仅支持英文、数字、英文括号",
			"en": "{0}长度必须不超过128，仅支持英文、数字、英文括号",
		},
	},
	{
		tag:           "VerifyNameStandard",
		validatorFunc: VerifyNameStandard,
		trans: map[string]string{
			"zh": "{0}仅支持中英文、数字、下划线及中划线",
			"en": "{0}仅支持中英文、数字、下划线及中划线",
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
		tag:           "VerifyUUIDArray",
		validatorFunc: VerifyUUIDArray,
		trans: map[string]string{
			"zh": "{0}元素必须为uuid",
			"en": "{0}元素必须为uuid",
		},
	},
	{
		tag:                      "auth_subject",
		validatorFunc:            auth_subject,
		callValidationEvenIfNull: false,
		trans: map[string]string{
			"zh": "{0}元素必须为uuid",
			"en": "{0}元素必须为uuid",
		},
		translationFunc: func(ut ut.Translator, fe validator.FieldError) string {
			panic("unimplemented")
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
