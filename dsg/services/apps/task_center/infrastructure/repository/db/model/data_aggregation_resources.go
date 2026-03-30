package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/plugin/soft_delete"

	"github.com/kweaver-ai/dsg/services/apps/task_center/common/errorcode"
)

const TableNameDataAggregationResources = "data_aggregation_resources"

// DataAggregationResource mapped from table <data_aggregation_resources>
//
// 数据归集资源
//
//  1. 记录数据归集清单关联的逻辑视图
//  2. 记录数据归集工单关联的逻辑视图
type DataAggregationResource struct {
	// ID
	ID string `json:"id,omitempty" gorm:"primaryKey"`
	// 逻辑视图 ID
	DataViewID string `json:"data_view_id,omitempty"`
	// 所属数据归集清单的 ID 与 work_order_id 互斥
	DataAggregationInventoryID string `json:"data_aggregation_inventory_id,omitempty"`
	// 所属数据归集工单的 ID 与 data_aggregation_inventory_id 互斥
	WorkOrderID string `json:"work_order_id,omitempty"`
	// 采集方式
	CollectionMethod DataAggregationResourceCollectionMethod `json:"collection_method,omitempty"`
	// 同步频率
	SyncFrequency DataAggregationResourceSyncFrequency `json:"sync_frequency,omitempty"`
	// 关联业务表 ID
	BusinessFormID string `json:"business_form_id,omitempty"`
	// 目标数据源 ID
	TargetDatasourceID string `json:"target_datasource_id,omitempty"`
	// 物化物理表
	DataTableName string `json:"data_table_name,omitempty"`
	// 更新时间
	UpdatedAt int64 `json:"updated_at,omitempty"`
	// 删除时间
	DeletedAt soft_delete.DeletedAt `json:"deleted_at,omitempty" gorm:"softDelete:milli"`
}

func (r *DataAggregationResource) TableName() string { return TableNameDataAggregationResources }

func (r *DataAggregationResource) BeforeCreate(tx *gorm.DB) error {
	if r.ID == "" {
		// 生成 ID
		id, err := uuid.NewV7()
		if err != nil {
			return tx.AddError(err)
		}
		r.ID = id.String()
	}

	if r.DataAggregationInventoryID != "" && r.WorkOrderID != "" {
		return errorcode.Detail(errorcode.InternalError, r)
	}

	return nil
}

func (r *DataAggregationResource) BeforeUpdate(*gorm.DB) error {
	r.UpdatedAt = time.Now().UnixMilli()
	return nil
}

// 数据归集资源采集方式
type DataAggregationResourceCollectionMethod int

// 数据归集资源采集方式
const (
	// 全量
	DataAggregationResourceCollectionFull DataAggregationResourceCollectionMethod = iota
	// 增量
	DataAggregationResourceCollectionIncrement
)

// 数据归集资源同步频率
type DataAggregationResourceSyncFrequency int

// 数据归集资源同步频率
const (
	// 每分钟
	DataAggregationResourceSyncFrequencyPerMinute DataAggregationResourceSyncFrequency = iota
	// 每小时
	DataAggregationResourceSyncFrequencyPerHour
	// 每天
	DataAggregationResourceSyncFrequencyPerDay
	// 每周
	DataAggregationResourceSyncFrequencyPerWeek
	// 每月
	DataAggregationResourceSyncFrequencyPerMonth
	// 每年
	DataAggregationResourceSyncFrequencyPerYear
)
