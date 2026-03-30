package impl

import (
	"context"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/work_order_extend"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
)

type WorkOrderExtendRepo struct {
	data *db.Data
}

func NewWorkOrderExtendRepo(data *db.Data) work_order_extend.WorkOrderExtendRepo {
	return &WorkOrderExtendRepo{data: data}
}

func (w WorkOrderExtendRepo) GetByWorkOrderIdAndExtendKey(ctx context.Context, workOrderId, extendKey string) (res *model.TWorkOrderExtend, err error) {
	tx := w.data.DB.Debug().WithContext(ctx).
		Model(&model.TWorkOrderExtend{}).
		Where("work_order_id = ? and extend_key = ? and deleted_at is null", workOrderId, extendKey).
		Find(&res)
	if tx.Error != nil {
		log.WithContext(ctx).Error("GetByWorkOrderIdAndExtendKey", zap.Error(tx.Error))
		return nil, tx.Error
	}
	return
}

func (w WorkOrderExtendRepo) Create(ctx context.Context, extend *model.TWorkOrderExtend) error {
	result := w.data.DB.Debug().WithContext(ctx).Create(extend)
	return result.Error
}

func (w WorkOrderExtendRepo) Update(ctx context.Context, extend *model.TWorkOrderExtend) error {
	result := w.data.DB.Debug().WithContext(ctx).
		Where("id = ? and deleted_at is null", extend.ID).Save(extend)
	return result.Error
}

func (w WorkOrderExtendRepo) DeleteByWorkOrderId(ctx context.Context, workOrderId string) error {
	deleteTime := time.Now()
	err := w.data.DB.Debug().WithContext(ctx).Where("work_order_id = ? and deleted_at is null", workOrderId).
		Updates(&model.TWorkOrderExtend{
			DeletedAt: &deleteTime,
		}).Error
	return err
}
