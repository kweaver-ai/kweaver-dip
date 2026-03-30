package impl

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/form_view_extend"
	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
	"gorm.io/gorm"
)

type formViewExtendRepo struct {
	db *gorm.DB
}

func NewFormViewExtendRepo(db *gorm.DB) form_view_extend.FormViewExtendRepo {
	return &formViewExtendRepo{db: db}
}
func (f *formViewExtendRepo) Db() *gorm.DB {
	return f.db
}
func (f *formViewExtendRepo) do(tx []*gorm.DB) *gorm.DB {
	if len(tx) > 0 && tx[0] != nil {
		return tx[0]
	}
	return f.db
}

func (f *formViewExtendRepo) Save(ctx context.Context, record *model.TFormViewExtend) error {
	return f.db.WithContext(ctx).Save(record).Error
}
