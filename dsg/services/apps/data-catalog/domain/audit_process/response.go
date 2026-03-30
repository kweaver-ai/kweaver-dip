package audit_process

type IDResp struct {
	ID uint64 `json:"id,string"`
}

type AuditProcessBindQueryResp struct {
	ID         uint64 `json:"id,string"`    // 唯一id，雪花算法
	AuditType  string `json:"audit_type"`   // 审批流程类型：af-data-catalog-online 上线审核  af-data-catalog-change 变更审核  af-data-catalog-offline 下线审核  af-data-catalog-publish 发布审核  af-data-catalog-download 下载审核
	ProcDefKey string `json:"proc_def_key"` // 审核流程key
}
