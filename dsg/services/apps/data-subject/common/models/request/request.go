package request

type PageInfo struct {
	Offset    uint64 `json:"offset" form:"offset,default=1" binding:"min=1"`                                 // 页码
	Limit     uint64 `json:"limit" form:"limit,default=10" binding:"min=1,max=2000"`                         // 每页大小
	Direction string `json:"direction" form:"direction,default=desc" binding:"oneof=asc desc"`               // 排序方向
	Sort      string `json:"sort" form:"sort,default=updated_at" binding:"oneof=created_at updated_at name"` // 排序类型
}

type Page struct {
	Offset uint64 `json:"offset" form:"offset,default=1" binding:"min=1"` // 页码
	Limit  uint64 `json:"limit" form:"limit,default=10" binding:"min=1"`  // 每页大小
}

// OrderInfo order by created_at only
type OrderInfo struct {
	Sort      string `json:"sort" form:"sort,default=created_at" binding:"eq=created_at"`      // 排序类型
	Direction string `json:"direction" form:"direction,default=desc" binding:"oneof=asc desc"` // 排序方向
}
type OrderTwo struct {
	Sort       string `json:"sort" form:"sort,default=created_at" binding:"oneof=created_at updated_at"`
	Direction  string `json:"direction" form:"direction,default=desc" binding:"oneof=asc desc"`
	Sort2      string `json:"sort2" form:"sort2" binding:"omitempty,oneof=created_at updated_at"`
	Direction2 string `json:"direction2" form:"direction2" binding:"omitempty,oneof=asc desc"`
}
type GetBusinessDomainsReq struct {
	Offset       int    `json:"offset" form:"offset,default=1"  binding:"gte=1"`      // 页码
	Limit        int    `json:"limit" form:"limit,default=5" binding:"gte=0,lte=100"` // 每页大小
	Sort         string `json:"sort" form:"sort,default=created_at" binding:"oneof=created_at updated_at"`
	Direction    string `json:"direction" form:"direction,default=desc" binding:"oneof=asc desc"`
	Sort2        string `json:"sort2" form:"sort2" binding:"omitempty,oneof=created_at updated_at"`
	Direction2   string `json:"direction2" form:"direction2" binding:"omitempty,oneof=asc desc"`
	Name         string `json:"name" form:"name"`
	CreateUserId int    `json:"create_user_id" form:"create_user_id"`
}
type VerifyNameRepeatReq struct {
	Name string `json:"name" form:"name" binding:"required,VerifyName128NoSpaceNoSlash"`
}
type GetConfigReq struct {
	Name string `json:"name" form:"name"`
}

type PageInfoNew struct {
	Offset    int    `json:"offset" form:"offset,default=1" binding:"omitempty,min=1"`                           // 页码，默认1
	Limit     int    `json:"limit" form:"limit,default=10" binding:"omitempty,min=1,max=2000"`                   // 每页大小，默认10
	Direction string `json:"direction" form:"direction,default=desc" binding:"omitempty,oneof=asc desc"`         // 排序方向，枚举：asc：正序；desc：倒序。默认倒序
	Sort      string `json:"sort" form:"sort,default=name" binding:"omitempty,oneof=created_at updated_at name"` // 排序类型，枚举：created_at：按创建时间排序；updated_at：按更新时间排序；name：按名称排序。默认名称排序
}

type KeywordInfo struct {
	Keyword string `json:"keyword" form:"keyword" binding:"TrimSpace,omitempty,max=128"` // 关键字查询，字符无限制
}

type PageInfoWithKeyword struct {
	PageInfoNew
	KeywordInfo
}

type VerifyCodeNameRepeatReq struct {
	Code string `json:"code" form:"code" binding:"omitempty,min=1"`
	Name string `json:"name" form:"name" binding:"required,VerifyNameStandard"`
}
