package model

import (
	"time"

	"github.com/kweaver-ai/idrm-go-frame/core/utils"
	"gorm.io/gorm"
)

const TableNameMyFavorite = "t_my_favorite"

// TMyFavorite mapped from table <t_my_favorite>
type TMyFavorite struct {
	ID        uint64    `gorm:"column:id;primaryKey" json:"id"`               // 主键，雪花id
	ResType   int       `gorm:"column:res_type;not null" json:"res_type"`     // 资源类型 1 数据资源目录 2 信息资源目录 3 电子证照目录
	ResID     string    `gorm:"column:res_id;not null" json:"res_id"`         // 资源ID
	CreatedAt time.Time `gorm:"column:created_at;not null" json:"created_at"` // 创建/收藏时间
	CreatedBy string    `gorm:"column:created_by;not null" json:"created_by"` // 创建/收藏用户ID
}

func (m *TMyFavorite) BeforeCreate(_ *gorm.DB) (err error) {
	if m == nil {
		return nil
	}

	if m.ID > 0 {
		return nil
	}

	m.ID, err = utils.GetUniqueID()
	if err != nil {
		return err
	}

	return nil
}

// TableName TMyFavorite's table name
func (*TMyFavorite) TableName() string {
	return TableNameMyFavorite
}
