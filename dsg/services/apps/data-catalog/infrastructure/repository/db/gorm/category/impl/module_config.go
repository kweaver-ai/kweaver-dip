package impl

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db"
	repoiface "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/category"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"gorm.io/gorm"
)

type moduleRepo struct {
	data *db.Data
	DB   *gorm.DB
}

func NewModuleRepo(data *db.Data) repoiface.ModuleConfigRepo {
	return &moduleRepo{data: data, DB: data.DB}
}

func (r *moduleRepo) GetByCategory(ctx context.Context, categoryID string) ([]*model.CategoryModuleConfig, error) {
	var list []*model.CategoryModuleConfig
	if err := r.DB.WithContext(ctx).
		Where("category_id = ?", categoryID).
		Find(&list).Error; err != nil {
		return nil, err
	}
	return list, nil
}

func (r *moduleRepo) UpsertAll(ctx context.Context, categoryID string, items []*model.CategoryModuleConfig) error {
	return r.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("category_id = ?", categoryID).Delete(&model.CategoryModuleConfig{}).Error; err != nil {
			return err
		}
		if len(items) == 0 {
			return nil
		}
		return tx.Create(&items).Error
	})
}

func (r *moduleRepo) UpdateFields(ctx context.Context, m *model.CategoryModuleConfig, fields []string) error {
	return r.DB.WithContext(ctx).
		Model(&model.CategoryModuleConfig{}).
		Where("category_id = ? AND module_code = ?", m.CategoryID, m.ModuleCode).
		Updates(map[string]any{
			fields[0]:      getFieldValue(fields[0], m),
			fields[1]:      getFieldValue(fields[1], m),
			"updater_uid":  m.UpdaterUID,
			"updater_name": m.UpdaterName,
		}).Error
}

func getFieldValue(field string, m *model.CategoryModuleConfig) any {
	if field == "selected" {
		return m.Selected
	}
	return m.Required
}
