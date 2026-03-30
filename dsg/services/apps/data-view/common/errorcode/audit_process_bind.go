package errorcode

import (
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/constant"
	"github.com/kweaver-ai/idrm-go-common/errorcode"
)

func init() {
	errorcode.RegisterErrorCode(auditProcessBindErrorMap)
}

const (
	auditProcessBindPreCoder = constant.ServiceName + ".AuditProcessBind."

	ProcDefKeyNotFound      = auditProcessBindPreCoder + "ProcDefKeyNotFound"
	AuditProcessBindExist   = auditProcessBindPreCoder + "AuditProcessBindExist"
	AuditProcessIdNotExist  = auditProcessBindPreCoder + "AuditProcessIdNotExist"
	AuditProcessNotExist    = auditProcessBindPreCoder + "AuditProcessNotExist"
	AuditingExist           = auditProcessBindPreCoder + "AuditingExist"
	AuditTypeNotAllowed     = auditProcessBindPreCoder + "AuditTypeNotAllowed"
	ProcDefKeyNotExist      = auditProcessBindPreCoder + "ProcDefKeyNotExist"
	LogicViewAuditUndoError = auditProcessBindPreCoder + "LogicViewAuditUndoError"
)

var auditProcessBindErrorMap = errorcode.ErrorCode{
	ProcDefKeyNotFound: {
		Description: "数据库异常",
		Cause:       "",
		Solution:    "",
	},
	AuditProcessBindExist: {
		Description: "审核流程绑定已存在",
		Cause:       "",
		Solution:    "请重新选择审核流程",
	},
	AuditProcessIdNotExist: {
		Description: "审核流程绑定id不存在",
		Cause:       "",
		Solution:    "请重新选择审核流程",
	},
	AuditProcessNotExist: {
		Description: "审核发起失败, 未找到匹配的审核流程",
		Cause:       "",
		Solution:    "请先绑定审核流程",
	},
	AuditingExist: {
		Description: "当前有正在审核中的流程",
		Cause:       "",
		Solution:    "请稍后再试",
	},
	AuditTypeNotAllowed: {
		Description: "不支持发起当前类型审核",
		Cause:       "",
		Solution:    "请重新选择审核类型",
	},
	ProcDefKeyNotExist: {
		Description: "审核流程不存在",
		Cause:       "",
		Solution:    "请重新选择审核流程",
	},
	LogicViewAuditUndoError: {
		Description: "视图当前状态不符合要求，不能进行审核撤回操作",
		Cause:       "",
		Solution:    "请检查视图状态",
	},
}
