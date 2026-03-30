package model

import (
	"github.com/kweaver-ai/idrm-go-frame/core/utils"
	"gorm.io/gorm"
)

const TableNameCategoryApplyScopeRelation = "t_category_apply_scope_relation"

// CategoryApplyScopeRelation mapped from table <category_apply_scope_relation>
type CategoryApplyScopeRelation struct {
	ID           uint64 `gorm:"column:id;primaryKey" json:"id"`                       // 唯一id，雪花算法
	CategoryID   string `gorm:"column:category_id;not null" json:"category_id"`       // 类目uuid
	ApplyScopeID string `gorm:"column:apply_scope_id;not null" json:"apply_scope_id"` // 应用范围uuid
	Required     int    `gorm:"column:required;not null" json:"required"`             // 是否必填，0否 1是
	DeletedAt    int64  `gorm:"column:deleted_at;default:0" json:"deleted_at"`        // 逻辑删除时间戳
}

func (m *CategoryApplyScopeRelation) BeforeCreate(_ *gorm.DB) error {
	var err error
	if m == nil {
		return nil
	}

	if m.ID == 0 {
		m.ID, err = utils.GetUniqueID()
	}

	return err
}

// TableName CategoryApplyScopeRelation's table name
func (*CategoryApplyScopeRelation) TableName() string {
	return TableNameCategoryApplyScopeRelation
}
