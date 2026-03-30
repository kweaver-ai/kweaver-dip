package errorcode

import "github.com/kweaver-ai/dsg/services/apps/data-catalog/common/constant"

func init() {
	registerErrorCode(dataCatalogErrorMap)
}

// Tree error
const (
	dataCatalogPreCoder = constant.ServiceName + ".DataCatalog."

	DataCatalogNotFound           = dataCatalogPreCoder + "CatalogNotFound"
	DataCatalogDepartmentNotFound = dataCatalogPreCoder + "DataCatalogDepartmentNotFound"
	DataCatalogInfoSystemNotFound = dataCatalogPreCoder + "DataCatalogInfoSystemNotFound"
	DataCatalogSubjectNotFound    = dataCatalogPreCoder + "DataCatalogSubjectNotFound"
	CategoryNodeIdNotFound        = dataCatalogPreCoder + "CategoryNodeIdNotFound"
	CodeTableIDsVerifyFail        = dataCatalogPreCoder + "CodeTableIDsVerifyFail"
	StandardCodesVerifyFail       = dataCatalogPreCoder + "StandardCodesVerifyFail"
	DeleteDataCatalogFail         = dataCatalogPreCoder + "DeleteDataCatalogFail"
	CatalogNameRepeat             = dataCatalogPreCoder + "CatalogNameRepeat"
	DataResourceNotExist          = dataCatalogPreCoder + "DataResourceNotExist"
	DataResourceTypeNotSupport    = dataCatalogPreCoder + "DataResourceTypeNotSupport"
	ImportFileNotExist            = dataCatalogPreCoder + "ImportFileNotExist"
	OnlineNeedReport              = dataCatalogPreCoder + "OnlineNeedReport"
	ImportInvalidError            = dataCatalogPreCoder + "ImportInvalidError"
)

var dataCatalogErrorMap = errorCode{
	DataCatalogNotFound: {
		description: "数据资源目录不存在",
		solution:    "请检查",
	},
	DataCatalogDepartmentNotFound: {
		description: "数据资源目录关联部门不存在",
		solution:    "请检查",
	},
	DataCatalogInfoSystemNotFound: {
		description: "数据资源目录关联信息系统不存在",
		solution:    "请检查",
	},
	DataCatalogSubjectNotFound: {
		description: "数据资源目录关联主题域不存在",
		solution:    "请检查",
	},
	CategoryNodeIdNotFound: {
		description: "资源属性分类不存在",
		solution:    "请检查",
	},
	CodeTableIDsVerifyFail: {
		description: "参数值校验不通过:码表不存在",
	},
	StandardCodesVerifyFail: {
		description: "参数值校验不通过:标准不存在",
	},
	DeleteDataCatalogFail: {
		description: "删除数据目录失败",
	},
	CatalogNameRepeat: {
		description: "数据目录名称重复",
	},
	DataResourceNotExist: {
		description: "数据资源已挂载或不存在",
	},
	DataResourceTypeNotSupport: {
		description: "数据资源类型不支持",
	},
	ImportFileNotExist: {
		description: "导入文件不存在",
	},
	OnlineNeedReport: {
		description: "生成理解报告后，才可以发起上线",
		solution:    "请检查",
	},
	ImportInvalidError: {
		description: "导入[sheet]页，第[word]行数据校验失败",
		cause:       "",
		solution:    "",
	},
}
