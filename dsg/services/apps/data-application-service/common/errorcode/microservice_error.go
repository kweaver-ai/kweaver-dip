package errorcode

import "github.com/kweaver-ai/dsg/services/apps/data-application-service/common/constant"

func init() {
	registerErrorCode(microserviceErrorMap)
}

const (
	microserviceModelName = "MicroService"
)

// Demo error
const (
	microservicePreCoder = constant.ServiceName + "." + microserviceModelName + "."

	MicroServiceRequestError = microservicePreCoder + "RequestError"

	MicroServiceVirtualEngineError = microservicePreCoder + "VirtualEngineError"
)

var microserviceErrorMap = errorCode{
	MicroServiceVirtualEngineError: {
		description: "虚拟化引擎服务请求错误",
		solution:    "请重试",
	},
}
