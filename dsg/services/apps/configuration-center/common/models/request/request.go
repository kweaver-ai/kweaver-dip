package request

type PageInfo struct {
	Offset    int    `json:"offset" form:"offset,default=1" binding:"omitempty,min=1" default:"1"`                                     // 页码
	Limit     int    `json:"limit" form:"limit,default=10" binding:"omitempty,min=1,max=100" default:"10"`                             // 每页大小
	Direction string `json:"direction" form:"direction,default=desc" binding:"omitempty,oneof=asc desc" default:"desc"`                // 排序方向
	Sort      string `json:"sort" form:"sort,default=created_at" binding:"omitempty,oneof=created_at updated_at" default:"created_at"` // 排序类型
}
type BusinessSystem struct {
	ID   string `gorm:"column:id" json:"id"`
	Name string `gorm:"column:name" json:"name"`
}
