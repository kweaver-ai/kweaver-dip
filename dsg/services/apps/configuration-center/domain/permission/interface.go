package permission

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	configuration_center_v1 "github.com/kweaver-ai/idrm-go-common/api/configuration-center/v1"
)

type Domain interface {
	// Get 获取指定权限
	Get(ctx context.Context, id string) (*configuration_center_v1.Permission, error)
	// List 获取权限列表
	List(ctx context.Context) (*configuration_center_v1.PermissionList, error)
	// 根据权限数组查询用户
	QueryUserListByPermissionIds(ctx context.Context, req *PermissionIdsReq) (resp *PermissionUserResp, err error)
	// 查询用户有的权限及范围列表
	GetUserPermissionScopeList(ctx context.Context, uid string) ([]*model.UserPermissionScope, error)
	UserCheckPermission(ctx context.Context, permissionId, uid string) (bool, error)
}

type PermissionIdsReq struct {
	PermissionType int8     `json:"permission_type" form:"permission_type"  binding:"required,oneof=1 2" default:"1" example:"1"` // 类型1或、2且
	PermissionIds  []string `json:"permission_ids" form:"permission_ids"  binding:"gte=1,lte=1000,required,dive"`                 // permission_ids集合，最小数组长度1，最大数组长度1000
	Keyword        string   `json:"keyword" form:"keyword"`                                                                       //用户名或登录名
	ThirdUserId    string   `json:"third_user_id"  form:"third_user_id"`                                                          //第三方用户ID
}

type PermissionUserResp struct {
	Entries []*PermissionUser `json:"entries" binding:"required"` //权限用户列表
}
type PermissionUser struct {
	// 用户标识
	ID string `json:"id,omitempty"` //用户ID
	// 用户名称
	Name        string `json:"name,omitempty"` //用户名称
	ThirdUserId string `json:"third_user_id"`  //第三方用户ID
}

type IdReq struct {
	ID string `uri:"id" binding:"required,uuid"`
}

type UserCheckPermissionReq struct {
	PermissionId string `json:"permissionId" uri:"permissionId"  form:"permissionId"  binding:"required" default:"1" example:"1"` // 权限ID
	Uid          string `json:"uid" form:"uid" uri:"uid"   binding:"required"   default:"1" example:"1"`                          // 用户ID
}

type UserReq struct {
	Keyword     string `json:"keyword" form:"keyword"`              //用户名或登录名
	ThirdUserId string `json:"third_user_id"  form:"third_user_id"` //第三方用户ID
}
