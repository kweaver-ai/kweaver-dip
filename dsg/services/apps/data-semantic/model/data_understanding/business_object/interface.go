// Package business_object 业务对象正式表Model
package business_object

import "context"

// BusinessObjectModel 业务对象正式表Model接口
type BusinessObjectModel interface {
	// Insert 插入业务对象记录
	Insert(ctx context.Context, data *BusinessObject) (*BusinessObject, error)

	// FindByFormViewId 根据form_view_id查询业务对象列表
	FindByFormViewId(ctx context.Context, formViewId string) ([]*BusinessObject, error)

	// FindByFormViewIdAndObjectName 根据form_view_id和object_name查询单个业务对象
	FindByFormViewIdAndObjectName(ctx context.Context, formViewId string, objectName string) (*BusinessObject, error)

	// FindOneById 根据id查询业务对象
	FindOneById(ctx context.Context, id string) (*BusinessObject, error)

	// FuzzyMatchByName 根据名称模糊匹配业务对象
	FuzzyMatchByName(ctx context.Context, name string) ([]*BusinessObject, error)

	// Update 更新业务对象
	Update(ctx context.Context, data *BusinessObject) error

	// Delete 逻辑删除业务对象
	Delete(ctx context.Context, id string) error

	// DeleteByFormViewId 根据form_view_id删除所有业务对象
	DeleteByFormViewId(ctx context.Context, formViewId string) error

	// BatchInsertFromTemp 从临时表批量插入业务对象
	BatchInsertFromTemp(ctx context.Context, formViewId string, version int) (int, error)

	// CountByFormViewId 根据form_view_id统计业务对象数量
	CountByFormViewId(ctx context.Context, formViewId string) (int64, error)

	// WithTx 设置事务
	WithTx(tx interface{}) BusinessObjectModel
}
