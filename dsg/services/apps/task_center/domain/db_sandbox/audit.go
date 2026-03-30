package db_sandbox

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/task_center/common/models/request"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/models/response"
)

// SandboxApplyAudit 申请审核
type SandboxApplyAudit interface {
	AuditList(ctx context.Context, req *AuditListReq) (*response.PageResultNew[AuditListItem], error)
	Revocation(ctx context.Context, req *request.IDReq) (err error)
}

type AuditListReq struct {
	Target string `form:"target" form:"target,default=tasks" binding:"oneof=tasks historys"` // 审核列表类型 tasks 待审核 historys 已审核
	request.PageBaseInfo
}

type AuditListItem struct {
	SandboxID      string `json:"sandbox_id"`      //沙箱ID
	ProjectID      string `json:"project_id"`      //项目ID
	ProjectName    string `json:"project_name"`    //项目名称
	DepartmentID   string `json:"department_id"`   //部门ID
	DepartmentName string `json:"department_name"` //部门名称
	Operation      string `json:"operation"`       //沙箱申请类型
	ApplicantID    string `json:"applicant_id"`    //申请人ID
	ApplicantName  string `json:"applicant_name"`  //申请人名称
	ApplicantPhone string `json:"applicant_phone"` //申请人名电话
	ApplyTime      string `json:"apply_time"`      //申请时间
	RequestSpace   any    `json:"request_space"`   //申请容量
	Reason         any    `json:"reason"`          //原因
	ValidStart     any    `json:"valid_start"`
	ValidEnd       any    `json:"valid_end"`
	AuditCommonInfo
}

type AuditCommonInfo struct {
	ApplyCode      string `json:"apply_code"`      //审核code
	AuditType      string `json:"audit_type"`      //审核类型
	AuditStatus    string `json:"audit_status"`    //审核状态
	AuditTime      string `json:"audit_time"`      //审核时间，2006-01-02 15:04:05
	AuditOperation int    `json:"audit_operation"` //操作
	ApplierID      string `json:"applier_id"`      //申请人ID
	ProcInstID     string `json:"proc_inst_id"`    //审核实例ID
	ApplierName    string `json:"applier_name"`    //申请人名称
	ApplyTime      string `json:"apply_time"`      //申请时间
}
