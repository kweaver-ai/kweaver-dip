package errorcode

import (
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/constant"
	"github.com/kweaver-ai/idrm-go-common/errorcode"
)

func init() {
	errorcode.RegisterErrorCode(GradeRuleGroupErrorMap)
}

const (
	gradeRuleGroupPreCoder         = constant.ServiceName + ".GradeRuleGroup."
	GradeRuleGroupDatabaseError    = gradeRuleGroupPreCoder + "DatabaseError"
	GradeRuleGroupIsExist          = gradeRuleGroupPreCoder + "IsExist"
	GradeRuleGroupNotFound         = gradeRuleGroupPreCoder + "NotFound"
	GradeRuleGroupCountLimit       = gradeRuleGroupPreCoder + "CountLimit"
	GradeRuleGroupDeleteNotAllowed = gradeRuleGroupPreCoder + "DeleteNotAllowed"
)

var GradeRuleGroupErrorMap = errorcode.ErrorCode{
	GradeRuleGroupDatabaseError: {
		Description: "数据库异常",
		Cause:       "",
		Solution:    "",
	},
	GradeRuleGroupIsExist: {
		Description: "规则组已存在",
		Cause:       "",
		Solution:    "",
	},
	GradeRuleGroupNotFound: {
		Description: "规则组不存在",
		Cause:       "",
		Solution:    "",
	},
	GradeRuleGroupCountLimit: {
		Description: "规则组数量超过上限",
		Cause:       "",
		Solution:    "",
	},
	GradeRuleGroupDeleteNotAllowed: {
		Description: "规则组存在规则，不允许删除",
		Cause:       "",
		Solution:    "",
	},
}
