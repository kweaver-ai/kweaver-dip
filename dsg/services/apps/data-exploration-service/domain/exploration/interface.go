package exploration

import (
	"context"
	"encoding/json"
	"strconv"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/common/constant"

	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/common/models/request"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/common/models/response"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/infrastructure/repository/db/model"
)

// req

type CodePathParam struct {
	Code string `json:"code" uri:"code" binding:"required,TrimSpace,min=1,max=128,VerifyDescription" example:"1"` // 报告编号
}

type DataExploreReq struct {
	Table           string          `json:"table" binding:"required,TrimSpace,min=1,max=255" example:"1"`      // 表名称
	Schema          string          `json:"schema" binding:"required,TrimSpace,min=1,max=255" example:"1"`     // 数据库名
	VeCatalog       string          `json:"ve_catalog" binding:"required,TrimSpace,min=1,max=255" example:"1"` // 数据源编目
	TableId         string          `json:"table_id" binding:"TrimSpace,max=255" example:"1"`                  // 数据源表ID
	MdlId           string          `json:"mdl_id" `                                                           // mdl_id
	ExploreModel    int32           `json:"explore_model" binding:"TrimSpace,oneof=0 1"`                       // 探查模式，0指定字段探查，1自动探查
	FieldExplore    []*ExploreField `json:"field_explore" binding:"omitempty,dive"`                            // 字段探查参数
	MetadataExplore []*Project      `json:"metadata_explore" binding:"omitempty"`                              // 元数据级探查项目
	RowExplore      []*Project      `json:"row_explore" binding:"omitempty"`                                   // 行级级探查项目
	ViewExplore     []*Project      `json:"view_explore" binding:"omitempty"`                                  // 视图级探查项目
	ExploreType     int32           `json:"explore_type" binding:"TrimSpace,oneof=0 1"`                        // 探查类型,0 快速探查,1 随机快速探,2 全量探查
	TotalSample     int32           `json:"total_sample" binding:"TrimSpace,min=0,max=1000"`                   // 探查样本总数
	ExpireTime      int32           `json:"expire_time" binding:"omitempty,min=0,max=1440" example:"1"`        // 缓存过期时间，单位分钟,为0时默认30分钟，最大24小时
	Cache           int32           `json:"cache" binding:"omitempty,oneof=0 1" example:"1"`                   // 是否从缓存中获取查询结果(默认查询结果缓存30分钟)0不缓存，1从缓存中获取
	DvTaskID        string          `json:"dv_task_id" binding:"TrimSpace,uuid"`                               // data-view任务id
	FieldInfo       string          `json:"field_info" binding:"required"`                                     // 视图字段信息
}

type ExploreField struct {
	FieldId   string     `json:"field_id" binding:"omitempty"`
	FieldName string     `json:"field_name" binding:"required,TrimSpace,min=1,max=255,VerifyDescription"` // 字段名称
	FieldType string     `json:"field_type" binding:"TrimSpace"`                                          // 字段类型
	Projects  []*Project `json:"projects" binding:"omitempty"`
	Params    string     `json:"params" binding:"omitempty"`
	Code      []string   `json:"code" binding:"required,TrimSpace,min=0,max=255,oneof=total_count null_count blank_count max min zero avg var_pop stddev_pop true false date_distribute_day date_distribute_month date_distribute_year quantile unique dict dict_not_in group"` // 探查项目编号 详见设计文档探查项目字典项含义
}

type Project struct {
	RuleId        string  `json:"rule_id" binding:"required,uuid"`
	RuleName      string  `json:"rule_name" binding:"required"`
	Dimension     string  `json:"dimension"`
	DimensionType string  `json:"dimension_type"`
	RuleConfig    *string `json:"rule_config"`
	Result        string  `json:"result"` // 探查结果,json结构
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
	Member   []Member `json:"member" form:"member" binding:"omitempty,dive"` // 限定对象
	Relation string   `json:"relation" form:"relation" binding:"omitempty"`  // 限定关系
}

type Member struct {
	FieldId  string `json:"id" form:"id" binding:"required"`             // 字段对象
	Operator string `json:"operator" form:"operator" binding:"required"` // 限定条件
	Value    string `json:"value" form:"value" binding:"required"`       // 限定比较值
}

type RowNull struct {
	FieldIds []string `json:"field_ids" form:"field_ids" binding:"required,dive,uuid"`
	Config   []string `json:"config" form:"config" binding:"required,dive"`
}

type RowRepeat struct {
	FieldIds []string `json:"field_ids" form:"field_ids" binding:"required,dive,uuid"`
}

type Param struct {
	Regular  *string `json:"regular,omitempty" binding:"omitempty,TrimSpace,min=0,max=255,VerifyDescription"` // 探查正则表达式
	Min      *string `json:"min,omitempty" binding:"omitempty,TrimSpace,min=0,max=255,VerifyDescription"`     // 最小值
	Max      *string `json:"max,omitempty" binding:"omitempty,TrimSpace,min=0,max=255,VerifyDescription"`     // 最大值
	Quantile *int32  `json:"quantile,omitempty" binding:"omitempty,min=0,max=100"`                            // 分位数,一般是25，75
	DictId   *string `json:"dict_id,omitempty" binding:"omitempty,TrimSpace,min=0,max=255,VerifyDescription"` // 码表id
}

// resp

type DataExploreResp struct {
	Code string `json:"code" binding:"required,VerifyDescription" example:"1"` // 数据探查任务编号
	//TableId      string         `json:"table_id" binding:"required,VerifyModelID" example:"1"` // 元数据表ID
	Table           string          `json:"table" binding:"required" example:"1"`             // 表名称
	Schema          string          `json:"schema" binding:"required" example:"1"`            // 数据库名
	VeCatalog       string          `json:"ve_catalog" binding:"required" example:"1"`        // 数据源编目
	FieldExplore    []*ExploreField `json:"field_explore" binding:"omitempty,dive"`           // 字段探查参数
	MetadataExplore []*Projects     `json:"metadata_explore" binding:"omitempty"`             // 元数据级探查项目
	RowExplore      []*Projects     `json:"row_explore" binding:"omitempty"`                  // 行级级探查项目
	ViewExplore     []*Projects     `json:"view_explore" binding:"omitempty"`                 // 视图级探查项目
	ExploreType     int32           `json:"explore_type" binding:"TrimSpace,oneof=0 1 2"`     // 探查类型,0 快速探查,1 随机快速探,2 全量探查
	TotalSample     int32           `json:"total_sample" binding:"TrimSpace,min=1,max=10000"` // 探查样本总数，全量探查时该参数无效
}

type TaskConfigReq struct {
	TaskName        string          `json:"task_name" binding:"required,TrimSpace,min=1" example:"1"`          // 探查任务配置名称
	TableId         string          `json:"table_id" binding:"TrimSpace,min=1,max=255" example:"1"`            // 数据源表ID
	Table           string          `json:"table" binding:"required,TrimSpace,min=1,max=255" example:"1"`      // 表名称
	Schema          string          `json:"schema" binding:"required,TrimSpace,min=1,max=255" example:"1"`     // 数据库名
	VeCatalog       string          `json:"ve_catalog" binding:"required,TrimSpace,min=1,max=255" example:"1"` // 数据源编
	FieldExplore    []*ExploreField `json:"field_explore" binding:"omitempty,dive"`                            // 字段探查参数
	MetadataExplore []*Projects     `json:"metadata_explore" binding:"omitempty"`                              // 元数据级探查项目
	RowExplore      []*Projects     `json:"row_explore" binding:"omitempty"`                                   // 行级级探查项目
	ViewExplore     []*Projects     `json:"view_explore" binding:"omitempty"`                                  // 视图级探查项目
	ExploreType     int32           `json:"explore_type" binding:"TrimSpace,oneof=0 1 2"`                      // 探查类型,0 快速探查,1 随机快速探,2 全量探查
	TotalSample     int32           `json:"total_sample" binding:"TrimSpace,min=0,max=10000"`                  // 探查样本总数，全量探查时该参数无效
	TaskEnabled     int32           `json:"task_enabled" binding:"TrimSpace,oneof=0 1"`                        // 探查配置启用禁用状态，0禁用，1启用
}

type DataASyncExploreResp struct {
	TaskId  string `json:"task_id" binding:"TrimSpace,VerifyModelID" example:"1"`                // 任务ID
	Version int32  `json:"version" binding:"TrimSpace" example:"1"`                              // 版本号
	Code    string `json:"code" binding:"TrimSpace,min=1,max=255,VerifyDescription" example:"1"` // 报告编号
}

type ReportSearchReq struct {
	TableId     *string           `json:"table_id" form:"table_id" binding:"omitempty,TrimSpace,min=1,max=255,VerifyDescription" ` // 表id
	TaskId      *constant.ModelID `json:"task_id" form:"task_id" binding:"omitempty,TrimSpace,VerifyModelID" `                     // 任务id
	TaskVersion *int32            `json:"task_version" form:"task_version" binding:"omitempty" `                                   // 任务版本
}

type SearchParams struct {
	TableId *string // 表id
	TaskId  *string // 任务id
	Version *int32  // 版本
	Status  *int32  // 报告状态 1未执行，2执行中，3执行成功，4已取消，5执行失败
}

type FieldReportSearchReq struct {
	TaskId    *string `json:"task_id" form:"task_id" binding:"required,TrimSpace,VerifyModelID" ` // 任务id
	FieldName *string `json:"field_name" form:"field_name" binding:"required" `                   // 字段名
	FieldType *string `json:"field_type" form:"field_type" binding:"required"`                    // 字段类型
}

type FieldReportResp struct {
	TotalSample int32   `json:"total_sample"` // 探查样本总数
	Data        *string `json:"data"`         // 探查结果
}

type TimeRange struct {
	Max *string `json:"max"`
	Min *string `json:"min"`
}

type ReportListSearchReq struct {
	TableId *string `json:"table_id" form:"table_id" binding:"omitempty,TrimSpace,min=1,max=255,VerifyDescription"` // 数据源表ID
	TaskId  *string `json:"task_id" form:"task_id" binding:"omitempty,TrimSpace,VerifyModelID"`                     // 任务id
	request.PageInfo
}

type GetDataExploreReportsReq struct {
	TableIds  []string `json:"table_ids" form:"table_ids" binding:"omitempty"`                                            // 表id
	Offset    *int     `json:"offset" form:"offset,default=1" binding:"omitempty,min=1" default:"1"`                      // 页码，默认1
	Limit     *int     `json:"limit" form:"limit,default=15" binding:"omitempty,min=1,max=100" default:"15"`              // 每页大小，默认15
	Direction *string  `json:"direction" form:"direction,default=desc" binding:"omitempty,oneof=asc desc" default:"desc"` // 排序方向，枚举：asc：正序；desc：倒序。默认倒序
	Sort      *string  `json:"sort" form:"sort,default=f_total_score" binding:"omitempty" default:"f_total_score"`        // 排序类型
}

type DataASyncExploreReq struct {
	TaskIds []string `json:"task_ids" binding:"omitempty,min=1,max=1000"` // 字段探查任务id,最少一个最大1000个
	//Schema    string   `json:"schema" form:"schema" binding:"omitempty,TrimSpace,min=1" example:"1"`         // 数据库名
	//VeCatalog string   `json:"ve_catalog" form:"ve_catalog" binding:"omitempty,TrimSpace,min=1" example:"1"` // 数据源编
	//Type      string   `json:"type" form:"type" binding:"required"`                                          // 探查类型
}

type DataASyncExploreMsg struct {
	ReportId uint64 `json:"report_id"` // 字段探查报告id
}

type ExploreFinishedMsg struct {
	TableId string `json:"table_id"` // 视图id
	TaskId  string `json:"task_id"`  // 任务id
	Result  string `json:"result"`   // 探查结果
}

type ExploreDataFinishedMsg struct {
	TableId     string `json:"table_id"`     // 视图id
	TaskId      string `json:"task_id"`      // 任务id
	TaskVersion *int32 `json:"task_version"` // 任务版本
	FinishedAt  int64  `json:"finished_at"`  // 结束时间
}

type DataASyncExploreResult struct {
	Status string `json:"msg"`     // 执行状态
	TaskId string `json:"task_id"` // 任务编号
}

type DataASyncExploreResultMsg struct {
	Result  DataASyncExploreResult `json:"result"` // 执行结果
	Data    [][]any                `json:"data"`   // 结果报文集
	Columns []struct {
		Name string `json:"name"`
		Type string `json:"type"`
	} `json:"columns"` // 字段信息
}

type DataASyncExploreResultNilMsg struct {
	Result  DataASyncExploreResult `json:"result"` // 执行结果
	Columns []struct {
		Name string `json:"name"`
		Type string `json:"type"`
	} `json:"columns"` // 字段信息
}

type DataExploreResultMsg struct {
	Result      DataExploreResult `json:"result"`      // 执行结果
	Aggregation *Aggregation      `json:"aggregation"` // 聚合结果
	GroupBy     *GroupBy          `json:"groupBy"`     // 分组结果
	NotNull     *NotNullResult    `json:"notNull"`     // 非空最大值结果
}

type DataExploreResult struct {
	Status string `json:"msg"`     // 执行状态
	TaskId string `json:"task_id"` // 任务编号
}

type Aggregation struct {
	Data    []interface{} `json:"data"` // 结果报文集
	Columns []struct {
		Name string `json:"name"`
		Type string `json:"type"`
	} `json:"columns"` // 字段信息
	TotalCount int `json:"totalCount"` // 表总行数
}

type NotNullResult struct {
	Data    [][]string `json:"data"` // 结果报文集
	Columns []struct {
		Name string `json:"name"`
		Type string `json:"type"`
	} `json:"columns"` // 字段信息
}

type GroupBy struct {
	Data    []*GroupInfo `json:"data"` // 结果报文集
	Columns []struct {
		Name string `json:"name"`
		Type string `json:"type"`
	} `json:"columns"` // 字段信息
}

type GroupInfo struct {
	Group any `json:"group"`
	Day   any `json:"day"`
	Month any `json:"month"`
	Year  any `json:"year"`
}

type VirtualizationEngineExploreReq struct {
	CatalogName string   `json:"catalogName" form:"catalogName" binding:"required,TrimSpace,min=1"` // 数据源编
	Schema      string   `json:"schema" form:"schema" binding:"required,TrimSpace,min=1"`           // 数据库名
	Table       string   `json:"table" form:"table" binding:"required,TrimSpace,min=1,max=255"`     // 表名
	Limit       string   `json:"limit" form:"limit" binding:"omitempty"`                            // 采样数量
	GroupLimit  string   `json:"groupLimit" form:"group_limit" binding:"omitempty"`                 // 分组限制
	Fields      []*Field `json:"fields" form:"fields" binding:"omitempty,dive"`                     // 字段探查项
	Topic       string   `json:"topic" form:"topic" binding:"required"`                             // topic
}

type Field struct {
	Key   string   `json:"key" form:"key" binding:"required,TrimSpace,min=1,max=255"` // 字段名
	Value []string `json:"value" form:"value" binding:"required,dive"`                // 探查项
	Type  string   `json:"type" form:"type" binding:"required,TrimSpace,min=1"`       // 数据类型
}

type VirEngineExploreReq struct {
	Statement []string `json:"statement"`
	Topic     string   `json:"topic" form:"topic" binding:"required"` // topic
}

type DeleteTaskReq struct {
	DeleteTaskParam
}

type DeleteTaskParam struct {
	TaskId string `json:"id" uri:"id" binding:"required,uuid" example:"61c1c7be-c79c-490b-8369-1b774eed994a"` // 任务id
}

type DeleteTaskResp struct {
	TaskId string `json:"task_id" binding:"TrimSpace" example:"1"` // 任务id
}

type DeleteTaskMsg struct {
	TaskId    string     `json:"task_id" `   // 任务id
	UserId    string     `json:"user_id"`    // 用户id
	UserName  string     `json:"user_name"`  // 用户名
	DeletedAt *time.Time `json:"deleted_at"` // 删除时间
}

type VirEngineDeleteTaskReq struct {
	TaskId []string `json:"task_id"` // 任务id
}

type Result struct {
	Key   string `json:"key"`
	Value int    `json:"value"`
}
type ReportListReq struct {
	CatalogName string `json:"catalog_name" form:"catalog_name" binding:"omitempty"`               // 数据源编
	Keyword     string `json:"keyword" form:"keyword" binding:"TrimSpace,omitempty,min=1,max=255"` // 关键字查询，字符无限制
	ThirdParty  bool   `json:"third_party" form:"third_party" binding:"omitempty"`                 // 第三方报告
	request.PageInfo
}

type ReportListResp struct {
	response.PageResult[ReportInfo]
}

type ReportInfo struct {
	Code       string `json:"code" `       // 数据探查报告编号
	TaskId     string `json:"task_id" `    // 任务ID
	Version    int32  `json:"version" `    // 任务版本
	TableId    string `json:"table_id"`    // 表id
	FinishedAt int64  `json:"finished_at"` // 完成时间
}

type ThirdPartyDataExploreResultMsg struct {
	WorkOrderId  string     `json:"work_order_id"` // 工单id
	InstanceId   string     `json:"instance_id"`   // 实例id
	DatasourceId string     `json:"datasource_id"` // 数据源id
	TableId      string     `json:"table_id"`      // 表id
	FormName     string     `json:"form_name"`     // 表名称
	Rules        []RuleInfo `json:"rules"`         // 规则列表
	FinishedAt   int64      `json:"finished_at"`   // 报告生成时间
}

type RuleInfo struct {
	FieldId        string `json:"field_id"`        // 字段ID
	FieldName      string `json:"field_name"`      // 字段名称
	RuleId         string `json:"rule_id"`         // 规则ID
	RuleName       string `json:"rule_name"`       // 规则名称
	InspectedCount int64  `json:"inspected_count"` // 检测数据量
	IssueCount     int64  `json:"issue_count"`     // 问题数据量
}

type DeleteDataExploreReportReq struct {
	TaskIdParam
	TaskVersionParam
}

type TaskIdParam struct {
	TaskId constant.ModelID `json:"task_id" uri:"task_id" binding:"required,TrimSpace"` // 任务id
}

type TaskVersionParam struct {
	TaskVersion int32 `json:"task_version" form:"task_version" binding:"required" ` // 任务版本
}

type DeleteDataExploreReportResp struct {
	TaskId  string `json:"task_id"` // 任务id
	Version int32  `json:"version"` // 任务版本
}

type Domain interface {
	// DataRealExplore(c *gin.Context, req *DataExploreReq) (*DataExploreResp, error)
	// GetDataRealExplore(c *gin.Context, req *CodePathParam) (*DataExploreResp, error)

	// DataASyncExplore 数据异步探查方法
	//DataASyncExplore(ctx context.Context, req *DataASyncExploreReq) ([]*DataASyncExploreResp, error)

	// DataAsyncExploreExec 执行数据异步探查方法
	//DataAsyncExploreExec(ctx context.Context, req *DataASyncExploreMsg) error

	// ExplorationResultUpdate 执行数据异步探查方法
	ExplorationResultUpdate(ctx context.Context, req *DataASyncExploreResultMsg) error

	// ExplorationResultHandler 数据异步探查结果处理 【时间戳探查结果】
	ExplorationResultHandler(ctx context.Context, msg []byte) error

	// GetDataExploreReport 根据报告编号获取报告
	GetDataExploreReport(ctx context.Context, req *CodePathParam) (*ReportFormat, error)

	// GetDataExploreReportByParam 根据请求参数获取报告
	GetDataExploreReportByParam(ctx context.Context, req *ReportSearchReq) (*ReportFormat, error)

	// GetDataExploreReportListByParam 根据请求参数获取报告列表
	GetDataExploreReportListByParam(ctx context.Context, req *ReportListSearchReq) (*ListReportRespParam, error)

	// GetDataExploreThirdPartyReportListByParam 根据请求参数获取第三方报告列表
	GetDataExploreThirdPartyReportListByParam(ctx context.Context, req *ReportListSearchReq) (*ListReportRespParam, error)

	DeleteTask(ctx context.Context, req *DeleteTaskReq) (*DeleteTaskResp, error)

	// GetFieldDataExploreReport 获取字段报告
	GetFieldDataExploreReport(ctx context.Context, req *FieldReportSearchReq) (*FieldReportResp, error)

	// DeleteExploreTaskHandler 删除探查任务处理
	DeleteExploreTaskHandler(ctx context.Context, taskId *DeleteTaskMsg) error

	// GetDataExploreReports 获取报告
	GetDataExploreReports(ctx context.Context, req *GetDataExploreReportsReq) (*GetDataExploreReportsResp, error)

	GetLatestDataExploreReportList(ctx context.Context, req *ReportListReq) (*ReportListResp, error)

	GetDataExploreThirdPartyReportByParam(ctx context.Context, req *ReportSearchReq) (*ReportFormat, error)

	ThirdPartyExplorationResultHandler(ctx context.Context, msg []byte) error

	DeleteExploreReport(ctx context.Context, req *DeleteDataExploreReportReq) (*DeleteDataExploreReportResp, error)

	TaskConfigProcess(ctx context.Context, taskConfig *model.TaskConfig) error
}

func NewReportListRespParam(ctx context.Context, models []*model.Report, total int64) (result *ListReportRespParam, err error) {
	entries := make([]*ReportSummary, 0, len(models))
	for _, m := range models {
		var entry ReportSummary
		if err = json.Unmarshal([]byte(*m.QueryParams), &entry); err != nil {
			return nil, errorcode.Detail(errorcode.PublicInternalError, err)
		}

		entry.TaskId = strconv.FormatUint(m.TaskID, 10)
		entry.Version = *m.TaskVersion
		entry.Code = *m.Code
		entry.Total = util.PtrToValue(m.TotalNum)
		entry.TotalScore = m.TotalScore
		entry.CompletenessScore = m.TotalCompleteness
		entry.UniquenessScore = m.TotalUniqueness
		entry.StandardizationScore = m.TotalStandardization
		entry.AccuracyScore = m.TotalAccuracy
		entry.ConsistencyScore = m.TotalConsistency
		entry.CreatedAt = util.ValueToPtr(m.CreatedAt.UnixMilli())
		entry.FinishedAt = util.ValueToPtr(m.FinishedAt.UnixMilli())
		entries = append(entries, &entry)
	}

	result = &ListReportRespParam{
		PageResult: response.PageResult[ReportSummary]{
			Entries:    entries,
			TotalCount: total,
		},
	}
	return result, err
}

func NewReportListResp(ctx context.Context, models []*model.Report, total int64) (result *ReportListResp, err error) {
	entries := make([]*ReportInfo, 0, len(models))
	for _, m := range models {
		entry := &ReportInfo{
			Code:       *m.Code,
			TaskId:     strconv.FormatUint(m.TaskID, 10),
			Version:    *m.TaskVersion,
			TableId:    *m.TableID,
			FinishedAt: m.FinishedAt.UnixMilli(),
		}
		entries = append(entries, entry)
	}

	result = &ReportListResp{
		PageResult: response.PageResult[ReportInfo]{
			Entries:    entries,
			TotalCount: total,
		},
	}
	return result, err
}

func NewThirdPartyReportListResp(ctx context.Context, models []*model.ThirdPartyReport, total int64) (result *ReportListResp, err error) {
	entries := make([]*ReportInfo, 0, len(models))
	for _, m := range models {
		entry := &ReportInfo{
			Code:       m.Code,
			TaskId:     strconv.FormatUint(m.TaskID, 10),
			Version:    *m.TaskVersion,
			TableId:    *m.TableID,
			FinishedAt: m.FinishedAt.UnixMilli(),
		}
		entries = append(entries, entry)
	}

	result = &ReportListResp{
		PageResult: response.PageResult[ReportInfo]{
			Entries:    entries,
			TotalCount: total,
		},
	}
	return result, err
}

func NewThirdPartyReportListRespParam(ctx context.Context, models []*model.ThirdPartyReport, total int64) (result *ListReportRespParam, err error) {
	entries := make([]*ReportSummary, 0, len(models))
	for _, m := range models {
		var entry ReportSummary
		if err = json.Unmarshal([]byte(*m.QueryParams), &entry); err != nil {
			return nil, errorcode.Detail(errorcode.PublicInternalError, err)
		}

		entry.TaskId = strconv.FormatUint(m.TaskID, 10)
		entry.Version = *m.TaskVersion
		entry.Code = m.Code
		entry.Total = util.PtrToValue(m.TotalNum)
		entry.TotalScore = m.TotalScore
		entry.CompletenessScore = m.TotalCompleteness
		entry.UniquenessScore = m.TotalUniqueness
		entry.StandardizationScore = m.TotalStandardization
		entry.AccuracyScore = m.TotalAccuracy
		entry.ConsistencyScore = m.TotalConsistency
		entry.CreatedAt = util.ValueToPtr(m.CreatedAt.UnixMilli())
		entry.FinishedAt = util.ValueToPtr(m.FinishedAt.UnixMilli())
		entries = append(entries, &entry)
	}

	result = &ListReportRespParam{
		PageResult: response.PageResult[ReportSummary]{
			Entries:    entries,
			TotalCount: total,
		},
	}
	return result, err
}
