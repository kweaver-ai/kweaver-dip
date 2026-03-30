package model

type FormViewSubjectField struct {
	FormViewField
	Schema            string `gorm:"column:schema" json:"schema"`                           // 数据库模式
	CatalogName       string `gorm:"column:catalog_name" json:"catalog_name"`               // 数据源catalog名称
	DataViewSource    string `gorm:"column:data_view_source" json:"data_view_source"`       // 数据视图源
	FormViewType      int32  `gorm:"column:form_view_type" json:"form_view_type"`           //视图类型
	ViewTechnicalName string `gorm:"column:view_technical_name" json:"view_technical_name"` // 视图列技术名称
	ViewBusinessName  string `gorm:"column:view_business_name" json:"view_business_name"`   // 视图列业务名称
}

// FormViewFieldGroup 按主题ID分组的字段统计信息
type FormViewFieldGroup struct {
	SubjectID string `json:"subject_id"` // 主题ID
	Count     int64  `json:"count"`      // 字段数量
}
