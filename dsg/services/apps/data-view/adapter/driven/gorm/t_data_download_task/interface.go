package t_data_download_task

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
	"gorm.io/gorm"
)

type TDataDownloadTaskRepo interface {
	Create(ctx context.Context, tx *gorm.DB, m *model.TDataDownloadTask) error
	Update(ctx context.Context, tx *gorm.DB, m *model.TDataDownloadTask) error
	Delete(ctx context.Context, tx *gorm.DB, id uint64) error
	GetList(ctx context.Context, tx *gorm.DB, isTotalCountNeeded bool, params map[string]any) (int64, []*model.TDataDownloadTask, error)
}
