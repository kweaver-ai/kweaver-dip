package impl

import (
	"context"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/form_data_count"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"gorm.io/gorm"
)

type FormDataCountRepoImpl struct {
	db *gorm.DB
}

func NewFormDataCountRepo(db *gorm.DB) form_data_count.FormDataCountRepo {
	return &FormDataCountRepoImpl{db: db}
}

func (r *FormDataCountRepoImpl) Create(ctx context.Context, detail *model.TFormDataCount) error {
	return r.db.WithContext(ctx).Model(&model.TFormDataCount{}).Create(detail).Error
}

func (r *FormDataCountRepoImpl) QueryList(ctx context.Context, formViewId string, startDate, endDate time.Time) ([]*model.TFormDataCount, error) {
	var datas []*model.TFormDataCount
	d := r.db.WithContext(ctx).Model(&model.TFormDataCount{})

	if formViewId != "" {
		d = d.Where("form_view_id = ?", formViewId)
	}
	d = d.Where("created_at >= ? and created_at <= ?", startDate, endDate)
	d = d.Order("created_at asc")
	err := d.Scan(&datas).Error

	return datas, err
}
