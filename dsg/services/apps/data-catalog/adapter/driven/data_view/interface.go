package data_view

import "context"

type Repo interface {
	// 获取子视图列表
	ListSubView(ctx context.Context, opts ListSubViewOptions) (*List[SubView], error)
	//GetDesensitizationRuleByIds 根据ids获取脱敏规则
	GetDesensitizationRuleByIds(ctx context.Context, req *GetDesensitizationRuleByIdsReq) (*GetDesensitizationRuleByIdsRes, error)
	GetDataViewList(ctx context.Context, opts PageListFormViewReqQueryParam) (*PageListFormViewResp, error)
	// GetDataPrivacyPolicyByFormViewId 根据表单视图ID获取数据隐私策略详情
	GetDataPrivacyPolicyByFormViewId(ctx context.Context, req *GetDataPrivacyPolicyByFormViewIdReq) (*DataPrivacyPolicyDetailResp, error)
}

// region GetDesensitizationRuleByIds
type GetDesensitizationRuleByIdsReq struct {
	GetDesensitizationRuleByIdsReqBody `param_type:"body"`
}

type GetDesensitizationRuleByIdsReqBody struct {
	Ids []string `json:"ids" form:"ids" binding:"required"` // 脱敏规则ID列表
}

type GetDesensitizationRuleByIdsRes struct {
	Data []*DesensitizationRule `json:"data" binding:"required"` // 脱敏规则数据
}

type DesensitizationRule struct {
	ID          string `json:"id"`          // id
	Name        string `json:"name"`        // 名称
	Description string `json:"description"` // 描述
	Algorithm   string `json:"algorithm"`   // 算法
	Type        string `json:"type"`        // 类型
	InnerType   string `json:"inner_type"`  // 内置类型
	Method      string `json:"method"`      // 方法
	MiddleBit   int32  `json:"middle_bit"`
	HeadBit     int32  `json:"head_bit"`
	TailBit     int32  `json:"tail_bit"`
	CreatedAt   int64  `json:"created_at"` // 创建时间
	UpdatedAt   int64  `json:"updated_at"` // 更新时间
}

//endregion

// region GetDataPrivacyPolicyByFormViewId
type GetDataPrivacyPolicyByFormViewIdReq struct {
	FormViewID string `json:"-" uri:"id" binding:"required,uuid"` // 表单视图ID
}

type DataPrivacyPolicyDetailResp struct {
	ID                 string                   `json:"id"`                   // 数据隐私策略id
	FormViewID         string                   `json:"form_view_id"`         // 表单视图id
	UniformCatalogCode string                   `json:"uniform_catalog_code"` // 逻辑视图编码
	TechnicalName      string                   `json:"technical_name"`       // 表技术名称
	BusinessName       string                   `json:"business_name"`        // 表业务名称
	Description        string                   `json:"description"`          // 隐私策略描述
	SubjectID          string                   `json:"subject_id"`           // 所属主题id
	Subject            string                   `json:"subject"`              // 所属主题
	DepartmentID       string                   `json:"department_id"`        // 所属部门id
	Department         string                   `json:"department"`           // 所属部门
	MaskingFields      string                   `json:"masking_fields"`       // 脱敏字段组
	MaskingRules       string                   `json:"masking_rules"`        // 脱敏规则组
	CreatedAt          int64                    `json:"created_at"`           // 创建时间
	CreatedByUser      string                   `json:"created_by_user"`      // 创建者
	UpdatedAt          int64                    `json:"updated_at"`           // 编辑时间
	UpdatedByUser      string                   `json:"updated_by_user"`      // 编辑者
	FieldList          []DataPrivacyPolicyField `json:"field_list"`           // 隐私字段列表
}

type DataPrivacyPolicyField struct {
	FormViewFieldID            string `json:"form_view_field_id"`             // 视图字段id
	FormViewFieldBusinessName  string `json:"form_view_field_business_name"`  // 视图字段业务名称
	FormViewFieldTechnicalName string `json:"form_view_field_technical_name"` // 视图字段技术名称
	FormViewFieldDataGrade     string `json:"form_view_field_data_grade"`     // 视图字段数据分级
	DesensitizationRuleID      string `json:"desensitization_rule_id"`        // 脱敏规则id
	DesensitizationRuleName    string `json:"desensitization_rule_name"`      // 脱敏规则名称
	DesensitizationRuleMethod  string `json:"desensitization_rule_method"`    // 脱敏规则方法
}

//endregion

type PageListFormViewReqQueryParam struct {
	Offset               *int
	Limit                *int
	InfoSystemID         *string // 信息系统id
	DataSourceSourceType string  // 数据源来源类型 records 信息系统 analytical 数据仓库   sandbox 数据沙箱
	DatasourceType       string  // 数据源类型
	DatasourceId         string  // 数据源id
}

type PageListFormViewResp struct {
	PageResultNew[FormView]
	LastScanTime int64 `json:"last_scan_time"` // 最近一次扫描数据源的扫描时间(仅单个数据源返回)
	ExploreTime  int64 `json:"explore_time"`   // 最近一次探查数据源的探查时间(仅单个数据源返回)
}

type PageResultNew[T any] struct {
	Entries    []*T  `json:"entries" binding:"required"`                       // 对象列表
	TotalCount int64 `json:"total_count" binding:"required,gte=0" example:"3"` // 当前筛选条件下的对象数量
}

type FormView struct {
	ID                     string `json:"id"`                       // 逻辑视图uuid
	UniformCatalogCode     string `json:"uniform_catalog_code"`     // 逻辑视图编码
	TechnicalName          string `json:"technical_name"`           // 表技术名称
	BusinessName           string `json:"business_name"`            // 表业务名称
	Type                   string `json:"type"`                     // 逻辑视图来源
	DatasourceId           string `json:"datasource_id"`            // 数据源id
	Datasource             string `json:"datasource"`               // 数据源
	DatasourceType         string `json:"datasource_type"`          // 数据源类型
	DatasourceCatalogName  string `json:"datasource_catalog_name"`  // 数据源catalog
	Status                 string `json:"status"`                   // 逻辑视图状态\扫描结果
	PublishAt              int64  `json:"publish_at"`               // 发布时间
	OnlineTime             int64  `json:"online_time"`              // 上线时间
	OnlineStatus           string `json:"online_status"`            // 上线状态
	AuditAdvice            string `json:"audit_advice"`             // 审核意见，仅驳回时有用
	EditStatus             string `json:"edit_status"`              // 内容状态
	MetadataFormId         string `json:"metadata_form_id"`         // 元数据表id
	CreatedAt              int64  `json:"created_at"`               // 创建时间
	CreatedByUser          string `json:"created_by"`               // 创建人
	UpdatedAt              int64  `json:"updated_at"`               // 编辑时间
	UpdatedByUser          string `json:"updated_by"`               // 编辑人
	ViewSourceCatalogName  string `json:"view_source_catalog_name"` // 视图源
	SubjectID              string `json:"subject_id"`               // 所属主题id
	Subject                string `json:"subject"`                  // 所属主题
	SubjectPathId          string `json:"subject_path_id"`          // 所属主题路径id
	SubjectPath            string `json:"subject_path"`             // 所属主题路径
	DepartmentID           string `json:"department_id"`            // 所属部门id
	Department             string `json:"department"`               // 所属部门
	DepartmentPath         string `json:"department_path"`          // 所属部门路径
	OwnerID                string `json:"owner_id"`                 // 数据Owner id
	Owner                  string `json:"owner"`                    // 数据Owner
	ExploreJobId           string `json:"explore_job_id"`           // 探查作业ID
	ExploreJobVer          int    `json:"explore_job_version"`      // 探查作业版本
	SceneAnalysisId        string `json:"scene_analysis_id"`        // 场景分析画布id
	ExploredData           int    `json:"explored_data"`            // 探查数据
	ExploredTimestamp      int    `json:"explored_timestamp"`       // 探查时间戳
	ExploredClassification int    `json:"explored_classification"`  // 探查数据分类
	ExcelFileName          string `json:"excel_file_name"`          // excel文件名
	DataOriginFormID       string `json:"data_origin_form_id"`      // 生成的数据原始表ID
}

func (p *PageListFormViewResp) GetFormViewIDS() *[]string {
	ids := make([]string, 0)
	for _, v := range p.Entries {
		ids = append(ids, v.ID)
	}
	return &ids
}
