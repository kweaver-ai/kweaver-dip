package dto

import (
	"encoding/json"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/infrastructure/repository/db/model"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/util/sets"
	meta_v1 "github.com/kweaver-ai/idrm-go-common/api/meta/v1"
)

// LogicViewAuthorizingRequestList 定义逻辑视图授权申请列表
type LogicViewAuthorizingRequestList struct {
	Items []LogicViewAuthorizingRequest `json:"items,omitempty"`
}

// LogicViewAuthorizingRequest 定义逻辑视图授权申请
type LogicViewAuthorizingRequest struct {
	// ID
	ID string `json:"id,omitempty" example:"0194077d-2290-7387-b505-ac3208b20087"`
	// 创建时间
	CreationTimestamp time.Time `json:"creation_timestamp,omitempty" example:"2024-12-27T17:46:35Z"`
	// 更新时间
	UpdateTimestamp time.Time `json:"update_timestamp,omitempty" example:"2024-12-27T17:46:35Z"`
	// 申请的配置、定义。描述了对哪个逻辑视图、行列规则，为哪些用户申请哪些动作的授权。
	Spec LogicViewAuthorizingRequestSpec `json:"spec,omitempty"`
	// 申请的状态，由服务端设置
	Status LogicViewAuthorizingRequestStatus `json:"status,omitempty"`
	// 引用资源列表，由服务端设置
	References []ReferenceSource `json:"references,omitempty"`
	// 样例数据，由服务端设置
	Preview *VirtualizationEngineViewData `json:"preview,omitempty"`
}

// LogicViewAuthorizingRequestSpec 描述了逻辑视图授权申请是为哪些用户申请哪个逻
// 辑视图、行列规则，执行哪些动作的授权。
type LogicViewAuthorizingRequestSpec struct {
	// 逻辑视图的 ID
	ID string `json:"id,omitempty" example:"0194077d-2290-7387-b505-ac3208b20087"`
	// 对逻辑视图所申请的授权列表。如果只申请行列规则（子视图），则不需要配置此字段。
	Policies []SubjectPolicy `json:"policies,omitempty"`
	// 对行列规则的授权申请列表。如果只申请授权逻辑视图，则不需要此字段。
	SubViews []SubViewAuthorizingRequestSpec `json:"sub_views,omitempty"`
	// 是否暂停后续处理，例如发起 workflow 审核；创建行列规则（子视图）；授权用户操作逻辑视图、行列规则（子视图）
	Suspend bool `json:"suspend,omitempty"`
	// 创建逻辑视图授权申请的用户的 ID
	RequesterID string `json:"requester_id,omitempty" example:"0194077d-2290-7387-b505-ac3208b20087"`
	// 发起授权申请的原因
	Reason string `json:"reason,omitempty" example:"申请理由"`
	// 授权申请的用途，影响参数校验规则，默认为 AuthorizingRequest。
	//  - AuthorizingRequest 授权申请
	//  - DemandManagement 需求管理
	Usage LogicViewAuthorizingRequestUsage `json:"usage,omitempty"`
}

// LogicViewAuthorizingRequestStatus 描述了逻辑视图授权申请当前的状态，处于当前
// 状态的原因等。
type LogicViewAuthorizingRequestStatus struct {
	// 逻辑视图授权申请所处的阶段
	Phase LogicViewAuthorizingRequestPhase `json:"phase,omitempty"`
	// 逻辑视图授权申请处于当前阶段的原因，人类可读
	Message string `json:"message,omitempty" example:"申请被驳回"`
	// 审核流程 ID
	ApplyID string `json:"apply_id,omitempty" example:"0194078a-9319-77d1-8229-b27cb5e1e845"`
	// 审核流程的 key
	ProcDefKey string `json:"proc_def_key,omitempty" example:"Process_VP2LSITg"`
	// 逻辑视图授权申请被创建时，申请所引用的行列规则（子视图）的快照
	Snapshots []SubView `json:"snapshots,omitempty"`
}

// LogicViewAuthorizingRequestPhase 定义 LogicViewAuthorizingRequest 在其生命周
// 期中所处的阶段
type LogicViewAuthorizingRequestPhase string

const (
	// 待处理
	LogicViewAuthorizingRequestPending LogicViewAuthorizingRequestPhase = "Pending"
	// 审批中
	LogicViewAuthorizingRequestAuditing LogicViewAuthorizingRequestPhase = "Auditing"
	// 申请被拒绝
	LogicViewAuthorizingRequestRejected LogicViewAuthorizingRequestPhase = "Rejected"
	// 申请被允许
	LogicViewAuthorizingRequestApproved LogicViewAuthorizingRequestPhase = "Approved"
	// 申请被发起者撤回
	LogicViewAuthorizingRequestUndone LogicViewAuthorizingRequestPhase = "Undone"
	// 创建行列规则（子视图）中
	LogicViewAuthorizingRequestSubViewCreating LogicViewAuthorizingRequestPhase = "SubViewCreating"
	// 授权中
	LogicViewAuthorizingRequestAuthorizing LogicViewAuthorizingRequestPhase = "Authorizing"
	// 失败。创建资源失败，或应用权限策略失败
	LogicViewAuthorizingRequestFailed LogicViewAuthorizingRequestPhase = "Failed"
	// 	完成
	LogicViewAuthorizingRequestCompleted LogicViewAuthorizingRequestPhase = "Completed"
)

// SupportedLogicViewAuthorizingRequestPhases 定义支持的
// LogicViewAuthorizingRequestPhase
var SupportedLogicViewAuthorizingRequestPhases = sets.New[LogicViewAuthorizingRequestPhase](
	LogicViewAuthorizingRequestPending,
	LogicViewAuthorizingRequestAuditing,
	LogicViewAuthorizingRequestRejected,
	LogicViewAuthorizingRequestApproved,
	LogicViewAuthorizingRequestUndone,
	LogicViewAuthorizingRequestSubViewCreating,
	LogicViewAuthorizingRequestAuthorizing,
	LogicViewAuthorizingRequestFailed,
	LogicViewAuthorizingRequestCompleted,
)

// SubjectPolicy 描述了哪个操作者，执行哪些动作
type SubjectPolicy struct {
	// 操作者类型
	SubjectType SubjectType `json:"subject_type,omitempty"`
	// 操作者 ID
	SubjectID string `json:"subject_id,omitempty"`
	// 动作列表
	Actions []Action `json:"actions,omitempty"`
	// 过期时间
	ExpiredAt *meta_v1.Time `json:"expired_at,omitempty"`
}

// SubViewAuthorizingRequestSpec 描述了行列规则（子视图）授权申请是为哪些用户申
// 请哪个行列规则（子视图），执行哪些动作的授权。
type SubViewAuthorizingRequestSpec struct {
	// 行列规则（子视图）ID，引用已存在的行列规则时使用此字段。授权申请被审批通
	// 过后，此字段会被更新为新创建的行列规则的 ID。
	ID string `json:"id,omitempty" example:"0194077d-2290-7387-b505-ac3208b20087"`
	// 行列规则（子视图）定义，创建新的行列规则（子视图）时使用此字段。行列规则
	// （子视图）将会在授权申请被允许后创建
	Spec *SubViewSpec `json:"spec,omitempty"`
	// 对行列规则（子视图）所申请的授权列表
	Policies []SubjectPolicy `json:"policies,omitempty"`
}

// LogicViewAuthorizingRequestUsage 定义逻辑视图授权管理的用途，影响参数校验规则。
type LogicViewAuthorizingRequestUsage string

const (
	// 授权申请
	LogicViewAuthorizingRequestAuthorizingRequest LogicViewAuthorizingRequestUsage = "AuthorizingRequest"
	// 需求管理
	LogicViewAuthorizingRequestDemandManagement LogicViewAuthorizingRequestUsage = "DemandManagement"
)

// SupportedLogicViewAuthorizingRequestUsages 定义支持的
// LogicViewAuthorizingRequestUsage
var SupportedLogicViewAuthorizingRequestUsages = sets.New(
	LogicViewAuthorizingRequestAuthorizingRequest,
	LogicViewAuthorizingRequestDemandManagement,
)

// ReferenceSource 定义引用的资源。有且只有一个属性会被设置。
type ReferenceSource struct {
	// application 代表引用的应用
	Application *ApplicationSource `json:"application,omitempty"`
	// department 代表引用的部门
	Department *DepartmentSource `json:"department,omitempty"`
	// user 代表引用的用户
	User *UserSource `json:"user,omitempty"`
}

// ApplicationSource 定义引用的应用
type ApplicationSource struct {
	// ID
	ID string `json:"id,omitempty" example:"0194078b-c05b-7a4c-8073-ab3d3b466cc4"`
	// 名称
	Name string `json:"name,omitempty" example:"应用名称"`
}

// UserSource 定义引用的用户
type UserSource struct {
	// 用户 ID
	ID string `json:"id,omitempty" example:"0194078c-f05f-774a-b252-42914c42fd14"`
	// 显示名称
	Name string `json:"name,omitempty" example:"用户名称"`
	// 所属部门 ID 列表，如果为空，代表不属于任何部门
	DepartmentIDs []string `json:"department_ids,omitempty"`
}

// DepartmentSource 定义引用的部门
type DepartmentSource struct {
	// 部门 ID
	ID string `json:"id,omitempty" example:"0194078c-055d-7329-a760-20c6f8e69d9c"`
	// 名称
	Name string `json:"name,omitempty" example:"部门名称"`
	// 上级部门 ID，如果为空，代表不存在上级部门
	ParentID string `json:"parent_id,omitempty" example:"0194078c-7662-71ec-a854-13c40d766759"`
}

// GetLogicViewAuthorizingRequestOptions 定义获取逻辑视图授权申请的选项
type GetLogicViewAuthorizingRequestOptions struct {
	// 是否获取 LogicViewAuthorizingRequest 引用的资源：用户、部门
	Reference bool `json:"reference,omitempty" form:"reference"`
	// 是否获取逻辑视图的预览
	Preview bool `json:"preview,omitempty" form:"preview"`
}

// ListLogicViewAuthorizingRequestOptions 定义获取逻辑视图授权申请列表的选项
type ListLogicViewAuthorizingRequestOptions struct {
	// 逻辑视图授权申请 ID 列表，列表包含这些逻辑视图
	IDs []string `json:"ids,omitempty"`
	// 过滤处于指定 Phase 的逻辑视图授权申请
	Phases []LogicViewAuthorizingRequestPhase `json:"phases,omitempty"`
}

func LogicViewAuthReqModelMarshalDTO(r *model.LogicViewAuthorizingRequest) (out *LogicViewAuthorizingRequest, err error) {
	out = new(LogicViewAuthorizingRequest)
	err = LogicViewAuthReqModelMarshalDTOInto(r, out)
	return
}

func LogicViewAuthReqModelMarshalDTOInto(r *model.LogicViewAuthorizingRequest, out *LogicViewAuthorizingRequest) (err error) {
	rr := LogicViewAuthorizingRequest{
		ID:                r.ID,
		CreationTimestamp: r.CreatedAt,
		UpdateTimestamp:   r.UpdatedAt,
		Status: LogicViewAuthorizingRequestStatus{
			Phase:      LogicViewAuthorizingRequestPhase(r.Phase),
			Message:    r.Message,
			ApplyID:    r.ApplyID,
			ProcDefKey: r.ProcDefKey,
		},
	}

	if err = json.Unmarshal(r.Spec, &rr.Spec); err != nil {
		return
	}

	if err = json.Unmarshal(r.Snapshots, &rr.Status.Snapshots); err != nil {
		return
	}

	*out = rr

	return
}

func LogicViewAuthReqModelUnmarshalDTO(r *model.LogicViewAuthorizingRequest, req *LogicViewAuthorizingRequest) (err error) {
	spec, err := json.Marshal(req.Spec)
	if err != nil {
		return
	}

	snapshots, err := json.Marshal(req.Status.Snapshots)
	if err != nil {
		return
	}

	r.ID = req.ID
	r.Spec = spec
	r.Phase = string(req.Status.Phase)
	r.Message = req.Status.Message
	r.ApplyID = req.Status.ApplyID
	r.ProcDefKey = req.Status.ProcDefKey
	r.Snapshots = snapshots
	r.CreatedAt = req.CreationTimestamp
	r.UpdatedAt = req.UpdateTimestamp

	return nil
}
