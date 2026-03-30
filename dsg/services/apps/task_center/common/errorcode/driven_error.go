package errorcode

const (
	GetGlossaryError   = drivenPreCoder + "GetGlossaryError"
	FinishProjectError = drivenPreCoder + "FinishProjectError"
)

var DrivenErrorMap = errorCode{
	GetGlossaryError: {
		description: "获取术语表下节点失败",
		cause:       "",
		solution:    "请重试",
	},
	FinishProjectError: {
		description: "同步数据表视图任务完成失败",
		cause:       "",
		solution:    "请重试",
	},
}
