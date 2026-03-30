package audit_process

import (
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models"
)

type ReqFormParams struct {
	AuditType string `form:"audit_type" binding:"omitempty,oneof=af-data-catalog-online af-data-catalog-offline af-data-catalog-publish af-data-catalog-download"` // 审批流程类型：af-data-catalog-online 上线审核  af-data-catalog-change 变更审核  af-data-catalog-offline 下线审核  af-data-catalog-download 下载审核  af-data-catalog-publish 发布（暂时只支持上线、下线、发布及下载）
}

type ReqAuditProcessBindParams struct {
	AuditType  string `json:"audit_type" binding:"required,oneof=af-data-catalog-online af-data-catalog-offline af-data-catalog-publish af-data-catalog-download"` // 审批流程类型：af-data-catalog-online 上线审核  af-data-catalog-change 变更审核  af-data-catalog-offline 下线审核  af-data-catalog-download 下载审核  af-data-catalog-publish 发布
	ProcDefKey string `json:"proc_def_key" binding:"required,TrimSpace,min=1,max=128"`                                                                             // 审核流程key
}

type ReqAuditProcessBindPathParams struct {
	ID models.ModelID `uri:"bindID" binding:"required,VerifyModelID"` // 审核流程绑定ID
}
