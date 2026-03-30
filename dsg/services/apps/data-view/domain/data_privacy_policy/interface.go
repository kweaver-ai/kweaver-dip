package data_privacy_policy

import (
	"context"
	// "encoding/json"
	// "mime/multipart"

	// "github.com/samber/lo"

	// audit_v1 "github.com/kweaver-ai/idrm-go-common/api/audit/v1"
	// "github.com/kweaver-ai/idrm-go-common/rest/data_view"
	// "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/mq/es"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/rest/virtualization_engine"
	// "github.com/kweaver-ai/dsg/services/apps/data-view/common/constant"

	"github.com/kweaver-ai/dsg/services/apps/data-view/common/models/request"
	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
	// "github.com/kweaver-ai/idrm-go-frame/core/enum"
	// "github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

type DataPrivacyPolicyUseCase interface {
	PageList(ctx context.Context, req *PageListDataPrivacyPolicyReq) (*PageListDataPrivacyPolicyResp, error)
	Create(ctx context.Context, req *CreateDataPrivacyPolicyReq) (*CreateDataPrivacyPolicyResp, error)
	Update(ctx context.Context, req *UpdateDataPrivacyPolicyReq) (*UpdateDataPrivacyPolicyResp, error)
	CreateFieldBatch(ctx context.Context, req *CreateDataPrivacyPolicyFieldBatchReq) (*CreateDataPrivacyPolicyFieldBatchResp, error)
	GetDetailById(ctx context.Context, req *GetDetailByIdReq) (*DataPrivacyPolicyDetailResp, error)
	GetDetailByFormViewId(ctx context.Context, req *GetDetailByFormViewIdReq) (*DataPrivacyPolicyDetailResp, error)
	Delete(ctx context.Context, req *DeleteDataPrivacyPolicyReq) (*DeleteDataPrivacyPolicyResp, error)
	IsExistByFormViewId(ctx context.Context, req *IsExistByFormViewIdReq) (*IsExistByFormViewIdResp, error)
	GetFormViewIdsByFormViewIds(ctx context.Context, req *GetFormViewIdsByFormViewIdsReq) (*GetFormViewIdsByFormViewIdsResp, error)
	GetDesensitizationDataById(ctx context.Context, req *GetDesensitizationDataByIdReq) (*GetDesensitizationDataByIdResp, error)
}

type DataPrivacyPolicy struct {
	ID                 string `json:"id"`                   // 数据隐私策略id
	FormViewID         string `json:"form_view_id"`         // 表单视图id
	UniformCatalogCode string `json:"uniform_catalog_code"` // 逻辑视图编码
	TechnicalName      string `json:"technical_name"`       // 表技术名称
	BusinessName       string `json:"business_name"`        // 表业务名称
	Description        string `json:"description"`          // 隐私策略描述
	SubjectID          string `json:"subject_id"`           // 所属主题id
	Subject            string `json:"subject"`              // 所属主题
	DepartmentID       string `json:"department_id"`        // 所属部门id
	Department         string `json:"department"`           // 所属部门
	Masking_Fields     string `json:"masking_fields"`       // 脱敏字段组
	Masking_Rules      string `json:"masking_rules"`        // 脱敏规则组
	CreatedAt          int64  `json:"created_at"`           // 创建时间
	CreatedByUser      string `json:"created_by_user"`      // 创建者
	UpdatedAt          int64  `json:"updated_at"`           // 编辑时间
	UpdatedByUser      string `json:"updated_by_user"`      // 编辑者
}

// region PageList
type PageListDataPrivacyPolicyReq struct {
	PageListDataPrivacyPolicyReqQueryParam `param_type:"query"`
}
type PageListDataPrivacyPolicyReqQueryParam struct {
	request.PageSortKeyword3
	DatasourceId string `json:"datasource_id" form:"datasource_id" binding:"omitempty,uuid"` //数据源id

	SubjectID         string   `json:"subject_id" form:"subject_id" binding:"omitempty,uuid" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"` // 主题id
	IncludeSubSubject bool     `json:"include_sub_subject"  form:"include_sub_subject" binding:"omitempty"`                                  //包含子主题
	SubSubSubjectIDs  []string `json:"-"`                                                                                                    // 子主题域名id

	DepartmentID         string   `json:"department_id" form:"department_id" binding:"omitempty,uuid" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"` // 部门id
	IncludeSubDepartment bool     `json:"include_sub_department"  form:"include_sub_department" binding:"omitempty"`                                  //包含子部门
	SubDepartmentIDs     []string `json:"-"`
}

type PageListDataPrivacyPolicyResp struct {
	PageResultNew[DataPrivacyPolicy]
}

//endregion

// region CreateObject
type CreateDataPrivacyPolicyReq struct {
	CreateDataPrivacyPolicyReqBody `param_type:"body"`
}

type CreateDataPrivacyPolicyReqBody struct {
	FormViewID  string `json:"form_view_id" form:"form_view_id" binding:"uuid" example:"13b8a80b-1914-4896-99d8-51559dba26c4"` // 视图id
	Description string `json:"description" form:"description" binding:"omitempty"`                                             // 描述
	FieldList   []struct {
		FormViewFieldID       string `json:"form_view_field_id" form:"form_view_field_id" binding:"uuid"`           // 视图字段id
		DesensitizationRuleID string `json:"desensitization_rule_id" form:"desensitization_rule_id" binding:"uuid"` // 脱敏规则id
	} `json:"field_list" form:"field_list"` // 隐私字段列表
}

type CreateDataPrivacyPolicyResp struct {
	ID string `json:"id"` // 数据隐私策略id
}

//endregion

// region GetDetailById
type GetDetailByIdReq struct {
	IDReqParamPath `param_type:"path"` // 数据隐私策略id
}

//endregion

// region GetDetailByFormViewId
type GetDetailByFormViewIdReq struct {
	IDReqParamPath `param_type:"path"` // 表单视图id
}
type DataPrivacyPolicyDetailResp struct {
	DataPrivacyPolicy
	FieldList []struct {
		FormViewFieldID            string `json:"form_view_field_id"`             // 视图字段id
		FormViewFieldBusinessName  string `json:"form_view_field_business_name"`  // 视图字段业务名称
		FormViewFieldTechnicalName string `json:"form_view_field_technical_name"` // 视图字段技术名称
		FormViewFieldDataGrade     string `json:"form_view_field_data_grade"`     //视图字段数据分级
		DesensitizationRuleID      string `json:"desensitization_rule_id"`        // 脱敏规则id
		DesensitizationRuleName    string `json:"desensitization_rule_name"`      // 脱敏规则名称
		DesensitizationRuleMethod  string `json:"desensitization_rule_method"`    // 脱敏规则方法
	} `json:"field_list"` // 隐私字段列表
}

//endregion

// region UpdateObjects
type UpdateDataPrivacyPolicyReq struct {
	IDReqParamPath                 `param_type:"path"`
	UpdateDataPrivacyPolicyReqBody `param_type:"body"`
}

type IDReqParamPath struct {
	ID string `json:"-" uri:"id" binding:"required,uuid" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"` // 数据隐私策略id
}

type UpdateDataPrivacyPolicyReqBody struct {
	Description string `json:"description" form:"description" binding:"omitempty"`
	FieldList   []struct {
		FormViewFieldID       string `json:"form_view_field_id" form:"form_view_field_id" binding:"uuid"`           // 视图字段id
		DesensitizationRuleID string `json:"desensitization_rule_id" form:"desensitization_rule_id" binding:"uuid"` // 脱敏规则id
	} `json:"field_list" form:"field_list"` // 隐私字段列表
}

type UpdateDataPrivacyPolicyResp struct {
	ID string `json:"id"` // 数据隐私策略id
}

//endregion

//region CreateDataPrivacyPolicyFieldBatch

type CreateDataPrivacyPolicyFieldBatchReq struct {
	CreateDataPrivacyPolicyFieldBatchReqBody `param_type:"body"`
}

type CreateDataPrivacyPolicyFieldBatchReqBody struct {
	DataPrivacyPolicyID    string   `json:"data_privacy_policy_id" form:"data_privacy_policy_id" binding:"uuid"`     // 数据隐私策略id
	FormViewFieldIDs       []string `json:"form_view_field_ids" form:"form_view_field_ids" binding:"uuid"`           // 视图字段id
	DesensitizationRuleIDs []string `json:"desensitization_rule_ids" form:"desensitization_rule_ids" binding:"uuid"` // 脱敏规则id
}

type CreateDataPrivacyPolicyFieldBatchResp struct {
	ID string `json:"id"` // 数据隐私策略字段id
}

//endregion

func (f *DataPrivacyPolicy) Assemble(
	data_privacy_policy *model.DataPrivacyPolicy,
	userIdNameMap map[string]string,
	formViewMap map[string]*model.FormView,
	subjectNameMap map[string]string,
	departmentNameMap map[string]string,
	formViewFieldMap map[string]string,
	desensitizationRuleMap map[string]string) {
	f.ID = data_privacy_policy.ID
	f.FormViewID = data_privacy_policy.FormViewID

	// 检查 formViewMap 中是否存在对应的 FormView，避免空指针引用
	formView, exists := formViewMap[data_privacy_policy.FormViewID]
	if !exists || formView == nil {
		// 如果 FormView 不存在，设置默认值
		f.UniformCatalogCode = ""
		f.TechnicalName = ""
		f.BusinessName = ""
		f.SubjectID = ""
		f.Subject = ""
		f.DepartmentID = ""
		f.Department = ""
	} else {
		f.UniformCatalogCode = formView.UniformCatalogCode
		f.TechnicalName = formView.TechnicalName
		f.BusinessName = formView.BusinessName
		subjectID := formView.SubjectId.String
		f.SubjectID = subjectID
		f.Subject = subjectNameMap[subjectID]
		departmentID := formView.DepartmentId.String
		f.DepartmentID = departmentID
		f.Department = departmentNameMap[departmentID]
	}

	f.Description = data_privacy_policy.PolicyDescription
	f.Masking_Fields = formViewFieldMap[data_privacy_policy.FormViewID]
	f.Masking_Rules = desensitizationRuleMap[data_privacy_policy.ID]
	f.CreatedAt = data_privacy_policy.CreatedAt.UnixMilli()
	f.CreatedByUser = userIdNameMap[data_privacy_policy.CreatedByUID]
	f.UpdatedAt = data_privacy_policy.UpdatedAt.UnixMilli()
	f.UpdatedByUser = userIdNameMap[data_privacy_policy.UpdatedByUID]

}

type PageResultNew[T any] struct {
	Entries    []*T  `json:"entries" binding:"required"`                       // 对象列表
	TotalCount int64 `json:"total_count" binding:"required,gte=0" example:"3"` // 当前筛选条件下的对象数量
}

//endregion

type DeleteDataPrivacyPolicyReq struct {
	IDReqParamPath `param_type:"path"` // 数据隐私策略id
}

type DeleteDataPrivacyPolicyResp struct {
	ID string `json:"id"` // 数据隐私策略id
}

type IsExistByFormViewIdReq struct {
	IDReqParamPath `param_type:"path"` // 表单视图id
}

type IsExistByFormViewIdResp struct {
	IsExist bool `json:"is_exist"` // 是否存在
}

type GetFormViewIdsByFormViewIdsReq struct {
	GetFormViewIdsByFormViewIdsReqBody `param_type:"body"`
}

type GetFormViewIdsByFormViewIdsReqBody struct {
	FormViewIDs []string `json:"form_view_ids" form:"form_view_ids" binding:"required"` // 表单视图id数组
}

type GetFormViewIdsByFormViewIdsResp struct {
	FormViewIDs []string `json:"form_view_ids"` // 存在隐私策略的表单视图id
}

type GetDesensitizationDataByIdReq struct {
	GetDesensitizationDataByIdReqQueryBody `param_type:"body"`
}

type GetDesensitizationDataByIdReqQueryBody struct {
	request.PageInfo2
	FormViewID             string   `json:"form_view_id" form:"form_view_id" binding:"omitempty,uuid"` // 表单视图id
	IsAll                  bool     `json:"is_all" form:"is_all" binding:"omitempty" default:"false"`  // 全部数据还是仅脱敏数据
	FormViewFieldIds       []string `json:"form_view_field_ids" form:"form_view_field_ids"`            // 字段id数组
	DesensitizationRuleIds []string `json:"desensitization_rule_ids" form:"desensitization_rule_ids"`  // 脱敏规则id数组
}

type GetDesensitizationDataByIdReqQueryParam struct {
	request.PageInfo2
	IsAll bool `json:"is_all" form:"is_all" binding:"omitempty" default:"false"` // 全部数据还是仅脱敏数据
}

type GetDesensitizationDataByIdResp struct {
	virtualization_engine.FetchDataRes
}
