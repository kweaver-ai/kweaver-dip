package form_validator

import (
	"errors"
	"reflect"
	"strings"

	"github.com/kweaver-ai/dsg/services/apps/task_center/common/constant"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"

	"github.com/gin-gonic/gin/binding"
	"github.com/go-playground/locales/en"
	"github.com/go-playground/locales/zh"
	ut "github.com/go-playground/universal-translator"
	"github.com/go-playground/validator/v10"
	enTranslations "github.com/go-playground/validator/v10/translations/en"
	zhTranslations "github.com/go-playground/validator/v10/translations/zh"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/util"
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
		tag:           "verifyName",
		validatorFunc: verifyName,
		trans: map[string]string{
			"zh": "{0}必须不超过128，仅支持中英文、数字、下划线及中划线",
			"en": "{0}必须不超过128，仅支持中英文、数字、下划线及中划线",
		},
	},
	{
		tag:           "verifyNameNotRequired",
		validatorFunc: verifyNameNotRequired,
		trans: map[string]string{
			"zh": "{0}必须不超过128，仅支持中英文、数字、下划线及中划线",
			"en": "{0}必须不超过128，仅支持中英文、数字、下划线及中划线",
		},
	},
	{
		tag:           "verifyNameTask",
		validatorFunc: verifyNameTask,
		trans: map[string]string{
			"zh": "{0}必须不超过32，仅支持中英文、数字、下划线及中划线",
			"en": "{0}必须不超过32，仅支持中英文、数字、下划线及中划线",
		},
	},

	{
		tag:           "verifyDescription255",
		validatorFunc: verifyDescription255,
		trans: map[string]string{
			"zh": "{0}长度必须不超过255，仅支持中英文、数字及键盘上的特殊字符",
			"en": "{0}长度必须不超过255，仅支持中英文、数字及键盘上的特殊字符",
		},
	},
	{
		tag:           "verifyMultiStatus",
		validatorFunc: verifyMultiStatus,
		trans: map[string]string{
			"zh": "{0}状态枚举值必须是ready,ongoing,completed中的一个或多个，多个用逗号分隔",
			"en": "{0}状态枚举值必须是ready,ongoing,completed中的一个或多个，多个用逗号分隔",
		},
	},
	{
		tag:           "verifyTaskType",
		validatorFunc: verifyTaskType,
		trans: map[string]string{
			"zh": "{0}任务类型枚举值必须是" + constant.TaskTypeStrings + "中的一个",
			"en": "{0}任务类型枚举值必须是" + constant.TaskTypeStrings + "中的一个",
		},
	},
	{
		tag:           "verifyMultiTaskType",
		validatorFunc: verifyMultiTaskType,
		trans: map[string]string{
			"zh": "{0}任务类型枚举值必须是" + constant.TaskTypeStrings + "中的一个或多个，多个用逗号分隔",
			"en": "{0}任务类型枚举值必须是" + constant.TaskTypeStrings + "中的一个或多个，多个用逗号分隔",
		},
	},
	{
		tag:           "verifyMultiPriority",
		validatorFunc: verifyMultiPriority,
		trans: map[string]string{
			"zh": "{0}优先级枚举值必须是common,urgent,emergent中的一个或多个，多个用逗号分隔",
			"en": "{0}优先级枚举值必须是common,urgent,emergent中的一个或多个，多个用逗号分隔",
		},
	},
	{
		tag:           "verifyDeadline",
		validatorFunc: verifyDeadline,
		trans: map[string]string{
			"zh": "{0}截止时间必须是将来的时间",
			"en": "{0}截止时间必须是将来的时间",
		},
	},
	{
		tag:           "verifyMultiUuid",
		validatorFunc: verifyMultiUuid,
		trans: map[string]string{
			"zh": "{0}不是一个合格的逗号分隔的uui数组",
			"en": "{0}不是一个合格的逗号分隔的uui数组",
		},
	},
	{
		tag:           "verifyUuidNotRequired",
		validatorFunc: verifyUuidNotRequired,
		trans: map[string]string{
			"zh": "{0}必须是一个有效的UUID",
			"en": "{0}必须是一个有效的UUID",
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
		tag:                      "trimSpace",
		validatorFunc:            trimSpace,
		callValidationEvenIfNull: true,
		trans: map[string]string{
			"zh": "{0}值不可修改",
			"en": "{0}值不可修改",
		},
	},
	{
		tag:           "maxLen",
		validatorFunc: maxLen,
		trans: map[string]string{
			"zh": "{0}的长度必须不超过{1}",
			"en": "{0}的长度必须不超过{1}",
		},
		translationFunc: maxLenTranslation,
	}, {
		tag:           "VerifyXssString",
		validatorFunc: VerifyXssString,
		trans: map[string]string{
			"zh": "{0}不支持insert、drop、delete等输入",
			"en": "{0}不支持insert、drop、delete等输入",
		},
	},
	{
		tag:           "VerifyPhone",
		validatorFunc: VerifyPhone,
		trans: map[string]string{
			"zh": "{0}电话号码只能包含数字、+、-，长度限制在3-20个字符",
			"en": "{0}电话号码只能包含数字、+、-，长度限制在3-20个字符",
		},
	},
	{
		tag:           "VerifyTenantApplicationDataAccountList",
		validatorFunc: VerifyTenantApplicationDataAccountList,
		trans: map[string]string{
			"zh": "{0}database_account_list必须至少包含1项",
			"en": "{0}database_account_list必须至少包含1项",
		},
	},
	{
		tag:           "VerifyTenantApplicationDataAccountUpdateList",
		validatorFunc: VerifyTenantApplicationDataAccountUpdateList,
		trans: map[string]string{
			"zh": "{0}database_account_list必须至少包含1项",
			"en": "{0}database_account_list必须至少包含1项",
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
