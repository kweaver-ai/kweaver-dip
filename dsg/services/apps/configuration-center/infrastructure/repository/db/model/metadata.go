package model

import "time"

type Metadata struct {
	// ID
	ID string `json:"id,omitempty"`
	// 创建时间
	CreatedAt time.Time `json:"created_at,omitempty"`
	// 更新时间
	UpdatedAt time.Time `json:"updated_at,omitempty"`
	// 删除时间，用于优雅删除
	DeletedAt *time.Time `json:"deleted_at,omitempty"`
}

type MetadataWithOperator struct {
	Metadata
	// 创建者的 ID
	CreatedBy string `json:"created_by,omitempty"`
	// 更新者的 ID
	UpdatedBy string `json:"updated_by,omitempty"`
	// 删除者的 ID
	DeletedBy *string `json:"deleted_by,omitempty"`
}
