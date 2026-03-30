package firm

import (
	"context"

	domain "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/address_book"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	"gorm.io/gorm"
)

type Repo interface {
	Create(tx *gorm.DB, ctx context.Context, m *model.TAddressBook) error
	BatchCreate(tx *gorm.DB, ctx context.Context, m []*model.TAddressBook) error
	Update(tx *gorm.DB, ctx context.Context, m *model.TAddressBook) (bool, error)
	Delete(tx *gorm.DB, ctx context.Context, uid string, recordId uint64) (bool, error)
	GetList(tx *gorm.DB, ctx context.Context, req *domain.ListReq) (int64, []*domain.ListItem, error)
}
