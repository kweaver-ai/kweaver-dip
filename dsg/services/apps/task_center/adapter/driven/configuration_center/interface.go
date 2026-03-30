package configuration_center

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/task_center/domain/tc_project"
	"github.com/kweaver-ai/idrm-go-common/access_control"
)

type Call interface {
	GetRoleInfo(ctx context.Context, roleId string) (*RoleInfo, error)
	GetRolesInfo(ctx context.Context, roleIds []string) ([]*RoleInfo, error)
	GetRolesInfoMap(ctx context.Context, roleIds []string) (map[string]*RoleInfo, error)
	GetRemotePipelineInfo(ctx context.Context, flowID, flowVersion string) (*tc_project.PipeLineInfo, error)
	HasAccessPermission(ctx context.Context, uid string, accessType access_control.AccessType, resource access_control.Resource) (bool, error)
	AddUsersToRole(ctx context.Context, rid, uid string) error    // 添加角色用户关系
	DeleteUsersToRole(ctx context.Context, rid, uid string) error // 删除角色用户关系
	GetRoleUsers(ctx context.Context, rid string, info UserRolePageInfo) ([]*User, error)
	UserIsInRole(ctx context.Context, rid string, uid string) (bool, error)
	GetAlarmRule(ctx context.Context, types []string) ([]*AlarmRule, error)
	GenUniformCode(ctx context.Context, ruleID string, num int) ([]string, error)
	GetProjectMgmUsers(ctx context.Context, projectMgm, thirdUserId, keyword string) ([]*User, error)
}

type RoleInfo struct {
	Id      string   `json:"id"`
	Name    string   `json:"name"`
	Status  int      `json:"status"`
	Color   string   `json:"color"`
	Icon    string   `json:"icon"`
	UserIds []string `json:"userIds"`
}

type UserRolePageInfo struct {
	Offset    int    `json:"offset" form:"offset,default=1" binding:"omitempty,min=1" default:"1"`                          // 页码，默认1
	Limit     int    `json:"limit" form:"limit,default=20" binding:"omitempty,min=1,max=100" default:"20"`                  // 每页大小，默认20, 最大100
	Direction string `json:"direction" form:"direction,default=desc" binding:"omitempty,oneof=asc desc" default:"desc"`     // 排序方向，枚举：asc：正序；desc：倒序。默认倒序
	Sort      string `json:"sort" form:"sort,default=created_at" binding:"omitempty,oneof=created_at" default:"created_at"` // 排序类型，枚举：created_at：按创建时间排序;默认按创建时间排序
}

type User struct {
	ID          string `json:"id"`            //用户ID
	Name        string `json:"name"`          //用户名
	ThirdUserId string `json:"third_user_id"` //第三方用户ID
}

type UserReq struct {
	Keyword     string `json:"keyword" form:"keyword"`              //用户名或登录名
	ThirdUserId string `json:"third_user_id"  form:"third_user_id"` //第三方用户ID
}

type PageResult struct {
	Entries    []*User `json:"entries" binding:"omitempty"`         // 对象列表
	TotalCount int64   `json:"total_count" binding:"required,ge=0"` // 总数量
}

type PermissionUserResp struct {
	Entries []*User `json:"entries" binding:"required"` //权限用户列表
}

type AlarmRuleResp struct {
	Entries []*AlarmRule `json:"entries"`
}

type AlarmRule struct {
	ID                 string `json:"id" binding:"required" example:"545911190992222513"` // 告警规则ID
	Type               string `json:"type" binding:"required"`                            // 规则类型，data_quality 数据质量
	DeadlineTime       int64  `json:"deadline_time" binding:"required"`                   // 截止告警时间
	DeadlineReminder   string `json:"deadline_reminder" binding:"required"`               // 截止告警内容
	BeforehandTime     int64  `json:"beforehand_time" binding:"required"`                 // 提前告警时间
	BeforehandReminder string `json:"beforehand_reminder" binding:"required"`             // 提前告警内容
	UpdatedAt          int64  `json:"updated_at" binding:"omitempty"`                     // 更新时间
	UpdatedBy          string `json:"updated_by" binding:"omitempty"`                     // 更新用户ID
}
