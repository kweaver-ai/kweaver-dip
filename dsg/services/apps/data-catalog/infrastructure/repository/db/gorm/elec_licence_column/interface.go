package elec_licence_column

import (
	"context"

	domain "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/elec_licence"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
)

type ElecLicenceColumnRepo interface {
	Create(ctx context.Context, column *model.ElecLicenceColumn) error
	CreateInBatches(ctx context.Context, columns []*model.ElecLicenceColumn) error
	Update(ctx context.Context, column *model.ElecLicenceColumn) error
	Delete(ctx context.Context, column *model.ElecLicenceColumn) error
	GetByID(ctx context.Context, id string) (*model.ElecLicenceColumn, error)
	GetByElecLicenceID(ctx context.Context, elec_licence_id string) (columns []*model.ElecLicenceColumn, err error)
	GetByElecLicenceIDPage(ctx context.Context, req domain.GetElecLicenceColumnListReq) (int64, []*model.ElecLicenceColumn, error)
	GetByElecLicenceIDs(ctx context.Context, elec_licence_ids []string) ([]*model.ElecLicenceColumn, error)
	Truncate(ctx context.Context) error
}
