package impl

import (
	"context"

	repo "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/db_sandbox"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db"
	"gorm.io/gorm"
)

type repoImpl struct {
	data *db.Data
}

func NewRepo(data *db.Data) repo.Repo {
	return &repoImpl{data: data}
}

func (r *repoImpl) db(ctx context.Context) *gorm.DB {
	return r.data.DB.WithContext(ctx)
}
