package model

import (
	"time"

	"github.com/google/uuid"
	utilities "github.com/kweaver-ai/idrm-go-frame/core/utils"
	"gorm.io/gorm"
)

const TableNamePointsEvent = "points_event"
const TableNamePointsEventTopDepartment = "points_event_top_department"

// PointsEvent mapped from table <points_event>
type PointsEvent struct {
	PointEventID     uint64    `gorm:"column:point_rule_config_id" json:"-"`                                      // 雪花id
	ID               string    `gorm:"column:id;not null" json:"id"`                                              // 对象id，uuid
	Code             string    `gorm:"column:code;not null" json:"code"`                                          // 名称
	BusinessModule   string    `gorm:"column:business_module;not null" json:"business_module"`                    // 所属业务模块
	PointsObjectType string    `gorm:"column:points_object_type;not null" json:"points_object_type"`              // 积分对象类型
	PointsObjectID   string    `gorm:"column:points_object_id;not null" json:"points_object_id"`                  // 积分对象ID
	PointsObjectName string    `gorm:"column:points_object_name;not null" json:"points_object_name"`              // 积分对象名称
	PointsValue      int64     `gorm:"column:points_value;not null" json:"points_value"`                          // 积分值
	CreatedAt        time.Time `gorm:"column:created_at;not null;default:current_timestamp(3)" json:"created_at"` // 创建时间
}

func (m *PointsEvent) BeforeCreate(_ *gorm.DB) error {
	if m == nil {
		return nil
	}

	if m.PointEventID == 0 {
		m.PointEventID, _ = utilities.GetUniqueID()
	}

	if len(m.ID) == 0 {
		m.ID = uuid.NewString()
	}

	return nil
}

// TableName TableNamePointsEvent's table name
func (*PointsEvent) TableName() string {
	return TableNamePointsEvent
}

// PointsEventTopDepartment mapped from table <points_event_top_department>
type PointsEventTopDepartment struct {
	PointEventTopDepartmentID uint64 `gorm:"column:point_event_top_department_id" json:"-"`          // 雪花id
	ID                        string `gorm:"column:id;not null" json:"id"`                           // 对象id，uuid
	DepartmentID              string `gorm:"column:department_id;not null" json:"department_id"`     // 部门ID
	DepartmentName            string `gorm:"column:department_name;not null" json:"department_name"` // 部门名称
	DepartmentPath            string `gorm:"column:department_path;not null" json:"department_path"` // 部门路径
	PointsEventID             uint64 `gorm:"column:points_event_id;not null" json:"points_event_id"` // 积分事件ID
}

func (m *PointsEventTopDepartment) BeforeCreate(_ *gorm.DB) error {
	if m == nil {
		return nil
	}
	if m.PointEventTopDepartmentID == 0 {
		m.PointEventTopDepartmentID, _ = utilities.GetUniqueID()
	}

	if len(m.ID) == 0 {
		m.ID = uuid.NewString()
	}

	return nil
}

// TableName TableNamePointsEventTopDepartment's table name
func (*PointsEventTopDepartment) TableName() string {
	return TableNamePointsEventTopDepartment
}
