package classification_rule_algorithm_relation

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
	"gorm.io/gorm"
)

// ClassificationRuleAlgorithmRelationRepo 是分类规则算法关系表的仓储接口
// 提供对分类规则算法关系数据的数据库操作
type ClassificationRuleAlgorithmRelationRepo interface {
	// Db 返回数据库操作对象
	Db() *gorm.DB

	// GetById 根据主键获取分类规则算法关系记录
	GetById(ctx context.Context, id string, tx ...*gorm.DB) (*model.ClassificationRuleAlgorithmRelation, error)

	// Create 创建新的分类规则算法关系记录
	Create(ctx context.Context, relation *model.ClassificationRuleAlgorithmRelation) (string, error)
	// Update 更新分类规则算法关系记录
	Update(ctx context.Context, relation *model.ClassificationRuleAlgorithmRelation) error

	// Delete 删除分类规则算法关系记录
	Delete(ctx context.Context, id string) error
	// GetByRuleId 根据规则ID获取算法关系列表
	GetByRuleId(ctx context.Context, ruleId string) ([]*model.ClassificationRuleAlgorithmRelation, error)

	// BatchCreate 批量创建分类规则算法关系记录
	BatchCreate(ctx context.Context, relations []*model.ClassificationRuleAlgorithmRelation) error

	// BatchDeleteByRuleId 根据规则ID批量删除算法关系记录
	BatchDeleteByRuleId(ctx context.Context, ruleId string) error
	// BatchDeleteByAlgorithmId 根据算法ID批量删除算法关系记录
	BatchDeleteByAlgorithmId(ctx context.Context, algorithmId string) error
	// BatchDeleteByRuleIds 根据规则ID列表批量删除算法关系记录
	BatchDeleteByRuleIds(ctx context.Context, ruleIds []string) error
	// BatchDeleteByAlgorithmIds 根据算法ID列表批量删除算法关系记录
	BatchDeleteByAlgorithmIds(ctx context.Context, algorithmIds []string) error

	// GetWorkingAlgorithmByAlgorithmIds 获取当前生效的算法
	GetWorkingAlgorithmByAlgorithmIds(ctx context.Context, algorithmIds []string) ([]*model.ClassificationRuleAlgorithmRelation, error)
	// GetWorkingAlgorithmByRuleIds 获取当前生效的算法
	GetWorkingAlgorithmByRuleIds(ctx context.Context, ruleIds []string) ([]*model.ClassificationRuleAlgorithmRelation, error)
}
