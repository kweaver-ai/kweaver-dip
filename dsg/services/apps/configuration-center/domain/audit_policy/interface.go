package audit_policy

import (
	"context"
	"database/sql"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/models/response"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
)

// 这些是合法的审核状态类型
const (
	AuditPolicyCustomizeType string = "customize" // 自定义
	AuditPolicyBuiltInType   string = "built-in"  // 内置
)

// 这些是合法的审核状态
const (
	AuditPolicyNotEnabledStatus   string = "not-enabled" // 未启用
	AuditPolicyEnabledStatus      string = "enabled"     // 已启用
	AuditPolicyDisEnabledInStatus string = "disabled"    // 已停止
)

// 这些是合法的资源类型
const (
	AssetDataCatalog  = "data-catalog"
	AssetInterfaceSvc = "interface-svc"
	AssertLogicalView = "data-view"
	AssertIndicator   = "indicator"
)

type AppsUseCase interface {
	Create(ctx context.Context, req *CreateReqBody, userInfo *model.User) (*CreateOrUpdateResBody, error)
	Update(ctx context.Context, req *UpdateReq, userInfo *model.User) (*CreateOrUpdateResBody, error)
	UpdateStatus(ctx context.Context, req *UpdateStatusReq, userInfo *model.User) (*CreateOrUpdateResBody, error)
	Delete(ctx context.Context, req *DeleteReq) error
	GetById(ctx context.Context, req *AuditPolicyReq) (*AuditPolicyRes, error)
	List(ctx context.Context, req *ListReqQuery, userInfo *model.User) (*ListRes, error)
	IsNameRepeat(ctx context.Context, req *NameRepeatReq) error
	GetAuditPolicyByResourceIds(ctx context.Context, ids string) (*ResourcePolicyRes, error)
	GetResourceAuditPolicy(ctx context.Context, ids string) (*GetAuditProcessRes, error)
}

// region common
type AuditPolicy struct {
	Id string `json:"id" uri:"id" binding:"required,uuid" example:"f5600699-b4c8-443e-a37e-39e3fd5d2159"` // 审核策略ID
}

type CreateOrUpdateResBody struct {
	ID string `json:"id" example:"f5600699-b4c8-443e-a37e-39e3fd5d2159"` // 审核策略ID
}

type AuditPolicyReq struct {
	AuditPolicy
}

type Resource struct {
	Id string `json:"id" uri:"id" binding:"required" example:"f5600699-b4c8-443e-a37e-39e3fd5d2159"` // 资源ID
}

//endregion

// region  Create
type CreateReqBody struct {
	Name        string      `json:"name" binding:"required,lte=128" example:"name"`                                              // 审核策略名称
	Description string      `json:"description"  binding:"omitempty,lte=300,VerifyDescriptionReduceSpace" example:"description"` // 审核策略描述
	Resources   []Resources `json:"resources" binding:"omitempty"`                                                               // 审核资源
}

type Resources struct {
	ID   string `json:"id"  binding:"required" example:"f5600699-b4c8-443e-a37e-39e3fd5d2159"`                                 // 资源id
	Type string `json:"type"  binding:"required,oneof=data-catalog interface-svc data-view indicator" example:"interface_svc"` // 资源类型
}

func (f *CreateReqBody) ToModel(userId string, id string) (auditPolicy *model.AuditPolicy, auditPolicyResources []*model.AuditPolicyResource) {
	auditPolicy = &model.AuditPolicy{
		ID:             id,
		Name:           f.Name,
		Description:    sql.NullString{String: f.Description, Valid: true},
		Type:           AuditPolicyCustomizeType,    // 审核策略类型默认为自定义
		Status:         AuditPolicyNotEnabledStatus, // 创建时候审核策略为未启动
		ResourcesCount: sql.NullInt64{Int64: int64(len(f.Resources)), Valid: true},
		// 创建时候审核流程为空
		AuditType:    sql.NullString{String: "", Valid: true},
		ProcDefKey:   sql.NullString{String: "", Valid: true},
		ServiceType:  sql.NullString{String: "", Valid: true},
		CreatedByUID: userId,
		UpdatedByUID: userId,
	}
	for _, resource := range f.Resources {
		auditPolicyResource := &model.AuditPolicyResource{
			ID:            resource.ID,
			AuditPolicyID: id,
			Type:          resource.Type,
		}
		auditPolicyResources = append(auditPolicyResources, auditPolicyResource)
	}
	return
}

//endregion

// region Update
type UpdateReq struct {
	UpdateReqPath `param_type:"path"`
	UpdateReqBody `param_type:"body"`
}
type UpdateReqPath struct {
	AuditPolicy
}
type UpdateReqBody struct {
	Name        string      `json:"name" binding:"required,lte=128" example:"name"`                                              // 审核策略名称
	Description string      `json:"description"  binding:"omitempty,lte=300,VerifyDescriptionReduceSpace" example:"description"` // 审核策略描述
	Status      string      `json:"status"  binding:"omitempty,oneof=not-enabled enabled disabled" example:"enabled"`            // 审核策略状态: enabled：开启，disabled：停用
	AuditType   string      `json:"audit_type"  binding:"omitempty,oneof=af-data-permission-request"`                            // 审核流程类型 af-data-permission-request：数据权限申请
	ProcDefKey  string      `json:"proc_def_key" binding:"omitempty,max=128"`                                                    // 审核流程key
	ServiceType string      `json:"service_type" binding:"omitempty,oneof=auth-service"`                                         // 审核流程所属业务模块，auth-service
	Resources   []Resources `json:"resources" binding:"omitempty"`                                                               // 审核资源
}

func (f *UpdateReqBody) ToModel(userId string, id string, modelPolicy *model.AuditPolicy) (auditPolicy *model.AuditPolicy, auditPolicyResources []*model.AuditPolicyResource) {
	auditPolicy = &model.AuditPolicy{
		ID:             id,
		Name:           f.Name,
		Description:    sql.NullString{String: f.Description, Valid: true},
		Type:           modelPolicy.Type,
		Status:         f.Status,
		ResourcesCount: sql.NullInt64{Int64: int64(len(f.Resources)), Valid: true},
		AuditType:      sql.NullString{String: f.AuditType, Valid: true},
		ProcDefKey:     sql.NullString{String: f.ProcDefKey, Valid: true},
		ServiceType:    sql.NullString{String: f.ServiceType, Valid: true},
		CreatedByUID:   userId,
		UpdatedByUID:   userId,
	}
	for _, resource := range f.Resources {
		auditPolicyResource := &model.AuditPolicyResource{
			ID:            resource.ID,
			AuditPolicyID: id,
			Type:          resource.Type,
		}
		auditPolicyResources = append(auditPolicyResources, auditPolicyResource)
	}
	return
}

//endregion

// region UpdateStatus
type UpdateStatusReq struct {
	UpdateReqPath       `param_type:"path"`
	UpdateStatusReqBody `param_type:"body"`
}

type UpdateStatusReqBody struct {
	Status string `json:"status"  binding:"omitempty,oneof=enabled disabled" example:"enabled"` // 审核策略状态: enabled：开启，disabled：停用
}

//endregion

//region Delete

type DeleteReq struct {
	AuditPolicy
}

//endregion

//region GetById

type AuditPolicyRes struct {
	ID             string             `json:"id" example:"f5600699-b4c8-443e-a37e-39e3fd5d2159"` // 审核策略ID
	Name           string             `json:"name" example:"name"`                               // 审核策略名称
	Description    string             `json:"description" example:"description"`                 // 审核策略描述
	Type           string             `json:"type" example:"customize"`                          // 审核策略类型：customize(自定义的), built-in(内置的)）
	Status         string             `json:"status"`                                            // 审核策略状态: not-enabled(未启用), enabled(已启用), disabled(已停止)
	ResourcesCount int64              `json:"resources_count"  example:"3"`                      // 当前审核策略下资源数量, 如果是内置类型，为默认值0，前端忽略此字段
	AuditType      string             `json:"audit_type" example:"af-data-permission-request"`   // 审核流程类型 af-data-permission-request：数据权限申请
	ProcDefKey     string             `json:"proc_def_key" example:"Process_8hD05CCJ"`           // 审核流程key
	ServiceType    string             `json:"service_type" example:"auth-service"`               // 审核流程所属业务模块，auth-service
	CreatedAt      int64              `json:"created_at" example:"1684301771000"`                // 创建时间
	CreatedName    string             `json:"creator_name" example:"zhangsan"`                   // 创建人
	UpdatedAt      int64              `json:"updated_at" example:"1684301771000"`                // 更新时间
	UpdatedName    string             `json:"updater_name" example:"zhangsan"`                   // 更新人
	Resources      []*ResourcesDeatil `json:"resources" binding:"omitempty"`                     // 审核资源
}

type ResourcesDeatil struct {
	ID                 string `json:"id"  example:"f5600699-b4c8-443e-a37e-39e3fd5d2159"`                                            // 资源id
	Name               string `json:"name" example:"name"`                                                                           // 资源名称
	Status             string `json:"status" example:"status"`                                                                       // 状态
	Type               string `json:"type"  binding:"oneof= data-catalog interface-svc data-view indicator" example:"interface-svc"` // 资源类型
	SubType            string `json:"sub_type" example:"atomic"`                                                                     // 子资源类型(指标子类型)
	UniformCatalogCode string `json:"uniform_catalog_code" example:"SJST20250610/000005"`                                            // 编码
	TechnicalName      string `json:"technical_name" example:"technical_name"`                                                       // 资源技术名称
	Subject            string `json:"subject" example:"subject"`                                                                     // 主题名称
	Department         string `json:"department" example:"department"`                                                               // 部门名称
}

//endregion

//region List

type PageInfo struct {
	Offset    int    `json:"offset" form:"offset,default=1" binding:"omitempty,min=1" default:"1"`                                          // 页码，默认1
	Limit     int    `json:"limit" form:"limit,default=12" binding:"omitempty,min=1,max=2000" default:"12"`                                 // 每页大小，默认12
	Direction string `json:"direction" form:"direction,default=desc" binding:"omitempty,oneof=asc desc" default:"desc"`                     // 排序方向，枚举：asc：正序；desc：倒序。默认倒序
	Sort      string `json:"sort" form:"sort,default=created_at" binding:"omitempty,oneof=created_at updated_at name" default:"created_at"` // 排序类型，枚举：created_at：按创建时间排序；updated_at：按更新时间排序。默认按创建时间排序
}

type ListReq struct {
	ListReqQuery `param_type:"query"`
}
type ListReqQuery struct {
	PageInfo
	Keyword     string `json:"keyword" form:"keyword" binding:"TrimSpace,omitempty,min=1,max=128"`           // 审核策略名称，支持模糊查询
	Status      string `json:"status"  form:"status" binding:"omitempty,oneof=not-enabled enabled disabled"` // 审核策略状态: not-enabled(未启用), enabled(已启用), disabled(已停止)
	HasAudit    *bool  `json:"has_audit"  form:"has_audit" binding:"omitempty"`                              // 审核流程 (是否设置流程)
	HasResource *bool  `json:"has_resource"  form:"has_resource" binding:"omitempty"`                        // 审核资源（是否设置设置资源）
}

type ListRes struct {
	response.PageResults[AuditPolicyList]
}
type AuditPolicyList struct {
	ID             string `json:"id" example:"f5600699-b4c8-443e-a37e-39e3fd5d2159"` // 审核策略ID
	Name           string `json:"name" example:"name"`                               // 审核策略名称
	Description    string `json:"description" example:"description"`                 // 审核策略描述
	Type           string `json:"type" example:"customize"`                          // 审核策略类型：customize(自定义的), built-in-data-catalog(内置目录)，built-in-interface-svc(内置接口)， built-in-data-view(内置接口)，  built-in-indicator(内置接口)）
	Status         string `json:"status" example:"disabled"`                         // 审核策略状态: not-enabled(未启用), enabled(已启用), disabled(已停止)
	ResourcesCount int64  `json:"resources_count"  example:"3"`                      // 当前审核策略下资源数量, 如果是内置类型，为默认值0，前端忽略此字段
	AuditType      string `json:"audit_type" example:"af-data-permission-request"`   // 审核流程类型 af-data-permission-request：数据权限申请
	ProcDefKey     string `json:"proc_def_key" example:"Process_8hD05CCJ"`           // 审核流程key
	ServiceType    string `json:"service_type" example:"auth-service"`               // 审核流程所属业务模块，auth-service
	CreatedAt      int64  `json:"created_at" example:"1684301771000"`                // 创建时间
	CreatedName    string `json:"creator_name" example:"zhangsan"`                   // 创建人
	UpdatedAt      int64  `json:"updated_at" example:"1684301771000"`                // 更新时间
	UpdatedName    string `json:"updater_name" example:"zhangsan"`                   // 更新人
}

//endregion

// region IsNameRepeat
type NameRepeatReq struct {
	ID   string `json:"id" form:"id" binding:"omitempty,uuid" example:"f5600699-b4c8-443e-a37e-39e3fd5d2159"` // 审核策略ID
	Name string `json:"name" form:"name" binding:"TrimSpace,required,min=1,max=128" example:"name"`           // 审核策略名称
}

//endregion

// region  GetAuditPolicyByResourceIds
type ListByIdsReqParam struct {
	Ids string `json:"ids" form:"ids"  uri:"ids" binding:"required"` // 资源id，兼容uuid和雪花id，批量获取，不限制
}

type ResourcePolicyRes struct {
	InterfaceSvcHasBuiltInAudit   bool                `json:"interface_svc_has_built_in_audit"`  // 接口是否有内置审核流程，true 有审核流程，false没有审核流程
	DataViewHasBuiltInAudit       bool                `json:"data_view_has_built_in_audit"`      // 视图是否有内置审核流程，true 有审核流程，false没有审核流程
	IndicatorHasBuiltInAudit      bool                `json:"indicator_has_built_in_audit"`      // 指标是否有内置审核流程，true 有审核流程，false没有审核流程
	InterfaceSvcHasCustomizeAudit bool                `json:"interface_svc_has_customize_audit"` // 接口是否有自定义审核流程，true 有审核流程，false没有审核流程
	DataViewHasCustomizeAudit     bool                `json:"data_view_has_customize_audit"`     // 视图是否有自定义审核流程，true 有审核流程，false没有审核流程
	IndicatorHasCustomizeAudit    bool                `json:"indicator_has_customize_audit"`     // 指标是否有自定义审核流程，true 有审核流程，false没有审核流程
	Resources                     []*ResourcesDeatils `json:"resources" binding:"omitempty"`     // 审核资源
}

type ResourcesDeatils struct {
	ID       string `json:"id"  example:"f5600699-b4c8-443e-a37e-39e3fd5d2159"` // 资源id
	HasAudit bool   `json:"has_audit"`                                          // 资源是否有审核，true 有审核，false没有审核
}

//endregion

// region GetResourceAuditPolicy
type GetAuditProcessRes struct {
	ID          string `json:"id"`
	AuditType   string `json:"audit_type"` // 审核类型
	ProcDefKey  string `json:"proc_def_key"`
	ServiceType string `json:"service_type"`
}

//endregion
