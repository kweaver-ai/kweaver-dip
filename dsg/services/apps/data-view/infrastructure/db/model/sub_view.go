package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/plugin/soft_delete"

	utilities "github.com/kweaver-ai/idrm-go-frame/core/utils"
)

const TableNameSubViews = "sub_views"

// SubView mapped from table <sub_views>
type SubView struct {
	// 雪花 ID，无业务意义
	SnowflakeID uint64 `gorm:"column:snowflake_id;primaryKey;comment:雪花 ID，无业务意义" json:"snowflake_id,omitempty"`
	// ID
	ID uuid.UUID `gorm:"column:id;not null;default:UUID();comment:id" json:"id,omitempty"`
	// 名称
	Name string `gorm:"column:name;not null;comment:名称" json:"name,omitempty"`
	//上一级的范围ID
	AuthScopeID uuid.UUID `gorm:"column:auth_scope_id;comment:名称"  json:"auth_scope_id"`
	// 所属逻辑视图的 ID
	LogicViewID uuid.UUID `gorm:"column:logic_view_id;not null;comment:所属逻辑视图的 ID" json:"logic_view_id,omitempty"`
	// 行列规则，格式同下载任务的过滤条件
	Detail string `gorm:"column:detail;not null;comment:行列规则，格式同下载任务的过滤条件" json:"detail,omitempty"`

	CreatedAt time.Time             `gorm:"column:created_at" json:"created_at,omitempty"`
	UpdatedAt time.Time             `gorm:"column:updated_at;autoUpdateTime" json:"updated_at,omitempty"`
	DeletedAt soft_delete.DeletedAt `gorm:"column:deleted_at;not null;softDelete:milli" json:"deleted_at,omitempty"`
}

const (
	// Deprecated: 不再限制属于同一个逻辑视图的行列规则（子视图）名称不同 #526868
	KeyNameSubViewsNameLogicViewIDDeletedAt = "idx_sub_views_name_logic_view_id_deleted_at"
)

// TableName SubView's table name
func (*SubView) TableName() string {
	return TableNameSubViews
}

func (sv *SubView) BeforeCreate(_ *gorm.DB) (err error) {
	if sv == nil {
		return nil
	}

	// 生成雪花 ID
	if sv.SnowflakeID, err = utilities.GetUniqueID(); err != nil {
		return
	}

	// 生成 ID
	//
	// MariaDB 10.4.31 不支持 INSERT ... RETURNING 所以 db.Create 无法返回由
	// MariaDB 根据 DEFAULT 生成的字段，导致 SubView.ID 为零值。
	if sv.ID, err = uuid.NewV7(); err != nil {
		return
	}

	return
}
