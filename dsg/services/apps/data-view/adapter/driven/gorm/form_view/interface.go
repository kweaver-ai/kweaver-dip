package form_view

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-view/domain/form_view"
	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
	"gorm.io/gorm"
)

type FormViewRepo interface {
	Db() *gorm.DB
	GetFormViewById(ctx context.Context, id string) (formView *model.FormView, err error)
	GetById(ctx context.Context, id string, tx ...*gorm.DB) (formView *model.FormView, err error)
	GetExistedViewByID(ctx context.Context, id string) (*model.FormView, error)
	PageList(ctx context.Context, req *form_view.PageListFormViewReq) (total int64, formView []*model.FormView, err error)
	Create(ctx context.Context, formView *model.FormView) error
	Update(ctx context.Context, formView *model.FormView) error
	UpdateAuthedUsers(ctx context.Context, id string, users []string) error
	RemoveAuthedUsers(ctx context.Context, id string, userID string) error
	UserCanAuthView(ctx context.Context, userID string, viewID string) (can bool, err error)
	UserAuthedViews(ctx context.Context, userID string, viewID ...string) (ds []*model.ViewAuthedUser, err error)
	Save(ctx context.Context, formView *model.FormView) error
	UpdateFormColumn(ctx context.Context, status int, ids []string) error
	UpdateViewStatusAndAdvice(ctx context.Context, auditAdvice string, ids []string) error
	UpdateTransaction(ctx context.Context, req *UpdateTransactionArgs) error
	UpdateDatasourceViewTransaction(ctx context.Context, view *model.FormView, timestampId string, fieldReqMap map[string]*form_view.Fields) (clearSyntheticData bool, resErr error)
	Delete(ctx context.Context, formView *model.FormView) error
	DeleteDatasourceViewTransaction(ctx context.Context, id, datasourceId string) error
	DeleteCustomOrLogicEntityViewTransaction(ctx context.Context, id string) error
	GetFormViewList(ctx context.Context, datasourceId string) (formView []*model.FormView, err error)
	GetFormViews(ctx context.Context, datasourceId string) (formView []*model.FormView, err error)
	CreateField(ctx context.Context, formViewField *model.FormViewField) error
	CreateFormAndField(ctx context.Context, formView *model.FormView, formViewFields []*model.FormViewField, sql string, tx ...*gorm.DB) error
	ScanTransaction(ctx context.Context, newView []*model.FormView, updateView []*model.FormView, newField []*model.FormViewField, updateField []*model.FormViewField) (resErr error)
	UpdateViewTransaction(ctx context.Context, formView *model.FormView, newField []*model.FormViewField, updateField []*model.FormViewField, deleteFieldIds []string, sql string) (resErr error)
	DataSourceDeleteTransaction(ctx context.Context, id string) error
	DataSourceViewNameExist(ctx context.Context, selfView *model.FormView, name string, tx ...*gorm.DB) (bool, error)
	CustomLogicEntityViewNameExist(ctx context.Context, viewType string, formID string, name string, nameType string) (bool, error)
	GetByIds(ctx context.Context, ids []string) (formViews []*model.FormView, err error)
	VerifyIds(ctx context.Context, ids []string) (pass bool, err error)
	GetLogicalEntityByIds(ctx context.Context, ids []string) (formViews []*model.FormView, err error)
	GetRelationCountBySubjectIds(ctx context.Context, isOperator bool, ids []string) ([]*model.SubjectRelation, error)
	QueryViewCreatedByLogicalEntity(ctx context.Context, req *form_view.QueryLogicalEntityByViewReq) (total int64, formView []*model.FormView, err error)
	TotalSubjectCount(ctx context.Context, isOperator bool) (total int64, err error)
	GetByOwnerOrIdsPages(ctx context.Context, req *form_view.GetUsersFormViewsReq) (total int64, formViews []*model.FormView, err error)
	GetBySubjectId(ctx context.Context, subjectIds []string) (formViews []*model.FormView, err error)
	ClearSubjectIdRelated(ctx context.Context, subjectDomainId []string, logicEntityId []string, moveDeletes []*form_view.MoveDelete, view []*model.FormView) error
	UpdateExploreJob(ctx context.Context, viewID string, jobInfo map[string]interface{}) (bool, error)
	GetOwnerViewCount(ctx context.Context, viewId, ownerId string) (total int64, err error)
	GetViewsByDIdName(ctx context.Context, datasourceId string, name []string) (formViews []*model.FormView, err error)
	GetViewsByDIdOriginalName(ctx context.Context, datasourceId string, name []string) (formViews []*model.FormView, err error)
	GetViewsByDIdAndFilter(ctx context.Context, datasourceId string, filter *form_view.DatasourceFilter) (formViews []*model.FormView, err error)
	GetByAuditStatus(ctx context.Context, req *form_view.GetByAuditStatusReq) (total int64, formView []*model.FormView, err error)
	GetBasicViewList(ctx context.Context, req *form_view.GetBasicViewListReqParam) (formViews []*model.FormView, err error)
	SaveFormViewSql(ctx context.Context, viewSQL *model.FormViewSql, tx *gorm.DB) error
	GetViewByTechnicalNameAndHuaAoId(ctx context.Context, technicalName, huaAoId string) (*model.FormView, error)
	GetByOwnerID(ctx context.Context, userID string, id string) (total int64, formViews []*model.FormView, err error)
	GetViewByKey(ctx context.Context, key string) (formView *model.FormView, err error)
	GetFormViewIDByOwnerID(ctx context.Context, OwnerId string) (formViewID []string, err error)
	GetDatabaseTableCount(ctx context.Context, departmentId string) (total int64, err error)
	GetFormViewSyncList(ctx context.Context, offset, limit int, datasourceId string) ([]*FormViewSyncItem, error)
	GetList(ctx context.Context, departmentId, ownerIds, keyword string) (formViews []*model.FormView, err error)
}

type FormViewSyncItem struct {
	ID                 string `gorm:"column:id"`
	MdlID              string `gorm:"column:mdl_id"`
	DatasourceID       string `gorm:"column:datasource_id"`
	TechnicalName      string `gorm:"column:technical_name"`
	UniformCatalogCode string `gorm:"column:uniform_catalog_code"`
}

type UpdateTransactionArgs struct {
	FormView *model.FormView
	Fields   map[string]string
}
