package gorm

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-application-service/infrastructure/repository/db/model"
	"gorm.io/gorm"
)

// ServiceCategoryRelationRepo 定义了操作 ServiceCategoryRelation 的接口
type ServiceCategoryRelationRepo interface {
	Create(ctx context.Context, relation *model.ServiceCategoryRelation) error
	BatchCreate(ctx context.Context, relations []*model.ServiceCategoryRelation) error
	Delete(ctx context.Context, serviceID string) error
	BatchDelete(ctx context.Context, IDs []int64) error
	GetByServiceID(ctx context.Context, serviceID string) ([]*model.ServiceCategoryRelation, error)
	GetOneByCategoryNodeID(ctx context.Context, categoryNodeID string) (*model.ServiceCategoryRelation, error)
	GetByCategoryNodeIDs(ctx context.Context, categoryNodeIDs []string) ([]*model.ServiceCategoryRelation, error)
	GetByCategoryIDAndEmptyNodeID(ctx context.Context, categoryID string) ([]*model.ServiceCategoryRelation, error)
}

type serviceCategoryRelationRepo struct {
	db *gorm.DB
}

// NewServiceCategoryRelationRepo 创建 ServiceCategoryRelationRepo 实例
func NewServiceCategoryRelationRepo(db *gorm.DB) ServiceCategoryRelationRepo {
	return &serviceCategoryRelationRepo{db: db}
}

// Create 插入一条 ServiceCategoryRelation 记录
func (repo *serviceCategoryRelationRepo) Create(ctx context.Context, relation *model.ServiceCategoryRelation) error {
	return repo.db.WithContext(ctx).Create(relation).Error
}

// BatchCreate 批量插入 ServiceCategoryRelation 记录
func (repo *serviceCategoryRelationRepo) BatchCreate(ctx context.Context, relations []*model.ServiceCategoryRelation) error {
	return repo.db.WithContext(ctx).Create(relations).Error
}

// Delete 删除一条 ServiceCategoryRelation 记录
func (repo *serviceCategoryRelationRepo) Delete(ctx context.Context, serviceID string) error {
	return repo.db.WithContext(ctx).Where("service_id = ?", serviceID).Update("deleted_at", gorm.Expr("NOW()")).Error
}

// BatchDelete 批量删除 ServiceCategoryRelation 记录
func (repo *serviceCategoryRelationRepo) BatchDelete(ctx context.Context, IDs []int64) error {
	return repo.db.WithContext(ctx).Model(&model.ServiceCategoryRelation{}).Where("id IN (?)", IDs).Update("deleted_at", gorm.Expr("NOW()")).Error
}

// GetByServiceID 根据 serviceID 获取 ServiceCategoryRelation 记录
func (repo *serviceCategoryRelationRepo) GetByServiceID(ctx context.Context, serviceID string) ([]*model.ServiceCategoryRelation, error) {
	var relations []*model.ServiceCategoryRelation
	err := repo.db.WithContext(ctx).Where("deleted_at = 0").Where("service_id = ?", serviceID).Find(&relations).Error
	return relations, err
}

// GetOneByCategoryNodeID 根据 categoryNodeID 获取 ServiceCategoryRelation 记录
func (repo *serviceCategoryRelationRepo) GetOneByCategoryNodeID(ctx context.Context, categoryNodeID string) (*model.ServiceCategoryRelation, error) {
	var relation model.ServiceCategoryRelation
	err := repo.db.WithContext(ctx).Where("deleted_at = 0").Where("category_node_id = ?", categoryNodeID).First(&relation).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &relation, nil
}

// GetByCategoryNodeIDs 根据 categoryNodeIDs 获取 ServiceCategoryRelation 记录
func (repo *serviceCategoryRelationRepo) GetByCategoryNodeIDs(ctx context.Context, categoryNodeIDs []string) ([]*model.ServiceCategoryRelation, error) {
	var relations []*model.ServiceCategoryRelation
	err := repo.db.WithContext(ctx).Where("deleted_at = 0").Where("category_node_id IN (?)", categoryNodeIDs).Find(&relations).Error
	return relations, err
}

// GetByCategoryIDAndEmptyNodeID 根据 categoryID 获取 ServiceCategoryRelation 记录
func (repo *serviceCategoryRelationRepo) GetByCategoryIDAndEmptyNodeID(ctx context.Context, categoryID string) ([]*model.ServiceCategoryRelation, error) {
	var relations []*model.ServiceCategoryRelation
	err := repo.db.WithContext(ctx).Where("deleted_at = 0").Where("category_id = ?", categoryID).Where("category_node_id = '' or category_node_id IS NULL").Find(&relations).Error
	return relations, err
}
