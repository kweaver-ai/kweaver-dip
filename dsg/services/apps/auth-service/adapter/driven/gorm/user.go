package gorm

import (
	"context"

	"gorm.io/gorm"

	"github.com/kweaver-ai/dsg/services/apps/auth-service/infrastructure/repository/db/model"
)

// User Repository
type UserRepo interface {
	// 返回指定 User
	Get(ctx context.Context, id string) (*model.User, error)
}

type userRepo struct {
	db *gorm.DB
}

// NewUserRepo returns an implementation of UserRepo
func NewUserRepo(db *gorm.DB) UserRepo { return &userRepo{db} }

// Get implements UserRepo.
func (r *userRepo) Get(ctx context.Context, id string) (*model.User, error) {
	user := &model.User{ID: id}
	tx := r.db.WithContext(ctx).Take(user)
	if tx.Error != nil {
		return nil, newPublicDatabaseError(tx)
	}
	return user, nil
}

var _ UserRepo = &userRepo{}
