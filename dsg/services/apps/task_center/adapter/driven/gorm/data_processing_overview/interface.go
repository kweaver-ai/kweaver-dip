package data_processing_overview

import (
	"context"
	"time"

	domain "github.com/kweaver-ai/dsg/services/apps/task_center/domain/data_processing_overview"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
)

type DataProcessingOverviewRepo interface {
	GetOverview(ctx context.Context, req *domain.GetOverviewReq) (*domain.ProcessingGetOverviewRes, error)
	GetResultsTableCatalog(ctx context.Context, req *domain.GetCatalogListsReq) ([]*TDataCatalog, int64, error)
	GetTargetTable(ctx context.Context, req *domain.GetOverviewReq) (*domain.TargetTableDetail, error)
	GetProcessTask(ctx context.Context, req *domain.GetOverviewReq) (*domain.ProcessTaskDetail, error)
	GetByCatalogIds(ctx context.Context, catalogId ...uint64) (dataResource []*TDataResource, err error)
	GetQualityTableDepartment(ctx context.Context, req *domain.GetQualityTableDepartmentReq) (*domain.GetQualityTableDepartmentResp, []string)
	GetDepartmentQualityProcess(ctx context.Context, req *domain.GetDepartmentQualityProcessReq) (*domain.GetDepartmentQualityProcessResp, []string)
	GetDepartmentByIds(ctx context.Context, departmentIds ...string) (departments []*Object, err error)
	GetReportByviewIds(ctx context.Context, viewId ...string) (report []*Report, err error)
	GetAllDepartmentIds(ctx context.Context) (departmentIds []string, err error)
	CreateQualityOverview(ctx context.Context, workOrderQualityOverviews []*model.WorkOrderQualityOverview) error
	CetQualityOverview(ctx context.Context) (*model.WorkOrderQualityOverview, error)
	CetQualityOverviewList(ctx context.Context, req *domain.GetQualityTableDepartmentReq) (int64, []*model.WorkOrderQualityOverviewAndDepartmentName, error)
	GetDepartmentQualityProcessList(ctx context.Context, req *domain.GetQualityTableDepartmentReq) (int64, []*model.WorkOrderQualityOverviewAndDepartmentName, error)
	CheckSyncQualityOverview(ctx context.Context) (err error)
}

type TDataCatalog struct {
	ID            uint64    `gorm:"column:id" json:"id,string"`                            // 唯一id，雪花算法
	Name          string    `gorm:"column:name;not null" json:"name"`                      // 目录名称
	Department    string    `json:"department"`                                            // 所属部门
	DepartmentID  string    `gorm:"column:department_id;not null" json:"department_id"`    // 所属部门ID
	SyncMechanism int8      `gorm:"column:sync_mechanism" json:"sync_mechanism,omitempty"` // 数据归集机制(1 增量 ; 2 全量) ----归集到数据中台
	ViewId        string    `gorm:"column:view_id;not null" json:"view_id"`                // 挂在库表名称
	UpdatedAt     time.Time `gorm:"column:updated_at;not null" json:"updated_at"`          // 更新时间                                                                                                                                    // 申请量
}

type TDataResource struct {
	ID             uint64     `gorm:"column:id" json:"id"`                                       // 标识
	ResourceId     string     `gorm:"column:resource_id;not null" json:"resource_id"`            // 数据资源id
	Name           string     `gorm:"column:name;not null" json:"name"`                          // 数据资源名称
	Code           string     `gorm:"column:code;not null" json:"code"`                          // 统一编目编码
	Type           int8       `gorm:"column:type;not null" json:"type"`                          // 数据资源类型 枚举值 1：逻辑视图 2：接口 3:文件资源
	ViewId         string     `gorm:"column:view_id" json:"view_id"`                             // 数据资源类型 为 2：接口 时候类型为接口生成方式来源视图id
	InterfaceCount int        `gorm:"column:interface_count" json:"interface_count"`             // 生成接口数量
	DepartmentId   string     `gorm:"column:department_id;not null" json:"department_id"`        // 所属部门id
	SubjectId      string     `gorm:"column:subject_id" json:"subject_id"`                       // 所属主题id
	RequestFormat  string     `gorm:"column:request_format;not null" json:"request_format"`      // 请求报文格式
	ResponseFormat string     `gorm:"column:response_format;not null" json:"response_format"`    // 响应报文格式
	CatalogID      uint64     `gorm:"column:catalog_id;not null" json:"catalog_id"`              // 数据资源目录ID
	PublishAt      *time.Time `gorm:"column:publish_at;not null" json:"publish_at"`              // 发布时间
	SchedulingPlan int32      `gorm:"column:scheduling_plan" json:"scheduling_plan"`             // 调度计划 1 一次性、2按分钟、3按天、4按周、5按月
	Interval       int32      `gorm:"column:interval" json:"interval"`                           // 间隔
	Time           string     `gorm:"column:time" json:"time"`                                   // 时间
	Status         int8       `gorm:"column:status;not null;comment:视图状态,1正常,2删除" json:"status"` // 视图状态,1正常,2删除

}

type Object struct {
	ID     string `gorm:"column:id" json:"id"`                    // 对象ID
	Name   string `gorm:"column:name;not null" json:"name"`       // 对象名称
	PathID string `gorm:"column:path_id;not null" json:"path_id"` // 路径ID
	Path   string `gorm:"column:path;not null" json:"path"`       // 路径
	Type   int32  `gorm:"column:type" json:"type"`                // 类型
}

type Report struct {
	ID                   uint64     `gorm:"column:f_id;comment:主键id" json:"id"`                                          // 主键id
	Code                 *string    `gorm:"column:f_code;comment:探查报告编号" json:"code"`                                    // 探查报告编号
	TaskID               uint64     `gorm:"column:f_task_id;not null;comment:任务配置记录id" json:"task_id"`                   // 任务配置记录id
	TaskVersion          *int32     `gorm:"column:f_task_version;comment:任务配置版本" json:"task_version"`                    // 任务配置版本
	QueryParams          *string    `gorm:"column:f_query_params;comment:探查任务请求参数，json格式字符串" json:"query_params"`        // 探查任务请求参数，json格式字符串
	ExploreType          *int32     `gorm:"column:f_explore_type;comment:探查类型" json:"explore_type"`                      // 探查类型
	Table                *string    `gorm:"column:f_table;comment:表名" json:"table"`                                      // 表名
	TableID              *string    `gorm:"column:f_table_id;comment:表id" json:"table_id"`                               // 表id
	Schema               *string    `gorm:"column:f_schema;comment:库名" json:"schema"`                                    // 库名
	VeCatalog            *string    `gorm:"column:f_ve_catalog;comment:虚拟化引擎数据源编目" json:"ve_catalog"`                    // 虚拟化引擎数据源编目
	TotalSample          *int32     `gorm:"column:f_total_sample;comment:探查样本数量" json:"total_sample"`                    // 探查样本数量
	TotalNum             *int32     `gorm:"column:f_total_num;comment:探查表总行数" json:"total_num"`                          // 探查表总行数
	TotalScore           *float64   `gorm:"column:f_total_score;comment:探查分数" json:"total_score"`                        // 探查分数
	Result               *string    `gorm:"column:f_result;comment:探查结果" json:"result"`                                  // 探查结果
	Status               *int32     `gorm:"column:f_status;comment:报告状态" json:"status"`                                  // 报告状态
	Latest               int32      `gorm:"column:f_latest;not null;comment:最近一次探查结果" json:"latest"`                     // 最近一次探查结果
	CreatedAt            *time.Time `gorm:"column:f_created_at;comment:创建时间" json:"created_at"`                          // 创建时间
	CreatedByUID         *string    `gorm:"column:f_created_by_uid;comment:创建人" json:"created_by_uid"`                   // 创建人
	CreatedByUname       *string    `gorm:"column:f_created_by_uname;comment:创建人中文名" json:"created_by_uname"`            // 创建人中文名
	FinishedAt           *time.Time `gorm:"column:f_finished_at;comment:完成时间" json:"finished_at"`                        // 完成时间
	Reason               *string    `gorm:"column:f_reason;comment:探查异常说明" json:"reason"`                                // 探查异常说明
	DvTaskID             *string    `gorm:"column:f_dv_task_id;comment:data-view任务id" json:"dv_task_id"`                 // data-view任务id
	TotalCompleteness    *float64   `gorm:"column:f_total_completeness;comment:完整性总分" json:"f_total_completeness"`       // 完整性总分
	TotalStandardization *float64   `gorm:"column:f_total_standardization;comment:规范性总分" json:"f_total_standardization"` // 规范性总分
	TotalUniqueness      *float64   `gorm:"column:f_total_uniqueness;comment:唯一性总分" json:"f_total_uniqueness"`           // 唯一性总分
	TotalAccuracy        *float64   `gorm:"column:f_total_accuracy;comment:准确性总分" json:"f_total_accuracy"`               // 准确性总分
	TotalConsistency     *float64   `gorm:"column:f_total_consistency;comment:一致性总分" json:"f_total_consistency"`         // 一致性总分
}
