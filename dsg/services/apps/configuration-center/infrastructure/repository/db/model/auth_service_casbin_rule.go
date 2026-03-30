package model

const TableNameAuthServiceCasbinRule = "auth_service_casbin_rule"

// AutServiceCasbinRule mapped from table <auth_service_casbin_rule>
type AutServiceCasbinRule struct {
	ID    int    `gorm:"primaryKey;column:id" json:"id,omitempty"`
	PType string `gorm:"column:ptype" json:"ptype,omitempty"`
	V0    string `gorm:"column:v0" json:"v0,omitempty"`
	V1    string `gorm:"column:v1" json:"v1,omitempty"`
	V2    string `gorm:"column:v2" json:"v2,omitempty"`
	V3    string `gorm:"column:v3" json:"v3,omitempty"`
	V4    string `gorm:"column:v4" json:"v4,omitempty"`
	V5    string `gorm:"column:v5" json:"v5,omitempty"`
}

func (AutServiceCasbinRule) TableName() string {
	return TableNameAuthServiceCasbinRule
}
