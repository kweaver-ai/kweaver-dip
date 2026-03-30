package auth_service

import (
	"context"

	meta_v1 "github.com/kweaver-ai/idrm-go-common/api/meta/v1"
)

type DrivenAuthService interface {
	GetUsersObjects(ctx context.Context, req *GetUsersObjectsReq) (*GetUsersObjectsRes, error)                   // 访问者拥有的资产
	VerifyUserAuthority(ctx context.Context, req []*VerifyUserAuthorityReq) ([]*VerifyUserAuthorityEntry, error) // 验证用户权限
	// 验证当前用户是否拥有对指定类型的多个资源的权限，返回结果以 object id 排序。
	VerifyUserPermissionOnSameTypeObjects(ctx context.Context, action string, objectType string, objectIDs ...string) ([]bool, error)
	// 验证当前用户是否拥有对指定类型的一个资源的权限。
	VerifyUserPermissionObject(ctx context.Context, action string, objectType string, objectID string) (bool, error)
	// 验证策略
	Enforce(ctx context.Context, requests []EnforceRequest) (responses []bool, err error)
}

// region GetView
const (
	ObjectTypeDomain      = "domain"
	ObjectTypeDataCatalog = "data_catalog"
	ObjectTypeDataView    = "data_view"
	ObjectTypeSubView     = "sub_view"
)

const (
	SubjectTypeUser       = "user"
	SubjectTypeDepartment = "department"
	SubjectTypeRole       = "role"
	SubjectTypeApp        = "app"
)
const (
	Effect_Allow = "allow"
	Effect_Deny  = "deny"
)

const (
	Action_View     = "view"
	Action_Read     = "read"
	Action_Download = "download"
	Action_Auth     = "auth"
	Action_Allocate = "allocate"
)

type GetUsersObjectsReq struct {
	ObjectType  string `json:"object_type"`  //资产类型 domain 主题域 data_catalog 数据目录 data_view 数据表视图 api 接口, 多种类型用逗号分隔
	SubjectId   string `json:"subject_id"`   //访问者id
	SubjectType string `json:"subject_type"` //访问者类型 user 用户 department 部门 role 角色
}
type GetUsersObjectsRes struct {
	TotalCount  int        `json:"total_count"`
	EntriesList []*Entries `json:"entries"`
}
type Entries struct {
	ObjectId        string         `json:"object_id"`   //资产id
	ObjectType      string         `json:"object_type"` //资产类型 domain 主题域 data_catalog 数据目录 data_view 数据表视图 api 接口
	PermissionsList []*Permissions `json:"permissions"` //权限
	// 权限过期时间
	ExpiredAt *meta_v1.Time `json:"expired_at,omitempty"`
}
type Permissions struct {
	Action string `json:"action"` //请求动作 read 读取 download 下载
	Effect string `json:"effect"` //策略结果 allow 允许 deny 拒绝
}

type VerifyUserAuthorityReq struct {
	ObjectId string `json:"object_id"` //资产id
	Action   string `json:"action"`    //请求动作 view 查看 read 读取 download 下载
	GetUsersObjectsReq
}

type VerifyUserAuthorityEntry struct {
	ObjectId string `json:"object_id"` //资产id
	Permissions
	GetUsersObjectsReq
}

// EnforceRequest 定义策略验证的请求
type EnforceRequest struct {
	// 操作者类型
	SubjectType string `json:"subject_type,omitempty"`
	// 操作者 ID
	SubjectID string `json:"subject_id,omitempty"`
	// 资源类型
	ObjectType string `json:"object_type,omitempty"`
	// 资源 ID
	ObjectID string `json:"object_id,omitempty"`
	// 操作者对资源执行的动作
	Action string `json:"action,omitempty"`
}

// EnforceResponse 定义策略验证的响应
type EnforceResponse struct {
	// 响应对应的请求
	EnforceRequest `json:",inline"`
	// 策略结果
	Effect string `json:"effect,omitempty"`
	Result bool   `json:"result,omitempty"`
}

//endregion
