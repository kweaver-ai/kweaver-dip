package errorcode

const (
	ReportNameRepeatError = reportPreCoder + "ReportNameRepeatError"
	ReportDatabaseError   = reportPreCoder + "DatabaseError"
	ReportIdNotExistError = reportPreCoder + "ReportIdNotExistError"
	ReportDeleteError     = reportPreCoder + "ReportDeleteError"
	ReportEditError       = reportPreCoder + "ReportEditError"
	ReportUndoError       = reportPreCoder + "ReportUndoError"
)

var reportErrorMap = errorCode{
	ReportNameRepeatError: {
		description: "该报告名称已存在，请重新输入",
		solution:    "请检查输入的报告名称",
	},
	ReportDatabaseError: {
		description: "数据库连接错误或者SQL语句错误",
		solution:    CheckDatabaseOrSyntax,
	},
	ReportIdNotExistError: {
		description: "该报告不存在",
		solution:    "请检查输入的报告ID",
	},
	ReportDeleteError: {
		description: "当前状态不允许删除",
		solution:    "处于审核中或者已申报的报告不可以删除",
	},
	ReportEditError: {
		description: "当前状态不允许编辑",
		solution:    "审核处于审核中,不可以编辑",
	},
	ReportUndoError: {
		description: "当前状态不允许撤回",
		solution:    "只有审核状态为审核中的可以撤回",
	},
}
