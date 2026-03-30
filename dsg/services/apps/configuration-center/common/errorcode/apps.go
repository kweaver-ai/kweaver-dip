package errorcode

import (
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/constant"
)

func init() {
	registerErrorCode(appsErrorMap)
}

const (
	appsPreCoder                     = constant.ServiceName + ".Apps."
	AppsNotFound                     = appsPreCoder + "AppsNotFound"
	AppsNameExist                    = appsPreCoder + "AppsNameExist"
	AccountNameExist                 = appsPreCoder + "AccountNameExist"
	ProvinceAppCantNotDdelete        = appsPreCoder + "ProvinceAppCantNotDdelete"
	AppApplyCantNotDdelete           = appsPreCoder + "AppApplyCantNotDdelete"
	AppReportCantNotDdelete          = appsPreCoder + "AppReportCantNotDdelete"
	UeserNotApplicationDeveloperRole = appsPreCoder + "UeserNotApplicationDeveloperRole"
	EscalateError                    = appsPreCoder + "EscalateError"
)

var appsErrorMap = errorCode{
	AppsNotFound: {
		description: "应用授权 id:[%s]未找到",
		cause:       "",
		solution:    "请重新选择应用",
	},
	AppsNameExist: {
		description: "此应用名称已存在，请重新输入",
		cause:       "",
		solution:    "请重新输入",
	},
	AccountNameExist: {
		description: "此账户名称已存在（可能被已有的应用或部署工作台占用），请重新输入",
		cause:       "",
		solution:    "请重新输入",
	},
	ProvinceAppCantNotDdelete: {
		description: "此应用的省注册已经上报成功，无法删除此应用",
		cause:       "",
		solution:    "",
	},
	AppApplyCantNotDdelete: {
		description: "此应用处于审核中，无法删除此应用",
		cause:       "",
		solution:    "",
	},
	AppReportCantNotDdelete: {
		description: "此应用上报处于审核中，无法删除此应用",
		cause:       "",
		solution:    "",
	},
	UeserNotApplicationDeveloperRole: {
		description: "应用开发者未设置应用开发者角色",
		cause:       "",
		solution:    "请选择有应用开发者角色的账号",
	},
	EscalateError: {
		description: "上报失败, 请重试",
		cause:       "",
		solution:    "请重试",
	},
}
