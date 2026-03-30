package errorcode

func init() {
	registerErrorCode(queryErrorMap)
}

const (
	queryModelName = "Query"
)

// Demo error
const (
	queryPreCoder = ServiceName + "." + queryModelName + "."

	QueryError     = queryPreCoder + "QueryError"
	RateLimitError = queryPreCoder + "RateLimitError"
	// 接口服务的后端返回不支持的 content-type
	BackendUnsupportedContentType = queryPreCoder + "UnsupportedContentType"
)

var queryErrorMap = errorCode{
	QueryError: {
		description: "请求错误",
		cause:       "",
		solution:    "",
	},
	RateLimitError: {
		description: "请求频次限制",
		cause:       "",
		solution:    "请稍后再试",
	},
	BackendUnsupportedContentType: {
		description: "后端服务返回不支持的 Content-Type[%s]",
	},
}
