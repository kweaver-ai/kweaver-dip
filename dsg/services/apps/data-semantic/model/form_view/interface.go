// Package form_view 库表视图Model
package form_view

import "context"

// FormViewModel 库表视图Model接口
type FormViewModel interface {
	// FindOneById 根据id查询库表视图
	FindOneById(ctx context.Context, id string) (*FormView, error)

	// FuzzyMatchByName 根据业务名称或描述模糊匹配视图
	FuzzyMatchByName(ctx context.Context, name string) ([]*FormView, error)

	// UpdateUnderstandStatus 更新理解状态
	UpdateUnderstandStatus(ctx context.Context, id string, status int8) error

	// UpdateBusinessInfo 更新库表业务名称和描述
	UpdateBusinessInfo(ctx context.Context, id string, businessName *string, description *string) error

	// WithTx 设置事务
	WithTx(tx interface{}) FormViewModel
}
