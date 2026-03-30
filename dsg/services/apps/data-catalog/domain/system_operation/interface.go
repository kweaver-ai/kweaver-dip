package system_operation

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/request"
	"github.com/xuri/excelize/v2"
)

type SystemOperationDomain interface {
	GetDetails(ctx context.Context, req *GetDetailsReq) (*GetDetailsResp, error)
	UpdateWhiteList(ctx context.Context, id string, req *UpdateWhiteListReq) (*UpdateWhiteListResp, error)
	GetRule(ctx context.Context) (*GetRuleResp, error)
	UpdateRule(ctx context.Context, req *UpdateRuleReq) error
	ExportDetails(ctx context.Context, req *ExportDetailsReq) (*excelize.File, error)
	OverallEvaluations(ctx context.Context, req *OverallEvaluationsReq) (*OverallEvaluationsResp, error)
	ExportOverallEvaluations(ctx context.Context, req *ExportOverallEvaluationsReq) (*excelize.File, error)
	CreateDetail()
	DataCount()
}

// region GetDetails

type GetDetailsReq struct {
	request.BOPageInfo
	Keyword         string `form:"keyword" binding:"omitempty,TrimSpace"` // 表名称、表中文注释搜索
	DepartmentID    string `form:"department_id" binding:"omitempty"`     // 单位名称,逗号分隔
	InfoSystemID    string `form:"info_system_id" binding:"omitempty"`    // 系统名称,逗号分隔
	StartDate       int64  `form:"start_date" binding:"required"`         // 查询开始日期
	EndDate         int64  `form:"end_date" binding:"required"`           // 查询结束日期
	AcceptanceStart *int64 `form:"acceptance_start" binding:"omitempty"`  // 验收开始时间
	AcceptanceEnd   *int64 `form:"acceptance_end" binding:"omitempty"`    // 验收结束时间
	IsWhitelisted   *bool  `form:"is_whitelisted" binding:"omitempty"`    // 是否白名单
}

type GetDetailsResp struct {
	Entries    []*SystemOperationDetail `json:"entries"`
	TotalCount int64                    `json:"total_count" example:"3"`
}

type SystemOperationDetail struct {
	OrganizationName     string  `json:"organization_name" form:"organization_name"`           // 单位名称
	SystemName           string  `json:"system_name" form:"system_name"`                       // 系统名称
	FormViewId           string  `json:"form_view_id" form:"form_view_id"`                     // 视图id
	TableName            string  `json:"table_name" form:"table_name"`                         // 表名称
	TableComment         string  `json:"table_comment" form:"table_comment"`                   // 表中文注释
	AcceptanceTime       int64   `json:"acceptance_time" form:"acceptance_time"`               // 验收时间
	FirstAggregationTime int64   `json:"first_aggregation_time" form:"first_aggregation_time"` // 首次归集时间
	UpdateCycle          int32   `json:"update_cycle" form:"update_cycle"`                     // 更新频率(每日/每周/每月/每季度/每年/不定期)
	FieldCount           int     `json:"field_count" form:"field_count"`                       // 字段数
	LatestDataCount      int     `json:"latest_data_count" form:"latest_data_count"`           // 最新数据量
	UpdateCount          int     `json:"update_count" form:"update_count"`                     // 更新次数
	ExpectedUpdateCount  int     `json:"expected_update_count" form:"expected_update_count"`   // 应更新次数
	UpdateTimeliness     float64 `json:"update_timeliness" form:"update_timeliness"`           // 数据更新及时性(百分比)
	IsUpdatedNormally    bool    `json:"is_updated_normally" form:"is_updated_normally"`       // 是否正常更新
	HasQualityIssue      bool    `json:"has_quality_issue" form:"has_quality_issue"`           // 是否存在质量问题
	IssueRemark          string  `json:"issue_remark" form:"issue_remark"`                     // 问题备注
	IsWhitelisted        bool    `json:"is_whitelisted" form:"is_whitelisted"`                 // 是否白名单
	QualityCheck         bool    `json:"quality_check" form:"quality_check"`                   // 是否加入质量检测白名单
	DataUpdate           bool    `json:"data_update" form:"data_update"`                       // 是否加入数据更新白名单
}

//endregion

// region UpdateWhiteList

type UpdateWhiteListPathParam struct {
	ID string `uri:"id" binding:"required"` // 视图id
}

type UpdateWhiteListReq struct {
	QualityCheck bool `json:"quality_check" form:"quality_check" binding:"omitempty"` // 是否加入质量检测白名单
	DataUpdate   bool `json:"data_update" form:"data_update" binding:"omitempty"`     // 是否加入数据更新白名单
}

type UpdateWhiteListResp struct {
	FormViewID string `json:"form_view_id"` // 视图id
}

//endregion

// region GetRule

type GetRuleResp struct {
	NormalUpdate Config `json:"normal_update"` // 正常更新
	GreenCard    Config `json:"green_card"`    // 绿牌
	YellowCard   Config `json:"yellow_card"`   // 黄牌
	RedCard      Config `json:"red_card"`      // 红牌
}

type Config struct {
	UpdateTimelinessValue float64 `json:"update_timeliness_value" form:"update_timeliness_value" binding:"omitempty"` // 更新及时率值(%)
	QualityPassValue      float64 `json:"quality_pass_value" form:"quality_pass_value" binding:"omitempty"`           // 质量合格率值(%)
	LogicalOperator       string  `json:"logical_operator" form:"logical_operator" binding:"omitempty"`               // 逻辑运算符(AND/OR)
}

//endregion

// region UpdateRule

type UpdateRuleReq struct {
	NormalUpdate Config `json:"normal_update" form:"normal_update" binding:"omitempty"` // 正常更新
	GreenCard    Config `json:"green_card" form:"green_card" binding:"omitempty"`       // 绿牌
	YellowCard   Config `json:"yellow_card" form:"yellow_card" binding:"omitempty"`     // 黄牌
	RedCard      Config `json:"red_card" form:"red_card" binding:"omitempty"`           // 红牌
}

//endregion

// region ExportDetails

type ExportDetailsReq struct {
	FileName  string          `json:"file_name" form:"file_name" binding:"required"`    // 导出文件名
	Data      []*ExportDetail `json:"data" form:"data" binding:"omitempty"`             // 导出数据
	StartDate *int64          `json:"start_date" form:"start_date" binding:"omitempty"` // 查询开始日期
	EndDate   *int64          `json:"end_date" form:"end_date" binding:"omitempty"`     // 查询结束日期
}

type ExportDetail struct {
	OrganizationName     string `json:"organization_name" form:"organization_name"`           // 单位名称
	SystemName           string `json:"system_name" form:"system_name"`                       // 系统名称
	FormViewId           string `json:"form_view_id" form:"form_view_id"`                     // 视图id
	TableName            string `json:"table_name" form:"table_name"`                         // 表名称
	TableComment         string `json:"table_comment" form:"table_comment"`                   // 表中文注释
	AcceptanceTime       string `json:"acceptance_time" form:"acceptance_time"`               // 验收时间
	FirstAggregationTime string `json:"first_aggregation_time" form:"first_aggregation_time"` // 首次归集时间
	UpdateCycle          string `json:"update_cycle" form:"update_cycle"`                     // 更新频率(每日/每周/每月/每季度/每年/不定期)
	FieldCount           int    `json:"field_count" form:"field_count"`                       // 字段数
	LatestDataCount      int    `json:"latest_data_count" form:"latest_data_count"`           // 最新数据量
	UpdateCount          int    `json:"update_count" form:"update_count"`                     // 更新次数
	ExpectedUpdateCount  int    `json:"expected_update_count" form:"expected_update_count"`   // 应更新次数
	UpdateTimeliness     string `json:"update_timeliness" form:"update_timeliness"`           // 数据更新及时性(百分比)
	IsUpdatedNormally    string `json:"is_updated_normally" form:"is_updated_normally"`       // 是否正常更新
	HasQualityIssue      string `json:"has_quality_issue" form:"has_quality_issue"`           // 是否存在质量问题
	IssueRemark          string `json:"issue_remark" form:"issue_remark"`                     // 问题备注
	IsWhitelisted        string `json:"is_whitelisted" form:"is_whitelisted"`                 // 是否白名单
	WhitelistType        string `json:"whitelist_type"  form:"whitelist_type"`                // 白名单类型
}

//endregion

// region OverallEvaluations

type OverallEvaluationsReq struct {
	request.BOPageInfo
	InfoSystemID     string `form:"info_system_id" binding:"omitempty"`    // 系统名称,逗号分隔
	ConstructionUnit string `form:"construction_unit" binding:"omitempty"` // 建设单位,逗号分隔
	StartDate        int64  `form:"start_date" binding:"required"`         // 查询开始日期
	EndDate          int64  `form:"end_date" binding:"required"`           // 查询结束日期
	AcceptanceStart  *int64 `form:"acceptance_start" binding:"omitempty"`  // 验收开始时间
	AcceptanceEnd    *int64 `form:"acceptance_end" binding:"omitempty"`    // 验收结束时间
}

type OverallEvaluationsResp struct {
	Entries    []*OverallEvaluation `json:"entries"`
	TotalCount int64                `json:"total_count" example:"3"`
}

type OverallEvaluation struct {
	ProjectName             string  `json:"project_name"`              // 项目名称
	ConstructionUnit        string  `json:"construction_unit"`         // 项目建设单位
	InfoSystemID            string  `json:"info_system_id"`            // 子系统id
	SubsystemName           string  `json:"subsystem_name"`            // 子系统名称
	AcceptanceTime          int64   `json:"acceptance_time"`           // 验收时间
	AggregationTableCount   int     `json:"aggregation_table_count"`   // 归集表数量
	OverallUpdateTimeliness float64 `json:"overall_update_timeliness"` // 整体更新及时率
	DataQualitySituation    string  `json:"data_quality_situation"`    // 数据质量情况
	Summary                 string  `json:"summary"`                   // 情况汇总
	AwardSuggestion         string  `json:"award_suggestion"`          // 给牌建议(绿牌/黄牌/红牌)
	AwardReason             string  `json:"award_reason"`              // 给牌理由
}

type InfoSystemInfo struct {
	InfoSystemID   string `json:"info_system_id"`
	InfoSystemName string `json:"info_system_name"`
	DepartmentID   string `json:"department_id"`
	DepartmentName string `json:"department_name"`
}

type TableStatus struct {
	TotalTables        int  // 总表数
	CollectedTables    int  // 已归集表数
	NormalUpdateTables int  // 正常更新表数
	QualityIssueTables int  // 质量问题表数
	UpdateWhitelist    int  // 数据更新白名单表数
	QualityWhitelist   int  // 质量检测白名单表数
	HasWhitelist       bool // 是否存在白名单
}

//endregion

// region ExportOverallEvaluations

type ExportOverallEvaluationsReq struct {
	FileName  string                     `json:"file_name" form:"file_name" binding:"required"`    // 导出文件名
	Data      []*ExportOverallEvaluation `json:"data" form:"data" binding:"omitempty"`             // 导出数据
	StartDate *int64                     `json:"start_date" form:"start_date" binding:"omitempty"` // 查询开始日期
	EndDate   *int64                     `json:"end_date" form:"end_date" binding:"omitempty"`     // 查询结束日期
}

type ExportOverallEvaluation struct {
	ProjectName             string `json:"project_name" form:"project_name"`                           // 项目名称
	ConstructionUnit        string `json:"construction_unit" form:"construction_unit"`                 // 项目建设单位
	SubsystemName           string `json:"subsystem_name" form:"subsystem_name"`                       // 子系统名称
	AcceptanceTime          string `json:"acceptance_time" form:"acceptance_time"`                     // 验收时间
	AggregationTableCount   int    `json:"aggregation_table_count" form:"aggregation_table_count"`     // 归集表数量
	OverallUpdateTimeliness string `json:"overall_update_timeliness" form:"overall_update_timeliness"` // 整体更新及时率
	DataQualitySituation    string `json:"data_quality_situation" form:"data_quality_situation"`       // 数据质量情况
	Summary                 string `json:"summary" form:"summary"`                                     // 情况汇总
	AwardSuggestion         string `json:"award_suggestion" form:"award_suggestion"`                   // 给牌建议(绿牌/黄牌/红牌)
	AwardReason             string `json:"award_reason" form:"award_reason"`                           // 给牌理由
}

//endregion

// 白名单类型常量
const (
	WhitelistTypeQuality = "质量检测白名单"
	WhitelistTypeUpdate  = "数据更新白名单"
	WhitelistTypeBoth    = "质量检测、数据更新白名单"
)

// 牌类型常量
const (
	CardGreen  = "绿"
	CardYellow = "黄"
	CardRed    = "红"
)

// 条件类型常量
const (
	ConditionAND = "AND"
	ConditionOR  = "OR"
)

type RuleConfig struct {
	RuleName              string  `json:"rule_name"`               // 规则名称
	UpdateTimelinessValue float64 `json:"update_timeliness_value"` // 更新及时率值(%)
	QualityPassValue      float64 `json:"quality_pass_value"`      // 质量合格率值(%)
	LogicalOperator       string  `json:"logical_operator"`        // 逻辑运算符(AND/OR)
}

type CardConfig struct {
	GreenUpdateRate   float64 // 绿牌更新及时率阈值
	GreenQualityRate  float64 // 绿牌质量合格率阈值
	GreenCondition    string  // 绿牌条件组合类型
	YellowUpdateRate  float64 // 黄牌更新及时率阈值
	YellowQualityRate float64 // 黄牌质量合格率阈值
	YellowCondition   string  // 黄牌条件组合类型
	RedUpdateRate     float64 // 红牌更新及时率阈值
	RedQualityRate    float64 // 红牌质量合格率阈值
	RedCondition      string  // 红牌条件组合类型
}

type ProjectStatus struct {
	TotalCollectedTables int // 总归集数据表数量
	QualityWhitelist     int // 质量检测白名单表数量
	UpdateWhitelist      int // 数据更新白名单表数量
	BothWhitelist        int // 同时属于两种白名单的表数量
	QualifiedTables      int // 质量符合要求的表数量(评分=100)
	TimelyUpdatedTables  int // 及时更新的表数量
}

type ViewInfo struct {
	TechnicalName string `json:"technical_name"`
	BusinessName  string `json:"business_name"`
	FieldCount    int    `json:"field_count"`
}

type RuleStats struct {
	TableCount int // 涉及的表数量
	TotalCount int // 总问题数据量
}

type SrcReportData struct {
	Code            string                `json:"code" `    // 数据探查报告编号
	TaskId          string                `json:"task_id" ` // 任务ID
	Version         int32                 `json:"version" ` // 任务版本
	MetadataExplore *ExploreDetails       `json:"metadata_explore"`
	FieldExplore    []*ExploreFieldDetail `json:"field_explore"` // 字段探查参数
	RowExplore      *ExploreDetails       `json:"row_explore"`
	ViewExplore     []*RuleResult         `json:"table_explore"` // 视图级探查参数
	CreatedAt       int64                 `json:"created_at"`    // 探查开始时间
	FinishedAt      int64                 `json:"finished_at"`   // 探查结束时间
	TotalSample     int64                 `json:"total_sample"`  // 采样条数
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

type RuleResult struct {
	RuleId          string  `json:"rule_id"`          // 规则ID
	RuleName        string  `json:"rule_name"`        // 规则名称
	RuleDescription string  `json:"rule_description"` // 规则描述
	RuleConfig      *string `json:"rule_config"`
	Dimension       string  `json:"dimension"`       // 维度属性 0准确性,1及时性,2完整性,3唯一性，4一致性,5规范性,6数据统计
	Result          string  `json:"result"`          // 规则输出结果 []any规则输出列级结果
	InspectedCount  int64   `json:"inspected_count"` // 检测数据量
	IssueCount      int64   `json:"issue_count"`     // 问题数据量
	DimensionScores
}

type DimensionScores struct {
	CompletenessScore    *float64 `json:"completeness_score"`    // 完整性维度评分，缺省为NULL
	UniquenessScore      *float64 `json:"uniqueness_score"`      // 唯一性维度评分，缺省为NULL
	StandardizationScore *float64 `json:"standardization_score"` // 规范性维度评分，缺省为NULL
	AccuracyScore        *float64 `json:"accuracy_score"`        // 准确性维度评分，缺省为NULL
	ConsistencyScore     *float64 `json:"consistency_score"`     // 一致性维度评分，缺省为NULL
}
