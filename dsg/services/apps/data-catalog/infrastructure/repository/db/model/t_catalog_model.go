package model

import "github.com/kweaver-ai/dsg/services/apps/data-catalog/common/util"

type ComprehensionCatalogListItem struct {
	TDataCatalog
	OrgPaths                []string   `json:"-"` //编目的部门路径数组
	ComprehensionUpdateTime *util.Time `gorm:"column:comprehension_update_time" json:"comprehension_update_time"`
	ComprehensionStatus     int8       `gorm:"column:comprehension_status" json:"comprehension_status"`
}
