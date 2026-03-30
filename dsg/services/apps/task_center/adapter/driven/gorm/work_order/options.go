package work_order

import "gorm.io/gorm"

type ListOptions struct {
	// 排序选项
	SortOptions
	// 分页选项
	PaginateOptions
	// 范围
	Scopes []func(*gorm.DB) *gorm.DB
}

// 分页选项
type PaginateOptions struct {
	// 页码，从 0 开始
	Offset int `json:"offset,omitempty"`
	// 每页大小
	Limit int `json:"limit,omitempty"`
}

// 字段排序选项
type FieldSortOptions struct {
	// 字段名称
	Name string
	// 是否降序
	Descending bool
}

// 排序选项
type SortOptions struct {
	// 排序的多个字段
	Fields []FieldSortOptions
}
