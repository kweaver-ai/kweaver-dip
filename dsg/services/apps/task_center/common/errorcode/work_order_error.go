package errorcode

const (
	WorkOrderInvalidParameter     = workOrderPreCoder + "InvalidParameter"
	WorkOrderInvalidParameterJson = workOrderPreCoder + "InvalidParameterJson"
	WorkOrderNameRepeatError      = workOrderPreCoder + "NameRepeatError"
	WorkOrderDatabaseError        = workOrderPreCoder + "DatabaseError"
	WorkOrderIdNotExistError      = workOrderPreCoder + "WorkOrderIdNotExistError"
	WorkOrderDeleteError          = workOrderPreCoder + "WorkOrderDeleteError"
	WorkOrderEditError            = workOrderPreCoder + "WorkOrderEditError"
	WorkOrderUndoError            = workOrderPreCoder + "WorkOrderUndoError"
	WorkOrderAuditNotPass         = workOrderPreCoder + "WorkOrderAuditNotPass"
	WhereOpNotAllowed             = workOrderPreCoder + "WhereOpNotAllowed"
	NonSynchronizedWorkOrderType  = workOrderPreCoder + "NonSynchronizedWorkOrderType"
	WorkOrderSyncDisabled         = workOrderPreCoder + "WorkOrderSyncDisabled"
	WorkOrderSyncError            = workOrderPreCoder + "WorkOrderSyncError"
)

var workOrderErrorMap = errorCode{
	WorkOrderInvalidParameter: {
		description: "参数值校验不通过",
		solution:    SeeAPIManual,
	},
	WorkOrderInvalidParameterJson: {
		description: "参数值校验不通过：json格式错误",
		solution:    SeeAPIManual,
	},
	WorkOrderNameRepeatError: {
		description: "该工单名称已存在，请重新输入",
		solution:    "请检查输入的工单名称",
	},
	WorkOrderDatabaseError: {
		description: "数据库连接错误或者SQL语句错误",
		solution:    CheckDatabaseOrSyntax,
	},
	WorkOrderIdNotExistError: {
		description: "该工单不存在",
		solution:    "请检查输入的工单ID",
	},
	WorkOrderDeleteError: {
		description: "当前状态不允许删除",
		solution:    "处于审核中或者已申报的工单不可以删除",
	},
	WorkOrderEditError: {
		description: "当前状态不允许编辑",
		solution:    "审核处于审核中, 或者状态为已经申报的工单,不可以编辑",
	},
	WorkOrderUndoError: {
		description: "当前状态不允许撤回",
		solution:    "只有审核状态为审核中的可以撤回",
	},
	WorkOrderAuditNotPass: {
		description: "工单未通过审核",
	},
	WhereOpNotAllowed: {
		description: "非法的过滤条件",
		cause:       "",
		solution:    "检查过滤条件",
	},
	NonSynchronizedWorkOrderType: {
		description: "不支持同步的工单类型[%s]",
	},
	WorkOrderSyncDisabled: {
		description: "未开启工单同步至第三方",
	},
	WorkOrderSyncError: {
		description: "工单同步失败",
	},
}
