package data_preview_config

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
)

type DataPreviewConfigRepo interface {
	SaveDataPreviewConfig(ctx context.Context, m *model.DataPreviewConfig) error
	Get(ctx context.Context, formViewId, userId string) (*model.DataPreviewConfig, error)
}
