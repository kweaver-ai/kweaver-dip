package elec_licence

import (
	"context"

	domain "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/elec_licence"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
)

type ElecLicenceRepo interface {
	Create(ctx context.Context, elecLicence *model.ElecLicence) error
	CreateInBatches(ctx context.Context, elecLicences []*model.ElecLicence) error
	Update(ctx context.Context, elecLicence *model.ElecLicence) error
	Delete(ctx context.Context, elecLicence *model.ElecLicence) error
	GetByElecLicenceID(ctx context.Context, elecLicenceID string) (*model.ElecLicence, error)
	GetByElecLicenceIDs(ctx context.Context, ids []string) ([]*model.ElecLicence, error)
	GetAll(ctx context.Context) ([]*model.ElecLicence, error)
	Truncate(ctx context.Context) error
	GetList(ctx context.Context, req *domain.ElecLicenceListReq) (totalCount int64, catalogs []*model.ElecLicence, err error)
}
