package code_generation_rule

// EntryList 定义实体列表
type EntryList[T any] struct {
	// 实体的列表
	Entries []T `json:"entries"`
	// 实体的总数
	TotalCount int `json:"total_count"`
}
