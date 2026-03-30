package errorcode

import "github.com/kweaver-ai/dsg/services/apps/configuration-center/common/constant"

func init() {
	registerErrorCode(ConfigurationMap)
}

const (
	ConfigurationPreCoder = constant.ServiceName + "." + UserName + "."

	ConfigurationDataBaseError           = ConfigurationPreCoder + "ConfigurationDataBaseError"
	ConfigurationNotFindError            = ConfigurationPreCoder + "ConfigurationNotFindError"
	SetConfigurationError                = ConfigurationPreCoder + "SetConfigurationError"
	SetBusinessDomainLevelParameterError = ConfigurationPreCoder + "SetBusinessDomainLevelParameterError"
)

var ConfigurationMap = errorCode{
	ConfigurationDataBaseError: {
		description: "数据库错误",
		cause:       "",
		solution:    "请重试",
	},
	ConfigurationNotFindError: {
		description: "找不到配置",
		cause:       "",
		solution:    "请重试",
	},
	SetConfigurationError: {
		description: "设置配置错误",
		cause:       "",
		solution:    "请重试",
	},
	SetBusinessDomainLevelParameterError: {
		description: "业务域层级参数错误",
		cause:       "",
		solution:    "",
	},
}
