package dto

type PageInfo struct {
	Offset    int    `json:"offset" form:"offset,default=1" binding:"number,min=1" default:"1"`                                            // 页码 默认 1
	Limit     int    `json:"limit" form:"limit,default=10" binding:"number,min=1,max=100" default:"10"`                                    // 每页大小 默认 10
	Sort      string `json:"sort" form:"sort,default=create_time" binding:"omitempty,oneof=create_time update_time" default:"create_time"` // 排序类型 create_time 创建时间 update_time 更新时间, 默认 create_time
	Direction string `json:"direction" form:"direction,default=desc" binding:"omitempty,oneof=asc desc" default:"desc"`                    // 排序方向 asc 正序 desc 倒序, 默认 desc
}

type PageResult[T any] struct {
	TotalCount int64 `json:"total_count" binding:"required,ge=0"` // 总数量
	Entries    []*T  `json:"entries" binding:"omitempty"`         // 对象列表
}

type ArrayResult[T any] struct {
	Entries []*T `json:"entries" binding:"omitempty"` // 对象列表
}
