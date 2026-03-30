package enum

import "github.com/kweaver-ai/idrm-go-frame/core/enum"

const (
	ObjectTypeDomain                   = "domain"                     // 主题域
	ObjectTypeDataView                 = "data_view"                  // 逻辑视图
	ObjectTypeApi                      = "api"                        // 接口
	ObjectTypeSubView                  = "sub_view"                   // 行列规则（子视图）
	ObjectTypeIndicator                = "indicator"                  // 指标
	ObjectTypeIndicatorDimensionalRule = "indicator_dimensional_rule" // 指标维度规则
	ObjectTypeMenuResource             = "menu_resource"              // 菜单资源
	ObjectTypeSubService               = "sub_service"                // 接口限定规则
)
const (
	SubjectTypeAPP        = "app"        // 应用
	SubjectTypeUser       = "user"       //用户
	SubjectTypeDepartment = "department" //部门
	SubjectTypeRole       = "role"       //角色
)

const (
	EffectAllow = "allow"
	EffectDeny  = "deny"
)

type DataAuthRequestType enum.Object

var (
	DataAuthRequestTypeCheck = enum.New[DataAuthRequestType](1, "check", "数据校核")
	DataAuthRequestTypeQuery = enum.New[DataAuthRequestType](2, "query", "数据查询")
)
