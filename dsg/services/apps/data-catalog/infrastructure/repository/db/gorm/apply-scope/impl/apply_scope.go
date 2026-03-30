package impl

import (
	"context"
	"errors"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db"
	apply_scope "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/apply-scope"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"gorm.io/gorm"
)

type RepoImpl struct {
	data *db.Data
}

func NewRepoImpl(data *db.Data) apply_scope.Repo {
	return &RepoImpl{data: data}
}

func (r *RepoImpl) Get(ctx context.Context, applyScopeID uint64) (*model.ApplyScope, error) {
	var scope model.ApplyScope
	err := r.data.DB.WithContext(ctx).Where("apply_scope_id = ? AND deleted_at = 0", applyScopeID).First(&scope).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &scope, nil
}

func (r *RepoImpl) GetByUUID(ctx context.Context, id string) (*model.ApplyScope, error) {
	var scope model.ApplyScope
	err := r.data.DB.WithContext(ctx).Where("id = ? AND deleted_at = 0", id).First(&scope).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &scope, nil
}

func (r *RepoImpl) List(ctx context.Context) ([]*model.ApplyScope, error) {
	var scopes []*model.ApplyScope
	err := r.data.DB.WithContext(ctx).Where("deleted_at = 0").Find(&scopes).Error
	return scopes, err
}

func (r *RepoImpl) ListByUUIDs(ctx context.Context, applyScopeUUIDs []string) ([]*model.ApplyScope, error) {
	var scopes []*model.ApplyScope
	err := r.data.DB.WithContext(ctx).Where("id IN ? AND deleted_at = 0", applyScopeUUIDs).Find(&scopes).Error
	return scopes, err
}
