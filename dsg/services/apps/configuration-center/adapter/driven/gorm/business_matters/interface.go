package business_matters

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/business_matters"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
)

type BusinessMattersRepo interface {
	Create(ctx context.Context, businessMatter *model.BusinessMatter) (err error)
	Update(ctx context.Context, id string, businessMatter *model.BusinessMatter) (err error)
	Delete(ctx context.Context, id string) (err error)
	List(ctx context.Context, req *business_matters.ListReqQuery) (businessMatters []*model.BusinessMatter, total int64, err error)
	NameRepeat(ctx context.Context, name, id string) (bool, error)
	GetByBusinessMattersId(ctx context.Context, id string) (businessMatters *model.BusinessMatter, err error)
	ListThird(ctx context.Context, req *business_matters.ListReqQuery) (businessMatters []*model.CssjjBusinessMatter, total int64, err error)
	GetByBusinessMattersIds(ctx context.Context, ids ...string) (businessMatters []*model.BusinessMatter, err error)
	GetThirdByBusinessMattersIds(ctx context.Context, ids ...string) (businessMatters []*model.BusinessMatter, err error)
}
