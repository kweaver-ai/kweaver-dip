package errorcode

const (
	PointsDatabaseError        = pointsPreCoder + "DatabaseError"
	PointsCodeNotExistError    = pointsPreCoder + "PointsCodeNotExistError"
	PointsCodeExistError       = pointsPreCoder + "PointsCodeExistError"
	PointsDeleteError          = pointsPreCoder + "PointsDeleteError"
	PointsEditError            = pointsPreCoder + "PointsEditError"
	PointsRuleConfigJsonError  = pointsPreCoder + "PointsRuleConfigJsonError"
	PointsInvalidParameter     = pointsPreCoder + "PointsInvalidParameter"
	PointsInvalidParameterJson = pointsPreCoder + "PointsInvalidParameterJson"
)

var pointsErrorMap = errorCode{
	ReportDatabaseError: {
		description: "数据库连接错误或者SQL语句错误",
		solution:    CheckDatabaseOrSyntax,
	},
	PointsCodeNotExistError: {
		description: "该策略不存在",
		solution:    "请检查输入的策略CODE",
	},
	PointsCodeExistError: {
		description: "该策略已存在",
		solution:    "请检查输入的策略CODE",
	},
	PointsDeleteError: {
		description: "该策略删除失败",
		solution:    "该策略删除失败",
	},
	PointsEditError: {
		description: "该策略编辑失败",
		solution:    "该策略编辑失败",
	},
	PointsRuleConfigJsonError: {
		description: "策略配置解析失败",
		solution:    "请检查输入的策略配置",
	},
	PointsInvalidParameter: {
		description: "参数值校验不通过",
		cause:       "",
		solution:    SeeAPIManual,
	},
	PointsInvalidParameterJson: {
		description: "参数值校验不通过：json格式错误",
		cause:       "",
		solution:    SeeAPIManual,
	},
}
