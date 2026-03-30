package model

import (
	"github.com/google/uuid"
	"github.com/kweaver-ai/idrm-go-frame/core/utils"
	"gorm.io/gorm"
)

const TableNameTApplyScope = "t_apply_scope"

// ApplyScope mapped from table <t_apply_scope>
type ApplyScope struct {
	ID           string `gorm:"column:id;not null" json:"id"`                           // 应用范围uuid
	ApplyScopeID uint64 `gorm:"column:apply_scope_id;primaryKey" json:"apply_scope_id"` // 唯一id，雪花算法
	Name         string `gorm:"column:name" json:"name"`                                // 应用范围名称
	DeletedAt    int64  `gorm:"column:deleted_at;default:0" json:"deleted_at"`          // 逻辑删除时间戳
}

func (m *ApplyScope) BeforeCreate(_ *gorm.DB) error {
	var err error
	if m == nil {
		return nil
	}

	if m.ApplyScopeID == 0 {
		m.ApplyScopeID, err = utils.GetUniqueID()
	}
	if len(m.ID) == 0 {
		m.ID = uuid.NewString()
	}

	return err
}

// TableName TApplyScope's table name
func (*ApplyScope) TableName() string {
	return TableNameTApplyScope
}
