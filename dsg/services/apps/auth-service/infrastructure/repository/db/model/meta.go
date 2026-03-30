package model

import (
	"encoding/json"
	"time"

	"gorm.io/gorm"
)

type Metadata struct {
	ID        string         `json:"id,omitempty"`
	CreatedAt time.Time      `json:"created_at,omitempty"`
	UpdatedAt time.Time      `gorm:"column:updated_at;not null;autoUpdateTime;comment:更新时间" json:"updated_at,omitempty"`
	DeletedAt gorm.DeletedAt `json:"deleted_at,omitempty"`
}

type ListOptions struct {
	Limit  int
	Offset int
}

type List[T any] struct {
	// 对象列表
	Entries []T `json:"entries,omitempty"`
	// 总数量
	TotalCount int64 `json:"total_count,omitempty"`
}

type User2 struct {
	Metadata

	Spec User2Spec `json:"spec,omitempty" gorm:"embedded"`
}

func (User2) TableName() string { return "users" }

type User2Spec struct {
	Name   string          `json:"name,omitempty"`
	Cards  []Card          `json:"cards,omitempty" gorm:"-"`
	Filter json.RawMessage `json:"filter,omitempty"`
}

type Card struct {
	Metadata
}
