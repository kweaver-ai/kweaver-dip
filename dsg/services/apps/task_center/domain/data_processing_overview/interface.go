package data_processing_overview

import (
	"context"
)

type DataProcessingOverview interface {
	GetOverview(ctx context.Context, req *GetOverviewReq) (*ProcessingGetOverviewRes, error)
	GetResultsTableCatalog(ctx context.Context, req *GetCatalogListsReq) (*CatalogListsResp, error)
	GetQualityTableDepartment(ctx context.Context, req *GetQualityTableDepartmentReq) (*GetQualityTableDepartmentResp, error)
	GetDepartmentQualityProcess(ctx context.Context, req *GetQualityTableDepartmentReq) (*GetDepartmentQualityProcessResp, error)
	GetProcessTask(ctx context.Context, req *GetOverviewReq) (*ProcessTaskDetail, error)
	GetTargetTable(ctx context.Context, req *GetOverviewReq) (*TargetTableDetail, error)
	SyncOverview(ctx context.Context) error
	Sync(ctx context.Context) error
}

type ProcessingGetOverviewRes struct {
	WorkOrderCount                           uint                         `json:"work_order_count"`                               //数据处理工单数量
	DataQualityAuditWorkOrderCount           uint                         `json:"data_quality_audit_work_order_count"`            //质量检测工单数量
	DataFusionWorkOrderCount                 uint                         `json:"data_fusion_work_order_count"`                   //数据融合工单数量
	FinishedWorkOrderCount                   uint                         `json:"finished_work_order_count"`                      //已完成工单数量
	FinishedDataQualityAuditWorkOrderCount   uint                         `json:"finished_data_quality_audit_work_order_count"`   //已完成质量检测工单数量
	FinishedDataFusionWorkOrderCount         uint                         `json:"finished_data_fusion_work_order_count"`          //已完成数据融合工单数量
	OngoingWorkOrderCount                    uint                         `json:"ongoing_work_order_count"`                       //进行中工单数量
	OngoingDataQualityAuditWorkOrderCount    uint                         `json:"ongoing_data_quality_audit_work_order_count"`    //进行中质量检测工单数量
	OngoingdDataFusionWorkOrderCount         uint                         `json:"ongoing_data_fusion_work_order_count"`           //进行中数据融合工单数量
	UnassignedWorkOrderCount                 uint                         `json:"unassigned_work_order_count"`                    //未派发工单数量
	UnassignedDataQualityAuditWorkOrderCount uint                         `json:"unassigned_data_quality_audit_work_order_count"` //未派发质量检测工单数量
	UnassignedDataFusionWorkOrderCount       uint                         `json:"unassigned_data_fusion_work_order_count"`        //未派发数据融合工单数量
	SourceTableDepartmentCount               uint                         `json:"source_table_department_count"`                  //来源表部门数量
	SourceTableCount                         uint                         `json:"source_table_count"`                             //来源表数量
	WorkOrderTaskCount                       uint                         `json:"work_order_task_count"`                          //加工任务数量
	TargetTableDepartmentCount               uint                         `json:"target_table_department_count"`                  //成果表部门数量
	TargetTableCount                         uint                         `json:"target_table_count"`                             //成果表数量
	TableDepartmentCount                     uint                         `json:"table_department_count"`                         //应检测部门数量
	TableCount                               uint                         `json:"table_count"`                                    //应检测表数量
	QualitiedTableCount                      uint                         `json:"qualitied_table_count"`                          //已检测表数量
	ProcessedTableCount                      uint                         `json:"processed_table_count"`                          //已整改表数量
	QuestionTableCount                       uint                         `json:"question_table_count"`                           //问题表数量
	StartProcessTableCount                   uint                         `json:"start_process_table_count"`                      //已响应表数量
	ProcessingTableCount                     uint                         `json:"processing_table_count"`                         //整改中表数量
	NotProcessTableCount                     uint                         `json:"not_process_table_count"`                        //未整改表数量
	QualityStatusByDepartment                []*QualityStatusByDepartment `json:"department_quality_status"`                      //部门整改情况
	Errors                                   []string                     `json:"errors"`
}

type QualityStatusByDepartment struct {
	DepartmentID        string `json:"department_id"`         //部门id
	DepartmentName      string `json:"department_name"`       //部门名称
	QuestionTableCount  uint   `json:"question_table_count"`  //待整改表数量
	ProcessedTableCount uint   `json:"processed_table_count"` //已整改表数量
	QualityRate         string `json:"quality_rate"`          //整改率
}

type MD struct {
	MyDepartment     bool     `json:"my_department" form:"my_department"` //本部门
	SubDepartmentIDs []string `json:"-"`
}

type GetOverviewReq struct {
	MD
}

type PageResult[T any] struct {
	Entries    []*T  `json:"entries" binding:"required"`                       // 对象列表
	TotalCount int64 `json:"total_count" binding:"required,gte=0" example:"3"` // 当前筛选条件下的对象数量
}

type GetCatalogListsReq struct {
	MD
	SubjectId string `json:"subject_id" form:"subject_id" binding:"omitempty"`                               // 主题id
	Offset    int    `json:"offset" form:"offset,default=1" binding:"omitempty,min=1" default:"1"`           // 页码，默认1
	Limit     int    `json:"limit" form:"limit,default=10" binding:"omitempty,min=1,max=2000"  default:"10"` // 每页大小，默认10
}

// Keyword      string `json:"keyword" form:"keyword" binding:"omitempty"`

// SubjectName string `json:"subject" binding:"omitempty, oneof=human place object organization other" example:"所属主题"` // 所属主题 (human place object organization other)对应人地事物组织其他 ，不传为所有

type CatalogListsResp struct {
	PageResult[CatalogList]
}

type CatalogList struct {
	Name              string      `json:"name" example:"数据资源目录名称"`                                  // 目录名称
	Resource          []*Resource `json:"resource"`                                                 // 挂载资源
	Department        string      `json:"department"`                                               //所属部门
	CompletenessScore *float64    `json:"completeness_score"`                                       //完整性维度评分，缺省为NULL
	TimelinessScore   *float64    `json:"timeliness_score"`                                         //及时性评分，缺省为NULL
	AccuracyScore     *float64    `json:"accuracy_score"`                                           //准确性维度评分，缺省为NULL
	SyncMechanism     int8        `json:"sync_mechanism" binding:"omitempty,oneof=1 2" example:"2"` //更新方式(1 增量 ; 2 全量)
	UpdatedAt         int64       `json:"updated_at"`                                               //最新更新时间
}

type Resource struct {
	ResourceType  int8 `json:"resource_type"`  // 资源类型 1逻辑视图 2 接口 3 文件资源
	ResourceCount int  `json:"resource_count"` // 资源数量
}

type Report struct {
	CompletenessScore *float64 `json:"completeness_score"` //完整性维度评分，缺省为NULL
	TimelinessScore   *float64 `json:"timeliness_score"`   //及时性评分，缺省为NULL
	AccuracyScore     *float64 `json:"accuracy_score"`     //准确性维度评分，缺省为NULL
}

type GetQualityTableDepartmentReq struct {
	MD
	Keyword   string `json:"keyword" form:"keyword" binding:"omitempty,min=1,max=500"`                               // 关键字查询
	Offset    int    `json:"offset" form:"offset,default=1" binding:"omitempty,min=1" default:"1"`                   // 页码，默认1
	Limit     int    `json:"limit" form:"limit,default=10" binding:"omitempty,min=1,max=2000"  default:"10"`         // 每页大小，默认10
	Direction string `json:"direction" form:"direction,default=desc" binding:"oneof=asc desc"`                       // 排序方向
	Sort      string `form:"sort,default=created_at" binding:"omitempty,oneof=name created_at" default:"created_at"` // 排序类型, 按名称和时间，默认按照名称
}

type GetQualityTableDepartmentResp struct {
	Entries    []*QualityTableDepartmentLists `json:"entries" binding:"required"` // 对象列表
	Errors     []string                       `json:"errors"`
	TotalCount int64                          `json:"total_count" binding:"required,gte=0" example:"3"` // 当前筛选条件下的对象数量
}

type QualityTableDepartmentLists struct {
	DepartmentID           string `json:"department_id"`             //部门id
	DepartmentName         string `json:"department_name"`           //部门名称
	TableCount             uint   `json:"table_count"`               //应检测表数量
	QualitiedTableCount    uint   `json:"qualitied_table_count"`     //已检测表数量
	ProcessedTableCount    uint   `json:"processed_table_count"`     //已整改表数量
	QuestionTableCount     uint   `json:"question_table_count"`      //问题表数量
	StartProcessTableCount uint   `json:"start_process_table_count"` //已响应表数量
	ProcessingTableCount   uint   `json:"processing_table_count"`    //整改中表数量
	NotProcessTableCount   uint   `json:"not_process_table_count"`   //未整改表数量
}

type GetDepartmentQualityProcessReq struct {
	MD
	Keyword string `json:"keyword" form:"keyword" binding:"omitempty,min=1,max=500"`                       // 关键字查询
	Offset  int    `json:"offset" form:"offset,default=1" binding:"omitempty,min=1" default:"1"`           // 页码，默认1
	Limit   int    `json:"limit" form:"limit,default=10" binding:"omitempty,min=1,max=2000"  default:"10"` // 每页大小，默认10
}

type GetDepartmentQualityProcessResp struct {
	Entries    []*QualityStatusByDepartment `json:"entries" binding:"required"` // 对象列表
	Errors     []string                     `json:"errors"`
	TotalCount int64                        `json:"total_count" binding:"required,gte=0" example:"3"` // 当前筛选条件下的对象数量
}

type TargetTableDetail struct {
	WorkOrderTaskCount    uint     `json:"work_order_task_count"`    //任务总数
	StandaloneTaskCount   uint     `json:"standalone_task_count"`    //数据分析任务总数
	PlanTaskCount         uint     `json:"plan_task_count"`          //处理计划任务总数
	DataAnalysisTaskCount uint     `json:"data_analysis_task_count"` //日常任务总数
	Errors                []string `json:"errors"`
}

type ProcessTaskDetail struct {
	WorkOrderTaskCount    uint     `json:"work_order_task_count"`    //任务总数
	RunningTaskCount      uint     `json:"running_task_count"`       //进行中任务总数
	CompletedCount        uint     `json:"completed_task_count"`     //已完成任务总数
	FailedTaskCount       uint     `json:"failed_task_count"`        //异常总数
	StandaloneTaskCount   uint     `json:"standalone_task_count"`    //数据分析任务总数
	PlanTaskCount         uint     `json:"plan_task_count"`          //处理计划任务总数
	DataAnalysisTaskCount uint     `json:"data_analysis_task_count"` //日常任务总数
	Errors                []string `json:"errors"`
}

type DCount struct {
	DepartmentID string `json:"department_id"`
	Count        uint   `json:"count"`
}
