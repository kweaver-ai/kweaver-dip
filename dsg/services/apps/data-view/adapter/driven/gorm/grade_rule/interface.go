package grade_rule

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-view/domain/grade_rule"
	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
	"gorm.io/gorm"
)

// GradeRuleRepo 是分级规则表的仓储接口
// 提供对分级规则数据的数据库操作
type GradeRuleRepo interface {
	// Db 返回数据库操作对象
	Db() *gorm.DB

	// GetById 根据主键获取分级规则记录
	GetById(ctx context.Context, id string, tx ...*gorm.DB) (*model.GradeRule, error)

	// GetByIds 根据主键列表获取分级规则记录
	GetByIds(ctx context.Context, ids []string, tx ...*gorm.DB) ([]*model.GradeRule, error)

	// GetByGroupIds 根据规则组查询分级规则记录
	GetByGroupIds(ctx context.Context, businessObjID string, groupIds []string, tx ...*gorm.DB) ([]*model.GradeRule, error)

	// Create 创建新的分级规则记录
	Create(ctx context.Context, rule *model.GradeRule) (string, error)

	// Update 更新分级规则记录
	Update(ctx context.Context, rule *model.GradeRule) error

	// UpdateStatus 更新分级规则状态
	UpdateStatus(ctx context.Context, id string, status int32) error

	// Delete 删除分级规则记录
	Delete(ctx context.Context, id string) error

	// PageList 分页获取分级规则记录
	PageList(ctx context.Context, req *grade_rule.PageListGradeRuleReq) (total int64, rules []*model.GradeRule, err error)

	// GetBySubjectId 根据主题ID获取分级规则记录
	GetBySubjectId(ctx context.Context, subjectId string) ([]*model.GradeRule, error)

	// GetBySubjectIds 根据主题ID数组获取分级规则记录
	GetBySubjectIds(ctx context.Context, subjectIds []string) ([]*model.GradeRule, error)

	// GetByLabelId 根据标签ID获取分级规则记录
	GetByLabelId(ctx context.Context, labelId string) ([]*model.GradeRule, error)

	// GetWorkingRules 获取所有启用的分级规则
	GetWorkingRules(ctx context.Context) ([]*model.GradeRule, error)

	// GetCount 获取分级规则数量
	GetCount(ctx context.Context) (int64, error)

	// BindGroup 绑定规则组
	BindGroup(ctx context.Context, ruleIds []string, groupId string) error

	// BatchDelete 批量删除规则
	BatchDelete(ctx context.Context, ids []string) error
}
