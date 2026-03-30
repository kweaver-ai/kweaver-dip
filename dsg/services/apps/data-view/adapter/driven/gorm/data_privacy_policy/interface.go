package data_privacy_policy

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-view/domain/data_privacy_policy"
	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
	"gorm.io/gorm"
)

// DataPrivacyPolicyRepo 是数据隐私策略表的仓储接口
type DataPrivacyPolicyRepo interface {
	// Db 返回数据库操作对象
	Db() *gorm.DB

	// GetById 根据主键获取数据隐私策略记录
	GetById(ctx context.Context, id string, tx ...*gorm.DB) (*model.DataPrivacyPolicy, error)

	// GetByFormViewId 根据表单视图id获取数据隐私策略记录
	GetByFormViewId(ctx context.Context, formViewId string, tx ...*gorm.DB) (*model.DataPrivacyPolicy, error)

	// Create 创建新的数据隐私策略记录
	Create(ctx context.Context, policy *model.DataPrivacyPolicy) (string, error)

	// Update 更新数据隐私策略记录
	Update(ctx context.Context, policy *model.DataPrivacyPolicy) error

	// Delete 删除数据隐私策略记录
	Delete(ctx context.Context, id string) error

	// PageList 分页获取数据隐私策略记录
	PageList(ctx context.Context, req *data_privacy_policy.PageListDataPrivacyPolicyReq) (total int64, data_privacy_policy []*model.DataPrivacyPolicy, err error)

	// IsExistByFormViewId 根据表单视图id查询是否存在数据隐私策略记录
	IsExistByFormViewId(ctx context.Context, formViewId string) (bool, error)
	// GetFormViewIdsByFormViewIds 根据表单视图ID数组查询隐私策略，并返回存在隐私策略的表单视图ID数组
	GetFormViewIdsByFormViewIds(ctx context.Context, formViewIds []string) ([]string, error)
}
