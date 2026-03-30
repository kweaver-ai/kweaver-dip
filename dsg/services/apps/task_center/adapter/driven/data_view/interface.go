package data_view

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/task_center/common/models/response"
)

type DataView interface {
	FinishProject(ctx context.Context, taskIds []string) error
	GetList(ctx context.Context, req *GetListReq) ([]*FormView, error)
	GetViewByTechnicalNameAndHuaAoId(ctx context.Context, req *GetViewByTechnicalNameAndHuaAoIdReq) (*GetViewFieldsResp, error)
	GetWorkOrderExploreProgress(ctx context.Context, workOrderIDs []string) (*WorkOrderExploreProgressResp, error)
}

type GetListReq struct {
	FormViewIdsString string `json:"form_view_ids" form:"form_view_ids" binding:"omitempty"` //逗号分隔
}

type GetListResp struct {
	response.PageResultNew[FormView]
	LastScanTime int64 `json:"last_scan_time"` // 最近一次扫描数据源的扫描时间(仅单个数据源返回)
	ExploreTime  int64 `json:"explore_time"`   // 最近一次探查数据源的探查时间(仅单个数据源返回)
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
}

// GetViewByTechnicalNameAndHuaAoIdReq 通过技术名称和华奥ID查询视图请求
type GetViewByTechnicalNameAndHuaAoIdReq struct {
	TechnicalName string `json:"technical_name" form:"technical_name" binding:"required" example:"user_table"` // 视图技术名称
	HuaAoID       string `json:"hua_ao_id" form:"hua_ao_id" binding:"required" example:"hua_ao_123456"`        // 华奥ID
}

// GetViewFieldsResp 查询视图字段响应结构
type GetViewFieldsResp struct {
	FormViewID    string             `json:"form_view_id"`
	BusinessName  string             `json:"business_name"`
	TechnicalName string             `json:"technical_name"`
	Fields        []*SimpleViewField `json:"fields"`
}

// SimpleViewField 简单视图字段结构
type SimpleViewField struct {
	ID               string `json:"id"`                 // 视图字段ID
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

type ExploreTaskStatusEntity struct {
	DataSourceID string `json:"data_source_id"` // 数据源ID
	FormViewID   string `json:"form_view_id"`   // 视图ID
	Status       string `json:"status"`         // 任务状态，1：queuing（等待中）；2：running（进行中）；3：finished（已完成）；4：canceled（已取消）；5：failed（异常）；
}

type WorkOrderExploreProgressEntity struct {
	WorkOrderId     string                     `json:"work_order_id"`     // 工单ID
	TotalTaskNum    int64                      `json:"total_task_num"`    // 总任务数
	FinishedTaskNum int64                      `json:"finished_task_num"` // 已完成任务数
	Entries         []*ExploreTaskStatusEntity `json:"entries"`           // 视图探查状态信息
}

type WorkOrderExploreProgressResp struct {
	Entries []*WorkOrderExploreProgressEntity `json:"entries"` // 工单探查任务进度
}
