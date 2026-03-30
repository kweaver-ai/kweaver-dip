package dto

import (
	"github.com/kweaver-ai/dsg/services/apps/auth-service/infrastructure/repository/db/model"
	meta_v1 "github.com/kweaver-ai/idrm-go-common/api/meta/v1"
	"time"
)

// DataAuthRequestArg 数仓数据申请的创建，修改参数
type DataAuthRequestArg struct {
	// 申请单ID,  不对外开放
	ID string `json:"-"`
	// 申请单名称
	Name string `json:"name" binding:"required,min=1,max=128"`
	// 库表ID
	DataID string `json:"data_id" binding:"required,uuid"`
	//申请类型
	RequestType string `json:"request_type" binding:"required,oneof=check query"`
	//权限过期时间时间戳
	ExpiredAt int64 `json:"expired_at"`
	//行列规则压缩成的字符串
	Spec string `json:"spec,omitempty"`
	// 对行列规则的授权申请列表。如果只申请授权逻辑视图，则不需要此字段。
	SubView SubViewAuthorizingRequestSpec `json:"-"`
}

// IsAuditDataChanged 判断是不是审核数据修改了， true表示有审核数据修改了
func (d *DataAuthRequestArg) IsAuditDataChanged(formSpec *model.TDwhAuthRequestSpec) bool {
	if formSpec.ID == "" {
		return true
	}
	//如果仅仅是修改了名称，则不需要发送审核
	return !(formSpec.RequestType == d.RequestType && formSpec.Spec == d.Spec && formSpec.ExpiredAt == d.ExpiredAt)
}

// DataAuthRequestBasic  数仓数据申请基本信息
type DataAuthRequestBasic struct {
	ID               string    `json:"id"`                 // 申请单ID
	Name             string    `json:"name"`               // 申请单名称
	Applicant        string    `json:"applicant"`          // 申请人
	ApplicantName    string    `json:"applicant_name"`     // 申请人
	ApplyTime        int64     `json:"apply_time"`         // 申请时间
	DataBusinessName string    `json:"data_business_name"` // 库表名称（业务名称）
	DataTechName     string    `json:"data_tech_name"`     // 技术名称
	DataID           string    `json:"data_id"`            // 库表ID
	CreatedAt        time.Time `json:"created_at"`         // 创建时间, 申请时间
	UpdatedAt        time.Time `json:"updated_at"`         // 更新时间
}

// DataAuthRequestListArgs 数仓申请列表参数
type DataAuthRequestListArgs struct {
	Keyword   string `json:"keyword" form:"keyword"  binding:"omitempty"`          // 申请单名称
	Applicant string `json:"applicant"  form:"applicant" binding:"omitempty,uuid"` // 申请人
	DataID    string `json:"data_id" form:"data_id"  binding:"omitempty"`          //数据ID，支持多个
	Phase     string `json:"phase"  form:"phase" binding:"omitempty"`
	Offset    int    `json:"offset" form:"offset,default=1" binding:"number,min=1" default:"1"`         // 页码 默认 1
	Limit     int    `json:"limit" form:"limit,default=10" binding:"number,min=1,max=100" default:"10"` // 每页大小 默认 10
}

// DataAuthFormListItem 申请单列表项结构体
type DataAuthFormListItem struct {
	DataAuthRequestBasic
	Status DataAuthRequestStatus `json:"status,omitempty"`
}

// UserDataAuthRequestListArgs 数仓申请列表参数
type UserDataAuthRequestListArgs struct {
	Applicant string `json:"applicant"  form:"applicant"   binding:"omitempty,uuid"` // 申请人
	DataID    string `json:"data_id" form:"data_id"  binding:"omitempty"`            //数据ID，支持多个
}

// UserDataAuthFormListItem 用户申请单列表项结构体
type UserDataAuthFormListItem struct {
	DataID      string              `json:"data_id"`      //库表ID
	RequestForm *DataAuthFormSimple `json:"request_form"` //请求的表单，为空表示没有
}

type DataAuthFormSimple struct {
	ID          string `json:"id"`           // 申请单ID
	Name        string `json:"name"`         // 申请单名称
	RequestType string `json:"request_type"` // 申请类型
	Phase       string `json:"phase"`        // 审核阶段
}

// DataAuthFormDetail 申请单详情
type DataAuthFormDetail struct {
	DataAuthFormListItem
	RequestType      string                        `json:"request_type"`       //请求类型
	ExpiredAt        int64                         `json:"expired_at"`         //权限过期时间，前端详情用
	Spec             string                        `json:"spec"`               //行列规则压缩成的字符串，前端详情使用
	DraftRequestType string                        `json:"draft_request_type"` //草稿请求类型
	DraftExpiredAt   int64                         `json:"draft_expired_at"`
	DraftSpec        string                        `json:"draft_spec"`
	SubView          SubViewAuthorizingRequestSpec `json:"-"` //后续业务逻辑用
}

func (d *DataAuthFormDetail) GetExpiredAt() *meta_v1.Time {
	return d.SubView.Policies[0].ExpiredAt
}

func (d *DataAuthFormDetail) SpecChanged() bool {
	return d.Spec != d.DraftSpec
}

func (d *DataAuthFormDetail) ExpiredAtChanged() bool {
	return d.ExpiredAt != d.DraftExpiredAt
}

// DataAuthRequestStatus 描述了逻辑视图授权申请当前的状态，处于当前
// 状态的原因等。
type DataAuthRequestStatus struct {
	// 逻辑视图授权申请所处的阶段
	Phase string `json:"phase,omitempty"`
	// 逻辑视图授权申请处于当前阶段的原因，人类可读
	Message string `json:"message,omitempty" example:"申请被驳回"`
	// 审核流程 ID
	ApplyID string `json:"apply_id,omitempty" example:"0194078a-9319-77d1-8229-b27cb5e1e845"`
	// 审核流程的 key
	ProcDefKey string `json:"proc_def_key,omitempty" example:"Process_VP2LSITg"`
}

type IDReq struct {
	ID string `json:"id" uri:"id" form:"id" binding:"required,uuid"`
}

// AuditListReq 审核列表参数
type AuditListReq struct {
	Target string `form:"target" form:"target,default=tasks" binding:"oneof=tasks historys"` // 审核列表类型 tasks 待审核 historys 已审核
	PageInfo
}

// DataAuthReqFormAuditListItem 申请单列表项结构体
type DataAuthReqFormAuditListItem struct {
	ID               string `json:"id"`                 // 申请单ID
	Name             string `json:"name"`               // 申请单名称
	DataBusinessName string `json:"data_business_name"` // 库表名称（业务名称）
	DataTechName     string `json:"data_tech_name"`     // 技术名称
	DataID           string `json:"data_id"`            // 库表ID
	AuditCommonInfo
}

type AuditCommonInfo struct {
	ApplyID       string `json:"apply_id"`       //申请ID
	BizType       string `json:"biz_type"`       //业务类型, 审核类型
	AuditStatus   string `json:"audit_status"`   //审核状态
	AuditTime     string `json:"audit_time"`     //审核时间，2006-01-02 15:04:05
	Applicant     string `json:"applicant"`      //申请人ID
	ApplicantName string `json:"applicant_name"` //申请人名称
	ProcInstID    string `json:"proc_inst_id"`   //审核实例ID
	ApplyTime     string `json:"apply_time"`     //申请时间
}

// TestAuditMsgReq 申请消息
type TestAuditMsgReq struct {
	ID    string `json:"id"  form:"id"   binding:"omitempty,uuid"`
	Phase string `json:"phase" form:"phase"  binding:"omitempty"`
}
