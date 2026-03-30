package audit

import (
	"encoding/json"
	"path"
	"time"

	v1 "github.com/kweaver-ai/idrm-go-common/api/audit/v1"
	"github.com/kweaver-ai/idrm-go-common/audit"
	"github.com/samber/lo"
)

var _ v1.ResourceObject = &UserInfoAuditDetail{}

type UserInfoAuditDetail struct {
	ID               string `json:"id"`                 //登录用户ID
	Name             string `json:"name"`               //登录用户显示名称
	LoginName        string `json:"login_name"`         //登录用户名
	DepartmentPath   string `json:"department_path"`    //部门名称路径
	DepartmentPathID string `json:"department_path_id"` //部门ID路径
	DepartmentCode   string `json:"department_code"`    //部门编码
	Operation        string `json:"operation"`          //操作名称，登录，登出
	Description      string `json:"description"`        //描述
	IP               string `json:"ip"`                 //登录用户的IP地址
	OperationTime    int64  `json:"operation_time"`     //操作时间
}

func NewUserInfoAuditDetail(operator v1.Operator, op v1.Operation) *UserInfoAuditDetail {
	auditDetail := &UserInfoAuditDetail{
		ID:        operator.ID,
		Name:      operator.Name,
		LoginName: operator.LoginName,
		DepartmentPath: path.Join(lo.Times(len(operator.Department), func(index int) string {
			return operator.Department[index].Name
		})...),
		DepartmentPathID: path.Join(lo.Times(len(operator.Department), func(index int) string {
			return operator.Department[index].ID
		})...),
		Operation:     string(op),
		IP:            operator.Agent.IP.String(),
		OperationTime: time.Now().UnixMilli(),
	}
	auditDetail.DepartmentCode = operator.DepartmentCode
	auditDetail.SetDescription(operator, op)
	return auditDetail
}

func (a *UserInfoAuditDetail) GetName() string {
	return ""
}

func (a *UserInfoAuditDetail) GetDetail() json.RawMessage {
	return lo.T2(json.Marshal(a)).A
}

func (a *UserInfoAuditDetail) SetDescription(operator v1.Operator, op v1.Operation) {
	a.Description = audit.GenerateSimplifiedChineseDescription(&operator, op, a)
}
