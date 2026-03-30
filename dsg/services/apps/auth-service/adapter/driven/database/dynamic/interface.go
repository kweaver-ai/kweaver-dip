package dynamic

import "context"

// 动态的数据库客户端
type Interface interface {
	// GetByConditionEqual 从表 table 中查询满足条件 condField = condValue 的记录
	GetByConditionEqual(ctx context.Context, table, field string, value any) (map[string]any, error)
}
