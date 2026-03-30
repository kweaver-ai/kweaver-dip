package errorcode

const (
	PlanNameRepeatError = planPreCoder + "NameRepeatError"
	PlanDatabaseError   = planPreCoder + "DatabaseError"
	PlanIdNotExistError = planPreCoder + "PlanIdNotExistError"
	PlanDeleteError     = planPreCoder + "PlanDeleteError"
	PlanEditError       = planPreCoder + "PlanEditError"
	PlanUndoError       = planPreCoder + "PlanUndoError"
)

var planErrorMap = errorCode{
	PlanNameRepeatError: {
		description: "该计划名称已存在，请重新输入",
		solution:    "请检查输入的计划名称",
	},
	PlanDatabaseError: {
		description: "数据库连接错误或者SQL语句错误",
		solution:    CheckDatabaseOrSyntax,
	},
	PlanIdNotExistError: {
		description: "该计划不存在",
		solution:    "请检查输入的计划ID",
	},
	PlanDeleteError: {
		description: "当前状态不允许删除",
		solution:    "处于审核中或者已申报的计划不可以删除",
	},
	PlanEditError: {
		description: "当前状态不允许编辑",
		solution:    "审核处于审核中, 或者状态为已经申报的计划,不可以编辑",
	},
	PlanUndoError: {
		description: "当前状态不允许撤回",
		solution:    "只有审核状态为审核中的可以撤回",
	},
}
