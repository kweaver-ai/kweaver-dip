package model

const TableNameWorkOrderFormViewField = "work_order_form_view_fields"

// WorkOrderFormViewField mapped from table <work_order_form_view_fields>
type WorkOrderFormViewField struct {
	// 工单 ID
	WorkOrderID string `json:"work_order_id,omitempty"`
	// 逻辑视图 ID
	FormViewID string `json:"form_view_id,omitempty"`
	// 逻辑视图字段 ID
	FormViewFieldID string `json:"form_view_field_id,omitempty"`
	// 是否需要标准化。因为 false 代表不需要标准化，而 gorm.DB.Updates 忽略零值，所以使用指针。
	StandardRequired *bool `json:"standard_required,omitempty"`
	// 标准化后，字段所关联的数据元 ID，零值代表未标准化。
	DataElementID int `json:"data_element_id,omitempty"`
}

func (*WorkOrderFormViewField) TableName() string { return TableNameWorkOrderFormViewField }
