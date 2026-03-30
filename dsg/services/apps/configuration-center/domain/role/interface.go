package role

import (
	"context"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/models/response"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/mq/kafka"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	configuration_center_v1 "github.com/kweaver-ai/idrm-go-common/api/configuration-center/v1"
	configuration_center_v1_frontend "github.com/kweaver-ai/idrm-go-common/api/configuration-center/v1/frontend"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/mq/kafkax"
)

type UseCase interface {
	//role
	Create(ctx context.Context, role *configuration_center_v1.Role) (string, error)
	Update(ctx context.Context, role *configuration_center_v1.Role) error
	CheckRepeat(ctx context.Context, req NameRepeatReq) error
	Detail(ctx context.Context, rid string) (*configuration_center_v1.Role, error)
	Query(ctx context.Context, args *configuration_center_v1.RoleListOptions) (*configuration_center_v1.RoleList, error)
	QueryByIds(ctx context.Context, roleIds []string, keys []string) ([]map[string]interface{}, error)
	Discard(ctx context.Context, id string) error
	RoleUsers(ctx context.Context, args *QueryRoleUserPageReqParam) (*response.PageResult, error)
	//user
	AddRoleToUser(ctx context.Context, req AddRoleToUserReq) ([]response.NameIDResp2, error)
	DeleteRoleToUser(ctx context.Context, req UidRidReq) error
	GetUserListCanAddToRole(ctx context.Context, req UriReqParamRId) ([]*model.User, error)
	//GetUserRole(ctx context.Context, req UriReqParamUId) ([]*GetUserRoleRes, error)
	UserIsInRole(ctx context.Context, rid, uid string) (bool, error)
	// GetRoleIDs 返回指定用户所拥有的角色的 ID 列表，未指定用户时返回所有角色的 ID 列表
	GetRoleIDs(ctx context.Context, userID string) ([]string, error)
	// UpdateScopeAndPermissions 更新指定角色的权限
	UpdateScopeAndPermissions(ctx context.Context, id string, sap *configuration_center_v1.ScopeAndPermissions) error
	// GetScopeAndPermissions 获取指定角色的权限
	GetScopeAndPermissions(ctx context.Context, id string) (*configuration_center_v1.ScopeAndPermissions, error)
	// 获取指定角色及其相关数据
	FrontGet(ctx context.Context, id string) (*configuration_center_v1_frontend.Role, error)
	// 获取角色列表及其相关数据
	FrontList(ctx context.Context, opts *configuration_center_v1.RoleListOptions) (*configuration_center_v1_frontend.RoleList, error)
	// 检查角色名称是否可以使用
	FrontNameCheck(ctx context.Context, opts *configuration_center_v1.RoleNameCheck) (bool, error)
}

const (
	InUseRole   = 1
	DiscardRole = 2
)

// SystemRoleCreateReq system role create args
type SystemRoleCreateReq struct {
	Name  string `json:"name"  binding:"TrimSpace,required,min=1,max=128,VerifyName"  example:"委办局"` // 角色名称
	Color string `json:"color" binding:"TrimSpace,required,iscolor,validColor"   example:"#795648"`  // 角色背景色
	Icon  string `json:"icon"  binding:"TrimSpace,required,validIcon"  example:"fund"`               // 角色图标
}

func (s *SystemRoleCreateReq) GenSystemRole() *model.SystemRole {
	return &model.SystemRole{
		Name:      s.Name,
		Icon:      s.Icon,
		Color:     s.Color,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
		//Provide:   provide,
	}
}

type UriReqParamRId struct {
	RId *string `json:"rid,omitempty" uri:"rid" binding:"required,uuid" example:"4a5a3cc0-0169-4d62-9442-62214d8fcd8d"` // 角色ID，uuid
}

type UriReqParamUId struct {
	UId *string `json:"uid,omitempty" uri:"uid" binding:"required,uuid" example:"4a5a3cc0-0169-4d62-9442-62214d8fcd8d"` // 用户UID，uuid
}

// SystemRoleUpdateReq system role create args
type SystemRoleUpdateReq struct {
	UriReqParamRId
	Name  string `json:"name"  binding:"TrimSpace,omitempty,min=1,max=128,VerifyName"  example:"委办局"` // 角色名称
	Color string `json:"color" binding:"TrimSpace,omitempty,iscolor,validColor"  example:"#795648"`   // 角色背景色
	Icon  string `json:"icon"  binding:"TrimSpace,omitempty,validIcon"   example:"fund"`              // 角色图标
}

func (s *SystemRoleUpdateReq) GenSystemRole() *model.SystemRole {
	return &model.SystemRole{
		ID:    *s.RId,
		Name:  s.Name,
		Icon:  s.Icon,
		Color: s.Color,
	}
}

type SystemRoleQueryArgs struct {
	Id   string `json:"id"`
	Name string `json:"name"  binding:"TrimSpace,required,min=1,max=128,VerifyName"`
}

type SystemRoleInfo struct {
	ID        string `json:"id"`               // 主键，uuid
	Name      string `json:"name"`             // 角色名称
	Color     string `json:"color"`            // 角色背景色
	Icon      string `json:"icon"`             // 角色图标
	Status    string `json:"status,omitempty"` // 角色状态
	System    int32  `json:"system"`           // 是否是系统预置角色
	CreatedAt int64  `json:"created_at"`       // 创建时间
	UpdatedAt int64  `json:"updated_at"`       // 更新时间
}

//type SystemRoleDetail struct {
//	RoleInfo *SystemRoleInfo  `json:"role"`  //系统角色信息
//	Users    []users.UserInfo `json:"users"` //用户信息
//}

//func GenRoleUsers(rus []*model.UserRole) []*users.UserInfo {
//	us := make([]*users.UserInfo, 0, len(rus))
//	for _, ru := range rus {
//		us = append(us, users.GetUser(ru.UserID))
//	}
//	return us
//}

type UserRoles struct {
	ID    string           `json:"id"` // 主键，uuid
	Name  string           `json:"name"`
	Roles []SystemRoleInfo `json:"roles"`
}

func GenSystemRoleInfo(r *model.SystemRole) *SystemRoleInfo {
	return &SystemRoleInfo{
		ID:        r.ID,
		Name:      r.Name,
		Color:     r.Color,
		Icon:      r.Icon,
		System:    r.System,
		CreatedAt: r.CreatedAt.Unix(),
		UpdatedAt: r.UpdatedAt.Unix(),
	}
}

func GenSystemRoleInfos(rs []*model.SystemRole) (result []*SystemRoleInfo) {
	result = make([]*SystemRoleInfo, 0, len(rs))
	for _, r := range rs {
		result = append(result, GenSystemRoleInfo(r))
	}
	return result
}

type UserRolePageInfo struct {
	Offset    *int    `json:"offset" form:"offset,default=1" binding:"omitempty,min=1" default:"1"`                          // 页码，默认1
	Limit     *int    `json:"limit" form:"limit,default=20" binding:"omitempty,min=1,max=2000" default:"20"`                 // 每页大小，默认20, 最大100
	Direction *string `json:"direction" form:"direction,default=desc" binding:"omitempty,oneof=asc desc" default:"desc"`     // 排序方向，枚举：asc：正序；desc：倒序。默认倒序
	Sort      *string `json:"sort" form:"sort,default=created_at" binding:"omitempty,oneof=created_at" default:"created_at"` // 排序类型，枚举：created_at：按创建时间排序;默认按创建时间排序
}

type NewRoleReq struct {
	Name        string `json:"name" binding:"TrimSpace,required,min=1,max=128,VerifyName" example:"name"`                    // 角色名称
	Description string `json:"description,omitempty" binding:"TrimSpace,omitempty,max=255,VerifyDescription" example:"desc"` // 角色描述
	Icon        string `json:"icon"`                                                                                         // 角色图标
}

type QueryRoleInfoParams struct {
	RoleIds string `json:"role_ids" form:"role_ids" binding:"min=36,max=1850" example:"56ce508f-1e1c-4bf6-ba63-1dcbbf980d10,146d27af-9403-41db-b8a4-e813b533cfbd"` //最少1个，最大50个
	Keys    string `json:"keys" form:"keys" binding:"TrimSpace,required"  example:"name,color,id"`                                                                 //根据需要返回的key，逗号分隔， 全部有：name,color,id,status,icon,system,userIds
}

type QueryPageReqParam struct {
	Offset    *int    `json:"offset" form:"offset,default=1" binding:"omitempty,min=1" default:"1"`                                     // 页码，默认1
	Limit     *int    `json:"limit" form:"limit,default=20" binding:"omitempty,min=1,max=100" default:"20"`                             // 每页大小，默认20, 最大100
	Direction *string `json:"direction" form:"direction,default=desc" binding:"omitempty,oneof=asc desc" default:"desc"`                // 排序方向，枚举：asc：正序；desc：倒序。默认倒序
	Sort      *string `json:"sort" form:"sort,default=created_at" binding:"omitempty,oneof=created_at updated_at" default:"created_at"` // 排序类型，枚举：created_at：按创建时间排序；updated_at：按更新时间排序。默认按创建时间排序
	Keyword   string  `json:"keyword"  form:"keyword" binding:"TrimSpace,omitempty,min=1"`                                              // 角色名称
}

type QueryRoleUserPageReqParam struct {
	UriReqParamRId
	UserRolePageInfo
	UserName string `json:"keyword" form:"keyword" binding:"TrimSpace,omitempty,min=1" example:"刘荣伟"`
}
type GetRoleUsersInPageRes struct {
	ID          string   `json:"id"`
	Name        string   `json:"name"`
	CreatedAt   int64    `json:"created_at"`
	Departments []string `json:"departments"`
}

type AddRoleToUserReq struct {
	UriReqParamRId
	UIds []string `json:"uids" form:"uids" binding:"required,gte=1,dive,uuid"` // 用户标识列表，uuid
}
type ForSwag struct {
	UIds []string `json:"uids" form:"uids" binding:"required,gte=1,dive,uuid"` // 用户标识列表，uuid
}

type UidRidReq struct {
	UriReqParamRId
	UId string `json:"uid" form:"uid" binding:"required,uuid"` // 用户标识列表，uuid
}
type UidRidParamReq struct {
	RId string `json:"rid,omitempty" uri:"rid" binding:"required,uuid" example:"4a5a3cc0-0169-4d62-9442-62214d8fcd8d"` // 角色ID，uuid
	UId string `json:"uid,omitempty" uri:"uid" binding:"required,uuid" example:"4a5a3cc0-0169-4d62-9442-62214d8fcd8d"` // 用户UID，uuid
}

type NameRepeatReq struct {
	Id   string `json:"id" form:"id"  binding:"omitempty,uuid"`
	Name string `json:"name" form:"name" binding:"required,VerifyName"`
}

type GetUserRoleRes struct {
	Name        string `json:"name"  example:"name"`       // 角色名称
	Description string `json:"description" example:"desc"` // 角色描述
	Icon        string `json:"icon"`                       // 角色图标
}

type RoleIDsReq struct {
	// 用户 ID，非空时返回指定用户所拥有的角色的 ID 列表
	UserID string `json:"user_id,omitempty" form:"user_id"`
}

type UserRoleDeletedMQMsg struct {
	RoleId string `json:"roleId"`
	UserId string `json:"userId"`
}

func NewDeleteUserRoleMessage(rid, uid string) *model.MqMessage {
	msg := kafkax.NewRawMessage()
	payload := kafkax.NewRawMessage()
	payload["roleId"] = rid
	payload["userId"] = uid
	msg["payload"] = payload
	msg["header"] = kafkax.NewRawMessage()
	return &model.MqMessage{
		Topic:   kafka.DeleteUserRoleTopic,
		Message: string(msg.Marshal()),
	}
}

func NewDeleteRoleMessage(rid string) *model.MqMessage {
	msg := kafkax.NewRawMessage()
	payload := kafkax.NewRawMessage()
	payload["roleId"] = rid
	msg["payload"] = payload
	msg["header"] = kafkax.NewRawMessage()
	return &model.MqMessage{
		Topic:   kafka.DeleteRoleTopic,
		Message: string(msg.Marshal()),
	}
}
