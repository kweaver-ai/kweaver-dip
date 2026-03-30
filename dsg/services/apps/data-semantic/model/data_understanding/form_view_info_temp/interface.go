// Package form_view_info_temp 库表信息临时表Model
package form_view_info_temp

import "context"

// FormViewInfoTempModel 库表信息临时表Model接口
type FormViewInfoTempModel interface {
	// Insert 插入库表信息临时记录
	Insert(ctx context.Context, data *FormViewInfoTemp) (*FormViewInfoTemp, error)

	// FindOneByFormViewAndVersion 根据form_view_id和version查询记录
	FindOneByFormViewAndVersion(ctx context.Context, formViewId string, version int) (*FormViewInfoTemp, error)

	// FindLatestByFormViewId 查询指定form_view_id的最新版本记录
	FindLatestByFormViewId(ctx context.Context, formViewId string) (*FormViewInfoTemp, error)

	// Update 更新库表信息
	Update(ctx context.Context, data *FormViewInfoTemp) error

	// DeleteByFormViewId 逻辑删除指定form_view_id的所有记录
	DeleteByFormViewId(ctx context.Context, formViewId string) error

	// WithTx 设置事务
	WithTx(tx interface{}) FormViewInfoTempModel
}
