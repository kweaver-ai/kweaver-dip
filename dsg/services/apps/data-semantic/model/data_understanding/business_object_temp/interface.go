// Package business_object_temp 业务对象临时表Model
package business_object_temp

import "context"

// BusinessObjectTempModel 业务对象临时表Model接口
type BusinessObjectTempModel interface {
	// Insert 插入业务对象记录
	Insert(ctx context.Context, data *BusinessObjectTemp) (*BusinessObjectTemp, error)

	// FindOneByFormViewAndVersion 根据form_view_id和version查询业务对象列表
	FindByFormViewAndVersion(ctx context.Context, formViewId string, version int) ([]*BusinessObjectTemp, error)

	// FindOneById 根据id查询业务对象
	FindOneById(ctx context.Context, id string) (*BusinessObjectTemp, error)

	// FindLatestVersion 查询指定form_view_id的最新版本号
	FindLatestVersion(ctx context.Context, formViewId string) (int, error)

	// Update 更新业务对象名称
	Update(ctx context.Context, data *BusinessObjectTemp) error

	// UpdateInUse 更新 in_use 状态：将新版本设置为 1，历史版本设置为 0
	UpdateInUse(ctx context.Context, formViewId string, newVersion int) error

	// DeleteByFormViewId 根据form_view_id删除所有业务对象
	DeleteByFormViewId(ctx context.Context, formViewId string) error

	// DeleteByFormViewIdAndInUse 根据 form_view_id 和 in_use 删除（删除当前使用的识别结果）
	DeleteByFormViewIdAndInUse(ctx context.Context, formViewId string, inUse int8) error

	// DeleteById 根据id删除业务对象
	DeleteById(ctx context.Context, id string) error

	// WithTx 设置事务
	WithTx(tx interface{}) BusinessObjectTempModel
}
