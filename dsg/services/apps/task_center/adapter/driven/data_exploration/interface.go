package data_exploration

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/task_center/common/models/response"
)

type ReportListReq struct {
	Offset      *int    `json:"offset" form:"offset,default=1" binding:"omitempty,min=1" default:"1"`                                             // 页码，默认1
	Limit       *int    `json:"limit" form:"limit,default=10" binding:"omitempty,min=1,max=2000"  default:"10"`                                   // 每页大小，默认10
	Direction   *string `json:"direction" form:"direction,default=desc" binding:"omitempty,oneof=asc desc" default:"desc"`                        // 排序方向，枚举：asc：正序；desc：倒序。默认倒序
	Sort        *string `json:"sort" form:"sort,default=f_created_at" binding:"omitempty,oneof=f_created_at f_updated_at" default:"f_created_at"` // 排序类型，枚举：f_created_at：按创建时间排序；f_updated_at：按更新时间排序; 默认按创建时间排序
	Keyword     string  `json:"keyword" form:"keyword" binding:"trimSpace,omitempty,min=1,max=255"`                                               // 关键字查询，字符无限制
	CatalogName string  `json:"catalog_name" form:"catalog_name" binding:"omitempty"`                                                             // 数据源编
	ThirdParty  bool    `json:"third_party" form:"third_party" binding:"omitempty"`                                                               // 第三方报告
}

type ReportListResp struct {
	response.PageResultNew[ReportInfo]
}

type ReportInfo struct {
	Code       string `json:"code" `       // 数据探查报告编号
	TaskId     string `json:"task_id" `    // 任务ID
	Version    int32  `json:"version" `    // 任务版本
	TableId    string `json:"table_id"`    // 表id
	FinishedAt int64  `json:"finished_at"` // 完成时间
}

type ThirdPartyTaskConfigReq struct {
	TaskName        string          `json:"task_name" binding:"trimSpace,min=1,max=255,VerifyDescription" example:"1"`           // 探查任务配置名称
	TaskDesc        string          `json:"task_desc" binding:"trimSpace,min=0,max=255,VerifyDescription" example:"1"`           // 探查描述
	TableId         string          `json:"table_id" binding:"required,trimSpace,min=1,max=255,VerifyDescription" example:"1"`   // 数据源表ID
	Table           string          `json:"table" binding:"required,trimSpace,min=1,max=255,VerifyDescription" example:"1"`      // 表名称
	Schema          string          `json:"schema" binding:"required,trimSpace,min=1,max=255,VerifyDescription" example:"1"`     // 数据库名
	VeCatalog       string          `json:"ve_catalog" binding:"required,trimSpace,min=1,max=255,VerifyDescription" example:"1"` // 数据源编
	FieldExplore    []*ExploreField `json:"field_explore" binding:"omitempty,dive"`                                              // 字段探查参数
	MetadataExplore []*Projects     `json:"metadata_explore" binding:"omitempty"`                                                // 元数据级探查项目
	RowExplore      []*Projects     `json:"row_explore" binding:"omitempty"`                                                     // 行级级探查项目
	ViewExplore     []*Projects     `json:"view_explore" binding:"omitempty"`                                                    // 视图级探查项目
	ExploreType     int32           `json:"explore_type" binding:"required,TrimSpace,oneof=1 2"`                                 // 探查类型,1 探查数据,2 探查时间戳
	TotalSample     int32           `json:"total_sample" binding:"TrimSpace,min=0"`                                              // 探查样本总数，全量探查时该参数无效
	TaskEnabled     int32           `json:"task_enabled" binding:"required,TrimSpace,oneof=0 1"`                                 // 探查配置启用禁用状态，0禁用，1启用
	UserId          string          `json:"user_id" binding:"omitempty,uuid"`                                                    // 用户id
	UserName        string          `json:"user_name" binding:"omitempty"`                                                       // 用户名
	WorkOrderId     string          `json:"work_order_id" binding:"omitempty,uuid"`                                              // 工单id
}

type ExploreField struct {
	FieldId   string      `json:"field_id" binding:"omitempty"`
	FieldName string      `json:"field_name" binding:"omitempty,TrimSpace,min=1,max=255,VerifyDescription"` // 字段名称
	FieldType string      `json:"field_type" binding:"omitempty,TrimSpace"`                                 // 字段类型
	Projects  []*Projects `json:"projects" binding:"omitempty,dive"`                                        // 探查项目
	Params    string      `json:"params" binding:"omitempty"`                                               // 探查项目参数
	Code      []string    `json:"code" binding:"omitempty,TrimSpace"`
}

type Projects struct {
	RuleId          string  `json:"rule_id" binding:"required,uuid"`
	RuleName        string  `json:"rule_name" binding:"omitempty"`
	RuleDescription string  `json:"rule_description" binding:"omitempty"`
	Dimension       string  `json:"dimension" binding:"required"`
	DimensionType   string  `json:"dimension_type" binding:"omitempty"`
	RuleConfig      *string `json:"rule_config" binding:"omitempty"`
}

type TaskConfigResp struct {
	TaskId  string `json:"task_id" binding:"TrimSpace" example:"1"` // 任务配置id
	Version int32  `json:"version" binding:"TrimSpace" example:"1"` // 版本号
}

type DataExploration interface {
	GetReportList(ctx context.Context, req *ReportListReq) (*ReportListResp, error)
	CreateThirdPartyTaskConfig(ctx context.Context, req *ThirdPartyTaskConfigReq) (*TaskConfigResp, error)
}
