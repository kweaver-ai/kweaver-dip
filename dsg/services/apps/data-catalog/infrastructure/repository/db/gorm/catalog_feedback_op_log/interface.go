package catalog_feedback_op_log

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"gorm.io/gorm"
)

type Repo interface {
	Create(tx *gorm.DB, ctx context.Context, m *model.TCatalogFeedbackOpLog) error
	BatchCreate(tx *gorm.DB, ctx context.Context, m []*model.TCatalogFeedbackOpLog) error
	GetListByFeedbackID(tx *gorm.DB, ctx context.Context, feedbackID uint64) ([]*model.TCatalogFeedbackOpLog, error)
}
