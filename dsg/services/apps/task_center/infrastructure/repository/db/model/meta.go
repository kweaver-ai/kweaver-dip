package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Metadata struct {
	ID uuid.UUID `json:"id,omitempty" gorm:"column:id"`
	// 创建时间
	CreatedAt time.Time `json:"created_at,omitempty" gorm:"column:created_at"`
	// 更新时间
	UpdatedAt time.Time `json:"updated_at,omitempty" gorm:"column:updated_at"`
	// 删除时间。当用户请求优雅删除时，服务器会设置这个字段，并不是由用户直接设
	// 置。
	DeletedAt gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"column:deleted_at"`
}
