// Package form_view_field 字段Model
package form_view_field

// FormViewField 字段结构 (完整)
type FormViewField struct {
	Id               string `db:"id"`
	FormViewId       string `db:"form_view_id"`
	FieldTechName    string `db:"technical_name"`
	FieldType        string `db:"data_type"`
	FieldBusinessName *string `db:"business_name"`
	FieldRole        *int8  `db:"field_role"`
	FieldDescription *string `db:"field_description"`
	FieldComment     *string `db:"comment"`
}
