package db_sandbox

import (
	"context"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/models/request"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/models/response"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-common/access_control"
	"github.com/kweaver-ai/idrm-go-frame/core/enum"
	"github.com/kweaver-ai/idrm-go-frame/core/models"
	"github.com/samber/lo"
)

// SandboxApply 沙箱申请
type SandboxApply interface {
	Apply(ctx context.Context, req *SandboxApplyReq) (*response.IDResp, error)
	Extend(ctx context.Context, req *SandboxExtendReq) (*response.IDResp, error)
	ApplyList(ctx context.Context, req *SandboxApplyListArg) (*response.PageResultNew[SandboxApplyListItem], error)
	SandboxDetail(ctx context.Context, req *request.IDReq) (*SandboxSpaceDetail, error)
}

// SandboxApplyReq   申请参数
type SandboxApplyReq struct {
	Applicant
	DepartmentID string `json:"department_id" binding:"required,uuid"`  //部门ID
	ProjectID    string `json:"project_id"  binding:"required,uuid"`    //项目ID
	RequestSpace int32  `json:"request_space" binding:"required,gte=1"` //申请容量
	ValidStart   int64  `json:"valid_start"  binding:"omitempty"`       //有效期开始
	ValidEnd     int64  `json:"valid_end"  binding:"omitempty"`         //有效期开结束
	Reason       string `json:"reason"  binding:"required"`             //申请原因
	DBSandboxTotalDetail
}

type DBSandboxTotalDetail struct {
	ApplyObj              *model.DBSandboxApply
	SandboxObj            *model.DBSandbox `json:"-"` //沙箱
	SandboxProjectName    string           `json:"-"` //项目名称
	SandboxDepartmentName string           `json:"-"` //部门名称
}

// Applicant  申请人
type Applicant struct {
	ApplicantID           string   `json:"-"` //申请人ID
	ApplicantName         string   `json:"-"` //申请人名称
	ApplicantPhone        string   `json:"-"` //申请人手机号
	DepartmentID          string   `json:"-"` //申请人部门ID
	DepartmentName        string   `json:"-"` //申请人部门
	ApplicantRole         []string `json:"-"` //申请人角色
	CurrentProjectName    string   `json:"-"` //当前沙箱项目的名称
	CurrentDepartmentName string   `json:"-"` //当前沙箱项目的部门名称
}

func (s *SandboxApplyReq) NewSandboxApply() *model.DBSandboxApply {
	return &model.DBSandboxApply{
		ID:             uuid.NewString(),
		SandboxID:      uuid.NewString(),
		ApplicantID:    s.ApplicantID,
		ApplicantName:  s.ApplicantName,
		ApplicantPhone: s.ApplicantPhone,
		RequestSpace:   s.RequestSpace,
		Status:         constant.SandboxStatusApplying.Integer.Int32(),
		Operation:      constant.SandboxOperationApply.Integer.Int32(),
		AuditState:     constant.AuditStatusUnaudited.Integer.Int32(),
		AuditID:        "",
		AuditAdvice:    "",
		ProcDefKey:     "",
		Reason:         s.Reason,
		ApplyTime:      time.Now(),
		UpdaterUID:     s.ApplicantID,
	}
}
func (s *SandboxApplyReq) NewSandboxSpace() *model.DBSandbox {
	return &model.DBSandbox{
		ID:             s.ApplyObj.SandboxID,
		DepartmentID:   s.DepartmentID,
		DepartmentName: s.DepartmentName,
		ProjectID:      s.ProjectID,
		TotalSpace:     0,
		Status:         constant.SandboxSpaceStatusDisable.Integer.Int32(),
		ValidStart:     s.ValidStart,
		ValidEnd:       s.ValidEnd,
		ApplicantID:    s.ApplicantID,
		ApplicantName:  s.ApplicantName,
		ApplicantPhone: s.ApplicantPhone,
		UpdaterUID:     s.ApplicantID,
	}
}

// SandboxExtendReq 扩容申参数
type SandboxExtendReq struct {
	Applicant
	ProjectID    string `json:"-"`                                      //项目ID
	SandboxID    string `json:"sandbox_id"  binding:"required,uuid"`    //数据库沙箱ID
	RequestSpace int32  `json:"request_space" binding:"required,gte=1"` //申请容量
	Reason       string `json:"reason"  binding:"required"`             //申请原因
	DBSandboxTotalDetail
}

func (s *SandboxExtendReq) NewSandboxExtend() *model.DBSandboxApply {
	return &model.DBSandboxApply{
		ID:            uuid.NewString(),
		SandboxID:     s.SandboxID,
		ApplicantID:   s.ApplicantID,
		ApplicantName: s.ApplicantName,
		RequestSpace:  s.RequestSpace,
		Status:        constant.SandboxStatusApplying.Integer.Int32(),
		Operation:     constant.SandboxOperationExtend.Integer.Int32(),
		AuditState:    constant.AuditStatusUnaudited.Integer.Int32(),
		AuditID:       "",
		AuditAdvice:   "",
		ProcDefKey:    "",
		Reason:        s.Reason,
		ApplyTime:     time.Now(),
	}
}

// SandboxApplyListArg 沙箱申请列表
type SandboxApplyListArg struct {
	SandboxAccessor
	DepartmentID           string   `json:"department_id"  form:"department_id" binding:"omitempty,uuid"` //所属组织机构
	ChildDepartmentIDSlice []string `json:"-"`                                                            //部门查询
	ApplyTimeStart         int64    `json:"apply_time_start"   form:"apply_time_start" `                  //开始时间
	ApplyTimeEnd           int64    `json:"apply_time_end"  form:"apply_time_end"`                        //结束时间
	Status                 string   `json:"status" form:"status"`                                         //状态,支持多个状态，逗号分割
	OnlySelf               bool     `json:"only_self" form:"only_self"`                                   //只看自己的申请单
	request.KeywordInfo
	request.PageBaseInfo
	Direction *string `json:"direction" form:"direction,default=desc" binding:"oneof=asc desc" default:"desc" example:"desc"`                                   // 排序方向，枚举：asc：正序；desc：倒序。默认倒序
	Sort      *string `json:"sort" form:"sort,default=apply_time" binding:"oneof=apply_time updated_at project_name" default:"apply_time" example:"apply_time"` // 排序类型，枚举：apply_time updated_at project_name
}

type SandboxAccessor struct {
	Applicant
	AuthorizedProjects []string `json:"-"` //可访问的项目ID
}

func (s *SandboxAccessor) IsDataOperationEngineer() bool {
	roleDict := lo.SliceToMap(s.ApplicantRole, func(item string) (string, int) {
		return item, 1
	})
	_, ok := roleDict[access_control.TCDataOperationEngineer]
	return ok
}

func (s *SandboxApplyListArg) SandboxStatus() []int32 {
	if s.Status == "" || len(s.Status) <= 0 {
		return nil
	}
	es := make([]int32, 0)
	statuses := strings.Split(s.Status, ",")
	for _, status := range statuses {
		if status == "" {
			continue
		}
		es = append(es, enum.ToInteger[constant.SandboxExecuteStatus](status).Int32())
	}
	return es
}

type SandboxApplyListItem struct {
	//沙箱信息
	SandboxID         string   `gorm:"column:sandbox_id;not null" json:"sandbox_id"`           // 沙箱ID
	DepartmentID      string   `gorm:"column:department_id;not null" json:"department_id"`     // 所属部门ID
	DepartmentName    string   `gorm:"column:department_name;not null" json:"department_name"` // 所属部门名称
	ProjectID         string   `gorm:"column:project_id;not null" json:"project_id"`           // 项目ID
	ProjectName       string   `gorm:"column:project_name;not null" json:"project_name"`       // 项目名称
	ProjectMemberID   []string `gorm:"-" json:"project_member_id"`                             // 项目成员ID数组
	ProjectMemberName []string `gorm:"-" json:"project_member_name"`                           // 项目成员name数组
	TotalSpace        int32    `gorm:"column:total_space" json:"total_space"`                  // 总的沙箱空间，单位GB
	UsedSpace         float64  `gorm:"-" json:"used_space"`                                    // 已用空间
	InApplySpace      int32    `gorm:"in_apply_space"  json:"in_apply_space"`                  // 在申请中的容量
	LastApplySpace    int32    `gorm:"last_apply_space"  json:"last_apply_space"`              // 最后一次申请的容量
	ValidStart        int64    `gorm:"column:valid_start" json:"valid_start"`                  // 有效期开始时间，单位毫秒
	ValidEnd          int64    `gorm:"column:valid_end" json:"valid_end"`                      // 有效期结束时间，单位毫秒
	//申请信息
	ApplyID          string             `gorm:"column:apply_id" json:"apply_id"`               //请求ID
	ApplicantID      string             `gorm:"column:applicant_id" json:"applicant_id"`       // 申请人ID
	ApplicantName    string             `gorm:"column:applicant_name" json:"applicant_name"`   // 申请人名称
	ApplicantPhone   string             `gorm:"column:applicant_phone" json:"applicant_phone"` // 申请人手机号
	OperationInt     int32              `gorm:"column:operation;not null" json:"-"`            // 操作,1创建申请，2扩容申请
	OperationStr     string             `gorm:"-" json:"operation"`                            // 操作,apply创建申请，extend扩容申
	SandboxStatusInt int32              `gorm:"column:sandbox_status;not null" json:"-"`       // 实施阶段,1待实施，2实施中，3已实施
	SandboxStatusStr string             `gorm:"-" json:"sandbox_status"`                       // 实施阶段,waiting待实施，executing实施中，executed已实施
	AuditStateInt    int32              `gorm:"column:audit_state;not null" json:"-"`          // 审核状态,1审核中，2审核通过，3未通过
	AuditStateStr    string             `gorm:"-" json:"audit_state"`                          // 审核状态,1审核中，2审核通过，3未通过
	AuditAdvice      string             `gorm:"column:audit_advice" json:"audit_advice"`       // 审核意见，仅驳回时有用
	Reason           string             `gorm:"column:reason" json:"reason"`                   // 申请原因
	ApplyTime        models.IntegerTime `gorm:"column:apply_time;not null" json:"apply_time"`  // 操作时间
	UpdatedAt        time.Time          `gorm:"column:updated_at;not null" json:"updated_at"`  // 更新时间
}

func (s *SandboxApplyListItem) EnumExchange() {
	s.OperationStr = enum.ToString[constant.SandboxOperation](s.OperationInt)
	s.SandboxStatusStr = enum.ToString[constant.SandboxExecuteStatus](s.SandboxStatusInt)
	s.AuditStateStr = enum.ToString[constant.AuditStatus](s.AuditStateInt)
}

type SandboxSpaceDetail struct {
	SandboxID        string           `gorm:"column:sandbox_id;not null" json:"sandbox_id"`             // 沙箱ID
	ApplicantID      string           `gorm:"column:applicant_id" json:"applicant_id"`                  // 申请人ID
	ApplicantName    string           `gorm:"column:applicant_name" json:"applicant_name"`              // 申请人名称
	ApplicantPhone   string           `gorm:"column:applicant_phone" json:"applicant_phone"`            // 申请人手机号
	DepartmentID     string           `gorm:"column:department_id;not null" json:"department_id"`       // 所属部门ID
	DepartmentName   string           `gorm:"column:department_name;not null" json:"department_name"`   // 所属部门名称
	ProjectID        string           `gorm:"column:project_id;not null" json:"project_id"`             // 项目ID
	ProjectName      string           `gorm:"column:project_name;not null" json:"project_name"`         // 项目名称
	ProjectOwnerID   string           `gorm:"column:project_owner_id;not null" json:"project_owner_id"` // 项目负责人ID
	TotalSpace       int32            `gorm:"column:total_space" json:"total_space"`                    // 总的沙箱空间，单位GB
	UsedSpace        float64          `gorm:"-" json:"used_space"`                                      // 已用空间
	RequestSpace     int32            `gorm:"column:request_space"  json:"request_space"`               // 在申请中的容量
	ValidStart       int64            `gorm:"column:valid_start" json:"valid_start"`                    // 有效期开始时间，单位毫秒
	ValidEnd         int64            `gorm:"column:valid_end" json:"valid_end"`                        // 有效期结束时间，单位毫秒
	OperationInt     int32            `gorm:"column:operation;not null" json:"-"`                       // 操作,1创建申请，2扩容申请
	OperationStr     string           `gorm:"-" json:"operation"`                                       // 操作,apply创建申请，extend扩容申
	ExecuteStatusInt int32            `gorm:"column:status;not null" json:"-"`                          // 实施阶段,1待实施，2实施中，3已实施
	ExecuteStatusStr string           `gorm:"-" json:"execute_status"`                                  // 实施阶段,waiting待实施，executing实施中，executed已实施
	AuditStateInt    int32            `gorm:"column:audit_state;not null" json:"-"`                     // 审核状态,1审核中，2审核通过，3未通过
	AuditStateStr    string           `gorm:"-" json:"audit_state"`                                     // 审核状态,1审核中，2审核通过，3未通过
	ProjectMembers   []*ProjectMember `gorm:"-"  json:"project_members"`                                // 项目成员
	ApplyRecords     []*ApplyRecord   `gorm:"-"  json:"apply_records"`                                  // 申请记录
}

func (s *SandboxSpaceDetail) EnumExchange() {
	s.OperationStr = enum.ToString[constant.SandboxOperation](s.OperationInt)
	s.ExecuteStatusStr = enum.ToString[constant.SandboxExecuteStatus](s.ExecuteStatusInt)
	s.AuditStateStr = enum.ToString[constant.AuditStatus](s.AuditStateInt)
	for i := range s.ApplyRecords {
		s.ApplyRecords[i].EnumExchange()
	}
}

type ProjectMember struct {
	ID                 string `json:"id"`                   // 用户ID
	Name               string `json:"name"`                 // 用户姓名
	DepartmentID       string `json:"department_id"`        // 所属部门ID
	DepartmentName     string `json:"department_name"`      // 所属部门名称
	DepartmentIDPath   string `json:"department_id_path"`   // 所属部门ID路径
	DepartmentNamePath string `json:"department_name_path"` // 所属部门名称路径
	JoinTime           string `json:"join_time"`            // 加入项目时间
	IsProjectOwner     bool   `json:"is_project_owner"`     // 是否是项目负责人
}

type ApplyRecord struct {
	ApplyID        string             `gorm:"column:id" json:"apply_id"`                    //请求ID
	ApplicantID    string             `gorm:"column:applicant_id" json:"applicant_id"`      // 申请人ID
	ApplicantName  string             `gorm:"column:applicant_name" json:"applicant_name"`  // 申请人名称
	RequestSpace   int32              `gorm:"column:request_space" json:"request_space"`    // 申请容量，单位GB
	OperationInt   int32              `gorm:"column:operation;not null" json:"-"`           // 操作,1创建申请，2扩容申请
	OperationStr   string             `gorm:"-" json:"operation"`                           // 操作,1创建申请，2扩容申请
	ApplyStatusInt int32              `gorm:"column:status;not null" json:"-"`              // 实施阶段,1待实施，2实施中，3已实施
	ApplyStatusStr string             `gorm:"-" json:"status"`                              // 实施阶段,1待实施，2实施中，3已实施
	AuditStateInt  int32              `gorm:"column:audit_state;not null" json:"-"`         // 审核状态,1审核中，2审核通过，3未通过
	AuditStateStr  string             `gorm:"-" json:"audit_state"`                         // 审核状态,1审核中，2审核通过，3未通过
	AuditAdvice    string             `gorm:"column:audit_advice" json:"audit_advice"`      // 审核意见，仅驳回时有用
	Reason         string             `gorm:"column:reason" json:"reason"`                  // 申请原因
	ApplyTime      models.IntegerTime `gorm:"column:apply_time;not null" json:"apply_time"` // 操作时间
}

func (s *ApplyRecord) EnumExchange() {
	s.OperationStr = enum.ToString[constant.SandboxOperation](s.OperationInt)
	s.ApplyStatusStr = enum.ToString[constant.SandboxExecuteStatus](s.ApplyStatusInt)
	s.AuditStateStr = enum.ToString[constant.AuditStatus](s.AuditStateInt)
}
