package errorcode

import (
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/constant"
	"github.com/kweaver-ai/idrm-go-frame/core/errorx"
)

var serviceModel = errorx.New(constant.ServiceName + ".Service.")
var publicModel = errorx.New(constant.ServiceName + ".Public.")
var subServiceModel = errorx.New(constant.ServiceName + ".SubService.")

var (
	PublicDatabaseErr        = publicModel.Description("DatabaseError", "数据库错误")
	PublicQueryUserInfoError = publicModel.Description("QueryUserInfoError", "查询用户信息错误")
)

var (
	ServiceNotFound = serviceModel.Description("NotFound", "接口未找到")
)

var (
	SubServiceNotServiceOwner         = subServiceModel.Description("NotServiceOwner", "不是接口的 Owner") // 用户不是子视图所属的逻辑视图的 Owner
	SubServiceDatabaseError           = subServiceModel.Description("DatabaseError", "数据库错误")         // 数据库错误
	SubServiceAlreadyExists           = subServiceModel.Description("AlreadyExists", "行/列规则[%s]已经存在") // 子视图已经存在
	SubServiceNotFound                = subServiceModel.Description("NotFound", "行/列规则[%s]未找到")       // 子视图未找到
	SubServicePermissionNotAuthorized = subServiceModel.Description("PermissionNotAuthorized", "没有接口限定规则的权限")
	AuthServiceError                  = subServiceModel.Description("AuthServiceError", "权限管理服务异常")
	SubServiceNameRepeatError         = subServiceModel.Description("NameRepeatError", "该授权限定规则名称已经存在，请重新输入")
)
