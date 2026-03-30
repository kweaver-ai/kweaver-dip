package classification_rule

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-view/domain/classification_rule"
	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
	"gorm.io/gorm"
)

// ClassificationRuleRepo 是分类规则表的仓储接口
// 提供对分类规则数据的数据库操作
type ClassificationRuleRepo interface {
	// Db 返回数据库操作对象
	Db() *gorm.DB

	// GetById 根据主键获取分类规则记录
	GetById(ctx context.Context, id string, tx ...*gorm.DB) (*model.ClassificationRule, error)

	// GetByIds 根据主键列表获取分类规则记录
	GetByIds(ctx context.Context, ids []string, tx ...*gorm.DB) ([]*model.ClassificationRule, error)

	// Create 创建新的分类规则记录
	Create(ctx context.Context, rule *model.ClassificationRule) (string, error)

	// Update 更新分类规则记录
	Update(ctx context.Context, rule *model.ClassificationRule) error

	// UpdateStatus 更新分类规则状态
	UpdateStatus(ctx context.Context, id string, status int32) error

	// Delete 删除分类规则记录
	Delete(ctx context.Context, id string) error

	// PageList 分页获取分类规则记录
	PageList(ctx context.Context, req *classification_rule.PageListClassificationRuleReq) (total int64, rules []*model.ClassificationRule, err error)
}
