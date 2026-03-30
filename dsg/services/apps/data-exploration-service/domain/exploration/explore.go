package exploration

import (
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/common/models/response"
	"github.com/kweaver-ai/idrm-go-frame/core/enum"
)

type ExploreConfig struct {
	ProjectCode  string  `json:"code"`           // 探查项目编号
	ProjectName  string  `json:"name"`           // 探查项目名称
	Limit        int32   `json:"-"`              // 规则适用字段类型范围字段类型，拆分为8位二进制获取对应的权限位 1数字型，2字符型，4日期型，8日期时间型，16时间戳型，32布尔型，64二进制，128其他
	Level        int32   `json:"level"`          // 探查级别0表级,1字段级,2跨字段级,3跨表级
	SQL          string  `json:"-"`              // 执行探查sql
	Description  string  `json:"description" `   // 探查项目描述
	Dimension    string  `json:"dimension" `     // 维度，0准确性,1及时性,2完整性,3唯一性，4一致性,5有效性
	Scored       int32   `json:"scored" `        // 是否参与计算评分 0 不参与 1 参与
	ResultFormat string  `json:"result_format" ` // 结果格式
	Weight       float64 `json:"-" default:"1"`  // 规则权重 默认为1
}

type ProjectConfigListReq struct {
	Level *int32 `form:"level" binding:"omitempty,oneof=0 1 2 3" example:"1"` // 探查级别0表级,1字段级,2跨字段级,3跨表级
}

type ReportFormat struct {
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
	ExploreType     int32                 `json:"explore_type"`  // 探查类型,0 快速探查,1 随机快速探,2 全量探查
	TotalSample     int32                 `json:"total_sample"`  // 探查样本总数，全量探查时该参数无效
	Total           int32                 `json:"total_rows"`    // 实际探查数量
	CreatedAt       *int64                `json:"created_at"`    // 创建时间
	FinishedAt      *int64                `json:"finished_at"`   // 完成时间
	TotalScore      *float64              `json:"total_score"`   // 总分，缺省为NULL
	DimensionScores
}
type ExploreDetails struct {
	ExploreDetails []*RuleResult `json:"explore_details"` // 探查结果详情
	DimensionScores
}

type ExploreDetail struct {
	RuleId    string  `json:"rule_id"`   // 规则ID
	RuleName  string  `json:"rule_name"` // 规则名称
	Dimension string  `json:"dimension"` // 维度属性 0准确性,1及时性,2完整性,3唯一性，4一致性,5规范性,6数据统计
	Result    *string `json:"result"`    // 规则输出结果 []any规则输出列级结果
	DimensionScores
}

type RuleResult struct {
	RuleId          string  `json:"rule_id"`          // 规则ID
	RuleName        string  `json:"rule_name"`        // 规则名称
	RuleDescription string  `json:"rule_description"` // 规则描述
	RuleConfig      *string `json:"rule_config"`      // 规则配置
	Dimension       string  `json:"dimension"`        // 维度属性 0准确性,1及时性,2完整性,3唯一性，4一致性,5规范性,6数据统计
	DimensionType   string  `json:"dimension_type"`   // 维度类型
	Result          *string `json:"result"`           // 规则输出结果 []any规则输出列级结果
	InspectedCount  int64   `json:"inspected_count"`  // 检测数据量
	IssueCount      int64   `json:"issue_count"`      // 问题数据量
	DimensionScores
}

type DimensionScores struct {
	CompletenessScore    *float64 `json:"completeness_score"`    // 完整性维度评分，缺省为NULL
	UniquenessScore      *float64 `json:"uniqueness_score"`      // 唯一性维度评分，缺省为NULL
	StandardizationScore *float64 `json:"standardization_score"` // 规范性维度评分，缺省为NULL
	AccuracyScore        *float64 `json:"accuracy_score"`        // 准确性维度评分，缺省为NULL
	ConsistencyScore     *float64 `json:"consistency_score"`     // 一致性维度评分，缺省为NULL
}

type ExploreFieldDetail struct {
	FieldId  string        `json:"field_id"`  // 字段id
	CodeInfo string        `json:"code_info"` // 码表信息
	Details  []*RuleResult `json:"details"`   // 规则结果明细（仅返回部分需要呈现的字段规则输出结果）
	DimensionScores
}

type ExploreFieldDetails struct {
	ExploreFieldDetails []*ExploreFieldDetail `json:"explore_field_details"` // 字段探查结果
	DimensionScores
}

type FieldReport struct {
	Field_Name string     `json:"field_name"`  // 字段名称
	Field_Type int32      `json:"field_type"`  // 字段类型，0数字型，1字符型，2日期型，3日期时间型，4时间戳型，5布尔型，6二进制，7其他
	Params     string     `json:"params"`      // 探查项目参数
	Total      *float64   `json:"total_score"` // 总评分
	ZQX        *float64   `json:"zqx"`         // 准确性评分
	JSX        *float64   `json:"jsx"`         // 及时性评分
	WZX        *float64   `json:"wzx"`         // 完整性评分
	WYX        *float64   `json:"wyx"`         // 唯一性评分
	YZX        *float64   `json:"yzx"`         // 一致性评分
	YXX        *float64   `json:"yxx"`         // 有效性评分
	Projects   []Projects `json:"projects"`    // 探查项目
}

type TableReport struct {
	Total    *float64   `json:"total_score"`                       // 总评分
	ZQX      *float64   `json:"zqx"`                               // 准确性总评分
	JSX      *float64   `json:"jsx"`                               // 及时性总评分
	WZX      *float64   `json:"wzx"`                               // 完整性总评分
	WYX      *float64   `json:"wyx"`                               // 唯一性总评分
	YZX      *float64   `json:"yzx"`                               // 一致性总评分
	YXX      *float64   `json:"yxx"`                               // 有效性总评分
	Projects []Projects `json:"projects" binding:"omitempty,dive"` // 探查项目
}

type Projects struct {
	RuleId string `json:"rule_id" binding:"required,uuid"`
	Code   string `json:"code" binding:"required,TrimSpace,min=0,max=255,oneof=total_count null_count blank_count max min zero avg var_pop stddev_pop true false date_distribute_day date_distribute_month date_distribute_year quantile unique dict dict_not_in group"` // 探查项目编号 详见设计文档探查项目字典项含义
	Result string `json:"result"`                                                                                                                                                                                                                                        // 探查结果,json结构
}

type ReportSummary struct {
	Code                 string   `json:"code" `                 // 数据探查报告编号
	TaskId               string   `json:"task_id" `              // 任务ID
	Version              int32    `json:"version" `              // 任务版本
	Total                int32    `json:"total_rows"`            // 实际探查数量
	TotalScore           *float64 `json:"total_score"`           // 总评分
	CompletenessScore    *float64 `json:"completeness_score"`    // 完整性维度评分，缺省为NULL
	UniquenessScore      *float64 `json:"uniqueness_score"`      // 唯一性维度评分，缺省为NULL
	StandardizationScore *float64 `json:"standardization_score"` // 规范性维度评分，缺省为NULL
	AccuracyScore        *float64 `json:"accuracy_score"`        // 准确性维度评分，缺省为NULL
	ConsistencyScore     *float64 `json:"consistency_score"`     // 一致性维度评分，缺省为NULL
	CreatedAt            *int64   `json:"created_at"`            // 创建时间
	FinishedAt           *int64   `json:"finished_at"`           // 完成时间
}

type ListReportRespParam struct {
	response.PageResult[ReportSummary]
}

type GetDataExploreReportsResp struct {
	response.PageResult[ReportFormat]
}

type FieldInfo struct {
	FieldName string `json:"field_name"` // 字段名
	Value     string `json:"value"`      // 字段值
}

type CountData struct {
	Count1 interface{} `json:"count1"`
	Count2 float64     `json:"count2"`
}

type CountInfo struct {
	Count1 float64 `json:"count1"`
	Count2 float64 `json:"count2"`
}

// DataType  数据种类
type DataType enum.Object

var (
	DataTypeNumber   = enum.New[DataType](0, "number", "数字型")
	DataTypeChar     = enum.New[DataType](1, "char", "字符型")
	DataTypeDate     = enum.New[DataType](2, "date", "日期型")
	DataTypeDateTime = enum.New[DataType](3, "datetime", "日期时间型")
	DataTypeTime     = enum.New[DataType](4, "time", "时间型")
	DataTypeBool     = enum.New[DataType](5, "bool", "布尔型")
	DataTypeBinary   = enum.New[DataType](6, "binary", "二进制")
)
