package data_view

// 列表
type List[T any] struct {
	Entries    []T `json:"entries"`
	TotalCount int `json:"total_count"`
}

// 子视图
type SubView struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

// 获取子视图列表的选项
type ListSubViewOptions struct {
	// 非空时，返回属于此逻辑视图的子视图
	LogicViewID string

	// 页码
	Offset int
	// 每页数量
	Limit int
}
