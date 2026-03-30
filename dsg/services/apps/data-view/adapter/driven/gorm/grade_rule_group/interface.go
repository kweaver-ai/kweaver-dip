package grade_rule_group

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
	"gorm.io/gorm"
)

// GradeRuleGroupRepo 是分级规则组表的仓储接口
// 提供对分级规则组数据的数据库操作
type GradeRuleGroupRepo interface {
	// Db 返回数据库操作对象
	Db() *gorm.DB

	// List 获取规则组数据
	List(ctx context.Context, businessObjId string) ([]*model.GradeRuleGroup, error)

	// Create 新增规则组
	Create(ctx context.Context, group *model.GradeRuleGroup) (string, error)

	// Update 更新规则组
	Update(ctx context.Context, group *model.GradeRuleGroup) error

	// Delete 删除规则组
	Delete(ctx context.Context, id string) error

	// Repeat 规则组验重
	Repeat(ctx context.Context, businessObjID string, id string, name string) (bool, error)

	// Details 查看详情
	Details(ctx context.Context, ids []string) ([]*model.GradeRuleGroup, error)

	// Limited 规则组数量上限检查
	Limited(ctx context.Context, businessObjID string, max int64) (bool, error)
}
