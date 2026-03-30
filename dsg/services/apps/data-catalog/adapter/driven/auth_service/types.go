package auth_service

import (
	"net/url"
	"strings"
)

type List[T any] struct {
	Entries    []T `json:"entries,omitempty"`
	TotalCount int `json:"total_count,omitempty"`
}

type PolicyEnforce struct {
	// 请求动作
	Action PolicyAction `json:"action"`

	// 资源 ID
	ObjectID string `json:"object_id"`
	// 资源类型
	ObjectType ObjectType `json:"object_type"`

	// 访问者 ID
	SubjectID string `json:"subject_id"`
	// 访问者类型
	SubjectType SubjectType `json:"subject_type"`
}

type PolicyEnforceEffect struct {
	PolicyEnforce `json:",inline"`

	// 策略结果
	Effect PolicyEffect `json:"effect"`
}

// 请求动作
type PolicyAction string

const (
	// 请求动作：查看
	PolicyActionView PolicyAction = "view"
	// 请求动作：读取
	PolicyActionRead PolicyAction = "read"
	// 请求动作：下载
	PolicyActionDownload PolicyAction = "download"
)

// PolicyActionBinding 定义 PolicyAction 与 Object 的绑定关系，代表 Object 支持
// Subject 执行哪些 PolicyAction。
type PolicyActionBinding struct {
	// 资源类型
	ObjectType ObjectType `json:"object_type,omitempty"`
	// 操作
	PolicyAction PolicyAction `json:"policy_action,omitempty"`
}

// Action 与 Object 的对应关系，代表 Object 支持哪些 Action。
var PolicyActionBindings = []PolicyActionBinding{
	// 代表查看逻辑视图的样例数据
	{
		ObjectType:   ObjectTypeDataView,
		PolicyAction: PolicyActionRead,
	},
	// 代表下载、查询逻辑视图的数据
	{
		ObjectType:   ObjectTypeDataView,
		PolicyAction: PolicyActionDownload,
	},
	// 代表调用接口
	{
		ObjectType:   ObjectTypeAPI,
		PolicyAction: PolicyActionRead,
	},
	// 代表查看指标的数据
	{
		ObjectType:   ObjectTypeIndicator,
		PolicyAction: PolicyActionRead,
	},
}

// PolicyActionBindingsForObjectType 返回 ObjectType 对应的 PolicyActionBinding 列表
func PolicyActionBindingsForObjectType(t ObjectType) (bindings []PolicyActionBinding) {
	for _, b := range PolicyActionBindings {
		if b.ObjectType != t {
			continue
		}
		bindings = append(bindings, b)
	}
	return
}

// 资源类型
type ObjectType string

const (
	// 资源类型：主题域
	ObjectTypeDomain ObjectType = "domain"
	// 资源类型：数据目录
	ObjectTypeDataCatalog ObjectType = "data_catalog"
	// 资源类型：逻辑视图
	ObjectTypeDataView ObjectType = "data_view"
	// 资源类型：接口
	ObjectTypeAPI ObjectType = "api"
	// 资源类型：子视图
	ObjectTypeSubView ObjectType = "sub_view"
	// 资源类型：指标
	ObjectTypeIndicator ObjectType = "indicator"
)

// 访问者类型
type SubjectType string

const (
	// 访问者类型：用户
	SubjectTypeUser SubjectType = "user"
	// 访问者类型：部门
	SubjectTypeDepartment SubjectType = "department"
	// 访问者类型：角色
	SubjectTypeRole SubjectType = "role"
)

// PermissionV2 定义权限
type PermissionV2 struct {
	// 操作
	Action PolicyAction `json:"action,omitempty"`
	// 结果
	Effect PolicyEffect `json:"effect,omitempty"`
}

// 策略结果
type PolicyEffect string

const (
	// 策略结果：允许
	PolicyEffectAllow PolicyEffect = "allow"
	// 策略结果：拒绝
	PolicyEffectDeny PolicyEffect = "deny"
)

// GetObjectsOptions 定义 GetObjects 的参数
type GetObjectsOptions struct {
	// 操作者类型
	SubjectType SubjectType
	// 操作者 ID
	SubjectID string
	// 资源类型列表。返回指定类型的资源
	ObjectTypes []ObjectType
	// 可选：资源 ID，仅返回指定 ID 的资源
	ObjectID string
}

// Query 生成 url query
func (opts *GetObjectsOptions) Query() url.Values {
	m := make(url.Values)

	if opts.SubjectType != "" {
		m.Set("subject_type", string(opts.SubjectType))
	}

	if opts.SubjectID != "" {
		m.Set("subject_id", string(opts.SubjectID))
	}

	if len(opts.ObjectTypes) != 0 {
		var objectTypes = make([]string, len(opts.ObjectTypes))
		for i := range opts.ObjectTypes {
			objectTypes[i] = string(opts.ObjectTypes[i])
		}
		m.Set("object_type", strings.Join(objectTypes, ","))
	}

	if opts.ObjectID != "" {
		m.Set("object_id", opts.ObjectID)
	}

	return m
}

type ObjectWithPermissionsList List[ObjectWithPermissions]

// ObjectWithPermissions 定义资源及权限
type ObjectWithPermissions struct {
	// 资源类型
	ObjectType ObjectType `json:"object_type,omitempty"`
	// 资源 ID
	ObjectID string `json:"object_id,omitempty"`
	// 权限列表
	Permissions []PermissionV2 `json:"permissions,omitempty"`
}
