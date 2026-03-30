package model

import (
	"time"

	"github.com/kweaver-ai/idrm-go-frame/core/utils"
	"gorm.io/gorm"
)

const TableNameTDataCatalogScore = "t_data_catalog_score"

// TDataCatalogScore mapped from table <t_data_catalog_score>
type TDataCatalogScore struct {
	ID        uint64    `gorm:"column:id;primaryKey" json:"id"`                          // 唯一id，雪花算法
	CatalogID uint64    `gorm:"column:catalog_id;not null" json:"catalog_id"`            // 数据资源目录ID
	Score     int8      `gorm:"column:score;not null" json:"score"`                      // 评分
	ScoredUID string    `gorm:"column:scored_uid;not null;default:''" json:"scored_uid"` // 评分用户ID
	ScoredAt  time.Time `gorm:"column:scored_at;not null" json:"scored_at"`              // 评分时间
}

func (m *TDataCatalogScore) UniqueKey() string {
	return "id"
}

func (m *TDataCatalogScore) BeforeCreate(_ *gorm.DB) error {
	var err error
	if m == nil {
		return nil
	}

	if m.ID == 0 {
		m.ID, err = utils.GetUniqueID()
	}
	now := time.Now()

	if m.ScoredAt.IsZero() {
		m.ScoredAt = now
	}
	return err
}

// TableName TDataCatalogScore's table name
func (*TDataCatalogScore) TableName() string {
	return TableNameTDataCatalogScore
}
