package tc_task

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"sort"
	"strings"
	"time"

	"go.uber.org/zap"

	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/business_grooming"
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/data_catalog"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/user_util"
	"github.com/kweaver-ai/idrm-go-common/access_control"

	"github.com/kweaver-ai/dsg/services/apps/task_center/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/enum"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

type TaskCreateReqModel struct {
	Id              string   `json:"-"`
	Name            string   `json:"name" binding:"required,min=0,max=32,VerifyXssString"`                                                    // 任务名，1-32，中英文、数字、下划线及中划线
	Description     string   `json:"description" binding:"min=0,max=255,VerifyXssString"`                                                     // 任务描述，0-255，中英文、数字及键盘上的特殊字符
	ProjectId       string   `json:"project_id"  binding:"omitempty,uuid" example:"4a5a3cc0-0169-4d62-9442-62214d8fcd8d"`                     // 项目id，uuid（36）
	WorkOrderId     string   `json:"work_order_id"  binding:"omitempty,uuid" example:"4a5a3cc0-0169-4d62-9442-62214d8fcd8d"`                  // 工单id，uuid（36）
	StageId         string   `json:"-"`                                                                                                       // 阶段id，uuid（36）不需要填写
	NodeId          string   `json:"node_id" binding:"required_with=ProjectId,omitempty,uuid" example:"2eaccf8e-c7f0-40f9-ab7a-317d3b0c3802"` // 节点id，uuid（36）
	Priority        string   `json:"priority" form:"priority" binding:"omitempty,oneof=common emergent urgent"`                               // 任务优先级，枚举 "common" "emergent" "urgent"
	ExecutorId      string   `json:"executor_id"   binding:"omitempty,uuid" example:"016390d9-0e72-460b-9004-1a27b56c22d3"`                   // 任务执行人id，uuid（36）
	Deadline        int64    `json:"deadline" binding:"verifyDeadline,max=9999999999" example:"4102329600"`                                   // 截止日期
	TaskType        string   `json:"task_type" form:"task_type" binding:"verifyTaskType"`                                                     // 任务类型枚举值，默认normal普通任务、modeling业务建模任务、dataModeling数据建模任务
	BusinessModelID string   `json:"business_model_id" binding:"omitempty,uuid"`                                                              // 业务模型ID&数据模型ID
	ParentTaskId    string   `json:"parent_task_id" binding:"omitempty,uuid"`                                                                 // 父任务的ID， 新建标准任务必填
	Data            []string `json:"data" binding:"omitempty"`                                                                                // 任务关联数据集合
	CreatedByUID    string   `json:"-"`                                                                                                       // 创建者的uid
	DomainID        string   `json:"domain_id" binding:"omitempty,uuid"`                                                                      // 业务流程id，如果是建模类任务，必填
	OrgType         *int     `json:"org_type" binding:"required_if=TaskType fieldStandard,omitempty,oneof=0 1 2 3 4 5 6 99"`                  //  标准分类
	//task_type=1<<8  256 dataComprehension 数据目录理解任务
	DataCatalogID               []string `json:"data_catalog_id" binding:"omitempty,dive"`                                         //关联数据资源目录
	DataComprehensionTemplateID string   `json:"data_comprehension_template_id" binding:"omitempty,uuid"`                          //关联数据理解模板
	ModelChildTaskTypes         []string `json:"model_child_task_types" binding:"omitempty,lte=5,dive,oneof=1 2 3 4 5 6 7 8 9 10"` //业务模型&数据模型的子类型数组，每个模型最多5个子类型。业务模型子类型：1录入流程图、2录入节点表、3录入标准表、4录入指标表、5业务标准表标准化；数据模型子类型：6录入数据来源表、7录入数据标准表、8录入数据融合表、9录入数据统计指标、10数据标准表标准化
}

//SubjectDomainId string   `json:"subject_domain_id" binding:"omitempty,uuid"`                                                              // 主题域id，可不填，如果是建模类任务，必填

//FlowId       string                  `json:"flow_id" binding:"required,uuid" example:"2eaccf8e-c7f0-40f9-ab7a-317d3b0c3802"`        // 流水线id，uuid（36）
//FlowVersion  string                  `json:"flow_version" binding:"required,uuid" example:"2eaccf8e-c7f0-40f9-ab7a-317d3b0c3802"`   // 流水线版本，uuid（36）

type TaskUpdateReqModel struct {
	Id               string   `json:"id"  example:"2eaccf8e-c7f0-40f9-ab7a-317d3b0c3802"`                                                   // 任务id，uuid（36）
	Name             string   `json:"name" binding:"min=0,max=32,VerifyXssString"`                                                          // 任务名，1-32，中英文、数字、下划线及中划线
	Description      *string  `json:"description" binding:"omitempty,min=0,max=255,VerifyXssString"`                                        // 任务描述，0-255，中英文、数字及键盘上的特殊字符
	ProjectId        string   `json:"-"`                                                                                                    // 项目id，uuid（36）
	WorkOrderId      string   `json:"work_order_id"  binding:"omitempty,uuid" example:"4a5a3cc0-0169-4d62-9442-62214d8fcd8d"`               // 工单id，uuid（36）
	Status           string   `json:"status" binding:"omitempty,oneof=ready ongoing completed"`                                             // 任务状态，枚举 "ready" "ongoing" "completed"
	Priority         string   `json:"priority" binding:"omitempty,oneof=common emergent urgent"`                                            // 任务优先级，枚举 "common" "emergent" "urgent"
	ExecutorId       *string  `json:"executor_id" binding:"omitempty,verifyUuidNotRequired" example:"016390d9-0e72-460b-9004-1a27b56c22d3"` // 任务执行人id，uuid（36）,非必填但必传，为了删除执行人
	Deadline         *int64   `json:"deadline" binding:"omitempty,verifyDeadline,max=9999999999" example:"4102329600"`                      // 截止日期
	TaskType         string   `json:"task_type" form:"task_type" binding:"verifyTaskType"`                                                  // 任务类型，枚举值，可不填，默认normal
	BusinessModelID  string   `json:"business_model_id" binding:"omitempty,uuid"`                                                           //业务模型和数据模型ID
	Data             []string `json:"data,omitempty"`                                                                                       // 任务关联数据集合
	UpdatedByUID     string   `json:"-"`                                                                                                    // 更新人id
	ConfigStatus     int8     `json:"-"`
	ExecutableStatus int8     `json:"-"`
	DomainID         string   `json:"domain_id" binding:"omitempty,uuid"` // 业务流程id，如果是建模类任务，必填
	// OrgType          *int     `json:"org_type" binding:"required_if=TaskType fieldStandard,omitempty,oneof=0 1 2 3 4 5 6 99"` //  标准分类
	DataCatalogID               []string `json:"data_catalog_id" binding:"omitempty,dive"`                //关联数据资源目录
	DataComprehensionTemplateID string   `json:"data_comprehension_template_id" binding:"omitempty,uuid"` //关联数据理解模板
}

//ProjectId    string                  `json:"project_id" form:"project_id"  binding:"omitempty,uuid" example:"4a5a3cc0-0169-4d62-9442-62214d8fcd8d"` // 项目id，uuid（36）
//StageId      string                  `json:"stage_id" binding:"uuid" example:"2eaccf8e-c7f0-40f9-ab7a-317d3b0c3802"`                                // 阶段id，uuid（36）
//NodeId       string                  `json:"node_id" binding:"uuid" example:"2eaccf8e-c7f0-40f9-ab7a-317d3b0c3802"`			 // 节点id，uuid（36）

type TaskQueryParam struct {
	ProjectId        string   `json:"project_id" form:"project_id"  binding:"omitempty,uuid" example:"4a5a3cc0-0169-4d62-9442-62214d8fcd8d"`     // 项目id，uuid（36）
	Offset           uint64   `json:"offset" form:"offset,default=1" binding:"min=1"`                                                            // 页码
	Limit            uint64   `json:"limit" form:"limit,default=10" binding:"min=1,max=1000"`                                                    // 每页大小
	Direction        string   `json:"direction" form:"direction,default=desc" binding:"oneof=asc desc"`                                          // 排序方向
	Sort             string   `json:"sort" form:"sort,default=created_at" binding:"oneof=created_at updated_at deadline"`                        // 排序类型
	Keyword          string   `json:"keyword" form:"keyword"  binding:"omitempty,VerifyXssString,max=32"`                                        // 任务名称
	Status           string   `json:"status" form:"status" binding:"verifyMultiStatus"`                                                          // 任务状态，枚举 "ready未开始" "ongoing进行中" "completed已完成" 可以多选，逗号分隔
	TaskType         string   `json:"task_type" form:"task_type" binding:"omitempty,verifyMultiTaskType"`                                        // 任务类型，枚举 "normal" "modeling" "dataModeling" "standardization" "businessDiagnosis" "mainBusiness" 可以多选，逗号分隔。不传/传空相当于全选。
	Priority         string   `json:"priority" form:"priority" binding:"verifyMultiPriority"`                                                    // 任务优先级，枚举 "common" "emergent" "urgent" 可以多选，逗号分隔
	ExecutorId       string   `json:"executor_id" form:"executor_id" binding:"verifyMultiUuid"`                                                  // 任务执行人id，可以多选，逗号分隔
	IsCreate         bool     `json:"is_create" form:"is_create"`                                                                                // 是否我创建的任务列表，true：我创建的任务列表，false:我执行的任务列表
	Overdue          string   `json:"overdue" form:"overdue" binding:"omitempty,oneof=overdue due"`                                              // 是否逾期，枚举 "overdue" "due"
	NodeId           string   `json:"node_id" form:"node_id" binding:"omitempty,uuid" example:"2eaccf8e-c7f0-40f9-ab7a-317d3b0c3802"`            // 节点id，uuid（36），节点id不为空时，项目id不能为空
	ExecutableStatus string   `json:"executable_status" form:"executable_status" binding:"omitempty,oneof=blocked executable invalid completed"` //任务可开启类型： 枚举：blocked executable invalid completed
	IsPre            bool     `json:"is_pre" form:"is_pre"`                                                                                      //是否是查询该项目的该节点的全部前序任务                                                                        // 是否我创建的任务列表，true：我创建的任务列表，false:我执行的任务列表
	ExcludeTaskType  string   `json:"exclude_task_type" form:"exclude_task_type" binding:"omitempty,verifyMultiTaskType"`                        //需要排除的任务类型
	Statistics       bool     `json:"statistics" form:"statistics"`                                                                              //单独查询任务数量统计
	UserId           string   `json:"userId"`                                                                                                    // 用户uerId
	PreNodes         []string `json:"-"`
	WorkOrderId      string   `json:"work_order_id" form:"work_order_id" binding:"omitempty,uuid" example:"4a5a3cc0-0169-4d62-9442-62214d8fcd8d"` // 工单id，uuid（36）
}

type TaskBatchIdsReq struct {
	Ids []string `json:"ids" form:"ids" uri:"ids" binding:"required,lte=10,dive" example:"[\"2eaccf8e-c7f0-40f9-ab7a-317d3b0c3802\",\"317d3b0c3802\"]"` // 任务id数组，uuid（36）,最大10个
}

type QueryPageReapParam struct {
	Entries              []*TaskInfo `json:"entries"`                             // 任务列表
	TotalCount           int64       `json:"total_count" example:"3"`             // 当前筛选条件下的任务数量
	TotalProcessedTasks  int64       `json:"total_processed_tasks" example:"3"`   // 我执行的任务总数量，不受筛选条件影响
	TotalCreatedTasks    int64       `json:"total_created_tasks" example:"2"`     // 我创建的任务总数量，不受筛选条件影响
	TotalBlockedTasks    int64       `json:"total_blocked_tasks" example:"3"`     //未开启任务，不受筛选条件影响
	TotalExecutableTasks int64       `json:"total_executable_tasks"  example:"4"` //已开启任务，不受筛选条件影响
	TotalInvalidTasks    int64       `json:"total_invalid_tasks"  example:"5"`    //已失效任务，不受筛选条件影响
	TotalCompletedTasks  int64       `json:"total_completed_tasks"  example:"6"`  //已完成任务，不受筛选条件影响
}

type NodeInfo struct {
	StageID   string   `json:"stage_id"`   // 阶段id
	StageName string   `json:"stage_name"` // 阶段名称
	NodeID    string   `json:"node_id"`    // 节点id
	NodeName  string   `json:"node_name"`  // 节点名称
	TaskType  []string `json:"task_type"`  // 任务类型数组
}

type RateInfo struct {
	NodeId        string `json:"node_id"`        // 节点id
	TotalCount    uint64 `json:"total_count"`    // 节点下任务总数
	FinishedCount uint64 `json:"finished_count"` // 节点下已完成任务数
}

type StageInfoResult struct {
	Entries    []*NodeInfo `json:"entries"`                 // 阶段节点信息
	TotalCount int64       `json:"total_count" example:"3"` // 节点总数
}

// TaskDetailModel for get task detail info
type TaskDetailModel struct {
	Id               string `json:"id"`                // 任务id
	Name             string `json:"name"`              // 任务名称
	ProjectId        string `json:"project_id"`        // 项目id
	ProjectName      string `json:"project_name"`      // 项目名称
	WorkOrderId      string `json:"work_order_id"`     // 工单id
	WorkOrderName    string `json:"work_order_name"`   // 工单名称
	Image            string `json:"image"`             // 项目图片
	StageId          string `json:"stage_id"`          // 阶段id
	StageName        string `json:"stage_name"`        // 阶段名称
	NodeId           string `json:"node_id"`           // 节点id
	NodeName         string `json:"node_name"`         // 节点名称
	Status           string `json:"status"`            // 任务状态
	ConfigStatus     string `json:"config_status"`     // 任务配置状态，标记缺失的依赖，业务域或者主干业务
	ExecutableStatus string `json:"executable_status"` // 任务的可执行状态
	Deadline         int64  `json:"deadline"`          // 截止日期
	Overdue          string `json:"overdue"`           // 是否逾期
	Priority         string `json:"priority"`          // 任务优先级
	ExecutorId       string `json:"executor_id"`       // 任务执行人id
	ExecutorName     string `json:"executor_name"`     // 任务执行人
	Description      string `json:"description"`       // 任务描述
	CreatedBy        string `json:"created_by"`        // 创建人
	CreatedAt        int64  `json:"created_at"`        // 创建时间
	UpdatedBy        string `json:"updated_by"`        // 修改人
	UpdatedAt        int64  `json:"updated_at"`        // 修改时间

	OrgType                       *int                                  `json:"org_type,omitempty"`                                                               //标准分类
	TaskType                      string                                `json:"task_type"`                                                                        //任务类型
	DomainId                      string                                `json:"domain_id,omitempty"`                                                              //业务流程id
	DomainName                    string                                `json:"domain_name,omitempty"`                                                            //业务流程名字
	BusinessModelID               string                                `json:"business_model_id,omitempty"`                                                      //主干业务id
	BusinessModelName             string                                `json:"business_model_name,omitempty"`                                                    //主干业务id
	DataModelID                   string                                `json:"data_model_id"`                                                                    //数据模型ID
	DataModelName                 string                                `json:"data_model_name"`                                                                  //数据模型名称
	ParentTaskId                  string                                `json:"parent_task_id,omitempty"`                                                         //父任务的Id
	Data                          []*business_grooming.RelationDataInfo `json:"data"`                                                                             //关联数据列表
	NewMainBusinessId             string                                `json:"new_main_business_id"`                                                             //新建主干业务任务的主干业务ID,只有新建主干业务有
	DataCatalogID                 []string                              `json:"data_catalog_id"`                                                                  //关联数据资源目录
	DataComprehensionTemplateID   string                                `json:"data_comprehension_template_id"`                                                   //关联数据理解模板
	DataComprehensionTemplateName string                                `json:"data_comprehension_template_name"`                                                 //关联数据理解模板名称
	ModelChildTaskTypes           []string                              `json:"model_child_task_types" binding:"omitempty,lte=5,dive,oneof=1 2 3 4 5 6 7 8 9 10"` //业务模型&数据模型的子类型数组，每个模型最多5个子类型。业务模型子类型：1录入流程图、2录入节点表、3录入标准表、4录入指标表、5业务标准表标准化；数据模型子类型：6录入数据来源表、7录入数据标准表、8录入数据融合表、9录入数据统计指标、10数据标准表标准化

}

//SubjectDomainId   string                                `json:"subject_domain_id,omitempty"`   //业务域id
//SubjectDomainName string                                `json:"subject_domain_name,omitempty"` //业务域名字
//MainBusinessId    string                                `json:"main_business_id"`              //主干业务ID
//MainBusinessName  string                                `json:"main_business_name,omitempty"`  //主干业务名字

type TaskBriefModel struct {
	Id                  string   `json:"id"`                                                                               // 任务id
	Name                string   `json:"name"`                                                                             // 任务名称
	ProjectId           string   `json:"project_id"`                                                                       // 项目id
	ProjectName         string   `json:"project_name"`                                                                     // 项目名称
	Status              string   `json:"status"`                                                                           // 任务状态
	TaskType            string   `json:"task_type"`                                                                        // 任务类型
	BusinessModelID     string   `json:"business_model_id,omitempty"`                                                      //业务模型&数据模型ID
	ConfigStatus        string   `json:"config_status"`                                                                    //配置状态，
	Executor            string   `json:"executor"`                                                                         //执行人
	ProjectStatus       string   `json:"project_status"`                                                                   //任务状态
	ModelChildTaskTypes []string `json:"model_child_task_types" binding:"omitempty,lte=5,dive,oneof=1 2 3 4 5 6 7 8 9 10"` //业务模型&数据模型的子类型数组，每个模型最多5个子类型。业务模型子类型：1录入流程图、2录入节点表、3录入标准表、4录入指标表、5业务标准表标准化；数据模型子类型：6录入数据来源表、7录入数据标准表、8录入数据融合表、9录入数据统计指标、10数据标准表标准化

}
type TaskInfo struct {
	Id               string `json:"id"`                       // 任务id
	Name             string `json:"name"`                     // 任务名称
	ProjectId        string `json:"project_id"`               // 项目id
	ProjectName      string `json:"project_name"`             // 项目名称
	ProjectStatus    string `json:"project_status,omitempty"` // 项目状态
	WorkOrderId      string `json:"work_order_id"`            // 工单id
	WorkOrderName    string `json:"work_order_name"`          // 工单名称
	SourceType       string `json:"source_type"`              // 来源类型（"" 为空独立任务，没有来源，project 从任务来，work_order 从工单来 ）
	SourceName       string `json:"source_name"`              // 来源名称
	StageId          string `json:"stage_id"`                 // 阶段id
	NodeId           string `json:"node_id"`                  // 节点id
	Status           string `json:"status"`                   // 任务状态，ready未开始、ongoing进行中、completed已完成
	ConfigStatus     string `json:"config_status"`            // 任务配置状态,正常状态，主干业务被删除，或者业务域被删除
	ExecutableStatus string `json:"executable_status"`        // 可执行状态
	Deadline         int64  `json:"deadline"`                 // 截止日期
	Overdue          string `json:"overdue"`                  // 是否逾期
	Priority         string `json:"priority"`                 // 任务优先级
	ExecutorId       string `json:"executor_id"`              // 任务执行人id
	ExecutorName     string `json:"executor_name"`            // 任务执行人
	//RoleId           string `json:"role_id"`                  // 任务执行人角色
	Color       string `json:"color"`       // 角色颜色
	Description string `json:"description"` // 任务描述
	UpdatedBy   string `json:"updated_by"`  // 修改人
	UpdatedAt   int64  `json:"updated_at"`  // 修改时间

	OrgType             *int     `json:"org_type,omitempty"`                                                               //标准分类
	TaskType            string   `json:"task_type"`                                                                        // 任务类型
	SubjectDomainId     string   `json:"subject_domain_id,omitempty"`                                                      // 主题域id
	BusinessModelID     string   `json:"business_model_id,omitempty"`                                                      // 主干业务ID
	BusinessModelName   string   `json:"business_model_name,omitempty"`                                                    //主干业务id
	DomainId            string   `json:"domain_id,omitempty"`                                                              //业务流程id
	DomainName          string   `json:"domain_name,omitempty"`                                                            //业务流程名字
	TotalFields         int      `json:"total_fields"`                                                                     // 总的新建字段标准数量，废弃
	FinishedFields      int      `json:"finished_fields"`                                                                  // 完成的新建字段标准数量，废弃
	ModelChildTaskTypes []string `json:"model_child_task_types" binding:"omitempty,lte=5,dive,oneof=1 2 3 4 5 6 7 8 9 10"` //业务模型&数据模型的子类型数组，每个模型最多5个子类型。业务模型子类型：1录入流程图、2录入节点表、3录入标准表、4录入指标表、5业务标准表标准化；数据模型子类型：6录入数据来源表、7录入数据标准表、8录入数据融合表、9录入数据统计指标、10数据标准表标准化
}

type TaskPathProjectId struct {
	PId string `json:"pid" form:"pid" uri:"pid" binding:"required,uuid" example:"4a5a3cc0-0169-4d62-9442-62214d8fcd8d"` // 项目id，uuid（36）
}

type TaskPathModel struct {
	PId string `json:"pid" form:"pid" uri:"pid" binding:"required,uuid" example:"4a5a3cc0-0169-4d62-9442-62214d8fcd8d"` // 项目id，uuid（36）
	Id  string `json:"id" form:"id" uri:"id" binding:"required,uuid" example:"2eaccf8e-c7f0-40f9-ab7a-317d3b0c3802"`    // 任务id，uuid（36）
}
type TaskPathNodeId struct {
	PId string `json:"pid" form:"pid" uri:"pid" binding:"required,uuid" example:"4a5a3cc0-0169-4d62-9442-62214d8fcd8d"` // 项目id，uuid（36）
	NId string `json:"nid" form:"nid" uri:"nid" binding:"required,uuid" example:"2eaccf8e-c7f0-40f9-ab7a-317d3b0c3802"` // 任务id，uuid（36）
}
type TaskPathTaskType struct {
	PId      string `json:"pid" form:"pid" uri:"pid" binding:"required,uuid" example:"4a5a3cc0-0169-4d62-9442-62214d8fcd8d"`    // 项目id，uuid（36）
	TaskType string `json:"task_type" form:"task_type" uri:"task_type" binding:"required,verifyMultiTaskType" example:"normal"` // 任务类型，枚举值
}
type TaskUserId struct {
	UId string `json:"uid" form:"uid" uri:"uid" binding:"required,uuid" example:"2eaccf8e-c7f0-40f9-ab7a-317d3b0c3802"` // 任务id，uuid（36）
}
type BriefTaskPathModel struct {
	Id string `json:"id" form:"id" uri:"id" binding:"required,uuid" example:"2eaccf8e-c7f0-40f9-ab7a-317d3b0c3802"` // 任务id，uuid（36）
}

type BriefTaskQueryModel struct {
	ID         string `json:"id" form:"id" query:"id" binding:"required" ` // 任务id，uuid（36）
	IDSlice    []string
	Field      string `json:"field"  form:"field" query:"field" binding:"omitempty,required" `
	FieldSlice []string
}

func (b *BriefTaskQueryModel) Parse() {
	b.IDSlice = strings.Split(b.ID, ",")
	if b.Field != "" {
		b.FieldSlice = strings.Split(b.Field, ",")
	}
}

// IsFinishTask 判断该任务是不是完成任务动作
func IsFinishTask(dbStatus int8, reqStatus string) bool {
	return dbStatus == constant.CommonStatusOngoing.Integer.Int8() && reqStatus == constant.CommonStatusCompleted.String
}

func NewRelationData(task *model.TcTask, data []string) *model.TaskRelationsData {
	content := make(map[string]interface{})
	taskType := enum.ToString[constant.TaskType](task.TaskType)
	content["ids_type"] = constant.IdsType(taskType)
	content["ids"] = data
	if data == nil {
		content["ids"] = make([]string, 0)
	}
	bts, _ := json.Marshal(content)
	return &model.TaskRelationsData{
		TaskID:          task.ID,
		ProjectID:       task.ProjectID,
		BusinessModelId: task.BusinessModelID,
		Data:            string(bts),
		UpdatedByUID:    task.UpdatedByUID,
	}
}

func (t TaskCreateReqModel) ToModel(pid, fid, flowVersion string) *model.TcTask {
	if t.Priority == "" {
		t.Priority = constant.CommonPriorityCommon.String
	}
	if t.TaskType == "" {
		t.TaskType = constant.TaskTypeNormal.String
	}
	var dataComprehensionCatalogId string
	if len(t.DataCatalogID) != 0 {
		dataComprehensionCatalogId = strings.Join(t.DataCatalogID, ",")
	}
	taskModel := &model.TcTask{
		Name:         t.Name,
		Description:  sql.NullString{String: t.Description, Valid: true},
		ProjectID:    pid,
		WorkOrderId:  t.WorkOrderId,
		FlowID:       fid,
		FlowVersion:  flowVersion,
		StageID:      t.StageId,
		NodeID:       t.NodeId,
		Status:       constant.CommonStatusReady.Integer.Int8(),
		ConfigStatus: constant.TaskConfigStatusNormal.Integer.Int8(),
		Priority:     enum.ToInteger[constant.CommonPriority](t.Priority).Int8(),
		ExecutorID:   sql.NullString{String: t.ExecutorId, Valid: true},
		//ExecutorID:   t.ExecutorId,
		Deadline:                    sql.NullInt64{Int64: t.Deadline, Valid: true},
		CreatedByUID:                t.CreatedByUID,
		UpdatedByUID:                t.CreatedByUID,
		DataComprehensionCatalogId:  dataComprehensionCatalogId,
		DataComprehensionTemplateId: t.DataComprehensionTemplateID,
		ModelChildTaskTypes:         strings.Join(t.ModelChildTaskTypes, ","),
	}
	//如果是业务表标准化任务，那么加上parentTaskId
	if t.TaskType == constant.TaskTypeFieldStandard.String {
		taskModel.ParentTaskId = t.ParentTaskId
		taskModel.OrgType = t.OrgType
	}
	//任务类型判断
	if t.TaskType != "" {
		taskModel.TaskType = enum.ToInteger[constant.TaskType](t.TaskType).Int32()
	}
	//独立项目，关联主干业务 --> 现在关联流程 （仍然让taskModel.BusinessModelID作为流程id）
	//if t.ProjectId == "" {
	//	//taskModel.SubjectDomainId = t.SubjectDomainId
	//	taskModel.BusinessModelID = t.DomainID
	//}
	if t.TaskType == constant.TaskTypeDataCollecting.String || t.TaskType == constant.TaskTypeIndicatorProcessing.String {
		taskModel.BusinessModelID = t.BusinessModelID
	} else {
		taskModel.BusinessModelID = t.DomainID
	}

	return taskModel
}

// ToRelationData  生成任务关系数据
func (t TaskCreateReqModel) ToRelationData() *business_grooming.RelationDataUpdateModel {
	taskTypeInteger := enum.ToInteger[constant.TaskType](t.TaskType).Int8()
	return &business_grooming.RelationDataUpdateModel{
		TaskID:          t.Id,
		ProjectID:       t.ProjectId,
		BusinessModelId: t.BusinessModelID,
		TaskType:        t.TaskType,
		IdsType:         enum.ToString[constant.RelationIdType](taskTypeInteger),
		Ids:             t.Data,
		Updater:         t.CreatedByUID,
	}
}

// ToRelationData  生成任务关系数据
func (t TaskUpdateReqModel) ToRelationData(task *model.TcTask) *business_grooming.RelationDataUpdateModel {
	return &business_grooming.RelationDataUpdateModel{
		TaskID:          t.Id,
		ProjectID:       t.ProjectId,
		BusinessModelId: task.BusinessModelID,
		TaskType:        enum.ToString[constant.TaskType](task.TaskType),
		IdsType:         enum.ToString[constant.RelationIdType](task.TaskType),
		Ids:             t.Data,
		Updater:         t.UpdatedByUID,
	}
}
func (t TaskUpdateReqModel) ToModel(completeTime int64) *model.TcTask {
	var ExecutorIdValid, DeadlineValid, DescriptionValid bool
	var ExecutorIdString, DescriptionString string
	var DeadlineInt int64
	if t.ExecutorId != nil {
		ExecutorIdValid = true
		ExecutorIdString = *t.ExecutorId
	}
	if t.Deadline != nil {
		DeadlineValid = true
		DeadlineInt = *t.Deadline
	}
	if t.Description != nil {
		DescriptionValid = true
		DescriptionString = *t.Description
	}
	var dataComprehensionCatalogId string
	if len(t.DataCatalogID) != 0 {
		dataComprehensionCatalogId = strings.Join(t.DataCatalogID, ",")
	}

	taskModel := &model.TcTask{
		ID:          t.Id,
		Name:        t.Name,
		Description: sql.NullString{String: DescriptionString, Valid: DescriptionValid},
		ExecutorID:  sql.NullString{String: ExecutorIdString, Valid: ExecutorIdValid},
		//ExecutorID:   t.ExecutorId,
		Deadline:                    sql.NullInt64{Int64: DeadlineInt, Valid: DeadlineValid},
		CompleteTime:                completeTime,
		UpdatedByUID:                t.UpdatedByUID,
		BusinessModelID:             t.DomainID,
		DataComprehensionCatalogId:  dataComprehensionCatalogId,
		DataComprehensionTemplateId: t.DataComprehensionTemplateID,
	}
	//如果是业务表标准化任务，那么加上parentTaskId
	if t.ConfigStatus > 0 && t.ExecutableStatus > 0 {
		taskModel.ConfigStatus = t.ConfigStatus
		taskModel.ExecutableStatus = t.ExecutableStatus
	}
	if t.Status != "" {
		taskModel.Status = enum.ToInteger[constant.CommonStatus](t.Status).Int8()
	}
	if t.Priority != "" {
		taskModel.Priority = enum.ToInteger[constant.CommonPriority](t.Priority).Int8()
	}
	return taskModel
}

func (t *TaskDetailModel) ToHttp(ctx context.Context, m *model.TaskDetail) (*TaskDetailModel, error) {
	if m == nil {
		log.WithContext(ctx).Warn("model.TaskDetail is nil")
		return nil, nil
	}

	task := t
	if task == nil {
		task = &TaskDetailModel{}
	}
	task.OrgType = m.OrgType
	task.Id = m.ID
	task.Name = m.Name
	task.ProjectId = m.ProjectID
	task.ProjectName = m.ProjectName
	task.WorkOrderId = m.WorkOrderId
	task.WorkOrderName = m.WorkOrderName
	task.ParentTaskId = m.ParentTaskId
	task.Image = m.Image
	task.StageId = m.StageID
	task.StageName = m.StageName
	task.NodeId = m.NodeID
	task.NodeName = m.NodeName
	task.Status = enum.ToString[constant.CommonStatus](m.Status)
	task.Priority = enum.ToString[constant.CommonPriority](m.Priority)
	task.ConfigStatus = enum.ToString[constant.TaskConfigStatus](m.ConfigStatus)
	task.ExecutableStatus = enum.ToString[constant.TaskExecuteStatus](m.ExecutableStatus)
	task.Deadline = m.Deadline
	if m.Deadline == 0 {
		task.Overdue = ""
	} else {
		if m.CompleteTime != 0 {
			if m.Deadline >= m.CompleteTime {
				task.Overdue = "due"
			} else {
				task.Overdue = "overdue"
			}
		} else {
			time := time.Now().Unix()
			if m.Deadline >= time {
				task.Overdue = "due"
			} else {
				task.Overdue = "overdue"
			}
		}
	}
	task.ExecutorId = m.ExecutorID
	task.Description = m.Description
	task.CreatedAt = m.CreatedAt.UnixMilli()
	task.UpdatedAt = m.UpdatedAt.UnixMilli()
	task.UpdatedBy = t.UpdatedBy

	task.TaskType = enum.ToString[constant.TaskType](m.TaskType)
	task.Data = make([]*business_grooming.RelationDataInfo, 0)

	task.DomainId = m.BusinessModelID
	task.BusinessModelID = m.BusinessModelID
	if m.TaskType == constant.TaskTypeNewMainBusiness.Integer.Int32() || m.TaskType == constant.TaskTypeDataMainBusiness.Integer.Int32() {
		domainInfo, err := business_grooming.GetRemoteDomainInfo(ctx, task.BusinessModelID)
		if err == nil && domainInfo != nil {
			task.DomainName = domainInfo.Name
			task.BusinessModelID = domainInfo.ModelID
			task.BusinessModelName = domainInfo.ModelName
			task.DataModelID = domainInfo.DataModelID
			task.DataModelName = domainInfo.DataModelName
		}
	}
	if m.ModelChildTaskTypes != "" {
		task.ModelChildTaskTypes = strings.Split(m.ModelChildTaskTypes, ",")
	}
	return task, nil
}

func ToTaskBrief(m *model.TcTask) *TaskInfo {
	task := &TaskInfo{}
	task.Id = m.ID
	task.Name = m.Name
	task.ProjectId = m.ProjectID
	task.ExecutableStatus = enum.ToString[constant.TaskExecuteStatus](m.ExecutableStatus)
	task.StageId = m.StageID
	task.NodeId = m.NodeID
	task.Status = enum.ToString[constant.CommonStatus](m.Status)
	task.ConfigStatus = enum.ToString[constant.TaskConfigStatus](m.ConfigStatus)
	task.Deadline = m.Deadline.Int64
	task.OrgType = m.OrgType
	if m.Deadline.Int64 == 0 {
		task.Overdue = ""
	} else {
		if m.CompleteTime != 0 {
			if m.Deadline.Int64 >= m.CompleteTime {
				task.Overdue = "due"
			} else {
				task.Overdue = "overdue"
			}
		} else {
			time := time.Now().Unix()
			if m.Deadline.Int64 >= time {
				task.Overdue = "due"
			} else {
				task.Overdue = "overdue"
			}
		}
	}
	task.Priority = enum.ToString[constant.CommonPriority](m.Priority)
	task.ExecutorId = m.ExecutorID.String
	task.Description = m.Description.String
	task.UpdatedAt = m.UpdatedAt.UnixMilli()

	task.TaskType = enum.ToString[constant.TaskType](m.TaskType)
	if task.TaskType == enum.ToString[constant.TaskType](m.TaskType) {
		task.SubjectDomainId = m.SubjectDomainId
		task.BusinessModelID = m.BusinessModelID
	}
	task.DomainId = m.BusinessModelID
	task.BusinessModelID = m.BusinessModelID
	if m.ModelChildTaskTypes != "" {
		task.ModelChildTaskTypes = strings.Split(m.ModelChildTaskTypes, ",")
	}
	return task
}

func (t *TaskInfo) ToHttp(ctx context.Context, m *model.TaskInfo) *TaskInfo {
	if m == nil {
		log.WithContext(ctx).Warn("model.TaskInfo is nil")
		return nil
	}

	task := t
	if task == nil {
		task = &TaskInfo{}
	}
	task.Id = m.ID
	task.Name = m.Name
	task.ProjectId = m.ProjectID
	task.ProjectName = m.ProjectName
	task.WorkOrderId = m.WorkOrderId
	task.WorkOrderName = m.WorkOrderName
	if m.ProjectID != "" && m.ProjectStatus > 0 {
		task.ProjectStatus = enum.ToString[constant.CommonStatus](m.ProjectStatus)
	}
	if m.ProjectID != "" {
		task.SourceType = "project"
		task.SourceName = task.ProjectName
	}
	if task.WorkOrderId != "" {
		task.SourceType = "work_order"
		task.SourceName = task.WorkOrderName
	}
	task.ExecutableStatus = enum.ToString[constant.TaskExecuteStatus](m.ExecutableStatus)
	task.StageId = m.StageID
	task.NodeId = m.NodeID
	task.Status = enum.ToString[constant.CommonStatus](m.Status)
	task.ConfigStatus = enum.ToString[constant.TaskConfigStatus](m.ConfigStatus)
	task.Deadline = m.Deadline
	if m.Deadline == 0 {
		task.Overdue = ""
	} else {
		if m.CompleteTime != 0 {
			if m.Deadline >= m.CompleteTime {
				task.Overdue = "due"
			} else {
				task.Overdue = "overdue"
			}
		} else {
			time := time.Now().Unix()
			if m.Deadline >= time {
				task.Overdue = "due"
			} else {
				task.Overdue = "overdue"
			}
		}
	}
	task.Priority = enum.ToString[constant.CommonPriority](m.Priority)
	task.ExecutorId = m.ExecutorID
	//task.RoleId = m.RoleID
	//task.Color = users.GetRoleInfo(task.RoleId).Color
	task.Description = m.Description
	task.UpdatedAt = m.UpdatedAt.UnixMilli()

	task.TaskType = enum.ToString[constant.TaskType](m.TaskType)
	//if task.TaskType == constant.TaskTypeModeling.String {
	//	task.SubjectDomainId = m.SubjectDomainId
	//}

	if task.TaskType == constant.TaskTypeFieldStandard.String {
		task.OrgType = m.OrgType
	}

	if task.TaskType == enum.ToString[constant.TaskType](m.TaskType) {
		task.SubjectDomainId = m.SubjectDomainId
		task.BusinessModelID = m.BusinessModelID
	}
	task.DomainId = m.BusinessModelID
	task.BusinessModelID = m.BusinessModelID
	if m.TaskType == constant.TaskTypeNewMainBusiness.Integer.Int32() || m.TaskType == constant.TaskTypeDataMainBusiness.Integer.Int32() {
		domainInfo, err := business_grooming.GetRemoteDomainInfo(ctx, task.BusinessModelID)
		if err != nil {
			task.DomainName = ""
			task.BusinessModelID = ""
			task.BusinessModelName = ""
			err = nil
		} else {
			task.DomainName = domainInfo.Name
			task.BusinessModelID = domainInfo.ModelID
			task.BusinessModelName = domainInfo.ModelName
		}
	}
	if m.ModelChildTaskTypes != "" {
		task.ModelChildTaskTypes = strings.Split(m.ModelChildTaskTypes, ",")
	}
	return task
}

func (n *NodeInfo) ToHttp(ctx context.Context, f *model.TcFlowInfo) *NodeInfo {
	if n == nil {
		log.WithContext(ctx).Warn("model.TcFlowInfo is nil")
		return nil
	}

	node := n
	if node == nil {
		node = &NodeInfo{}
	}

	node.StageID = f.StageUnitID
	node.StageName = f.StageName
	node.NodeID = f.NodeUnitID
	node.NodeName = f.NodeName

	node.TaskType = enum.BitsSplit[constant.TaskType](uint32(f.TaskType))
	TaskTypeInOrder(node.TaskType)
	return node
}

func TaskTypeInOrder(ts []string) {
	sort.Slice(ts, func(i, j int) bool {
		enumI := enum.Get[constant.TaskType](ts[i])
		enumJ := enum.Get[constant.TaskType](ts[j])

		valueI := float64(enumI.Integer.Int32())
		if enumI.String == constant.TaskTypeNewMainBusiness.String || enumI.String == constant.TaskTypeDataMainBusiness.String {
			valueI = 1.5
		}
		valueJ := float64(enumJ.Integer.Int32())
		if enumJ.String == constant.TaskTypeNewMainBusiness.String || enumJ.String == constant.TaskTypeDataMainBusiness.String {
			valueJ = 1.5
		}
		return valueI < valueJ
	})
}

// GenHttpStandaloneDetail 生成详细信息，暂时没有用到，之后再用
func GenHttpStandaloneDetail(ctx context.Context, m *model.TcTask) *TaskDetailModel {
	task := new(TaskDetailModel)
	task.Id = m.ID
	task.Name = m.Name
	task.Status = enum.ToString[constant.CommonStatus](m.Status)
	task.ConfigStatus = enum.ToString[constant.TaskConfigStatus](m.ConfigStatus)
	task.ExecutableStatus = enum.ToString[constant.TaskExecuteStatus](m.ExecutableStatus)
	task.Deadline = m.Deadline.Int64
	task.ParentTaskId = m.ParentTaskId
	if m.Deadline.Int64 == 0 {
		task.Overdue = ""
	} else {
		if m.CompleteTime != 0 {
			if m.Deadline.Int64 >= m.CompleteTime {
				task.Overdue = "due"
			} else {
				task.Overdue = "overdue"
			}
		} else {
			if m.Deadline.Int64 >= time.Now().Unix() {
				task.Overdue = "due"
			} else {
				task.Overdue = "overdue"
			}
		}
	}
	task.Priority = enum.ToString[constant.CommonPriority](m.Priority)
	task.ExecutorId = m.ExecutorID.String
	task.ExecutorName = user_util.GetNameByUserId(ctx, m.ExecutorID.String)
	task.Description = m.Description.String
	task.CreatedAt = m.CreatedAt.UnixMilli()
	task.CreatedBy = user_util.GetNameByUserId(ctx, m.CreatedByUID)
	task.UpdatedAt = m.UpdatedAt.UnixMilli()
	task.UpdatedBy = user_util.GetNameByUserId(ctx, m.UpdatedByUID)

	task.BusinessModelID = m.BusinessModelID
	task.OrgType = m.OrgType
	task.TaskType = enum.ToString[constant.TaskType](m.TaskType)
	return task
}

func ToHttpStandaloneDetail(ctx context.Context, m *model.TcTask, ids ...string) (*TaskDetailModel, error) {
	if m == nil {
		log.WithContext(ctx).Warn("model.TaskDetail is nil")
		return nil, nil
	}

	task := new(TaskDetailModel)
	task.Id = m.ID
	task.Name = m.Name
	task.Status = enum.ToString[constant.CommonStatus](m.Status)
	task.ConfigStatus = enum.ToString[constant.TaskConfigStatus](m.ConfigStatus)
	task.ExecutableStatus = enum.ToString[constant.TaskExecuteStatus](m.ExecutableStatus)
	task.Deadline = m.Deadline.Int64
	task.ParentTaskId = m.ParentTaskId
	task.WorkOrderId = m.WorkOrderId
	if m.Deadline.Int64 == 0 {
		task.Overdue = ""
	} else {
		if m.CompleteTime != 0 {
			if m.Deadline.Int64 >= m.CompleteTime {
				task.Overdue = "due"
			} else {
				task.Overdue = "overdue"
			}
		} else {
			if m.Deadline.Int64 >= time.Now().Unix() {
				task.Overdue = "due"
			} else {
				task.Overdue = "overdue"
			}
		}
	}
	task.Priority = enum.ToString[constant.CommonPriority](m.Priority)
	task.ExecutorId = m.ExecutorID.String
	task.ExecutorName = user_util.GetNameByUserId(ctx, m.ExecutorID.String)
	task.Description = m.Description.String
	task.CreatedAt = m.CreatedAt.UnixMilli()
	task.CreatedBy = user_util.GetNameByUserId(ctx, m.CreatedByUID)
	task.UpdatedAt = m.UpdatedAt.UnixMilli()
	task.UpdatedBy = user_util.GetNameByUserId(ctx, m.UpdatedByUID)
	task.DataCatalogID = strings.Split(m.DataComprehensionCatalogId, ",")
	task.DataComprehensionTemplateID = m.DataComprehensionTemplateId

	task.OrgType = m.OrgType
	task.TaskType = enum.ToString[constant.TaskType](m.TaskType)
	taskRelationLevel := constant.GetTaskRelationLevel(task.TaskType)

	if task.ProjectId == "" && taskRelationLevel >= constant.TaskRelationMainBusiness {
		// 获取关联数据信息
		relationData, err := GetTaskTypeDependencies(ctx, m, ids...)
		if err != nil {
			log.WithContext(ctx).Error(err.Error())
			task.Data = []*business_grooming.RelationDataInfo{}
			if m.ConfigStatus == constant.TaskConfigStatusNormal.Integer.Int8() {
				return task, err
			}
		} else {
			//task.SubjectDomainName = relationData.SubjectDomainName
			//task.SubjectDomainId = relationData.SubjectDomainID
			//task.MainBusinessId = relationData.MainBusinessId
			task.BusinessModelName = relationData.MainBusinessName
			task.DomainName = relationData.DomainName
			task.DomainId = relationData.DomainID
			task.BusinessModelID = relationData.BusinessModelID
			task.DataModelID = relationData.DataModelID
			task.Data = relationData.Data
		}
	}
	if m.ModelChildTaskTypes != "" {
		task.ModelChildTaskTypes = strings.Split(m.ModelChildTaskTypes, ",")
	}
	return task, nil
}

// CheckTaskTypeDependencies 编辑的过程中，检查任务的依赖服务
func CheckTaskTypeDependencies(ctx context.Context, task *model.TcTask) error {
	// 如果是建模类任务或者，判断业务域id是否存在
	//if task.TaskType == constant.TaskTypeModeling.Integer.Int32() {
	//	if task.SubjectDomainId == "" {
	//		return errorcode.Desc(errorcode.TaskDomainNotEmpty)
	//	}
	//	if _, err := business_grooming.GetRemoteDomainInfo(ctx, task.SubjectDomainId); err != nil {
	//		return err
	//	}
	//}
	//if task.TaskType == constant.TaskTypeIndicator.Integer.Int32() {
	//	if task.BusinessModelID == "" {
	//		return errorcode.Desc(errorcode.TaskMainBusinessNotEmpty)
	//	}
	//	//检查到主干业务即可
	//	if _, err := business_grooming.GetRemoteBusinessModelInfo(ctx, task.BusinessModelID); err != nil {
	//		return err
	//	}
	//}
	return nil
}

type InspiredTasks struct {
	ID              string   `json:"id"`
	Name            string   `json:"name"`
	NextExecutables []string `json:"next_executables"` //下一批可以执行的用户Id
}

func GetPreNodeInfo(nodeInfos map[string]*model.TcFlowInfo, currentNode *model.TcFlowInfo) []*model.TcFlowInfo {
	nodes := make([]*model.TcFlowInfo, 0)
	if currentNode.PrevNodeUnitIds == "" {
		return nodes
	}
	nodeIds := strings.Split(currentNode.PrevNodeUnitIds, ",")
	for _, nodeId := range nodeIds {
		node := nodeInfos[nodeId]
		if node != nil {
			nodes = append(nodes, node)
			nodes = append(nodes, GetPreNodeInfo(nodeInfos, node)...)
		}
	}
	return nodes
}
func GetUniquePreNodeIds(nodeInfos map[string]*model.TcFlowInfo, currentNode *model.TcFlowInfo) []string {
	nodes := GetPreNodeInfo(nodeInfos, currentNode)
	nodesMap := make(map[string]int)
	uniqueNodeIds := make([]string, 0)
	for _, node := range nodes {
		if _, ok := nodesMap[node.NodeUnitID]; !ok {
			nodesMap[node.NodeUnitID] = 1
			uniqueNodeIds = append(uniqueNodeIds, node.NodeUnitID)
		}
	}
	return uniqueNodeIds
}

func NewTaskOperationLog(taskReq *TaskCreateReqModel) *model.OperationLog {
	return &model.OperationLog{
		Obj:          "task",
		ObjID:        taskReq.Id,
		Name:         "创建任务",
		CreatedByUID: taskReq.CreatedByUID,
		Success:      true,
		Result:       "",
	}
}

// TaskExecutorRemovedOperationLog 任务执行人被移除日志，如果ExecutorId是nil表示不更新
func TaskExecutorRemovedOperationLog(ctx context.Context, task *model.TcTask) *model.OperationLog {
	if task == nil || task.ExecutorID.String == "" {
		return nil
	}
	sourceUserInfo := user_util.GetNameByUserId(ctx, task.ExecutorID.String)
	if sourceUserInfo == "" {
		return nil
	}
	return &model.OperationLog{
		Obj:          "task",
		ObjID:        task.ID,
		Name:         "任务执行人被移除",
		CreatedByUID: "",
		Success:      true,
		Result:       fmt.Sprintf("由 %s 变为 %s ", sourceUserInfo, "未分配"),
	}
}

func TaskDiscardOperationLog(task *model.TcTask, executorId string) *model.OperationLog {
	return &model.OperationLog{
		Obj:          "task",
		ObjID:        task.ID,
		Name:         "任务失效",
		CreatedByUID: executorId,
		Success:      true,
		Result:       enum.Get[constant.TaskConfigStatus](task.ConfigStatus).Display,
	}
}

// NewSimpleOperationLog new 一个简单的操作对象
func NewSimpleOperationLog(taskReq *TaskUpdateReqModel, task *model.TcTask) *model.OperationLog {
	return &model.OperationLog{
		Obj:          "task",
		ObjID:        taskReq.Id,
		Success:      true,
		CreatedByUID: taskReq.UpdatedByUID,
	}
}

// GetTaskTypeDependencies 编辑的过程中，检查任务的依赖服务
func GetTaskTypeDependencies(ctx context.Context, task *model.TcTask, ids ...string) (*business_grooming.RelationDataList, error) {
	taskType := enum.ToString[constant.TaskType](task.TaskType)
	taskRelationLevel := constant.GetTaskRelationLevel(taskType)

	switch taskRelationLevel {
	case constant.TaskRelationMainBusiness, constant.TaskRelationBusinessIndicator:
		//指标任务，新建业务模型&数据模型任务等只需要关联到业务模型
		modelInfo, err := business_grooming.GetRemoteBusinessModelInfo(ctx, task.BusinessModelID)
		if err != nil {
			return nil, err
		}
		return modelInfo.NewRelationDataList(task.TaskType), nil
	case constant.TaskRelationBusinessForm:
		//标准化任务，采集加工任务，必须关联到具体的表
		return business_grooming.QueryFormIdBrief(ctx, task.BusinessModelID, ids...)

	case constant.TaskRelationDataCatalog:
		return data_catalog.GetCatalogInfoBriefs(ctx, ids...)
	case constant.TaskRelationDomain:
		domainInfo, err := business_grooming.GetRemoteDomainInfo(ctx, task.BusinessModelID)
		if err != nil {
			err = nil
			return &business_grooming.RelationDataList{}, nil
		}
		return domainInfo.NewRelationDataList(), nil
	}
	return nil, errorcode.Desc(errorcode.TaskRelationDataInvalid)
}

//func TaskToRole(ctx context.Context, taskType string) []string {
//	switch taskType {
//	case constant.TaskTypeNormal.String:
//		return []string{access_control.ProjectMgm, access_control.SystemMgm, access_control.BusinessMgm, access_control.BusinessOperationEngineer, access_control.StandardMgmEngineer, access_control.DataQualityEngineer, access_control.DataAcquisitionEngineer, access_control.DataProcessingEngineer, access_control.IndicatorMgmEngineer}
//	case constant.TaskTypeModeling.String:
//		return []string{access_control.BusinessOperationEngineer, access_control.ProjectMgm, access_control.SystemMgm}
//	case constant.TaskTypeStandardization.String:
//		return []string{access_control.BusinessOperationEngineer, access_control.StandardMgmEngineer}
//	case constant.TaskTypeIndicator.String:
//		return []string{access_control.IndicatorMgmEngineer, access_control.ProjectMgm, access_control.SystemMgm}
//	case constant.TaskTypeFieldStandard.String:
//		return []string{access_control.StandardMgmEngineer, access_control.ProjectMgm, access_control.SystemMgm}
//	case constant.TaskTypeDataCollecting.String:
//		return []string{access_control.BusinessOperationEngineer, access_control.DataAcquisitionEngineer, access_control.ProjectMgm, access_control.SystemMgm}
//	case constant.TaskTypeDataProcessing.String:
//		return []string{access_control.BusinessOperationEngineer, access_control.DataProcessingEngineer, access_control.ProjectMgm, access_control.SystemMgm}
//	case constant.TaskTypeNewMainBusiness.String:
//		return []string{access_control.BusinessOperationEngineer, access_control.ProjectMgm, access_control.SystemMgm}
//	default:
//		log.WithContext(ctx).Error("TaskToRole error taskType ", zap.String("taskType", taskType))
//		return []string{}
//	}
//}
//func TasksToRole(ctx context.Context, taskTypes ...string) []string {
//	var res []string
//	for _, taskType := range taskTypes {
//		res = append(res, TaskToRole(ctx, taskType)...)
//	}
//	return res
//}

// TaskToRole 该类型任务所需权限>满足权限对应的角色>角色对应的用户   临时方案： 该类型任务对应的内置角色>对应可以进行执行的任务的内置角色
// 用于分配执行人，需要有任务所有权限
func TaskToRole(ctx context.Context, taskType string) []string {
	switch {
	case constant.TaskTypeNormal.String == taskType:
		return []string{access_control.TCDataOperationEngineer, access_control.TCDataDevelopmentEngineer, access_control.TCDataButler, access_control.TCDataOwner}
	//case constant.TaskTypeModeling.String == taskType:
	//	return []string{access_control.TCDataOperationEngineer}
	//case constant.TaskTypeStandardization.String == taskType:
	//	return []string{access_control.TCDataOperationEngineer}
	//case constant.TaskTypeIndicator.String == taskType:
	//	return []string{access_control.TCDataOperationEngineer}
	case constant.TaskTypeFieldStandard.String == taskType:
		return []string{access_control.TCDataOperationEngineer}
	case constant.TaskTypeDataCollecting.String == taskType:
		return []string{access_control.TCDataDevelopmentEngineer}
	case constant.TaskTypeDataProcessing.String == taskType:
		return []string{access_control.TCDataDevelopmentEngineer}
	case constant.TaskTypeNewMainBusiness.String == taskType:
		return []string{access_control.TCDataOperationEngineer}
	case constant.TaskTypeDataMainBusiness.String == taskType:
		return []string{access_control.TCDataOperationEngineer}
	case constant.TaskTypeMainBusiness.String == taskType:
		return []string{access_control.TCDataOperationEngineer}
	case constant.TaskTypeDataComprehension.String == taskType:
		return []string{access_control.TCDataOperationEngineer}
	case constant.TaskTypeSyncDataView.String == taskType:
		return []string{access_control.TCDataOperationEngineer}
	case constant.TaskTypeIndicatorProcessing.String == taskType:
		return []string{access_control.TCDataDevelopmentEngineer}
	case constant.TaskTypeDataComprehensionWorkOrder.String == taskType:
		return []string{access_control.TCDataDevelopmentEngineer}
	case constant.TaskTypeBusinessDiagnosis.String == taskType:
		return []string{access_control.TCDataOperationEngineer}
	case constant.TaskTypeStandardization.String == taskType:
		return []string{access_control.TCDataOperationEngineer}
	default:
		log.WithContext(ctx).Error("TaskToRole error taskType ", zap.String("taskType", taskType))
		return []string{}
	}
}

// TasksToRole 该类型任务所需权限>满足权限对应的角色>角色对应的用户   临时方案： 该类型任务对应的内置角色>对应可以进行执行的任务的内置角色
// 用于项目成员，获取任务类型可以包含的用户，只需有任务查看权限
func TasksToRole(ctx context.Context, taskTypes ...string) []string {
	var res []string
	for _, taskType := range taskTypes {
		switch {
		case constant.TaskTypeNormal.String == taskType:
			// continue
			res = append(res, access_control.TCDataOperationEngineer, access_control.TCDataButler, access_control.TCDataDevelopmentEngineer, access_control.TCDataOwner)
		//case constant.TaskTypeModeling.String == taskType:
		//	res = append(res, access_control.TCDataOperationEngineer, access_control.TCDataOwner, access_control.TCDataButler)
		//case constant.TaskTypeStandardization.String == taskType:
		//	res = append(res, access_control.TCDataOperationEngineer, access_control.TCDataOwner, access_control.TCDataButler)
		//case constant.TaskTypeIndicator.String == taskType:
		//	res = append(res, access_control.TCDataOperationEngineer, access_control.TCDataOwner, access_control.TCDataButler)
		case constant.TaskTypeFieldStandard.String == taskType:
			res = append(res, access_control.TCDataOperationEngineer, access_control.TCDataOwner, access_control.TCDataButler)
		case constant.TaskTypeDataCollecting.String == taskType:
			res = append(res, access_control.TCDataOwner, access_control.TCDataDevelopmentEngineer, access_control.TCDataButler)
		case constant.TaskTypeDataProcessing.String == taskType:
			res = append(res, access_control.TCDataOwner, access_control.TCDataDevelopmentEngineer, access_control.TCDataButler)
		case constant.TaskTypeNewMainBusiness.String == taskType:
			res = append(res, access_control.TCDataOperationEngineer, access_control.TCDataOwner, access_control.TCDataButler)
		case constant.TaskTypeDataMainBusiness.String == taskType:
			res = append(res, access_control.TCDataOperationEngineer, access_control.TCDataOwner, access_control.TCDataButler)
		case constant.TaskTypeMainBusiness.String == taskType:
			res = append(res, access_control.TCDataOperationEngineer, access_control.TCDataOwner, access_control.TCDataButler)
		case constant.TaskTypeDataComprehension.String == taskType:
			res = append(res, access_control.TCDataOperationEngineer)
		case constant.TaskTypeSyncDataView.String == taskType:
			res = append(res, access_control.TCDataOperationEngineer, access_control.TCDataOwner, access_control.TCDataButler)
		case constant.TaskTypeIndicatorProcessing.String == taskType:
			res = append(res, access_control.TCDataOperationEngineer, access_control.TCDataOwner, access_control.TCDataDevelopmentEngineer, access_control.TCDataButler)
		default:
			log.WithContext(ctx).Error("TaskToRole error taskType ", zap.String("taskType", taskType))
		}
	}
	return res
}

type GetComprehensionTemplateRelationReq struct {
	TemplateIds []string `json:"template_ids"  binding:"required,dive,uuid"`
	Status      []int    `json:"status"`
}

type GetComprehensionTemplateRelationRes struct {
	TemplateIds []string `json:"template_ids"`
}
