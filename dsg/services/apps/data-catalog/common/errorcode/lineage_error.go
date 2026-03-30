package errorcode

import "github.com/kweaver-ai/dsg/services/apps/data-catalog/common/constant"

func init() {
	registerErrorCode(lineageErrorMap)
}

// Lineage error
const (
	lineagePreCoder = constant.ServiceName + "." + lineageModelName + "."

	LineageReqFailed     = lineagePreCoder + "LineageReqFailed"
	CatalogNotFound      = lineagePreCoder + "CatalogNotFound"
	GetTableFailed       = lineagePreCoder + "GetTableFailed"
	TableNotFound        = lineagePreCoder + "TableNotFound"
	GetDataSourceFailed  = lineagePreCoder + "GetDataSourceFailed"
	FulltextSearchFailed = lineagePreCoder + "FulltextSearchFailed"
	RedisOpeFailed       = lineagePreCoder + "RedisOpeFailed"
)

var lineageErrorMap = errorCode{
	LineageReqFailed: {
		description: "请求失败，未获取到数据",
		cause:       "",
		solution:    "请检查后重试",
	},
	CatalogNotFound: {
		description: "数据资源目录或挂载记录不存在",
		cause:       "",
		solution:    "请检查后重试",
	},
	GetTableFailed: {
		description: "请求失败，未获取到数据",
		cause:       "",
		solution:    "请检查元数据平台服务是否正常",
	},
	TableNotFound: {
		description: "请求失败，未获取到数据",
		cause:       "",
		solution:    "请检查table id是否正确",
	},
	GetDataSourceFailed: {
		description: "请求失败，未获取到数据",
		cause:       "",
		solution:    "请检查元数据平台服务是否正常",
	},
	FulltextSearchFailed: {
		description: "请求失败，未获取到数据",
		cause:       "",
		solution:    "全文检索请求失败，请检查AnyData服务是否正常",
	},
	RedisOpeFailed: {
		description: "请求失败，未获取到数据",
		cause:       "",
		solution:    "操作redis请求失败，请检查redis服务是否正常",
	},
}
