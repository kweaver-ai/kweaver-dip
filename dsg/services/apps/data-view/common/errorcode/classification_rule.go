package errorcode

import (
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/constant"
	"github.com/kweaver-ai/idrm-go-common/errorcode"
)

func init() {
	errorcode.RegisterErrorCode(ClassificationRuleErrorMap)
}

const (
	classificationRulePreCoder = constant.ServiceName + ".ClassificationRule."

	ClassificationRuleDatabaseError = classificationRulePreCoder + "DatabaseError"
	ClassificationRuleIsExist       = classificationRulePreCoder + "IsExist"
	ClassificationRuleNotFound      = classificationRulePreCoder + "NotFound"
	ClassificationRuleNotInUse      = classificationRulePreCoder + "NotInUse"
	ClassificationRuleInUse         = classificationRulePreCoder + "InUse"
	ClassificationRuleInvalidStatus = classificationRulePreCoder + "InvalidStatus"
)

var ClassificationRuleErrorMap = errorcode.ErrorCode{
	ClassificationRuleDatabaseError: {
		Description: "数据库异常",
		Cause:       "",
		Solution:    "",
	},
	ClassificationRuleIsExist: {
		Description: "分类规则已存在",
		Cause:       "",
		Solution:    "",
	},
	ClassificationRuleNotFound: {
		Description: "分类规则不存在",
		Cause:       "",
		Solution:    "",
	},
	ClassificationRuleNotInUse: {
		Description: "分类规则已停用",
		Cause:       "",
		Solution:    "",
	},
	ClassificationRuleInUse: {
		Description: "分类规则正在使用中",
		Cause:       "",
		Solution:    "",
	},
	ClassificationRuleInvalidStatus: {
		Description: "分类规则状态无效",
		Cause:       "",
		Solution:    "",
	},
}
