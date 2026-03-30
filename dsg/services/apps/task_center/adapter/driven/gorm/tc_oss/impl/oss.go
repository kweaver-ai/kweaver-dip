package impl

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/tc_oss"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
)

type OssRepo struct {
	data *db.Data
}

func NewOssRepo(data *db.Data) tc_oss.Repo {
	return &OssRepo{data: data}
}

// Insert  save a obj
func (o *OssRepo) Insert(ctx context.Context, obj *model.TcOss) error {
	return o.data.DB.WithContext(ctx).Create(obj).Error
}

// Get a new  project
func (o *OssRepo) Get(ctx context.Context, uuid string) (obj *model.TcOss, err error) {
	err = o.data.DB.WithContext(ctx).First(&obj, &model.TcOss{ID: uuid}).Error
	return
}
