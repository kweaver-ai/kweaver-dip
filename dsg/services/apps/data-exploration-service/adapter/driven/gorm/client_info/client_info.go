package client_info

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/infrastructure/repository/db"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/infrastructure/repository/db/model"
)

type Repo interface {
	Insert(ctx context.Context, info *model.ClientInfo) error
	Get(ctx context.Context) (*model.ClientInfo, error)
}

func NewRepo(data *db.Data) Repo {
	return &repo{data: data}
}

type repo struct {
	data *db.Data
}

func (r *repo) Insert(ctx context.Context, info *model.ClientInfo) error {
	return r.data.DB.WithContext(ctx).Table("t_client_info").Create(info).Error
}

func (r *repo) Get(ctx context.Context) (model *model.ClientInfo, err error) {
	db := r.data.DB.WithContext(ctx).Table("t_client_info").Take(&model)
	return model, db.Error
}
