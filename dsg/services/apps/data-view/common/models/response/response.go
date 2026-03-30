package response

type PageResult[T any] struct {
	Entries    []*T  `json:"entries" binding:"required"`                       // 对象列表
	TotalCount int64 `json:"total_count" binding:"required,gte=0" example:"3"` // 当前筛选条件下的对象数量
}

type IDResp struct {
	ID string `json:"id" binding:"required"`
}

type CheckRepeatResp struct {
	Name   string `json:"name" example:"obj_name"` // 被检测的对象名称
	Repeat bool   `json:"repeat" example:"false"`  // 是否重复
}

type IDNameResp struct {
	ID   string `json:"id" binding:"required"`
	Name string `json:"name" binding:"required"`
}

type BoolResp struct {
	Value bool `json:"value" example:"true"` // 布尔值
}

func ID(id string) *IDResp {
	return &IDResp{
		ID: id,
	}
}
