package form_view_field

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-view/domain/form_view"
	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
)

type FormViewFieldRepo interface {
	GetFormViewFieldList(ctx context.Context, formViewId string) (formViewField []*model.FormViewField, err error)
	GetFormViewFields(ctx context.Context, formViewId string) (formViewField []*model.FormViewField, err error)
	GetFormViewRelatedFieldList(ctx context.Context, isOperator bool, subjectId ...string) (formViewField []*model.FormViewSubjectField, err error)
	GetFieldsByFormViewIds(ctx context.Context, formViewIds []string) (formViewField []*model.FormViewField, err error)
	GetFormViewFieldListBusinessNameEmpty(ctx context.Context, formViewId string) (formViewField []*model.FormViewField, err error)
	GetFields(ctx context.Context, req *form_view.GetFieldsReq) (formViewField []*model.FormViewField, err error)
	GetField(ctx context.Context, id string) (formViewField *model.FormViewField, err error)
	GetMultiViewField(ctx context.Context, viewIds []string) (formViewField []*model.FormViewField, err error)
	DataSourceTables(ctx context.Context, reqs [][]string) (formViews []*model.LineageFieldInfo, err error)
	FieldNameExist(ctx context.Context, formID string, fieldID string, name string) (bool, error)
	UpdateBusinessTimestamp(ctx context.Context, viewId, fieldId string) error
	GetBusinessTimestamp(ctx context.Context, viewId string) ([]*model.FormViewField, error)
	GetFieldsForDataClassify(ctx context.Context, formViewId string) (formViewFields []*model.FormViewField, err error)
	GetFieldsForDataGrade(ctx context.Context, formViewId string) (formViewFields []*model.FormViewField, err error)
	BatchUpdateFieldSuject(ctx context.Context, fields []*model.FormViewField) (err error)
	BatchUpdateFieldGrade(ctx context.Context, fields []*model.FormViewField) (err error)
	GetViewIdByFieldCodeTableId(ctx context.Context, codeTableIds []string) (viewIds []string, err error)
	GetViewIdByFieldStandardCode(ctx context.Context, StandardCodes []string) (viewIds []string, err error)
	GetByIds(ctx context.Context, ids []string) (formViewFields []*model.FormViewField, err error)
	GroupBySubjectId(ctx context.Context) (groups []*model.FormViewFieldGroup, err error)
	ViewFieldCount(ctx context.Context, ids []string) (count []*ViewFieldCount, err error)
}

type ViewFieldCount struct {
	FormViewID string `gorm:"column:form_view_id" json:"form_view_id"` // 逻辑视图uuid
	Count      int    `gorm:"column:count"  json:"count"`
}
