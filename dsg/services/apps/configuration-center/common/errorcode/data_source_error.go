package errorcode

import "github.com/kweaver-ai/dsg/services/apps/configuration-center/common/constant"

func init() {
	registerErrorCode(dataSourceErrorMap)
}

const (
	CreateDataSourceFailed            = constant.ServiceName + "." + "CreateDataSourceFailed"
	CreateDataSourceMQFailed          = constant.ServiceName + "." + "CreateDataSourceMQFailed"
	ModifyDataSourceFailed            = constant.ServiceName + "." + "ModifyDataSourceFailed"
	ModifyDataSourceMQFailed          = constant.ServiceName + "." + "ModifyDataSourceMQFailed"
	DeleteDataSourceFailed            = constant.ServiceName + "." + "DeleteDataSourceFailed"
	DeleteDataMQSourceFailed          = constant.ServiceName + "." + "DeleteDataMQSourceFailed"
	DataSourceNameExist               = constant.ServiceName + "." + "DataSourceNameExist"
	DrivenCreateDataSourceFailed      = constant.ServiceName + "." + "DrivenCreateDataSourceFailed"
	DrivenCreateDataSourceParamFailed = constant.ServiceName + "." + "DrivenCreateDataSourceParamFailed"
	DrivenModifyDataSourceFailed      = constant.ServiceName + "." + "DrivenModifyDataSourceFailed"
	DrivenDeleteDataSourceFailed      = constant.ServiceName + "." + "DrivenDeleteDataSourceFailed"
	DrivenGetDataSourceFailed         = constant.ServiceName + "." + "DrivenGetDataSourceFailed"
	DrivenGetConnectorsFailed         = constant.ServiceName + "." + "DrivenGetConnectorsFailed"
	DrivenGetConnectorConfigFailed    = constant.ServiceName + "." + "DrivenGetConnectorConfigFailed"
	InfoSystemIdError                 = constant.ServiceName + "." + "InfoSystemIdError"
	DataSourceNotExist                = constant.ServiceName + "." + "DataSourceNotExist"
	DataSourceTypeSchemaNotNull       = constant.ServiceName + "." + "DataSourceTypeSchemaNotNull"
	DataSourceNameExistInfoSystem     = constant.ServiceName + "." + "DataSourceNameExistInfoSystem"
	DataSourceNameExistInNoInfoSystem = constant.ServiceName + "." + "DataSourceNameExistInNoInfoSystem"
)

var dataSourceErrorMap = errorCode{
	CreateDataSourceFailed: {
		description: "保存数据源信息失败",
		cause:       "",
		solution:    "请检查数据",
	},
	CreateDataSourceMQFailed: {
		description: "同步创建数据源信息失败",
		cause:       "",
		solution:    "请检查环境",
	},
	ModifyDataSourceFailed: {
		description: "修改数据源信息失败",
		cause:       "",
		solution:    "请检查数据",
	},
	ModifyDataSourceMQFailed: {
		description: "同步修改数据源信息失败",
		cause:       "",
		solution:    "请检查数据",
	},
	DeleteDataSourceFailed: {
		description: "删除数据源信息失败",
		cause:       "",
		solution:    "请检查数据",
	},
	DeleteDataMQSourceFailed: {
		description: "同步删除数据源信息失败",
		cause:       "",
		solution:    "请检查数据",
	},
	DataSourceNameExist: {
		description: "数据源名称存在",
		cause:       "",
		solution:    "请换个名称",
	},
	DrivenCreateDataSourceFailed: {
		description: "创建数据源失败,请检查配置项是否正确",
		cause:       "",
		solution:    "请检查配置信息",
	},
	DrivenCreateDataSourceParamFailed: {
		description: "数据源连接信息错误",
		cause:       "",
		solution:    "请检查配置信息",
	},
	DrivenModifyDataSourceFailed: {
		description: "修改数据源失败,具体错误信息查看详情",
		cause:       "",
		solution:    "请检查配置信息",
	},
	DrivenDeleteDataSourceFailed: {
		description: "删除数据源失败,具体错误信息查看详情",
		cause:       "",
		solution:    "请检查虚拟化引擎",
	},
	DrivenGetDataSourceFailed: {
		description: "虚拟化查询数据源失败",
		cause:       "",
		solution:    "请检查虚拟化引擎",
	},
	DrivenGetConnectorsFailed: {
		description: "获取所有支持的数据源类型失败",
		solution:    "请检查虚拟化引擎",
	},
	DrivenGetConnectorConfigFailed: {
		description: "获取数据源配置项失败",
		solution:    "请检查虚拟化引擎",
	},
	InfoSystemIdError: {
		description: "数据源必须属于信息系统",
		cause:       "",
		solution:    "请选择信息系统",
	},
	DataSourceNotExist: {
		description: "数据源不存在",
		cause:       "",
		solution:    "请重新选择数据源",
	},
	DataSourceTypeSchemaNotNull: {
		description: "该数据源类型的数据库模式不能为空",
		cause:       "",
		solution:    "请填写数据库模式",
	},
	DataSourceNameExistInfoSystem: {
		description: "数据源名称在该信息系统下已经存在",
		cause:       "",
		solution:    "请重试",
	},
	DataSourceNameExistInNoInfoSystem: {
		description: "删除失败，数据源全部列表存在相同数据源名称。",
		cause:       "",
		solution:    "请修改该信息信息系统下的数据源名称后再删除",
	},
}
