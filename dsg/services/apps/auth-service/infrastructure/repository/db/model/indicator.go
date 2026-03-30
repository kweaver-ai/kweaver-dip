package model

import "gorm.io/plugin/soft_delete"

const TableNameTechnicalIndicator = "t_technical_indicator"

// 指标，包含 deleted_at
type TechnicalIndicator struct {
	// ID
	ID int `json:"id,omitempty"`

	DeletedAt *soft_delete.DeletedAt `gorm:"column:deleted_at;not null;softDelete:milli;default:null" json:"deleted_at,omitempty"`
}

func (TechnicalIndicator) TableName() string { return TableNameTechnicalIndicator }

// 指标，部分字段
type TechnicalIndicatorWithNameAndOwner struct {
	// ID
	ID int `json:"id,omitempty"`
	// 名称
	Name string `json:"name,omitempty"`
	// Owner 的 ID
	OwnerUID string `json:"owner_uid,omitempty"`
	// Owner 的显示名称
	OwnerName string `json:"owner_name,omitempty"`
}

func (TechnicalIndicatorWithNameAndOwner) TableName() string { return TableNameTechnicalIndicator }
