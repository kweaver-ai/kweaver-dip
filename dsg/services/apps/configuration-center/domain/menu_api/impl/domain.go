package impl

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/menu_api"
	domain "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/menu_api"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/menu_api/apis"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/samber/lo"
)

type userCaseImpl struct {
	repo menu_api.Repo
}

func NewUserCase(
	repo menu_api.Repo,
) domain.UseCase {
	return &userCaseImpl{
		repo: repo,
	}
}

func (u userCaseImpl) InitApis(ctx context.Context) error {
	rs := apis.All()
	ds := make([]*model.TMenuAPI, 0, len(rs))
	for _, r := range rs {
		ds = append(ds, &model.TMenuAPI{
			ServiceName: r.ServiceName,
			Path:        r.Path,
			Method:      r.Method,
		})
	}
	if err := u.repo.UpsertApi(ctx, ds); err != nil {
		log.Errorf("upsert apis error")
		return err
	}
	return nil
}

func (u userCaseImpl) Upsert(ctx context.Context, rs []*domain.MenuApiRelation) error {
	//TODO implement me
	panic("implement me")
}

func (u userCaseImpl) UpsertRelations(ctx context.Context, rs []*domain.MenuApiRelation) error {
	ds := make([]*model.TMenuAPIRelation, 0, len(rs))
	for _, r := range rs {
		es := lo.Times(len(r.Keys), func(index int) *model.TMenuAPIRelation {
			return &model.TMenuAPIRelation{
				Aid:    r.Aid,
				Action: r.Action,
				Key:    r.Keys[index],
			}
		})
		ds = append(ds, es...)
	}
	if err := u.repo.UpsertRelations(ctx, ds); err != nil {
		log.Errorf("UpsertRelations error %v", err.Error())
		return err
	}
	return nil
}

func (u userCaseImpl) GetServiceApis(ctx context.Context, serviceName string) ([]string, error) {
	return nil, nil
}
