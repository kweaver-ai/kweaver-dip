package request

type PageInfo struct {
	Offset    *int    `json:"offset" form:"offset,default=1" binding:"omitempty,min=1" default:"1"`                                             // 页码，默认1
	Limit     *int    `json:"limit" form:"limit,default=15" binding:"omitempty,min=1,max=100" default:"15"`                                     // 每页大小，默认15
	Direction *string `json:"direction" form:"direction,default=desc" binding:"omitempty,oneof=asc desc" default:"desc"`                        // 排序方向，枚举：asc：正序；desc：倒序。默认倒序
	Sort      *string `json:"sort" form:"sort,default=f_created_at" binding:"omitempty,oneof=f_created_at f_updated_at" default:"f_created_at"` // 排序类型，枚举：f_created_at：按创建时间排序；f_updated_at：按更新时间排序; 默认按创建时间排序
}

type KeywordInfo struct {
	Keyword string `json:"keyword" form:"keyword" binding:"TrimSpace,omitempty,min=1,max=128"` // 关键字查询，字符无限制
}

type PageInfoWithKeyword struct {
	PageInfo
	KeywordInfo
}
