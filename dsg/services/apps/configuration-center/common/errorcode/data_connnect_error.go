package errorcode

import "github.com/kweaver-ai/dsg/services/apps/configuration-center/common/constant"

func init() {
	registerErrorCode(dataConnectErrorMap)
}

const (
	DrivenGetDataSourceDetailFailed = constant.ServiceName + "." + "DrivenGetDataSourceDetailFailed"
)

var dataConnectErrorMap = errorCode{
	DrivenGetDataSourceDetailFailed: {
		description: "查询数据源详情失败",
		cause:       "",
		solution:    "请检查数据连接服务",
	},
}
