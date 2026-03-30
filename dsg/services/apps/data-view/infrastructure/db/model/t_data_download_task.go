package model

import (
	"time"

	utilities "github.com/kweaver-ai/idrm-go-frame/core/utils"
	"gorm.io/gorm"
)

const TableNameDataDownloadTask = "t_data_download_task"

// TDataDownloadTask mapped from table <t_data_download_task>
type TDataDownloadTask struct {
	ID         uint64    `gorm:"column:id;primaryKey" json:"id"`                     // 任务ID，雪花ID
	FormViewID string    `gorm:"column:form_view_id" json:"form_view_id"`            // 逻辑视图uuid
	Name       string    `gorm:"column:name" json:"name"`                            // 逻辑视图业务名称
	NameEN     string    `gorm:"column:name_en" json:"name_en"`                      // 逻辑视图技术名称
	Detail     string    `gorm:"column:detail" json:"detail"`                        // 任务详情，聚合json字符串（包含需要下载的列、行过滤条件信息及最大导出数据量信息）
	Status     int       `gorm:"column:status" json:"status"`                        // 任务状态 1 排队中 2 执行中（数据准备中） 3 已完成（可下载） 4 执行失败（异常）
	Remark     *string   `gorm:"column:remark" json:"remark"`                        // 执行失败说明
	FileUUID   *string   `gorm:"column:file_uuid" json:"created_by_uid"`             // 创建人id
	CreatedAt  time.Time `gorm:"column:created_at" json:"created_at"`                // 创建时间
	CreatedBy  string    `gorm:"column:created_by" json:"created_by"`                // 创建人id
	UpdatedAt  time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"` // 更新时间
}

// TableName FormView's table name
func (*TDataDownloadTask) TableName() string {
	return TableNameDataDownloadTask
}

func (d *TDataDownloadTask) BeforeCreate(_ *gorm.DB) error {
	if d == nil {
		return nil
	}
	var err error
	if d.ID == 0 {
		d.ID, err = utilities.GetUniqueID()
	}
	if d.CreatedAt.IsZero() {
		d.CreatedAt = time.Now()
	}
	if d.UpdatedAt.IsZero() {
		d.UpdatedAt = time.Now()
	}
	return err
}

func (d *TDataDownloadTask) BeforeUpdate(_ *gorm.DB) error {
	if d == nil {
		return nil
	}
	if d.UpdatedAt.IsZero() {
		d.UpdatedAt = time.Now()
	}
	return nil
}
