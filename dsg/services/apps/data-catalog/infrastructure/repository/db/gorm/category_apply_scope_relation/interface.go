package category_apply_scope_relation

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
)

type Repo interface {
	// 插入一条关系记录
	Insert(ctx context.Context, relation *model.CategoryApplyScopeRelation) error
	// 批量插入关系记录
	BatchInsert(ctx context.Context, relations []*model.CategoryApplyScopeRelation) error
	// 根据主键ID查询单条记录
	Get(ctx context.Context, id uint64) (*model.CategoryApplyScopeRelation, error)
	// 根据category_id和apply_scope_id查询单条记录
	GetByCategoryAndScope(ctx context.Context, categoryID, applyScopeID string) (*model.CategoryApplyScopeRelation, error)
	// 查询全部未删除的关系
	List(ctx context.Context) ([]*model.CategoryApplyScopeRelation, error)
	// 根据category_uuid查询全部未删除的关系
	ListByCategory(ctx context.Context, categoryID string) ([]*model.CategoryApplyScopeRelation, error)
	// 批量逻辑删除
	BatchDelete(ctx context.Context, relations []*model.CategoryApplyScopeRelation) error
	// 删除某类目下全部关系
	DeleteByCategory(ctx context.Context, categoryID string) error
	// Upsert（有则更新 required，无则创建）
	Upsert(ctx context.Context, rel *model.CategoryApplyScopeRelation) error
}
