package data_quality

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/task_center/domain/work_order"
	"github.com/kweaver-ai/idrm-go-frame/core/enum"
)

type DataQualityUseCase interface {
	ReportList(ctx context.Context, query *ReportListReq) (*ReportListResp, error)
	Improvement(ctx context.Context, query *ImprovementReq) (*ImprovementResp, error)
	QueryStatus(ctx context.Context, query *DataQualityStatusReq) (*DataQualityStatusResp, error)
	ReceiveQualityReport(ctx context.Context, req *ReceiveQualityReportReq) error
}

type ReportListReq struct {
	Offset      *int   `json:"offset" form:"offset,default=1" binding:"omitempty,min=1" default:"1"`           // 页码，默认1
	Limit       *int   `json:"limit" form:"limit,default=10" binding:"omitempty,min=1,max=2000"  default:"10"` // 每页大小，默认10
	Keyword     string `json:"keyword" form:"keyword" binding:"trimSpace,omitempty,min=1,max=255"`             // 关键字查询，字符无限制
	CatalogName string `json:"catalog_name" form:"catalog_name" binding:"omitempty"`                           // 数据源名称
}

type ReportListResp struct {
	PageResult[ReportInfo]
}

type ReportInfo struct {
	FormViewID            string `json:"form_view_id"`            // 逻辑视图uuid
	UniformCatalogCode    string `json:"uniform_catalog_code"`    // 逻辑视图编码
	TechnicalName         string `json:"technical_name"`          // 表技术名称
	BusinessName          string `json:"business_name"`           // 表业务名称
	Type                  string `json:"type"`                    // 逻辑视图来源
	DatasourceId          string `json:"datasource_id"`           // 数据源id
	Datasource            string `json:"datasource"`              // 数据源
	DatasourceType        string `json:"datasource_type"`         // 数据源类型
	DatasourceCatalogName string `json:"datasource_catalog_name"` // 数据源catalog
	DepartmentID          string `json:"department_id"`           // 所属部门id
	Department            string `json:"department"`              // 所属部门
	DepartmentPath        string `json:"department_path"`         // 所属部门路径
	OwnerID               string `json:"owner_id"`                // 数据Owner id
	Owner                 string `json:"owner"`                   // 数据Owner
	ReportID              string `json:"report_id"`               // 来源报告id
	ReportVersion         int32  `json:"report_version"`          // 来源报告版本
	ReportAt              int64  `json:"report_at"`               // 报告生成时间
	Status                string `json:"status"`                  // 整改状态，not_add未整改过，added已创建质量工单
}

type PageResult[T any] struct {
	Entries    []*T  `json:"entries" binding:"required"`                       // 对象列表
	TotalCount int64 `json:"total_count" binding:"required,gte=0" example:"3"` // 当前筛选条件下的对象数量
}

type ImprovementReq struct {
	WorkOrderId string `json:"work_order_id" form:"work_order_id"  binding:"omitempty"` // 工单id
}

type ImprovementResp struct {
	Before         []*work_order.ImprovementInfo `json:"before"`           // 整改前报告信息
	After          []*work_order.ImprovementInfo `json:"after"`            // 整改后报告信息
	BeforeReportAt int64                         `json:"before_report_at"` // 整改前报告生成时间
	AfterReportAt  int64                         `json:"after_report_at"`  // 整改后报告生成时间
}

type FieldInfo struct {
	ID            string `json:"id"`             // 列uuid
	TechnicalName string `json:"technical_name"` // 列技术名称
	BusinessName  string `json:"business_name"`  // 列业务名称
	DataType      string `json:"data_type"`      // 数据类型
}

type DataQualityStatusReq struct {
	FormViewIDS string `json:"form_view_ids" form:"form_view_ids"  binding:"omitempty"` // 逻辑视图id,逗号分隔
}

type DataQualityStatusResp struct {
	PageResult[DataQualityStatusInfo]
}

type DataQualityStatusInfo struct {
	FormViewID    string `json:"form_view_id"`    // 逻辑视图uuid
	WorkOrderID   string `json:"work_order_id"`   // 工单id
	WorkOrderName string `json:"work_order_name"` // 工单名称
	Status        string `json:"status"`          // 整改状态，not_add未整改过，added已创建质量工单
}

type ImprovementStatus enum.Object

var (
	ImprovementStatusNotAdd = enum.New[ImprovementStatus](1, "not_add") // 未发起整改
	ImprovementStatusAdded  = enum.New[ImprovementStatus](2, "added")   // 已发起整改
)

type Dimension enum.Object

var (
	DimensionCompleteness    = enum.New[Dimension](1, "completeness")    // 完整性
	DimensionStandardization = enum.New[Dimension](2, "standardization") // 规范性
	DimensionUniqueness      = enum.New[Dimension](3, "uniqueness")      // 唯一性
	DimensionAccuracy        = enum.New[Dimension](4, "accuracy")        // 准确性
	DimensionConsistency     = enum.New[Dimension](5, "consistency")     // 一致性
	DimensionTimeliness      = enum.New[Dimension](6, "timeliness")      // 及时性
	DimensionDataStatistics  = enum.New[Dimension](7, "data_statistics") // 数据统计
)

type ReceiveQualityReportReq struct {
	DataSource  string     `json:"datasource_id" binding:"required"` // 数据源id
	FinishedAt  int64      `json:"finished_at" binding:"required"`   // 报告完成时间
	FormName    string     `json:"form_name" binding:"required"`     // 表名称
	TableID     string     `json:"table_id" binding:"omitempty"`     // 表ID
	InstanceID  string     `json:"instance_id" binding:"required"`   // 实例id
	Rules       []RuleInfo `json:"rules" binding:"required"`         // 规则列表
	WorkOrderID string     `json:"work_order_id" binding:"required"` // 工单id
	TenantID    string     `json:"tenant_id" binding:"omitempty"`    // 租户id
}

type RuleInfo struct {
	FieldName      string `json:"field_name"`                   // 字段名称
	InspectedCount int    `json:"inspected_count"`              // 检测数量
	IssueCount     int    `json:"issue_count"`                  // 问题数量
	RuleID         string `json:"rule_id"`                      // 规则ID
	RuleName       string `json:"rule_name"`                    // 规则名称
	FieldID        string `json:"field_id" binding:"omitempty"` // 字段ID
}
