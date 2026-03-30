package task_config

import (
	"context"
	"encoding/json"
	"strconv"

	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/common/models/request"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/common/models/response"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/infrastructure/repository/db/model"
)

// req

type TaskIdPathParam struct {
	TaskId constant.ModelID `json:"task_id" uri:"task_id" binding:"required,VerifyModelID" example:"1"` // task_id
}

type TaskConfigUpdateReq struct {
	TaskIdPathParam
	TaskConfigReq
}

type TaskConfigDeleteReq struct {
	TaskIdPathParam
}

type TaskConfigReq struct {
	TaskName        string          `json:"task_name" binding:"TrimSpace,min=1,max=255,VerifyDescription" example:"1"`           // 探查任务配置名称
	TaskDesc        string          `json:"task_desc" binding:"TrimSpace,min=0,max=255,VerifyDescription" example:"1"`           // 探查描述
	TableId         string          `json:"table_id" binding:"required,TrimSpace,min=1,max=255,VerifyDescription" example:"1"`   // 数据源表ID
	Table           string          `json:"table" binding:"required,TrimSpace,min=1,max=255,VerifyDescription" example:"1"`      // 表名称
	Schema          string          `json:"schema" binding:"required,TrimSpace,min=1,max=255,VerifyDescription" example:"1"`     // 数据库名
	VeCatalog       string          `json:"ve_catalog" binding:"required,TrimSpace,min=1,max=255,VerifyDescription" example:"1"` // 数据源编
	FieldExplore    []*ExploreField `json:"field_explore" binding:"omitempty,dive"`                                              // 字段探查参数
	MetadataExplore []*Projects     `json:"metadata_explore" binding:"omitempty"`                                                // 元数据级探查项目
	RowExplore      []*Projects     `json:"row_explore" binding:"omitempty"`                                                     // 行级级探查项目
	ViewExplore     []*Projects     `json:"view_explore" binding:"omitempty"`                                                    // 视图级探查项目
	ExploreType     int32           `json:"explore_type" binding:"required,TrimSpace,oneof=1 2"`                                 // 探查类型,1 探查数据,2 探查时间戳
	TotalSample     int32           `json:"total_sample" binding:"TrimSpace,min=0"`                                              // 探查样本总数，全量探查时该参数无效
	TaskEnabled     int32           `json:"task_enabled" binding:"required,TrimSpace,oneof=0 1"`                                 // 探查配置启用禁用状态，0禁用，1启用
	UserId          string          `json:"user_id" binding:"omitempty,uuid"`                                                    // 用户id
	UserName        string          `json:"user_name" binding:"omitempty"`                                                       // 用户名
	DvTaskId        string          `json:"dv_task_id" binding:"required,uuid"`                                                  // data-view任务id
	FieldInfo       string          `json:"field_info"`
}

type ThirdPartyTaskConfigReq struct {
	TaskName        string          `json:"task_name" binding:"TrimSpace,min=1,max=255,VerifyDescription" example:"1"`           // 探查任务配置名称
	TaskDesc        string          `json:"task_desc" binding:"TrimSpace,min=0,max=255,VerifyDescription" example:"1"`           // 探查描述
	TableId         string          `json:"table_id" binding:"required,TrimSpace,min=1,max=255,VerifyDescription" example:"1"`   // 数据源表ID
	Table           string          `json:"table" binding:"required,TrimSpace,min=1,max=255,VerifyDescription" example:"1"`      // 表名称
	Schema          string          `json:"schema" binding:"required,TrimSpace,min=1,max=255,VerifyDescription" example:"1"`     // 数据库名
	VeCatalog       string          `json:"ve_catalog" binding:"required,TrimSpace,min=1,max=255,VerifyDescription" example:"1"` // 数据源编
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

type Project struct {
	Code    string `json:"code" binding:"required,TrimSpace,min=0,max=255,oneof=total_count null_count blank_count max min zero avg var_pop stddev_pop true false date_distribute_day date_distribute_month date_distribute_year quantile unique dict dict_not_in group not_null"` // 探查项目编号 详见设计文档探查项目字典项含义
	Version int32  `json:"version,default=1" binding:"required,oneof=1" default:"1"`                                                                                                                                                                                               // 版本号，目前只能为1
	Params  Param  `json:"param" binding:"omitempty,dive"`                                                                                                                                                                                                                         // 探查项目参数
}

type Param struct {
	Regular  *string `json:"regular,omitempty" binding:"omitempty,TrimSpace,min=0,max=255,VerifyDescription"` // 探查正则表达式
	Min      *string `json:"min,omitempty" binding:"omitempty,TrimSpace,min=0,max=255,VerifyDescription"`     // 最小值
	Max      *string `json:"max,omitempty" binding:"omitempty,TrimSpace,min=0,max=255,VerifyDescription"`     // 最大值
	Quantile *int32  `json:"quantile,omitempty" binding:"omitempty,min=0,max=100"`                            // 分位数,一般是25，75
	DictId   *string `json:"dict_id,omitempty" binding:"omitempty,TrimSpace,min=0,max=255,VerifyDescription"` // 码表id
}

type TaskConfigResp struct {
	TaskId  string `json:"task_id" binding:"TrimSpace" example:"1"` // 任务配置id
	Version int32  `json:"version" binding:"TrimSpace" example:"1"` // 版本号
}

type TaskConfigRespDetail struct {
	TaskId         string         `json:"task_id" binding:"TrimSpace" example:"1"`                         // 任务配置id
	Version        *int32         `json:"version" binding:"TrimSpace" example:"1"`                         // 版本号
	TaskName       *string        `json:"task_name" binding:"TrimSpace,min=1" example:"1"`                 // 探查任务配置名称
	TableId        *string        `json:"table_id" binding:"required,TrimSpace" example:"1"`               // 数据源表ID
	Table          *string        `json:"table" binding:"required,TrimSpace,min=1" example:"1"`            // 表名称
	Schema         *string        `json:"schema" binding:"required,TrimSpace,min=1" example:"1"`           // 数据库名
	VeCatalog      *string        `json:"ve_catalog" binding:"required,TrimSpace,min=1" example:"1"`       // 数据源编
	FieldExplore   []ExploreField `json:"field_explore" binding:"omitempty,dive"`                          // 字段探查参数
	TableExplore   []Projects     `json:"table_explore_projects" binding:"omitempty,dive"`                 // 表级探查项目
	ExploreType    *int32         `json:"explore_type" binding:"required,TrimSpace,oneof=1 2 3"`           // 探查类型,0 快速探查,1 随机快速探,2 全量探查,3 探查时间戳
	TotalSample    *int32         `json:"total_sample" binding:"TrimSpace,min=0,max=10000"`                // 探查样本总数，全量探查时该参数无效
	TaskEnabled    *int32         `json:"task_enabled" binding:"required,TrimSpace,oneof=0 1"`             // 探查配置启用禁用状态，0禁用，1启用
	ExecStatus     *int32         `json:"exec_status" binding:"required,TrimSpace,oneof=0 1 2 3"`          // 执行状态 1未执行，2执行中，3执行成功，4已取消，5执行失败
	ExecAt         *int64         `json:"exec_at" binding:"omitempty"`                                     // 最后一次执行时间
	CreatedAt      *int64         `json:"created_at" binding:"omitempty"`                                  // 创建时间
	CreatedByUID   *string        `json:"created_by_uid" binding:"required,TrimSpace,min=1" example:"1"`   // 创建人ID
	CreatedByUname *string        `json:"created_by_uname" binding:"required,TrimSpace,min=1" example:"1"` // 创建人名称
	UpdatedAt      *int64         `json:"updated_at" binding:"omitempty,TrimSpace,min=0,max=256"`          // 更新时间
	UpdatedByUID   *string        `json:"updated_by_uid" binding:"required,TrimSpace,min=1" example:"1"`   // 更新人ID
	UpdatedByUname *string        `json:"updated_by_uname" binding:"required,TrimSpace,min=1" example:"1"` // 更新人名称
}

type TaskConfigListReq struct {
	TableId string `json:"table_id" form:"table_id" binding:"omitempty,TrimSpace,min=1,max=255" example:"1"` // 数据源表ID
	request.PageInfo
}

type TaskConfigDetailReq struct {
	TaskIdPathParam
	Version int32 `json:"version" form:"version" binding:"omitempty,TrimSpace,min=1" example:"1"` // 版本号
}

type TaskConfigListRespParam struct {
	response.PageResult[TaskConfigRespDetail]
}

type TaskStatusReq struct {
	Schema    string `json:"schema" form:"schema" binding:"required_without=DvTaskId,omitempty,TrimSpace,min=1" example:"1"`         // 数据库名
	VeCatalog string `json:"ve_catalog" form:"ve_catalog" binding:"required_without=DvTaskId,omitempty,TrimSpace,min=1" example:"1"` // 数据源编
	DvTaskId  string `json:"dv_task_id" form:"dv_task_id" binding:"omitempty,TrimSpace,min=1" example:"1"`                           // data-view任务id
}

type TableTaskStatusReq struct {
	TableIds []string `json:"table_ids" form:"table_ids" binding:"required,dive,TrimSpace,min=1"`
}

type TaskStatusRespDetail struct {
	TaskId      string  `json:"task_id" binding:"TrimSpace" example:"1"`                   // 任务配置id
	TaskName    *string `json:"task_name" binding:"TrimSpace,min=1" example:"1"`           // 探查任务配置名称
	TableId     *string `json:"table_id" binding:"required,TrimSpace" example:"1"`         // 数据源表ID
	Table       *string `json:"table" binding:"required,TrimSpace,min=1" example:"1"`      // 表名称
	Schema      *string `json:"schema" binding:"required,TrimSpace,min=1" example:"1"`     // 数据库名
	VeCatalog   *string `json:"ve_catalog" binding:"required,TrimSpace,min=1" example:"1"` // 数据源编
	ExecStatus  *int32  `json:"exec_status" binding:"required,TrimSpace,oneof=0 1 2 3"`    // 执行状态 1未执行，2执行中，3执行成功，4已取消，5执行失败
	UpdatedAt   *int64  `json:"updated_at" binding:"omitempty,TrimSpace,min=0,max=256"`    // 更新时间
	ExploreType *int32  `json:"explore_type"  binding:"required"`                          // 探查类型
	Reason      *string `json:"reason" binding:"omitempty"`                                // 失败原因
}

type TaskStatusRespParam struct {
	response.PageResult[TaskStatusRespDetail]
}

type Domain interface {
	CreateTaskConfig(ctx context.Context, req *TaskConfigReq) (*TaskConfigResp, error)
	UpdateTaskConfig(ctx context.Context, req *TaskConfigUpdateReq) (*TaskConfigResp, error)
	DeleteTaskConfig(ctx context.Context, req *TaskConfigDeleteReq) (*TaskConfigResp, error)
	GetTaskConfigByTaskVersion(ctx context.Context, req *TaskConfigDetailReq) (result *TaskConfigRespDetail, err error)
	GetTaskConfigList(ctx context.Context, req *TaskConfigListReq) (result *TaskConfigListRespParam, err error)
	GetTaskStatus(ctx context.Context, req *TaskStatusReq) (result *TaskStatusRespParam, err error)
	GetTableTaskStatus(ctx context.Context, req *TableTaskStatusReq) (result *TaskStatusRespParam, err error)
	CreateThirdPartyTaskConfig(ctx context.Context, req *ThirdPartyTaskConfigReq) (*TaskConfigResp, error)
}

func NewListRespParam(ctx context.Context, models []*model.TaskConfig, total int64) (result *TaskConfigListRespParam, err error) {
	entries := make([]*TaskConfigRespDetail, 0, len(models))
	for _, m := range models {
		var entry TaskConfigRespDetail
		if err = json.Unmarshal([]byte(*m.QueryParams), &entry); err != nil {
			return nil, errorcode.Detail(errorcode.PublicInternalError, err)
		}
		if m.ExecAt != nil {
			entry.ExecAt = util.ValueToPtr(m.ExecAt.UnixMilli())
		}
		entry.TaskId = strconv.FormatUint(m.TaskID, 10)
		entry.Version = m.Version
		entry.ExecStatus = m.ExecStatus
		entry.CreatedAt = util.ValueToPtr(m.CreatedAt.UnixMilli())
		entry.CreatedByUname = m.CreatedByUname
		entry.CreatedByUID = m.CreatedByUID
		entry.UpdatedAt = util.ValueToPtr(m.UpdatedAt.UnixMilli())
		entry.UpdatedByUID = m.UpdatedByUID
		entry.UpdatedByUname = m.UpdatedByUname
		entries = append(entries, &entry)
	}

	result = &TaskConfigListRespParam{
		PageResult: response.PageResult[TaskConfigRespDetail]{
			Entries:    entries,
			TotalCount: total,
		},
	}
	return result, err
}

func NewListTaskRespParam(ctx context.Context, models []*model.Report, total int64) (result *TaskStatusRespParam, err error) {
	entries := make([]*TaskStatusRespDetail, 0, len(models))
	for _, m := range models {
		var entry TaskStatusRespDetail
		if err = json.Unmarshal([]byte(*m.QueryParams), &entry); err != nil {
			return nil, errorcode.Detail(errorcode.PublicInternalError, err)
		}

		entry.TaskId = strconv.FormatUint(m.TaskID, 10)
		entry.ExecStatus = m.Status
		if m.FinishedAt != nil {
			entry.UpdatedAt = util.ValueToPtr(m.FinishedAt.UnixMilli())
		}
		entry.ExploreType = m.ExploreType
		entry.Reason = m.Reason
		entries = append(entries, &entry)
	}

	result = &TaskStatusRespParam{
		PageResult: response.PageResult[TaskStatusRespDetail]{
			Entries:    entries,
			TotalCount: total,
		},
	}
	return result, err
}

const (
	ExploreType_Data = int32(iota) + 1
	ExploreType_Timestamp
)
