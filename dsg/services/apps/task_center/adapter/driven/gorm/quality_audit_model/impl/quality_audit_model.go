package impl

import (
	"context"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/quality_audit_model"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
)

type QualityAuditModelRepo struct {
	data *db.Data
}

func NewRepo(data *db.Data) quality_audit_model.QualityAuditModelRepo {
	return &QualityAuditModelRepo{data: data}
}

func (c *QualityAuditModelRepo) CreateInBatches(ctx context.Context, relations []*model.TQualityAuditFormViewRelation) error {
	result := c.data.DB.Debug().WithContext(ctx).CreateInBatches(relations, 50)
	return result.Error
}

func (c *QualityAuditModelRepo) DeleteByIds(ctx context.Context, ids []uint64, uid string) error {
	Db := c.data.DB.WithContext(ctx).Debug()
	deleteTime := time.Now()
	err := Db.Model(&model.TQualityAuditFormViewRelation{}).Where("id in ? and deleted_at is null", ids).
		Updates(&model.TQualityAuditFormViewRelation{
			DeletedAt:    &deleteTime,
			DeletedByUID: &uid,
		}).Error
	return err
}

func (c *QualityAuditModelRepo) List(ctx context.Context, workOrderId string) (relations []*model.TQualityAuditFormViewRelation, err error) {

	Db := c.data.DB.WithContext(ctx).Debug()
	tx := Db.Model(&model.TQualityAuditFormViewRelation{}).
		Where("work_order_id = ? and deleted_at is null", workOrderId).
		Find(&relations)
	if tx.Error != nil {
		log.WithContext(ctx).Error("List", zap.Error(tx.Error))
		return nil, tx.Error
	}

	return
}

func (c *QualityAuditModelRepo) GetViewIds(ctx context.Context, workOrderId string) (viewIds []string, err error) {
	Db := c.data.DB.WithContext(ctx).Debug()
	tx := Db.Model(&model.TQualityAuditFormViewRelation{}).
		Select("form_view_id").
		Where("work_order_id = ? and deleted_at is null", workOrderId).
		Find(&viewIds)
	if tx.Error != nil {
		log.WithContext(ctx).Error("List", zap.Error(tx.Error))
		return nil, tx.Error
	}
	return
}

func (c *QualityAuditModelRepo) DeleteByWorkOrderId(ctx context.Context, workOrderId, uid string) error {
	deleteTime := time.Now()
	err := c.data.DB.Debug().WithContext(ctx).Where("work_order_id = ? and deleted_at is null", workOrderId).
		Updates(&model.TQualityAuditFormViewRelation{
			DeletedAt:    &deleteTime,
			DeletedByUID: &uid,
		}).Error
	return err
}

func (c *QualityAuditModelRepo) GetByViewIds(ctx context.Context, viewIds []string) (relations []*model.TQualityAuditFormViewRelation, err error) {

	Db := c.data.DB.WithContext(ctx).Debug()
	tx := Db.Model(&model.TQualityAuditFormViewRelation{}).
		Where("form_view_id in ? and deleted_at is null", viewIds).
		Find(&relations)
	if tx.Error != nil {
		log.WithContext(ctx).Error("GetWorkOrderIdsByViewIds", zap.Error(tx.Error))
		return nil, tx.Error
	}

	return
}

func (c *QualityAuditModelRepo) GetDatasourceIds(ctx context.Context, workOrderId string) (datasourceIds []string, err error) {
	Db := c.data.DB.WithContext(ctx).Debug()
	tx := Db.Model(&model.TQualityAuditFormViewRelation{}).
		Distinct("datasource_id").
		Where("work_order_id = ? and deleted_at is null", workOrderId).
		Find(&datasourceIds)
	if tx.Error != nil {
		log.WithContext(ctx).Error("GetDatasourceIds", zap.Error(tx.Error))
		return nil, tx.Error
	}
	return
}

func (c *QualityAuditModelRepo) GetByDatasourceId(ctx context.Context, workOrderId, datasourceId string, formViewIds []string, limit, offset int) (total int64, viewIds []string, err error) {
	Db := c.data.DB.WithContext(ctx).Debug()
	Db = Db.Model(&model.TQualityAuditFormViewRelation{}).
		Select("form_view_id").
		Where("work_order_id = ? and datasource_id = ? and deleted_at is null", workOrderId, datasourceId)
	if len(formViewIds) > 0 {
		Db = Db.Where("form_view_id in ?", formViewIds)
	}
	err = Db.Count(&total).Error
	if err != nil {
		return total, viewIds, err
	}
	offset = limit * (offset - 1)
	if limit > 0 {
		Db = Db.Limit(limit).Offset(offset)
	}
	err = Db.Find(&viewIds).Error
	return
}

func (c *QualityAuditModelRepo) GetUnSyncViewIds(ctx context.Context, workOrderId string) (viewIds []string, err error) {
	Db := c.data.DB.WithContext(ctx).Debug()
	tx := Db.Model(&model.TQualityAuditFormViewRelation{}).
		Select("form_view_id").
		Where("work_order_id = ? and status = 0 and deleted_at is null", workOrderId).
		Find(&viewIds)
	if tx.Error != nil {
		log.WithContext(ctx).Error("GetUnSyncViewIds", zap.Error(tx.Error))
		return nil, tx.Error
	}
	return
}

func (c *QualityAuditModelRepo) UpdateStatusInBatches(ctx context.Context, workOrderId string, viewIds []string) error {
	err := c.data.DB.WithContext(ctx).Model(&model.TQualityAuditFormViewRelation{}).
		Where("work_order_id = ? and form_view_id in ? and deleted_at is null", workOrderId, viewIds).
		Update("status", 1).Error
	return err
}
