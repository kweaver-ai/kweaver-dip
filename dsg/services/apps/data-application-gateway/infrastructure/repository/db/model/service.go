package model

// ServiceAssociations 接口服务表的多表关联关系
type ServiceAssociations struct {
	Service
	Developer              Developer               `gorm:"foreignKey:developer_id;references:developer_id"`
	File                   File                    `gorm:"foreignKey:file_id;references:file_id"`
	ServiceDataSource      ServiceDataSource       `gorm:"foreignKey:service_id;references:service_id"`
	ServiceScriptModel     ServiceScriptModel      `gorm:"foreignKey:service_id;references:service_id"`
	ServiceParams          []ServiceParam          `gorm:"foreignKey:service_id;references:service_id"`
	ServiceResponseFilters []ServiceResponseFilter `gorm:"foreignKey:service_id;references:service_id"`
	SubServices            []SubService            `gorm:"foreignKey:service_id;references:service_id"`
}
