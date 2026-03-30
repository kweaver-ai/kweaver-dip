package form_validator

import (
	"fmt"
	"reflect"
	"regexp"
	"strconv"
	"strings"
	"unicode/utf8"

	"github.com/go-playground/validator/v10"
	"github.com/kweaver-ai/dsg/services/apps/data-subject/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/data-subject/common/util"
	"github.com/kweaver-ai/idrm-go-frame/core/enum"
	log "github.com/kweaver-ai/idrm-go-frame/core/logx/zapx"
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
			"zh": "{0}长度必须不超过128，仅支持中英文、数字、下划线及中划线",
			"en": "{0}长度必须不超过128，仅支持中英文、数字、下划线及中划线",
		},
	},
	{
		tag:           "VerifyName128NoSpace",
		validatorFunc: VerifyName128NoSpace,
		trans: map[string]string{
			"zh": "{0}必填，长度不能超过128个字符",
			"en": "{0}必填，长度不能超过128个字符",
		},
	},
	{
		tag:           "VerifyName255NoSpace",
		validatorFunc: VerifyName255NoSpace,
		trans: map[string]string{
			"zh": "{0}必填，长度不能超过255个字符",
			"en": "{0}必填，长度不能超过255个字符",
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
		tag:           "VerifyNameNotRequired",
		validatorFunc: VerifyNameNotRequired,
		trans: map[string]string{
			"zh": "{0}长度必须不超过128，仅支持中英文、数字、下划线及中划线",
			"en": "{0}长度必须不超过128，仅支持中英文、数字、下划线及中划线",
		},
	},
	{
		tag:           "VerifyNameTrimSpace1To128",
		validatorFunc: VerifyNameTrimSpace1To128,
		trans: map[string]string{
			"zh": "{0}长度必须不超过128，且首尾不包括空白字符",
			"en": "{0}长度必须不超过128，且首尾不包括空白字符",
		},
	},
	{
		tag:           "VerifyNameEN",
		validatorFunc: VerifyNameEN,
		trans: map[string]string{
			"zh": "{0}长度必须不超过128，仅支持英文、数字、下划线",
			"en": "{0}长度必须不超过128，仅支持英文、数字、下划线",
		},
	},
	{
		tag:           "VerifyNameEN255",
		validatorFunc: VerifyNameEN255,
		trans: map[string]string{
			"zh": "{0}长度必须不超过255，仅支持英文、数字、下划线，且必须以字母开头",
			"en": "{0}长度必须不超过255，仅支持英文、数字、下划线，且必须以字母开头",
		},
	},
	{
		tag:           "VerifyNameEN255d",
		validatorFunc: VerifyNameEN255d,
		trans: map[string]string{
			"zh": "{0}长度必须不超过255，仅支持英文、数字、下划线，且必须以字母或数字开头",
			"en": "{0}长度必须不超过255，仅支持英文、数字、下划线，且必须以字母或数字开头",
		},
	},
	{
		tag:           "VerifyNameEN300",
		validatorFunc: VerifyNameEN300,
		trans: map[string]string{
			"zh": "{0}长度必须不超过300，仅支持英文、数字、下划线，且必须以字母开头",
			"en": "{0}长度必须不超过300，仅支持英文、数字、下划线，且必须以字母开头",
		},
	},
	{
		tag:           "VerifyNameENStandard",
		validatorFunc: VerifyNameENStandard,
		trans: map[string]string{
			"zh": "{0}长度必须不超过128，仅支持英文、数字、下划线、中划线，且不能以下划线和中划线开头",
			"en": "{0}长度必须不超过128，仅支持英文、数字、下划线、中划线，且不能以下划线和中划线开头",
		},
	}, {
		tag:           "VerifyValueRange",
		validatorFunc: VerifyValueRange,
		trans: map[string]string{
			"zh": "{0}仅支持中英文、数字及键盘上的特殊字符",
			"en": "{0}仅支持中英文、数字及键盘上的特殊字符",
		},
	}, {
		tag:           "VerifyTag",
		validatorFunc: VerifyTag,
		trans: map[string]string{
			"zh": "{0}仅支持中英文、数字及键盘上的特殊字符",
			"en": "{0}仅支持中英文、数字及键盘上的特殊字符",
		},
	}, {
		tag:           "VerifyNameStandard",
		validatorFunc: VerifyNameStandard,
		trans: map[string]string{
			"zh": "{0}长度必须不超过128，仅支持中英文、数字、下划线、中划线，且不能以下划线和中划线开头",
			"en": "{0}长度必须不超过128，仅支持中英文、数字、下划线、中划线，且不能以下划线和中划线开头",
		},
	}, {
		tag:           "VerifyNameENNotRequired",
		validatorFunc: VerifyNameENNotRequired,
		trans: map[string]string{
			"zh": "{0}长度必须不超过128，仅支持英文、数字、下划线",
			"en": "{0}长度必须不超过128，仅支持英文、数字、下划线",
		},
	}, {
		tag:           "VerifyNameStandardNotRequired",
		validatorFunc: VerifyNameStandardNotRequired,
		trans: map[string]string{
			"zh": "{0}长度必须不超过128，仅支持中英文、数字以及_ -  、（ ）",
			"en": "{0}长度必须不超过128，仅支持中英文、数字以及_ -  、（ ）",
		},
	}, {
		tag:           "VerifyNameNotTrimSpace",
		validatorFunc: VerifyNameNotTrimSpace,
		trans: map[string]string{
			"zh": "{0}长度必须不超过128，仅支持中英文、数字、下划线及中划线",
			"en": "{0}长度必须不超过128，仅支持中英文、数字、下划线及中划线",
		},
	}, {
		tag:           "VerifyName128NoSpaceNoSlash",
		validatorFunc: VerifyName128NoSpaceNoSlash,
		trans: map[string]string{
			"zh": "{0}长度必须不超过128，不支持反斜杠",
			"en": "{0}长度必须不超过128，不支持反斜杠",
		},
	}, {
		tag:           "VerifyDescription128",
		validatorFunc: VerifyDescription128,
		trans: map[string]string{
			"zh": "{0}长度必须不超过128，仅支持中英文、数字及键盘上的特殊字符",
			"en": "{0}长度必须不超过128，仅支持中英文、数字及键盘上的特殊字符",
		},
	}, {
		tag:           "VerifyDescription255",
		validatorFunc: VerifyDescription255,
		trans: map[string]string{
			"zh": "{0}长度必须不超过255，仅支持中英文、数字及键盘上的特殊字符",
			"en": "{0}长度必须不超过255，仅支持中英文、数字及键盘上的特殊字符",
		},
	},
	{
		tag:           "VerifyDescription300",
		validatorFunc: VerifyDescription300,
		trans: map[string]string{
			"zh": "{0}长度不能超过300个字符",
			"en": "{0}长度不能超过300个字符",
		},
	},
	{
		tag:           "VerifyDescription255Must",
		validatorFunc: VerifyDescription255Must,
		trans: map[string]string{
			"zh": "{0}长度必须不超过255，仅支持中英文、数字及键盘上的特殊字符",
			"en": "{0}长度必须不超过255，仅支持中英文、数字及键盘上的特殊字符",
		},
	}, {
		tag:           "VerifyOperationLogicArray",
		validatorFunc: VerifyOperationLogicArray,
		trans: map[string]string{
			"zh": "{0}元素的长度必须不超过128，仅支持中英文、数字及键盘上的特殊字符",
			"en": "{0}元素的长度必须不超过128，仅支持中英文、数字及键盘上的特殊字符",
		},
	},
	{
		tag:           "VerifyStandardDescription",
		validatorFunc: VerifyStandardDescription,
		trans: map[string]string{
			"zh": "{0}长度必须在0-128之间，仅支持中英文、数字及键盘上的特殊字符",
			"en": "{0}长度必须在0-128之间，仅支持中英文、数字及键盘上的特殊字符",
		},
	},
	{
		tag:           "VerifyFusionField",
		validatorFunc: VerifyFusionField,
		trans: map[string]string{
			"zh": "{0}长度必须不超过128，仅支持中英文、数字以及_ -  、（ ）",
			"en": "{0}长度必须不超过128，仅支持中英文、数字以及_ -  、（ ）",
		},
	},
	{
		tag:           "integer",
		validatorFunc: integer,
		trans: map[string]string{
			"zh": "参数必须是正整",
			"en": "参数必须是正整",
		},
	}, {
		tag:           "variableSort",
		validatorFunc: variableSort,
		trans:         map[string]string{},
	}, {
		tag:           "variableDirection",
		validatorFunc: variableDirection,
		trans:         map[string]string{},
	}, {
		tag:           "TrimSpace",
		validatorFunc: trimSpace,
		trans:         map[string]string{},
	},
	{
		tag:           "VerifyUnit",
		validatorFunc: VerifyUnit,
		trans: map[string]string{
			"zh": "{0}长度必须不超过128，仅支持中英文、数字及键盘上的特殊字符",
			"en": "{0}长度必须不超过128，仅支持中英文、数字及键盘上的特殊字符",
		},
	},

	{
		tag:           "verifyMultiUuid",
		validatorFunc: verifyMultiUuid,
		trans: map[string]string{
			"zh": "{0}不是一个合格的逗号分隔的uuid数组",
			"en": "{0}不是一个合格的逗号分隔的uuid数组",
		},
	},
	{
		tag:           "verifyEnum",
		validatorFunc: verifyEnum,
		trans: map[string]string{
			"zh": "{0}的值必须是[{1}]其中之一",
			"en": "{0}的值必须是[{1}]其中之一",
		},
		translationFunc: EnumTranslation,
	},
	{
		tag:           "maxLen",
		validatorFunc: maxLen,
		trans: map[string]string{
			"zh": "{0}的长度必须不超过{1}",
			"en": "{0}的长度必须不超过{1}",
		},
		translationFunc: maxLenTranslation,
	},
	{
		tag:           "VerifyModelID",
		validatorFunc: verifyModelID,
		trans: map[string]string{
			"zh": "{0}必须是大于0的字符串数字",
			"en": "{0}必须是大于0的字符串数字",
		},
	},
	{
		tag:           "VerifyMultiSubjectDomainObjectType",
		validatorFunc: VerifyMultiSubjectDomainObjectType,
		trans: map[string]string{
			"zh": "{0}对象类型枚举值必须是 subject_domain_group,subject_domain,business_object business_activity中的一个或多个，多个用逗号分隔",
			"en": "{0}任务类型枚举值必须是 subject_domain_group,subject_domain,business_object business_activity中的一个或多个，多个用逗号分隔",
		},
	},

	{
		tag:           "VerifyDateString",
		validatorFunc: VerifyDateString,
		trans: map[string]string{
			"zh": "{0}日期格式必须符合2021-01-01",
			"en": "{0}日期格式必须符合2021-01-01",
		},
	},
	{
		tag:           "VerifyTimeString",
		validatorFunc: VerifyTimeString,
		trans: map[string]string{
			"zh": "{0}时间格式必须符合13:05",
			"en": "{0}时间格式必须符合13:05",
		},
	},
	{
		tag:           "VerifyDataType",
		validatorFunc: VerifyDataType,
		trans: map[string]string{
			"zh": "{0}字段类型不符合要求",
			"en": "{0}字段类型不符合要求",
		},
	}, {
		tag:           "VerifyXssString",
		validatorFunc: VerifyXssString,
		trans: map[string]string{
			"zh": "{0}不支持insert、drop、delete等输入",
			"en": "{0}不支持insert、drop、delete等输入",
		},
	},
}

func VerifyXssString(fl validator.FieldLevel) bool {
	// can be empty
	f := fl.Field().String()
	f = strings.TrimSpace(f)
	f = util.XssEscape(f)
	fl.Field().SetString(f)
	return true
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
func VerifyName128NoSpace(fl validator.FieldLevel) bool {
	f := fl.Field().String()
	f = strings.TrimSpace(f)
	fl.Field().SetString(f)
	if f == "" {
		return false
	}
	return len([]rune(f)) <= 128
}

func VerifyName128NoSpaceNoSlash(fl validator.FieldLevel) bool {
	f := fl.Field().String()
	f = strings.TrimSpace(f)
	fl.Field().SetString(f)
	if f == "" {
		return false
	}
	if len([]rune(f)) > 128 {
		return false
	}

	return !strings.ContainsAny(f, "\\/")
}

func VerifyName255NoSpace(fl validator.FieldLevel) bool {
	f := fl.Field().String()
	f = strings.TrimSpace(f)
	fl.Field().SetString(f)
	if f == "" {
		return false
	}
	return len([]rune(f)) <= 255
}

func VerifyNameTrimSpace1To128(fl validator.FieldLevel) bool {
	f := fl.Field().String()
	f = strings.TrimSpace(f) //去掉首尾的空格和tab等空白字符
	fl.Field().SetString(f)

	// 当长度小于1或长度大于128，校验不通过
	if len([]rune(f)) < 1 || len([]rune(f)) > 128 {
		return false
	}

	return true
}

// VerifyName255 Must Have
func VerifyName255(fl validator.FieldLevel) bool {
	f := fl.Field().String()
	f = strings.TrimSpace(f)
	fl.Field().SetString(f)

	if len([]rune(f)) > 255 {
		return false
	}
	compile := regexp.MustCompile("^[a-zA-Z0-9\u4e00-\u9fa5-_]+$")
	return compile.Match([]byte(f))
}

// VerifyNameNotRequired not required 仅支持中英文、数字、下划线及中划线
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
	compile := regexp.MustCompile("^[a-zA-Z0-9_-]+$")
	return compile.Match([]byte(f))
}
func VerifyNameEN255(fl validator.FieldLevel) bool {
	f := fl.Field().String()
	f = strings.TrimSpace(f)
	fl.Field().SetString(f)
	if len([]rune(f)) > 255 {
		return false
	}
	compile := regexp.MustCompile("^[a-zA-Z]+[a-zA-Z0-9_]*$")
	return compile.Match([]byte(f))
}
func VerifyNameEN255d(fl validator.FieldLevel) bool {
	f := fl.Field().String()
	f = strings.TrimSpace(f)
	fl.Field().SetString(f)
	if len([]rune(f)) > 255 {
		return false
	}
	compile := regexp.MustCompile("^[a-zA-Z0-9]+[a-zA-Z0-9_]*$")
	return compile.Match([]byte(f))
}
func VerifyNameEN300(fl validator.FieldLevel) bool {
	f := fl.Field().String()
	f = strings.TrimSpace(f)
	fl.Field().SetString(f)
	if len([]rune(f)) > 300 {
		return false
	}
	compile := regexp.MustCompile("^[a-zA-Z]+[a-zA-Z0-9_]*$")
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
	compile := regexp.MustCompile("^[!-~a-zA-Z0-9_\u4e00-\u9fa5 ！￥……（）——“”：；，。？、‘’《》｛｝【】·+()\\[\\],+\\-<>:;':~\"~=\\s]*$")
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

// VerifyDescription300  字符不限制
func VerifyDescription300(fl validator.FieldLevel) bool {
	// can be empty
	f := fl.Field().String()
	f = strings.TrimSpace(f)
	fl.Field().SetString(f)
	return len([]rune(f)) <= 300
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

	return len([]rune(f)) <= 128

	//if len([]rune(f)) > 128 {
	//	return false
	//}
	//compile := regexp.MustCompile("^[a-zA-Z0-9_\u4e00-\u9fa5- ！￥……（）——“”：；，。？、‘’《》｛｝【】·\\s]*$")
	//return compile.Match([]byte(f))

}

func VerifyValueRange(fl validator.FieldLevel) bool {
	// can be empty
	f := fl.Field().String()
	f = strings.TrimSpace(f)
	fl.Field().SetString(f)

	compile := regexp.MustCompile("^[!@#$%^&*]+$")
	if compile.Match([]byte(f)) {
		return false
	}

	compile = regexp.MustCompile("^[!-~a-zA-Z0-9_\u4e00-\u9fa5- ！￥……（）——“”：；，。？、‘’《》｛｝【】·\\s]*$")
	return compile.Match([]byte(f))
}

func verifyMultiUuid(fl validator.FieldLevel) bool {
	f := fl.Field().String()
	f = strings.TrimSpace(f)
	fl.Field().SetString(f)
	if f == "" {
		return true
	}

	uUIDRegexString := "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"
	regexPattern := regexp.MustCompile(uUIDRegexString)

	arr := strings.Split(f, ",")
	for i := 0; i < len(arr); i++ {
		arr[i] = strings.TrimSpace(arr[i])
		if !regexPattern.MatchString(arr[i]) {
			return false
		}
	}
	f = strings.Join(arr, ",")
	fl.Field().SetString(f)
	return true
}

// maxLen max size verify for string
func maxLen(fl validator.FieldLevel) bool {
	field := fl.Field()
	param := fl.Param()

	length := util.AsInt(param)
	if length <= 0 {
		panic(fmt.Errorf("invalid len %d", length))
	}

	switch field.Kind() {
	case reflect.String:
		return int64(utf8.RuneCountInString(field.String())) <= length
	case reflect.Slice, reflect.Map, reflect.Array:
		return int64(field.Len()) <= length
	default:
		panic(fmt.Errorf("invalid type %v", field.Kind()))
	}
}

func verifyEnum(fl validator.FieldLevel) bool {
	objectName := fl.Param()
	value := fl.Field().String()
	if objectName == "" {
		panic("empty validator parameter")
	}
	if value == "" {
		return false
	}
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

func VerifyTag(fl validator.FieldLevel) bool {
	f := fl.Field().String()
	f = strings.TrimSpace(f)
	fl.Field().SetString(f)

	compile := regexp.MustCompile("^[!-~a-zA-Z0-9_\u4e00-\u9fa5- ！￥……（）——“”：；，。？、‘’《》｛｝【】·\\s]*$")
	return compile.Match([]byte(f))
}

func ValidDesc(str string, length int) bool {
	if len([]rune(str)) > length {
		return false
	}
	compile := regexp.MustCompile("^[!-~a-zA-Z0-9_\u4e00-\u9fa5- ！￥……（）——“”：；，。？、‘’《》｛｝【】·\\s]*$")
	return compile.Match([]byte(str))
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

func VerifyMultiSubjectDomainObjectType(fl validator.FieldLevel) bool {
	f := fl.Field().String()
	f = strings.TrimSpace(f)
	fl.Field().SetString(f)
	if f == "" {
		return true
	}

	arr := strings.Split(f, ",")
	for i := 0; i < len(arr); i++ {
		arr[i] = strings.TrimSpace(arr[i])
		if _, ok := constant.SubjectDomainObjectTypeStringToObjectType[constant.SubjectDomainObjectTypeString(arr[i])]; !ok {
			return false
		}
	}
	f = strings.Join(arr, ",")
	fl.Field().SetString(f)
	return true
}

func VerifyDateString(fl validator.FieldLevel) bool {
	//日期格式必须符合2021-01-01
	f := fl.Field().String()
	compile := regexp.MustCompile("^\\d{4}-\\d{2}-\\d{2}$")
	return compile.Match([]byte(f))
}
func VerifyTimeString(fl validator.FieldLevel) bool {
	//时间格式必须符合13:12
	f := fl.Field().String()
	compile := regexp.MustCompile("^\\d{2}:\\d{2}$")
	return compile.Match([]byte(f))
}
func VerifyDataType(fl validator.FieldLevel) bool {
	//时间格式必须符合13:12
	f := fl.Field().String()
	f = strings.ToLower(f)
	fl.Field().SetString(f)
	_, ok := DataTypeMap[f]
	return ok
}

var DataTypeMap = map[string]int{
	"int":       1,
	"string":    2,
	"boolean":   3,
	"decimal":   4,
	"timestamp": 5,
	"smallint":  6,
	"tinyint":   7,
	"binary":    8,
	"varchar":   9,
	"char":      10,
	"date":      11,
	"double":    12,
	"bigint":    13,
	"float":     14,
	"datetime":  15,
	"mediumint": 16,
	//补充导入数据源的MySQL/MariaDb，PostGre，SQLServer等类型
	// MySQL
	"int unsigned":       17,
	"tinyint unsigned":   18,
	"smallint unsigned":  19,
	"mediumint unsigned": 20,
	"bigint unsigned":    21,

	"blob":       22,
	"tinyblob":   23,
	"mediumblob": 24,
	"longblob":   25,

	"text":       26,
	"tinytext":   27,
	"mediumtext": 28,
	"longtext":   29,

	"bit":       30,
	"enum":      31,
	"time":      32,
	"year":      33,
	"json":      34,
	"numeric":   35,
	"set":       36,
	"varbinary": 37,

	//SQL Server
	"money":            40,
	"smallmoney":       41,
	"uniqueidentifier": 42,
	"xml":              43,
	"sysname":          44,
	"sql_variant":      45,
	"smalldatetime":    46,
	"nvarchar":         47,
	"real":             48,
	"image":            49,
	"hierarchyid":      50,
	"geography":        51,
	"geometry":         52,
	"datetime2":        53,
	"ntext":            54,
	"nchar":            55,

	//PostGre
	"uuid":        60,
	"timestamptz": 61,
	"timetz":      62,
	"smallserial": 63,
	"serial4":     64,
	"oid":         65,
	"name":        66,
	"jsonb":       67,
	"int8":        68,
	"int2":        69,
	"float4":      70,
	"float8":      71,
	"bpchar":      72,
	"bytea":       73,
	"bigserial":   74,
	"serial":      75,
	"bool":        76,
	"int4":        77,

	// Oracle
	"binary_double": 90,
	"binary_float":  91,
	"number":        92,
	"raw":           93,
	"rowid":         94,
	"urowid":        95,
	"varchar2":      96,
	"nvarchar2":     97,

	//hive
	"array":  100,
	"map":    101,
	"struct": 102,
}
