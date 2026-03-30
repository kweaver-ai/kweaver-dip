package errorcode

import (
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/constant"
	"github.com/kweaver-ai/idrm-go-frame/core/errorx"
)

var subViewModule = errorx.New(constant.ServiceName + ".SubView.")

var (
	SubViewNotFormViewOwner        = subViewModule.Description("NotFormViewOwner", "不是逻辑视图的 Owner") // 用户不是子视图所属的逻辑视图的 Owner
	SubViewDatabaseError           = subViewModule.Description("DatabaseError", "数据库错误")            // 数据库错误
	SubViewAlreadyExists           = subViewModule.Description("AlreadyExists", "行/列规则[%s]已经存在")    // 子视图已经存在
	SubViewNotFound                = subViewModule.Description("NotFound", "行/列规则[%s]未找到")          // 子视图未找到
	SubViewPermissionNotAuthorized = subViewModule.Description("PermissionNotAuthorized", "没有子视图的权限")
	AuthServiceError               = subViewModule.Description("AuthServiceError", "权限管理服务异常")
	AllocatedCanOperatorSelfErr    = subViewModule.Description("AllocatedCanOperatorSelfErr", "授权仅分配只能修改自己新增的行列规则数据")
	SubViewNameRepeatError         = subViewModule.Description("NameRepeatError", "该授权行/列规则名称已经存在，请重新输入")
)
