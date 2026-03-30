package model

import (
	"time"

	"github.com/google/uuid"
	utilities "github.com/kweaver-ai/idrm-go-frame/core/utils"
	"gorm.io/gorm"
)

const TableNameDataSet = "data_set"
const TableNameDataSetViewRelation = "data_set_view_relation"

// DataSet 数据集表
type DataSet struct {
	DataSetID          int64     `gorm:"column:data_set_id;primaryKey;comment:数据集雪花id" json:"data_set_id"`
	ID                 string    `gorm:"column:id;not null;comment:数据集uuid" json:"id"`
	DataSetName        string    `gorm:"column:data_set_name;comment:数据集名称" json:"data_set_name"`
	DataSetDescription string    `gorm:"column:data_set_description;comment:数据集描述" json:"data_set_description"`
	CreatedAt          time.Time `gorm:"column:created_at;not null;default:current_timestamp();comment:创建时间" json:"created_at"`
	CreatedByUID       string    `gorm:"column:created_by_uid;comment:创建用户id" json:"created_by_uid"`
	UpdatedAt          time.Time `gorm:"column:updated_at;not null;autoUpdateTime;comment:修改时间" json:"updated_at"`
	UpdatedByUID       string    `gorm:"column:updated_by_uid;comment:修改用户id" json:"updated_by_uid"`
	DeletedAt          int64     `gorm:"column:deleted_at;not null;default:0;comment:删除时间" json:"deleted_at"`
}

// DataSetViewRelation 数据集视图表
type DataSetViewRelation struct {
	ID         string    `gorm:"column:id;primaryKey;not null;comment:数据集uuid" json:"id"`
	Name       string    `gorm:"column:id;primaryKey;not null;comment:数据集uuid" json:"id"`
	FormViewID string    `gorm:"column:form_view_id;not null;comment:数据视图uuid" json:"form_view_id"`
	UpdatedAt  time.Time `gorm:"column:updated_at;not null;autoUpdateTime;comment:修改时间" json:"updated_at"`
}

// TableName DataSet's table name
func (*DataSet) TableName() string {
	return TableNameDataSet
}

// TableName DataSetViewRelation's table name
func (*DataSetViewRelation) TableName() string {
	return TableNameDataSetViewRelation
}

func (d *DataSet) BeforeCreate(_ *gorm.DB) error {
	if d == nil {
		return nil
	}
	var err error
	if d.DataSetID == 0 {
		uniqueID, idErr := utilities.GetUniqueID()
		d.DataSetID, err = int64(uniqueID), idErr
	}
	if len(d.ID) == 0 {
		d.ID = uuid.NewString()
	}
	if d.CreatedAt.IsZero() {
		d.CreatedAt = time.Now()
	}
	if d.UpdatedAt.IsZero() {
		d.UpdatedAt = time.Now()
	}
	return err
}

func (d *DataSet) BeforeUpdate(_ *gorm.DB) error {
	if d == nil {
		return nil
	}
	if d.UpdatedAt.IsZero() {
		d.UpdatedAt = time.Now()
	}
	return nil
}
