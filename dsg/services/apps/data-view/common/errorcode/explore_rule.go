package errorcode

import (
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/constant"
	"github.com/kweaver-ai/idrm-go-common/errorcode"
)

func init() {
	errorcode.RegisterErrorCode(exploreRuleErrorMap)
}

const (
	exploreRulePreCoder = constant.ServiceName + ".ExploreRule."

	ExploreRuleDatabaseError = exploreRulePreCoder + "DatabaseError"
	RuleIdNotExist           = exploreRulePreCoder + "RuleIdNotExist"
	ExploreRuleRepeat        = exploreRulePreCoder + "ExploreRuleRepeat"
	TemplateIdNotExist       = exploreRulePreCoder + "TemplateIdNotExist"
	RuleConfigError          = exploreRulePreCoder + "RuleConfigError"
	RuleAlreadyExists        = exploreRulePreCoder + "RuleAlreadyExists"
)

var exploreRuleErrorMap = errorcode.ErrorCode{
	ExploreRuleDatabaseError: {
		Description: "数据库异常",
		Cause:       "",
		Solution:    "",
	},
	RuleIdNotExist: {
		Description: "规则id不存在",
		Cause:       "",
		Solution:    "",
	},
	ExploreRuleRepeat: {
		Description: "规则名称重复",
		Cause:       "",
		Solution:    "",
	},
	TemplateIdNotExist: {
		Description: "模板id不存在",
		Cause:       "",
		Solution:    "",
	},
	RuleConfigError: {
		Description: "规则配置错误",
		Cause:       "",
		Solution:    "请检查任务配置是否正确",
	},
	RuleAlreadyExists: {
		Description: "规则已存在",
		Cause:       "",
		Solution:    "",
	},
}
