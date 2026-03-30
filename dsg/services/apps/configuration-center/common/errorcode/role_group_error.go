package errorcode

import "github.com/kweaver-ai/dsg/services/apps/configuration-center/common/constant"

func init() {
	registerErrorCode(roleGroupErrorMap)
}

const (
	roleGroupPreCoder = constant.ServiceName + "." + roleGroupModelName + "."

	RoleGroupNotExist = roleGroupPreCoder + "RoleGroupNotExist"
)

var roleGroupErrorMap = errorCode{
	RoleGroupNotExist: {
		description: "该角色组不存在",
		cause:       "",
		solution:    "请重新选择角色组",
	},
}
