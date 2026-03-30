package impl

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
)

func (r *RepoImpl) GetFields(ctx context.Context, modelID uint64) (ds []*model.TDataPushField, err error) {
	ds = make([]*model.TDataPushField, 0)
	err = r.data.DB.WithContext(ctx).Where("model_id=?", modelID).Find(&ds).Error
	return ds, err
}
