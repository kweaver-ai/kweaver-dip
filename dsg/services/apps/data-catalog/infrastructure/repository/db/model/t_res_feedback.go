package model

import (
	"time"

	"github.com/kweaver-ai/idrm-go-frame/core/utils"
	"gorm.io/gorm"
)

type TResFeedback struct {
	ID           uint64     `gorm:"column:id;primaryKey" json:"id"`                              // 主键，雪花id
	ResID        string     `gorm:"column:res_id" json:"res_id"`                                 // 资源ID
	ResType      int        `gorm:"column:res_type" json:"res_type"`                             // 资源类型
	FeedbackType string     `gorm:"column:feedback_type" json:"feedback_type"`                   // 反馈类型
	FeedbackDesc string     `gorm:"column:feedback_desc" json:"feedback_desc"`                   // 反馈描述
	Status       int        `gorm:"column:status" json:"status"`                                 // 反馈状态 1 待处理 9 已回复
	CreatedAt    time.Time  `gorm:"column:created_at" json:"created_at"`                         // 创建时间
	CreatedBy    string     `gorm:"column:created_by" json:"created_by"`                         // 创建/反馈人ID
	UpdatedAt    time.Time  `gorm:"column:updated_at;autoUpdateTime;not null" json:"updated_at"` // 更新时间
	RepliedAt    *time.Time `gorm:"column:replied_at" json:"replied_at"`                         // 反馈回复时间
}

func (m *TResFeedback) BeforeCreate(_ *gorm.DB) error {
	if m == nil {
		return nil
	}

	if m.ID > 0 {
		return nil
	}

	id, err := utils.GetUniqueID()
	if err != nil {
		return err
	}

	m.ID = id

	return nil
}

// TableName TCatalogFeedback's table name
func (*TResFeedback) TableName() string {
	return "t_res_feedback"
}
