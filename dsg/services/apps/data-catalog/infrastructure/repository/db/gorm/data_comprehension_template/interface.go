package data_comprehension_template

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/data_comprehension"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"gorm.io/gorm"
)

type Repo interface {
	Db() *gorm.DB
	GetById(ctx context.Context, id string, tx ...*gorm.DB) (formView *model.TDataComprehensionTemplate, err error)
	PageList(ctx context.Context, req *data_comprehension.GetTemplateListReq) (total int64, list []*model.TDataComprehensionTemplate, err error)
	Create(ctx context.Context, formView *model.TDataComprehensionTemplate, tx ...*gorm.DB) error
	Update(ctx context.Context, formView *model.TDataComprehensionTemplate) error
	Delete(ctx context.Context, formView *model.TDataComprehensionTemplate, tx ...*gorm.DB) error
	NameExist(ctx context.Context, id, name string) error
}
