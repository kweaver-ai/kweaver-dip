package data_classify_attribute_blacklist

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
)

type DataClassifyAttrBlacklistRepo interface {
	Create(ctx context.Context, m *model.DataClassifyAttrBlacklist) error
	GetByID(ctx context.Context, formViewID, fieldID string) ([]*model.DataClassifyAttrBlacklist, error)
}
