package request

type PageInfo struct {
	PageBaseInfo
	Direction *string `json:"direction" form:"direction,default=desc" binding:"oneof=asc desc" default:"desc" example:"desc"`                      // 排序方向，枚举：asc：正序；desc：倒序。默认倒序
	Sort      *string `json:"sort" form:"sort,default=created_at" binding:"oneof=created_at updated_at" default:"created_at" example:"created_at"` // 排序类型，枚举：created_at：按创建时间排序；updated_at：按更新时间排序。默认按创建时间排序
}

func (p *PageBaseInfo) DBOffset() int {
	return (*p.Offset - 1) * *p.Limit
}

func (p *PageBaseInfo) DBOLimit() int {
	return *p.Limit
}

type PageBaseInfo struct {
	Offset *int `json:"offset" form:"offset,default=1" binding:"min=1" default:"1" example:"1"`          // 页码，默认1
	Limit  *int `json:"limit" form:"limit,default=10" binding:"min=0,max=2000" default:"10" example:"2"` // 每页大小，默认10 limit=0不分页
}

type GetConfigReq struct {
	Name string `json:"name" form:"name"`
}

type PageInfoWithKeyword struct {
	PageInfo
	KeywordInfo
}

type KeywordInfo struct {
	Keyword string `json:"keyword" form:"keyword" binding:"trimSpace,omitempty,min=1,max=255" example:"keyword"` // 关键字查询
}

type IDReq struct {
	ID string `json:"id" uri:"id" form:"id" binding:"required,uuid"`
}
