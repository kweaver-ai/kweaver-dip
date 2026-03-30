package impl

import (
	"context"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/common"
	object_main_business "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/object_main_business"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	domain "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/object_main_business"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

func NewRepo(db *gorm.DB) object_main_business.Repo {
	return &repo{db: db}
}

type repo struct {
	db *gorm.DB
}

func (r *repo) GetListByObjectId(ctx context.Context, objectId string, req *domain.QueryPageReq) (totalCount int64, resp []*model.TObjectMainBusiness, err error) {

	d := r.db.WithContext(ctx).
		Model(&model.TObjectMainBusiness{}).
		Where("object_id = ? and deleted_at is null", objectId)

	err = d.Count(&totalCount).Error
	if err != nil {
		log.WithContext(ctx).Error("failed to get main business from db", zap.Error(err))
		return 0, nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	limit := req.Limit
	offset := limit * (req.Offset - 1)
	if limit > 0 {
		d = d.Limit(limit).Offset(offset)
	}

	err = d.Find(&resp).Error
	if err != nil {
		log.WithContext(ctx).Error("failed to get main business from db", zap.Error(err))
		return 0, nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	return totalCount, resp, err
}

func (r *repo) AddObjectMainBusiness(ctx context.Context, req []model.TObjectMainBusiness) (count int64, err error) {
	d := r.db.WithContext(ctx).
		Model(&model.TObjectMainBusiness{}).CreateInBatches(req, common.DefaultBatchSize)
	if d.Error != nil {
		log.WithContext(ctx).Error("failed to add main business", zap.Error(d.Error))
		return 0, errorcode.Detail(errorcode.PublicDatabaseError, d.Error)
	}
	return d.RowsAffected, nil
}

func (r *repo) UpdateObjectMainBusiness(ctx context.Context, req []*model.TObjectMainBusiness) (count int64, err error) {
	tx := r.db.WithContext(ctx).Begin()
	for _, record := range req {
		err := tx.Model(&model.TObjectMainBusiness{}).Where("id = ? and deleted_at is null", record.ID).Updates(record).Error
		if err != nil {
			tx.Rollback()
			log.WithContext(ctx).Error("failed to update main business", zap.Error(err))
			return 0, errorcode.Detail(errorcode.PublicDatabaseError, err)
		}
	}

	if err := tx.Commit().Error; err != nil {
		log.WithContext(ctx).Error("failed to update main business", zap.Error(err))
		return 0, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	return int64(len(req)), nil
}

func (r *repo) DeleteObjectMainBusiness(ctx context.Context, req []string, uid string) (count int64, err error) {
	deleteTime := time.Now()
	d := r.db.WithContext(ctx).Model(&model.TObjectMainBusiness{}).
		Where("id in ? and deleted_at is null", req).
		Updates(&model.TObjectMainBusiness{
			DeletedAt: &deleteTime,
			DeletedBy: &uid,
		})
	if d.Error != nil {
		log.WithContext(ctx).Error("failed to delete main business", zap.Error(d.Error))
		return 0, errorcode.Detail(errorcode.PublicDatabaseError, d.Error)
	}
	return d.RowsAffected, nil
}
