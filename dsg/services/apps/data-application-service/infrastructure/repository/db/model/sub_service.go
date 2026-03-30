package model

import (
	"time"

	"github.com/google/uuid"
	utilities "github.com/kweaver-ai/idrm-go-frame/core/utils"
	"gorm.io/gorm"
	"gorm.io/plugin/soft_delete"
)

const TableNameSubServices = "sub_service"

// SubService mapped from table <sub_services>
type SubService struct {
	// 雪花 ID，无业务意义
	SnowflakeID uint64 `gorm:"column:snowflake_id;comment:雪花 ID，无业务意义" json:"snowflake_id,omitempty"`
	// ID
	ID uuid.UUID `gorm:"column:id;not null;comment:id" json:"id,omitempty"`
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

	CreatedAt time.Time             `gorm:"column:created_at;default:current_timestamp(3)" json:"created_at"` // 创建时间
	UpdatedAt time.Time             `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`               // 更新时间
	DeletedAt soft_delete.DeletedAt `gorm:"column:deleted_at;not null;softDelete:milli" json:"deleted_at,omitempty"`
}

// TableName SubService's table name
func (*SubService) TableName() string {
	return TableNameSubServices
}

func (sv *SubService) BeforeCreate(_ *gorm.DB) (err error) {
	if sv == nil {
		return nil
	}

	// 生成雪花 ID
	if sv.SnowflakeID, err = utilities.GetUniqueID(); err != nil {
		return
	}

	// 生成 ID
	// MariaDB 10.4.31 不支持 INSERT ... RETURNING 所以 db.Create 无法返回由
	// MariaDB 根据 DEFAULT 生成的字段，导致 SubService.ID 为零值。
	if sv.ID, err = uuid.NewV7(); err != nil {
		return
	}

	return
}
