package firm

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	"gorm.io/gorm"
)

type CheckFieldType string

const (
	FIRM_NAME         CheckFieldType = "name"
	FIRM_UNIFORM_CODE CheckFieldType = "uniform_code"
)

type Repo interface {
	Create(tx *gorm.DB, ctx context.Context, m *model.TFirm) error
	BatchCreate(tx *gorm.DB, ctx context.Context, m []*model.TFirm) error
	Update(tx *gorm.DB, ctx context.Context, m *model.TFirm) error
	Delete(tx *gorm.DB, ctx context.Context, uid string, ids []uint64) error
	GetList(tx *gorm.DB, ctx context.Context, params map[string]any) (int64, []*model.TFirm, error)
	CheckExistedByFieldVal(tx *gorm.DB, ctx context.Context, field CheckFieldType, value string) (bool, error)
}
