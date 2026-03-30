package impl

import (
	"context"
	"errors"

	"github.com/kweaver-ai/idrm-go-frame/core/store/gormx"

	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/points_management"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
	"gorm.io/gorm"
)

type PointsRuleConfigImpl struct {
	db *db.Data
}

func NewPointsRuleConfigRepo(db *db.Data) points_management.PointsRuleConfigRepo {
	return &PointsRuleConfigImpl{db: db}
}

func (r *PointsRuleConfigImpl) Create(ctx context.Context, pointRuleConfig *model.PointsRuleConfig) error {
	return r.db.DB.WithContext(ctx).Create(pointRuleConfig).Error
}

func (r *PointsRuleConfigImpl) Delete(ctx context.Context, code string) error {
	return r.db.DB.WithContext(ctx).Where("code = ?", code).Delete(&model.PointsRuleConfig{}).Error
}

func (r *PointsRuleConfigImpl) Update(ctx context.Context, pointRuleConfig *model.PointsRuleConfig) error {
	return r.db.DB.WithContext(ctx).Where("code = ?", pointRuleConfig.Code).Updates(pointRuleConfig).Error
}

func (r *PointsRuleConfigImpl) List(ctx context.Context) (int64, []*model.PointsRuleConfigObj, error) {
	var total int64
	db := r.db.DB.WithContext(ctx).Model(&model.PointsRuleConfig{}).
		Select("points_rule_config.*, user.name as updated_by_user_name").
		Joins("LEFT JOIN `user` ON points_rule_config.updated_by_uid = `user`.id")
	total, err := gormx.RawCount(db)
	if err != nil {
		return 0, nil, err
	}
	//models := make([]*model.PointsRuleConfigObj, 0)
	db = db.Order("points_rule_config.rule_type DESC")
	models, err := gormx.RawScan[*model.PointsRuleConfigObj](db)
	if err != nil {
		return 0, nil, err
	}
	return total, models, nil
}

func (r *PointsRuleConfigImpl) Detail(ctx context.Context, code string) (*model.PointsRuleConfigObj, error) {
	//var pointRuleConfig model.PointsRuleConfigObj
	result := r.db.DB.WithContext(ctx).Model(&model.PointsRuleConfig{}).
		Select("points_rule_config.*, user.name as updated_by_user_name").
		Where("code = ?", code).
		Joins("LEFT JOIN `user` ON points_rule_config.updated_by_uid = `user`.id")
	models, err := gormx.RawScanObj[model.PointsRuleConfigObj](result)

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errorcode.Desc(errorcode.PointsCodeNotExistError)
		}
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	return &models, nil
}
