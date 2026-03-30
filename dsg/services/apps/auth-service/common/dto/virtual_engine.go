package dto

import "encoding/json"

// VirtualizationEngineViewData 虚拟化引擎返回的视图数据
type VirtualizationEngineViewData struct {
	// 数据
	Data json.RawMessage `json:"data,omitempty"`
	// 列的定义
	Columns []Column `json:"columns,omitempty"`
	// 数据等行数
	TotalCount int `json:"total_count,omitempty"`
}

// Column 代表列的定义
type Column struct {
	// 列的名称
	Name string `json:"name,omitempty"`
	// 列的数据类型
	Type string `json:"type,omitempty"`
}
