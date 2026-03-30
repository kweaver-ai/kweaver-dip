package audit_process_bind

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/models/request"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/models/response"
)

type AuditProcessBindUseCase interface {
	AuditProcessBindCreate(ctx context.Context, req *CreateReqBody, uid string) error
	AuditProcessBindList(ctx context.Context, req *ListReqQuery) (*ListRes, error)
	AuditProcessBindUpdate(ctx context.Context, req *UpdateReq, uid string) error
	AuditProcessBindDelete(ctx context.Context, req *DeleteReq) error
	AuditProcessBindGet(ctx context.Context, req *AuditProcessBindUriReq) (*GetAuditProcessRes, error)
	AuditProcessBindGetByAuditType(ctx context.Context, req *AuditTypeGetParameter) (*GetAuditProcessRes, error)
	AuditProcessBindDeleteByAuditType(ctx context.Context, req *AuditType) error
}

//region common

// type AuditType struct {
// 	AuditType string `json:"audit_type" form:"audit_type" uri:"audit_type" binding:"required,oneof=af-data-view-publish af-data-view-online af-data-view-offline af-data-permission-request af-data-catalog-online af-data-catalog-offline af-data-catalog-publish af-data-catalog-download af-info-catalog-publish af-info-catalog-online af-info-catalog-offline af-task-center-data-aggregation-plan af-task-center-data-processing-plan af-task-center-data-comprehension-plan af-task-center-data-search-report af-sszd-app-apply-escalate af-sszd-app-report-escalate af-basic-bigdata-create-category-label af-basic-bigdata-update-category-label af-basic-bigdata-delete-category-label af-basic-bigdata-auth-category-label af-data-catalog-open af-front-end-processor-request"` // 审核类型 逻辑视图相关：af-data-view-publish 发布审核 af-data-view-online 上线审核 af-data-view-offline 下线审核 auth-service相关：af-data-permission-request 数据权限申请 af-data-catalog-online af-data-catalog-offline af-data-catalog-publish af-data-catalog-download af-data-catalog-open 开放目录申请 计划相关：af-task-center-data-aggregation-plan af-task-center-data-processing-plan af-task-center-data-comprehension-plan 应用创建:af-sszd-app-apply-escalate 省市直达应用上报审核 af-sszd-app-report-escalate 业务标签分类：af-basic-bigdata-create-category-label af-basic-bigdata-update-category-label af-basic-bigdata-delete-category-label af-basic-bigdata-auth-category-label af-front-end-processor-request
// }

type AuditType struct {
	AuditType string `json:"audit_type" form:"audit_type" uri:"audit_type" binding:"required"`
}

type AuditTypeGetParameter struct {
	AuditType string `json:"audit_type" form:"audit_type" uri:"audit_type" binding:"required"` // 审核类型
}

type AuditTypeOmitempty struct {
	AuditType string `json:"audit_type" form:"audit_type" uri:"audit_type" binding:"omitempty"`
}

type AuditProcessBind struct {
	AuditType
	ID         string `json:"id" binding:"omitempty"`                  // 绑定id
	ProcDefKey string `json:"proc_def_key" binding:"required,max=128"` // 审核流程key
}

//endregion

//region  AuditProcessBindCreate

type CreateReq struct {
	CreateReqBody `param_type:"body"`
}
type CreateReqBody struct {
	AuditType
	ProcDefKey  string `json:"proc_def_key" binding:"required,max=128"`                                                                                                                         // 审核流程key
	ServiceType string `json:"service_type" binding:"required,oneof=data-view auth-service data-catalog open-catalog task-center configuration-center basic-bigdata-service business-grooming"` // 所属业务模块，data-view auth-service data-catalog open-catalog task-center configuration-center
}

type AuditProcessBindUriReq struct {
	Id uint64 `json:"id" uri:"id" binding:"required"`
}

//endregion

//region  AuditProcessBindCreate

type ListReq struct {
	ListReqQuery `param_type:"query"`
}
type ListReqQuery struct {
	request.PageInfo
	AuditTypeOmitempty
	ServiceType string `json:"service_type" form:"service_type" uri:"service_type" binding:"omitempty,oneof=data-view auth-service data-catalog open-catalog task-center configuration-center basic-bigdata-service business-grooming"` // 所属业务模块，data-view auth-service data-catalog task-center configuration-center
}

type ListRes struct {
	response.PageResults[AuditProcessBind]
}

//endregion

//region  UpdateAuditProcessBind

type UpdateReq struct {
	UpdateReqPath `param_type:"path"`
	UpdateReqBody `param_type:"body"`
}
type UpdateReqPath struct {
	AuditProcessBindUriReq
}
type UpdateReqBody struct {
	AuditType
	ProcDefKey  string `json:"proc_def_key" binding:"required,max=128"`                                                                                                                         // 审核流程key
	ServiceType string `json:"service_type" binding:"required,oneof=data-view auth-service data-catalog open-catalog task-center configuration-center basic-bigdata-service business-grooming"` // 所属业务模块，如逻辑视图业务为data-view
}

//endregion

//region   DeleteAuditProcessBind

type DeleteReq struct {
	AuditProcessBindUriReq
}
type DeleteReqPath struct {
	AuditProcessBindUriReq
}

//endregion

type GetAuditProcessRes struct {
	ID          string `json:"id"`
	AuditType   string `json:"audit_type"` // 审核类型
	ProcDefKey  string `json:"proc_def_key"`
	ServiceType string `json:"service_type"`
}

//endregion
