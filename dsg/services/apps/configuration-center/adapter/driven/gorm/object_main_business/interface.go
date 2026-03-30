package business_structure

import (
	"context"

	domain "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/object_main_business"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
)

type Repo interface {
	GetListByObjectId(ctx context.Context, objectId string, req *domain.QueryPageReq) (totalCount int64, resp []*model.TObjectMainBusiness, err error)
	AddObjectMainBusiness(ctx context.Context, req []model.TObjectMainBusiness) (count int64, err error)
	UpdateObjectMainBusiness(ctx context.Context, req []*model.TObjectMainBusiness) (count int64, err error)
	DeleteObjectMainBusiness(ctx context.Context, req []string, uid string) (count int64, err error)
}
