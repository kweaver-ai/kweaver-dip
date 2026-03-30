package dto

// DocAudit 定义微服务 doc-audit-rest 的 /doc-audit
//
// TODO: 仅包含部分用到的字段，其他字段用到的时候再补充
type DocAudit struct {
	// ID
	ID string `json:"id,omitempty"`
	// 当前审核员列表
	Auditors []Auditor `json:"auditors,omitempty"`
}

// Auditor 定义审核员
//
// TODO: 仅包含部分用到的字段，其他字段用到的时候再补充
type Auditor struct {
	// 审核员 ID
	ID string `json:"id,omitempty"`
	// 审核员状态
	Status AuditorStatus `json:"status,omitempty"`
}

// AuditorStatus 定义审核员状态
type AuditorStatus string

const (
	// 等待审核员审核
	AuditorPending AuditorStatus = "pending"
	// 审核员审核通过
	AuditorPass AuditorStatus = "pass"
)
