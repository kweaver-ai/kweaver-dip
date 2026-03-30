package impl

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/menu_api"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	"gorm.io/gorm"
)

type repo struct {
	db *gorm.DB
}

func NewMenuRepo(db *gorm.DB) menu_api.Repo {
	return &repo{db: db}
}

func (r repo) Upsert(ctx context.Context, ms []*model.TMenuAPI, rs []*model.TMenuAPIRelation) error {
	//TODO implement me
	panic("implement me")
}

func (r repo) GetRelationsByService(ctx context.Context, ids []string) ([]*model.TMenuAPIRelation, error) {
	//TODO implement me
	panic("implement me")
}

func (r repo) GetApisByService(ctx context.Context, serviceName string) ([]*model.TMenuAPI, error) {
	//TODO implement me
	panic("implement me")
}
