package errorcode

const (
	TenantApplicationNameRepeatError = TenantApplicationPreCoder + "TenantApplicationNameRepeatError"
	TenantApplicationDatabaseError   = TenantApplicationPreCoder + "DatabaseError"
	TenantApplicationIdNotExistError = TenantApplicationPreCoder + "TenantApplicationIdNotExistError"
	TenantApplicationDeleteError     = TenantApplicationPreCoder + "TenantApplicationDeleteError"
	TenantApplicationEditError       = TenantApplicationPreCoder + "TenantApplicationEditError"
	TenantApplicationUndoError       = TenantApplicationPreCoder + "TenantApplicationUndoError"
)

var tenantApplicationErrorMap = errorCode{
	TenantApplicationNameRepeatError: {
		description: "该租户申请名称已存在，请重新输入",
		solution:    "请检查输入的租户申请名称",
	},
	TenantApplicationDatabaseError: {
		description: "数据库连接错误或者SQL语句错误",
		solution:    CheckDatabaseOrSyntax,
	},
	TenantApplicationIdNotExistError: {
		description: "该租户申请不存在",
		solution:    "请检查输入的租户申请ID",
	},
	TenantApplicationDeleteError: {
		description: "当前状态不允许删除",
		solution:    "处于审核中或者已申报的租户申请不可以删除",
	},
	TenantApplicationEditError: {
		description: "当前状态不允许编辑",
		solution:    "审核处于审核中,不可以编辑",
	},
	TenantApplicationUndoError: {
		description: "当前状态不允许撤回",
		solution:    "只有审核状态为审核中的可以撤回",
	},
}
