package explore_task

import (
	"context"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/data-view/common/constant"
	"github.com/kweaver-ai/idrm-go-frame/core/enum"
)

type ExploreTaskUseCase interface {
	CreateTask(ctx context.Context, req *CreateTaskReq) (*CreateTaskResp, error)
	ExecExplore(ctx context.Context, taskId, userId, userName string) error
	List(ctx context.Context, req *ListExploreTaskReq) (*ListExploreTaskResp, error)
	GetTask(ctx context.Context, req *GetTaskReq) (*ExploreTaskResp, error)
	CancelTask(ctx context.Context, req *CancelTaskReq) (*ExploreTaskIDResp, error)
	DeleteRecord(ctx context.Context, req *DeleteRecordReq) (*ExploreTaskIDResp, error)
	CreateRule(ctx context.Context, req *CreateRuleReq) (*RuleIDResp, error)
	GetRuleList(ctx context.Context, req *GetRuleListReq) ([]*GetRuleResp, error)
	GetRule(ctx context.Context, req *GetRuleReq) (*GetRuleResp, error)
	NameRepeat(ctx context.Context, req *NameRepeatReq) (bool, error)
	UpdateRule(ctx context.Context, req *UpdateRuleReq) (*RuleIDResp, error)
	UpdateRuleStatus(ctx context.Context, req *UpdateRuleStatusReq) (bool, error)
	DeleteRule(ctx context.Context, req *DeleteRuleReq) (*RuleIDResp, error)
	GetInternalRule(ctx context.Context) ([]*GetInternalRuleResp, error)
	CreateWorkOrderTask(ctx context.Context, req *CreateWorkOrderTaskReq) (*CreateWorkOrderTaskResp, error)

	GetWorkOrderExploreProgress(ctx context.Context, req *WorkOrderExploreProgressReq) (*WorkOrderExploreProgressResp, error)
}

type WorkOrderExploreProgressReq struct {
	ListExploreProgressReq `param_type:"query"`
}

type ListExploreProgressReq struct {
	WorkOrderIds string `form:"work_order_ids" binding:"TrimSpace,required"` // 工单IDs，多个工单ID用逗号分隔
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

//region CreateTask

type CreateTaskReq struct {
	CreateTaskReqBody `param_type:"body"`
}

type CreateTaskReqBody struct {
	DatasourceID string   `json:"datasource_id" form:"datasource_id" binding:"omitempty,uuid" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"` // 数据源id
	FormViewID   string   `json:"form_view_id" form:"form_view_id" binding:"omitempty,uuid" example:"13b8a80b-1914-4896-99d8-51559dba26c4"`   // 视图id
	Type         string   `json:"type" form:"type" binding:"required,oneof=explore_data explore_timestamp explore_classification"`            // 探查类型，"explore_data","explore_timestamp","explore_classification"
	Config       string   `json:"config" form:"config" binding:"required_if=Type explore_data,omitempty"`                                     // 探查配置
	SubjectIDS   []string `json:"subject_ids" form:"subject_ids" binding:"omitempty"`                                                         // 分类属性id数组
}

type CreateTaskResp struct {
	TaskID string `json:"task_id"` // 探查任务id
}

type DatasourceExploreDataConfig struct {
	Strategy       string                 `json:"strategy"`     // 探查策略，"all","not_explored","rules_configured"
	FieldConf      []ExploreFieldTypeConf `json:"field"`        // 字段类型探查配置
	MetadataConfig *MetadataConfig        `json:"metadata"`     // 元数据级探查配置
	ViewConfig     *ViewConfig            `json:"view"`         // 视图级探查配置
	TotalSample    int64                  `json:"total_sample"` // 采样数据量,0为全量数据
}

type ExploreFieldTypeConf struct {
	FieldType string      `json:"field_type"` // 字段类型
	Rules     []*RuleInfo `json:"rules"`      // 字段探查规则
}

type MetadataConfig struct {
	Rules []*RuleInfo `json:"rules"` // 探查规则
}

type ViewConfig struct {
	Rules []*RuleInfo `json:"rules"` // 探查规则
}

type RuleInfo struct {
	RuleId          string  `json:"rule_id"`        // 模板规则id
	Dimension       string  `json:"dimension"`      // 维度
	DimensionType   string  `json:"dimension_type"` // 维度类型
	RuleConfig      *string `json:"rule_config"`    // 规则配置
	RuleDescription string  `json:"rule_description"`
}

type FormViewExploreDataConfig struct {
	MetadataConfig *Metadata           `json:"metadata"`                                             // 元数据级探查配置
	RowConfig      *Row                `json:"row"`                                                  // 行级探查配置
	ViewConfig     *View               `json:"view"`                                                 // 视图级探查配置
	FieldConf      []*ExploreFieldConf `json:"field" binding:"required,dive,Min=1"`                  // 字段探查配置
	TotalSample    int64               `json:"total_sample" form:"total_sample" binding:"omitempty"` // 采样数据量,0为全量数据
}

type Metadata struct {
	Rules []*RuleConfigInfo `json:"rules"` // 探查规则
}

type Row struct {
	Rules []*RuleConfigInfo `json:"rules"` // 探查规则
}

type View struct {
	Rules []*RuleConfigInfo `json:"rules"` // 探查规则
}

type ExploreFieldConf struct {
	FieldId   string            `json:"field_id" form:"field_id"  binding:"required"`
	FieldName *string           `json:"field_name" form:"field_name"  binding:"required"`
	Rules     []*RuleConfigInfo `json:"rules" form:"rules"  binding:"omitempty,dive"`
}

type RuleConfigInfo struct {
	RuleId          string  `json:"rule_id"`          // 规则id
	RuleName        string  `json:"rule_name"`        // 规则名称
	RuleDescription *string `json:"rule_description"` // 规则描述
	Dimension       string  `json:"dimension"`        // 维度
	DimensionType   string  `json:"dimension_type"`   // 维度类型
	RuleConfig      *string `json:"rule_config"`      // 规则配置
}

//endregion

//region List

type ListExploreTaskReq struct {
	ListExploreTask `param_type:"query"`
}

type ListExploreTask struct {
	Offset      *int   `json:"offset" form:"offset" binding:"omitempty"`                                                         // 页码，默认1
	Limit       *int   `json:"limit" form:"limit" binding:"omitempty"`                                                           // 每页大小，默认10
	Direction   string `json:"direction" form:"direction,default=desc" binding:"oneof=asc desc" default:"desc"`                  // 排序方向，枚举：asc：正序；desc：倒序。默认倒序
	Sort        string `json:"sort" form:"sort,default=created_at" binding:"oneof=created_at finished_at"  default:"created_at"` // 排序类型，枚举：created_at：按创建时间排序
	Keyword     string `json:"keyword" form:"keyword" binding:"KeywordTrimSpace,omitempty,min=1,max=255"`                        // 关键字查询，字符无限制
	Status      string `json:"status" form:"status" binding:"omitempty,VerifyMultiTaskStatus"`                                   // 任务状态，枚举 "queuing" "running" "finished" "canceled" "failed"可以多选，逗号分隔
	Type        string `json:"type" form:"type" binding:"omitempty"`                                                             // 探查类型，"explore_data","explore_timestamp","explore_classification"
	WorkOrderId string `json:"work_order_id" form:"work_order_id" binding:"omitempty,uuid"`                                      // 工单id
}

type ListExploreTaskResp struct {
	Entries    []*ExploreTaskInfo `json:"entries"`     // 对象列表
	TotalCount int64              `json:"total_count"` // 当前筛选条件下的对象数量
}

type ExploreTaskInfo struct {
	TaskID         string `json:"task_id"`         // 任务id
	Type           string `json:"type"`            // 任务类型
	DatasourceID   string `json:"datasource_id"`   // 数据源id
	DatasourceName string `json:"datasource_name"` // 数据源名称
	DatasourceType string `json:"datasource_type"` // 数据源类型
	FormViewID     string `json:"form_view_id"`    // 视图id
	FormViewName   string `json:"form_view_name"`  // 视图名称
	FormViewType   string `json:"form_view_type"`  // 视图类型
	Status         string `json:"status"`          // 任务状态
	Config         string `json:"config"`          // 探查配置
	CreatedAt      int64  `json:"created_at"`      // 开始时间
	CreatedBy      string `json:"created_by"`      // 发起人
	FinishedAt     int64  `json:"finished_at"`     // 结束时间
	Remark         string `json:"remark"`          // 异常原因
}

type TaskInfo struct {
	TaskID         string     `json:"task_id"`         // 任务id
	Type           int32      `json:"type"`            // 任务类型
	DatasourceID   string     `json:"datasource_id"`   // 数据源id
	DatasourceName string     `json:"datasource_name"` // 数据源名称
	DatasourceType string     `json:"datasource_type"` // 数据源类型
	FormViewID     string     `json:"form_view_id"`    // 视图id
	FormViewName   string     `json:"form_view_name"`  // 视图名称
	FormViewType   int32      `json:"form_view_type"`  // 视图类型
	Status         int32      `json:"status"`          // 任务状态
	Config         string     `json:"config"`          // 探查配置
	CreatedAt      time.Time  `json:"created_at"`      // 开始时间
	CreatedBy      string     `json:"created_by"`      // 发起人
	FinishedAt     *time.Time `json:"finished_at"`     // 结束时间
	Remark         string     `json:"remark"`          // 异常原因
}

//endregion

//region GetTask

type IDReqParamPath struct {
	TaskID string `json:"id" uri:"id" binding:"required,uuid" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"` // 探查任务id
}

type GetTaskReq struct {
	IDReqParamPath `param_type:"path"`
}

type ExploreTaskResp struct {
	ExploreTaskInfo
}

//endregion

//region CancelTask

type CancelTaskReq struct {
	IDReqParamPath    `param_type:"path"`
	CancelTaskReqBody `param_type:"body"`
}

type CancelTaskReqBody struct {
	Status string `json:"status"  form:"status" binding:"required" example:"canceled"` // 探查状态
}

type ExploreTaskIDResp struct {
	TaskID string `json:"task_id"` // 探查任务id
}

//endregion

//region DeleteRecord

type DeleteRecordReq struct {
	IDReqParamPath `param_type:"path"`
}

//endregion

//region CreateRuleReq

type CreateRuleReq struct {
	CreateRuleReqBody `param_type:"body"`
}

type CreateRuleReqBody struct {
	TemplateId      string  `json:"template_id" form:"template_id" binding:"omitempty,uuid" example:"3d397df3-d1af-4126-b3ad-539fd7ae2f54"`                       // 模板id
	FormViewId      string  `json:"form_view_id" form:"form_view_id" binding:"omitempty,uuid" example:"13b8a80b-1914-4896-99d8-51559dba26c4"`                     // 视图id
	FieldId         string  `json:"field_id" form:"field_id" binding:"omitempty,uuid" example:"962b749f-32e6-41d1-bd79-33ce839a8598"`                             // 字段id
	RuleName        string  `json:"rule_name" form:"rule_name" binding:"omitempty,min=1,max=128"`                                                                 // 规则名称
	RuleDescription string  `json:"rule_description" form:"rule_description" binding:"omitempty,min=1,max=300"`                                                   // 规则描述
	RuleLevel       string  `json:"rule_level" form:"rule_level" binding:"omitempty,oneof=metadata field row view"`                                               // 规则级别，元数据级 字段级 行级 视图级
	Dimension       string  `json:"dimension" form:"dimension" binding:"omitempty,oneof=completeness standardization uniqueness accuracy consistency timeliness"` // 维度，完整性 规范性 唯一性 准确性 一致性 及时性 数据统计
	RuleConfig      *string `json:"rule_config" form:"rule_config" binding:"omitempty"`                                                                           // 规则配置
	Enable          *bool   `json:"enable" form:"enable" binding:"required"`                                                                                      // 是否启用
}

type RuleIDResp struct {
	RuleID string `json:"rule_id"` // 规则id
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

type Member struct {
	FieldId  string `json:"id" form:"id" binding:"required"`             // 字段对象
	Operator string `json:"operator" form:"operator" binding:"required"` // 限定条件
	Value    string `json:"value" form:"value" binding:"required"`       // 限定比较值
}

type RowNull struct {
	FieldIds []string `json:"field_ids" form:"field_ids" binding:"required,dive,uuid,unique"`
	Config   []string `json:"config" form:"config" binding:"required,dive"`
}

type RowRepeat struct {
	FieldIds []string `json:"field_ids" form:"field_ids" binding:"required,dive,uuid,unique"`
}

//endregion

//region GetRuleListReq

type GetRuleListReq struct {
	GetRuleListReqQuery `param_type:"query"`
}

type GetRuleListReqQuery struct {
	FormViewId string `json:"form_view_id" form:"form_view_id" binding:"omitempty,uuid" example:"13b8a80b-1914-4896-99d8-51559dba26c4"`                                     // 视图id
	RuleLevel  string `json:"rule_level" form:"rule_level" binding:"omitempty,oneof=metadata field row view"`                                                               // 规则级别，元数据级 字段级 行级 视图级
	Dimension  string `json:"dimension" form:"dimension" binding:"omitempty,oneof=completeness standardization uniqueness accuracy consistency timeliness data_statistics"` // 维度，完整性 规范性 唯一性 准确性 一致性 及时性 数据统计
	FieldId    string `json:"field_id" form:"field_id" binding:"omitempty,uuid" example:"962b749f-32e6-41d1-bd79-33ce839a8598"`                                             // 字段id
	Keyword    string `json:"keyword" form:"keyword" binding:"KeywordTrimSpace,omitempty,min=1,max=128"`                                                                    // 关键字查询
	Enable     *bool  `json:"enable" form:"enable" binding:"omitempty"`                                                                                                     // 启用状态，true为已启用，false为未启用，不传该参数则不跟据启用状态筛选
}

type GetRuleListResp struct {
	RuleId          string  `json:"rule_id"`               // 规则id
	RuleName        string  `json:"rule_name"`             // 规则名称
	RuleDescription string  `json:"rule_description"`      // 规则描述
	RuleLevel       string  `json:"rule_level"`            // 规则级别，元数据级 字段级 行级 视图级
	Dimension       string  `json:"dimension"`             // 维度
	RuleConfig      *string `json:"rule_config,omitempty"` // 规则配置
	Enable          bool    `json:"enable"`                // 是否启用
}

//endregion

//region GetRuleReq

type RuleIDReqPath struct {
	RuleId string `json:"id" uri:"id" binding:"required,uuid" example:"13b8a80b-1914-4896-99d8-51559dba26c4"` // 规则id
}

type GetRuleReq struct {
	RuleIDReqPath `param_type:"path"`
}

type GetRuleResp struct {
	RuleId          string  `json:"rule_id"`          // 规则id
	RuleName        string  `json:"rule_name"`        // 规则名称
	RuleDescription string  `json:"rule_description"` // 规则描述
	RuleLevel       string  `json:"rule_level"`       // 规则级别，元数据级 字段级 行级 视图级
	FieldId         string  `json:"field_id"`         // 字段id
	Dimension       string  `json:"dimension"`        // 维度，完整性 规范性 唯一性 准确性 一致性 及时性
	DimensionType   string  `json:"dimension_type"`   // 维度类型
	RuleConfig      *string `json:"rule_config"`      // 规则配置
	Enable          bool    `json:"enable"`           // 是否启用
	TemplateId      string  `json:"template_id"`      // 模板id
}

//endregion

//region NameRepeatReq

type NameRepeatReq struct {
	NameRepeatReqQuery `param_type:"query"`
}

type NameRepeatReqQuery struct {
	FormViewId string `json:"form_view_id" form:"form_view_id" binding:"required,uuid" example:"13b8a80b-1914-4896-99d8-51559dba26c4"` // 视图id
	RuleId     string `json:"rule_id" form:"rule_id" binding:"omitempty,uuid"`                                                         // 规则id
	RuleName   string `json:"rule_name" form:"rule_name" binding:"required,min=1,max=128"`                                             // 规则名称
}

//endregion

//region UpdateRuleReq

type UpdateRuleReq struct {
	RuleIDReqPath     `param_type:"path"`
	UpdateRuleReqBody `param_type:"body"`
}

type UpdateRuleReqBody struct {
	RuleName        string  `json:"rule_name" form:"rule_name" binding:"required,min=1,max=128"`                // 规则名称
	RuleDescription string  `json:"rule_description" form:"rule_description" binding:"omitempty,min=1,max=300"` // 规则描述
	RuleConfig      *string `json:"rule_config" form:"rule_config" binding:"omitempty"`                         // 规则配置
	Enable          *bool   `json:"enable" form:"enable" binding:"omitempty"`                                   // 是否启用
}

//endregion

//region UpdateRuleStatusReq

type UpdateRuleStatusReq struct {
	UpdateRuleStatusReqBody `param_type:"body"`
}

type UpdateRuleStatusReqBody struct {
	Enable  *bool    `json:"enable" form:"enable" binding:"required"`                      // 是否启用
	RuleIds []string `json:"rule_ids" form:"rule_ids" binding:"required,unique,dive,uuid"` // 规则id数组
}

//endregion

//region UpdateRuleReq

type DeleteRuleReq struct {
	RuleIDReqPath `param_type:"path"`
}

//endregion

//region GetInternalRuleResp

type GetInternalRuleResp struct {
	TemplateId      string  `json:"template_id"`      // 模板id
	RuleName        string  `json:"rule_name"`        // 规则名称
	RuleDescription string  `json:"rule_description"` // 规则描述
	RuleLevel       string  `json:"rule_level"`       // 规则级别，元数据级 字段级 行级 视图级
	Dimension       string  `json:"dimension"`        // 维度
	DimensionType   string  `json:"dimension_type"`   // 维度类型
	RuleConfig      *string `json:"rule_config"`      // 规则配置
}

//endregion

//region CreateWorkOrderTaskReq

type CreateWorkOrderTaskReq struct {
	CreateWorkOrderTaskReqBody `param_type:"body"`
}

type CreateWorkOrderTaskReqBody struct {
	WorkOrderID  string   `json:"work_order_id" form:"work_order_id" binding:"required,uuid"` // 工单id
	FormViewIDs  []string `json:"form_view_ids" form:"form_view_ids" binding:"required"`      // 视图id
	CreatedByUID string   `json:"created_by_uid" form:"created_by_uid" binding:"required"`    // 创建人id
	TotalSample  int64    `json:"total_sample" form:"total_sample" binding:"omitempty"`       // 采样数据量,0为全量数据
}

type CreateWorkOrderTaskResp struct {
	Result []Result `json:"result"`
}

type Task struct {
	FormViewId   string
	WorkOrderId  string
	CreatedByUID string
	TotalSample  int64
}

type Result struct {
	FormViewId string
	TaskId     string
	Error      error
}

//endregion

type DataASyncExploreMsg struct {
	TaskId   string `json:"task_id"`   // 任务id
	UserId   string `json:"user_id"`   // 用户id
	UserName string `json:"user_name"` // 用户名
}

type JobConf struct {
	Name                 string          `json:"task_name"`
	Desc                 string          `json:"task_desc"`
	TableID              string          `json:"table_id"`
	TableName            string          `json:"table"`
	Schema               string          `json:"schema"`
	VeCatalog            string          `json:"ve_catalog"`
	TaskEnabled          int             `json:"task_enabled"`
	MetadataExploreConfs []*JobRuleConf  `json:"metadata_explore" binding:"omitempty"`
	FieldExploreConfs    []*JobFieldConf `json:"field_explore" binding:"omitempty"`
	RowExploreConfs      []*JobRuleConf  `json:"row_explore" binding:"omitempty"`
	ViewExploreConfs     []*JobRuleConf  `json:"view_explore" binding:"omitempty"`
	TotalSample          int64           `json:"total_sample,omitempty" binding:"omitempty"`
	ExploreType          int             `json:"explore_type" binding:"required,oneof=1 2 3"`
	UserId               string          `json:"user_id"`
	UserName             string          `json:"user_name"`
	TaskId               string          `json:"dv_task_id"`
	FieldInfo            string          `json:"field_info"`
}

type ColumnInfo struct {
	Name       string `json:"name" binding:"omitempty"`        // name
	Comment    string `json:"comment" binding:"omitempty"`     // comment
	Type       string `json:"type" binding:"omitempty"`        // type
	OriginType string `json:"origin_type" binding:"omitempty"` // type
}

type JobFieldConf struct {
	FieldId   string         `json:"field_id" binding:"omitempty"`
	FieldName string         `json:"field_name" binding:"omitempty"`
	FieldType string         `json:"field_type" binding:"omitempty"`
	Projects  []*JobRuleConf `json:"projects" binding:"omitempty"`
	Code      []string       `json:"code" binding:"omitempty,dive,Min=1"`
	Params    string         `json:"params" binding:"omitempty"`
}

type JobRuleConf struct {
	RuleId          string  `json:"rule_id"`
	RuleName        string  `json:"rule_name"`
	RuleDescription string  `json:"rule_description"` // 规则描述
	Dimension       string  `json:"dimension"`
	DimensionType   string  `json:"dimension_type"`
	RuleConfig      *string `json:"rule_config"`
}

type ExploreJobResp struct {
	ExploreJobId  string `json:"explore_job_id"`      // 探查作业ID
	ExploreJobVer int    `json:"explore_job_version"` // 探查作业版本
}

type TaskStatus enum.Object

var (
	TaskStatusQueuing  = enum.New[TaskStatus](1, "queuing")  // 等待中
	TaskStatusRunning  = enum.New[TaskStatus](2, "running")  // 进行中
	TaskStatusFinished = enum.New[TaskStatus](3, "finished") // 已完成
	TaskStatusCanceled = enum.New[TaskStatus](4, "canceled") // 已取消
	TaskStatusFailed   = enum.New[TaskStatus](5, "failed")   // 异常
)

type TaskType enum.Object

var (
	TaskExploreData                    = enum.New[TaskType](1, "explore_data")                 // 探查数据
	TaskExploreTimestamp               = enum.New[TaskType](2, "explore_timestamp")            // 探查业务更新时间
	TaskExploreDataClassification      = enum.New[TaskType](3, "explore_classification")       // 探查数据分类
	TaskExploreDataClassificationGrade = enum.New[TaskType](4, "explore_classification_grade") // 探查数据分类分级
)

type ClassifyType enum.Object

var (
	ClassifyTypeAuto   = enum.New[ClassifyType](1, "auto")   // 自动数据分类
	ClassifyTypeManual = enum.New[ClassifyType](2, "manual") // 人工数据分类
)

type TaskRemark struct {
	TotalCount  int                    `json:"total_count"` // 异常总数
	Description string                 `json:"description"` // 异常描述
	Details     []*TaskExceptionDetail `json:"details"`     // 异常信息数组
}

type TaskExceptionDetail struct {
	ViewInfo      []*ViewInfo `json:"view_info"`      // 视图信息
	ExceptionDesc string      `json:"exception_desc"` // 异常描述
}
type ViewInfo struct {
	ViewID       string `json:"view_id"`        // 视图ID
	ViewBusiName string `json:"view_busi_name"` // 视图业务名称
	ViewTechName string `json:"view_tech_name"` // 视图技术名称
	Reason       string `json:"reason"`         // 错误描述
}

const (
	STRATEGY_ALL              = "all"
	STRATEGY_NOT_EXPLORED     = "not_explored"
	STRATEGY_RULES_CONFIGURED = "rules_configured"
)

var (
	ColTypeRuleMap = map[string]map[string]bool{
		constant.SimpleInt: {
			"cf0b5b51-79f1-4cb3-8f0c-be0c3ad25e55": true,
			"fcbad175-862e-4d24-882c-c6dd96d9f4f2": true,
			"6d8d7fdc-8cc4-4e89-a5dd-9b8d07a685dc": true,
			"0e75ad19-a39b-4e41-b8f1-e3cee8880182": true,
			"0c790158-9721-41ce-b8b3-b90341575485": true,
			"73271129-2ae3-47aa-83c5-6c0bf002140c": true,
			"91920b32-b884-4d23-a649-0518b038bf3b": true,
			"fd9fa13a-40db-4283-9c04-bf0ff3edcb32": true,
			"06ad1362-9545-415d-9278-265e3abe7c10": true,
			"96ac5dc0-2e5c-4397-87a7-8414dddf8179": true},
		constant.SimpleFloat: {
			"cf0b5b51-79f1-4cb3-8f0c-be0c3ad25e55": true,
			"fcbad175-862e-4d24-882c-c6dd96d9f4f2": true,
			"6d8d7fdc-8cc4-4e89-a5dd-9b8d07a685dc": true,
			"0e75ad19-a39b-4e41-b8f1-e3cee8880182": true,
			"0c790158-9721-41ce-b8b3-b90341575485": true,
			"73271129-2ae3-47aa-83c5-6c0bf002140c": true,
			"91920b32-b884-4d23-a649-0518b038bf3b": true,
			"fd9fa13a-40db-4283-9c04-bf0ff3edcb32": true,
			"06ad1362-9545-415d-9278-265e3abe7c10": true,
			"96ac5dc0-2e5c-4397-87a7-8414dddf8179": true},
		constant.SimpleDecimal: {
			"cf0b5b51-79f1-4cb3-8f0c-be0c3ad25e55": true,
			"fcbad175-862e-4d24-882c-c6dd96d9f4f2": true,
			"6d8d7fdc-8cc4-4e89-a5dd-9b8d07a685dc": true,
			"0e75ad19-a39b-4e41-b8f1-e3cee8880182": true,
			"0c790158-9721-41ce-b8b3-b90341575485": true,
			"73271129-2ae3-47aa-83c5-6c0bf002140c": true,
			"91920b32-b884-4d23-a649-0518b038bf3b": true,
			"fd9fa13a-40db-4283-9c04-bf0ff3edcb32": true,
			"06ad1362-9545-415d-9278-265e3abe7c10": true,
			"96ac5dc0-2e5c-4397-87a7-8414dddf8179": true},
		constant.SimpleChar: {
			"cf0b5b51-79f1-4cb3-8f0c-be0c3ad25e55": true,
			"fcbad175-862e-4d24-882c-c6dd96d9f4f2": true,
			"6d8d7fdc-8cc4-4e89-a5dd-9b8d07a685dc": true,
			"0e75ad19-a39b-4e41-b8f1-e3cee8880182": true,
			"96ac5dc0-2e5c-4397-87a7-8414dddf8179": true},
		constant.SimpleDate: {
			"cf0b5b51-79f1-4cb3-8f0c-be0c3ad25e55": true,
			"0c790158-9721-41ce-b8b3-b90341575485": true,
			"73271129-2ae3-47aa-83c5-6c0bf002140c": true,
			"95e5b917-6313-4bd0-8812-bf0d4aa68d73": true,
			"69c3d959-1c72-422b-959d-7135f52e4f9c": true,
			"709fca1a-4640-4cd7-94ed-50b1b16e0aa5": true},
		constant.SimpleDatetime: {
			"cf0b5b51-79f1-4cb3-8f0c-be0c3ad25e55": true,
			"0c790158-9721-41ce-b8b3-b90341575485": true,
			"73271129-2ae3-47aa-83c5-6c0bf002140c": true,
			"95e5b917-6313-4bd0-8812-bf0d4aa68d73": true,
			"69c3d959-1c72-422b-959d-7135f52e4f9c": true,
			"709fca1a-4640-4cd7-94ed-50b1b16e0aa5": true},
		constant.SimpleTime: {
			"cf0b5b51-79f1-4cb3-8f0c-be0c3ad25e55": true,
			"0c790158-9721-41ce-b8b3-b90341575485": true,
			"73271129-2ae3-47aa-83c5-6c0bf002140c": true},
		constant.SimpleBool: {
			"cf0b5b51-79f1-4cb3-8f0c-be0c3ad25e55": true,
			"ae0f6573-b3e0-4be2-8330-a643261f8a18": true,
			"45a4b3cb-b93c-469d-b3b4-631a3b8db5fe": true},
	} // 字段类型可探查规则约束
)

const (
	EXPLORE_JOB_DISABLED = iota // 探查作业禁用
	EXPLORE_JOB_ENABLED         // 探查作业启用
)

type RuleLevel enum.Object

var (
	RuleLevelMetadata = enum.New[RuleLevel](1, "metadata") // 元数据级
	RuleLevelField    = enum.New[RuleLevel](2, "field")    // 字段级
	RuleLevelRow      = enum.New[RuleLevel](3, "row")      // 行级
	RuleLevelView     = enum.New[RuleLevel](4, "view")     // 视图级
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

type DimensionType enum.Object

var (
	DimensionTypeRowNull   = enum.New[DimensionType](1, "row_null")   // 行数据空值项检查
	DimensionTypeRowRepeat = enum.New[DimensionType](2, "row_repeat") // 行数据重复值检查
	DimensionTypeNull      = enum.New[DimensionType](3, "null")       // 空值项检查
	DimensionTypeDict      = enum.New[DimensionType](4, "dict")       // 码值检查
	DimensionTypeRepeat    = enum.New[DimensionType](5, "repeat")     // 重复值检查
	DimensionTypeFormat    = enum.New[DimensionType](6, "format")     // 格式检查
	DimensionTypeCustom    = enum.New[DimensionType](7, "custom")     // 自定义规则
)

var (
	RuleViewDescription  = "表注释检查"   // 表注释检查
	RuleFieldDescription = "字段注释检查"  // 字段注释检查
	RuleDataType         = "数据类型检查"  // 数据类型检查
	RuleNull             = "空值项检查"   // 空值项检查
	RuleDict             = "码值检查"    // 码值检查
	RuleFormat           = "格式检查"    // 格式检查
	RuleRowNull          = "行级空值项检查" // 行级空值项检查
	RuleRowRepeat        = "行级重复值检查" // 行级重复值检查
	RuleUpdatePeriod     = "更新周期"    // 更新周期
	RuleOther            = "无配置"     // 无配置
)

var TemplateRuleMap = map[string]string{
	"4662a178-140f-4869-88eb-57f789baf1d3": RuleOther,        // 表注释检查
	"931bf4e4-914e-4bff-af0c-ca57b63d1619": RuleOther,        // 字段注释检查
	"c2c65844-5573-4306-92d7-d3f9ac2edbf6": RuleOther,        // 数据类型检查
	"cf0b5b51-79f1-4cb3-8f0c-be0c3ad25e55": RuleNull,         // 空值项检查
	"fcbad175-862e-4d24-882c-c6dd96d9f4f2": RuleDict,         // 码值检查
	"6d8d7fdc-8cc4-4e89-a5dd-9b8d07a685dc": RuleOther,        // 重复值检查
	"0e75ad19-a39b-4e41-b8f1-e3cee8880182": RuleFormat,       // 格式检查
	"442f627c-b9bd-43f6-a3b1-b048525276a2": RuleRowNull,      // 行级空值项检查
	"401f8069-21e5-4dd0-bfa8-432f2635f46c": RuleRowRepeat,    // 行级重复值检查
	"f7447b7a-13a6-4190-9d0d-623af08bedea": RuleUpdatePeriod, // 数据及时性检查
	"0c790158-9721-41ce-b8b3-b90341575485": RuleOther,        // 最大值
	"73271129-2ae3-47aa-83c5-6c0bf002140c": RuleOther,        // 最小值
	"91920b32-b884-4d23-a649-0518b038bf3b": RuleOther,        // 分位数
	"fd9fa13a-40db-4283-9c04-bf0ff3edcb32": RuleOther,        // 平均值统计
	"06ad1362-9545-415d-9278-265e3abe7c10": RuleOther,        // 标准差统计
	"96ac5dc0-2e5c-4397-87a7-8414dddf8179": RuleOther,        // 枚举值分布
	"95e5b917-6313-4bd0-8812-bf0d4aa68d73": RuleOther,        // 天分布
	"69c3d959-1c72-422b-959d-7135f52e4f9c": RuleOther,        // 月分布
	"709fca1a-4640-4cd7-94ed-50b1b16e0aa5": RuleOther,        // 年分布
	"ae0f6573-b3e0-4be2-8330-a643261f8a18": RuleOther,        // TRUE值数
	"45a4b3cb-b93c-469d-b3b4-631a3b8db5fe": RuleOther,        // FALSE值数
}

var ValidPeriods = map[string]bool{
	"day":         true,
	"week":        true,
	"month":       true,
	"quarter":     true,
	"half_a_year": true,
	"year":        true,
}

func (t *TaskInfo) ToModel(userName string) *ExploreTaskInfo {
	if t == nil {
		return nil
	}
	e := &ExploreTaskInfo{}
	e.TaskID = t.TaskID
	e.Type = enum.ToString[TaskType](t.Type)
	e.DatasourceID = t.DatasourceID
	e.DatasourceName = t.DatasourceName
	e.DatasourceType = t.DatasourceType
	e.FormViewID = t.FormViewID
	e.FormViewName = t.FormViewName
	e.FormViewType = enum.ToString[constant.FormViewType](t.Type)
	e.Status = enum.ToString[TaskStatus](t.Status)
	e.Config = t.Config
	e.CreatedAt = t.CreatedAt.UnixMilli()
	e.CreatedBy = userName
	if t.FinishedAt != nil {
		e.FinishedAt = (*t.FinishedAt).UnixMilli()
	}
	e.Remark = t.Remark
	return e
}
