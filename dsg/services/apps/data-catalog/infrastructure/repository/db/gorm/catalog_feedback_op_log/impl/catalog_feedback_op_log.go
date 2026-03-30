package impl

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/catalog_feedback_op_log"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"

	"gorm.io/gorm"
)

func NewRepo(data *db.Data) catalog_feedback_op_log.Repo {
	return &repo{data: data}
}

type repo struct {
	data *db.Data
}

func (r *repo) do(tx *gorm.DB, ctx context.Context) *gorm.DB {
	if tx == nil {
		return r.data.DB.WithContext(ctx)
	}
	return tx
}

func (r *repo) Create(tx *gorm.DB, ctx context.Context, m *model.TCatalogFeedbackOpLog) error {
	return r.do(tx, ctx).Model(&model.TCatalogFeedbackOpLog{}).Create(m).Error
}

func (r *repo) BatchCreate(tx *gorm.DB, ctx context.Context, m []*model.TCatalogFeedbackOpLog) error {
	return r.do(tx, ctx).Model(&model.TCatalogFeedbackOpLog{}).CreateInBatches(m, len(m)).Error
}

func (r *repo) GetListByFeedbackID(tx *gorm.DB, ctx context.Context, feedbackID uint64) ([]*model.TCatalogFeedbackOpLog, error) {
	var datas []*model.TCatalogFeedbackOpLog
	d := r.do(tx, ctx).
		Model(&model.TCatalogFeedbackOpLog{}).
		Where("feedback_id = ?", feedbackID)
	d = d.Order("op_type asc, created_at asc").
		Find(&datas)
	return datas, d.Error
}
