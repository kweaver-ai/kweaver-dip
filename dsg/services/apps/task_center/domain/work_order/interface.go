package work_order

import (
	"context"
	"time"

	"github.com/kweaver-ai/idrm-go-common/rest/base"

	"github.com/kweaver-ai/dsg/services/apps/task_center/domain/data_research_report"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
	meta_v1 "github.com/kweaver-ai/idrm-go-common/api/meta/v1"
	task_center_v1 "github.com/kweaver-ai/idrm-go-common/api/task_center/v1"
	"github.com/kweaver-ai/idrm-go-common/rest/data_view"
	"github.com/kweaver-ai/idrm-go-common/util/sets"
	"github.com/kweaver-ai/idrm-go-frame/core/enum"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/mq/kafkax"
)

type WorkOrderUseCase interface {
	Create(ctx context.Context, req *WorkOrderCreateReq, userId, userName, departmentId string) (*IDResp, error)
	Update(ctx context.Context, id string, req *WorkOrderUpdateReq, userId string) (*IDResp, error)
	UpdateStatus(ctx context.Context, id string, req *WorkOrderUpdateStatusReq, userId, userName string) (*IDResp, error)
	CheckNameRepeat(ctx context.Context, req *WorkOrderNameRepeatReq) (bool, error)
	List(ctx context.Context, query *WorkOrderListReq) (*WorkOrderListResp, error)
	GetById(ctx context.Context, id string) (*WorkOrderDetailResp, error)
	Delete(ctx context.Context, id string) error
	// ListCreatedByMe 查看工单列表，创建人是我
	ListCreatedByMe(ctx context.Context, opts WorkOrderListCreatedByMeOptions) ([]WorkOrderListCreatedByMeEntry, int, error)
	// ListMyResponsibilities 查看工单列表，责任人是我。如果配置了工单审核，则排
	// 除未通过审核的工单。
	ListMyResponsibilities(ctx context.Context, opts WorkOrderListMyResponsibilitiesOptions) ([]WorkOrderListMyResponsibilitiesEntry, int, error)
	AcceptanceList(ctx context.Context, query *WorkOrderAcceptanceListReq) (*WorkOrderAcceptanceListResp, error)
	ProcessingList(ctx context.Context, query *WorkOrderProcessingListReq, userId string) (*WorkOrderProcessingListResp, error)
	Cancel(ctx context.Context, Id string) error
	AuditList(ctx context.Context, query *AuditListGetReq) (*WorkOrderAuditListResp, error)
	GetListbySourceIDs(ctx context.Context, ids []string) ([]*model.WorkOrder, error)
	GetList(ctx context.Context, query *GetListReq) (*GetListResp, error)
	Remind(ctx context.Context, id string) (*IDResp, error)
	Feedback(ctx context.Context, id string, req *WorkOrderFeedbackReq, userId, userName string) (*IDResp, error)
	Reject(ctx context.Context, id string, req *WorkOrderRejectReq, userId, userName string) (*IDResp, error)
	// 同步工单到第三方，例如：华傲
	Sync(ctx context.Context, id string) error
	GetDataQualityImprovement(ctx context.Context) (*DataQualityImprovementResp, error)
	CheckQualityAuditRepeat(ctx context.Context, req *CheckQualityAuditRepeatReq) (*CheckQualityAuditRepeatResp, error)
	QueryDataFusionPreviewSQL(ctx context.Context, req *DataFusionPreviewSQLReq) (*DataFusionPreviewSQLResp, error)
	AggregationForQualityAudit(ctx context.Context, query *AggregationForQualityAuditListReq) (*AggregationForQualityAuditListResp, error)
	QualityAuditResource(ctx context.Context, workOrderId string, query *QualityAuditResourceReq) (*QualityAuditResourceResp, error)

	ReExplore(ctx context.Context, workOrderId string, userId, userName string, req *ReExploreReq) (*IDResp, error)
}

type ReExploreReq struct {
	ReExploreMode string `json:"re_explore_mode" form:"re_explore_mode" binding:"required,oneof=all failed"` // 重新探查模式：all 全部重新检测，failed 仅重新检测失败任务
}

// 其他模块想要的
type WorkOrderInterface interface {
	GetListbySourceIDs(ctx context.Context, ids []string) ([]*model.WorkOrder, error)
}

// WorkOrderDomainInterface 同层依赖
type WorkOrderDomainInterface interface {
	FusionFieldList(ctx context.Context, workOrderId string) ([]*FusionField, error)
}

type WorkOrderCreateReq struct {
	Name                   string   `json:"name" form:"name" binding:"required,trimSpace,min=1,max=128"`                                                                                                                                      // 名称
	Type                   string   `json:"type" form:"type" binding:"required,oneof=data_comprehension data_aggregation data_standardization data_fusion data_quality data_quality_audit research_report data_catalog front_end_processors"` // 工单类型：数据理解、数据归集、数据标准化、数据融合、数据质量、数据质量稽核
	ResponsibleUID         string   `json:"responsible_uid" form:"responsible_uid" binding:"omitempty,uuid"`
	DataSourceDepartmentId string   `json:"data_source_department_id" form:"data_source_department_id" binding:"omitempty,uuid"`                   // 数源部门（质量整改工单使用）                                                                            // 责任人
	Priority               string   `json:"priority" form:"priority" binding:"omitempty,oneof=common emergent urgent"`                             // 优先级
	FinishedAt             int64    `json:"finished_at" form:"finished_at" binding:"omitempty,verifyDeadline,max=9999999999" example:"4102329600"` // 截止日期
	CatalogIds             []string `json:"catalog_ids"  form:"catalog_ids" binding:"omitempty"`                                                   // 关联数据资源目录
	Description            string   `json:"description" form:"description"  binding:"omitempty"`                                                   // 工单说明
	// 备注
	//
	// Deprecated: 这个字段将被移除
	Remark string `json:"remark" form:"remark" binding:"omitempty"`
	// 来源类型
	SourceType string `json:"source_type" form:"source_type" binding:"omitempty,oneof=standalone plan business_form data_analysis form_view aggregation_work_order supply_and_demand project"`
	// 来源 ID
	SourceId string `json:"source_id" form:"source_id" binding:"omitempty"`
	// 来源 ID 列表。如果同时指定 SourceId 和 SourceIds, 要求 SourceId 与
	// SourceIds 的第一项相同
	SourceIds []string `json:"source_ids" form:"source_ids" binding:"omitempty"`
	// 所属项目的运营流程节点 ID，仅当工单来源类型是项目时有值。
	NodeID string `json:"node_id,omitempty"`
	// 所属项目的运营流程阶段 ID，仅当工单来源类型是项目时有值。
	StageID string `json:"stage_id,omitempty"`
	// 标准化工单关联的逻辑视图列表
	FormViews []WorkOrderDetailFormView `json:"form_views" form:"form_views" binding:"omitempty"`
	// 是否是草稿。对应界面的“暂存”
	Draft         bool           `json:"draft"`
	ReportID      string         `json:"report_id" form:"report_id" binding:"omitempty"`           // 报告id
	ReportVersion int32          `json:"report_version" form:"report_version" binding:"omitempty"` // 报告版本
	ReportTime    int64          `json:"report_time" form:"report_time" binding:"omitempty"`       // 报告生成时间
	Improvements  []*Improvement `json:"improvements" form:"improvements" binding:"omitempty"`     // 整改内容
	// 融合工单关联的融合表信息
	FusionTable CreateFusionTable `json:"fusion_table" form:"fusion_table" binding:"omitempty"`
	// 数据质量稽核工单关联的逻辑视图列表
	QualityAuditFormViewIds []string `json:"quality_audit_form_view_ids" form:"quality_audit_form_view_ids" binding:"omitempty"`
	// 归集工单关联的归集清单 ID
	DataAggregationInventoryID string `json:"data_aggregation_inventory_id,omitempty"`
	// 归集信息，来源：业务表，关联的业务表。借用归集列表借的结构，有机会再重构
	DataAggregationInventory *task_center_v1.AggregatedDataAggregationInventory `json:"data_aggregation_inventory,omitempty"`
}

type Remark struct {
	DatasourceInfos []DatasourceInfo `json:"datasource_infos"`
	TotalSample     int64            `json:"total_sample"`
}

type DatasourceInfo struct {
	DatasourceId string   `json:"datasource_id"`
	IsAudited    *bool    `json:"is_audited"`
	FormViewIds  []string `json:"form_view_ids"`
}

type DataFusionPreviewSQLReq struct {
	TableName    string               `json:"table_name" binding:"required,trimSpace"`                                  // 表名称
	Fields       []*CreateFusionField `json:"fields" binding:"omitempty"`                                               // 字段列表
	SceneSQL     string               `json:"scene_sql" binding:"required"`                                             //画布sql
	DataSourceID string               `json:"datasource_id" form:"datasource_id" binding:"required,uuid" example:"sss"` // 目标数据源id
}

// WorkOrderCreateDetailDataAggregation 代表创建数据归集工单的详情
type WorkOrderCreateDetailDataAggregation struct {
	// 归集信息，借用归集列表借的结构，有机会再重构。
	task_center_v1.AggregatedDataAggregationInventory
}

// 标准化工单关联的逻辑视图列表，用于创建工单
type WorkOrderFormView struct {
	// 逻辑视图 ID
	ID string `json:"id,omitempty"`
	// 逻辑视图字段列表
	Fields []WorkOrderFormViewField `json:"fields,omitempty"`
}

// 标准化工单关联的逻辑视图字段列表，用于创建工单
type WorkOrderFormViewField struct {
	// 逻辑视图字段 ID
	ID string `json:"id,omitempty"`
	// 是否需要标准化，默认为 true
	StandardRequired bool `json:"standard_required,omitempty"`
	// 标准化后，字段所关联的数据元 ID，未定义、零值、空字符串代表未标准化。
	DataElementID int `json:"data_element_id,string,omitempty"`
}

// 融合工单关联的融合表信息，用于创建工单
type CreateFusionTable struct {
	TableName       string               `json:"table_name" binding:"omitempty,max=64"`                                                                              // 表名称
	Fields          []*CreateFusionField `json:"fields" binding:"omitempty"`                                                                                         // 字段列表
	FusionType      string               `json:"fusion_type" form:"fusion_type" binding:"omitempty,oneof=normal scene_analysis" example:"scene_analysis"`            // 融合类型：normal常规方式，scene_analysis场景分析方式
	ExecSQL         string               `json:"exec_sql" binding:"omitempty"`                                                                                       // 执行sql
	SceneSQL        string               `json:"scene_sql" binding:"omitempty"`                                                                                      //画布sql
	SceneAnalysisId string               `json:"scene_analysis_id" form:"scene_analysis_id" binding:"omitempty,uuid" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"` //场景分析画布id
	RunStartAt      int64                `json:"run_start_at" form:"run_start_at"  binding:"omitempty,max=9999999999" example:"4102329600"`                          // 运行开始时间
	RunEndAt        int64                `json:"run_end_at" form:"run_end_at"  binding:"omitempty,verifyDeadline,max=9999999999" example:"4102329600"`               // 运行结束时间
	RunCronStrategy string               `json:"run_cron_strategy" form:"run_cron_strategy" binding:"omitempty,oneof=days hours" example:"days"`                     // 运行执行策略，days每天，hours每小时
	DataSourceID    string               `json:"datasource_id" form:"datasource_id" binding:"omitempty,uuid" example:"sss"`                                          // 目标数据源id
}
type CreateFusionField struct {
	CName             string  `json:"c_name" binding:"required"`                        // 列中文名称
	EName             string  `json:"e_name" binding:"required"`                        // 列英文名称
	StandardID        *string `json:"standard_id" binding:"omitempty"`                  // 标准ID
	CodeTableID       *string `json:"code_table_id" binding:"omitempty"`                // 码表ID
	CodeRuleID        *string `json:"code_rule_id" binding:"omitempty"`                 // 编码规则ID
	DataRange         *string `json:"data_range" binding:"omitempty"`                   // 值域
	DataType          *int    `json:"data_type" binding:"omitempty" default:"-1"`       // 数据类型
	DataLength        *int    `json:"data_length" binding:"omitempty"`                  // 数据长度
	DataAccuracy      *int    `json:"data_accuracy" binding:"omitempty"`                // 数据精度
	PrimaryKey        *bool   `json:"primary_key" binding:"omitempty" default:"false"`  // 是否主键
	IsRequired        *bool   `json:"is_required" binding:"omitempty" default:"false"`  // 是否必填
	IsIncrement       *bool   `json:"is_increment" binding:"omitempty" default:"false"` // 是否增量
	IsStandard        *bool   `json:"is_standard" binding:"omitempty" default:"false"`  // 是否标准
	FieldRelationship string  `json:"field_relationship" binding:"omitempty"`           // 字段关系
	CatalogID         *string `json:"catalog_id" binding:"omitempty"`                   // 数据资源目录ID
	InfoItemID        *string `json:"info_item_id" binding:"omitempty"`                 // 信息项ID
	Index             int     `json:"index" binding:"required"`                         // 字段顺序
}

type Improvement struct {
	FieldId        string  `json:"field_id" form:"field_id" binding:"required"`               // 字段ID
	RuleId         string  `json:"rule_id" form:"rule_id" binding:"required"`                 // 规则ID
	RuleName       string  `json:"rule_name" form:"rule_name" binding:"required"`             // 规则名称
	Dimension      string  `json:"dimension" form:"dimension" binding:"required"`             // 规则维度
	InspectedCount int64   `json:"inspected_count" form:"inspected_count" binding:"required"` // 检测数据量
	IssueCount     int64   `json:"issue_count" form:"issue_count" binding:"required"`         // 问题数据量
	Score          float64 `json:"score" form:"score" binding:"required"`                     // 评分
}

type IDResp struct {
	Id string `json:"id"  example:"4a5a3cc0-0169-4d62-9442-62214d8fcd8d"` // UUID
}

type DataFusionPreviewSQLResp struct {
	HuaAoSQL string `json:"hua_ao_sql"  example:"insrt select xxx "` // 华傲预览SQL
}

type WorkOrderPathReq struct {
	Id string `json:"id" form:"id" uri:"id" binding:"required,uuid" example:"2eaccf8e-c7f0-40f9-ab7a-317d3b0c3802"` // uuid（36）
}

type WorkOrderUpdateReq struct {
	Name                   string   `json:"name" form:"name" binding:"omitempty,trimSpace,min=1,max=128"`                                                                                                    // 名称
	ResponsibleUID         *string  `json:"responsible_uid" form:"responsible_uid" binding:"omitempty,uuid"`                                                                                                 // 责任人
	Priority               string   `json:"priority" form:"priority" binding:"omitempty"`                                                                                                                    // 优先级
	FinishedAt             int64    `json:"finished_at" form:"finished_at" binding:"omitempty,verifyDeadline,max=9999999999" example:"4102329600"`                                                           // 截止日期
	CatalogIds             []string `json:"catalog_ids"  form:"catalog_ids" binding:"omitempty"`                                                                                                             // 关联数据资源目录
	Description            string   `json:"description" form:"description"  binding:"omitempty"`                                                                                                             // 工单说明
	Remark                 string   `json:"remark" form:"remark" binding:"omitempty"`                                                                                                                        // 备注
	SourceType             string   `json:"source_type" form:"source_type" binding:"omitempty,oneof=standalone plan business_form data_analysis form_view aggregation_work_order supply_and_demand project"` // 来源类型
	SourceId               string   `json:"source_id" form:"source_id" binding:"omitempty"`                                                                                                                  // 来源id
	SourceIds              []string `json:"source_ids" form:"source_ids" binding:"omitempty"`                                                                                                                // 来源 id 列表。如果同时指定 SourceId 和 SourceIds, 要求 SourceId 与 SourceIds 的第一项相同
	ProcessingInstructions string   `json:"processing_instructions" form:"processing_instructions" binding:"omitempty"`                                                                                      // 处理说明
	// 标准化工单关联的逻辑视图列表
	FormViews []WorkOrderDetailFormView `json:"form_views" form:"form_views" binding:"omitempty"`
	// 是否是草稿。对应界面的“暂存”
	Draft        bool           `json:"draft"`
	Improvements []*Improvement `json:"improvements" form:"improvements" binding:"omitempty"` // 整改内容
	// 融合工单关联的融合表信息
	FusionTable UpdateFusionTable `json:"fusion_table" form:"fusion_table" binding:"omitempty"`
	// 数据质量稽核工单关联的逻辑视图列表
	QualityAuditFormViewIds []string `json:"quality_audit_form_view_ids" form:"quality_audit_form_view_ids" binding:"omitempty"`
	// 归集工单关联的归集清单 ID
	DataAggregationInventoryID string `json:"data_aggregation_inventory_id,omitempty"`
	// 归集信息，来源：业务表，关联的业务表。借用归集列表借的结构，有机会再重构
	DataAggregationInventory *task_center_v1.AggregatedDataAggregationInventory `json:"data_aggregation_inventory,omitempty"`
}

type UpdateFusionTable struct {
	TableName       string               `json:"table_name" binding:"omitempty,max=64"`                                                                              // 表名称
	Fields          []*UpdateFusionField `json:"fields" binding:"omitempty"`                                                                                         // 字段列表
	FusionType      string               `json:"fusion_type" form:"fusion_type" binding:"omitempty,oneof=normal scene_analysis" example:"scene_analysis"`            // 融合类型：normal常规方式，scene_analysis场景分析方式
	ExecSQL         string               `json:"exec_sql" binding:"omitempty"`                                                                                       // 执行sql
	SceneSQL        string               `json:"scene_sql" binding:"omitempty"`                                                                                      //画布sql
	SceneAnalysisId string               `json:"scene_analysis_id" form:"scene_analysis_id" binding:"omitempty,uuid" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"` //场景分析画布id
	RunStartAt      int64                `json:"run_start_at" form:"run_start_at"  binding:"omitempty,max=9999999999" example:"4102329600"`                          // 运行开始时间
	RunEndAt        int64                `json:"run_end_at" form:"run_end_at"  binding:"omitempty,verifyDeadline,max=9999999999" example:"4102329600"`               // 运行结束时间
	RunCronStrategy string               `json:"run_cron_strategy" form:"run_cron_strategy" binding:"omitempty,oneof=days hours" example:"days"`                     // 运行执行策略，days每天，hours每小时
	DataSourceID    string               `json:"datasource_id" form:"datasource_id" binding:"omitempty,uuid" example:"sss"`                                          // 目标数据源id
}
type UpdateFusionField struct {
	ID                string  `json:"id" binding:"omitempty"`                           // 列id,修改字段信息时使用
	CName             string  `json:"c_name" binding:"required"`                        // 列中文名称
	EName             string  `json:"e_name" binding:"required"`                        // 列英文名称
	StandardID        *string `json:"standard_id" binding:"omitempty"`                  // 标准ID
	CodeTableID       *string `json:"code_table_id" binding:"omitempty"`                // 码表ID
	CodeRuleID        *string `json:"code_rule_id" binding:"omitempty"`                 // 编码规则ID
	DataRange         *string `json:"data_range" binding:"omitempty"`                   // 值域
	DataType          *int    `json:"data_type" binding:"omitempty"  default:"-1"`      // 数据类型
	DataLength        *int    `json:"data_length" binding:"omitempty"`                  // 数据长度
	DataAccuracy      *int    `json:"data_accuracy" binding:"omitempty"`                // 数据精度
	PrimaryKey        *bool   `json:"primary_key" binding:"omitempty" default:"false"`  // 是否主键
	IsRequired        *bool   `json:"is_required" binding:"omitempty" default:"false"`  // 是否必填
	IsIncrement       *bool   `json:"is_increment" binding:"omitempty" default:"false"` // 是否增量
	IsStandard        *bool   `json:"is_standard" binding:"omitempty" default:"false"`  // 是否标准
	FieldRelationship string  `json:"field_relationship" binding:"omitempty"`           // 字段关系
	CatalogID         *string `json:"catalog_id" binding:"omitempty"`                   // 数据资源目录ID
	InfoItemID        *string `json:"info_item_id" binding:"omitempty"`                 // 信息项ID
	Index             int     `json:"index" binding:"required"`                         // 字段顺序
}

// 数据归集工单关联的业务表关联的逻辑视图
type WorkOrderDataView struct {
	// 逻辑视图 ID
	ID string `json:"id,omitempty"`
	// 采集方式
	CollectionMethod task_center_v1.DataAggregationResourceCollectionMethod `json:"collection_method,omitempty"`
	// 采集时间
	CollectedAt meta_v1.Time `json:"collected_at,omitempty"`
	// 同步频率
	SyncFrequency task_center_v1.DataAggregationResourceSyncFrequency `json:"sync_frequency,omitempty"`
	// 关联业务表 ID
	BusinessFormID string `json:"business_form_id,omitempty"`
	// 目标数据源 ID
	TargetDatasourceID string `json:"target_datasource_id,omitempty"`
}

type WorkOrderUpdateStatusReq struct {
	Status                 string `json:"status,omitempty" form:"status" binding:"omitempty,oneof=Unassigned Ongoing Completed"` // 工单状态
	ProcessingInstructions string `json:"processing_instructions" form:"processing_instructions" binding:"omitempty"`            // 处理说明
	// 工单关联的归集清单 ID，工单类型是数据归集时有值
	DataAggregationInventoryID string `json:"data_aggregation_inventory_id,omitempty"`
	// 类型：归集工单，来源：业务表，关联的业务表。借用归集列表借的结构，有机会再重构
	DataAggregationInventory *task_center_v1.AggregatedDataAggregationInventory `json:"data_aggregation_inventory"`
}

type WorkOrderListReq struct {
	Offset     int    `json:"offset" form:"offset,default=1" binding:"omitempty,min=1" default:"1"`                           // 页码，默认1
	Limit      int    `json:"limit" form:"limit,default=10" binding:"omitempty,min=1,max=2000"  default:"10"`                 // 每页大小，默认10
	Direction  string `json:"direction" form:"direction,default=desc" binding:"omitempty,oneof=asc desc" default:"desc"`      // 排序方向，枚举：asc：正序；desc：倒序。默认倒序
	Sort       string `json:"sort" form:"sort,default=created_at" binding:"omitempty,oneof=created_at"  default:"created_at"` // 排序类型，枚举：created_at：按创建时间排序
	Keyword    string `json:"keyword" form:"keyword" binding:"trimSpace,omitempty,min=1,max=255"`                             // 关键字查询，字符无限制
	Type       string `json:"type" form:"type" binding:"omitempty"`                                                           // 工单类型,多选逗号分隔
	Priority   string `json:"priority" form:"priority" binding:"omitempty"`                                                   // 优先级
	Status     string `json:"status" form:"status" binding:"omitempty"`                                                       // 工单状态
	SourceId   string `json:"source_id" form:"source_id" binding:"omitempty"`                                                 // 工单来源
	StartedAt  int64  `json:"started_at" form:"started_at" binding:"omitempty"`                                               // 开始日期
	FinishedAt int64  `json:"finished_at" form:"finished_at" binding:"omitempty"`                                             // 结束日期
}

type PageResult[T any] struct {
	Entries    []*T  `json:"entries" binding:"required"`                       // 对象列表
	TotalCount int64 `json:"total_count" binding:"required,gte=0" example:"3"` // 当前筛选条件下的对象数量
}

type WorkOrderListResp struct {
	PageResult[WorkOrderItem]
}

type WorkOrderItem struct {
	WorkOrderId           string      `json:"work_order_id"`          // 工单id
	Name                  string      `json:"name"`                   // 名称
	Code                  string      `json:"code"`                   // 工单编号
	AuditStatus           string      `json:"audit_status"`           // 审核状态
	AuditDescription      string      `json:"audit_description"`      // 审核描述
	Status                string      `json:"status"`                 // 工单状态
	Draft                 bool        `json:"draft,omitempty"`        //是否是草稿
	Type                  string      `json:"type"`                   // 工单类型
	Priority              string      `json:"priority"`               // 优先级
	ResponsibleUID        string      `json:"responsible_uid"`        // 责任人
	ResponsibleUName      string      `json:"responsible_uname"`      // 责任人名称
	ResponsibleDepartment []string    `json:"responsible_department"` // 责任部门
	DataSourceDepartment  string      `json:"data_source_department"` // 数源部门id(目前质量整改工单使用)
	SourceId              string      `json:"source_id"`              // 来源id
	SourceIds             []string    `json:"source_ids,omitempty"`   // 来源id列表
	SourceType            string      `json:"source_type"`            // 来源类型
	SourceName            string      `json:"source_name"`            // 来源名称
	SourceNames           []string    `json:"source_names,omitempty"` // 来源名称列表
	CreatedBy             string      `json:"created_by"`             // 创建人
	CreatedAt             int64       `json:"created_at"`             // 创建时间
	FinishedAt            int64       `json:"finished_at"`            // 截止日期
	DaysRemaining         *int64      `json:"days_remaining"`         // 剩余天数
	Remind                int32       `json:"remind"`                 // 催办,1为已催办；0为未催办
	Score                 int32       `json:"score"`                  // 得分,>0为已反馈
	TaskInfo              []*TaskInfo `json:"tasks"`                  // 工单任务信息
	CompletedTaskCount    int64       `json:"completed_task_count"`   // 已完成任务数量
	// 归集工单关联的业务表列表
	BusinessForms []AggregatedWorkOrderBusinessForm
}

// 归集工单关联的业务表，与 WorkOrderBusinessForm 相比包含业务表名称、所属部门等
// 与工单无关的数据
type AggregatedWorkOrderBusinessForm struct {
	// 业务表 - ID
	ID string `json:"id,omitempty"`
	// 业务表 - 名称
	Name string `json:"name,omitempty"`
	// 业务表 - 描述
	Description string `json:"description,omitempty"`
	// 业务表 - 更新时间
	UpdatedAt meta_v1.Time `json:"updated_at,omitempty"`

	// 业务表 - 业务模型 - 名称
	BusinessModelName string `json:"business_model_name,omitempty"`
	// 业务表 - 业务模型 - 业务域 - 部门 - 路径
	DepartmentPath string `json:"department_path,omitempty"`
	// 业务表 - 信息系统 - 名称
	InfoSystemNames []string `json:"info_system_name,omitempty"`
	// 业务表 - 更新人 - 名称
	UpdaterName string `json:"updater_name,omitempty"`

	// 业务表 - 逻辑视图
	DataViews []AggregatedWorkOrderDataView `json:"data_views,omitempty"`
}

// 数据归集工单关联的业务表关联的逻辑视图，与 WorkOrderDataView 相比包含逻辑视图
// 名称等与工单无关的数据
type AggregatedWorkOrderDataView struct {
	// 逻辑视图 ID
	DataViewID string `json:"data_view_id,omitempty"`
	// 资源名称，即逻辑视图的业务名称
	BusinessName string `json:"business_name,omitempty"`
	// 技术名称，即逻辑视图的技术名称
	TechnicalName string `json:"technical_name,omitempty"`
	// 数据来源，即资源所属数据源的名称
	DatasourceName string `json:"datasource_name,omitempty"`
	// 数源单位，即资源所属部门的路径
	DepartmentPath string `json:"department_path,omitempty"`
	// 采集方式
	CollectionMethod task_center_v1.DataAggregationResourceCollectionMethod `json:"collection_method,omitempty"`
	// 采集时间
	CollectedAt meta_v1.Time `json:"collected_at,omitempty"`
	// 同步频率
	SyncFrequency task_center_v1.DataAggregationResourceSyncFrequency `json:"sync_frequency,omitempty"`
	// 目标数据源 ID
	TargetDatasourceID string `json:"target_datasource_id,omitempty"`
	// 目标数据源，即数据源名称，数据资源被归集到这个数据源
	TargetDatasourceName string `json:"target_datasource_name,omitempty"`
	// 数据库，即数据源的数据库名称
	DatabaseName string `json:"database_name,omitempty"`
	// 价值评估状态
	ValueAssessmentStatus task_center_v1.DataAggregationResourceValueAssessmentStatus `json:"value_assessment_status,omitempty"`
}

type TaskInfo struct {
	TaskId   string `json:"task_id"`   // 任务id
	TaskName string `json:"task_name"` // 任务名称
}

type WorkOrderDetailResp struct {
	WorkOrderId            string         `json:"work_order_id"`           // 工单id
	Name                   string         `json:"name"`                    // 名称
	Code                   string         `json:"code"`                    // 工单编号
	Type                   string         `json:"type"`                    // 工单类型
	ResponsibleUID         string         `json:"responsible_uid"`         // 责任人
	ResponsibleUName       string         `json:"responsible_uname"`       // 责任人名称
	Priority               string         `json:"priority"`                // 优先级
	FinishedAt             int64          `json:"finished_at"`             // 截止日期
	CatalogInfos           []*CatalogInfo `json:"catalog_infos"`           // 关联数据资源目录
	Description            string         `json:"description"`             // 工单说明
	Remark                 string         `json:"remark"`                  // 备注
	Status                 string         `json:"status"`                  // 工单状态
	Draft                  bool           `json:"draft,omitempty"`         // 是否为草稿
	ProcessingInstructions string         `json:"processing_instructions"` // 处理说明
	SourceId               string         `json:"source_id"`               // 来源id
	SourceIds              []string       `json:"source_ids"`              // 来源id列表，第一项与 SourceId 相同
	SourceType             string         `json:"source_type"`             // 来源类型
	SourceName             string         `json:"source_name"`             // 来源名称
	CreatedBy              string         `json:"created_by"`              // 创建人
	CreatedAt              int64          `json:"created_at"`              // 创建时间
	UpdatedBy              string         `json:"updated_by"`              // 修改人
	UpdatedAt              int64          `json:"updated_at"`              // 修改时间
	AuditStatus            string         `json:"audit_status"`            // 审核状态
	RejectReason           string         `json:"reject_reason"`           // 驳回理由
	// 工单是否已经同步到第三方，例如华傲
	Synced bool `json:"synced,omitempty"`
	// 所属项目的运营流程节点 ID，仅当工单来源类型是项目时有值。
	NodeID string `json:"node_id,omitempty"`
	// 所属项目的运营流程节点名称，仅当工单来源类型是项目时有值。
	NodeName string `json:"node_name,omitempty"`
	// 所属项目的运营流程阶段 ID，仅当工单来源类型是项目时有值。
	StageID string `json:"stage_id,omitempty"`
	// 关联的数据归集清单，工单类型是数据归集时有值
	DataAggregationInventory *task_center_v1.AggregatedDataAggregationInventory `json:"data_aggregation_inventory,omitempty"`
	// 关联的数据调研报告的
	DataResearchReport *data_research_report.DataResearchReportDetailResp `json:"data_research_report,omitempty"`
	// 标准化工单关联的逻辑视图列表
	FormViews              []WorkOrderDetailFormView `json:"form_views,omitempty"`
	DataQualityImprovement *DataQualityImprovement   `json:"data_quality_improvement"` // 整改内容
	// 融合工单关联的融合表
	FusionTable *FusionTable `json:"fusion_table,omitempty"`
	// 质量稽核工单关联逻辑视图列表
	QualityAuditFromViews []*data_view.ViewInfo `json:"quality_audit_form_views" binding:"omitempty"`
}

type CatalogInfo struct {
	CatalogId   string `json:"catalog_id"`   // 数据资源目录id
	CatalogName string `json:"catalog_name"` // 数据资源目录名称
}

// 标准化工单关联的逻辑视图，用于工单详情。
type WorkOrderDetailFormView struct {
	// ID
	ID string `json:"id,omitempty"`
	// 业务名称
	BusinessName string `json:"business_name,omitempty"`
	// 技术名称
	TechnicalName string `json:"technical_name,omitempty"`
	// 描述
	Description string `json:"description,omitempty"`
	// 所属数据源的名称
	DatasourceName string `json:"datasource_name,omitempty"`
	// 所属部门的完整路径
	DepartmentPath string `json:"department_path,omitempty"`
	// 字段列表
	Fields []WorkOrderDetailFormViewField `json:"fields,omitempty"`
}

type FusionTable struct {
	TableName          string         `json:"table_name" binding:"required"`                                                                                      // 表名称
	Fields             []*FusionField `json:"fields" binding:"required"`                                                                                          // 字段列表
	FusionType         string         `json:"fusion_type" form:"fusion_type" binding:"omitempty,oneof=normal scene_analysis" example:"scene_analysis"`            // 融合类型：normal常规方式，scene_analysis场景分析方式
	ExecSQL            string         `json:"exec_sql" binding:"omitempty"`                                                                                       // 执行sql
	SceneSQL           string         `json:"scene_sql" binding:"omitempty"`                                                                                      // 画布sql
	SceneAnalysisId    string         `json:"scene_analysis_id" form:"scene_analysis_id" binding:"omitempty,uuid" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"` //场景分析画布id
	RunStartAt         int64          `json:"run_start_at" form:"run_start_at"  binding:"omitempty,max=9999999999" example:"4102329600"`                          // 运行开始时间
	RunEndAt           int64          `json:"run_end_at" form:"run_end_at"  binding:"omitempty,verifyDeadline,max=9999999999" example:"4102329600"`               // 运行结束时间
	RunCronStrategy    string         `json:"run_cron_strategy" form:"run_cron_strategy" binding:"omitempty,oneof=days hours" example:"days"`                     // 运行执行策略，days每天，hours每小时
	DataSourceID       string         `json:"datasource_id" form:"datasource_id" binding:"omitempty,uuid" example:"sss"`                                          // 目标数据源id
	DataSourceName     string         `json:"datasource_name" form:"datasource_id" example:"sssss"`                                                               // 目标数据源名称
	DatasourceTypeName string         `json:"datasource_type_name" form:"datasource_id"  example:"mysql"`                                                         // 目标数据源类型
	DatabaseName       string         `json:"database_name" form:"datasource_id" example:"sss"`                                                                   // 目标数据库名称
	Schema             string         `json:"schema" form:"schema" example:"sss"`                                                                                 // 数据库模式
}
type FusionField struct {
	ID                    string  `json:"id" binding:"required"`                        // 列id
	CName                 string  `json:"c_name" binding:"required"`                    // 列中文名称
	EName                 string  `json:"e_name" binding:"required"`                    // 列英文名称
	StandardID            *string `json:"standard_id" binding:"omitempty"`              // 标准ID
	StandardNameZH        string  `json:"standard_name_zh" binding:"omitempty"`         // 标准中文名称
	StandardNameEN        string  `json:"standard_name_en" binding:"omitempty"`         // 标准英文名称
	CodeTableID           *string `json:"code_table_id" binding:"omitempty"`            // 码表ID
	CodeTableNameZH       string  `json:"code_table_name_zh" binding:"omitempty"`       // 码表中文名称
	CodeTableNameEN       string  `json:"code_table_name_en" binding:"omitempty"`       // 码表英文名称
	CodeRuleID            *string `json:"code_rule_id" binding:"omitempty"`             // 编码规则ID
	CodeRuleName          string  `json:"code_rule_name" binding:"omitempty"`           // 编码规则名称
	DataRange             *string `json:"data_range" binding:"omitempty"`               // 值域
	DataType              int     `json:"data_type" binding:"required"`                 // 数据类型
	DataTypeName          string  `json:"data_type_name"`                               // 数据类型名称
	DataLength            *int    `json:"data_length" binding:"omitempty"`              // 数据长度
	DataAccuracy          *int    `json:"data_accuracy" binding:"omitempty"`            // 数据精度
	PrimaryKey            *bool   `json:"primary_key" binding:"omitempty"`              // 是否主键
	IsRequired            *bool   `json:"is_required" binding:"omitempty"`              // 是否必填
	IsIncrement           *bool   `json:"is_increment" binding:"omitempty"`             // 是否增量
	IsStandard            *bool   `json:"is_standard" binding:"omitempty"`              // 是否标准
	FieldRelationship     string  `json:"field_relationship" binding:"omitempty"`       // 字段关系
	CatalogID             *string `json:"catalog_id" binding:"omitempty"`               // 数据资源目录ID
	CatalogName           string  `json:"catalog_name"  binding:"omitempty"`            // 数据资源目录名称
	InfoItemID            *string `json:"info_item_id" binding:"omitempty"`             // 信息项ID
	InfoItemBusinessName  string  `json:"info_item_business_name" binding:"omitempty"`  // 信息项业务名称
	InfoItemTechnicalName string  `json:"info_item_technical_name" binding:"omitempty"` // 信息项技术名称
	Index                 int     `json:"index" binding:"required"`                     // 字段顺序
	CreatedByUID          string  `json:"created_by_uid" binding:"required"`            // 创建人
	CreatedAt             int64   `json:"created_at" binding:"required"`                // 创建时间
	UpdatedByUID          string  `json:"updated_by_uid" binding:"omitempty"`           // 更新人
	UpdatedAt             int64   `json:"updated_at" binding:"omitempty"`               // 更新时间
}

// 标准化工单关联的逻辑视图的字段，用于工单详情。
type WorkOrderDetailFormViewField struct {
	// ID
	ID string `json:"id,omitempty"`
	// 业务名称
	BusinessName string `json:"business_name,omitempty"`
	// 技术名称
	TechnicalName string `json:"technical_name,omitempty"`
	// 是否需要标准化
	StandardRequired bool `json:"standard_required,omitempty"`
	// 标准化后，字段关联的数据元。缺少此字段，代表未被标准化。
	DataElement *WorkOrderDetailDataElement `json:"data_element,omitempty"`
}

// 标准化工单关联的逻辑视图经过标准化后字段所关联的数据元，用于工单详情。
type WorkOrderDetailDataElement struct {
	// ID
	ID int `json:"id,omitempty,string"`
	// 编码，ID 非空时忽略此字段，ID 为空时使用编码补全 ID
	Code int `json:"code,omitempty,string"`
	// 中文名称
	NameZH string `json:"name_zh,omitempty"`
	// 英文名称
	NameEN string `json:"name_en,omitempty"`
	// 标准分类名称
	StandardTypeName string `json:"standard_type_name,omitempty"`
	// 数据类型名称
	DataTypeName string `json:"data_type_name,omitempty"`
	// 数据长度
	DataLength int `json:"data_length,omitempty"`
	// 数据精度
	DataPrecision *int `json:"data_precision,omitempty"`
	// 码表名称，中文
	DictNameZH string `json:"dict_name_zh,omitempty"`
}

type DataQualityImprovement struct {
	DataSourceID         string             `json:"data_source_id"`
	DataSourceName       string             `json:"data_source_name"`
	FormViewID           string             `json:"form_view_id"`
	FormViewBusinessName string             `json:"form_view_business_name"`
	ReportID             string             `json:"report_id"`      // 报告id
	ReportVersion        int32              `json:"report_version"` // 报告版本
	Improvements         []*ImprovementInfo `json:"improvements"`
	Feedback             *Feedback          `json:"feedback"`
}

type ImprovementInfo struct {
	FieldId            string  `json:"field_id"`             // 字段ID
	FieldTechnicalName string  `json:"field_technical_name"` // 字段技术名称
	FieldBusinessName  string  `json:"field_business_name"`  // 字段业务名称
	FieldType          string  `json:"field_type"`           // 字段类型
	RuleId             string  `json:"rule_id"`              // 规则ID
	RuleName           string  `json:"rule_name"`            // 规则名称
	Dimension          string  `json:"dimension"`            // 规则维度
	InspectedCount     int64   `json:"inspected_count"`      // 检测数据量
	IssueCount         int64   `json:"issue_count"`          // 问题数据量
	Score              float64 `json:"score"`                // 评分
}

type Feedback struct {
	Score           int32  `json:"score"`            // 得分
	FeedbackContent string `json:"feedback_content"` // 反馈内容
	FeedbackAt      int64  `json:"feedback_at"`      // 反馈时间
	FeedbackBy      string `json:"feedback_by"`      // 反馈人
}

type WorkOrderNameRepeatReq struct {
	Id   string `json:"id" form:"id"  binding:"omitempty,verifyUuidNotRequired"`                                                                                                                                          // 工单id
	Name string `json:"name" form:"name" binding:"required,verifyName"`                                                                                                                                                   // 工单名称
	Type string `json:"type" form:"type" binding:"required,oneof=data_comprehension data_aggregation data_quality data_fusion data_quality_audit data_standardization research_report data_catalog front_end_processors"` // 工单类型：数据理解、数据归集、数据质量、数据融合、数据质量稽核
}

// WorkOrderSortOptions 代表工单列表的排序选项
type WorkOrderSortOptions struct {
	// 排序 - 字段
	Sort string `json:"sort,omitempty"`
	// 排序 - 方向
	Direction string `json:"direction,omitempty"`
}

// WorkOrderPaginateOptions 代表工单列表的分页选项
type WorkOrderPaginateOptions struct {
	// 页码，从 1 开始
	Offset int `json:"offset,omitempty"`
	// 每页大小
	Limit int `json:"limit,omitempty"`
}

// WorkOrderListCreatedByMeOptions 代表查看工单列表，创建人是我的选项
type WorkOrderListCreatedByMeOptions struct {
	// 排序选项
	WorkOrderSortOptions
	// 分页选项
	WorkOrderPaginateOptions

	// 关键字
	Keyword string `json:"keyword,omitempty"`
	// 关键子匹配字段
	Fields []string `json:"fields,omitempty"`
	// 过滤 - 类型
	Type string `json:"type,omitempty"`
	// 过滤 - 状态：未派发、进行中、已完成
	Status WorkOrderStatusV2 `json:"status,omitempty"`
	// 过滤 - 优先级
	Priority   string `json:"priority,omitempty"`
	StartedAt  int64  `json:"started_at" form:"started_at" binding:"omitempty" example:"4102329600"`   // 创建时间开始
	FinishedAt int64  `json:"finished_at" form:"finished_at" binding:"omitempty" example:"4102329600"` // 创建时间结束
}

type WorkOrderListCreatedByMeEntry struct {
	// ID
	ID string `json:"id,omitempty"`
	// 名称
	Name string `json:"name,omitempty"`
	// 编号
	Code string `json:"code,omitempty"`
	// 状态
	Status WorkOrderStatusV2 `json:"status,omitempty"`
	// 工单所属项目节点未开启。仅在工单来源类型是项目时有值。
	NodeInactive bool `json:"node_inactive,omitempty"`
	// 类型
	Type string `json:"type,omitempty"`
	// 优先级
	Priority string `json:"priority,omitempty"`
	// 责任人
	ResponsibleUser meta_v1.ReferenceWithName `json:"responsible_user,omitempty"`
	// 审核状态
	AuditStatus string `json:"audit_status,omitempty"`
	// 审核意见
	AuditDescription string `json:"audit_description,omitempty"`
	// 属于这个工单的工单任务数量
	WorkOrderTaskCount WorkOrderTaskCount `json:"work_order_task_count,omitempty"`
	// 来源
	Sources []WorkOrderSource `json:"sources,omitempty"`
	// 截止日期，空代表无截止日期
	FinishedAt *time.Time `json:"finished_at,omitempty"`
	// 是否已经同步到第三方
	Synced bool `json:"synced,omitempty"`

	AuditApplyID string `json:"audit_apply_id,omitempty"` // 审核申请ID
	Draft        *bool  `json:"draft,omitempty"`          // 是否是草稿
}

// WorkOrderSource 代表工单的来源
type WorkOrderSource struct {
	// 类型
	Type string `json:"type,omitempty"`
	// ID
	ID string `json:"id,omitempty"`
	// 名称
	Name string `json:"name,omitempty"`
}

// WorkOrderListMyResponsibilitiesOptions 代表查看工单列表，责任让你是我的选项
type WorkOrderListMyResponsibilitiesOptions struct {
	// 排序选项
	WorkOrderSortOptions `json:"work_order_sort_options,omitempty"`
	// 分页选项
	WorkOrderPaginateOptions `json:"work_order_paginate_options,omitempty"`

	// 关键字
	Keyword string `json:"keyword,omitempty"`
	// 关键子匹配字段
	Fields []string `json:"fields,omitempty"`
	// 过滤 - 类型
	Type string `json:"type,omitempty"`
	// 过滤 - 状态：未派发、进行中、已完成
	Status WorkOrderStatusV2 `json:"status,omitempty"`
	// 过滤 - 优先级
	Priority   string `json:"priority,omitempty"`
	StartedAt  int64  `json:"started_at" form:"started_at" binding:"omitempty" example:"4102329600"`   // 创建时间开始
	FinishedAt int64  `json:"finished_at" form:"finished_at" binding:"omitempty" example:"4102329600"` // 创建时间结束
}

type WorkOrderTaskCount struct {
	// 总数
	Total int `json:"total,omitempty"`
	// 已完成的数量
	Completed int `json:"completed,omitempty"`
}

type WorkOrderListMyResponsibilitiesEntry struct {
	// ID
	ID string `json:"id,omitempty"`
	// 名称
	Name string `json:"name,omitempty"`
	// 编号
	Code string `json:"code,omitempty"`
	// 状态
	Status WorkOrderStatusV2 `json:"status,omitempty"`
	// 类型
	Type string `json:"type,omitempty"`
	// 优先级
	Priority string `json:"priority,omitempty"`
	// 责任人
	ResponsibleUser meta_v1.ReferenceWithName `json:"responsible_user,omitempty"`
	// 属于这个工单的工单任务数量
	WorkOrderTaskCount WorkOrderTaskCount `json:"work_order_task_count,omitempty"`
	// 来源
	Sources []WorkOrderSource `json:"sources,omitempty"`
	// 截止日期，空代表无截止日期
	FinishedAt *time.Time `json:"finished_at,omitempty"`
	// 创建人名称
	CreatorName string `json:"creator_name,omitempty"`
}

type WorkOrderAcceptanceListReq struct {
	Offset    int    `json:"offset" form:"offset,default=1" binding:"omitempty,min=1" default:"1"`                           // 页码，默认1
	Limit     int    `json:"limit" form:"limit,default=10" binding:"omitempty,min=1,max=2000"  default:"10"`                 // 每页大小，默认10
	Direction string `json:"direction" form:"direction,default=desc" binding:"omitempty,oneof=asc desc" default:"desc"`      // 排序方向，枚举：asc：正序；desc：倒序。默认倒序
	Sort      string `json:"sort" form:"sort,default=created_at" binding:"omitempty,oneof=created_at"  default:"created_at"` // 排序类型，枚举：created_at：按创建时间排序
	Keyword   string `json:"keyword" form:"keyword" binding:"trimSpace,omitempty,min=1,max=255"`                             // 关键字查询，字符无限制
	Type      string `json:"type" form:"type" binding:"omitempty"`                                                           // 工单类型,多个类型逗号分隔
}

type WorkOrderAcceptanceListResp struct {
	PageResult[WorkOrderAcceptanceItem]
}
type WorkOrderAcceptanceItem struct {
	WorkOrderId string   `json:"work_order_id"`          // 工单id
	Name        string   `json:"name"`                   // 名称
	Code        string   `json:"code"`                   // 工单编号
	Type        string   `json:"type"`                   // 工单类型
	Priority    string   `json:"priority"`               // 优先级
	FinishedAt  int64    `json:"finished_at"`            // 截止日期
	SourceId    string   `json:"source_id"`              // 来源id
	SourceIds   []string `json:"source_ids,omitempty"`   // 来源 ID 列表
	SourceType  string   `json:"source_type"`            // 来源类型
	SourceName  string   `json:"source_name"`            // 来源名称
	SourceNames []string `json:"source_names,omitempty"` // 来源名称列表
	CreatedBy   string   `json:"created_by"`             // 创建人
	CreatedAt   int64    `json:"created_at"`             // 创建时间
}

type WorkOrderProcessingListReq struct {
	Offset           int      `json:"offset" form:"offset,default=1" binding:"omitempty,min=1" default:"1"`                                         // 页码，默认1
	Limit            int      `json:"limit" form:"limit,default=10" binding:"omitempty,min=1,max=2000"  default:"10"`                               // 每页大小，默认10
	Direction        string   `json:"direction" form:"direction,default=desc" binding:"omitempty,oneof=asc desc" default:"desc"`                    // 排序方向，枚举：asc：正序；desc：倒序。默认倒序
	Sort             string   `json:"sort" form:"sort,default=created_at" binding:"omitempty,oneof=created_at acceptance_at process_at updated_at"` // 排序类型，枚举：created_at：按创建时间排序；acceptance_at：按签收时间排序；process_at:按处理时间排序, updated_at：按处理完成时间排序
	Keyword          string   `json:"keyword" form:"keyword" binding:"trimSpace,omitempty,min=1,max=255"`                                           // 关键字查询，字符无限制
	Type             string   `json:"type" form:"type" binding:"omitempty"`                                                                         // 工单类型,多个类型逗号分隔
	Status           string   `json:"status"  form:"status" binding:"omitempty"`                                                                    // 工单状态,多个状态逗号分隔
	Priority         string   `json:"priority" form:"priority" binding:"omitempty"`                                                                 // 优先级
	SubDepartmentIDs []string `json:"-"`
}

type WorkOrderProcessingListResp struct {
	Entries        []*WorkOrderProcessingItem `json:"entries" binding:"required"`  // 对象列表
	TodoCount      int64                      `json:"todo_count" example:"3"`      // 待办工单数量
	CompletedCount int64                      `json:"completed_count" example:"4"` // 已办工单数量
}

type WorkOrderProcessingItem struct {
	WorkOrderId        string      `json:"work_order_id"`            // 工单id
	Name               string      `json:"name"`                     // 名称
	Code               string      `json:"code"`                     // 工单编号
	Type               string      `json:"type"`                     // 工单类型
	Status             string      `json:"status"`                   // 工单状态
	AuditStatus        string      `json:"audit_status"`             // 审核状态
	AuditDescription   string      `json:"audit_description"`        // 审核描述
	Remind             int32       `json:"remind"`                   // 催办，为1时表示已经催办过
	Priority           string      `json:"priority"`                 // 优先级
	FinishedAt         int64       `json:"finished_at"`              // 截止日期
	DaysRemaining      *int64      `json:"days_remaining"`           // 剩余天数，null不提示，负数是逾期，0是当天，正数是还有几天到期
	TaskInfo           []*TaskInfo `json:"tasks"`                    // 工单任务信息
	CompletedTaskCount int64       `json:"completed_task_count"`     // 已完成任务数量
	SourceId           string      `json:"source_id"`                // 来源id
	SourceIds          []string    `json:"source_ids,omitempty"`     // 来源 ID 列表
	SourceType         string      `json:"source_type"`              // 来源类型
	SourceName         string      `json:"source_name"`              // 来源名称
	SourceNames        []string    `json:"source_names,omitempty"`   // 来源名称里欸包
	CreatedBy          string      `json:"created_by"`               // 创建人
	ContactPhone       string      `json:"contact_phone"`            // 发起人联系电话
	AcceptanceAt       int64       `json:"acceptance_at"`            // 签收时间
	ProcessAt          int64       `json:"process_at"`               // 签收时间
	UpdatedAt          int64       `json:"updated_at"`               // 工单完成时间
	AuditApplyID       string      `json:"audit_apply_id,omitempty"` // 审核申请ID
}

type AuditListGetReq struct {
	Type    string `form:"type" binding:"omitempty,oneof=data_comprehension data_aggregation data_standardization data_fusion data_quality_audit data_quality " default:"data_comprehension"` // 工单类型：数据理解、数据归集、数据标准化、数据融合、数据质量稽核、数据质量
	Target  string `form:"target" binding:"required,oneof=tasks historys"`                                                                                                                    // 审核列表类型 tasks 待审核 historys 已审核
	Offset  int    `form:"offset,default=1" binding:"omitempty" default:"1"`                                                                                                                  // 页码，默认1
	Limit   int    `form:"limit,default=10" binding:"omitempty" default:"10"`                                                                                                                 // 每页size，默认10
	Keyword string `form:"keyword" binding:"omitempty,trimSpace,min=1,max=128"`                                                                                                               // 关键字查询，字符无限制
}

type WorkOrderAuditListResp struct {
	PageResult[WorkOrderAuditInfo]
}

type WorkOrderAuditInfo struct {
	ID            string `json:"id"`              // 工单id
	Name          string `json:"name"`            // 名称
	Type          string `json:"type"`            // 工单类型
	ApplyUserName string `json:"apply_user_name"` // 申请人
	ApplyTime     string `json:"apply_time"`      // 申请时间
	ProcInstID    string `json:"proc_inst_id"`    // 审核实例ID
	TaskID        string `json:"task_id"`         // 审核任务ID
}

type Data struct {
	Id         string `json:"id"`
	Title      string `json:"title"`
	Type       string `json:"type"`
	SubmitTime int64  `json:"submit_time"`
}

type GetListReq struct {
	Type         string   `json:"type" form:"type" binding:"omitempty,oneof=data_comprehension data_aggregation data_standardization data_fusion data_quality_audit data_quality"` // 工单类型: 数据理解data_comprehension 数据归集data_aggregation 数据标准化data_standardization 数据融合data_fusion 数据质量稽核data_quality_audit 数据质量data_quality
	SourceType   string   `json:"source_type" form:"source_type" binding:"omitempty,oneof=standalone plan business_form data_analysis aggregation_work_order supply_and_demand"`   // 来源类型: 无standalone 计划plan 业务表business_form 数据分析data_analysis 归集工单aggregation_work_order
	SourceIds    []string `json:"source_ids" form:"source_ids" binding:"omitempty"`                                                                                                // 来源id列表
	WorkOrderIds []string `json:"work_order_ids" form:"work_order_ids" binding:"omitempty,dive,uuid"`                                                                              // 工单id列表
}

type GetListResp struct {
	Entries []*WorkOrderInfo `json:"entries" binding:"required"` // 对象列表
}

type WorkOrderInfo struct {
	WorkOrderId        string               `json:"work_order_id"`        // 工单id
	Name               string               `json:"name"`                 // 名称
	Code               string               `json:"code"`                 // 工单编号
	AuditStatus        string               `json:"audit_status"`         // 审核状态
	AuditDescription   string               `json:"audit_description"`    // 审核描述
	Status             string               `json:"status"`               // 工单状态
	Draft              bool                 `json:"draft,omitempty"`      // 是否是草稿
	Type               string               `json:"type"`                 // 工单类型
	Priority           string               `json:"priority"`             // 优先级
	ResponsibleUID     string               `json:"responsible_uid"`      // 责任人
	ResponsibleUName   string               `json:"responsible_uname"`    // 责任人名称
	SourceId           string               `json:"source_id"`            // 来源id
	SourceType         string               `json:"source_type"`          // 来源类型
	CreatedAt          int64                `json:"created_at"`           // 创建时间
	FinishedAt         int64                `json:"finished_at"`          // 截止日期
	TaskInfo           []*WorkOrderTaskInfo `json:"tasks"`                // 工单任务信息
	CompletedTaskCount int64                `json:"completed_task_count"` // 已完成任务数量
	FusionTableName    string               `json:"fusion_table_name"`    // 融合表名称，融合工单使用
}

type WorkOrderTaskInfo struct {
	TaskId       string `json:"task_id"`        // 任务id
	TaskName     string `json:"task_name"`      // 任务名称
	DataSourceId string `json:"data_source_id"` // 数据源id，融合工单任务使用
	// 数据表名称，融合工单使用
	DataTable       string                                                `json:"data_table,omitempty"`
	DataAggregation []task_center_v1.WorkOrderTaskDetailAggregationDetail `json:"data_aggregation,omitempty"`
}

type WorkOrderFeedbackReq struct {
	Score           int32   `json:"score" form:"score" binding:"required"`                        // 得分
	FeedbackContent *string `json:"feedback_content" form:"feedback_content" binding:"omitempty"` // 反馈内容
}

type WorkOrderRejectReq struct {
	RejectReason string `json:"reject_reason" form:"reject_reason" binding:"required"` // 驳回理由
}

type DataQualityImprovementResp struct {
	TotalCount      int64 `json:"total_count"`       // 整改工单总数
	OngoingCount    int64 `json:"ongoing_count"`     // 进行中数量
	FinishedCount   int64 `json:"finished_count"`    // 已完成数量
	AlertCount      int64 `json:"alert_count"`       // 告警数量
	NotOverdueCount int64 `json:"not_overdue_count"` // 未逾期的已完成工单数量
}

type AlarmRuleInfo struct {
	DeadlineTime   int64 `json:"deadline_time" binding:"required"`   // 截止告警时间
	BeforehandTime int64 `json:"beforehand_time" binding:"required"` // 提前告警时间
}

type CheckQualityAuditRepeatReq struct {
	ViewIds []string `json:"view_ids" form:"view_ids" binding:"omitempty"`
}
type CheckQualityAuditRepeatResp struct {
	Relations []*ViewWorkOrderRelation `json:"relations" form:"relations" binding:"omitempty"`
}

type ViewWorkOrderRelation struct {
	ViewId            string       `json:"view_id"`             // 视图id
	ViewTechnicalName string       `json:"view_technical_name"` // 视图技术名称
	ViewBusinessName  string       `json:"view_business_name"`  // 视图业务名称
	WorkOrders        []*WorkOrder `json:"work_orders"`         // 工单列表
}

type WorkOrder struct {
	WorkOrderId   string `json:"work_order_id"`   // 工单id
	WorkOrderName string `json:"work_order_name"` // 工单名称
}

type QualityReportReq struct {
	WorkOrderId  string      `json:"work_order_id"` // 工单id
	InstanceId   string      `json:"instance_id"`   // 实例id
	DatasourceId string      `json:"datasource_id"` // 数据源id
	FormName     string      `json:"form_name"`     // 表名称
	Rules        []*RuleInfo `json:"rules"`         // 规则列表
	FinishedAt   int64       `json:"finished_at"`   // 报告生成时间
}

type RuleInfo struct {
	FieldName      string `json:"field_name"`      // 字段名称
	RuleId         string `json:"rule_id"`         // 规则ID
	RuleName       string `json:"rule_name"`       // 规则名称
	InspectedCount int64  `json:"inspected_count"` // 检测数据量
	IssueCount     int64  `json:"issue_count"`     // 问题数据量
}

type WorkOrderType enum.Object

var (
	WorkOrderTypeDataComprehension  = enum.New[WorkOrderType](1, "data_comprehension")   // 数据理解
	WorkOrderTypeDataAggregation    = enum.New[WorkOrderType](2, "data_aggregation")     // 数据归集
	WorkOrderTypeStandardization    = enum.New[WorkOrderType](3, "data_standardization") // 标准化
	WorkOrderTypeDataFusion         = enum.New[WorkOrderType](4, "data_fusion")          // 数据融合
	WorkOrderTypeDataQuality        = enum.New[WorkOrderType](5, "data_quality")         // 数据质量
	WorkOrderTypeDataQualityAudit   = enum.New[WorkOrderType](6, "data_quality_audit")   // 数据质量稽核
	WorkOrderTypeResearchReport     = enum.New[WorkOrderType](7, "research_report")      // 调研工单
	WorkOrderTypeDataCatalog        = enum.New[WorkOrderType](8, "data_catalog")         // 资源编目工单
	WorkOrderTypeFrontEndProcessors = enum.New[WorkOrderType](9, "front_end_processors") // 前置机申请工单

)

type ReExploreMode enum.Object

var (
	ReExploreModeAll    = enum.New[ReExploreMode](1, "all")    // 全部重新检测
	ReExploreModeFailed = enum.New[ReExploreMode](2, "failed") // 仅重新检测失败任务
)

type DataFusionType enum.Object

var (
	DataFusionTypeNormal        = enum.New[DataFusionType](1, "normal")         // 常规方式
	DataFusionTypeSceneAnalysis = enum.New[DataFusionType](2, "scene_analysis") // 场景分析方式
)

type DataFusionCron enum.Object

var (
	DataFusionCronDays  = enum.New[DataFusionCron](1, "days", "0 0 0 * * ?")  // 每天
	DataFusionCronHours = enum.New[DataFusionCron](2, "hours", "0 0 * * * ?") // 每小时
)

// 需要同步到第三方的工单类型 int32
var SynchronizedWorkOrderTypes_Int32 = sets.New(
	WorkOrderTypeDataAggregation.Integer.Int32(),
	WorkOrderTypeStandardization.Integer.Int32(),
	WorkOrderTypeDataQualityAudit.Integer.Int32(),
	WorkOrderTypeDataFusion.Integer.Int32(),
)

type WorkOrderStatus enum.Object

var (
	WorkOrderStatusPendingSignature = enum.New[WorkOrderStatus](1, "pending_signature") // 待签收
	WorkOrderStatusSignedFor        = enum.New[WorkOrderStatus](2, "signed_for")        // 已签收
	WorkOrderStatusOngoing          = enum.New[WorkOrderStatus](3, "Ongoing")           // 进行中
	WorkOrderStatusFinished         = enum.New[WorkOrderStatus](4, "Completed")         // 已完成
)

type WorkOrderSourceType enum.Object

var (
	WorkOrderSourceTypePlan                 = enum.New[WorkOrderSourceType](1, "plan")                   // 计划
	WorkOrderSourceTypeBusinessForm         = enum.New[WorkOrderSourceType](2, "business_form")          // 业务表
	WorkOrderSourceTypeStandalone           = enum.New[WorkOrderSourceType](3, "standalone")             // 无，独立
	WorkOrderSourceTypeDataAnalysis         = enum.New[WorkOrderSourceType](4, "data_analysis")          // 数据分析
	WorkOrderSourceTypeFormView             = enum.New[WorkOrderSourceType](5, "form_view")              // 逻辑视图
	WorkOrderSourceTypeAggregationWorkOrder = enum.New[WorkOrderSourceType](6, "aggregation_work_order") // 归集工单
	WorkOrderSourceTypeSupplyAndDemand      = enum.New[WorkOrderSourceType](7, "supply_and_demand")      // 供需申请
	WorkOrderSourceTypeProject              = enum.New[WorkOrderSourceType](8, "project")                // 项目
)

type AuditStatus enum.Object

var (
	AuditStatusAuditing = enum.New[AuditStatus](1, "auditing") // 审核中
	AuditStatusUndone   = enum.New[AuditStatus](2, "undone")   // 撤销
	AuditStatusReject   = enum.New[AuditStatus](3, "reject")   // 拒绝
	AuditStatusPass     = enum.New[AuditStatus](4, "pass")     // 通过
	AuditStatusNone     = enum.New[AuditStatus](5, "none")     // 未发起审核
)

type DataType enum.Object

var (
	/*
		类型枚举与标准数据元一致
		4 时间戳型合并到日期型
		6 二进制
	*/

	DataTypeNumber   = enum.New[DataType](0, "数字型")
	DataTypeChar     = enum.New[DataType](1, "字符型")
	DataTypeDate     = enum.New[DataType](2, "日期型")
	DataTypeDateTime = enum.New[DataType](3, "日期时间型")
	DataTypeBool     = enum.New[DataType](5, "布尔型")
	DataTypeDecimal  = enum.New[DataType](7, "高精度型")
	DataTypeFloat    = enum.New[DataType](8, "小数型")
	DataTypeTime     = enum.New[DataType](9, "时间型")
	DataTypeINT      = enum.New[DataType](10, "整数型")
	DataTypeOther    = enum.New[DataType](99, "其他类型")
	DataTypeUnknown  = enum.New[DataType](-1, "未知类型")
)

const (
	TaskStatusFinished = "finished" // 已完成
	TaskStatusCanceled = "canceled" // 已取消
	TaskStatusFailed   = "failed"   // 异常
)

type RuleConfig struct {
	Null           []string        `json:"null" form:"null" binding:"omitempty,dive"`
	Format         *Format         `json:"format" form:"format" binding:"omitempty"`
	RuleExpression *RuleExpression `json:"rule_expression" form:"rule_expression" binding:"omitempty"`
	Filter         *RuleExpression `json:"filter" form:"filter" binding:"omitempty"`
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
	Member   []Member `json:"member" form:"member" binding:"omitempty,dive"` // 限定对象
	Relation string   `json:"relation" form:"relation" binding:"omitempty"`  // 限定关系
}

type Member struct {
	FieldId  string `json:"id" form:"id" binding:"required"`             // 字段对象
	NameEn   string `json:"name_en" form:"id" binding:"required"`        // 字段英文名
	Operator string `json:"operator" form:"operator" binding:"required"` // 限定条件
	Value    string `json:"value" form:"value" binding:"required"`       // 限定比较值
	DataType string `json:"data_type" form:"value" binding:"required"`   // 数据类型
}

func NewCreateWorkOrderMsg(workOrderId, workOrderType, createdBy string, createdAt int64) kafkax.RawMessage {
	header := kafkax.NewRawMessage()
	msg := kafkax.NewRawMessage()
	payload := kafkax.NewRawMessage()
	payload["work_order_id"] = workOrderId
	payload["type"] = workOrderType
	payload["created_by"] = createdBy
	payload["created_at"] = createdAt
	msg["payload"] = payload
	msg["header"] = header
	return msg
}

func NewUpdateWorkOrderMsg(workOrderId, detail string) kafkax.RawMessage {
	header := kafkax.NewRawMessage()
	msg := kafkax.NewRawMessage()
	payload := kafkax.NewRawMessage()
	payload["work_order_id"] = workOrderId
	payload["detail"] = detail
	msg["payload"] = payload
	msg["header"] = header
	return msg
}

func NewDeleteWorkOrderMsg(workOrderId string) kafkax.RawMessage {
	header := kafkax.NewRawMessage()
	msg := kafkax.NewRawMessage()
	payload := kafkax.NewRawMessage()
	payload["work_order_id"] = workOrderId
	msg["payload"] = payload
	msg["header"] = header
	return msg
}

type WorkOrderStatusV2 string

const (
	// 未派发
	WorkOrderStatusV2Unassigned WorkOrderStatusV2 = "Unassigned"
	// 进行中
	WorkOrderStatusV2Ongoing WorkOrderStatusV2 = "Ongoing"
	// 已完成
	WorkOrderStatusV2Completed = "Completed"
)

// WorkOrderStatusV2 与 WorkOrderStatus 的映射关系是 1:N 所以使用 map 定义就足够
//
// TODO: 可能还与工单的审核状态有关
var mappingWorkOrderStatusToWorkOrderStatusV2 = map[WorkOrderStatus]WorkOrderStatusV2{
	WorkOrderStatusPendingSignature: WorkOrderStatusV2Unassigned,
	WorkOrderStatusSignedFor:        WorkOrderStatusV2Unassigned,
	WorkOrderStatusOngoing:          WorkOrderStatusV2Ongoing,
	WorkOrderStatusFinished:         WorkOrderStatusV2Completed,
}

// WorkOrderStatusV2 -> []WorkOrderStatus
func WorkOrderStatusesForWorkOrderStatusV2(in WorkOrderStatusV2) (out []WorkOrderStatus) {
	for s, v2 := range mappingWorkOrderStatusToWorkOrderStatusV2 {
		if v2 != in {
			continue
		}
		out = append(out, s)
	}
	return
}

// WorkOrderStatus.Int32 -> WorkOrderStatusV2
func WorkOrderStatusV2ForWorkOrderStatusInt32(in int32) (out WorkOrderStatusV2) {
	for s, v2 := range mappingWorkOrderStatusToWorkOrderStatusV2 {
		if in != s.Integer.Int32() {
			continue
		}
		return v2
	}
	return
}

type AggregationForQualityAuditListReq struct {
	Offset           int      `json:"offset" form:"offset,default=1" binding:"omitempty,min=1" default:"1"`                           // 页码，默认1
	Limit            int      `json:"limit" form:"limit,default=10" binding:"omitempty,min=1,max=2000"  default:"10"`                 // 每页大小，默认10
	Direction        string   `json:"direction" form:"direction,default=desc" binding:"omitempty,oneof=asc desc" default:"desc"`      // 排序方向，枚举：asc：正序；desc：倒序。默认倒序
	Sort             string   `json:"sort" form:"sort,default=created_at" binding:"omitempty,oneof=created_at"  default:"created_at"` // 排序类型，枚举：created_at：按创建时间排序
	Keyword          string   `json:"keyword" form:"keyword" binding:"trimSpace,omitempty,min=1,max=255"`                             // 关键字查询，字符无限制
	SubDepartmentIDs []string `json:"-"`
}

type AggregationForQualityAuditListResp struct {
	PageResult[AggregationForQualityAuditItem]
}

type AggregationForQualityAuditItem struct {
	WorkOrderId           string   `json:"work_order_id"`          // 工单id
	Name                  string   `json:"name"`                   // 名称
	Code                  string   `json:"code"`                   // 工单编号
	ResponsibleUID        string   `json:"responsible_uid"`        // 责任人
	ResponsibleUName      string   `json:"responsible_uname"`      // 责任人名称
	ResponsibleDepartment []string `json:"responsible_department"` // 责任部门
}

type QualityAuditResourceReq struct {
	Offset       int    `json:"offset" form:"offset,default=1" binding:"omitempty,min=1" default:"1"`           // 页码，默认1
	Limit        int    `json:"limit" form:"limit,default=10" binding:"omitempty,min=1,max=2000"  default:"10"` // 每页大小，默认10
	Keyword      string `json:"keyword" form:"keyword" binding:"trimSpace,omitempty,min=1,max=255"`             // 关键字查询，字符无限制
	DatasourceId string `json:"datasource_id" form:"datasource_id" binding:"omitempty,uuid"`                    // 数据源id
}

type QualityAuditResourceResp struct {
	DatasourceInfos []*base.IDNameResp `json:"datasource_infos"`
	PageResult[data_view.ViewInfo]
}
