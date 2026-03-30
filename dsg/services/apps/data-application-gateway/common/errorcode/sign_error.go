package errorcode

func init() {
	registerErrorCode(signErrorMap)
}

const (
	signModelName = "Sign"
)

const (
	signPreCoder = ServiceName + "." + signModelName + "."

	SignValidateError = signPreCoder + "SignValidateError"
	TimestampRequired = signPreCoder + "TimestampRequired"
	TimestampError    = signPreCoder + "TimestampError"
	TimestampExpired  = signPreCoder + "TimestampExpired"
	AppIdRequired     = signPreCoder + "AppIdRequired"
	AppIdNotExist     = signPreCoder + "AppIdNotExist"
)

var signErrorMap = errorCode{
	SignValidateError: {
		description: "请求签名验证错误",
		cause:       "",
		solution:    "",
	},
	TimestampRequired: {
		description: "请求时间戳不能为空",
		cause:       "",
		solution:    "",
	},
	TimestampError: {
		description: "请求时间戳格式错误",
		cause:       "",
		solution:    "",
	},
	TimestampExpired: {
		description: "请求时间戳已过期",
		cause:       "",
		solution:    "",
	},
	AppIdRequired: {
		description: "AppId 不能为空",
		cause:       "",
		solution:    "",
	},
	AppIdNotExist: {
		description: "AppId 不存在",
		cause:       "",
		solution:    "请重新输入 AppId",
	},
}
