package response

type ResResult struct {
	Res interface{} `json:"res"` //返回的结构
}

type PageResult[T any] struct {
	Entries    []*T  `json:"entries" binding:"required"`                       // 对象列表
	TotalCount int64 `json:"total_count" binding:"required,gte=0" example:"3"` // 当前筛选条件下的对象数量
}

type NameIDResp struct {
	ID   string `json:"id" binding:"required,uuid" example:"3ccd8d5a76b711edb78d00505697bd0b"` // 资源对象ID
	Name string `json:"name,omitempty" binding:"required,min=1" example:"name"`                // 资源对象名称
}
type NameIDResp2 struct {
	ID string `json:"id" example:"3ccd8d5a76b711edb78d00505697bd0b"` // 资源对象ID
}

type CheckRepeatResp struct {
	Name   string `json:"name" binding:"required,min=1" example:"name"` // 被检测的资源名称
	Repeat bool   `json:"repeat" binding:"required" example:"false"`    // 是否重复
}

type CreateUpdateUserAndTime struct {
	CreatedBy string `json:"created_by" binding:"required,min=1" example:"admin"` // 创建用户名
	CreatedAt int64  `json:"created_at" binding:"required,gt=0"`                  // 创建时间
	UpdatedBy string `json:"updated_by" binding:"required,min=1" example:"admin"` // 最终修改用户名
	UpdatedAt int64  `json:"updated_at" binding:"required,gt=0"`                  // 最终修改时间
}
