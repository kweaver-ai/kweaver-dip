package configuration

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
)

type Repo interface {
	GetByName(ctx context.Context, name string) ([]*model.Configuration, error)
	GetByNames(ctx context.Context, names []string) ([]*model.Configuration, error)
	GetAll(ctx context.Context) ([]*model.Configuration, error)
	GetByType(ctx context.Context, t int32) ([]*model.Configuration, error)
	Insert(ctx context.Context, configurationModel *model.Configuration) error
	Update(ctx context.Context, configurationModel *model.Configuration) error
	GetByNameAndType(ctx context.Context, name string, t int32) (*model.Configuration, error)
}
