package response

type PageResult struct {
	Entries    interface{} `json:"entries"`
	TotalCount int64       `json:"total_count"`
	Offset     int         `json:"offset,omitempty"`
	Limit      int         `json:"limit,omitempty"`
}

type NameIDResp struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type CheckRepeatResp struct {
	Name   string `json:"name"`
	Repeat bool   `json:"repeat"`
}

type IDResp struct {
	ID string `json:"id"`
}

type UUIDResp struct {
	UUID string `json:"uuid"  example:"4a5a3cc0-0169-4d62-9442-62214d8fcd8d"` // 图片资源UUID
}

func ID(id string) *IDResp {
	return &IDResp{
		ID: id,
	}
}

type ErrorResponse struct {
	Code        string      `json:"code"`
	Description string      `json:"description"`
	Solution    string      `json:"solution"`
	Detail      interface{} `json:"detail"`
}

type PageResultNew[T any] struct {
	Entries    []*T  `json:"entries" binding:"required"`                       // 对象列表
	TotalCount int64 `json:"total_count" binding:"required,gte=0" example:"3"` // 当前筛选条件下的对象数量
}
