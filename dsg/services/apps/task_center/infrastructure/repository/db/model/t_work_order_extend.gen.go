package model

import (
	"time"

	utilities "github.com/kweaver-ai/idrm-go-frame/core/utils"
	"gorm.io/gorm"
)

const TableNameTWorkOrderExtend = "t_work_order_extend"

// TWorkOrderExtend mapped from table <t_work_order_extend>
type TWorkOrderExtend struct {
	ID              uint64     `gorm:"column:id" json:"id"`                                      // 雪花ID
	WorkOrderID     string     `gorm:"column:work_order_id;not null" json:"work_order_id"`       // 工单ID
	ExtendKey       string     `gorm:"column:extend_key;not null" json:"extend_key"`             // 扩展字段
	ExtendValue     string     `gorm:"column:extend_value;not null" json:"extend_value"`         // 扩展内容
	FusionType      int32      `gorm:"column:fusion_type;not null;default:1" json:"fusion_type"` // 融合类型：1常规方式，2场景分析方式
	ExecSQL         string     `gorm:"column:exec_sql" json:"exec_sql"`                          // 执行sql
	SceneSQL        string     `gorm:"column:scene_sql" json:"scene_sql"`                        //画布sql
	SceneAnalysisId string     `gorm:"column:scene_analysis_id" json:"scene_analysis_id"`        // 场景分析画布id
	DeletedAt       *time.Time `gorm:"column:deleted_at" json:"deleted_at"`                      // 删除时间
	RunStartAt      *time.Time `gorm:"column:run_start_at" json:"run_start_at"`                  // 运行开始时间
	RunEndAt        *time.Time `gorm:"column:run_end_at" json:"run_end_at"`                      // 运行结束时间
	RunCronStrategy string     `gorm:"column:run_cron_strategy" json:"run_cron_strategy"`        // 运行执行策略
	DataSourceID    string     `gorm:"column:datasource_id" json:"datasource_id"`                // 目标数据源id
}

func (m *TWorkOrderExtend) BeforeCreate(_ *gorm.DB) error {
	if m == nil {
		return nil
	}

	if m.ID == 0 {
		m.ID, _ = utilities.GetUniqueID()
	}
	return nil
}

// TableName TWorkOrderExtend's table name
func (*TWorkOrderExtend) TableName() string {
	return TableNameTWorkOrderExtend
}
