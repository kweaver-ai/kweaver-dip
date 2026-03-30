package impl

import (
	"context"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/fusion_model"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
)

type FusionModelRepo struct {
	data *db.Data
}

func NewFusionModelRepo(data *db.Data) fusion_model.FusionModelRepo {
	return &FusionModelRepo{data: data}
}

func (c *FusionModelRepo) CreateInBatches(ctx context.Context, fields []*model.TFusionField) error {
	result := c.data.DB.Debug().WithContext(ctx).CreateInBatches(fields, 50)
	return result.Error
}

func (c *FusionModelRepo) DeleteInBatches(ctx context.Context, ids []uint64, uid string) error {
	Db := c.data.DB.WithContext(ctx).Debug()
	deleteTime := time.Now()
	err := Db.Model(&model.TFusionField{}).Where("id in ? and deleted_at is null", ids).
		Updates(&model.TFusionField{
			DeletedAt:    &deleteTime,
			DeletedByUID: &uid,
		}).Error
	return err
}

func (c *FusionModelRepo) List(ctx context.Context, workOrderId string) (fields []*model.TFusionField, err error) {

	Db := c.data.DB.WithContext(ctx).Debug()
	tx := Db.Model(&model.TFusionField{}).Where("work_order_id = ? and deleted_at is null", workOrderId)

	tx = tx.Order("`index` asc, id asc").Find(&fields)
	if tx.Error != nil {
		log.WithContext(ctx).Error("List", zap.Error(tx.Error))
		return nil, tx.Error
	}

	return
}

func (c *FusionModelRepo) Update(ctx context.Context, field *model.TFusionField) error {
	result := c.data.DB.Debug().WithContext(ctx).
		Omit("catalog_id", "info_item_id", "created_at", "updated_by_uid").
		Where("id = ? and deleted_at is null", field.ID).Save(field)
	return result.Error
}

func (c *FusionModelRepo) DeleteByWorkOrderId(ctx context.Context, workOrderId, uid string) error {
	deleteTime := time.Now()
	err := c.data.DB.Debug().WithContext(ctx).Where("work_order_id = ? and deleted_at is null", workOrderId).
		Updates(&model.TFusionField{
			DeletedAt:    &deleteTime,
			DeletedByUID: &uid,
		}).Error
	return err
}
