package errorcode

import (
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/constant"
)

func init() {
	registerErrorCode(platformErrorMap)
}

const (
	platformZonePreCoder     = constant.ServiceName + ".platform_zone."
	MaxPlatformZone          = platformZonePreCoder + "MaxPlatformZone"
	PlatformZoneAlreadyExist = platformZonePreCoder + "PlatformZoneAlreadyExist"
)

var platformErrorMap = errorCode{
	MaxPlatformZone: {
		description: "最大限额100条",
		cause:       "",
		solution:    "",
	},
	PlatformZoneAlreadyExist: {
		description: "该功能入口已添加",
		cause:       "",
		solution:    "",
	},
}
