package impl

import (
	"context"
	"errors"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db"
	relation "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/category_apply_scope_relation"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"gorm.io/gorm"
)

type RepoImpl struct {
	data *db.Data
}

func NewRepoImpl(data *db.Data) relation.Repo {
	return &RepoImpl{data: data}
}

func (r *RepoImpl) Insert(ctx context.Context, rel *model.CategoryApplyScopeRelation) error {
	return r.data.DB.WithContext(ctx).Create(rel).Error
}

func (r *RepoImpl) Get(ctx context.Context, id uint64) (*model.CategoryApplyScopeRelation, error) {
	var rel model.CategoryApplyScopeRelation
	err := r.data.DB.WithContext(ctx).Where("id = ? AND deleted_at = 0", id).First(&rel).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &rel, nil
}

func (r *RepoImpl) GetByCategoryAndScope(ctx context.Context, categoryID, applyScopeID string) (*model.CategoryApplyScopeRelation, error) {
	var rel model.CategoryApplyScopeRelation
	err := r.data.DB.WithContext(ctx).Where("category_id = ? AND apply_scope_id = ? AND deleted_at = 0", categoryID, applyScopeID).First(&rel).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &rel, nil
}

func (r *RepoImpl) List(ctx context.Context) ([]*model.CategoryApplyScopeRelation, error) {
	var rels []*model.CategoryApplyScopeRelation
	err := r.data.DB.WithContext(ctx).Where("deleted_at = 0").Find(&rels).Error
	return rels, err
}

func (r *RepoImpl) ListByCategory(ctx context.Context, categoryID string) ([]*model.CategoryApplyScopeRelation, error) {
	var rels []*model.CategoryApplyScopeRelation
	err := r.data.DB.WithContext(ctx).Where("category_id = ? AND deleted_at = 0", categoryID).Find(&rels).Error
	return rels, err
}

func (r *RepoImpl) BatchInsert(ctx context.Context, relations []*model.CategoryApplyScopeRelation) error {
	return r.data.DB.WithContext(ctx).Create(relations).Error
}

func (r *RepoImpl) BatchDelete(ctx context.Context, relations []*model.CategoryApplyScopeRelation) error {
	return r.data.DB.WithContext(ctx).Delete(relations).Error
}

func (r *RepoImpl) DeleteByCategory(ctx context.Context, categoryID string) error {
	return r.data.DB.WithContext(ctx).Where("category_id = ?", categoryID).Delete(&model.CategoryApplyScopeRelation{}).Error
}

func (r *RepoImpl) Upsert(ctx context.Context, rel *model.CategoryApplyScopeRelation) error {
	return r.data.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var exist model.CategoryApplyScopeRelation
		err := tx.Where("category_id = ? AND apply_scope_id = ?", rel.CategoryID, rel.ApplyScopeID).First(&exist).Error
		if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
			return err
		}
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return tx.Create(rel).Error
		}
		return tx.Model(&model.CategoryApplyScopeRelation{}).
			Where("category_id = ? AND apply_scope_id = ?", rel.CategoryID, rel.ApplyScopeID).
			Updates(map[string]any{"required": rel.Required}).Error
	})
}
