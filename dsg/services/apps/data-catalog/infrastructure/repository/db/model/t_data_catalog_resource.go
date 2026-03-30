package model

type TDataCatalogResourceWithName struct {
	TDataResource
	CatalogName string `gorm:"column:catalog_name"  json:"catalog_name"`
}
