package model

import (
	"time"

	"github.com/kweaver-ai/idrm-go-frame/core/utils"
	"gorm.io/gorm"
)

type TCatalogFeedbackOpLog struct {
	ID         uint64    `gorm:"column:id;primaryKey" json:"id"`        // 主键，雪花id
	FeedbackID uint64    `gorm:"column:feedback_id" json:"feedback_id"` // 目录反馈ID
	UID        string    `gorm:"column:uid" json:"uid"`                 // 操作人ID
	OpType     int       `gorm:"column:op_type" json:"op_type"`         // 操作动作 1：反馈创建/提交 9：反馈回复
	ExtendInfo string    `gorm:"column:extend_info" json:"extend_info"` // 扩展信息，json字符串
	CreatedAt  time.Time `gorm:"column:created_at" json:"created_at"`   // 创建时间
}

func (m *TCatalogFeedbackOpLog) BeforeCreate(_ *gorm.DB) error {
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

// TableName TCatalogFeedbackOpLog's table name
func (*TCatalogFeedbackOpLog) TableName() string {
	return "t_catalog_feedback_op_log"
}
