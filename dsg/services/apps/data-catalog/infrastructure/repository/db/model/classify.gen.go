package model

import (
	"time"

	"github.com/google/uuid"
	"github.com/kweaver-ai/idrm-go-frame/core/utils"
	"gorm.io/gorm"
	"gorm.io/plugin/soft_delete"
)

const TableNameClassify = "classify"

type Classify struct {
	ID         uint64                `gorm:"primaryKey;column:id"`
	ClassifyID string                `gorm:"column:classify_id;type:char(36);not null"`
	Name       string                `gorm:"column:name;type:char(36);not null"`
	ParentID   string                `gorm:"column:parent_id;type:char(36);not null"`
	PathID     string                `gorm:"column:path_id;type:varchar(255);not null"`
	Path       string                `gorm:"column:path;type:text;not null"`
	CreatedAt  time.Time             `gorm:"column:created_at;type:datetime(3)"`
	CreatedBy  string                `gorm:"column:created_by;type:char(36)"`
	DeletedAt  uint64                `gorm:"column:deleted_at;type:bigint(20)"`
	DeletedBy  soft_delete.DeletedAt `gorm:"column:deleted_by;type:char(36)"`
}

func (Classify) TableName() string {
	return TableNameClassify
}

func (c *Classify) BeforeCreate(_ *gorm.DB) error {
	var err error
	if c == nil {
		return nil
	}

	if c.ID == 0 {
		c.ID, err = utils.GetUniqueID()
	}

	if c.ClassifyID == "" {
		c.ClassifyID = uuid.New().String()
	}

	return err
}
