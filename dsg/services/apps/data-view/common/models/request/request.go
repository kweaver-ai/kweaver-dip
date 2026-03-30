package request

type PageSortInfo struct {
	Offset    *int   `json:"offset" form:"offset,default=1" binding:"min=1" default:"1"`                                                // 页码，默认1
	Limit     *int   `json:"limit" form:"limit,default=10" binding:"min=1,max=2000"  default:"10"`                                      // 每页大小，默认10
	Direction string `json:"direction" form:"direction,default=desc" binding:"oneof=asc desc" default:"desc"`                           // 排序方向，枚举：asc：正序；desc：倒序。默认倒序
	Sort      string `json:"sort" form:"sort,default=created_at" binding:"oneof=created_at updated_at name type"  default:"created_at"` // 排序类型，枚举：created_at：按创建时间排序；updated_at：按更新时间排序；name：按名称排序。默认按创建时间排序
}
type PageInfo struct {
	Offset *int `json:"offset" form:"offset,default=1" binding:"min=1" default:"1"`           // 页码，默认1
	Limit  *int `json:"limit" form:"limit,default=10" binding:"min=1,max=2000"  default:"10"` // 每页大小，默认10
}
type PageInfo3 struct {
	Offset *int `json:"offset" form:"offset,default=1" binding:"min=1" default:"1"`            // 页码，默认1
	Limit  *int `json:"limit" form:"limit,default=10" binding:"min=0,max=2000"  default:"100"` // 每页大小，默认10
}

type PageInfo2 struct {
	Offset *int `json:"offset" form:"offset,default=1" binding:"min=1" default:"1"`          // 页码，默认1
	Limit  *int `json:"limit" form:"limit,default=10" binding:"min=1,max=100"  default:"20"` // 每页大小，默认10
}

type SortInfo struct {
	Direction string `json:"direction" form:"direction,default=desc" binding:"oneof=asc desc" default:"desc"`                           // 排序方向，枚举：asc：正序；desc：倒序。默认倒序
	Sort      string `json:"sort" form:"sort,default=created_at" binding:"oneof=created_at updated_at name type"  default:"created_at"` // 排序类型，枚举：created_at：按创建时间排序；updated_at：按更新时间排序；name：按名称排序。默认按创建时间排序
}
type SortInfo2 struct {
	Direction string `json:"direction" form:"direction,default=desc" binding:"oneof=asc desc" default:"desc"`                                                  // 排序方向，枚举：asc：正序；desc：倒序。默认倒序
	Sort      string `json:"sort" form:"sort,default=created_at" binding:"oneof=created_at updated_at name type publish_at online_time"  default:"created_at"` // 排序类型，枚举：created_at：按创建时间排序；updated_at：按更新时间排序；name：按名称排序。默认按创建时间排序
}

type SortInfo3 struct {
	Direction string `json:"direction" form:"direction,default=desc" binding:"oneof=asc desc" default:"desc"`                      // 排序方向，枚举：asc：正序；desc：倒序。默认倒序
	Sort      string `json:"sort" form:"sort,default=created_at" binding:"oneof=created_at updated_at name"  default:"created_at"` // 排序类型，枚举：created_at：按创建时间排序；updated_at：按更新时间排序；name：按名称排序。默认按创建时间排序
}

type KeywordInfo struct {
	Keyword string `json:"keyword" form:"keyword" binding:"KeywordTrimSpace,omitempty,min=1,max=255"` // 关键字查询，字符无限制
}

type PageSortKeyword struct {
	PageInfo
	SortInfo
	KeywordInfo
}
type PageSortKeyword2 struct {
	PageInfo3
	SortInfo2
	KeywordInfo
}
type PageSortKeyword3 struct {
	PageInfo
	SortInfo3
	KeywordInfo
}

func NewIDReq(id string) *IDReq {
	return &IDReq{
		ID: id,
	}
}

type IDReq struct {
	ID string `json:"id" uri:"id" form:"id" binding:"required" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"`
}

type IDPathReq struct {
	IDReq `param_type:"path"`
}

type IDQueryReq struct {
	IDReq `param_type:"query"`
}
