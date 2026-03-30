package errorcode

const (
	OperationLogInvalidParameter = operationLogPreCoder + "InvalidParameter"
	OperationLogDatabaseError    = operationLogPreCoder + "DatabaseError"
)

var operationLogErrorMap = errorCode{
	OperationLogInvalidParameter: {
		description: "参数值校验不通过",
		solution:    SeeAPIManual,
	},
	OperationLogDatabaseError: {
		description: "数据库连接错误或者SQL语句错误",
		cause:       "",
		solution:    CheckDatabaseOrSyntax,
	},
}
