package dto

type PageInfo struct {
	Offset    int    `json:"offset" form:"offset,default=1" binding:"number,min=1" default:"1"`                                           // 页码
	Limit     int    `json:"limit" form:"limit,default=10" binding:"number,min=1,max=100" default:"10"`                                   // 每页大小
	Sort      string `json:"sort" form:"sort,default=create_time" binding:"omitempty,oneof=create_time update_time" default:"created_at"` // 排序类型
	Direction string `json:"direction" form:"direction,default=desc" binding:"omitempty,oneof=asc desc" default:"desc"`                   // 排序方向
}

type PageResult struct {
	TotalCount int64       `json:"total_count" binding:"required,ge=0"` // 总数量
	Entries    interface{} `json:"entries" binding:"omitempty"`         // 对象列表
}
