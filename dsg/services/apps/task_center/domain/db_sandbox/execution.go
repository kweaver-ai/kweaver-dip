package db_sandbox

import (
	"context"
	"strings"

	"github.com/google/uuid"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/models/request"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/models/response"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/enum"
	"github.com/kweaver-ai/idrm-go-frame/core/models"
)

// SandboxExecution 沙箱实施
type SandboxExecution interface {
	Executing(ctx context.Context, req *ExecuteReq) (*response.IDResp, error)
	Executed(ctx context.Context, req *ExecutedReq) (*response.IDResp, error)
	ExecutionList(ctx context.Context, req *SandboxExecutionListArg) (*response.PageResultNew[SandboxExecutionListItem], error)
	ExecutionDetail(ctx context.Context, req *request.IDReq) (*SandboxExecutionDetail, error)
	ExecutionLog(ctx context.Context, req *request.IDReq) ([]*SandboxExecutionLogListItem, error)
}

type ExecuteReq struct {
	ApplyID        string `json:"apply_id" binding:"required,uuid"`    //沙箱请求ID
	SandboxID      string `json:"-"`                                   // 沙箱ID
	ExecutorID     string `json:"-" `                                  //实施人员ID
	ExecutorName   string `json:"-" `                                  //实施人员姓名
	ExecutorPhone  string `json:"-" `                                  //实施人员联系电话
	DatasourceID   string `json:"datasource_id"  binding:"required"`   //数据源ID
	DatasourceName string `json:"datasource_name"  binding:"required"` //数据源名称
	DatasourceType string `json:"datasource_type"  binding:"required"` //数据库类型
	DatabaseName   string `json:"database_name"  binding:"required"`   //数据库
	UserName       string `json:"user_name"  binding:"required"`       //沙箱用户名
	Password       string `json:"password"  binding:"required"`        //沙箱密码
}

func (e *ExecuteReq) NewExecution() *model.DBSandboxExecution {
	return &model.DBSandboxExecution{
		ID:            uuid.NewString(),
		SandboxID:     e.SandboxID,
		ApplyID:       e.ApplyID,
		ExecuteType:   constant.ExecuteTypeOffline.Integer.Int32(),
		ExecuteStatus: constant.SandboxStatusExecuting.Integer.Int32(),
		ExecutorID:    e.ExecutorID,
		ExecutorName:  e.ExecutorName,
		CreatorUID:    e.ExecutorID,
		UpdaterUID:    e.ExecutorID,
		SandboxSecurityInfo: model.SandboxSecurityInfo{
			DatasourceID:       e.DatasourceID,
			DatasourceName:     e.DatasourceName,
			DatasourceTypeName: e.DatasourceType,
			DatabaseName:       e.DatabaseName,
			Username:           e.UserName,
			Password:           e.Password,
		},
	}
}

// ExecutedReq 实施完成请求参数
type ExecutedReq struct {
	ExecutionID string `json:"execution_id" binding:"required,uuid"` //沙箱实施ID
	Desc        string `json:"desc"  binding:"omitempty"`            //实施说明
}

// SandboxExecutionListArg 沙箱实施列表
type SandboxExecutionListArg struct {
	SandboxAccessor
	ExecuteType   string `json:"execute_type" form:"execute_type" binding:"omitempty,oneof=apply extend"` //实施类型
	ExecuteStatus string `json:"execute_status"  form:"execute_status" binding:"omitempty"`               //实施状态,支持多个逗号分隔符
	request.KeywordInfo
	request.PageBaseInfo
	Direction *string `json:"direction" form:"direction,default=desc" binding:"oneof=asc desc" default:"desc" example:"desc"`                                    // 排序方向，枚举：asc：正序；desc：倒序。默认倒序
	Sort      *string `json:"sort" form:"sort,default=executed_time" binding:"oneof=executed_time project_name" default:"executed_time" example:"executed_time"` // 排序类型，枚举：executed_time project_name

}

func (s *SandboxExecutionListArg) SandboxStatus() []int32 {
	if s.ExecuteStatus == "" || len(s.ExecuteStatus) <= 0 {
		return nil
	}
	es := make([]int32, 0)
	statuses := strings.Split(s.ExecuteStatus, ",")
	for _, status := range statuses {
		if status == "" {
			continue
		}
		es = append(es, enum.ToInteger[constant.SandboxExecuteStatus](status).Int32())
	}
	return es
}

type SandboxExecutionListItem struct {
	ID               string             `gorm:"column:id" json:"id"`                                //实施ID
	ApplyID          string             `gorm:"column:apply_id" json:"apply_id"`                    // 沙箱请求ID
	SandboxID        string             `gorm:"column:sandbox_id" json:"sandbox_id" `               // 沙箱ID
	ProjectID        string             `gorm:"column:project_id" json:"project_id"`                // 项目ID
	ProjectName      string             `gorm:"column:project_name" json:"project_name"`            // 项目名称
	ApplicantID      string             `gorm:"column:applicant_id" json:"applicant_id"`            // 申请人ID
	ApplicantName    string             `gorm:"column:applicant_name" json:"applicant_name"`        // 申请人名称
	ApplicantPhone   string             `gorm:"column:applicant_phone" json:"applicant_phone"`      // 申请人联系电话
	OperationInt     int32              `gorm:"column:operation;not null" json:"-"`                 // 操作,1创建申请，2扩容申请
	OperationStr     string             `gorm:"-" json:"operation"`                                 // 操作,apply创建申请，extend扩容申
	RequestSpace     int                `gorm:"column:request_space" json:"request_space"`          // 请求空间
	Username         string             `gorm:"column:username;not null" json:"username"`           // 用户名
	Password         string             `gorm:"column:password;not null" json:"password"`           // 密码
	ExecuteTypeInt   int32              `gorm:"column:execute_type;not null" json:"-"`              // 实施方式,1线下，2线上
	ExecuteTypeStr   string             `gorm:"-" json:"execute_type"`                              // 实施方式,1线下，2线上
	ExecuteStatusInt int32              `gorm:"column:execute_status;not null" json:"-"`            // 实施阶段,1待实施，2实施中，3已实施
	ExecuteStatusStr string             `gorm:"-" json:"execute_status"`                            // 实施阶段,waiting待实施，executing实施中，executed已实施
	ExecutorID       string             `gorm:"column:executor_id" json:"executor_id"`              // 实施人ID
	ExecutorName     string             `gorm:"column:executor_name" json:"executor_name"`          // 实施人名称
	ExecutedTime     models.IntegerTime `gorm:"column:executed_time;not null" json:"executed_time"` // 实施完成时间
}

func (s *SandboxExecutionListItem) EnumExchange() {
	s.OperationStr = enum.ToString[constant.SandboxOperation](s.OperationInt)
	s.ExecuteStatusStr = enum.ToString[constant.SandboxExecuteStatus](s.ExecuteStatusInt)
	s.ExecuteTypeStr = enum.ToString[constant.ExecuteType](s.ExecuteTypeInt)
}

type SandboxExecutionDetail struct {
	//基本信息
	ID             string             `gorm:"column:id" json:"id"`                                    //实施ID
	ApplyID        string             `gorm:"column:apply_id;not null" json:"apply_id"`               // 沙箱请求ID
	SandboxID      string             `gorm:"column:sandbox_id;not null" json:"sandbox_id"`           // 沙箱ID
	ProjectID      string             `gorm:"column:project_id;not null" json:"project_id"`           // 项目ID
	ProjectName    string             `gorm:"column:project_name;not null" json:"project_name"`       // 项目名称
	ApplicantID    string             `gorm:"column:applicant_id" json:"applicant_id"`                // 申请人ID
	ApplicantName  string             `gorm:"column:applicant_name" json:"applicant_name"`            // 申请人名称
	ApplicantPhone string             `gorm:"-" json:"applicant_phone"`                               // 申请人联系电话
	DepartmentID   string             `gorm:"column:department_id;not null" json:"department_id"`     // 所属部门ID
	DepartmentName string             `gorm:"column:department_name;not null" json:"department_name"` // 所属部门名称
	TotalSpace     int32              `gorm:"column:total_space" json:"total_space"`                  // 总的容量
	RequestSpace   int32              `gorm:"column:request_space" json:"request_space"`              // 申请容量，单位GB
	ValidStart     int64              `gorm:"column:valid_start" json:"valid_start"`                  // 有效期开始时间，单位毫秒
	ValidEnd       int64              `gorm:"column:valid_end" json:"valid_end"`                      // 有效期结束时间，单位毫秒
	Reason         string             `gorm:"column:reason" json:"reason"`                            // 申请原因
	ApplyTime      models.IntegerTime `gorm:"column:apply_time" json:"apply_time"`                    // 操作时间
	//实施信息
	ExecuteTypeInt     int32  `gorm:"column:execute_type;not null" json:"-"`                            // 实施方式,1线下，2线上
	ExecuteTypeStr     string `gorm:"-" json:"execute_type"`                                            // 实施方式,1线下，2线上
	DatasourceName     string `gorm:"column:datasource_name;not null" json:"datasource_name"`           // 数据源名称
	DatasourceTypeName string `gorm:"column:datasource_type_name;not null" json:"datasource_type_name"` // 数据库类型名称
	DatabaseName       string `gorm:"column:database_name;not null" json:"database_name"`               // 数据库名称
	Username           string `gorm:"column:username;not null" json:"username"`                         // 用户名
	Password           string `gorm:"column:password;not null" json:"password"`                         // 密码
	//实施结果
	OperationInt int32              `gorm:"column:operation;not null" json:"-"`                 // 操作,1创建申请，2扩容申请
	OperationStr string             `gorm:"-" json:"operation"`                                 // 操作,apply创建申请，extend扩容申
	ExecutedTime models.IntegerTime `gorm:"column:executed_time;not null" json:"executed_time"` // 实施完成时间
	Description  string             `gorm:"column:description" json:"description"`              // 实施说明
}

func (s *SandboxExecutionDetail) EnumExchange() {
	s.OperationStr = enum.ToString[constant.SandboxOperation](s.OperationInt)
	s.ExecuteTypeStr = enum.ToString[constant.ExecuteType](s.ExecuteTypeInt)
}

type SandboxExecutionLogListItem struct {
	ID           string             `gorm:"column:id" json:"id"`                       // 主键，uuid
	ApplyID      string             `gorm:"column:apply_id" json:"apply_id"`           // 沙箱申请ID
	ExecuteStep  int32              `gorm:"column:execute_step" json:"execute_step"`   // 操作步骤,1申请，2扩容，3审核，4实施，5完成
	ExecutorID   string             `gorm:"column:executor_id" json:"executor_id"`     // 实施人ID
	ExecutorName string             `gorm:"column:executor_name" json:"executor_name"` // 实施人名称
	ExecuteTime  models.IntegerTime `gorm:"column:execute_time" json:"execute_time"`   // 操作时间
}
