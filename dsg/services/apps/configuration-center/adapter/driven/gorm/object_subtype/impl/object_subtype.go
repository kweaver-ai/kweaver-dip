package impl

import (
	"context"
	"time"

	object_subtype "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/object_subtype"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

func NewRepo(db *gorm.DB) object_subtype.Repo {
	return &repo{db: db}
}

type repo struct {
	db *gorm.DB
}

func (r *repo) GetSubtypeByObjectId(ctx context.Context, objectId string) (resp int32, err error) {
	d := r.db.WithContext(ctx).
		Model(&model.TObjectSubtype{}).
		Select("subtype").
		Where("id = ? and deleted_at is null", objectId)

	err = d.Find(&resp).Error
	if err != nil {
		log.WithContext(ctx).Error("failed to get subtype from db", zap.Error(err))
		return 0, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	return resp, err
}

func (r *repo) Create(ctx context.Context, m *model.TObjectSubtype) error {
	err := r.db.WithContext(ctx).Model(&model.TObjectSubtype{}).Create(m).Error
	if err != nil {
		log.WithContext(ctx).Error("failed to create object subtype", zap.Error(err))
		return errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	return nil
}

func (r *repo) Update(ctx context.Context, m *model.TObjectSubtype) error {
	err := r.db.WithContext(ctx).Model(&model.TObjectSubtype{}).Where("id = ? and deleted_at is null", m.ID).
		Updates(map[string]interface{}{
			"subtype":        m.Subtype,
			"main_dept_type": m.MainDeptType,
			"updated_at":     m.UpdatedAt,
			"updated_by":     m.UpdatedBy,
		}).Error
	if err != nil {
		log.WithContext(ctx).Error("failed to update object subtype", zap.Error(err))
		return errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	return nil
}

func (r *repo) BatchDelete(ctx context.Context, ids []string, uid string) error {
	err := r.db.WithContext(ctx).Model(&model.TObjectSubtype{}).
		Where("id in ? and deleted_at is null", ids).
		Updates(map[string]interface{}{
			"deleted_at": time.Now(),
			"deleted_by": uid,
		}).Error
	if err != nil {
		log.WithContext(ctx).Error("failed to batch delete object subtype", zap.Error(err))
		return errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	return nil
}

func (r *repo) GetCountSubTypeById(ctx context.Context, objectId string) (count int64, err error) {
	err = r.db.WithContext(ctx).Model(&model.TObjectSubtype{}).
		Select("id").
		Where("id = ? and deleted_at is null", objectId).Count(&count).Error
	if err != nil {
		return 0, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	return
}

func (r *repo) GetMainDeptByObjectIds(ctx context.Context, objectIds []string) (deptIds []string, err error) {
	d := r.db.WithContext(ctx).
		Model(&model.TObjectSubtype{}).
		Select("id").
		Where("id in ? and main_dept_type=1 and deleted_at is null", objectIds)

	err = d.Find(&deptIds).Error
	if err != nil {
		log.WithContext(ctx).Error("failed to get GetMainDeptByObjectIds from db", zap.Error(err))
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	return deptIds, err
}
