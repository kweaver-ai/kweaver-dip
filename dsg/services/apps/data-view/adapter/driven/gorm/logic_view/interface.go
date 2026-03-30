package logic_view

import (
	"context"
	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
	wf_common "github.com/kweaver-ai/idrm-go-common/workflow/common"
)

type LogicViewRepo interface {
	Create(ctx context.Context, formView *model.FormView) error
	Update(ctx context.Context, formView *model.FormView) error
	Delete(ctx context.Context, formView *model.FormView) error
	GetByOwnerId(ctx context.Context, ownerId string) (formViews []*model.FormView, err error)
	GetBySubjectId(ctx context.Context, subjectId string) (logicViews []*model.FormView, err error)
	GetSubjectDomainIdsByUserId(ctx context.Context, userId string) (subjectDomainIds []string, err error)
	UpdateLogicViewAndField(ctx context.Context, formView *model.FormView, formViewFields []*model.FormViewField, req *UpdateLogicViewAndFieldReq) error
	GetLogicViewSQL(ctx context.Context, logicViewId string) (formViewSql []*model.FormViewSql, err error)
	GetLogicViewSQLs(ctx context.Context, logicViewIds []string) (formViewSql []*model.FormViewSql, err error)
	CustomLogicEntityViewNameExist(ctx context.Context, businessName string, technicalName string) error
	// 获取逻辑视图
	Get(ctx context.Context, logicViewId string) (*model.FormView, error)
	GetBasicInfo(ctx context.Context, logicViewId []string) (ds []*model.FormView, err error)
	//审核流程
	GetByApplyId(ctx context.Context, applyID uint64) (*model.FormView, error)
	GetAuditingInIds(ctx context.Context, logicViewIds []string) (auditingLogicView []*model.FormView, err error)
	AuditProcessInstanceCreate(ctx context.Context, viewId string, audit *model.FormView) (err error)
	ConsumerWorkflowAuditMsg(ctx context.Context, msg *wf_common.AuditProcessMsg) error
	ConsumerWorkflowAuditResult(ctx context.Context, auditType string, result *wf_common.AuditResultMsg) error
	ConsumerWorkflowAuditProcDelete(ctx context.Context, auditType string, result *wf_common.AuditProcDefDelMsg) error
	GetPushView(ctx context.Context) (logicViews []*model.FormView, err error)
	ViewsCatalogs(ctx context.Context, ids []string) (count []*ViewsCatalogs, err error)
}

type UpdateLogicViewAndFieldReq struct {
	SQL                 string
	BusinessTimestampID string
	Infos               []*ClearAttributeInfo
}
type ClearAttributeInfo struct {
	ID               string `json:"id" binding:"required,uuid"`                  // 列id
	ClearAttributeID string `json:"clear_attribute_id" binding:"omitempty,uuid"` //清除属性ID
}

type ViewsCatalogs struct {
	ID           uint64 `gorm:"column:id" json:"id"`
	ResourceID   string `gorm:"column:resource_id" json:"resource_id"`
	Name         string `gorm:"column:name"  json:"name"`
	ApplyNum     int    `gorm:"column:apply_num"  json:"apply_num"`
	DepartmentID string `gorm:"column:department_id" json:"source_department_id"`
}
