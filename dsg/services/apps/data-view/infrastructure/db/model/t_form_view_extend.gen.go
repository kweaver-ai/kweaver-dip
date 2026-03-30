package model

const TableNameTFormViewExtend = "t_form_view_extend"

// TFormViewExtend mapped from table <t_form_view_extend>
type TFormViewExtend struct {
	ID        string `gorm:"column:id;primaryKey;type:char(36);not null" json:"id"` // 逻辑视图uuid
	IsAudited bool   `gorm:"column:is_audited;not null" json:"is_audited"`          // 是否已稽核
}

// TableName TFormViewExtend's table name
func (*TFormViewExtend) TableName() string {
	return TableNameTFormViewExtend
}
