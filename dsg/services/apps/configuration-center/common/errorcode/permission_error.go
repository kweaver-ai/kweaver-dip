package errorcode

import "github.com/kweaver-ai/dsg/services/apps/configuration-center/common/constant"

func init() {
	registerErrorCode(permissionErrorMap)
}

const (
	permissionPreCoder = constant.ServiceName + "." + permissionModelName + "."

	PermissionNotExist = permissionPreCoder + "PermissionNotExist"
)

var permissionErrorMap = errorCode{
	PermissionNotExist: {
		description: "该权限不存在",
		cause:       "",
		solution:    "请重新选择权限",
	},
}
