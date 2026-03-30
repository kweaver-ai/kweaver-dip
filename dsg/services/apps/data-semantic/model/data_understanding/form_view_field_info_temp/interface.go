// Package form_view_field_info_temp 库表字段信息临时表Model
package form_view_field_info_temp

import "context"

// FormViewFieldInfoTempModel 库表字段信息临时表Model接口
type FormViewFieldInfoTempModel interface {
	// Insert 插入字段信息临时记录
	Insert(ctx context.Context, data *FormViewFieldInfoTemp) (*FormViewFieldInfoTemp, error)

	// FindByFormViewAndVersion 根据form_view_id和version查询字段列表
	FindByFormViewAndVersion(ctx context.Context, formViewId string, version int) ([]*FormViewFieldInfoTemp, error)

	// FindOneByFormFieldId 根据form_view_field_id查询字段信息
	FindOneByFormFieldId(ctx context.Context, formViewFieldId string) (*FormViewFieldInfoTemp, error)

	// Update 更新字段信息
	Update(ctx context.Context, data *FormViewFieldInfoTemp) error

	// DeleteByFormViewId 逻辑删除指定form_view_id的所有记录
	DeleteByFormViewId(ctx context.Context, formViewId string) error

	// DeleteByFormFieldId 逻辑删除指定form_view_field_id的所有记录
	DeleteByFormFieldId(ctx context.Context, formViewFieldId string) error

	// WithTx 设置事务
	WithTx(tx interface{}) FormViewFieldInfoTempModel
}
