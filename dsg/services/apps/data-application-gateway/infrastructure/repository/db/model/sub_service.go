package model

import (
	"github.com/google/uuid"
	"time"
)

// SubService mapped from table <sub_services>
type SubService struct {
	// 雪花 ID，无业务意义
	SnowflakeID uint64 `gorm:"column:snowflake_id;primaryKey;comment:雪花 ID，无业务意义" json:"snowflake_id,omitempty"`
	// ID
	ID uuid.UUID `gorm:"column:id;not null;default:UUID();comment:id" json:"id,omitempty"`
	// 名称
	Name string `gorm:"column:name;not null;comment:名称" json:"name,omitempty"`
	// 所属逻辑视图的 ID
	ServiceID uuid.UUID `gorm:"column:service_id;not null;comment:所属接口服务的ID" json:"service_id,omitempty"`
	// 授权范围ID
	AuthScopeID uuid.UUID `gorm:"column:auth_scope_id;comment:上层接口授权范围的ID" json:"auth_scope_id,omitempty"`
	// 行列规则，格式同下载任务的过滤条件
	Detail string `gorm:"column:detail;not null;comment:行列规则，格式同下载任务的过滤条件" json:"detail,omitempty"`
	// 行列配置详情，JSON 格式，与下载数据接口的过滤条件结构相同
	RowFilterClause string ` gorm:"column:row_filter_clause;not null;comment:子视图的行过滤器子句"   json:"row_filter_clause,omitempty"`

	CreatedAt time.Time `gorm:"column:created_at;not null;default:current_timestamp();comment:创建时间" json:"created_at,omitempty"`
	UpdatedAt time.Time `gorm:"column:updated_at;not null;autoUpdateTime;comment:更新时间" json:"updated_at,omitempty"`
	DeletedAt uint64    `gorm:"column:deleted_at;not null;softDelete:milli" json:"deleted_at,omitempty"`
}
