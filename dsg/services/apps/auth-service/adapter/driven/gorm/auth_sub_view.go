package gorm

import (
	"context"

	"go.uber.org/zap"
	"gorm.io/gorm"

	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

type ListOptions struct {
	// 非空时，返回属于指定逻辑视图的子视图列表
	LogicViewID string
	// 非空时，返回属于指定逻辑视图的子视图列表
	LogicViewName string
	// 非空时，返回指定 ID 的子视图列表
	IDs []string
}

// TODO: Use SubViewRepo instead
type AuthSubViewRepo interface {
	// 创建子视图
	Create(ctx context.Context, authSubView *model.AuthSubView) error
	// 删除子视图
	Delete(ctx context.Context, id string) error
	// 更新子视图
	Update(ctx context.Context, authSubView *model.AuthSubView) error
	// 获取子视图列表
	List(ctx context.Context, opts ListOptions) ([]model.AuthSubView, error)
}

// authSubViewRepo implements interface AuthSubViewRepo
type authSubViewRepo struct {
	db *gorm.DB
}

// Create implements AuthSubViewRepo.
func (r *authSubViewRepo) Create(ctx context.Context, authSubView *model.AuthSubView) error {
	if err := r.db.WithContext(ctx).Debug().Create(authSubView).Error; err != nil {
		return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return nil
}

// Delete implements AuthSubViewRepo.
func (r *authSubViewRepo) Delete(ctx context.Context, id string) error {
	if err := r.db.WithContext(ctx).Debug().Where(&model.AuthSubView{ID: id}).Delete(&model.AuthSubView{}).Error; err != nil {
		return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return nil
}

// Update implements AuthSubViewRepo.
func (r *authSubViewRepo) Update(ctx context.Context, authSubView *model.AuthSubView) error {
	// 因为 gorm.DB.Updates 不更新 struct 中零值的字段，所谓使用 map[string]any 替代 struct。
	var data = map[string]any{
		"name":              authSubView.Name,
		"logic_view_id":     authSubView.LogicViewID,
		"logic_view_name":   authSubView.LogicViewName,
		"columns":           authSubView.Columns,
		"row_filter_clause": authSubView.RowFilterClause,
	}
	if err := r.db.WithContext(ctx).Debug().Model(&model.AuthSubView{}).Where(&model.AuthSubView{ID: authSubView.ID}).Updates(data).Error; err != nil {
		log.WithContext(ctx).Error("Update AuthSubView fail", zap.Error(err), zap.String("id", authSubView.ID), zap.Any("data", data))
		return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return nil
}

// List implements AuthSubViewRepo.
func (a *authSubViewRepo) List(ctx context.Context, opts ListOptions) ([]model.AuthSubView, error) {
	tx := a.db.WithContext(ctx).Debug()

	if opts.LogicViewID != "" {
		tx = tx.Where(&model.AuthSubView{LogicViewID: opts.LogicViewID})
	}

	if opts.LogicViewName != "" {
		tx = tx.Where(&model.AuthSubView{LogicViewName: opts.LogicViewName})
	}

	if opts.IDs != nil {
		tx = tx.Where("id in ?", opts.IDs)
	}

	var authSubViews []model.AuthSubView
	if err := tx.Find(&authSubViews).Error; err != nil {
		return nil, err
	}

	return authSubViews, nil
}

func NewAuthSubViewRepo(db *gorm.DB) AuthSubViewRepo { return &authSubViewRepo{db: db} }
