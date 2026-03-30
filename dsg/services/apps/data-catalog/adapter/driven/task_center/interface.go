package task_center

import (
	"context"
)

type Driven interface {
	GetComprehensionTemplateRelation(ctx context.Context, req *GetComprehensionTemplateRelationReq) (*GetComprehensionTemplateRelationRes, error)
	GetSandboxDetail(ctx context.Context, req *GetSandboxDetailReq) (*GetSandboxDetailRes, error)
}

//region basicInfo

type GetComprehensionTemplateRelationReq struct {
	TemplateIds []string `json:"template_ids"`
	Status      []int    `json:"status"` //任务状态（未开始1、进行中2、已完成3)
}

type GetComprehensionTemplateRelationRes struct {
	TemplateIds []string `json:"template_ids"`
}

//endregion

//region sandbox

type GetSandboxDetailReq struct {
	ID string `json:"id" binding:"required,uuid"` // 沙箱ID
}

type GetSandboxDetailRes struct {
	SandboxID      string           `json:"sandbox_id"`       // 沙箱ID
	ApplicantID    string           `json:"applicant_id"`     // 申请人ID
	ApplicantName  string           `json:"applicant_name"`   // 申请人名称
	ApplicantPhone string           `json:"applicant_phone"`  // 申请人手机号
	DepartmentID   string           `json:"department_id"`    // 所属部门ID
	DepartmentName string           `json:"department_name"`  // 所属部门名称
	ProjectID      string           `json:"project_id"`       // 项目ID
	ProjectName    string           `json:"project_name"`     // 项目名称
	ProjectOwnerID string           `json:"project_owner_id"` // 项目负责人ID
	TotalSpace     int32            `json:"total_space"`      // 总的沙箱空间，单位GB
	UsedSpace      float64          `json:"used_space"`       // 已用空间
	RequestSpace   int32            `json:"request_space"`    // 在申请中的容量
	ValidStart     int64            `json:"valid_start"`      // 有效期开始时间，单位毫秒
	ValidEnd       int64            `json:"valid_end"`        // 有效期结束时间，单位毫秒
	Operation      string           `json:"operation"`        // 操作,apply创建申请，extend扩容申
	ExecuteStatus  string           `json:"execute_status"`   // 实施阶段,waiting待实施，executing实施中，executed已实施
	AuditState     string           `json:"audit_state"`      // 审核状态,1审核中，2审核通过，3未通过
	ProjectMembers []*ProjectMember `json:"project_members"`  // 项目成员
	ApplyRecords   []*ApplyRecord   `json:"apply_records"`    // 申请记录
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
	ApplyID       string `json:"apply_id"`       // 请求ID
	ApplicantID   string `json:"applicant_id"`   // 申请人ID
	ApplicantName string `json:"applicant_name"` // 申请人名称
	RequestSpace  int32  `json:"request_space"`  // 申请容量，单位GB
	Operation     string `json:"operation"`      // 操作,1创建申请，2扩容申请
	Status        string `json:"status"`         // 实施阶段,1待实施，2实施中，3已实施
	AuditState    string `json:"audit_state"`    // 审核状态,1审核中，2审核通过，3未通过
	AuditAdvice   string `json:"audit_advice"`   // 审核意见，仅驳回时有用
	Reason        string `json:"reason"`         // 申请原因
	ApplyTime     int64  `json:"apply_time"`     // 操作时间，毫秒时间戳
}

//endregion
