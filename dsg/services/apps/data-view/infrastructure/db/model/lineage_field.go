package model

type LineageFieldInfo struct {
	FormViewField
	TechnicalName    string `gorm:"column:view_technical_name" json:"view_technical_name" ` // 表技术名称
	ViewBusinessName string `gorm:"column:view_business_name" json:"view_business_name"`    // 表业务名称
	ViewDatasourceID string `gorm:"column:datasource_id"  json:"datasource_id"`             // 数据源id
}
