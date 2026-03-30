package errorcode

import (
	"github.com/kweaver-ai/dsg/services/apps/task_center/common"
	"github.com/kweaver-ai/idrm-go-frame/core/errorx"
)

var (
	publicModule  = errorx.New(common.ServiceName + ".Public.")
	sandboxModule = errorx.New(common.ServiceName + ".SandboxManagement.")
)

var (
	PublicQueryProjectError     = publicModule.Description("QueryProjectError", "项目不存在或查询项目信息错误")
	PublicQueryDepartmentError  = publicModule.Description("QueryDepartmentErrors", "部门不存在或查询部门信息错误")
	PublicQueryRoleError        = publicModule.Description("QueryRoleError", "查询用户角色服务错误")
	PublicDatabaseErr           = publicModule.Description("DatabaseError", "数据库异常")
	PublicQueryUserInfoError    = publicModule.Description("QueryUserInfoError", "查询用户信息错误")
	PublicInternalError         = publicModule.Description("InternalError", "内部错误")
	PublicResourceNotFoundError = publicModule.Description("ResourceNotFound", "资源不存在")
)

var (
	SandboxApplyNotExistError             = sandboxModule.Description("ApplyNotExistError", "沙箱申请不存在")
	SandboxGetAuditInfoError              = sandboxModule.Description("GetAuditInfoError", "获取审核模板信息错误")
	SendAuditApplyMsgError                = sandboxModule.Description("itApplyMsgError", "发送审核信息错误")
	SandboxInvalidOperation               = sandboxModule.Description("InvalidOperation", "非法操作")
	SandboxInvalidSpaceError              = sandboxModule.Description("InvalidSpace", "沙箱空间不可用，无法扩容")
	SandboxProjectOnlyHasOneApplyError    = sandboxModule.Description("ProjectOnlyHasOneApplyError", "项目只能有一个申请或扩容请求")
	SandboxOnlyProjectMemberCanApplyError = sandboxModule.Description("OnlyProjectMemberCanApplyError", "只有项目成员才可以申请或扩容")
	SandboxInvalidRevocation              = sandboxModule.Description("InvalidRevocation", "只有审核中的才能撤回")
	SandboxRevocationFailed               = sandboxModule.Description("RevocationFailed", "撤回失败")
	SandboxIsExecutingError               = sandboxModule.Description("IsExecutingError", "该‘申请/扩容’已经在实施中")
	SandboxIsExecutedError                = sandboxModule.Description("IsExecutedError", "该‘申请/扩容’已经实施完成")
	SandboxOnlyExecutingError             = sandboxModule.Description("OnlyExecutingError", "只允许从‘实施中’到‘实施完成’")
	SandboxOnlyWaitingError               = sandboxModule.Description("OnlyWaitingError", "只允许从‘申请中’到‘实施中’")
)
