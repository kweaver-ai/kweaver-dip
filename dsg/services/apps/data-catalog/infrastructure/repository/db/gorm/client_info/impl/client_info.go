package impl

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/client_info"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
)

func NewRepo(data *db.Data) client_info.RepoOp {
	return &repo{data: data}
}

type repo struct {
	data *db.Data
}

func (r *repo) Insert(ctx context.Context, info *model.TClientInfo) error {
	return r.data.DB.WithContext(ctx).Table("t_client_info").Create(info).Error
}

func (r *repo) Get(ctx context.Context) (model *model.TClientInfo, err error) {
	db := r.data.DB.WithContext(ctx).Table("t_client_info").Take(&model)
	return model, db.Error
}
