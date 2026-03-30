package menu_api

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
)

type Repo interface {
	UpsertApi(ctx context.Context, ms []*model.TMenuAPI) error
	UpsertRelations(ctx context.Context, rs []*model.TMenuAPIRelation) error
	GetRelationsByService(ctx context.Context, ids []string) ([]*model.TMenuAPIRelation, error)
	GetApisByService(ctx context.Context, serviceName string) ([]*model.TMenuAPI, error)
}
