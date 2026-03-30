package audit_policy

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/audit_policy"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
)

type AuditPolicyRepo interface {
	Create(ctx context.Context, auditPolicy *model.AuditPolicy, auditPolicyResource []*model.AuditPolicyResource) (err error)
	Update(ctx context.Context, auditPolicy *model.AuditPolicy, auditPolicyResource []*model.AuditPolicyResource) (err error)
	Delete(ctx context.Context, id string) (err error)
	List(ctx context.Context, req *audit_policy.ListReqQuery) (policys []*model.AuditPolicy, count int64, err error)
	GetById(ctx context.Context, id string) (*model.AuditPolicy, error)
	GetByType(ctx context.Context, resource_type string) (*model.AuditPolicy, error)
	CheckNameRepeatWithId(ctx context.Context, name, id string) (bool, error)

	GetAuditPolicyByResourceIds(ctx context.Context, ids []string) (policyResources []*AuditPolicyResource, err error)
	GetResourceAuditPolicyByResourceId(ctx context.Context, id string) (*ResourceAuditPolicy, error)

	CheckPolicyEnabled(ctx context.Context, resource_type string) (bool, bool, error)
	GetResourceByPolicyId(ctx context.Context, id string) ([]*model.AuditPolicyResource, error)
	// 以下根据资源id获取资源详情
	GetIndicatorByIds(ctx context.Context, ids []string) ([]*TTechnicalIndicator, error)
	GetFormViewByIds(ctx context.Context, ids []string) ([]*FormView, error)
	GetServiceByIds(ctx context.Context, ids []string) ([]*Service, error)
}

type TTechnicalIndicator struct {
	ID                uint64 `gorm:"column:id;primaryKey" json:"id"`                                 // 指标雪花id
	Name              string `gorm:"column:name;not null" json:"name"`                               // 指标名称
	Code              string `gorm:"column:code;not null" json:"code"`                               // 指标编号
	IndicatorType     string `gorm:"column:indicator_type" json:"indicator_type"`                    // 指标类型
	SubjectDomainName string `gorm:"column:subject_domain_name;not null" json:"subject_domain_name"` // 关联主题域
	Path              string `gorm:"column:path" json:"path"`                                        // 职责部门名称
}

type FormView struct {
	ID                 string `gorm:"column:id;not null;comment:逻辑视图uuid" json:"id"`                                    // 逻辑视图uuid
	BusinessName       string `gorm:"column:business_name;comment:表业务名称" json:"business_name"`                          // 表业务名称
	UniformCatalogCode string `gorm:"column:uniform_catalog_code;not null;comment:统一编目的编码" json:"uniform_catalog_code"` // 统一编目的编码
	TechnicalName      string `gorm:"column:technical_name;not null;comment:表技术名称" json:"technical_name"`               // 表技术名称
	SubjectDomainName  string `gorm:"column:subject_domain_name;not null" json:"subject_domain_name"`                   // 关联主题域
	Path               string `gorm:"column:path" json:"path"`                                                          // 职责部门名称
	OnlineStatus       string `gorm:"column:online_status;type:varchar(20);not null;default:notline;comment:上线状态 " json:"status"`
}

type Service struct {
	ServiceID         string `gorm:"column:service_id;type:varchar(255);not null;comment:接口ID" json:"service_id"`
	ServiceName       string `gorm:"column:service_name;type:varchar(255);not null;comment:接口名称" json:"service_name"` // 接口名称
	ServiceCode       string `gorm:"column:service_code;type:varchar(255);not null;comment:接口编码" json:"service_code"`
	Status            string `gorm:"column:status;type:varchar(20);not null;default:notline;comment:接口状态 " json:"status"`
	SubjectDomainName string `gorm:"column:subject_domain_name;not null" json:"subject_domain_name"` // 关联主题域
	Path              string `gorm:"column:path" json:"path"`                                        // 职责部门名称
}

type ResourceAuditPolicy struct {
	Sid         uint64 `gorm:"column:sid;not null" json:"sid"`                   // 雪花id
	ID          string `gorm:"column:id;primaryKey" json:"id"`                   // 资源id，uuid
	Type        string `gorm:"column:type;not null" json:"type"`                 // 资源类型
	Status      string `gorm:"column:status;not null" json:"status"`             // 策略状态，1：未启用，2：已启用
	AuditType   string `gorm:"column:audit_type;not null" json:"audit_type"`     // 审核类型 af-data-view-publish 发布审核 af-data-view-online 上线审核  af-data-view-offline 上线审核
	ProcDefKey  string `gorm:"column:proc_def_key;not null" json:"proc_def_key"` // 审核流程key
	ServiceType string `gorm:"column:service_type" json:"service_type"`          // 所属业务模块，如逻辑视图业务为data-view
}

type AuditPolicyResource struct {
	ID            string `gorm:"column:id;primaryKey" json:"id"`                         // 资源id，uuid
	AuditPolicyID string `gorm:"column:audit_policy_id;not null" json:"audit_policy_id"` // 审核策略id，uuid
	Type          string `gorm:"column:type;not null" json:"type"`                       // 资源类型
	Status        string `gorm:"column:status;not null" json:"status"`                   // 策略状态，1：未启用，2：已启用
}
