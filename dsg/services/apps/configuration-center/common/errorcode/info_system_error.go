package errorcode

import "github.com/kweaver-ai/dsg/services/apps/configuration-center/common/constant"

func init() {
	registerErrorCode(infoSystemErrorMap)
}

const (
	CreateInfoSystemFailed            = constant.ServiceName + "." + "CreateInfoSystemFailed"
	ModifyInfoSystemFailed            = constant.ServiceName + "." + "ModifyInfoSystemFailed"
	DeleteInfoSystemFailed            = constant.ServiceName + "." + "DeleteInfoSystemFailed"
	InfoSystemNameExist               = constant.ServiceName + "." + "InfoSystemNameExist"
	DrivenCreateInfoSystemFailed      = constant.ServiceName + "." + "DrivenCreateInfoSystemFailed"
	DrivenCreateInfoSystemParamFailed = constant.ServiceName + "." + "DrivenCreateInfoSystemParamFailed"
	DrivenModifyInfoSystemFailed      = constant.ServiceName + "." + "DrivenModifyInfoSystemFailed"
	DrivenDeleteInfoSystemFailed      = constant.ServiceName + "." + "DrivenDeleteInfoSystemFailed"
	DrivenGetInfoSystemFailed         = constant.ServiceName + "." + "DrivenGetInfoSystemFailed"
	InfoSystemNotExist                = constant.ServiceName + "." + "InfoSystemNotExist"
	InfoSystemTypeSchemaNotNull       = constant.ServiceName + "." + "InfoSystemTypeSchemaNotNull"
	InfoSystemNameExistInfoSystem     = constant.ServiceName + "." + "InfoSystemNameExistInfoSystem"
	InfoSystemNameExistInNoInfoSystem = constant.ServiceName + "." + "InfoSystemNameExistInNoInfoSystem"
)

var infoSystemErrorMap = errorCode{
	CreateInfoSystemFailed: {
		description: "保存信息系统信息失败",
		cause:       "",
		solution:    "请检查数据",
	},
	ModifyInfoSystemFailed: {
		description: "修改信息系统信息失败",
		cause:       "",
		solution:    "请检查数据",
	},
	DeleteInfoSystemFailed: {
		description: "删除信息系统信息失败",
		cause:       "",
		solution:    "请检查数据",
	},
	InfoSystemNameExist: {
		description: "该信息系统名称已存在，请重新输入",
		cause:       "",
		solution:    "请重新输入",
	},
	DrivenCreateInfoSystemFailed: {
		description: "创建信息系统失败,请检查配置项是否正确",
		cause:       "",
		solution:    "请检查配置信息",
	},
	DrivenCreateInfoSystemParamFailed: {
		description: "信息系统连接信息错误",
		cause:       "",
		solution:    "请检查配置信息",
	},
	DrivenModifyInfoSystemFailed: {
		description: "修改信息系统失败,具体错误信息查看详情",
		cause:       "",
		solution:    "请检查配置信息",
	},
	DrivenDeleteInfoSystemFailed: {
		description: "删除信息系统失败,具体错误信息查看详情",
		cause:       "",
		solution:    "请检查虚拟化引擎",
	},
	DrivenGetInfoSystemFailed: {
		description: "虚拟化查询信息系统失败",
		cause:       "",
		solution:    "请检查虚拟化引擎",
	},
	InfoSystemNotExist: {
		description: "信息系统不存在",
		cause:       "",
		solution:    "请重新选择信息系统",
	},
	InfoSystemTypeSchemaNotNull: {
		description: "该信息系统类型的数据库模式不能为空",
		cause:       "",
		solution:    "请填写数据库模式",
	},
	InfoSystemNameExistInfoSystem: {
		description: "信息系统名称在该信息系统下已经存在",
		cause:       "",
		solution:    "请重试",
	},
	InfoSystemNameExistInNoInfoSystem: {
		description: "删除失败，信息系统全部列表存在相同信息系统名称。",
		cause:       "",
		solution:    "请修改该信息信息系统下的信息系统名称后再删除",
	},
}
