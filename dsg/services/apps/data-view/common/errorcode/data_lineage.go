package errorcode

import (
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/constant"
	"github.com/kweaver-ai/idrm-go-common/errorcode"
)

func init() {
	errorcode.RegisterErrorCode(lineageErrorMap)
}

const lineagePreCoder = constant.ServiceName + ".data_lineage."

const (
	GetTableFailed           = lineagePreCoder + "GetTableFailed"
	LineageReqFailed         = lineagePreCoder + "LineageReqFailed"
	TableNotFound            = lineagePreCoder + "TableNotFound"
	GetDataSourceFailed      = lineagePreCoder + "GetDataSourceFailed"
	FulltextSearchFailed     = lineagePreCoder + "FulltextSearchFailed"
	RedisOpeFailed           = lineagePreCoder + "RedisOpeFailed"
	GetAccessPermissionError = UserPreCoder + "GetAccessPermissionError"
	GetInfoSystemDetail      = drivenPreCoder + "GetInfoSystemDetail"
	GetStatusCheck           = drivenPreCoder + "GetStatusCheck"
)

var lineageErrorMap = errorcode.ErrorCode{
	LineageReqFailed: {
		Description: "请求失败，未获取到数据",
		Cause:       "",
		Solution:    "请检查后重试",
	},
	GetTableFailed: {
		Description: "请求失败，未获取到数据",
		Cause:       "",
		Solution:    "请检查元数据平台服务是否正常",
	},
	TableNotFound: {
		Description: "请求失败，未获取到数据",
		Cause:       "",
		Solution:    "请检查table id是否正确",
	},
	GetDataSourceFailed: {
		Description: "请求失败，未获取到数据",
		Cause:       "",
		Solution:    "请检查元数据平台服务是否正常",
	},
	FulltextSearchFailed: {
		Description: "请求失败，未获取到数据",
		Cause:       "",
		Solution:    "全文检索请求失败，请检查AnyData服务是否正常",
	},
	RedisOpeFailed: {
		Description: "请求失败，未获取到数据",
		Cause:       "",
		Solution:    "操作redis请求失败，请检查redis服务是否正常",
	},
	GetAccessPermissionError: {
		Description: "获取访问权限失败",
		Cause:       "",
		Solution:    "请重试",
	},
	GetInfoSystemDetail: {
		Description: "获取配置中心信息系统信息失败",
		Cause:       "",
		Solution:    "请重试",
	},
	GetStatusCheck: {
		Description: "获取配置中心信息系统信息失败",
		Cause:       "",
		Solution:    "请重试",
	},
}
