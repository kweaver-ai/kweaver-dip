package dto

import (
	"encoding/json"
	"strings"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/util"
	"github.com/kweaver-ai/idrm-go-common/rest/authorization"
	"github.com/samber/lo"

	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/util/sets"
	audit_v1 "github.com/kweaver-ai/idrm-go-common/api/audit/v1"
	meta_v1 "github.com/kweaver-ai/idrm-go-common/api/meta/v1"
)

// SubjectType 定义访问者的类型
type SubjectType string

func (t SubjectType) Str() string {
	return string(t)
}

const (
	SubjectUser       SubjectType = "user"       // 用户
	SubjectDepartment SubjectType = "department" // 部门
	SubjectRole       SubjectType = "role"       // 角色
	SubjectAPP        SubjectType = "app"        // 应用
	SubjectGroup      SubjectType = "group"      // 用户分组
)

func (s SubjectType) String() string {
	return string(s)
}

// ObjectType 定义资源类型
type ObjectType string

func (t ObjectType) Str() string {
	return string(t)
}

const (
	ObjectDomain       ObjectType = "domain"                     // 主题域
	ObjectDataCatalog  ObjectType = "data_catalog"               // 数据目录
	ObjectDataView     ObjectType = "data_view"                  // 逻辑视图（数据表视图）
	ObjectAPI          ObjectType = "api"                        // 接口
	ObjectSubView      ObjectType = "sub_view"                   // 行列规则（子视图）
	ObjectIndicator    ObjectType = "indicator"                  // 指标
	ObjectSubService   ObjectType = "sub_service"                // 接口限定规则
	ObjectSubIndicator ObjectType = "indicator_dimensional_rule" //指标的维度规则
)

const (
	EftAllow = "allow"
	EftDeny  = "deny"
)

// Action 定义动作
type Action string

const (
	ActionRead     Action = "read"     // 读取
	ActionDownload Action = "download" // 下载
	ActionAuth     Action = "auth"     // 授权
	ActionAllocate Action = "allocate" // 授权仅分配
)

func (a Action) Str() string {
	return string(a)
}

// SupportedActions 定义支持的动作
var SupportedActions = sets.New(
	ActionRead,
	ActionDownload,
	ActionAuth,
	ActionAllocate,
)

type Policy struct {
	Object
	Subjects       []Subject `json:"subjects" binding:"required,min=1,dive"`   //访问者
	SubjectsExtend []Subject `json:"subjects_extend" binding:"omitempty,dive"` //继承权限的访问者
}
type RulePolicy struct {
	Object  Object  `json:"object" binding:"required,min=1,dive"`  //资源
	Subject Subject `json:"subject" binding:"required,min=1,dive"` //访问者
	Action  string
}

type UpdatePolicy struct {
	Object
	Subjects       []Subject `json:"subjects" binding:"omitempty,dive"`        //访问者
	SubjectsExtend []Subject `json:"subjects_extend" binding:"omitempty,dive"` //继承权限的访问者
	// 是否保持权限的过期时间不变。
	PreserveExpiredAt bool `json:"preserve_expired_at,omitempty"`
	// 是否只修改指定 subjects 的权限。false 将移除 subjects 未指定的用户、应用的权限
	Partial bool `json:"partial,omitempty"`
}

func (u *UpdatePolicy) PolicyGetReq() *PolicyGetReq {
	return &PolicyGetReq{
		ObjectId:   u.ObjectId,
		ObjectType: u.ObjectType,
	}
}

type Object struct {
	//资源id
	ObjectId string `json:"object_id" binding:"required,VerifyNameEn,max=128" example:"01940795-d488-77ea-ab48-689d2683a623"`
	//资源类型 domain 主题域 data_view 逻辑视图 api 接口 sub_view 子视图 indicator 指标
	ObjectType string `json:"object_type" binding:"required,oneof=domain data_view api sub_service sub_view indicator indicator_dimensional_rule"`
	//资源名称
	ObjectName string `json:"object_name" binding:"omitempty,VerifyDescription,max=128" example:"东区销售数据"`
	//数据OwnerId
	OwnerId string `json:"owner_id" binding:"omitempty" example:"01940796-7bc2-7462-81eb-c7e6399f08fb"`
	//数据Owner名称
	OwnerName string `json:"owner_name" binding:"omitempty" example:"用户名称"`
	//数据Owner所属部门
	OwnerDepartments [][]Department `json:"owner_departments" binding:"omitempty"`
	// 数据的 Owner 列表
	Owners []ObjectOwner `json:"owners,omitempty"`

	DepartmentID   string `json:"department_id"` //资源的部门，不是子资源的
	SourceObjectID string `json:"source_object_id"  binding:"omitempty" example:"视图，接口，指标的ID"`
	AuthScopeID    string `json:"auth_scope_id"`   //授权范围
	AuthScopeType  string `json:"auth_scope_type"` //授权范围资源的类型
}

func (o *Object) SourceObjectKey() string {
	if o.SourceObjectID != "" {
		return o.SourceObjectID
	}
	return o.ObjectId
}

func (o *Object) OwnerIDSlice() []string {
	owners := lo.Times(len(o.Owners), func(index int) string {
		return o.Owners[index].OwnerID
	})
	return owners
}

func (o *Object) Key() string {
	return util.JoinField(o.ObjectType, o.ObjectId)
}

// Object 的 Owner
type ObjectOwner struct {
	// ID
	OwnerID string `json:"owner_id,omitempty"`
	// 名称
	OwnerName string `json:"owner_name,omitempty"`
	// 所属部门
	Departments [][]Department `json:"departments,omitempty"`
}

type Subject struct {
	PolicyID string `json:"policy_id"  binding:"omitempty"` //策略ID，由ISF返回的，用来更新的
	//访问者id
	SubjectId string `json:"subject_id" binding:"required,VerifyNameEn,max=128" example:"01940797-fc33-76ad-98c4-f9e4457ace03"`
	//访问者类型 app 应用 user 用户 department 部门 role 角色
	SubjectType string `json:"subject_type" binding:"required,oneof=app user department role"`
	//访问者名称
	SubjectName string `json:"subject_name" binding:"omitempty,VerifyDescription,max=128" example:"访问者名称"`
	//所属部门
	Departments [][]Department `json:"departments" binding:"omitempty"`
	//权限设置
	Permissions []Permission `json:"permissions,omitempty" binding:"required,min=1,dive"`
	// 用户状态，仅当访问者类型 SubjectType 是 user 时有值
	UserStatus UserStatus `json:"user_status,omitempty"`
	// 过期时间，未指定代表永久生效。
	ExpiredAt *meta_v1.Time `json:"expired_at,omitempty"`
}

func (s *Subject) Key() string {
	return util.JoinField(s.SubjectType, s.SubjectId)
}

func OperationsToPermissions(ops authorization.AuthOperation, expireTime time.Time) []Permission {
	operations := lo.Times(len(ops.Allow), func(index int) string {
		return ops.Allow[index].ID
	})
	effect := EftAllow
	if expireTime.Unix() <= time.Now().Unix() {
		effect = EftDeny
	}
	return lo.Times(len(operations), func(index int) Permission {
		return Permission{
			Action: operations[index],
			Effect: effect,
		}
	})
}

func (s *Subject) Operations() authorization.AuthOperation {
	ops := lo.Uniq(lo.FlatMap(s.Permissions, func(item Permission, index int) []string {
		return []string{item.Action}
	}))
	return authorization.AuthOperation{
		Allow: lo.Times(len(ops), func(index int) *authorization.OperationObject {
			return &authorization.OperationObject{
				ID: ops[index],
			}
		}),
		Deny: make([]*authorization.OperationObject, 0),
	}
}

type Department struct {
	//部门id
	DepartmentId string `json:"department_id" example:"01940797-4ee0-7ec9-a053-8ce9e0ad1271"`
	//部门名称
	DepartmentName string `json:"department_name" example:"部门名称"`
}

type Permission struct {
	Action string `json:"action" binding:"required,oneof=view read download auth allocate apply"` // 请求动作 view查看 read读取  download下载 auth授权 allocate授权(仅分配)
	Effect string `json:"effect" binding:"required,oneof=allow deny"`                             // 策略结果 allow 允许 deny 拒绝
}

// UserStatus 用户状态
type UserStatus string

const (
	UserUnknown UserStatus = "Unknown" // 未知
	UserNormal  UserStatus = "Normal"  // 正常
	UserDeleted UserStatus = "Deleted" // 已删除
)

// PolicyCreateReq 策略创建
type PolicyCreateReq struct {
	Policy
}

// PolicyGetReq 策略详情
type PolicyGetReq struct {
	//资源id
	ObjectId string `json:"object_id" form:"object_id" binding:"required,VerifyNameEn,max=128"`
	//资源类型 domain 主题域 data_view 逻辑视图 api 接口 sub_view 子视图 indicator 指标
	ObjectType string `json:"object_type" form:"object_type"  binding:"required,oneof=domain data_view api sub_service sub_view indicator indicator_dimensional_rule"`
}

type PolicyGetRes struct {
	Policy
}

type PolicyListRes struct {
	PageResult[Policy]
}

// PolicyUpdateReq 策略更新
type PolicyUpdateReq struct {
	UpdatePolicy
}

type PolicyUpdateBodyReq struct {
	Policy
}

// PolicyDeleteReq 策略删除
type PolicyDeleteReq struct {
	PolicyID       string `json:"policy_id"  binding:"omitempty"` //策略ID，多个，支持逗号分割
	SourceObjectID string `json:"source_object_id"  binding:"omitempty" example:"视图，接口，指标的ID"`
	ObjectId       string `json:"object_id" form:"object_id" binding:"required,VerifyNameEn,max=128"`                                                                      //资源id
	ObjectType     string `json:"object_type" form:"object_type"  binding:"required,oneof=domain data_view api sub_service sub_view indicator indicator_dimensional_rule"` //资源类型 domain 主题域 data_view 逻辑视图 api 接口 sub_view 子视图 indicator 指标
	SubjectId      string `json:"subject_id" form:"subject_id" binding:"omitempty,VerifyNameEn,max=128"`                                                                   //访问者id, 不传访问者id, 表示删除资源的全部授权, 传访问者id, 表示仅删除资源下该访问者的授权
	SubjectType    string `json:"subject_type" form:"subject_type" binding:"omitempty,oneof=app user department role"`                                                     //访问者类型 app 应用 user 用户 department 部门 role 角色
}

func (p *PolicyDeleteReq) PolicyGetReq() *PolicyGetReq {
	return &PolicyGetReq{
		ObjectId:   p.ObjectId,
		ObjectType: p.ObjectType,
	}
}

type PolicyEnforce struct {
	ObjectId    string `json:"object_id" form:"object_id" binding:"required,VerifyNameEn,max=128"`                                                                     //资源id
	ObjectType  string `json:"object_type" form:"object_type" binding:"required,oneof=domain data_view api sub_service sub_view indicator indicator_dimensional_rule"` //资源类型 domain 主题域 data_view 逻辑视图 api 接口 sub_view 子视图 indicator 指标
	SubjectId   string `json:"subject_id" form:"subject_id" binding:"required,VerifyNameEn,VerifyNameEn,max=128"`                                                      //访问者id
	SubjectType string `json:"subject_type" form:"subject_type" binding:"required,oneof=app user department role"`                                                     //访问者类型 app 应用 user 用户 department 部门 role 角色
	Action      string `json:"action" form:"action" binding:"required,oneof=view read download auth allocate apply"`                                                   //请求动作 view 查看 read 读取 download 下载
}

type RulePolicyEnforce struct {
	UserID     string `json:"user_id" form:"user_id" binding:"required,uuid"`                     //用户UID
	ObjectId   string `json:"object_id" form:"object_id" binding:"required,VerifyNameEn,max=128"` //资源id
	ObjectType string `json:"object_type" form:"object_type" binding:"required"`                  //资源类型 domain 主题域 data_view 逻辑视图 api 接口 sub_view 子视图 indicator 指标
	Action     string `json:"action" form:"action" binding:"required"`                            //请求动作 view 查看 read 读取 download 下载
}

type RulePolicyEnforceEffect struct {
	ObjectId   string `json:"object_id" binding:"required,VerifyNameEn,max=128"`                                                                   //资源id
	ObjectType string `json:"object_type" binding:"required,oneof=domain data_view api sub_service sub_view indicator indicator_dimensional_rule"` //资源类型 domain 主题域 data_view 逻辑视图 api 接口 sub_view 子视图 indicator 指标
	Action     string `json:"action" binding:"required,oneof=view read download allocate auth apply"`                                              //请求动作 view 查看 read 读取 download 下载
	Effect     string `json:"effect"`                                                                                                              //策略结果 allow 允许 deny 拒绝
}

func (p *RulePolicyEnforce) NewPolicyEnforceEffect(effect string) *RulePolicyEnforceEffect {
	return &RulePolicyEnforceEffect{
		ObjectId:   p.ObjectId,
		ObjectType: p.ObjectType,
		Action:     p.Action,
		Effect:     effect,
	}
}

type PolicyEnforceEffect struct {
	ObjectId    string `json:"object_id" binding:"required,VerifyNameEn,max=128"`                                                                   //资源id
	ObjectType  string `json:"object_type" binding:"required,oneof=domain data_view api sub_service sub_view indicator indicator_dimensional_rule"` //资源类型 domain 主题域 data_view 逻辑视图 api 接口 sub_view 子视图 indicator 指标
	SubjectId   string `json:"subject_id" binding:"required,VerifyNameEn,VerifyNameEn,max=128"`                                                     //访问者id
	SubjectType string `json:"subject_type" binding:"required,oneof=app user department role"`                                                      //访问者类型 app 应用 user 用户 department 部门 role 角色
	Action      string `json:"action" binding:"required,oneof=view read download auth allocate apply"`                                              //请求动作 view 查看 read 读取 download 下载
	Effect      string `json:"effect"`                                                                                                              //策略结果 allow 允许 deny 拒绝
}

type PolicyEnforceCheck struct {
	SkipRoleCheck bool `json:"skip_role_check"  form:"skip_role_check" binding:"omitempty"`
}

type PolicyEnforceReq []PolicyEnforce

type MenuResourceEnforceArg struct {
	UserID string `json:"user_id" form:"user_id"` // 用户ID
	Path   string `json:"path" form:"path"`       // 资源的key，这里是菜单的key
	Method string `json:"method" form:"method"`   // 权限
}

type MenuResourceEnforceEffect struct {
	Scope  string `json:"scope"`
	Effect string `json:"effect"`
}

func NewDenyMenuResourceEnforceEffect() *MenuResourceEnforceEffect {
	return &MenuResourceEnforceEffect{
		Scope:  "",
		Effect: EftAllow,
	}
}
func NewAllowMenuResourceEnforceEffect() *MenuResourceEnforceEffect {
	return &MenuResourceEnforceEffect{
		Scope:  "",
		Effect: EftAllow,
	}
}

type MenuResourceActionsArg struct {
	UserID       string `json:"user_id" form:"user_id" binding:"omitempty,uuid"`        // 用户ID
	ResourceID   string `json:"resource_id" form:"resource_id" binding:"omitempty"`     //菜单的key
	ResourceType string `json:"resource_type" form:"resource_type" binding:"omitempty"` //菜单的类型，数据语义治理，智能找数，智能问数
}

type MenuResourceActionsResp struct {
	ResourceID string   `json:"resource_id"` //菜单的key
	Actions    []string `json:"actions"`     //允许的操作
}

type PolicyEnforceRes []PolicyEnforceEffect

type GetObjectsBySubjectIdReq struct {
	SubjectId   string `json:"subject_id" form:"subject_id" binding:"required,VerifyNameEn,max=128"`               //访问者id
	SubjectType string `json:"subject_type" form:"subject_type" binding:"required,oneof=app user department role"` //访问者类型 app 应用 user 用户 department 部门 role 角色
	ObjectType  string `json:"object_type" form:"object_type" binding:"required"`                                  //资源类型 domain 主题域 data_view 逻辑视图 api 接口 sub_view 子视图 indicator 指标, 多种类型用逗号分隔
	ObjectId    string `json:"object_id" form:"object_id" binding:"omitempty,VerifyNameEn"`                        //资源id
}

type GetObjectsBySubjectId struct {
	ObjectId    string       `json:"object_id" binding:"required,VerifyNameEn,max=128"`                                                                   //资源id
	ObjectType  string       `json:"object_type" binding:"required,oneof=domain data_view api sub_service sub_view indicator indicator_dimensional_rule"` //资源类型 domain 主题域 data_view 逻辑视图 api 接口 sub_view 子视图 indicator 指标
	Permissions []Permission `json:"permissions"`                                                                                                         //权限
	// 过期时间，未指定代表永久生效。
	ExpiredAt *meta_v1.Time `json:"expired_at,omitempty"`
}

type GetObjectsBySubjectIdRes struct {
	PageResult[GetObjectsBySubjectId]
}

type ListSubViewsReq struct {
	// 逻辑视图名称
	LogicViewName string `binding:"required" form:"logic_view_name" json:"logic_view_name,omitempty"`
	// 用户 ID，获取此用户的有权限的子视图，默认为当前用户从 Authorization 获取。
	UserID string `form:"user_id" json:"user_id,omitempty"`
	// 动作，未指定时返回拥有任意动作的权限的子视图（行列规则）列表。
	//
	// query 绑定的参数名称是结构体字段名称的单数。
	Actions QueryActions `form:"action" json:"action,omitempty"`
}

type QueryActions string

var allActions = []string{"view", "read", "download"}

func (qa QueryActions) List() (actions []string) {
	// Return all actions if unset.
	if qa == "" {
		return allActions
	}

	for _, a := range strings.Split(string(qa), ",") {
		// skip empty
		if a = strings.TrimSpace(a); a == "" {
			continue
		}
		actions = append(actions, a)
	}
	return actions
}

// 审计日志详情：逻辑视图
type AuditLogDetailLogicView struct {
	// 逻辑视图 ID
	LogicViewID string `json:"logic_view_id,omitempty"`
	// 逻辑视图的名称
	LogicViewName string `json:"logic_view_name,omitempty"`
	// 逻辑视图权限
	LogicViewPolicies []SubjectPoliciesForAuditing `json:"logic_view_policies,omitempty"`
	// 行列（子视图）权限
	SubViewPolicies []ObjectSubjectPoliciesForAuditing `json:"sub_view_policies,omitempty"`
}

var _ audit_v1.ResourceObject = (*AuditLogDetailLogicView)(nil)

// GetDetail implements v1.ResourceObject.
func (l *AuditLogDetailLogicView) GetDetail() json.RawMessage {
	b, _ := json.Marshal(l)
	return b
}

// GetName implements v1.ResourceObject.
func (l *AuditLogDetailLogicView) GetName() string { return l.LogicViewName }

// 审计日志详情：接口
type AuditLogDetailAPI struct {
	// 接口 ID
	ID string `json:"api,omitempty"`
	// 接口名称
	Name string `json:"name,omitempty"`
	// 接口权限
	Policies []SubjectPoliciesForAuditing `json:"policies,omitempty"`
}

var _ audit_v1.ResourceObject = (*AuditLogDetailAPI)(nil)

// GetDetail implements v1.ResourceObject.
func (l *AuditLogDetailAPI) GetDetail() json.RawMessage {
	b, _ := json.Marshal(l)
	return b
}

// GetName implements v1.ResourceObject.
func (l *AuditLogDetailAPI) GetName() string { return l.Name }

type ListSubViews struct {
	// 子视图 ID
	ID string `json:"id,omitempty"`
	// 子视图名称
	Name string `json:"name,omitempty"`
	// 子视图所属逻辑视图 ID
	LogicViewID string `json:"logic_view_id,omitempty"`
	// 子视图所属逻辑视图名称
	LogicViewName string `json:"logic_view_name,omitempty"`
	// 子视图的列名称列表
	Columns []string `json:"columns,omitempty"`
	// 行过滤子句
	RowFilterClause string `json:"row_filter_clause,omitempty"`
}

type ListSubViewsRes PageResult[ListSubViews]

// polices group by subject and object
type ObjectSubjectPoliciesForAuditing struct {
	SubjectPolicies []SubjectPoliciesForAuditing `json:"subject_policies,omitempty"`
	// 资源
	Object ObjectForAuditing `json:"object,omitempty"`
}

// policies group by subject
type SubjectPoliciesForAuditing struct {
	// 访问者
	Subject SubjectForAuditing `json:"subject,omitempty"`
	// 动作列表
	Actions []Action `json:"actions,omitempty"`
}

type SubjectForAuditing struct {
	// 类型
	Type SubjectType `json:"type,omitempty"`
	// ID
	ID string `json:"id,omitempty"`
	// 名称
	Name string `json:"name,omitempty"`
}
type ObjectForAuditing struct {
	// 类型
	Type ObjectType `json:"type,omitempty"`
	// ID
	ID string `json:"id,omitempty"`
	// 名称
	Name string `json:"name,omitempty"`
}

type QueryPolicyExpiredObjectsArgs struct {
	ObjectID []string `json:"object_id"  form:"object_id" binding:"required"`
}

type CurrentUserEnforce struct {
	ObjectId   string `json:"object_id" form:"object_id" binding:"required,VerifyNameEn,max=128"` //资源id
	ObjectType string `json:"object_type" form:"object_type" binding:"required"`                  //资源类型 domain 主题域 data_view 逻辑视图 api 接口 sub_view 子视图 indicator 指标
	Action     string `json:"action" form:"action" binding:"required"`                            //检查的操作，逗号分割的字符串                                                                                           //请求动作 view 查看 read 读取 download 下载
}

const (
	IsfOperationViewDetail    = "view_detail"
	IsfOperationCreate        = "create"
	IsfOperationModify        = "modify"
	IsfOperationDelete        = "delete"
	IsfOperationDataQuery     = "data_query"
	IsfOperationDataDownload  = "data_download"
	IsfOperationAuthorize     = "authorize"
	IsfOperationRuleManage    = "rule_manage"
	IsfOperationRuleAuthorize = "rule_authorize"
	IsfOperationRuleApply     = "rule_apply"
)

func OperationsMatchAction(operation *authorization.AuthOperation, action string) bool {
	if operation == nil {
		return false
	}
	ops := lo.Times(len(operation.Allow), func(index int) string {
		return operation.Allow[index].ID
	})
	if len(ops) <= 0 || action == "" {
		return false
	}
	return lo.Contains(ops, action)
}

const (
	DataViewResourceName   = "data_view"
	SubViewResourceName    = "data_view_row_column_rule"
	ApiResourceName        = authorization.API_RESOURCE_NAME
	SubServiceResourceName = authorization.SUB_SERVICE_RESOURCE_NAME
)

var objectToResourceType = map[string]string{
	ObjectDataView.Str():   DataViewResourceName,
	ObjectSubView.Str():    SubViewResourceName,
	ObjectAPI.Str():        ApiResourceName,
	ObjectSubService.Str(): SubServiceResourceName,
}

var resourceTypeToObject = lo.Invert(objectToResourceType)

func ObjectToResourceType(object string) string {
	return objectToResourceType[object]
}

func ResourceTypeToObject(resourceType string) string {
	return resourceTypeToObject[resourceType]
}
