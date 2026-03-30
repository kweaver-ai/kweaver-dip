package dto

type AuditProcessBindListReq struct {
	PageInfo
	AuditType string `json:"audit_type" form:"audit_type" binding:"omitempty,oneof=af-data-application-publish af-data-application-change af-data-application-online af-data-application-offline af-data-application-request"` // 审核类型 af-data-application-publish 发布审核 af-data-application-change 变更审核 af-data-application-online 上线审核 af-data-application-offline 下线审核 af-data-application-request 调用审核
}

type AuditProcessBindListRes struct {
	PageResult[AuditProcessBind]
}

type AuditProcessBindWrite struct {
	AuditType  string `json:"audit_type" binding:"required,oneof=af-data-application-publish af-data-application-change af-data-application-online af-data-application-offline af-data-application-request"` // 审核类型 af-data-application-publish 发布审核 af-data-application-change 变更审核 af-data-application-online 上线审核 af-data-application-offline 下线审核 af-data-application-request 调用审核
	ProcDefKey string `json:"proc_def_key" binding:"required,VerifyNameEn,max=128"`                                                                                                                          // 审核流程key
}

type AuditProcessBind struct {
	BindID     string `json:"bind_id" binding:"omitempty,VerifyNameEn"`                                                                                                                                      // 绑定id
	AuditType  string `json:"audit_type" binding:"required,oneof=af-data-application-publish af-data-application-change af-data-application-online af-data-application-offline af-data-application-request"` // 审核类型 af-data-application-publish 发布审核 af-data-application-change 变更审核 af-data-application-online 上线审核 af-data-application-offline 下线审核 af-data-application-request 调用审核
	ProcDefKey string `json:"proc_def_key" binding:"required,VerifyNameEn,max=128"`                                                                                                                          // 审核流程key
}

type AuditProcessBindCreateReq struct {
	AuditProcessBindWrite
}

type AuditProcessBindGetReq struct {
	BindId string `json:"bind_id" uri:"bind_id" binding:"required,VerifyNameEn"`
}

type AuditProcessBindGetRes struct {
	AuditProcessBind
}

type AuditProcessBindUpdateReq struct {
	AuditProcessBindUpdateUriReq
	AuditProcessBindUpdateBodyReq
}

type AuditProcessBindUpdateUriReq struct {
	BindId string `json:"bind_id" uri:"bind_id" binding:"required,VerifyNameEn"`
}

type AuditProcessBindUpdateBodyReq struct {
	AuditProcessBindWrite
}

type AuditProcessBindDeleteReq struct {
	BindId string `json:"bind_id" uri:"bind_id" binding:"required,VerifyNameEn"`
}
