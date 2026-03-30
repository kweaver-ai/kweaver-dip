// Package form_view_field 字段Model
package form_view_field

import "context"

// FormViewFieldModel 字段Model接口
type FormViewFieldModel interface {
	// FindByFormViewId 根据form_view_id查询字段列表
	FindByFormViewId(ctx context.Context, formViewId string) ([]*FormViewFieldBase, error)

	// FindFullByFormViewId 根据form_view_id查询字段完整信息 (包含语义信息)
	FindFullByFormViewId(ctx context.Context, formViewId string) ([]*FormViewField, error)

	// UpdateBusinessInfo 更新字段业务名称、角色和描述
	UpdateBusinessInfo(ctx context.Context, id string, businessName *string, fieldRole *int8, fieldDescription *string) error

	// WithTx 设置事务
	WithTx(tx interface{}) FormViewFieldModel
}
