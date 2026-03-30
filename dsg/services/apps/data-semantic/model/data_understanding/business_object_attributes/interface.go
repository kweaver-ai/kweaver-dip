// Package business_object_attributes 业务对象属性正式表Model
package business_object_attributes

import "context"

// BusinessObjectAttributesModel 业务对象属性正式表Model接口
type BusinessObjectAttributesModel interface {
	// Insert 插入业务对象属性记录
	Insert(ctx context.Context, data *BusinessObjectAttributes) (*BusinessObjectAttributes, error)

	// FindByBusinessObjectId 根据business_object_id查询属性列表
	FindByBusinessObjectId(ctx context.Context, businessObjectId string) ([]*BusinessObjectAttributes, error)

	// FindByBusinessObjectIdWithFieldInfo 根据business_object_id查询属性列表（包含字段信息）
	FindByBusinessObjectIdWithFieldInfo(ctx context.Context, businessObjectId string) ([]*FieldWithAttrInfo, error)

	// FindByFormViewId 根据form_view_id查询所有属性
	FindByFormViewId(ctx context.Context, formViewId string) ([]*BusinessObjectAttributes, error)

	// FindOneById 根据id查询属性
	FindOneById(ctx context.Context, id string) (*BusinessObjectAttributes, error)

	// UpdateBusinessObjectId 更新属性归属的业务对象
	UpdateBusinessObjectId(ctx context.Context, attributeId, businessObjectId string) error

	// Update 更新属性
	Update(ctx context.Context, data *BusinessObjectAttributes) error

	// Delete 逻辑删除属性
	Delete(ctx context.Context, id string) error

	// DeleteByFormViewId 根据form_view_id删除所有属性
	DeleteByFormViewId(ctx context.Context, formViewId string) error

	// DeleteByFormViewAndField 根据form_view_id和form_view_field_id删除属性（保证一个字段只能绑定一个属性）
	DeleteByFormViewAndField(ctx context.Context, formViewId string, formViewFieldId string) error

	// FindUnrecognizedFields 查询未识别字段（business_object_id 和 attr_name 都为空的记录）
	FindUnrecognizedFields(ctx context.Context, formViewId string) ([]*UnrecognizedFieldInfo, error)

	// BatchInsert 批量插入属性
	BatchInsert(ctx context.Context, data []*BusinessObjectAttributes) (int, error)

	// BatchUpdate 批量更新属性
	BatchUpdate(ctx context.Context, data []*BusinessObjectAttributes) error

	// BatchInsertFromTemp 从临时表批量插入属性
	BatchInsertFromTemp(ctx context.Context, formViewId string, version int) (int, error)

	// WithTx 设置事务
	WithTx(tx interface{}) BusinessObjectAttributesModel
}
