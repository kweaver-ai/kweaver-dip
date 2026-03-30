package errorcode

import (
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/constant"
	"github.com/kweaver-ai/idrm-go-common/errorcode"
)

func init() {
	errorcode.RegisterErrorCode(GradeRuleErrorMap)
}

const (
	gradeRulePreCoder      = constant.ServiceName + ".GradeRule."
	GradeRuleDatabaseError = gradeRulePreCoder + "DatabaseError"
	GradeRuleIsExist       = gradeRulePreCoder + "IsExist"
	GradeRuleNotFound      = gradeRulePreCoder + "NotFound"
	GradeRuleNotInUse      = gradeRulePreCoder + "NotInUse"
	GradeRuleInUse         = gradeRulePreCoder + "InUse"
	GradeRuleInvalidStatus = gradeRulePreCoder + "InvalidStatus"
	GradeRuleTypeInvalid   = gradeRulePreCoder + "TypeInvalid"
	GradeRuleCountLimit    = gradeRulePreCoder + "CountLimit"
)

var GradeRuleErrorMap = errorcode.ErrorCode{
	GradeRuleDatabaseError: {
		Description: "数据库异常",
		Cause:       "",
		Solution:    "",
	},
	GradeRuleIsExist: {
		Description: "分级规则已存在",
		Cause:       "",
		Solution:    "",
	},
	GradeRuleNotFound: {
		Description: "分级规则不存在",
		Cause:       "",
		Solution:    "",
	},
	GradeRuleNotInUse: {
		Description: "分级规则未启用或已停用",
		Cause:       "",
		Solution:    "",
	},
	GradeRuleInUse: {
		Description: "分级规则正在使用中",
		Cause:       "",
		Solution:    "",
	},
	GradeRuleInvalidStatus: {
		Description: "分级规则状态无效",
		Cause:       "",
		Solution:    "",
	},
	GradeRuleTypeInvalid: {
		Description: "分级规则类型无效",
		Cause:       "",
		Solution:    "",
	},
	GradeRuleCountLimit: {
		Description: "分级规则数量超过上限",
		Cause:       "",
		Solution:    "",
	},
}
