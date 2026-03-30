package model

import (
	"time"

	"github.com/kweaver-ai/idrm-go-frame/core/utils"

	"gorm.io/gorm"
	"gorm.io/plugin/soft_delete"
)

const TableNameAuthSubViews = "auth_sub_views"

type AuthSubView struct {
	// 雪花 ID，无业务意义
	SnowflakeID uint64 `gorm:"column:snowflake_id;comment:雪花 ID，无业务意义" json:"snowflake_id,omitempty"`
	// ID
	ID string `gorm:"column:id;not null;comment:id" json:"id,omitempty"`
	// 名称
	Name string `gorm:"column:name;not null;comment:名称" json:"name,omitempty"`

	// 所属逻辑视图的 ID
	LogicViewID string `gorm:"column:logic_view_id;not null;comment:所属逻辑视图的 ID" json:"logic_view_id,omitempty"`
	// 所属逻辑视图的名称
	LogicViewName string `gorm:"column:logic_view_name;not null;comment:所属逻辑视图的名称" json:"logic_view_name,omitempty"`
	// 子视图的列的名称列表，逗号分隔
	Columns string `gorm:"column:columns;not null;comment:子视图的列的名称列表，逗号分隔" json:"columns,omitempty"`
	// 子视图的行过滤器子句
	RowFilterClause string `gorm:"column:row_filter_clause;not null;comment:子视图的行过滤器子句" json:"row_filter_clause,omitempty"`

	CreatedAt time.Time             `json:"created_at,omitempty"`
	UpdatedAt time.Time             `gorm:"column:updated_at;not null;autoUpdateTime;comment:更新时间" json:"updated_at"` // 更新时间
	DeletedAt soft_delete.DeletedAt `gorm:"column:deleted_at;not null;softDelete:milli" json:"deleted_at,omitempty"`
}

// TableName AuthSubView's table name
func (*AuthSubView) TableName() string {
	return TableNameAuthSubViews
}

func (asv *AuthSubView) BeforeCreate(_ *gorm.DB) (err error) {
	// 生成雪花 ID
	if asv.SnowflakeID == 0 {
		if asv.SnowflakeID, err = utils.GetUniqueID(); err != nil {
			return
		}
	}
	return
}
