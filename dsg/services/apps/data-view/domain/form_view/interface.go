package form_view

import (
	"bytes"
	"context"
	"encoding/json"
	"mime/multipart"
	"strings"

	"github.com/kweaver-ai/dsg/services/apps/data-view/common/models/response"

	"github.com/samber/lo"

	audit_v1 "github.com/kweaver-ai/idrm-go-common/api/audit/v1"
	"github.com/kweaver-ai/idrm-go-common/rest/data_view"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/rest/auth_service"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/rest/virtualization_engine"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/models/request"
	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/enum"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

type FormViewUseCase interface {
	InternalFormViewUseCase
	PageList(ctx context.Context, req *PageListFormViewReq) (*PageListFormViewResp, error)
	UpdateFormView(ctx context.Context, req *UpdateReq) error
	UpdateDatasourceView(ctx context.Context, req *UpdateReq) error
	BatchPublish(ctx context.Context, req *BatchPublishReq) (*BatchPublishRes, error)
	ExcelBatchPublish(ctx context.Context, req *ExcelBatchPublishReq, fileHeader *multipart.FileHeader) (*ExcelBatchPublishRes, error)
	DeleteFormView(ctx context.Context, req *DeleteReq) error
	DeleteDatasourceClearFormView(ctx context.Context, datasourceId string) error
	GetFields(ctx context.Context, req *GetFieldsReq) (*GetFieldsRes, error)
	GetViewsFields(ctx context.Context, req *GetViewsFieldsReqParameter) ([]*GetViewFieldsResp, error)
	GetViewBasicInfoByName(ctx context.Context, req *GetViewBasicInfoByNameReqParam) (*GetViewFieldsResp, error)
	GetMultiViewsFields(ctx context.Context, ids []string) (*GetMultiViewsFieldsRes, error)
	//ScanDataSources(ctx context.Context, ids []string) (*ScansResp, error)
	Scan(ctx context.Context, req *ScanReq) (*ScanRes, error)
	NameRepeat(ctx context.Context, req *NameRepeatReq) (bool, error)
	GetDataSources(ctx context.Context, req *GetDatasourceListReq) (*GetDatasourceListRes, error)
	FinishProject(ctx context.Context, req *FinishProjectReq) error
	GetUsersFormViews(ctx context.Context, req *GetUsersFormViewsReq) (*GetUsersFormViewsPageRes, error)
	GetUsersAllFormViews(ctx context.Context, req *GetUsersFormViewsReq) (*GetUsersFormViewsPageRes, error)
	GetUsersFormViewsFields(ctx context.Context, req *GetUsersFormViewsFieldsReq) (*GetFieldsRes, error)
	GetUsersMultiFormViewsFields(ctx context.Context, req *GetUsersMultiFormViewsFieldsReq) (*GetUsersMultiFormViewsFieldsRes, error)
	DeleteRelated(ctx context.Context, req *DeleteRelatedReq) error
	GetRelatedFieldInfo(ctx context.Context, req *GetRelatedFieldInfoReq) (resp *GetRelatedFieldInfoResp, err error)
	GetFormViewDetails(ctx context.Context, req *GetFormViewDetailsReq) (*GetFormViewDetailsRes, error)
	UpdateFormViewDetails(ctx context.Context, req *UpdateFormViewDetailsReq) error
	QueryRelatedLogicalEntityInfo(ctx context.Context, req *QueryLogicalEntityByViewReq) (*QueryLogicalEntityByViewResp, error)
	QueryViewDetail(ctx context.Context, req *QueryViewDetailBySubjectIDReq) (*QueryViewDetailBySubjectIDResp, error)
	FormViewFilter(ctx context.Context, req *FormViewFilterReq) (*FormViewFilterResp, error)
	GetExploreJobStatus(ctx context.Context, req *GetExploreJobStatusReq) ([]*ExploreJobStatusResp, error)
	GetExploreReport(ctx context.Context, req *GetExploreReportReq) (*ExploreReportResp, error)
	//LogicViewCreatePubES(ctx context.Context, logicView *model.FormView, objs []*es.FieldObj) error
	FormViewDeletePubES(ctx context.Context, id string) error

	CreateDataDownloadTask(ctx context.Context, req *DownloadTaskCreateReq) (*DownloadTaskIDResp, error)
	DeleteDataDownloadTask(ctx context.Context, req *DownlaodTaskPathReq) (*DownloadTaskIDResp, error)
	GetDataDownloadTaskList(ctx context.Context, req *GetDownloadTaskListReq) (*PageResultNew[DownloadTaskEntry], error)
	GetDataDownloadLink(ctx context.Context, req *DownlaodTaskPathReq) (*DownloadLinkResp, error)
	MarkFormViewBusinessTimestamp(ctx context.Context, msg []byte) error

	GetDatasourceOverview(ctx context.Context, req *GetDatasourceOverviewReq) (*DatasourceOverviewResp, error)
	GetExploreConfig(ctx context.Context, req *GetExploreConfigReq) (*ExploreConfigResp, error)
	GetFieldExploreReport(ctx context.Context, req *GetFieldExploreReportReq) (*FieldExploreReportResp, error)

	UndoAudit(ctx context.Context, req *UndoAuditReq) error
	GetFilterRule(ctx context.Context, req *GetFilterRuleReq) (*GetFilterRuleResp, error)
	UpdateFilterRule(ctx context.Context, req *UpdateFilterRuleReq) error
	ExecFilterRule(ctx context.Context, req *ExecFilterRuleReq) (*ExecFilterRuleResp, error)
	DeleteFilterRule(ctx context.Context, req *DeleteFilterRuleReq) error
	CreateCompletion(ctx context.Context, req *CreateCompletionReq) (*CreateCompletionResp, error)
	GetCompletion(ctx context.Context, req *GetCompletionReq) (*GetCompletionResp, error)
	UpdateCompletion(ctx context.Context, req *UpdateCompletionReq) (*UpdateCompletionResp, error)
	Completion(ctx context.Context, msg []byte) error
	GetBusinessUpdateTime(ctx context.Context, req *GetBusinessUpdateTimeReq) (*GetBusinessUpdateTimeResp, error)
	ConvertRulesVerify(ctx context.Context, req *ConvertRulesVerifyReq) (*ConvertRulesVerifyResp, error)
	CreateExcelView(ctx context.Context, req *CreateExcelViewReq) (string, error)
	UpdateExcelView(ctx context.Context, req *UpdateExcelViewReq) (string, error)
	DataPreview(ctx context.Context, req *DataPreviewReq) (*DataPreviewResp, error)
	DesensitizationFieldDataPreview(ctx context.Context, req *DesensitizationFieldDataPreviewReq) (*DesensitizationFieldDataPreviewResp, error)
	DataPreviewConfig(ctx context.Context, req *DataPreviewConfigReq) (*DataPreviewConfigResp, error)
	GetDataPreviewConfig(ctx context.Context, req *GetDataPreviewConfigReq) (*GetDataPreviewConfigResp, error)

	GetWhiteListPolicyList(ctx context.Context, req *GetWhiteListPolicyListReq) (*GetWhiteListPolicyListRes, error)
	GetWhiteListPolicyDetails(ctx context.Context, req *GetWhiteListPolicyDetailsReq) (*GetWhiteListPolicyDetailsRes, error)
	CreateWhiteListPolicy(ctx context.Context, req *CreateWhiteListPolicyReq) (*CreateWhiteListPolicyRes, error)
	UpdateWhiteListPolicy(ctx context.Context, req *UpdateWhiteListPolicyReq) (*UpdateWhiteListPolicyRes, error)
	DeleteWhiteListPolicy(ctx context.Context, req *DeleteWhiteListPolicyReq) (*DeleteWhiteListPolicyRes, error)
	ExecuteWhiteListPolicy(ctx context.Context, req *ExecuteWhiteListPolicyReq) (*ExecuteWhiteListPolicyRes, error)
	GetWhiteListPolicyWhereSql(ctx context.Context, req *GetWhiteListPolicyWhereSqlReq) (*GetWhiteListPolicyWhereSqlRes, error)
	GetDesensitizationFieldInfos(ctx context.Context, req *GetDesensitizationFieldInfosReq) (*GetDesensitizationFieldInfosRes, error)
	GetFormViewRelateWhiteListPolicy(ctx context.Context, req *GetFormViewRelateWhiteListPolicyReq) (*GetFormViewRelateWhiteListPolicyRes, error)

	GetDesensitizationRuleList(ctx context.Context, req *GetDesensitizationRuleListReq) (*GetDesensitizationRuleListRes, error)
	GetDesensitizationRuleByIds(ctx context.Context, req *GetDesensitizationRuleByIdsReq) (*GetDesensitizationRuleByIdsRes, error)
	GetDesensitizationRuleDetails(ctx context.Context, req *GetDesensitizationRuleDetailsReq) (*GetDesensitizationRuleDetailsRes, error)
	CreateDesensitizationRule(ctx context.Context, req *CreateDesensitizationRuleReq) (*CreateDesensitizationRuleRes, error)
	UpdateDesensitizationRule(ctx context.Context, req *UpdateDesensitizationRuleReq) (*UpdateDesensitizationRuleRes, error)
	DeleteDesensitizationRule(ctx context.Context, req *DeleteDesensitizationRuleReq) (*DeleteDesensitizationRuleRes, error)
	ExecuteDesensitizationRule(ctx context.Context, req *ExecuteDesensitizationRuleReq) (*ExecuteDesensitizationRuleRes, error)
	ExportDesensitizationRule(ctx context.Context, req *ExportDesensitizationRuleReq) (*ExportDesensitizationRuleRes, error)
	GetDesensitizationRuleRelatePolicy(ctx context.Context, req *GetDesensitizationRuleRelatePolicyReq) (*GetDesensitizationRuleRelatePolicyRes, error)
	GetDesensitizationRuleInternalAlgorithm(ctx context.Context, req *GetDesensitizationRuleInternalAlgorithmReq) (*GetDesensitizationRuleInternalAlgorithmRes, error)
	GetByAuditStatus(ctx context.Context, req *GetByAuditStatusReq) (*GetByAuditStatusResp, error)
	SaveFormViewExtend(ctx context.Context, msg []byte) error
	GetBasicViewList(ctx context.Context, req *GetBasicViewListReqParam) (*GetBasicViewListResp, error)
	IsAllowClearGrade(ctx context.Context, req *IsAllowClearGradeReq) (*IsAllowClearGradeResp, error)
	QueryStreamStart(ctx context.Context, req *QueryStreamStartReq) (*QueryStreamStartResp, error)
	QueryStreamNext(ctx context.Context, req *QueryStreamNextReq) (*QueryStreamNextResp, error)

	// GetViewByTechnicalNameAndHuaAoId 通过技术名称和华傲ID查询视图
	GetViewByTechnicalNameAndHuaAoId(ctx context.Context, req *GetViewByTechnicalNameAndHuaAoIdReqParam) (*GetViewFieldsResp, error)
	// 获取库表的总数
	GetTableCount(ctx context.Context, req *GetViewCountReqParam) (int64, error)
	GetOverview(ctx context.Context, req *GetOverviewReq) (*GetOverviewResp, error)
	GetExploreReports(ctx context.Context, req *GetExploreReportsReq) (*GetExploreReportsResp, error)
	ExportExploreReports(ctx context.Context, req *ExportExploreReportsReq) (*ExportExploreReportsResp, error)
	GetDepartmentExploreReports(ctx context.Context, req *GetDepartmentExploreReportsReq) (*GetDepartmentExploreReportsResp, error)
	CreateExploreReports()
}
type InternalFormViewUseCase interface {
	GetLogicViewReportInfo(ctx context.Context, req *data_view.GetLogicViewReportInfoReq) (*data_view.GetLogicViewReportInfoRes, error)
	GetViewByKey(ctx context.Context, req *GetViewByKey) (*FormViewSimpleInfo, error)
	GetViewListByTechnicalNameInMultiDatasource(ctx context.Context, req *data_view.GetViewListByTechnicalNameInMultiDatasourceReq) (*data_view.GetViewListByTechnicalNameInMultiDatasourceRes, error)
	QueryAuthedSubView(ctx context.Context, req *HasSubViewAuthParamReq) ([]string, error)
	BatchGetExploreReport(ctx context.Context, req *BatchGetExploreReportReq) (*BatchGetExploreReportResp, error)
	Sync(ctx context.Context)
}

//region ListObjects

type PageListFormViewReq struct {
	PageListFormViewReqQueryParam `param_type:"query"`
}

type PageListFormViewReqQueryParam struct {
	request.PageInfo3
	request.KeywordInfo
	Direction          string   `json:"direction" form:"direction,default=desc" binding:"oneof=asc desc" default:"desc"`                                                                 // 排序方向，枚举：asc：正序；desc：倒序。默认倒序
	Sort               string   `json:"sort" form:"sort,default=created_at" binding:"oneof=created_at updated_at name type publish_at online_time technical_name"  default:"created_at"` // 排序类型，枚举：created_at：按创建时间排序；updated_at：按更新时间排序；name：按名称排序。默认按创建时间排序
	Status             string   `json:"status" form:"status" binding:"omitempty,oneof=uniformity new modify delete"`                                                                     //状态
	StatusListString   string   `json:"status_list" form:"status_list" binding:"omitempty"`                                                                                              //状态  多选逗号分割
	StatusList         []int32  `json:"-"`
	PublishStatus      string   `json:"publish_status" form:"publish_status" binding:"omitempty,oneof=publish unpublished"` // 发布状态
	EditStatus         string   `json:"edit_status" form:"edit_status" binding:"omitempty,oneof=draft latest"`              //编辑状态
	CreatedAtStart     int64    `json:"created_at_start" form:"created_at_start" binding:"omitempty,gt=0"`                  //创建开始时间
	CreatedAtEnd       int64    `json:"created_at_end" form:"created_at_end" binding:"omitempty,gt=0"`                      // 创建结束时间
	UpdatedAtStart     int64    `json:"updated_at_start" form:"updated_at_start" binding:"omitempty,gt=0"`                  //编辑开始时间
	UpdatedAtEnd       int64    `json:"updated_at_end" form:"updated_at_end" binding:"omitempty,gt=0"`                      //编辑结束时间
	DatasourceType     string   `json:"datasource_type" form:"datasource_type" binding:"omitempty"`                         // 数据源类型
	DatasourceIdString string   `json:"datasource_ids" form:"datasource_ids" binding:"omitempty"`                           //数据源id 逗号分隔
	DatasourceIds      []string `json:"-" `
	DatasourceId       string   `json:"datasource_id" form:"datasource_id" binding:"omitempty,uuid"` //数据源id
	//TaskId             string   `json:"task_id" form:"task_id" binding:"omitempty,uuid" example:"4a5a3cc0-0169-4d62-9442-62214d8fcd8d"`        // 任务id，uuid（36）
	//ProjectID          string   `json:"project_id"  form:"project_id" binding:"omitempty,uuid" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"` //项目id
	FormViewIdsString string   `json:"form_view_ids" form:"form_view_ids" binding:"omitempty"` //逗号分隔
	FormViewIds       []string `json:"-" `

	SubjectID         string   `json:"subject_id" form:"subject_id" binding:"omitempty,uuid" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"` // 主题id
	IncludeSubSubject bool     `json:"include_sub_subject"  form:"include_sub_subject" binding:"omitempty"`                                  //包含子主题
	SubSubSubjectIDs  []string `json:"-"`                                                                                                    // 子主题域名id

	DepartmentID         string   `json:"department_id" form:"department_id" binding:"omitempty,uuid" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"` // 部门id
	IncludeSubDepartment bool     `json:"include_sub_department"  form:"include_sub_department" binding:"omitempty"`                                  //包含子部门
	SubDepartmentIDs     []string `json:"-"`                                                                                                          // 部门的子部门id 	// 未分配部门

	BusinessModelID string `json:"business_model_id" form:"business_model_id" binding:"omitempty,uuid"  example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"` //业务模型ID，查询当前也的视图ID有没有在这个数据模型生成数据原始表用

	NotHaveOwner              bool     `json:"-"`                                             // 未分配数据Owner
	OwnerIDString             string   `json:"owner_id"  form:"owner_id" binding:"omitempty"` // 数据Owner id 逗号分隔
	OwnerIDs                  []string `json:"-"`                                             // 数据Owner id
	OwnerID                   string   `json:"-"`
	Type                      string   `json:"type"  form:"type" binding:"omitempty,oneof=datasource custom logic_entity"`
	OnlineStatus              string   `json:"online_status"  form:"online_status" binding:"omitempty,oneof=notline online offline up-auditing down-auditing up-reject down-reject"` //上线状态
	OnlineStatusListString    string   `json:"online_status_list"  form:"online_status_list" binding:"omitempty"`                                                                    //上线状态 多选逗号分割
	OnlineStatusList          []string `json:"-"`
	AuditStatus               string   `json:"audit_status"  form:"audit_status" binding:"omitempty,oneof=unpublished auditing pass reject"`
	ExcelFileName             string   `json:"excel_file_name"  form:"excel_file_name"`
	TechnicalName             string   `json:"technical_name" form:"technical_name"`                                                                      // 表技术名称
	InfoSystemID              *string  `json:"info_system_id" form:"info_system_id" binding:"omitempty"`                                                  // 信息系统id
	DataSourceSourceType      string   `json:"datasource_source_type" form:"datasource_source_type" binding:"omitempty,oneof=records analytical sandbox"` // 数据源来源类型 records 信息系统 analytical 数据仓库   sandbox 数据沙箱
	QueryAuthed               bool     `json:"query_authed"  form:"query_authed" binding:"omitempty"`                                                     //是否查询授权的
	AuthedViewID              []string `json:"-"`                                                                                                         //授权的视图ID
	MyDepartmentResource      bool     `json:"my_department_resource" form:"my_department_resource"`                                                      //本部门资源
	IncludeDWHDataAuthRequest bool     `json:"include_dwh_data_auth_request" form:"include_dwh_data_auth_request"`
	UpdateCycle               *int32   `json:"update_cycle" form:"update_cycle" binding:"omitempty"` //更新周期筛选
	SharedType                *int32   `json:"shared_type" form:"shared_type" binding:"omitempty"`   //共享属性筛选
	OpenType                  *int32   `json:"open_type" form:"open_type" binding:"omitempty"`       //开放属性筛选
	MdlID                     string   `json:"mdl_id" form:"mdl_id" binding:"omitempty"`             //统一视图id
}

type PageListFormViewReqQueryParamBase struct {
	request.PageInfo3
	request.KeywordInfo
	Direction        string  `json:"direction" form:"direction,default=desc" binding:"oneof=asc desc" default:"desc"`                                                                 // 排序方向，枚举：asc：正序；desc：倒序。默认倒序
	Sort             string  `json:"sort" form:"sort,default=created_at" binding:"oneof=created_at updated_at name type publish_at online_time technical_name"  default:"created_at"` // 排序类型，枚举：created_at：按创建时间排序；updated_at：按更新时间排序；name：按名称排序。默认按创建时间排序
	Status           string  `json:"status" form:"status" binding:"omitempty,oneof=uniformity new modify delete"`                                                                     //状态
	StatusListString string  `json:"status_list" form:"status_list" binding:"omitempty"`                                                                                              //状态  多选逗号分割
	StatusList       []int32 `json:"-"`

	EditStatus         string   `json:"edit_status" form:"edit_status" binding:"omitempty,oneof=draft latest"` //编辑状态
	CreatedAtStart     int64    `json:"created_at_start" form:"created_at_start" binding:"omitempty,gt=0"`     //创建开始时间
	CreatedAtEnd       int64    `json:"created_at_end" form:"created_at_end" binding:"omitempty,gt=0"`         // 创建结束时间
	UpdatedAtStart     int64    `json:"updated_at_start" form:"updated_at_start" binding:"omitempty,gt=0"`     //编辑开始时间
	UpdatedAtEnd       int64    `json:"updated_at_end" form:"updated_at_end" binding:"omitempty,gt=0"`         //编辑结束时间
	DatasourceType     string   `json:"datasource_type" form:"datasource_type" binding:"omitempty"`            // 数据源类型
	DatasourceIdString string   `json:"datasource_ids" form:"datasource_ids" binding:"omitempty"`              //数据源id 逗号分隔
	DatasourceIds      []string `json:"-" `
	DatasourceId       string   `json:"datasource_id" form:"datasource_id" binding:"omitempty,uuid"` //数据源id
	//TaskId             string   `json:"task_id" form:"task_id" binding:"omitempty,uuid" example:"4a5a3cc0-0169-4d62-9442-62214d8fcd8d"`        // 任务id，uuid（36）
	//ProjectID          string   `json:"project_id"  form:"project_id" binding:"omitempty,uuid" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"` //项目id
	FormViewIdsString string   `json:"form_view_ids" form:"form_view_ids" binding:"omitempty"` //逗号分隔
	FormViewIds       []string `json:"-" `

	SubjectID         string   `json:"subject_id" form:"subject_id" binding:"omitempty,uuid" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"` // 主题id
	IncludeSubSubject bool     `json:"include_sub_subject"  form:"include_sub_subject" binding:"omitempty"`                                  //包含子主题
	SubSubSubjectIDs  []string `json:"-"`                                                                                                    // 子主题域名id

	DepartmentID         string   `json:"department_id" form:"department_id" binding:"omitempty,uuid" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"` // 部门id
	IncludeSubDepartment bool     `json:"include_sub_department"  form:"include_sub_department" binding:"omitempty"`                                  //包含子部门
	SubDepartmentIDs     []string `json:"-"`                                                                                                          // 部门的子部门id 	// 未分配部门

	BusinessModelID string `json:"business_model_id" form:"business_model_id" binding:"omitempty,uuid"  example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"` //业务模型ID，查询当前也的视图ID有没有在这个数据模型生成数据原始表用

	NotHaveOwner              bool     `json:"-"`                                             // 未分配数据Owner
	OwnerIDString             string   `json:"owner_id"  form:"owner_id" binding:"omitempty"` // 数据Owner id 逗号分隔
	OwnerIDs                  []string `json:"-"`                                             // 数据Owner id
	OwnerID                   string   `json:"-"`
	Type                      string   `json:"type"  form:"type" binding:"omitempty,oneof=datasource custom logic_entity"`
	OnlineStatus              string   `json:"online_status"  form:"online_status" binding:"omitempty,oneof=notline online offline up-auditing down-auditing up-reject down-reject"` //上线状态
	OnlineStatusListString    string   `json:"online_status_list"  form:"online_status_list" binding:"omitempty"`                                                                    //上线状态 多选逗号分割
	OnlineStatusList          []string `json:"-"`
	AuditStatus               string   `json:"audit_status"  form:"audit_status" binding:"omitempty,oneof=unpublished auditing pass reject"`
	ExcelFileName             string   `json:"excel_file_name"  form:"excel_file_name"`
	TechnicalName             string   `json:"technical_name" form:"technical_name"`                                                                      // 表技术名称
	InfoSystemID              *string  `json:"info_system_id" form:"info_system_id" binding:"omitempty"`                                                  // 信息系统id
	DataSourceSourceType      string   `json:"datasource_source_type" form:"datasource_source_type" binding:"omitempty,oneof=records analytical sandbox"` // 数据源来源类型 records 信息系统 analytical 数据仓库   sandbox 数据沙箱
	QueryAuthed               bool     `json:"query_authed"  form:"query_authed" binding:"omitempty"`                                                     //是否查询授权的
	AuthedViewID              []string `json:"-"`                                                                                                         //授权的视图ID
	MyDepartmentResource      bool     `json:"my_department_resource" form:"my_department_resource"`                                                      //本部门资源
	IncludeDWHDataAuthRequest bool     `json:"include_dwh_data_auth_request" form:"include_dwh_data_auth_request"`                                        //是否包含数据仓库数据权限请求的过滤
	UpdateCycle               *int32   `json:"update_cycle" form:"update_cycle" binding:"omitempty"`                                                      //更新周期筛选
	SharedType                *int32   `json:"shared_type" form:"shared_type" binding:"omitempty"`                                                        //共享属性筛选
	OpenType                  *int32   `json:"open_type" form:"open_type" binding:"omitempty"`                                                            //开放属性筛选
}

type PageListFormViewResp struct {
	PageResultNew[FormView]
	ExploreTime int64 `json:"explore_time"` // 最近一次探查数据源的探查时间(仅单个数据源返回)
}

type FormView struct {
	ID                     string   `json:"id"`                         // 逻辑视图uuid
	UniformCatalogCode     string   `json:"uniform_catalog_code"`       // 逻辑视图编码
	TechnicalName          string   `json:"technical_name"`             // 表技术名称
	BusinessName           string   `json:"business_name"`              // 表业务名称
	OriginalName           string   `json:"original_name"`              // 原始表名称
	Type                   string   `json:"type"`                       // 逻辑视图来源
	DatasourceId           string   `json:"datasource_id"`              // 数据源id
	Datasource             string   `json:"datasource"`                 // 数据源
	DatasourceType         string   `json:"datasource_type"`            // 数据源类型
	DatasourceCatalogName  string   `json:"datasource_catalog_name"`    // 数据源catalog
	Status                 string   `json:"status"`                     // 逻辑视图状态\扫描结果
	PublishAt              int64    `json:"publish_at"`                 // 发布时间
	OnlineTime             int64    `json:"online_time"`                // 上线时间
	OnlineStatus           string   `json:"online_status"`              // 上线状态
	AuditAdvice            string   `json:"audit_advice"`               // 审核意见，仅驳回时有用
	EditStatus             string   `json:"edit_status"`                // 内容状态
	MetadataFormId         string   `json:"metadata_form_id"`           // 元数据表id
	CreatedAt              int64    `json:"created_at"`                 // 创建时间
	CreatedByUser          string   `json:"created_by"`                 // 创建人
	UpdatedAt              int64    `json:"updated_at"`                 // 编辑时间
	UpdatedByUser          string   `json:"updated_by"`                 // 编辑人
	ViewSourceCatalogName  string   `json:"view_source_catalog_name"`   // 视图源
	DatabaseName           string   `json:"database_name"`              // 数据库名称
	SubjectID              string   `json:"subject_id"`                 // 所属主题id
	Subject                string   `json:"subject"`                    // 所属主题
	SubjectPathId          string   `json:"subject_path_id"`            // 所属主题路径id
	SubjectPath            string   `json:"subject_path"`               // 所属主题路径
	DepartmentID           string   `json:"department_id"`              // 所属部门id
	Department             string   `json:"department"`                 // 所属部门
	DepartmentPath         string   `json:"department_path"`            // 所属部门路径
	Owners                 []*Owner `json:"owners"`                     // 数据Owner
	ExploreJobId           string   `json:"explore_job_id"`             // 探查作业ID
	ExploreJobVer          int      `json:"explore_job_version"`        // 探查作业版本
	SceneAnalysisId        string   `json:"scene_analysis_id"`          // 场景分析画布id
	ExploredData           int      `json:"explored_data"`              // 探查数据
	ExploredTimestamp      int      `json:"explored_timestamp"`         // 探查时间戳
	ExploredClassification int      `json:"explored_classification"`    // 探查数据分类
	ExcelFileName          string   `json:"excel_file_name"`            // excel文件名
	DataOriginFormID       string   `json:"data_origin_form_id"`        // 生成的数据原始表ID
	SourceSign             int32    `json:"source_sign"`                // 来源标识
	FieldCount             int      `json:"field_count"`                // 字段数量
	ApplyNum               int      `json:"apply_num"`                  // 申请次数
	DataCatalogID          string   `json:"data_catalog_id"`            // 所属目录ID
	DataCatalogName        string   `json:"data_catalog_name"`          // 所属目录
	CatalogProvider        string   `json:"catalog_provider"`           // 目录提供方
	HasDWHDataAuthReqForm  bool     `json:"has_dwh_data_auth_req_form"` //有数仓数据权限请求的表单
}
type Owner struct {
	OwnerID   string `json:"owner_id"  form:"owner_id" binding:"omitempty,dive,uuid" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"` // 数据Owner id
	OwnerName string `json:"owner_name"`                                                                                             // 数据Owner name
}

func (f *FormView) Assemble(
	formView *model.FormView,
	userIdNameMap map[string]string,
	datasourceMap map[string]*model.Datasource,
	subjectNameMap map[string]string,
	subjectPathIdMap map[string]string,
	subjectPathMap map[string]string,
	departmentNameMap map[string]string,
	departmentPathMap map[string]string) {
	if formView.PublishAt != nil {
		f.PublishAt = formView.PublishAt.UnixMilli()
	}
	switch formView.Type {
	case constant.FormViewTypeDatasource.Integer.Int32():
		if datasource, exist := datasourceMap[formView.DatasourceID]; exist {
			f.Datasource = datasource.Name
			f.DatasourceType = datasource.TypeName
			f.DatasourceCatalogName = datasource.CatalogName
			f.ViewSourceCatalogName = datasource.DataViewSource
			f.DatabaseName = datasource.DatabaseName
		}
	case constant.FormViewTypeCustom.Integer.Int32():
		f.ViewSourceCatalogName = constant.CustomViewSource + constant.CustomAndLogicEntityViewSourceSchema
	case constant.FormViewTypeLogicEntity.Integer.Int32():
		f.ViewSourceCatalogName = constant.LogicEntityViewSource + constant.CustomAndLogicEntityViewSourceSchema

	}
	if formView.OnlineTime != nil {
		f.OnlineTime = formView.OnlineTime.UnixMilli()
	}
	f.ID = formView.ID
	f.UniformCatalogCode = formView.UniformCatalogCode
	f.TechnicalName = formView.TechnicalName
	f.BusinessName = formView.BusinessName
	f.OriginalName = formView.OriginalName
	f.Type = enum.ToString[constant.FormViewType](formView.Type)
	f.DatasourceId = formView.DatasourceID
	f.Status = enum.ToString[constant.FormViewScanStatus](formView.Status)
	f.OnlineStatus = formView.OnlineStatus
	f.AuditAdvice = formView.AuditAdvice
	f.EditStatus = enum.ToString[constant.FormViewEditStatus](formView.EditStatus)
	f.CreatedAt = formView.CreatedAt.UnixMilli()
	f.CreatedByUser = userIdNameMap[formView.CreatedByUID]
	f.UpdatedAt = formView.UpdatedAt.UnixMilli()
	f.UpdatedByUser = userIdNameMap[formView.UpdatedByUID]
	f.SubjectID = formView.SubjectId.String
	f.Subject = subjectNameMap[formView.SubjectId.String]
	f.SubjectPathId = subjectPathIdMap[formView.SubjectId.String]
	f.SubjectPath = subjectPathMap[formView.SubjectId.String]
	f.DepartmentID = formView.DepartmentId.String
	f.Department = departmentNameMap[formView.DepartmentId.String]
	f.DepartmentPath = departmentPathMap[formView.DepartmentId.String]
	f.SceneAnalysisId = formView.SceneAnalysisId
	f.ExcelFileName = formView.ExcelFileName
	f.SourceSign = formView.SourceSign.Int32

	ownerIds := strings.Split(formView.OwnerId.String, constant.OwnerIdSep)
	f.Owners = make([]*Owner, 0)
	if formView.ExploreJobId != nil {
		f.ExploreJobId = *formView.ExploreJobId
	}
	if formView.ExploreJobVer != nil {
		f.ExploreJobVer = *formView.ExploreJobVer
	}
	for _, ownerId := range ownerIds {
		if ownerId != "" {
			f.Owners = append(f.Owners, &Owner{
				OwnerID:   ownerId,
				OwnerName: userIdNameMap[ownerId],
			})
		}
	}
}

type PageResultNew[T any] struct {
	Entries    []*T  `json:"entries" binding:"required"`                       // 对象列表
	TotalCount int64 `json:"total_count" binding:"required,gte=0" example:"3"` // 当前筛选条件下的对象数量
}

//endregion

//region Scans

type ScansReq struct {
	ScansReqParamBody `param_type:"body"`
}

type ScansReqParamBody struct {
	DatasourceID []string `json:"datasource_id" binding:"required,dive,uuid" example:"[88f78432-ee4e-43df-804c-4ccc4ff17f15]"`
	TaskID       string   `json:"task_id" form:"task_id" binding:"omitempty,uuid" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"`
}

type ScansResp struct {
	Count int `json:"count" example:"10"` // 扫描成功的数据源个数
}

//endregion
//region Scan

type ScanReq struct {
	ScanReqParamBody `param_type:"body"`
}

type ScanReqParamBody struct {
	DatasourceID string `json:"datasource_id" binding:"required,uuid" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"`
	TaskID       string `json:"task_id"  form:"task_id" binding:"omitempty,uuid" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"`
	ProjectID    string `json:"project_id"  form:"project_id" binding:"omitempty,uuid" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"`
}

type ScanRes struct {
	UpdateRevokeAuditViewList []*View      `json:"update_revoke_audit_view_list"`
	DeleteRevokeAuditViewList []*View      `json:"delete_revoke_audit_view_list"`
	ErrorView                 []*ErrorView `json:"error_view"`
	ErrorViewCount            int          `json:"error_view_count"`
	ScanViewCount             int          `json:"scan_view_count"`
}
type View struct {
	Id           string `json:"id"`
	BusinessName string `json:"business_name"`
}
type ErrorView struct {
	Id            string          `json:"id"`
	TechnicalName string          `json:"technical_name"`
	Error         *ginx.HttpError `json:"error"`
}

//endregion
//region NameRepeat

type NameRepeatReq struct {
	NameRepeatParam `param_type:"query"`
}

type NameRepeatParam struct {
	DatasourceID string `json:"datasource_id" form:"datasource_id" binding:"omitempty,uuid" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"`
	FormID       string `json:"form_id" form:"form_id" binding:"omitempty,uuid" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"`
	Name         string `json:"name" form:"name" binding:"required,min=1,max=255" example:"xxxx"`
	Type         string `json:"type"  form:"type" binding:"required,oneof=datasource custom logic_entity"`
	NameType     string `json:"name_type"  form:"name_type" binding:"omitempty,oneof=business_name technical_name"`
}

//endregion

//region UpdateFormView

type UpdateReq struct {
	IDReqParamPath     `param_type:"path"`
	UpdateReqParamBody `param_type:"body"`
}

type IDReqParamPath struct {
	ID string `json:"-" uri:"id" binding:"required,uuid" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"`
}
type UpdateReqParamBody struct {
	BusinessName        string    `json:"business_name" binding:"required,min=1,max=255" example:"xxxx"`
	BusinessTimestampID string    `json:"business_timestamp_id" binding:"omitempty,uuid" example:"99f78432-ee4e-43df-804c-4ccc4ff17f15"` // 业务时间字段id
	InfoSystemID        string    `json:"info_system_id" binding:"omitempty,uuid"`                                                       // 关联信息系统ID
	Fields              []*Fields `json:"fields"  binding:"required,dive"`
}
type Fields struct {
	Id                string `json:"id" binding:"required,uuid" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"`
	BusinessName      string `json:"business_name" binding:"required,min=1,max=255" example:"xxxx"`
	DataType          string `json:"data_type" binding:"omitempty,max=255"`           // 数据类型
	ResetConvertRules string `json:"reset_convert_rules" binding:"omitempty,max=255"` // 重置转换规则 （仅日期类型）
	ResetDataLength   int32  `json:"reset_data_length"`                               // 重置数据长度（仅DECIMAL类型）
	ResetDataAccuracy *int32 `json:"reset_data_accuracy"`                             // 重置数据精度（仅DECIMAL类型）
	CodeTableID       string `json:"code_table_id" binding:"omitempty,VerifyModelID"` // 码表ID
	StandardCode      string `json:"standard_code" binding:"omitempty,VerifyModelID"` // 数据标准
	AttributeID       string `json:"attribute_id" binding:"omitempty,uuid"`           // L5属性ID
	ClassifyType      int    `json:"classfity_type" binding:"omitempty,oneof=1 2"`    // 属性分类 classfity_type,名称错误
	ClearAttributeID  string `json:"clear_attribute_id" binding:"omitempty,uuid"`     // 清除属性ID
	LabelID           string `json:"label_id" binding:"omitempty"`                    // 分级标签ID
	GradeType         int    `json:"grade_type" binding:"omitempty,oneof=1 2"`        // 分级标签类型
	ClearLableID      string `json:"clear_lable_id" binding:"omitempty"`              // 清除分级标签ID
	SharedType        *int32 `json:"shared_type" binding:"omitempty"`                 // 共享属性
	OpenType          *int32 `json:"open_type" binding:"omitempty"`                   // 开放属性
	SensitiveType     *int32 `json:"sensitive_type" binding:"omitempty"`              // 敏感属性
	SecretType        *int32 `json:"secret_type" binding:"omitempty"`                 // 涉密属性
}

type UpdateRes struct {
}

//endregion

//region ExcelBatchPublish

type ExcelBatchPublishReq struct {
	ExcelBatchPublishForm `param_type:"query"`
}

type ExcelBatchPublishForm struct {
	Code string `form:"code"  binding:"required" `
}

type ExcelBatchPublishRes struct {
	SuccessUpdateView      []*SuccessView `json:"success_update_view"`       // 成功编辑的视图
	FailUpdateView         []*FailView    `json:"fail_update_view"`          // 失败编辑的视图
	SuccessUpdateViewCount int            `json:"success_update_view_count"` // 成功发布的视图数量
	FailUpdateViewount     int            `json:"fail_update_view_count"`    // 失败发布的视图数量
	*BatchPublishRes
}
type SuccessView struct {
	//DatasourceName string `json:"datasource_name"` // 数据源名称
	ViewID        string `json:"view_id"`        // 视图id
	TechnicalName string `json:"technical_name"` // 技术名称
	Id            string `json:"id"`             // 视图id
}
type FailView struct {
	//DatasourceName string `json:"datasource_name"` // 数据源名称
	ViewID        string `json:"view_id"`        // 视图id
	TechnicalName string `json:"technical_name"` // 技术名称
	Error         string `json:"error"`          //错误类型
}

//endregion

//region BatchPublish

type BatchPublishReq struct {
	BatchPublishBody `param_type:"body"`
}

type BatchPublishBody struct {
	DatasourceFilter []*DatasourceFilter `json:"datasource" binding:"required,dive"` //需要发布视图的数据源列表
}

type DatasourceFilter struct {
	DatasourceName string   `json:"datasource_name" binding:"required"` // 需要发布的视图的数据源名称
	TechnicalName  []string `json:"technical_name"`                     // 视图技术名称，(technical_name有值时publish_status不生效)
	PublishStatus  *bool    `json:"publish_status"`                     // 发布状态，不传不做过滤，传true只发布数据源下发布过的视图，传false发布数据源下未发布过的视图(technical_name有值时publish_status不生效)
	Limit          *int     `json:"limit"`                              // 需要发布的视图的个数限制
	Owner          string   `json:"owner"`
}

type BatchPublishRes struct {
	SuccessPublishView      []*SuccessView `json:"success_publish_view"`       // 成功发布的视图
	FailPublishView         []*FailView    `json:"fail_publish_view"`          // 失败发布的视图
	SuccessPublishViewCount int            `json:"success_publish_view_count"` // 成功发布的视图数量
	FailPublishViewCount    int            `json:"fail_publish_view_count"`    // 失败发布的视图数量
}

//endregion

//region DeleteFormView

type DeleteReq struct {
	IDReqParamPath `param_type:"path"`
}

//endregion

//region getViewsFields

type GetViewsFieldsReqParameter struct {
	GetViewsFieldsReq `param_type:"query"`
}

type GetViewsFieldsReq struct {
	ID []string `json:"id"  form:"id" query:"id" binding:"required,dive,uuid" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"`
}

type GetViewFieldsResp struct {
	FormViewID    string             `json:"form_view_id"`
	BusinessName  string             `json:"business_name"`
	TechnicalName string             `json:"technical_name"`
	Fields        []*SimpleViewField `json:"fields"`
}

type SimpleViewField struct {
	ID               string `json:"id"`                 // 视图ID
	BusinessName     string `json:"business_name"`      // 业务名称
	TechnicalName    string `json:"technical_name"`     // 技术名称
	PrimaryKey       bool   `json:"primary_key"`        // 是否主键
	Comment          string `json:"comment"`            // 列注释
	DataType         string `json:"data_type"`          // 数据类型
	DataLength       int32  `json:"data_length"`        // 数据长度
	DataAccuracy     int32  `json:"data_accuracy"`      // 数据精度（仅DECIMAL类型）
	OriginalDataType string `json:"original_data_type"` // 原始数据类型
	IsNullable       string `json:"is_nullable"`        // 是否为空 (YES/NO)
	StandardCode     string `json:"standard_code"`      // 数据标准code
	StandardName     string `json:"standard_name"`      // 数据标准名称
	CodeTableID      string `json:"code_table_id"`      // 码表ID
	Index            int    `json:"index"`              // 字段顺序
}

//endregion

//region GetFields

type GetFieldsReq struct {
	IDReqParamPath        `param_type:"path"`
	GetFieldsReqParamPath `param_type:"query"`
}
type GetFieldsReqParamPath struct {
	request.KeywordInfo
	GetUsersFormViewsFieldsReqParamQuery
}
type GetFieldsRes struct {
	FieldsRes             []*FieldsRes `json:"fields"`
	LastPublishTime       int64        `json:"last_publish_time"`         // 最新发布时间（已发布）
	UniformCatalogCode    string       `json:"uniform_catalog_code"`      // 逻辑视图编码
	TechnicalName         string       `json:"technical_name"`            // 表技术名称
	BusinessName          string       `json:"business_name"`             // 表业务名称
	OriginalName          string       `json:"original_name"`             // 原始表名称
	DatabaseName          string       `json:"database_name"`             // 数据库名称
	Status                string       `json:"status"`                    // 表状态
	EditStatus            string       `json:"edit_status"`               // 编辑状态
	DatasourceId          string       `json:"datasource_id"`             // 数据源id
	DatasourceType        string       `json:"datasource_type"`           // 数据源类型
	ViewSourceCatalogName string       `json:"view_source_catalog_name"`  // 视图源
	Type                  string       `json:"type"`                      // 视图类型
	ExploreJobId          string       `json:"explore_job_id"`            // 探查作业ID
	ExploreJobVer         int          `json:"explore_job_version"`       // 探查作业版本
	FavorID               uint64       `json:"favor_id,string,omitempty"` // 收藏id
	IsFavored             bool         `json:"is_favored"`                // 是否已收藏
	CanAuth               bool         `json:"can_auth"`                  // 能否授权
	CatalogProviderPath   string       `json:"catalog_provider"`          // 目录提供方路径
	UpdateCycle           int32        `json:"update_cycle"`              // 更新周期
	SharedType            int32        `json:"shared_type"`               // 共享属性
	OpenType              int32        `json:"open_type"`                 // 开放属性
}
type FieldsRes struct {
	ID                  string  `json:"id"`                     // 列uuid
	TechnicalName       string  `json:"technical_name"`         // 列技术名称
	BusinessName        string  `json:"business_name"`          // 列业务名称
	OriginalName        string  `json:"original_name"`          // 原始字段名称
	Comment             string  `json:"comment"`                // 列注释
	Status              string  `json:"status"`                 // 列视图状态(扫描结果) 0：无变化、1：新增、2：删除
	PrimaryKey          bool    `json:"primary_key"`            // 是否主键
	DataType            string  `json:"data_type"`              // 数据类型
	DataLength          int32   `json:"data_length"`            // 数据长度
	DataAccuracy        int32   `json:"data_accuracy"`          // 数据精度（仅DECIMAL类型）
	OriginalDataType    string  `json:"original_data_type"`     // 原始数据类型
	IsNullable          string  `json:"is_nullable"`            // 是否为空 (YES/NO)
	BusinessTimestamp   bool    `json:"business_timestamp"`     // 是否业务时间字段
	StandardCode        string  `json:"standard_code"`          // 数据标准code
	Standard            string  `json:"standard"`               // 数据标准名称
	StandardType        string  `json:"standard_type"`          // 数据标准类型
	StandardTypeName    string  `json:"standard_type_name"`     // 数据标准类型名称
	StandardStatus      string  `json:"standard_status"`        // 数据标准状态
	CodeTableID         string  `json:"code_table_id"`          // 码表ID
	CodeTable           string  `json:"code_table"`             // 码表名称
	CodeTableStatus     string  `json:"code_table_status"`      // 码表状态
	IsReadable          bool    `json:"is_readable"`            // 当前用户是否有此字段的读取权限
	IsDownloadable      bool    `json:"is_downloadable"`        // 当前用户是否有此字段的下载权限
	AttributeID         *string `json:"attribute_id"`           // L5属性ID
	AttributeName       string  `json:"attribute_name"`         // L5属性名称
	AttributePath       string  `json:"attribute_path"`         // 路径id
	LabelID             string  `json:"label_id"`               // 标签ID
	LabelName           string  `json:"label_name"`             // 标签名称
	LabelIcon           string  `json:"label_icon"`             // 标签颜色
	LabelPath           string  `json:"label_path"`             //标签路径
	LabelIsProtected    bool    `json:"label_is_protected"`     // 标签是否受数据查询保护
	ClassfityType       *int    `json:"classfity_type"`         // 分类类型(1自动2人工)
	GradeType           *int    `json:"grade_type"`             // 分级类型(1自动2人工)
	EnableRules         int     `json:"enable_rules"`           // 已开启字段级规则数
	TotalRules          int     `json:"total_rules"`            // 字段级规则总数
	ResetBeforeDataType string  `json:"reset_before_data_type"` // 重置前数据类型
	ResetConvertRules   string  `json:"reset_convert_rules"`    // 重置转换规则 （仅日期类型）
	ResetDataLength     int32   `json:"reset_data_length" `     // 重置数据长度（仅DECIMAL类型）
	ResetDataAccuracy   int32   `json:"reset_data_accuracy"`    // 重置数据精度（仅DECIMAL类型）
	SimpleType          string  `json:"simple_type"`            // 数据大类型
	Index               int     `json:"index"`                  // 字段顺序
	SharedType          int32   `json:"shared_type"`            // 共享属性
	OpenType            int32   `json:"open_type"`              // 开放属性
	SensitiveType       int32   `json:"sensitive_type"`         // 敏感属性
	SecretType          int32   `json:"secret_type"`            // 涉密属性

}

// ByIndex 实现 sort.Interface 接口
type ByIndex []*FieldsRes

func (a ByIndex) Len() int           { return len(a) }
func (a ByIndex) Swap(i, j int)      { a[i], a[j] = a[j], a[i] }
func (a ByIndex) Less(i, j int) bool { return a[i].Index < a[j].Index }

//endregion

//region GetFieldsDetail

type GetFieldsDetailReq struct {
	GetFieldsDetailReqParamPath `param_type:"path"`
}

type GetFieldsDetailReqParamPath struct {
	FormID  string `uri:"id" binding:"required,uuid" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"`
	FieldID string `uri:"field_id" binding:"required,uuid" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"`
}
type GetFieldsDetailRes struct {
	SampleData []any `json:"sample_data"`
}

//endregion

//region GetDatasourceList

type GetDatasourceListReq struct {
	GetDatasourceListReqParamPath `param_type:"query"`
}

type GetDatasourceListReqParamPath struct {
	Type           string  `json:"type"  form:"type"  binding:"omitempty" example:"mariadb"`                                              // 数据源类型
	SourceType     string  `json:"source_type" form:"source_type" binding:"omitempty,oneof=records analytical sandbox" example:"records"` // 数据源类型 records 信息系统 analytical 数据仓库   sandbox 数据沙箱
	SourceTypes    string  `json:"source_types" form:"source_types"`                                                                      // 数据源类型多选 records 信息系统 analytical 数据仓库   sandbox 数据沙箱
	SourceTypeList []int32 `json:"source_type_list"`
}
type GetDatasourceListRes struct {
	Datasource []*Datasource `json:"entries"`
}

type Datasource struct {
	DataSourceID uint64 `json:"data_source_id"` // 数据源雪花id
	ID           string `json:"id"`             // 数据源业务id
	InfoSystemID string `json:"info_system_id"` // 信息系统id
	Name         string `json:"name"`           // 数据源名称
	CatalogName  string `json:"catalog_name"`   // 数据源catalog名称
	Type         string `json:"type"`           // 数据库类型
	Host         string `json:"host"`           // 连接地址
	Port         int32  `json:"port"`           // 端口
	Username     string `json:"username"`       // 用户名
	DatabaseName string `json:"database_name"`  // 数据库名称
	Schema       string `json:"schema"`         // 数据库模式
	CreatedAt    int64  `json:"created_at"`     // 创建时间
	UpdatedAt    int64  `json:"updated_at"`     // 更新时间
	Status       int32  `json:"status"`         // 扫描状态，0为未扫描，1为已完成，2为进行中
}

//endregion

//region FinishProject

type FinishProjectReq struct {
	FinishProjectReqParamPath `param_type:"body"`
}

type FinishProjectReqParamPath struct {
	TaskIDs []string `json:"task_id" form:"task_id" binding:"required,dive,uuid" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"`
}

//endregion

//region GetUsersFormViews

type GetUsersFormViewsReq struct {
	GetUsersFormViewsReqParamPath `param_type:"query"`
}

type GetUsersFormViewsReqParamPath struct {
	request.KeywordInfo
	Owner            bool     `json:"owner" form:"owner,default=false" default:"false"`                                                      // owner可用资产
	Offset           int      `json:"offset" form:"offset,default=1" binding:"min=1" default:"1"`                                            // 页码，默认1
	Limit            int      `json:"limit" form:"limit,default=10" binding:"min=1,max=2000"  default:"10"`                                  // 每页大小，默认10
	Direction        string   `json:"direction" form:"direction,default=desc" binding:"oneof=asc desc" default:"desc"`                       // 排序方向，枚举：asc：正序；desc：倒序。默认倒序
	Sort             string   `json:"sort" form:"sort,default=publish_at" binding:"oneof=publish_at online_time name"  default:"publish_at"` // 排序类型，
	OrgCode          string   `json:"org_code" form:"org_code" binding:"omitempty,uuid" `                                                    // 部门id
	SubjectDomainID  string   `json:"subject_domain_id" form:"subject_domain_id" binding:"omitempty,uuid"`                                   // 主题域id
	DataOwner        string   `json:"data_owner" form:"data_owner" binding:"omitempty,uuid"`                                                 // 数据owner，专门用来过滤的
	SubDepartmentIDs []string `json:"-"`
	OwnerId          string   `json:"-"`
	ViewIds          []string `json:"-"`
	LineStatus       []string `json:"-"`
	AppId            string   `json:"app_id" form:"app_id" binding:"TrimSpace,omitempty,uuid"` // 应用ID
	// 权限规则状态过滤器，非空时根据滤逻辑视图及其子视图的权限规则状态过滤。
	//
	//  Active：返回所有规则都处于有效期的逻辑视图
	//  Expired：返回任意规则已过期的逻辑视图
	PolicyStatus PolicyStatusFilter `json:"policy_status,omitempty" form:"policy_status"`
}

// 权限规则状态过滤器
type PolicyStatusFilter string

const (
	// 权限规则处于有效期内
	PolicyActive PolicyStatusFilter = "Active"
	// 权限规则已过期
	PolicyExpired PolicyStatusFilter = "Expired"
)

type GetUsersFormViewsPageRes struct {
	//PageResultNew[FormView]
	PageResultNew[UsersFormView]
}

type UsersFormView struct {
	*FormView
	AllowDownload bool `json:"allow_download"` // 是否有下载权限（UsersFormView相比FormView增加的字段）
	//逻辑视图及其子视图（行列规则）的权限规则
	Policies []*auth_service.Entries `json:"policies,omitempty"`
}

//endregion

//region GetUsersFormViewsFields

type GetUsersFormViewsFieldsReq struct {
	IDReqParamPath                       `param_type:"path"`
	GetUsersFormViewsFieldsReqParamQuery `param_type:"query"`
}

type GetUsersFormViewsFieldsReqParamQuery struct {
	EnableDataProtection *bool `json:"enable_data_protection" form:"enable_data_protection" binding:"omitempty"` // 是否启用数据查询保护过滤
}

//endregion
//region GetUsersMultiFormViewsFields

type GetUsersMultiFormViewsFieldsReq struct {
	GetUsersMultiFormViewsFieldsBody `param_type:"body"`
}
type GetUsersMultiFormViewsFieldsBody struct {
	IDs []string `json:"ids" binding:"required,dive,uuid"` //视图id
}

//	type GetUsersMultiFormViewsFieldsRes struct {
//		LogicViews []*GetFieldsRes `json:"logic_views"`
//	}
type GetFieldsResWithId struct {
	*GetFieldsRes
	ID string `json:"id"`
}
type GetUsersMultiFormViewsFieldsRes struct {
	LogicViews []*GetFieldsResWithId `json:"logic_views"`
}

//endregion
//region GetMultiViewsFields

type GetMultiViewsFieldsReq struct {
	GetUsersMultiFormViewsFieldsBody `param_type:"body"`
}
type GetMultiViewsFieldsBody struct {
	IDs []string `json:"ids" binding:"required,min=1,dive,uuid"` //视图id
}
type LogicViewFields struct {
	Fields                []*FieldsRes `json:"fields"`
	ID                    string       `json:"id"`
	TechnicalName         string       `json:"technical_name"`           // 技术名称
	BusinessName          string       `json:"business_name"`            // 业务名称
	UniformCatalogCode    string       `json:"uniform_catalog_code"`     // 逻辑视图编码
	ViewSourceCatalogName string       `json:"view_source_catalog_name"` // 视图源
}
type GetMultiViewsFieldsRes struct {
	LogicViews []*LogicViewFields `json:"logic_views"`
}

//endregion

//region DeleteRelated

type DeleteRelatedReq struct {
	DeleteRelatedReqParamPath `param_type:"body"`
}

type DeleteRelatedReqParamPath struct {
	SubjectDomainIDs []string      `json:"subject_domain_ids" form:"subject_domain_ids" binding:"omitempty,dive,uuid" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"`
	LogicEntityIDs   []string      `json:"logic_entity_ids" form:"logic_entity_ids" binding:"omitempty,dive,uuid" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"`
	MoveDeletes      []*MoveDelete `json:"move_deletes"`
}
type MoveDelete struct {
	SubjectDomainID string `json:"subject_domain_id"`
	LogicEntityID   string `json:"logic_entity_id"`
}

//endregion

// region FormViewFilter

type FormViewFilterReq struct {
	FormViewFilterBodyParams `param_type:"body"`
}

type FormViewFilterBodyParams struct {
	IDS []string `json:"ids"`
}

type FormViewFilterResp struct {
	IDS []string `json:"ids"`
}

// endregion

//region GetFormViewDetails

type GetFormViewDetailsReq struct {
	IDReqParamPath `param_type:"path"`
}

type GetFormViewDetailsRes struct {
	TechnicalName          string   `json:"technical_name"`           // 表技术名称
	BusinessName           string   `json:"business_name"`            // 表业务名称
	OriginalName           string   `json:"original_name"`            // 原始名称
	Type                   string   `json:"type"`                     // 视图类型
	UniformCatalogCode     string   `json:"uniform_catalog_code"`     // 逻辑视图编码
	DatasourceID           string   `json:"datasource_id"`            // 数据源id （不可编辑）
	DatasourceName         string   `json:"datasource_name"`          // 数据源名称 （不可编辑）
	DatasourceDepartmentID string   `json:"datasource_department_id"` // 数据源所属部门ID
	Schema                 string   `json:"schema"`                   // 库名称  （不可编辑）
	InfoSystemID           string   `json:"info_system_id"`           // 关联信息系统ID  （不可编辑）
	InfoSystem             string   `json:"info_system"`              // 关联信息系统（默认显示所属数据源信息系统，非必填，以用户修改为准）
	Description            string   `json:"description"`              // 描述
	Comment                string   `json:"comment"`                  // 注释
	SubjectID              string   `json:"subject_id"`               // 所属主题id
	SubjectPathID          string   `json:"subject_path_id"`          // 所属主题path id
	Subject                string   `json:"subject"`                  // 所属主题
	DepartmentID           string   `json:"department_id"`            // 所属部门id
	Department             string   `json:"department"`               // 所属部门
	Owners                 []*Owner `json:"owners"`                   // 数据Owner
	SceneAnalysisId        string   `json:"scene_analysis_id"`        // 场景分析画布id
	ViewSourceCatalogName  string   `json:"view_source_catalog_name"` // 视图源
	PublishAt              int64    `json:"publish_at"`               // 发布时间
	OnlineStatus           string   `json:"online_status"`            // 上线状态
	OnlineTime             int64    `json:"online_time"`              // 上线时间
	CreatedAt              int64    `json:"created_at"`               // 创建时间
	CreatedByUser          string   `json:"created_by"`               // 创建人
	UpdatedAt              int64    `json:"updated_at"`               // 编辑时间
	UpdatedByUser          string   `json:"updated_by"`               // 编辑人

	Sheet            string `json:"sheet"`               // sheet页,逗号分隔
	StartCell        string `json:"start_cell"`          // 起始单元格
	EndCell          string `json:"end_cell"`            // 结束单元格
	HasHeaders       bool   `json:"has_headers"`         // 是否首行作为列名
	SheetAsNewColumn bool   `json:"sheet_as_new_column"` // 是否将sheet作为新列
	ExcelFileName    string `json:"excel_file_name"`     // excel文件名

	SourceSign int32  `json:"source_sign" form:"source_sign"` // 来源标识
	IsFavored  bool   `json:"is_favored"`                     // 是否已收藏
	FavorID    uint64 `json:"favor_id,string,omitempty"`      // 收藏项ID，仅已收藏时返回该字段
	// 发布状态
	PublishStatus       string `gorm:"-" json:"publish_status"`
	CatalogProviderPath string `json:"catalog_provider"` // 目录提供方路径
	UpdateCycle         int32  `json:"update_cycle"`     // 更新周期
	SharedType          int32  `json:"shared_type"`      // 共享属性
	OpenType            int32  `json:"open_type"`        // 开放属性
}

//endregion
//region UpdateFormViewDetails

type UpdateFormViewDetailsReq struct {
	IDReqParamPath                 `param_type:"path"`
	UpdateFormViewDetailsParamPath `param_type:"body"`
}

type UpdateFormViewDetailsParamPath struct {
	BusinessName  string   `json:"business_name" binding:"required,min=1,max=255" example:"xxxx"`                                              // 视图业务名称
	TechnicalName *string  `json:"technical_name" binding:"omitempty,min=1,max=255" example:"xxxx"`                                            // 视图技术名称（仅自定义视图、逻辑实体视图支持）
	Description   string   `json:"description"  binding:"TrimSpace,omitempty" example:"description"`                                           // 描述
	SubjectID     string   `json:"subject_id" form:"subject_id" binding:"omitempty,uuid" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"`       // 主题域id (逻辑实体视图不支持)
	DepartmentID  string   `json:"department_id" form:"department_id" binding:"omitempty,uuid" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"` // 部门id
	OwnerID       []string `json:"owner_id" form:"owner_id" binding:"omitempty,dive,uuid" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"`      // 数据Owner id
	Owners        []*Owner `json:"owners"`                                                                                                     // 数据Owner
	SourceSign    *int32   `json:"source_sign" form:"source_sign" binding:"required,oneof=0 1"`                                                // 来源标识
	UpdateCycle   *int32   `json:"update_cycle" binding:"omitempty"`                                                                           // 更新周期
	SharedType    *int32   `json:"shared_type" binding:"omitempty"`                                                                            // 共享属性
	OpenType      *int32   `json:"open_type" binding:"omitempty"`                                                                              // 开放属性
}

type UpdateFormViewDetailsRes struct {
}

//endregion

//region QueryLogicalEntityByView

type QueryLogicalEntityByViewReq struct {
	FormViewNameQuery `param_type:"query"`
}
type FormViewNameQuery struct {
	request.PageSortKeyword
}

type QueryLogicalEntityByViewResp PageResultNew[QueryLogicalEntity]

type QueryLogicalEntity struct {
	ID            string `json:"id"`                // 逻辑视图uuid
	TechnicalName string `json:"technical_name"`    // 表技术名称
	BusinessName  string `json:"business_name"`     // 表业务名称
	SubjectID     string `json:"subject_domain_id"` // 逻辑实体的ID
	SubjectPath   string `json:"subject_path"`      //逻辑实体的名称路径
	SubjectIDPath string `json:"subject_id_path"`   // 逻辑实体的ID path
}

//endregion

//region QueryLogicalEntityByView

type QueryViewCountReq struct {
	QueryViewCountReqQuery `param_type:"query"`
}

type QueryViewCountReqQuery struct {
	ViewType int32 `json:"view_type" form:"view_type" binding:"required,oneof=1 2 3"`
}

type QueryViewCountResp struct {
	LogicalEntityViewCount int `json:"logical_entity_view_count"`
}

//region end

// region QueryViewDetailBySubjectID

const (
	QueryFlagAll   = "all"
	QueryFlagCount = "count"
	QueryFlagTotal = "total"
)

type QueryViewDetailBySubjectIDReq struct {
	QueryViewDetailBySubjectIDReqParam `param_type:"body"`
}

type QueryViewDetailBySubjectIDReqParam struct {
	Flag       string   `json:"flag" form:"flag" binding:"required,oneof=all count total"` //如果是all, 返回所有的数量；如果是count, 返回下面数组的数量,  如果是total ，只返回总的数量即可
	IsOperator bool     `json:"is_operator"`                                               //如果为true，表示该用户是数据运营角色或者数据开发角色，这时展示所有的视图数据
	ID         []string `json:"id"`                                                        //业务域，业务对象ID
}

type QueryViewDetailBySubjectIDResp struct {
	Total       int64                `json:"total"`
	RelationNum []DomainViewRelation `json:"relation_num"`
}

type DomainViewRelation struct {
	SubjectDomainID string `json:"subject_domain_id"` //业务域，业务对象ID
	RelationViewNum int64  `json:"relation_view_num"`
}

//region end

//region GetExploreJobStatus

type GetExploreJobStatusReq struct {
	GetExploreJobStatusReqParamPath `param_type:"query"`
}

type GetExploreJobStatusReqParamPath struct {
	FormViewID   string `json:"form_view_id" form:"form_view_id" binding:"omitempty,uuid" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"`   // 逻辑视图id
	DatasourceID string `json:"datasource_id" form:"datasource_id" binding:"omitempty,uuid" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"` // 数据源id
}

type ExploreJobStatusResp struct {
	ExploreType string `json:"explore_type"` // 探查类型
	Status      string `json:"status"`       // 探查作业执行状态
}

type JobStatusList struct {
	Entries    []*TaskStatusRespDetail `json:"entries" `     // 对象列表
	TotalCount int64                   `json:"total_count" ` // 当前筛选条件下的对象数量
}

type TaskStatusRespDetail struct {
	TaskId      string `json:"task_id"`      // 任务配置id
	Version     int32  `json:"version"`      // 版本号
	TaskName    string `json:"task_name"`    // 探查任务配置名称
	TableId     string `json:"table_id"`     // 数据源表ID
	Table       string `json:"table"`        // 表名称
	Schema      string `json:"schema"`       // 数据库名
	VeCatalog   string `json:"ve_catalog"`   // 数据源编
	ExecStatus  int32  `json:"exec_status"`  // 执行状态 1未执行，2执行中，3执行成功，4已取消，5执行失败
	UpdatedAt   int64  `json:"updated_at"`   // 更新时间
	ExploreType int32  `json:"explore_type"` // 探查类型
	Reason      string `json:"reason"`       // 失败原因
}

//endregion

//region GetExploreReport

type GetExploreReportReq struct {
	GetExploreReportReqParamPath `param_type:"query"`
}

type GetExploreReportReqParamPath struct {
	ID         string `json:"id" form:"id" binding:"required,uuid" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"` // 逻辑视图id
	Version    *int32 `json:"version" form:"version" binding:"omitempty"`                                          // 报告版本
	ThirdParty bool   `json:"third_party" form:"third_party" binding:"omitempty"`                                  // 第三方报告
}

type ExploreReportResp struct {
	Code                   string                `json:"code" `                    // 数据探查报告编号
	TaskId                 string                `json:"task_id" `                 // 任务ID
	Version                int32                 `json:"version" `                 // 任务版本
	ExploreTime            int64                 `json:"explore_time,omitempty"`   // 探查时间
	Overview               *ReportOverview       `json:"overview,omitempty"`       // 总览信息
	TotalSample            int64                 `json:"total_sample"`             // 采样条数
	ExploreMetadataDetails *ExploreDetails       `json:"explore_metadata_details"` // 元数据级探查结果详情
	ExploreFieldDetails    []*ExploreFieldDetail `json:"explore_field_details"`    // 字段级探查结果详情
	ExploreRowDetails      *ExploreDetails       `json:"explore_row_details"`      // 行级探查结果详情
	ExploreViewDetails     []*RuleResult         `json:"explore_view_details"`     // 视图级探查结果详情
}

type ReportOverview struct {
	ScoreTrends []*ScoreTrend      `json:"score_trend,omitempty"` // 六性评分历史趋势数据
	Fields      *ExploreFieldsInfo `json:"fields,omitempty"`      // 表字段信息
	DimensionScores
}

type ExploreDetails struct {
	ExploreDetails []*RuleResult `json:"explore_details"` // 探查结果详情
	DimensionScores
}

type ExploreFieldDetail struct {
	FieldId  string        `json:"field_id"`  // 字段id
	CodeInfo string        `json:"code_info"` // 码表信息
	Details  []*RuleResult `json:"details"`   // 规则结果明细（仅返回部分需要呈现的字段规则输出结果）
	DimensionScores
}

//type ExploreFieldAddInfo struct {
//	FieldNameCN  string `json:"field_name_cn"` // 字段中文名称
//	FieldComment string `json:"field_comment"` // 字段备注
//}

type ScoreTrend struct {
	TaskId               string   `json:"task_id" `              // 任务ID
	Version              int      `json:"version" `              // 任务版本
	ExploreTime          int64    `json:"explore_time"`          // 探查时间
	CompletenessScore    *float64 `json:"completeness_score"`    // 完整性维度评分，缺省为NULL
	UniquenessScore      *float64 `json:"uniqueness_score"`      // 唯一性维度评分，缺省为NULL
	StandardizationScore *float64 `json:"standardization_score"` // 规范性维度评分，缺省为NULL
	AccuracyScore        *float64 `json:"accuracy_score"`        // 准确性维度评分，缺省为NULL
	ConsistencyScore     *float64 `json:"consistency_score"`     // 一致性维度评分，缺省为NULL
}

type DimensionScores struct {
	CompletenessScore    *float64 `json:"completeness_score"`    // 完整性维度评分，缺省为NULL
	UniquenessScore      *float64 `json:"uniqueness_score"`      // 唯一性维度评分，缺省为NULL
	StandardizationScore *float64 `json:"standardization_score"` // 规范性维度评分，缺省为NULL
	AccuracyScore        *float64 `json:"accuracy_score"`        // 准确性维度评分，缺省为NULL
	ConsistencyScore     *float64 `json:"consistency_score"`     // 一致性维度评分，缺省为NULL
}

type ExploreFieldsInfo struct {
	TotalCount   int `json:"total_count"`   // 总字段数
	ExploreCount int `json:"explore_count"` // 探查字段数
}

type RuleResult struct {
	RuleId          string  `json:"rule_id"`          // 规则ID
	RuleName        string  `json:"rule_name"`        // 规则名称
	RuleDescription string  `json:"rule_description"` // 规则描述
	RuleConfig      *string `json:"rule_config"`
	Dimension       string  `json:"dimension"`       // 维度属性 0准确性,1及时性,2完整性,3唯一性，4一致性,5规范性,6数据统计
	DimensionType   string  `json:"dimension_type"`  // 维度类型
	Result          *string `json:"result"`          // 规则输出结果 []any规则输出列级结果
	InspectedCount  int64   `json:"inspected_count"` // 检测数据量
	IssueCount      int64   `json:"issue_count"`     // 问题数据量
	DimensionScores
}

type EnumEntity struct {
	Key   string `json:"key"`   // 码值
	Value string `json:"value"` // 码值描述
}

type SrcReportData struct {
	Code            string                `json:"code" `      // 数据探查报告编号
	TaskId          string                `json:"task_id" `   // 任务ID
	Version         int32                 `json:"version" `   // 任务版本
	Table           string                `json:"table"`      // 表名称
	TableId         string                `json:"table_id"`   // 表id
	Schema          string                `json:"schema"`     // 数据库名
	VeCatalog       string                `json:"ve_catalog"` // 数据源编目
	MetadataExplore *ExploreDetails       `json:"metadata_explore"`
	FieldExplore    []*ExploreFieldDetail `json:"field_explore"` // 字段探查参数
	RowExplore      *ExploreDetails       `json:"row_explore"`
	ViewExplore     []*RuleResult         `json:"table_explore"` // 视图级探查参数
	CreatedAt       int64                 `json:"created_at"`    // 探查开始时间
	FinishedAt      int64                 `json:"finished_at"`   // 探查结束时间
	TotalSample     int64                 `json:"total_sample"`  // 采样条数
	TotalScore      *float64              `json:"total_score"`   // 总分，缺省为NULL
	DimensionScores
}

type SrcReportTableExploreRet struct {
	TotalScore *float64 `json:"total_score"`
	SrcReportRetBase
}

type SrcReportFieldExploreRet struct {
	FieldName string `json:"field_name"`
	FieldType int    `json:"field_type"`
	Params    string `json:"params"`
	SrcReportRetBase
}

type SrcReportRetBase struct {
	RuleResults []*SrcReportRuleRetItem `json:"projects"`
	SrcReportDimensionScores
}

type SrcReportDimensionScores struct {
	CompletenessScore *float64 `json:"wzx"` // 完整性维度评分，缺省为NULL
	UniquenessScore   *float64 `json:"wyx"` // 唯一性维度评分，缺省为NULL
	TimelinessScore   *float64 `json:"jsx"` // 及时性维度评分，缺省为NULL
	ValidityScore     *float64 `json:"yxx"` // 有效性维度评分，缺省为NULL
	AccuracyScore     *float64 `json:"zqx"` // 准确性维度评分，缺省为NULL
	ConsistencyScore  *float64 `json:"yzx"` // 一致性维度评分，缺省为NULL
}

type SrcReportRuleRetItem struct {
	Code      string         `json:"code"`
	Version   int            `json:"version"`
	Params    map[string]any `json:"param"`
	ResultStr string         `json:"result"`
	Result    []map[string]any
}

type ExploreRuleItem struct {
	Code            string        `json:"code"`          // 规则code
	Name            string        `json:"name"`          // 规则名称
	Level           int           `json:"level"`         // 探查级别
	Version         int           `json:"version"`       // 规则版本
	Dimension       int           `json:"dimension"`     // 维度属性
	Scored          int           `json:"scored"`        // 是否评分规则 0 不参与评分 1 参与评分
	ResultFormatStr string        `json:"result_format"` // 返回列说明
	ResultFormat    []*ColumnInfo `json:"-"`             // 列说明对象数组
}

type ColumnInfo struct {
	Name string `json:"name"` // 列表头
	Desc string `json:"desc"` // 列表头说明
}

type ReportList struct {
	List []*ReportListItem `json:"entries"` // 报告列表数组
}

type ReportListItem struct {
	JobID                string   `json:"task_id"`               // 探查作业ID
	Version              int      `json:"version"`               // 探查作业版本号
	CreatedAt            int64    `json:"created_at"`            // 探查开始时间
	FinishedAt           int64    `json:"finished_at"`           // 探查结束时间
	TotalRows            int64    `json:"total_rows"`            // 总扫描行数
	TotalScore           *float64 `json:"total_score"`           // 总评分
	CompletenessScore    *float64 `json:"completeness_score"`    // 完整性维度评分，缺省为NULL
	UniquenessScore      *float64 `json:"uniqueness_score"`      // 唯一性维度评分，缺省为NULL
	StandardizationScore *float64 `json:"standardization_score"` // 规范性维度评分，缺省为NULL
	AccuracyScore        *float64 `json:"accuracy_score"`        // 准确性维度评分，缺省为NULL
	ConsistencyScore     *float64 `json:"consistency_score"`     // 一致性维度评分，缺省为NULL
}

type Quantile struct {
	Title     string
	ColResult []any
}

//endregion

//region GetExploreConfig

type GetExploreConfigReq struct {
	GetExploreConfigReqQuery `param_type:"query"`
}

type GetExploreConfigReqQuery struct {
	DatasourceID string `json:"datasource_id" form:"datasource_id" binding:"omitempty,uuid" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"` // 数据源id
	FormViewID   string `json:"form_view_id" form:"form_view_id" binding:"omitempty,uuid" example:"13b8a80b-1914-4896-99d8-51559dba26c4"`   // 逻辑视图id
}

type ExploreConfigResp struct {
	DatasourceID string `json:"datasource_id"` // 数据源id
	FormViewID   string `json:"form_view_id"`  // 逻辑视图id
	Config       string `json:"config"`        //  探查配置
}

//endregion

//region GetDatasourceOverview

type GetDatasourceOverviewReq struct {
	GetDatasourceOverviewReqQuery `param_type:"query"`
}

type GetDatasourceOverviewReqQuery struct {
	DatasourceID string `json:"datasource_id" form:"datasource_id" binding:"required,uuid" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"` // 数据源id
}

type DatasourceOverviewResp struct {
	ViewCount                       int64 `json:"view_count"`                         // 逻辑视图数量
	ExploredDataViewCount           int64 `json:"explored_data_view_count"`           // 已探查数据视图数量
	ExploredTimestampViewCount      int64 `json:"explored_timestamp_view_count"`      // 已探查时间戳视图数量
	ExploredClassificationViewCount int64 `json:"explored_classification_view_count"` // 已探查数据分类视图数量
	PublishedViewCount              int64 `json:"published_view_count"`               // 已发布视图数量
	ConfiguredViewCount             int64 `json:"configured_view_count"`              // 已配置规则视图
	FieldCount                      int64 `json:"field_count"`                        // 字段总数
	AssociatedStandardFieldCount    int64 `json:"associated_standard_field_count"`    // 已关联标准字段数量
	AssociatedCodeFieldCount        int64 `json:"associated_code_field_count"`        // 已关联码表字段数量
}

//endregion

//region GetOverview

type GetOverviewReq struct {
	GetOverviewReqParam `param_type:"query"`
}

type GetOverviewReqParam struct {
	DepartmentID string `json:"department_id" form:"department_id" binding:"required"` // 部门id
	OwnerIDs     string `json:"owner_ids" form:"owner_ids" binding:"omitempty"`
}

type GetOverviewResp struct {
	AverageScore                *float64 `json:"average_score"`                 // 质量平均分，缺省为NULL
	TotalViews                  int64    `json:"total_views"`                   // 视图总量
	ExploredViews               int64    `json:"explored_views"`                // 已探查成功视图数
	AboveAverageViews           int64    `json:"above_average_views"`           // 高于平均分视图数
	BelowAverageViews           int64    `json:"below_average_views"`           // 低于平均分视图数
	CompletenessAverageScore    *float64 `json:"completeness_average_score"`    // 完整性维度平均分，缺省为NULL
	UniquenessAverageScore      *float64 `json:"uniqueness_average_score"`      // 唯一性维度平均分，缺省为NULL
	StandardizationAverageScore *float64 `json:"standardization_average_score"` // 规范性维度平均分，缺省为NULL
	AccuracyAverageScore        *float64 `json:"accuracy_average_score"`        // 准确性维度平均分，缺省为NULL
	ConsistencyAverageScore     *float64 `json:"consistency_average_score"`     // 一致性维度平均分，缺省为NULL
}

type GetDataExploreReportsResp struct {
	response.PageResult[SrcReportData]
}

//endregion

//region GetExploreReports

type GetExploreReportsReq struct {
	GetExploreReportsReqParam `param_type:"query"`
}

type GetExploreReportsReqParam struct {
	DepartmentID string  `json:"department_id" form:"department_id" binding:"required"`                                                                                                                                              // 部门id
	OwnerIDs     string  `json:"owner_ids" form:"owner_ids" binding:"omitempty"`                                                                                                                                                     // 数据owner id
	Offset       *int    `json:"offset" form:"offset,default=1" binding:"min=1" default:"1"`                                                                                                                                         // 页码，默认1
	Limit        *int    `json:"limit" form:"limit,default=10" binding:"min=1,max=2000"  default:"10"`                                                                                                                               // 每页大小，默认10
	Direction    *string `json:"direction" form:"direction,default=desc" binding:"oneof=asc desc" default:"desc"`                                                                                                                    // 排序方向，枚举：asc：正序；desc：倒序。默认倒序
	Sort         *string `json:"sort" form:"sort,default=f_total_score" binding:"oneof=f_total_score f_total_completeness f_total_standardization f_total_uniqueness f_total_accuracy f_total_consistency"  default:"f_total_score"` // 排序类型
	Keyword      string  `json:"keyword" form:"keyword" binding:"KeywordTrimSpace,omitempty,min=1,max=255"`                                                                                                                          // 关键字查询，字符无限制
}

type GetExploreReportsResp struct {
	response.PageResult[ExploreReportInfo]
}

type ExploreReportInfo struct {
	FormViewID           string   `json:"form_view_id"`          // 视图UUID
	TechnicalName        string   `json:"technical_name"`        // 技术名称
	BusinessName         string   `json:"business_name"`         // 业务名称
	TotalScore           *float64 `json:"total_score"`           // 总分，缺省为NULL
	CompletenessScore    *float64 `json:"completeness_score"`    // 完整性维度评分，缺省为NULL
	UniquenessScore      *float64 `json:"uniqueness_score"`      // 唯一性维度评分，缺省为NULL
	StandardizationScore *float64 `json:"standardization_score"` // 规范性维度评分，缺省为NULL
	AccuracyScore        *float64 `json:"accuracy_score"`        // 准确性维度评分，缺省为NULL
	ConsistencyScore     *float64 `json:"consistency_score"`     // 一致性维度评分，缺省为NULL
}

//endregion

//region ExportExploreReports

type ExportExploreReportsReq struct {
	ExportExploreReportsReqBody `param_type:"body"`
}

type ExportExploreReportsReqBody struct {
	DepartmentID string `json:"department_id" form:"department_id" binding:"required"` // 部门id
	OwnerIDs     string `json:"owner_ids" form:"owner_ids" binding:"omitempty"`
	NeedRule     bool   `json:"need_rule" form:"need_rule" binding:"omitempty"`
}

type ExportExploreReportsResp struct {
	Buffer   *bytes.Buffer `json:"buffer"`
	FileName string        `json:"file_name"`
}

type CoverInfo struct {
	Title        string // 标题2
	EvaluateDate string // 评估时间行
}

type ScoreTable struct {
	TableCN     string
	TableEN     string
	Score       string
	Rank        string
	ExploreTime string
}

type DimensionScore struct {
	Dimension string
	Score     string
}

type ExploreRule struct {
	TableEN        string
	TableCN        string
	FieldEN        string
	FieldCN        string
	Rule           string
	RuleDesc       string
	SourceSystem   string
	OwnerName      string
	InspectedCount string
	IssueCount     string
}

//endregion

//region GetDepartmentExploreReports

type GetDepartmentExploreReportsReq struct {
	GetDepartmentExploreReportsReqParam `param_type:"query"`
}

type GetDepartmentExploreReportsReqParam struct {
	DepartmentID string  `json:"department_id" form:"department_id" binding:"omitempty"`                                                                                                                                             // 部门id
	Offset       *int    `json:"offset" form:"offset,default=1" binding:"min=1" default:"1"`                                                                                                                                         // 页码，默认1
	Limit        *int    `json:"limit" form:"limit,default=10" binding:"min=1,max=2000"  default:"10"`                                                                                                                               // 每页大小，默认10
	Direction    *string `json:"direction" form:"direction,default=desc" binding:"oneof=asc desc" default:"desc"`                                                                                                                    // 排序方向，枚举：asc：正序；desc：倒序。默认倒序
	Sort         *string `json:"sort" form:"sort,default=f_total_score" binding:"oneof=f_total_score f_total_completeness f_total_standardization f_total_uniqueness f_total_accuracy f_total_consistency"  default:"f_total_score"` // 排序类型
}

type GetDepartmentExploreReportsResp struct {
	response.PageResult[DepartmentExploreReportsInfo]
}

type DepartmentExploreReportsInfo struct {
	DepartmentID         string   `json:"department_id"`         // 部门id
	DepartmentName       string   `json:"department_name"`       // 部门名称
	DepartmentType       int32    `json:"department_type"`       // 部门类型
	DepartmentPath       string   `json:"department_path"`       // 部门路径
	TotalViews           int64    `json:"total_views"`           // 视图总量
	ExploredViews        int64    `json:"explored_views"`        // 已探查成功视图数
	TotalScore           *float64 `json:"total_score"`           // 总分，缺省为NULL
	CompletenessScore    *float64 `json:"completeness_score"`    // 完整性维度评分，缺省为NULL
	UniquenessScore      *float64 `json:"uniqueness_score"`      // 唯一性维度评分，缺省为NULL
	StandardizationScore *float64 `json:"standardization_score"` // 规范性维度评分，缺省为NULL
	AccuracyScore        *float64 `json:"accuracy_score"`        // 准确性维度评分，缺省为NULL
	ConsistencyScore     *float64 `json:"consistency_score"`     // 一致性维度评分，缺省为NULL
}

//endregion

type GetDataExploreReportsReq struct {
	TableIds  []string `json:"table_ids" binding:"omitempty,min=1,max=1000"`                                              // 表id
	Offset    *int     `json:"offset" form:"offset,default=1" binding:"omitempty,min=1" default:"1"`                      // 页码，默认1
	Limit     *int     `json:"limit" form:"limit,default=15" binding:"omitempty,min=1,max=100" default:"15"`              // 每页大小，默认15
	Direction *string  `json:"direction" form:"direction,default=desc" binding:"omitempty,oneof=asc desc" default:"desc"` // 排序方向，枚举：asc：正序；desc：倒序。默认倒序
	Sort      *string  `json:"sort" form:"sort" binding:"omitempty"`                                                      // 排序类型
}

type DepartmentStats struct {
	DepartmentId         string
	TotalViews           int64
	CoveredViews         int64
	AccuracySum          float64
	AccuracyCount        int64
	CompletenessSum      float64
	CompletenessCount    int64
	ConsistencySum       float64
	ConsistencyCount     int64
	UniquenessSum        float64
	UniquenessCount      int64
	ValiditySum          float64
	ValidityCount        int64
	QualitySum           float64
	AccuracyAvg          *float64
	CompletenessAvg      *float64
	ConsistencyAvg       *float64
	UniquenessAvg        *float64
	StandardizationAvg   *float64
	QualityScore         *float64
	Coverage             string
	Rank                 int
	ValidDimensionsCount int // 有效维度数量（用于计算质量得分）
}

type CheckV1Req struct {
	ResType string `form:"res_type" binding:"TrimSpace,required,oneof=data-catalog info-catalog elec-licence-catalog data-view interface-svc indicator" example:"data-catalog"` // 收藏资源类型 data-catalog 数据资源目录 info-catalog 信息资源目录 elec-licence-catalog 电子证照目录
	ResID   string `form:"res_id" binding:"TrimSpace,required,min=1,max=64" example:"544217704094017271"`                                                                       // 收藏资源ID
}

type CheckV1Resp struct {
	IsFavored bool   `json:"is_favored"`                // 是否已收藏
	FavorID   uint64 `json:"favor_id,string,omitempty"` // 收藏项ID，仅已收藏时返回该字段
}

type ResultResp struct {
	ViewId string `json:"table_id"` // 字段探查报告id
	TaskId string `json:"task_id"`  // 任务id
	Result string `json:"result"`
}

type FieldInfo struct {
	FieldName string `json:"field_name"` // 字段名
	Value     string `json:"value"`      // 字段值
}

const (
	TYPE_INT      = iota // 数字型
	TYPE_STRING          // 字符型
	TYPE_DATE            // 日期型
	TYPE_DATETIME        // 日期时间型
	TYPE_TIME            // 时间型
	TYPE_BOOL            // 布尔型
	TYPE_BINARY          // 二进制
	TYPE_OTHER    = 99   // 其他类型（合法）
)

var SampleColTypeRuleMap = map[int]map[string]bool{
	TYPE_INT:      {"min": true, "max": true, "dict": true},
	TYPE_STRING:   {"dict": true},
	TYPE_DATE:     {"min": true, "max": true},
	TYPE_DATETIME: {"min": true, "max": true},
	TYPE_TIME:     {"min": true, "max": true},
	TYPE_BOOL:     {"true": true, "false": true},
}

var (
	RuleResultsRowsLimitMap = map[string]int{
		"dict":                  0,
		"date_distribute_day":   20,
		"date_distribute_month": 20,
		"date_distribute_year":  20,
	} // 规则结果返回行数限制（枚举分布、日期年/月/天分布）
)

const (
	EXPLORE_RULE_LEVEL_TABLE       = iota // 表级规则
	EXPLORE_RULE_LEVEL_FIELD              // 字段级规则
	EXPLORE_RULE_LEVEL_CROSS_FIELD        // 跨字段级规则
	EXPLORE_RULE_LEVEL_CROSS_TABLE        // 跨表级规则
)

// data-download-task
type DownloadTaskCreateParams struct {
	DownloadTaskCreateReq `param_type:"body"`
}

type DownloadTaskCreateReq struct {
	FormViewID string `json:"form_view_id" binding:"required,uuid"`      // 逻辑视图ID
	Detail     string `json:"detail" binding:"required,TrimSpace,min=1"` // 下载任务配置详情，以json字符串聚合存储
}

type GetDownloadTaskListParams struct {
	GetDownloadTaskListReq `param_type:"query"`
}

type GetDownloadTaskListReq struct {
	Offset    int    `json:"offset" form:"offset,default=1" binding:"omitempty,min=1" default:"1"`                                      // 页码，默认1
	Limit     int    `json:"limit" form:"limit,default=10" binding:"omitempty,min=1,max=2000"  default:"10"`                            // 每页大小，默认10
	Direction string `json:"direction" form:"direction,default=desc" binding:"omitempty,oneof=asc desc" default:"desc"`                 // 排序方向，枚举：asc：正序；desc：倒序。默认倒序
	Sort      string `json:"sort" form:"sort,default=created_at" binding:"omitempty,oneof=created_at updated_at"  default:"created_at"` // 排序类型，枚举：created_at：按创建时间排序；updated_at：按更新时间排序。默认按创建时间排序
	Status    string `json:"status" form:"status" binding:"omitempty,oneof=queuing executing finished failed"`                          // 任务状态 queuing：排队中 executing：数据准备中 finished：可下载 failed：异常
	request.KeywordInfo
}

type DownlaodTaskPath struct {
	DownlaodTaskPathReq `param_type:"path"`
}

type DownlaodTaskPathReq struct {
	TaskID constant.ModelID `uri:"taskID" binding:"required,VerifyModelID"` // 审核流程绑定ID
}

type DownloadTaskIDResp struct {
	ID uint64 `json:"id,string"` // 任务ID
}

type DownloadLinkResp struct {
	Link string `json:"link"` // 带鉴权下载链接
}

type DownloadTaskEntry struct {
	ID         uint64  `json:"id,string"`    // 任务ID
	FormViewID string  `json:"form_view_id"` // 逻辑视图ID
	Name       string  `json:"name"`         // 逻辑视图业务名称
	NameEN     string  `json:"name_en"`      // 逻辑视图技术名称
	Status     string  `json:"status"`       // 任务状态 queuing：排队中 executing：数据准备中 finished：可下载 failed：异常
	CreatedAt  int64   `json:"created_at"`   // 创建时间戳
	UpdatedAt  int64   `json:"updated_at"`   // 更新时间戳
	Remark     *string `json:"remark"`       // 异常原因
}

const (
	TASK_STATUS_QUEUING  = iota + 1 // 排队中
	TASK_STATUS_EXECUING            // 执行中/数据准备中
	TASK_STATUS_FINISHED            // 已完成/可下载
	TASK_STATUS_FAILED              // 执行失败/异常
)

const (
	TASK_STATUS_STR_QUEUING  = "queuing"   // 排队中
	TASK_STATUS_STR_EXECUING = "executing" // 执行中/数据准备中
	TASK_STATUS_STR_FINISHED = "finished"  // 已完成/可下载
	TASK_STATUS_STR_FAILED   = "failed"    // 执行失败/异常
)

func TaskStatus2Enum(ts string) int {
	switch ts {
	case TASK_STATUS_STR_QUEUING:
		return TASK_STATUS_QUEUING
	case TASK_STATUS_STR_EXECUING:
		return TASK_STATUS_EXECUING
	case TASK_STATUS_STR_FINISHED:
		return TASK_STATUS_FINISHED
	case TASK_STATUS_STR_FAILED:
		return TASK_STATUS_FAILED
	default:
		return 0
	}
}

func TaskStatus2String(ts int) string {
	switch ts {
	case TASK_STATUS_QUEUING:
		return TASK_STATUS_STR_QUEUING
	case TASK_STATUS_EXECUING:
		return TASK_STATUS_STR_EXECUING
	case TASK_STATUS_FINISHED:
		return TASK_STATUS_STR_FINISHED
	case TASK_STATUS_FAILED:
		return TASK_STATUS_STR_FAILED
	default:
		return ""
	}
}

func TaskListParams2Map(req *GetDownloadTaskListReq) map[string]any {
	rMap := map[string]any{}
	if req.Offset > 0 {
		rMap["offset"] = req.Offset
	} else {
		rMap["offset"] = 1
	}

	if req.Limit > 0 {
		rMap["limit"] = req.Limit
	} else {
		rMap["limit"] = 10
	}

	if len(req.Direction) > 0 {
		rMap["direction"] = req.Direction
	} else {
		rMap["direction"] = "desc"
	}

	if len(req.Sort) > 0 {
		rMap["sort"] = req.Sort
	} else {
		rMap["sort"] = "created_at"
	}

	if len(req.Keyword) > 0 {
		rMap["keyword"] = req.Keyword
	}

	if len(req.Status) > 0 {
		rMap["status"] = TaskStatus2Enum(req.Status)
	}
	return rMap
}

func GenTaskListResult(totalCount int64, tasks []*model.TDataDownloadTask) *PageResultNew[DownloadTaskEntry] {
	resp := new(PageResultNew[DownloadTaskEntry])
	resp.TotalCount = totalCount
	resp.Entries = make([]*DownloadTaskEntry, len(tasks))
	for i := range tasks {
		resp.Entries[i] = &DownloadTaskEntry{
			ID:         tasks[i].ID,
			FormViewID: tasks[i].FormViewID,
			Name:       tasks[i].Name,
			NameEN:     tasks[i].NameEN,
			Status:     TaskStatus2String(tasks[i].Status),
			CreatedAt:  tasks[i].CreatedAt.UnixMilli(),
			UpdatedAt:  tasks[i].UpdatedAt.UnixMilli(),
			Remark:     tasks[i].Remark,
		}
	}
	return resp
}

type RowFilters struct {
	Member []*Member `json:"member" form:"member" binding:"required,gte=1,dive"` // 限定对象
}

type FieldObjV1 struct {
	ID       string `json:"id" form:"id" binding:"omitempty,uuid" example:"0130dc92-2660-44dd-8de8-171d1ef125aa"` // 字段ID
	Name     string `json:"name" form:"name" binding:"omitempty,VerifyName255NoSpace"`                            // 字段名称
	NameEn   string `json:"name_en" form:"name_en" binding:"omitempty,VerifyName255NoSpace"`                      // 原字段名称
	DataType string `json:"data_type" form:"data_type" binding:"omitempty"`                                       // 字段类型
}

type Member struct {
	FieldObjV1        // 字段对象
	Operator   string `json:"operator" form:"field_id" binding:"required"` // 限定条件
	Value      string `json:"value" form:"value"`                          // 限定比较值
}

type TaskDetail struct {
	Fields      []*FieldObjV1 `json:"fields" binding:"required,min=1,unique=ID,dive"`                                  // 待下载字段列表
	RowFilters  *RowFilters   `json:"row_filters" binding:"omitempty,dive"`                                            // 待下载行过滤规则
	Direction   string        `json:"direction" form:"direction,default=desc" binding:"oneof=asc desc" default:"desc"` // 排序方向，枚举：asc：正序；desc：倒序。默认倒序
	SortFieldId string        `json:"sort_field_id" form:"sort_field_id" binding:"omitempty,uuid"`                     // 排序字段id
}

type TaskDetailV2 struct {
	Fields      []*FieldObjV1   `json:"fields" binding:"required,min=1,unique=ID,dive"`                                  // 待下载字段列表
	RowFilters  *RuleExpression `json:"row_filters" binding:"omitempty,dive"`                                            // 待下载行过滤规则
	Direction   string          `json:"direction" form:"direction,default=desc" binding:"oneof=asc desc" default:"desc"` // 排序方向，枚举：asc：正序；desc：倒序。默认倒序
	SortFieldId string          `json:"sort_field_id" form:"sort_field_id" binding:"omitempty,uuid"`                     // 排序字段id
}

//region GetRelatedFieldInfo

type GetRelatedFieldInfoReq struct {
	GetRelatedFieldInfoReqParam `param_type:"query"`
}

type GetRelatedFieldInfoReqParam struct {
	IsOperator bool   `json:"is_operator" form:"is_operator"  query:"is_operator"` //如果为true，表示该用户是数据运营角色或者数据开发角色，这时展示所有的视图数据
	IDs        string `json:"ids" form:"ids" query:"ids"`
}

type GetRelatedFieldInfoResp struct {
	Data []*SubjectFormViewInfo `json:"data"`
}

type SubjectFormViewInfo struct {
	FormViewID    string              `json:"form_view_id"`
	CatalogName   string              `json:"catalog_name"`
	Schema        string              `json:"schema"`
	BusinessName  string              `json:"business_name"`
	TechnicalName string              `json:"technical_name"`
	Fields        []*SubjectViewField `json:"fields"`
}

type SubjectViewField struct {
	ID            string       `json:"id"`
	BusinessName  string       `json:"business_name"`
	TechnicalName string       `json:"technical_name"`
	DataType      string       `json:"data_type"`
	Property      *SubjectProp `json:"property"`
	SubjectID     string       `json:"subject_id"`
	IsPrimary     bool         `json:"is_primary"`
}

type SubjectProp struct {
	ID       string `json:"id"`        //属性ID
	Name     string `json:"name"`      //属性的名称
	PathID   string `json:"path_id"`   //ID的路径
	PathName string `json:"path_name"` //属性的名称路径
}

//endregion

//region GetFieldExploreReportReq

type GetFieldExploreReportReq struct {
	GetFieldExploreReportReqParamPath `param_type:"query"`
}

type GetFieldExploreReportReqParamPath struct {
	FieldID string `json:"field_id" form:"field_id" binding:"required,uuid"` // 视图字段id
}

type FieldExploreReportResp struct {
	TotalCount int          `json:"total_count"` // 采样数据量
	Group      []*GroupInfo `json:"group"`       // 枚举值分布
	TimeRange  *TimeRange   `json:"time_range"`  // 时间范围信息
}
type GroupInfo struct {
	Value *string `json:"value"` // 枚举值
	Count int     `json:"count"` // 枚举值计数
}
type TimeRange struct {
	Max *string `json:"max"` // 最大值
	Min *string `json:"min"` // 最小值
}

type FieldReport struct {
	TotalSample int    `json:"total_sample"` // 探查样本总数
	Data        string `json:"data"`         // 探查结果
}

//endregion

type AttributeInfo struct {
	AttributeID string `json:"attributeID"`
	Name        string `json:"name"`
	PathName    string `json:"pathName"`
	LabelName   string `json:"labelName"`
	LabelId     string `json:"labelId"`
	LabelIcon   string `json:"labelIcon"`
	LabelPath   string `json:"labelPath"`
}

//region UndoAudit

type UndoAuditReq struct {
	UndoAuditParam `param_type:"body"`
}
type UndoAuditParam struct {
	LogicViewID    string `json:"logic_view_id"`                                                           //视图id
	OperateType    string `json:"operate_type" binding:"required,oneof=publish-audit up-audit down-audit"` //撤回审核的类型
	AuditAdvice    string `json:"-"`                                                                       //撤回审核的意见
	ScanChangeUndo bool   `json:"-"`                                                                       //是否变更撤回
}
type UndoAuditRes struct {
	LogicViewID string `json:"logic_view_id"` //视图id
}

//endregion

//region GetFilterRuleReq

type FormViewReqParamPath struct {
	ID string `uri:"id" binding:"required,uuid" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"` // 逻辑视图id
}
type GetFilterRuleReq struct {
	FormViewReqParamPath `param_type:"path"`
}

type GetFilterRuleResp struct {
	ID         string `json:"id"`          // 逻辑视图id
	FilterRule string `json:"filter_rule"` // 过滤规则
}

//endregion

//region UpdateFilterRuleReq

type UpdateFilterRuleReq struct {
	FormViewReqParamPath         `param_type:"path"`
	UpdateFilterRuleReqParamBody `param_type:"body"`
}

type UpdateFilterRuleReqParamBody struct {
	FilterRule string `json:"filter_rule" form:"filter_rule" binding:"TrimSpace,required"` // 过滤规则
}

type UpdateFilterRuleResp struct {
	ID string `json:"id"` // 逻辑视图id
}

//endregion

//region DeleteFilterRuleReq

type DeleteFilterRuleReq struct {
	FormViewReqParamPath `param_type:"path"`
}

type DeleteFilterRuleResp struct {
	ID string `json:"id"` // 逻辑视图id
}

//endregion

//region ExecFilterRuleReq

type ExecFilterRuleReq struct {
	FormViewReqParamPath       `param_type:"path"`
	ExecFilterRuleReqParamBody `param_type:"body"`
}

type ExecFilterRuleReqParamBody struct {
	FilterRule string `json:"filter_rule" form:"filter_rule" binding:"TrimSpace,required"` // 过滤规则
}

type ExecFilterRuleResp struct {
	Columns []*virtualization_engine.Column `json:"columns"`
	Data    [][]any                         `json:"data"`
	Count   int                             `json:"count"`
}

//endregion

//region CreateCompletionReq

type CreateCompletionReq struct {
	FormViewReqParamPath         `param_type:"path"`
	CreateCompletionReqParamBody `param_type:"body"`
}

type CreateCompletionReqParamBody struct {
	CompleteViewName        *bool    `json:"complete_view_name" form:"complete_view_name" binding:"required"`               // 是否补全视图名称
	CompleteViewDescription *bool    `json:"complete_view_description" form:"complete_view_description" binding:"required"` // 是否补全视图描述
	CompleteFieldName       *bool    `json:"complete_field_name" form:"complete_field_name" binding:"required"`             // 是否补全字段名称
	Ids                     []string `json:"ids" form:"ids" binding:"omitempty,unique,dive,uuid"`                           // 需要补全的字段id,uuid
}

type CreateCompletionResp struct {
	ID string `json:"id"` // 逻辑视图id
}

//endregion

//region GetCompletionReq

type GetCompletionReq struct {
	FormViewReqParamPath `param_type:"path"`
}

type GetCompletionResp struct {
	ID     string            `json:"id"`     // 逻辑视图id
	Result *CompletionResult `json:"result"` // 补全结果
}

//endregion

//region UpdateCompletionReq

type UpdateCompletionReq struct {
	FormViewReqParamPath         `param_type:"path"`
	UpdateCompletionReqParamBody `param_type:"body"`
}

type UpdateCompletionReqParamBody struct {
	Result *UpdateCompletionResult `json:"result" form:"result" binding:"omitempty"` // 补全结果
}

type UpdateCompletionResult struct {
	FormViewBusinessName *string                  `json:"form_view_business_name" form:"form_view_business_name" binding:"omitempty"` // 视图业务名称
	FormViewDescription  *string                  `json:"form_view_description" form:"form_view_description" binding:"omitempty"`     // 视图描述
	Fields               []*UpdateCompletionField `json:"fields" form:"fields" binding:"omitempty,dive"`                              // 字段补全信息
}

type UpdateCompletionField struct {
	FieldID           string `json:"field_id" form:"field_id" binding:"required"`                        // 字段id
	FieldBusinessName string `json:"field_business_name" form:"field_business_name" binding:"omitempty"` // 字段业务名称
}

type UpdateCompletionResp struct {
	ID string `json:"id"` // 逻辑视图id
}

//endregion

//region GetBusinessUpdateTime

type GetBusinessUpdateTimeReq struct {
	IDReqParamPath `param_type:"path"`
}

type GetBusinessUpdateTimeResp struct {
	FieldID            string `json:"field_id"`             // 业务更新字段id
	FieldBusinessName  string `json:"field_business_name"`  // 业务更新字业务名称
	BusinessUpdateTime string `json:"business_update_time"` // 业务更新时间
}

//endregion

type CompletionResp struct {
	Res Res `json:"res"`
}

type Res struct {
	TaskId      string `json:"task_id"` // 任务id
	Status      string `json:"status"`
	RequestType int    `json:"request_type"`
	Reason      string `json:"reason"`
	Result      Result `json:"result"`
}

type Result struct {
	ID            string   `json:"id"`
	AssistantName string   `json:"assistant_name"`
	AssistantDesc string   `json:"assistant_desc"`
	Columns       []Column `json:"columns"`
}

type Column struct {
	ID              string `json:"id"`
	AssistantNameCn string `json:"assistant_name_cn"`
}

type CompletionResult struct {
	FormViewID           string   `json:"form_view_id" form:"form_view_id" binding:"required"`                                  // 视图id
	FormViewBusinessName *string  `json:"form_view_business_name,omitempty" form:"form_view_business_name" binding:"omitempty"` // 视图业务名称
	FormViewDescription  *string  `json:"form_view_description,omitempty" form:"form_view_description" binding:"omitempty"`     // 视图描述
	Fields               []*Field `json:"fields" form:"fields" binding:"omitempty"`                                             // 字段补全信息
}

type Field struct {
	FieldID           string `json:"field_id" form:"field_id" binding:"TrimSpace,required"`                        // 字段id
	FieldBusinessName string `json:"field_business_name" form:"field_business_name" binding:"TrimSpace,omitempty"` // 字段业务名称
}

type CompletionStatus enum.Object

var (
	CompletionStatusRunning  = enum.New[CompletionStatus](1, "running")  // 进行中
	CompletionStatusFinished = enum.New[CompletionStatus](2, "finished") // 已完成
	CompletionStatusFailed   = enum.New[CompletionStatus](3, "failed")   // 异常
)

type ResourceObject struct {
	FormViewID     string `json:"form_view_id"`            // 视图UUID
	TechnicalName  string `json:"technical_name"`          // 技术名称
	BusinessName   string `json:"business_name"`           // 业务名称
	DownloadTaskID uint64 `json:"download_task_id,string"` // 下载任务ID
}

func (ro *ResourceObject) GetName() string {
	return ro.BusinessName
}

// GetDetail implements v1.ResourceObject.
func (ro *ResourceObject) GetDetail() json.RawMessage { return lo.Must(json.Marshal(ro)) }

var _ audit_v1.ResourceObject = &ResourceObject{}

//region ConvertRulesVerify

type DataTypeMappingResp struct {
	OriginalData FieldInfoWithData `json:"original_data"`
	ConvertData  FieldInfoWithData `json:"convert_data"`
}

//endregion

//region ConvertRulesVerify

type ConvertRulesVerifyReq struct {
	ConvertRulesVerifyBody `param_type:"body"`
}
type ConvertRulesVerifyBody struct {
	FieldID       string `json:"field_id" binding:"required,uuid"`           // 字段id
	ResetDataType string `json:"reset_data_type" binding:"required,max=255"` // 重置数据类型
	ConvertRules  string `json:"convert_rules"  binding:"omitempty,max=255"` // 转换规则 （仅日期类型）
	DataLength    int32  `json:"data_length" `                               // 数据长度（仅DECIMAL类型）
	DataAccuracy  *int32 `json:"data_accuracy"`                              // 数据精度（仅DECIMAL类型）
}

type ConvertRulesVerifyResp struct {
	OriginalData FieldInfoWithData `json:"original_data"`
	ConvertData  FieldInfoWithData `json:"convert_data"`
}
type FieldInfoWithData struct {
	Data          []any  `json:"data"`
	DataType      string `json:"data_type"`      // 数据类型
	TechnicalName string `json:"technical_name"` // 列技术名称
	BusinessName  string `json:"business_name"`  // 列业务名称
}

//endregion

//region DataTypeMapping

type DataTypeMapping struct {
	Mapping map[string]string `json:"mapping"`
}

//endregion

//region ExcelView

type ExcelView struct {
	//数据范围
	Sheet            string `json:"sheet"  binding:"required"`     // sheet页,逗号分隔
	StartCell        string `json:"start_cell" binding:"required"` // 起始单元格
	EndCell          string `json:"end_cell" binding:"required"`   // 结束单元格
	HasHeaders       bool   `json:"has_headers"`                   // 是否首行作为列名
	SheetAsNewColumn bool   `json:"sheet_as_new_column"`           // 是否将sheet作为新列

	ExcelFields []*ExcelField `json:"fields" binding:"required,dive,gte=1"` // excel字段

	//基本信息
	TechnicalName string   `json:"technical_name" binding:"required,min=1,max=255" `                                                           // 视图技术名称
	BusinessName  string   `json:"business_name" binding:"required,min=1,max=100" `                                                            // 视图业务名称
	Description   string   `json:"description"  binding:"TrimSpace,omitempty,lte=300" example:"description"`                                   // 描述
	SubjectID     string   `json:"subject_id" form:"subject_id" binding:"omitempty,uuid" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"`       // 主题域id (逻辑实体视图不支持)
	DepartmentID  string   `json:"department_id" form:"department_id" binding:"omitempty,uuid" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"` // 部门id
	OwnerID       []string `json:"owners" form:"owners" binding:"omitempty,dive,uuid" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"`          // 数据Owner id
}
type ExcelField struct {
	ID            string `json:"id" binding:"omitempty,uuid"`                                    // 列id
	BusinessName  string `json:"business_name" binding:"required,min=1,max=255" example:"xxxx"`  // 列业务名称
	TechnicalName string `json:"technical_name" binding:"required,min=1,max=100" example:"xxxx"` // 列技术名称
	DataType      string `json:"data_type" binding:"required,DataTypeChar"`                      // 数据类型

	AttributeID  string `json:"attribute_id" binding:"omitempty,uuid"`        // L5属性ID
	ClassifyType int    `json:"classfity_type" binding:"omitempty,oneof=1 2"` // 属性分类

	StandardCode     string `json:"standard_code"`                               // 关联数据标准code
	CodeTableID      string `json:"code_table_id"`                               // 关联码表IDe
	ClearAttributeID string `json:"clear_attribute_id" binding:"omitempty,uuid"` //清除属性ID
}

//endregion

//region CreateExcelView

type CreateExcelViewReq struct {
	CreateExcelViewBody `param_type:"body"`
}
type CreateExcelViewBody struct {
	DatasourceId  string `json:"datasource_id" binding:"required,uuid"`
	ExcelFileName string `json:"excel_file_name"` // excel文件名
	ExcelView
}

//endregion

//region UpdateExcelView

type UpdateExcelViewReq struct {
	UpdateExcelViewBody `param_type:"body"`
}
type UpdateExcelViewBody struct {
	ViewID              string `json:"view_id" binding:"required,uuid"`
	BusinessTimestampID string `json:"business_timestamp_id" binding:"omitempty,uuid" example:"99f78432-ee4e-43df-804c-4ccc4ff17f15"` // 业务时间字段id
	ExcelView
}

//endregion

type StandardInfo struct {
	StandardCode string `json:"standard_code"` // 关联数据标准code
	CodeTableID  string `json:"code_table_id"` // 关联码表IDe
}

//region DataPreview

type DataPreviewReq struct {
	DataPreviewReqParamBody `param_type:"body"`
}

type DataPreviewReqParamBody struct {
	FormViewId  string    `json:"form_view_id" form:"form_view_id" binding:"required,uuid" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"` // 逻辑视图id
	Fields      []string  `json:"fields" form:"fields" binding:"required,dive,uuid"`                                                       // 输出字段
	Direction   string    `json:"direction" form:"direction,default=desc" binding:"omitempty,oneof=asc desc" default:"desc"`               // 排序方向，枚举：asc：正序；desc：倒序。默认倒序
	SortFieldId string    `json:"sort_field_id" form:"sort_field_id" binding:"omitempty,uuid"`                                             // 排序字段id
	Filters     []*Member `json:"filters" form:"filters" binding:"omitempty,dive"`                                                         // 过滤规则
	Offset      *int      `json:"offset" form:"offset,default=1" binding:"omitempty,min=1" default:"1"`                                    // 页码，默认1
	Limit       *int      `json:"limit" form:"limit,default=10" binding:"omitempty,min=1,max=1000" default:"10"`                           // 每页大小，默认10
	Configs     string    `json:"configs" form:"configs" binding:"omitempty" default:""`                                                   // 筛选配置项
	IfCount     int       `json:"if_count" form:"if_count" binding:"omitempty" default:"0"`
}

type DataPreviewResp struct {
	virtualization_engine.FetchDataRes
}

//endregion

//region DesensitizeFieldDataPreview

type DesensitizationFieldDataPreviewReq struct {
	DesensitizationFieldDataPreviewReqParamBody `param_type:"body"`
}

type DesensitizationFieldDataPreviewReqParamBody struct {
	FormViewFieldId       string    `json:"form_view_field_id" form:"form_view_field_id" binding:"required,uuid" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"`           // 逻辑视图id
	DesensitizationRuleId string    `json:"desensitization_rule_id" form:"desensitization_rule_id" binding:"required,uuid" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"` // 脱敏规则id
	Direction             string    `json:"direction" form:"direction,default=desc" binding:"omitempty,oneof=asc desc" default:"desc"`                                     // 排序方向，枚举：asc：正序；desc：倒序。默认倒序
	SortFieldId           string    `json:"sort_field_id" form:"sort_field_id" binding:"omitempty,uuid"`                                                                   // 排序字段id
	Filters               []*Member `json:"filters" form:"filters" binding:"omitempty,dive"`                                                                               // 过滤规则
	Offset                *int      `json:"offset" form:"offset,default=1" binding:"omitempty,min=1" default:"1"`                                                          // 页码，默认1
	Limit                 *int      `json:"limit" form:"limit,default=10" binding:"omitempty,min=1,max=1000" default:"10"`                                                 // 每页大小，默认10
	Configs               string    `json:"configs" form:"configs" binding:"omitempty" default:""`                                                                         // 筛选配置项
	IfCount               int       `json:"if_count" form:"if_count" binding:"omitempty" default:"0"`
}

type DesensitizationFieldDataPreviewResp struct {
	virtualization_engine.FetchDataRes // 脱敏后的数据
}

//endregion

//region DataPreviewConfig

type DataPreviewConfigReq struct {
	DataPreviewConfigReqParamBody `param_type:"body"`
}

type DataPreviewConfigReqParamBody struct {
	FormViewId string `json:"form_view_id" form:"form_view_id" binding:"required,uuid" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"` // 逻辑视图id
	Config     string `json:"config" form:"config" binding:"omitempty"`                                                                // 逻辑视图数据预览配置
}

type DataPreviewConfigResp struct {
	FormViewId string `json:"form_view_id"` // 逻辑视图id
}

//endregion

//region GetDataPreviewConfig

type GetDataPreviewConfigReq struct {
	GetDataPreviewConfigReqParam `param_type:"query"`
}

type GetDataPreviewConfigReqParam struct {
	FormViewId string `json:"form_view_id" form:"form_view_id" binding:"required,uuid" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"` // 逻辑视图id
}

type GetDataPreviewConfigResp struct {
	Config string `json:"config"` // 逻辑视图数据预览配置
}

//endregion

// [删除/发布/上线/下线逻辑视图审计日志消息结构]
type LogicViewSimpleResourceObject struct {
	Name       string `json:"-"`            // 名称
	FormViewID string `json:"form_view_id"` // 视图UUID
}

func (ro *LogicViewSimpleResourceObject) GetName() string {
	return ro.Name
}

func (ro *LogicViewSimpleResourceObject) GetDetail() json.RawMessage {
	return lo.Must(json.Marshal(ro))
} // [/]

// [新建/修改逻辑视图审计日志消息结构]
type LogicViewResourceObject struct {
	FormViewID     string `json:"form_view_id"`    // 视图UUID
	TechnicalName  string `json:"technical_name"`  // 技术名称
	BusinessName   string `json:"business_name"`   // 业务名称
	SubjectID      string `json:"subject_id"`      // 所属主题ID
	SubjectPath    string `json:"subject_path"`    // 所属主题路径
	DepartmentID   string `json:"department_id"`   // 所属部门ID
	DepartmentPath string `json:"department_path"` // 所属部门路径
	OwnerID        string `json:"owner_id"`        // 数据OwnerID
	OwnerName      string `json:"owner_name"`      // 数据Owner名称
}

func (ro *LogicViewResourceObject) GetName() string {
	return ro.BusinessName
}

func (ro *LogicViewResourceObject) GetDetail() json.RawMessage {
	return lo.Must(json.Marshal(ro))
} // [/]

// [扫描数据源审计日志消息结构]
type DataSourceSimpleResourceObject struct {
	Name         string `json:"-"`              // 名称
	DataSourceID string `json:"data_source_id"` // 数据源ID
}

func (ro *DataSourceSimpleResourceObject) GetName() string {
	return ro.Name
}

func (ro *DataSourceSimpleResourceObject) GetDetail() json.RawMessage {
	return lo.Must(json.Marshal(ro))
} // [/]

type GetWhiteListPolicyListReq struct {
	GetWhiteListPolicyListReqParamPath `param_type:"query"`
}

type GetWhiteListPolicyListReqParamPath struct {
	SubjectID    string `json:"subject_id"  form:"subject_id"  binding:"omitempty" example:"mariadb"` // 数据源类型
	DepartmentID string `json:"department_id" form:"department_id" binding:"omitempty" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"`
	DatasourceID string `json:"datasource_id" form:"datasource_id" binding:"omitempty" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"`
	//Status       int    `json:"status" form:"status" binding:"omitempty" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"`
	Offset    *int   `json:"offset" form:"offset,default=1" binding:"min=1" default:"1"`           // 页码，默认1
	Limit     *int   `json:"limit" form:"limit,default=10" binding:"min=1,max=2000"  default:"10"` // 每页大小，默认10
	Direction string `json:"direction" form:"direction" binding:"omitempty" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"`
	Sort      string `json:"sort" form:"sort" binding:"omitempty" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"`
	Keyword   string `json:"keyword" form:"keyword" binding:"omitempty" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"`
}

type GetWhiteListPolicyListRes struct {
	WhiteListPolicy []*WhiteListPolicy `json:"entries"`
	TotalCount      int64              `json:"total_count" binding:"required,gte=0" example:"3"`
}

type WhiteListPolicy struct {
	//WhiteListPolicyID  uint64 `json:"white_list_policy_id"` // 白名单策略雪花id
	ID                 string `json:"id"`              // 数据源业务id
	FormViewID         string `json:"form_view_id"`    // 信息系统id
	FormViewName       string `json:"form_view_name"`  // 信息系统id
	FormViewCode       string `json:"form_view_code"`  // 信息系统id
	Description        string `json:"description"`     // 数据源名称
	FormViewSubject    string `json:"subject_name"`    // 信息系统id
	FormViewDepartment string `json:"department_name"` // 信息系统id
	CreatedAt          int64  `json:"created_at"`      // 创建时间
	UpdatedAt          int64  `json:"updated_at"`      // 更新时间
	//Status             string `json:"status"`               // 更新时间
}

type GetWhiteListPolicyDetailsReq struct {
	IDReqParamPath                        `param_type:"path"`
	GetWhiteListPolicyDetailsReqParamPath `param_type:"query"`
}

type GetWhiteListPolicyDetailsReqParamPath struct{}

type GetWhiteListPolicyDetailsRes struct {
	//WhiteListPolicyID  uint64 `json:"white_list_policy_id"` // 白名单策略雪花id
	ID                 string `json:"id"`             // 数据源业务id
	FormViewID         string `json:"form_view_id"`   // 信息系统id
	FormViewName       string `json:"form_view_name"` // 信息系统id
	FormViewCode       string `json:"form_view_code"`
	Description        string `json:"description"`     // 数据源名称
	FormViewSubject    string `json:"subject_name"`    // 信息系统id
	FormViewDepartment string `json:"department_name"` // 信息系统id
	FormViewDatasource string `json:"datasource_name"`
	CreatedAt          int64  `json:"created_at"`      // 创建时间
	CreatedByName      string `json:"created_by_name"` // 创建人姓名
	UpdatedAt          int64  `json:"updated_at"`      // 更新时间
	UpdatedByName      string `json:"updated_by_name"` // 创建人姓名
	Configs            string `json:"configs"`
}

type CreateWhiteListPolicyReq struct {
	CreateWhiteListPolicyBody `param_type:"body"`
}

type CreateWhiteListPolicyBody struct {
	FormViewID  string `json:"form_view_id" binding:"required,uuid"`
	Description string `json:"description"` // 数据源名称
	Configs     string `json:"configs"`
}

type PolicyConfig struct {
	PolicyType    string             `json:"policy_type" binding:"required"`
	SQLCondition  string             `json:"sql_condition" binding:"omitempty"`
	RuleCondition *RuleConditionTree `json:"rule_condition" binding:"omitempty"`
}

type RuleConditionTree struct {
	FieldId      string               `json:"field_id" binding:"omitempty"`
	FieldName    string               `json:"field_name" binding:"omitempty"`
	Type         string               `json:"type" binding:"required"`
	TypeValue    string               `json:"type_value" binding:"required"`
	Operate      string               `json:"operate" `
	OperateValue string               `json:"operate_value" `
	Rules        []*RuleConditionTree `json:"rules" binding:"required"`
}

type CreateWhiteListPolicyRes struct {
	ID     string `json:"id"`     // 数据源业务id
	Status string `json:"status"` // 更新时间
}

type UpdateWhiteListPolicyReq struct {
	IDReqParamPath            `param_type:"path"`
	UpdateWhiteListPolicyBody `param_type:"body"`
}

type UpdateWhiteListPolicyBody struct {
	Description string `json:"description"` // 数据源名称
	Configs     string `json:"configs"`
}

type UpdateWhiteListPolicyRes struct {
	Status string `json:"status"` // 更新时间
}

type DeleteWhiteListPolicyReq struct {
	IDReqParamPath `param_type:"path"`
	//DeleteWhiteListPolicyBody `param_type:"body"`
}

//type DeleteWhiteListPolicyBody struct {
//}

type DeleteWhiteListPolicyRes struct {
	Status string `json:"status"` // 更新时间
}

type RuleConfig struct {
	Null           []string        `json:"null" form:"null" binding:"omitempty,dive"`
	Dict           *Dict           `json:"dict" form:"dict" binding:"omitempty"`
	Format         *Format         `json:"format" form:"format" binding:"omitempty"`
	RuleExpression *RuleExpression `json:"rule_expression" form:"rule_expression" binding:"omitempty"`
	Filter         *RuleExpression `json:"filter" form:"filter" binding:"omitempty"`
	RowNull        *RowNull        `json:"row_null" form:"row_null" binding:"omitempty"`
	RowRepeat      *RowRepeat      `json:"row_repeat" form:"row_repeat" binding:"omitempty"`
	UpdatePeriod   *string         `json:"update_period" form:"update_period" binding:"omitempty,oneof=day week month quarter half_a_year year"`
}

type Dict struct {
	DictId   string `json:"dict_id" form:"dict_id" binding:"omitempty"`
	DictName string `json:"dict_name" form:"dict_name" binding:"required"`
	Data     []Data `json:"data" form:"data" binding:"required,dive"`
}

type Data struct {
	Code  string `json:"code" form:"code" binding:"required"`
	Value string `json:"value" form:"value" binding:"required"`
}

type RowNull struct {
	FieldIds []string `json:"field_ids" form:"field_ids" binding:"required,dive,uuid,unique"`
	Config   []string `json:"config" form:"config" binding:"required,dive"`
}

type RowRepeat struct {
	FieldIds []string `json:"field_ids" form:"field_ids" binding:"required,dive,uuid,unique"`
}

type Format struct {
	CodeRuleId string `json:"code_rule_id" form:"code_rule_id" binding:"omitempty"`
	Regex      string `json:"regex" form:"regex" binding:"required"`
}

type RuleExpression struct {
	WhereRelation string   `json:"where_relation" form:"where_relation" binding:"omitempty"`
	Where         []*Where `json:"where" form:"where" binding:"omitempty,dive"`
	Sql           string   `json:"sql" form:"sql" binding:"omitempty"`
}

type Where struct {
	Member   []*Member `json:"member" form:"member" binding:"omitempty,dive"` // 限定对象
	Relation string    `json:"relation" form:"relation" binding:"omitempty"`  // 限定关系
}

type ExecuteWhiteListPolicyReq struct {
	ExecuteWhiteListPolicyBody `param_type:"body"`
}

type ExecuteWhiteListPolicyBody struct {
	FormViewID string `json:"form_view_id" binding:"required,uuid"`
	Configs    string `json:"configs"`
	Mode       string `json:"mode"`
}

type ExecuteWhiteListPolicyRes struct {
	virtualization_engine.FetchDataRes
}

type GetWhiteListPolicyWhereSqlReq struct {
	IDReqParamPath `param_type:"path"`
}

type GetWhiteListPolicyWhereSqlRes struct {
	SQL string `json:"sql"`
}

type GetDesensitizationFieldInfosReq struct {
	IDReqParamPath `param_type:"path"`
}

type FieldItemInfo struct {
	FieldId                       string `json:"field_id"`
	FieldName                     string `json:"field_name"`
	FieldDesensitizationName      string `json:"field_desensitization_name"`
	FieldDesensitizationMethod    string `json:"field_desensitization_method"`
	FieldDesensitizationAlgorithm string `json:"field_desensitization_algorithm"`
	FieldDesensitizationMiddleBit int32  `json:"field_desensitization_middle_bit"`
	FieldDesensitizationHeadBit   int32  `json:"field_desensitization_head_bit"`
	FieldDesensitizationTailBit   int32  `json:"field_desensitization_tail_bit"`
}

type GetDesensitizationFieldInfosRes struct {
	FieldList []FieldItemInfo `json:"field_list"`
}

type GetFormViewRelateWhiteListPolicyReq struct {
	GetFormViewRelateWhiteListPolicyBody `param_type:"body"`
}

type GetFormViewRelateWhiteListPolicyBody struct {
	FormViewIds []string `json:"form_view_ids" form:"form_view_ids" binding:"omitempty,unique,dive,uuid"` // 更新时间
}

type GetFormViewRelateWhiteListPolicyRes struct {
	Entities []FormViewRelateWhiteListPolicy `json:"entries"`
}

type FormViewRelateWhiteListPolicy struct {
	FormViewId        string `json:"form_view_id"`         // 更新时间
	WhiteListPolicyId string `json:"white_list_policy_id"` // 更新时间
}

type GetDesensitizationRuleListReq struct {
	GetDesensitizationRuleListReqParamPath `param_type:"query"`
}

type GetDesensitizationRuleListReqParamPath struct {
	Offset    *int   `json:"offset" form:"offset,default=1" binding:"min=1" default:"1"`           // 页码，默认1
	Limit     *int   `json:"limit" form:"limit,default=10" binding:"min=1,max=2000"  default:"10"` // 每页大小，默认10
	Direction string `json:"direction" form:"direction" binding:"omitempty" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"`
	Sort      string `json:"sort" form:"sort" binding:"omitempty" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"`
	Keyword   string `json:"keyword" form:"keyword" binding:"omitempty" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"`
}

type GetDesensitizationRuleListRes struct {
	Entities   []*DesensitizationRule `json:"entries"`
	TotalCount int64                  `json:"total_count" binding:"required,gte=0" example:"3"`
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
	//Status             string `json:"status"`               // 更新时间
}

//endregion

type GetDesensitizationRuleDetailsReq struct {
	IDReqParamPath                            `param_type:"path"`
	GetDesensitizationRuleDetailsReqParamPath `param_type:"query"`
}

type GetDesensitizationRuleDetailsReqParamPath struct{}

type GetDesensitizationRuleDetailsRes struct {
	//WhiteListPolicyID  uint64 `json:"white_list_policy_id"` // 白名单策略雪花id
	ID            string `json:"id"`          // 数据源业务id
	Name          string `json:"name"`        // 数据源业务id
	Description   string `json:"description"` // 数据源业务id
	Type          string `json:"type"`
	InnerType     string `json:"inner_type"`
	Algorithm     string `json:"algorithm"` // 数据源业务id
	Method        string `json:"method"`    // 数据源业务id
	MiddleBit     int32  `json:"middle_bit"`
	HeadBit       int32  `json:"head_bit"`
	TailBit       int32  `json:"tail_bit"`
	CreatedAt     int64  `json:"created_at"`      // 创建时间
	CreatedByName string `json:"created_by_name"` // 创建人姓名
	UpdatedAt     int64  `json:"updated_at"`      // 更新时间
	UpdatedByName string `json:"updated_by_name"` // 创建人姓名
}

type CreateDesensitizationRuleReq struct {
	CreateDesensitizationRuleBody `param_type:"body"`
}

type CreateDesensitizationRuleBody struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"` // 描述信息
	Type        string `json:"type"`        // 算法类型，内置、自定义
	InnerType   string `json:"inner_type"`  // 内置算法类型，身份证
	Algorithm   string `json:"algorithm"`   // 算法内容
	Method      string `json:"method"`      // 脱敏算法类型
	MiddleBit   int32  `json:"middle_bit"`
	HeadBit     int32  `json:"head_bit"`
	TailBit     int32  `json:"tail_bit"`
}

type CreateDesensitizationRuleRes struct {
	Status string `json:"status"` // 状态
}

type UpdateDesensitizationRuleReq struct {
	IDReqParamPath                `param_type:"path"`
	UpdateDesensitizationRuleBody `param_type:"body"`
}

type UpdateDesensitizationRuleBody struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"` // 描述信息
	Type        string `json:"type"`        // 算法类型，内置、自定义
	InnerType   string `json:"inner_type"`  // 内置算法类型，身份证
	Algorithm   string `json:"algorithm"`   // 算法内容
	Method      string `json:"method"`      // 脱敏算法类型
	MiddleBit   int32  `json:"middle_bit"`
	HeadBit     int32  `json:"head_bit"`
	TailBit     int32  `json:"tail_bit"`
}

type UpdateDesensitizationRuleRes struct {
	Status string `json:"status"` // 更新时间
}

type DeleteDesensitizationRuleReq struct {
	IDReqParamPath                `param_type:"path"`
	DeleteDesensitizationRuleBody `param_type:"body"`
}

type DeleteDesensitizationRuleBody struct {
	Mode string `json:"mode"` // 模式
}

type DeleteDesensitizationRuleRes struct {
	Status string `json:"status"` // 更新时间
}

type ExecuteDesensitizationRuleReq struct {
	//IDReqParamPath                 `param_type:"path"`
	ExecuteDesensitizationRuleBody `param_type:"body"`
}

type ExecuteDesensitizationRuleBody struct {
	Algorithm string `json:"algorithm"` // 算法内容
	Method    string `json:"method"`    // 脱敏算法类型
	MiddleBit int32  `json:"middle_bit"`
	HeadBit   int32  `json:"head_bit"`
	TailBit   int32  `json:"tail_bit"`
	Text      string `json:"text"`
}

type ExecuteDesensitizationRuleRes struct {
	DesensitizationText string `json:"desensitization_text"` // 更新时间
}

type ExportDesensitizationRuleReq struct {
	ExportDesensitizationRuleBody `param_type:"body"`
}

type ExportDesensitizationRuleBody struct {
	IDs []string `json:"ids" form:"ids" binding:"omitempty,unique,dive,uuid"` // 导出规则id
}

type ExportDesensitizationRuleRes struct {
	Entities []ExportSubEntity `json:"entities"`
}
type ExportSubEntity struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"` // 描述信息
	Algorithm   string `json:"algorithm"`   // 算法内容
	Method      string `json:"method"`      // 脱敏算法类型
}

type GetDesensitizationRuleRelatePolicyReq struct {
	GetDesensitizationRuleRelatePolicyBody `param_type:"body"`
}

type GetDesensitizationRuleRelatePolicyBody struct {
	IDs []string `json:"ids"` // 导出规则id
}

type GetDesensitizationRuleRelatePolicyRes struct {
	Entries []DesensitizationRuleRelatePolicy `json:"entries"`
}

type DesensitizationRuleRelatePolicy struct {
	ID               string                `json:"id"`
	Name             string                `json:"name"`
	Description      string                `json:"description"`
	RelatePolicyList []RelatePrivicyPolicy `json:"relate_policy_list"` // 描述信息
}

type RelatePrivicyPolicy struct {
	PolicyId           string `json:"policy_id"`
	PolicyFormViewId   string `json:"policy_form_view_id"`
	PolicyFormViewName string `json:"policy_form_view_name"`
}

type GetDesensitizationRuleInternalAlgorithmReq struct {
	//GetDesensitizationRuleInternalAlgorithmBody `param_type:"body"`
}

//type GetDesensitizationRuleInternalAlgorithmBody struct {
//}

type GetDesensitizationRuleInternalAlgorithmRes struct {
	Entities []DesensitizationRuleInternalAlgorithm `json:"entities"`
}
type DesensitizationRuleInternalAlgorithm struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	InnerType string `json:"inner_type"`
	Algorithm string `json:"algorithm"`
}

//region  GetViewBasicInfoByName

type GetViewBasicInfoByNameReqParam struct {
	GetViewBasicInfoByNameReq `param_type:"query"`
}

type GetViewBasicInfoByNameReq struct {
	Name         string `json:"name" form:"name" binding:"required"`
	DatasourceID string `json:"datasource_id"   form:"datasource_id" binding:"required"`
}

type GetViewCountReqParam struct {
	GetTableCountReq `param_type:"query"`
}

type GetTableCountReq struct {
	Id string `json:"department_id" form:"department_id" binding:"required"`
}

//endregion

// region  GetViewListByTechnicalNameInMultiDatasource

type GetViewListByTechnicalNameInMultiDatasourceReq struct {
	data_view.GetViewListByTechnicalNameInMultiDatasourceReq `param_type:"body"`
}

//endregion

//region GetByAuditStatus

type GetByAuditStatusReq struct {
	GetByAuditStatusReqQueryParam `param_type:"query"`
}

type GetByAuditStatusReqQueryParam struct {
	request.KeywordInfo
	Offset         *int     `json:"offset" form:"offset" binding:"omitempty"`
	Limit          *int     `json:"limit" form:"limit" binding:"omitempty"`
	DatasourceType string   `json:"datasource_type" form:"datasource_type" binding:"omitempty"` // 数据源类型
	DatasourceIds  []string `json:"-" `
	DatasourceId   string   `json:"datasource_id" form:"datasource_id" binding:"omitempty,uuid"`                        // 数据源id
	PublishStatus  string   `json:"publish_status" form:"publish_status" binding:"omitempty,oneof=publish unpublished"` // 发布状态
	IsAudited      *bool    `json:"is_audited"  form:"is_audited" binding:"omitempty"`                                  // 是否已稽核
}

type GetByAuditStatusResp struct {
	PageResultNew[FormViewInfo]
}

type FormViewInfo struct {
	ID                 string `json:"id"`                   // 逻辑视图uuid
	UniformCatalogCode string `json:"uniform_catalog_code"` // 逻辑视图编码
	TechnicalName      string `json:"technical_name"`       // 表技术名称
	BusinessName       string `json:"business_name"`        // 表业务名称
	DepartmentID       string `json:"department_id"`        // 所属部门id
	DepartmentPath     string `json:"department_path"`      // 所属部门路径
}

//endregion

type ExploreDataFinishedMsg struct {
	TableId     string `json:"table_id"`     // 视图id
	TaskId      string `json:"task_id"`      // 任务id
	TaskVersion *int32 `json:"task_version"` // 任务版本
	FinishedAt  int64  `json:"finished_at"`  // 结束时间
}

//region GetBasicViewList

type GetBasicViewListReqParam struct {
	GetBasicViewListReq `param_type:"query"`
}

type GetBasicViewListReq struct {
	IDs []string `json:"ids" form:"ids" binding:"required"` // 视图id
}

type GetBasicViewListResp struct {
	Entries []*ViewInfo `json:"entries" binding:"omitempty"` // 逻辑视图列表
}

type ViewInfo struct {
	ID                    string `json:"id"`                       // ID
	UniformCatalogCode    string `json:"uniform_catalog_code"`     // 逻辑视图编码
	TechnicalName         string `json:"technical_name"`           // 表技术名称
	BusinessName          string `json:"business_name"`            // 表业务名称
	Type                  string `json:"type"`                     // 视图类型
	DatasourceName        string `json:"datasource_name"`          // 数据源名称
	Description           string `json:"description"`              // 描述
	DepartmentID          string `json:"department_id"`            // 所属部门id
	Department            string `json:"department"`               // 所属部门
	DepartmentPath        string `json:"department_path"`          // 所属部门路径
	IsAuditRuleConfigured bool   `json:"is_audit_rule_configured"` // 是否已配置稽核规则
	Status                string `json:"status"`                   // 逻辑视图状态\扫描结果
}

//endregion

//region IsAllowClearGrade

type IsAllowClearGradeReq struct {
	IsAllowClearGradeReqBody `param_type:"body"`
}

type IsAllowClearGradeReqBody struct {
	FormViewFieldID string `json:"form_view_field_id" form:"form_view_field_id" binding:"required,uuid"` // 视图字段id
}

type IsAllowClearGradeResp struct {
	IsAllow bool `json:"is_allow"` // 是否允许清除分级标签
}

//endregion

// region QueryStreamStart
type QueryStreamStartReq struct {
	QueryStreamStartReqBody `param_type:"body"`
}

type QueryStreamStartReqBody struct {
	Sql string `json:"sql" form:"sql" binding:"required"` //查询sql
}

// ColumnMeta 定义了列元数据
type ColumnMeta struct {
	Name string `json:"name"` // 字段名称
	Type string `json:"type"` // 字段类型
}

// QueryStreamStartResp 按图片生成的响应结构
type QueryStreamStartResp struct {
	TotalCount int64        `json:"total_count"` // 总条目
	Columns    []ColumnMeta `json:"columns"`     // 字段元数据数组
	Data       [][]any      `json:"data"`        // 数据集（二维表）
	NextURI    string       `json:"nextUri"`     // 下一次查询 URI，如 "queryId/slug/token"
	FirstCount int64        `json:"first_count"` // 第一次查询条目
}

//endregion

//region QueryStreamNext

type QueryStreamNextReq struct {
	QueryStreamNextReqBody `param_type:"body"`
}

type QueryStreamNextReqBody struct {
	NextURI string `json:"nextUri" form:"nextUri" binding:"required"` // 下一次查询 URI，如 "queryId/slug/token"
}

type QueryStreamNextResp struct {
	TotalCount int64        `json:"total_count"` // 总条目
	Columns    []ColumnMeta `json:"columns"`     // 字段元数据数组
	Data       [][]any      `json:"data"`        // 数据集（二维表）
	NextURI    string       `json:"nextUri"`     // 下一次查询 URI，如 "queryId/slug/token"
}

//endregion

// GetViewByTechnicalNameAndHuaAoIdReq 通过技术名称和华奥ID查询视图请求
type GetViewByTechnicalNameAndHuaAoIdReqParam struct {
	GetViewByTechnicalNameAndHuaAoIdReq `param_type:"query"`
}

type GetViewByTechnicalNameAndHuaAoIdReq struct {
	TechnicalName string `json:"technical_name" form:"technical_name" binding:"required" example:"user_table"` // 视图技术名称
	HuaAoID       string `json:"hua_ao_id" form:"hua_ao_id" binding:"required" example:"hua_ao_123456"`        // 华奥ID
}

// 响应可以复用现有的 GetViewFieldsResp

//region  query

type GetViewByKey struct {
	GetViewByKeyBody `param_type:"path"`
}

type GetViewByKeyBody struct {
	Key string `json:"key" uri:"key" binding:"required"`
}

type FormViewSimpleInfo struct {
	ID            string `json:"id"`             // 逻辑视图uuid
	TechnicalName string `json:"technical_name"` // 表技术名称
	BusinessName  string `json:"business_name"`  // 表业务名称
	OwnerID       string `json:"owner_id"`       // 数据Owner id
}

//endregion

//region BatchGetExploreReport

type BatchGetExploreReportReq struct {
	BatchGetExploreReportBody `param_type:"body"`
}

type BatchGetExploreReportBody struct {
	IDs              []string `json:"ids" binding:"required,min=1,dive,uuid"` // 逻辑视图ID列表（至少1个，支持单个ID）
	Version          *int32   `json:"version" binding:"omitempty"`            // 报告版本（可选，不传默认nil，获取最新版本）
	ThirdParty       bool     `json:"third_party" binding:"omitempty"`        // 第三方报告（可选，不传默认false）
	HasQualityReport bool     `json:"has_quality_report" binding:"omitempty"` // 是否有质量报告标识（可选，不传默认false）
}

type BatchGetExploreReportResp struct {
	Reports []*BatchExploreReportItem `json:"reports"` // 报告列表
}

type BatchExploreReportItem struct {
	FormViewID       string             `json:"form_view_id"`       // 逻辑视图ID
	Success          bool               `json:"success"`            // 是否成功获取报告
	HasQualityReport bool               `json:"has_quality_report"` // 是否存在质量报告（可用性标识）
	Error            string             `json:"error,omitempty"`    // 错误信息（如果失败）
	Report           *ExploreReportResp `json:"report,omitempty"`   // 报告内容（如果成功）
}

//endregion

//region HasSubViewAuth

type HasSubViewAuthParamReq struct {
	HasSubViewAuthParam `param_type:"query"`
}

type HasSubViewAuthParam struct {
	UserID string `binding:"required" form:"user_id"  json:"user_id"`
	ViewID string `binding:"required" form:"view_id" json:"view_id,omitempty"`
}

//endregion
