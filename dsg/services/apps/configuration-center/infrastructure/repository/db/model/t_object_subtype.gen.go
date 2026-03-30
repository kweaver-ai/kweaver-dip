package model

import (
	"time"
)

const TableNameTObjectSubtype = "t_object_subtype"

// TObjectSubtype mapped from table <t_object_subtype>
type TObjectSubtype struct {
	ID           string     `gorm:"column:id;primaryKey" json:"id"`               // 对象ID
	Subtype      int32      `gorm:"column:subtype" json:"subtype"`                // 子类型，用于对象类型二次分类，有效值包括1-行政区 2-部门 3-处（科）室
	MainDeptType int32      `gorm:"column:main_dept_type" json:"main_dept_type"`  //主部门设置，1主部门,0或空不是主部门
	CreatedAt    time.Time  `gorm:"column:created_at;not null" json:"created_at"` // 创建时间
	CreatedBy    string     `gorm:"column:created_by;not null" json:"created_by"` // 创建用户ID
	UpdatedAt    *time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`          // 更新时间
	UpdatedBy    *string    `gorm:"column:updated_by" json:"updated_by"`          // 更新用户ID
	DeletedAt    *time.Time `gorm:"column:deleted_at" json:"deleted_at"`          // 删除时间
	DeletedBy    *string    `gorm:"column:deleted_by" json:"deleted_by"`          // 删除用户ID
}

func (m *TObjectSubtype) UniqueKey() string {
	return "id"
}

// TableName TObjectSubtype's table name
func (*TObjectSubtype) TableName() string {
	return TableNameTObjectSubtype
}
