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
	"github.com/kweaver-ai/dsg/services/apps/data-subject/common/util"
	log "github.com/kweaver-ai/idrm-go-frame/core/logx/zapx"
)

var (
	uniTrans *ut.UniversalTranslator
)

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

	if err := initTrans(customV.Validate); err != nil {
		panic(err.Error())
	}
	return nil
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
