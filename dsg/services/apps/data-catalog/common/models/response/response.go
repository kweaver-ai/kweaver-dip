package response

import (
	"time"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models"
)

type PageResult[T any] struct {
	Entries    []*T  `json:"entries" binding:"required"`                       // 对象列表
	TotalCount int64 `json:"total_count" binding:"required,gte=0" example:"3"` // 当前筛选条件下的对象数量
}

type ArrayResult[T any] struct {
	Entries []*T `json:"entries" binding:"required"` // 对象列表
}

type IDResp struct {
	ID models.ModelID `json:"id" binding:"required" example:"1"` // 对象ID
}

type IDNameResp struct {
	ID   models.ModelID `json:"id" binding:"required" example:"1"`                        // 对象ID
	Name string         `json:"name" binding:"required,min=1,max=128" example:"obj_name"` // 对象名称
}

type CheckRepeatResp struct {
	Name   string `json:"name" binding:"required,min=1,max=128" example:"obj_name"` // 被检测的对象名称
	Repeat bool   `json:"repeat" binding:"required" example:"false"`                // 是否重复
}

type CreateUpdateUser struct {
	CreatedBy string `json:"created_by" binding:"required,min=1" example:"admin"` // 创建用户名
	UpdatedBy string `json:"updated_by" binding:"required,min=1" example:"admin"` // 最终修改用户名
}

func NewCreateUpdateUser(cUser, uUser string) CreateUpdateUser {
	return CreateUpdateUser{
		CreatedBy: cUser,
		UpdatedBy: uUser,
	}
}

type CreateUpdateTime struct {
	CreatedAt int64 `json:"created_at" binding:"required,gt=0"` // 创建时间，时间戳
	UpdatedAt int64 `json:"updated_at" binding:"required,gt=0"` // 最终修改时间，时间戳
}

func NewCreateUpdateTime(cTime, uTime *time.Time) CreateUpdateTime {
	return CreateUpdateTime{
		CreatedAt: cTime.UnixMilli(),
		UpdatedAt: uTime.UnixMilli(),
	}
}

type CreateUpdateUserAndTime struct {
	CreateUpdateUser
	CreateUpdateTime
}

func NewCreateUpdateUserAndTime(createUser, updateUser string, createTime, updateTime *time.Time) CreateUpdateUserAndTime {
	return CreateUpdateUserAndTime{
		CreateUpdateUser: NewCreateUpdateUser(createUser, updateUser),
		CreateUpdateTime: NewCreateUpdateTime(createTime, updateTime),
	}
}

type NameIDResp struct {
	ID   string `json:"id" binding:"required,uuid" example:"3ccd8d5a76b711edb78d00505697bd0b"` // 资源对象ID
	Name string `json:"name,omitempty" binding:"required,min=1" example:"name"`                // 资源对象名称
}
type NameIDResp2 struct {
	ID string `json:"id" example:"3ccd8d5a76b711edb78d00505697bd0b"` // 资源对象ID
}
type IDRes struct {
	ID string `json:"id"` // 资源对象ID
}

type InfoItem struct {
	InfoType int8        `json:"info_type" binding:"required,min=1,max=5"` // 关联信息类型 1 标签 2 来源业务场景 3 关联业务场景 4 关联系统 5 关联表、字段 6 业务域(业务对象)
	Entries  []*InfoBase `json:"entries" binding:"omitempty,unique=InfoKey,dive"`
}

type InfoBase struct {
	InfoKey   string `json:"info_key" binding:"required,TrimSpace,min=1,max=50"`     // 关联信息key（仅当info_type为5时为关联目录ID，其它情况下为ID或枚举值）
	InfoValue string `json:"info_value" binding:"required,TrimSpace,min=1,max=1000"` // 关联信息名称（info_type为5时表示关联目录及其信息项的json字符串）
}
