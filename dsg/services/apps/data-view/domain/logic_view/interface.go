package logic_view

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/rest/virtualization_engine"
	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"

	"github.com/kweaver-ai/dsg/services/apps/data-view/common/models/request"
	"github.com/kweaver-ai/dsg/services/apps/data-view/domain/form_view"
)

type LogicViewUseCase interface {
	AuthorizableViewList(ctx context.Context, req *AuthorizableViewListReq) (*AuthorizableViewListResp, error)
	SubjectDomainList(ctx context.Context) (res *SubjectDomainListRes, err error)
	CreateLogicView(ctx context.Context, req *CreateLogicViewReq) (string, error)
	UpdateLogicView(ctx context.Context, req *UpdateLogicViewReq) error
	GetDraftReq(ctx context.Context, req *GetDraftReq) (*GetDraftRes, error)
	DeleteDraft(ctx context.Context, req *DeleteDraftReq) error
	CreateAuditProcessInstance(ctx context.Context, req *CreateAuditProcessInstanceReq) error
	UndoAudit(ctx context.Context, req *form_view.UndoAuditReq) error
	GetViewAuditors(ctx context.Context, req *GetViewAuditorsReq) ([]*AuditUser, error)
	GetViewBasicInfo(ctx context.Context, req *GetViewBasicInfoReqParam) (*GetViewBasicInfoResp, error)
	GetViewAuditorsByApplyId(ctx context.Context, req *GetViewAuditorsByApplyIdReq) ([]*AuditUser, error)
	PushViewToEs(ctx context.Context) error
	GetSyntheticData(ctx context.Context, req *GetSyntheticDataReq) (*virtualization_engine.FetchDataRes, error)
	GetSyntheticDataCatalog(ctx context.Context, req *GetSyntheticDataReq) (*virtualization_engine.FetchDataRes, error)
	GetSampleData(ctx context.Context, req *GetSampleDataReq) (*GetSampleDataRes, error)
	StandardChange(ctx context.Context, standardCodes []string) error
	DictChange(ctx context.Context, req *DictChangeReq) error
	ClearSyntheticDataCache(ctx context.Context, req *GetSyntheticDataReq) error
}

type AuditType struct {
	AuditType string `json:"audit_type" form:"audit_type" binding:"required,oneof=af-data-view-publish af-data-view-online af-data-view-offline"` // 审核类型 af-data-view-publish 发布审核 af-data-view-online 上线审核 af-data-view-offline 下线审核
}

//region AuthorizableViewList

type AuthorizableViewListReq struct {
	AuthorizableViewListReqQueryParam `param_type:"query"`
}

type AuthorizableViewListReqQueryParam struct {
	request.PageSortKeyword2
	SubjectDomainID         string   `json:"subject_domain_id" form:"subject_domain_id" binding:"omitempty,uuid" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"` // 主题id
	IncludeSubSubjectDomain bool     `json:"include_sub_subject_domain"  form:"include_sub_subject_domain" binding:"omitempty"`                                  //包含子主题域
	DepartmentID            string   `json:"department_id" form:"department_id" binding:"omitempty,uuid" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"`         // 部门id
	IncludeSubDepartment    bool     `json:"include_sub_department"  form:"include_sub_department" binding:"omitempty"`                                          //包含子部门
	ViewIds                 []string `json:"-"`
}

type AuthorizableViewListResp struct {
	PageResultNew[form_view.FormView]
}

type PageResultNew[T any] struct {
	Entries    []*T  `json:"entries" binding:"required"`                       // 对象列表
	TotalCount int64 `json:"total_count" binding:"required,gte=0" example:"3"` // 当前筛选条件下的对象数量
}

//endregion

//region SubjectDomainList

type SubjectDomain struct {
	Id               string   `json:"id"`                 // 对象id
	Name             string   `json:"name"`               // 对象名称
	Description      string   `json:"description"`        // 描述
	Type             string   `json:"type"`               // 对象类型
	PathId           string   `json:"path_id"`            // 路径id
	PathName         string   `json:"path_name"`          // 路径名称
	Owners           []string `json:"owners"`             // 数据owner
	CreatedBy        string   `json:"created_by"`         // 创建人
	CreatedAt        int64    `json:"created_at"`         // 创建时间
	UpdatedBy        string   `json:"updated_by"`         // 修改人
	UpdatedAt        int64    `json:"updated_at"`         // 修改时间
	ChildCount       int      `json:"child_count"`        // 子对象数量
	SecondChildCount int      `json:"second_child_count"` // 第二层子对象数量 only for BusinessObject and BusinessActivity
}

type SubjectDomainListRes struct {
	PageResultNew[SubjectDomain]
}

//endregion

//region CreateLogicView

type CreateLogicViewReq struct {
	CreateLogicViewParam `param_type:"body"`
}
type CreateLogicViewParam struct {
	Type          string `json:"type" binding:"required,oneof=custom logic_entity"`                                                          //创建视图类型 custom | logic_entity
	SubjectId     string `json:"subject_id" binding:"omitempty,uuid"`                                                                        //主题域id 或者 逻辑实体id 根据type类型传入
	SQL           string `json:"sql" binding:"required"`                                                                                     // 创建视图sql
	BusinessName  string `json:"business_name" binding:"required,min=1,max=255" example:"xxxx"`                                              // 视图业务名称
	TechnicalName string `json:"technical_name" binding:"required,min=1,max=100" example:"xxxx"`                                             // 视图技术名称
	Description   string `json:"description"  binding:"TrimSpace,omitempty,lte=300" example:"description"`                                   // 描述
	DepartmentID  string `json:"department_id" form:"department_id" binding:"omitempty,uuid" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"` // 部门id
	//OwnerID         []string           `json:"owner_id" form:"owner_id" binding:"omitempty,dive,uuid" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"`
	Owners          []*form_view.Owner `json:"owners"`                                                                                                            // 数据Owner
	SceneAnalysisId string             `json:"scene_analysis_id" form:"scene_analysis_id" binding:"required,uuid" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"` //场景分析画布id
	LogicViewField  []*LogicViewField  `json:"logic_view_field" form:"logic_view_field" binding:"required,gte=1,dive"`
}
type LogicViewField struct {
	ID            string `json:"id" binding:"required,uuid"`                                     // 列id
	BusinessName  string `json:"business_name" binding:"required,min=1,max=255" example:"xxxx"`  // 列业务名称
	TechnicalName string `json:"technical_name" binding:"required,min=1,max=100" example:"xxxx"` // 列技术名称
	PrimaryKey    bool   `json:"primary_key"`                                                    // 是否主键
	DataType      string `json:"data_type" binding:"required,DataTypeChar"`                      // 数据类型

	DataLength       int32  `json:"data_length" binding:"omitempty,gte=0"`         // 数据长度
	DataAccuracy     int32  `json:"data_accuracy" binding:"omitempty,gte=0"`       // 数据精度（仅DECIMAL类型）
	OriginalDataType string `json:"original_data_type"`                            // 原始数据类型
	IsNullable       string `json:"is_nullable"  binding:"omitempty,oneof=YES NO"` // 是否为空
	AttributeID      string `json:"attribute_id" binding:"omitempty,uuid"`         // L5属性ID
	ClassifyType     int    `json:"classfity_type" binding:"omitempty,oneof=1 2"`  // 属性分类
	GradeLabelID     string `json:"label_id" binding:"omitempty"`                  // 分级标签ID
	GradeType        string `json:"grade_type" binding:"omitempty,oneof=1 2"`      // 分级方式类型(1自动2人工)

	StandardCode      string `json:"standard_code"`                               // 关联数据标准code
	CodeTableID       string `json:"code_table_id"`                               // 关联码表IDe
	ClearAttributeID  string `json:"clear_attribute_id" binding:"omitempty,uuid"` //清除属性ID
	ClearGradeLabelID string `json:"clear_label_id" binding:"omitempty"`          //清除分级标签ID
}

//endregion

//region UpdateLogicView

type UpdateLogicViewReq struct {
	UpdateLogicViewParam `param_type:"body"`
}
type UpdateLogicViewParam struct {
	ID                  string            `json:"id" binding:"required,uuid" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"`                     //视图id
	Type                string            `json:"type" binding:"required,oneof=custom logic_entity"`                                             //创建视图类型 custom | logic_entity
	SQL                 string            `json:"sql" binding:"required"`                                                                        // 创建视图sql
	BusinessTimestampID string            `json:"business_timestamp_id" binding:"omitempty,uuid" example:"99f78432-ee4e-43df-804c-4ccc4ff17f15"` // 业务时间字段id
	LogicViewField      []*LogicViewField `json:"logic_view_field" form:"logic_view_field" binding:"required,gte=1,dive"`
}

//endregion

//region GetDraft

type GetDraftReq struct {
	GetDraftParam `param_type:"path"`
}
type GetDraftParam struct {
	ID string `json:"id" uri:"id" json:"id" binding:"required,uuid" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"` //视图草稿id
}
type GetDraftRes struct {
	ID string `json:"id" binding:"required,uuid" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"` //视图草稿id
	//todo 视图信息及字段信息及标准码表
}

//endregion

//region DeleteDraft

type DeleteDraftReq struct {
	DeleteDraftParam `param_type:"path"`
}
type DeleteDraftParam struct {
	ID string `json:"id" uri:"id" json:"id" binding:"required,uuid" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"` //视图草稿id
}

//endregion
//region DeleteDraft

type CreateAuditProcessInstanceReq struct {
	CreateAuditProcessInstanceParam `param_type:"body"`
}
type CreateAuditProcessInstanceParam struct {
	AuditType
	ID string `json:"id" binding:"required,uuid" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"` //视图id
}

//endregion

//region GetViewAuditorsByApplyId

type GetViewAuditorsByApplyIdReq struct {
	GetViewAuditorsByApplyIdParam `param_type:"path"`
}
type GetViewAuditorsByApplyIdParam struct {
	ApplyId uint64 `json:"id" uri:"id" form:"apply_id" binding:"required,uuid" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"` //视图申请审核id
}

//endregion

//region GetViewAuditors

type GetViewAuditorsReq struct {
	GetViewAuditorsParam `param_type:"path"`
}
type GetViewAuditorsParam struct {
	ID string `json:"id" uri:"id" form:"id" binding:"required,uuid" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"` //视图id
}

//type GetViewAuditorsRes []AuditUser

type AuditUser struct {
	UserId string `json:"user_id"` // 审核员用户id
}

//endregion

//region GetSyntheticData

type GetSyntheticDataReq struct {
	GetSyntheticDataParam `param_type:"path"`
	GetSyntheticDataQuery `param_type:"query"`
}
type GetSyntheticDataParam struct {
	ID string `json:"id" uri:"id" form:"id" binding:"required,uuid" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"` //视图id
}

type GetSyntheticDataQuery struct {
	SamplesSize int `json:"samples_size" form:"samples_size,default=3" binding:"omitempty" example:"3"` //合成数据条数
}

//endregion

//region GetSampleData

type GetSampleDataReq struct {
	GetSyntheticDataParam `param_type:"path"`
}
type GetSampleDataParam struct {
	ID string `json:"id" uri:"id" form:"id" binding:"required,uuid" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"` //视图id
}
type GetSampleDataRes struct {
	Type string `json:"type"` //合成/样例
	*virtualization_engine.FetchDataRes
}

//endregion

//region  StandardChangeMQ

type StandardChangeReq struct {
	Header  Header  `json:"header"`
	Payload Payload `json:"payload"`
}
type Header struct {
}
type Payload struct {
	Type    string  `json:"type"`
	Content Content `json:"content"`
}
type Content struct {
	Type      string     `json:"type"`
	TableName string     `json:"table_name"`
	Entities  []Entities `json:"entities"`
}
type Entities struct {
	ID   any    `json:"id"`
	Code string `json:"code"`
}

//endregion

// region  DictChangeMQ

type DictChangeReq struct {
	Type        int   `json:"type"`        //1码表 2编码规则
	DictRuleIds []int `json:"dictRuleIds"` //码表和编码规则ID
	DataCodes   []int `json:"dataCodes"`   //数据元code
}

//endregion

//region GetViewBasicInfoReq

type GetViewBasicInfoReqParam struct {
	GetViewBasicInfoReq `param_type:"query"`
}

type GetViewBasicInfoReq struct {
	ID []string `json:"id" uri:"id" form:"id" binding:"omitempty"` //视图id
}

type GetViewBasicInfoResp []*model.FormView

//endregion
