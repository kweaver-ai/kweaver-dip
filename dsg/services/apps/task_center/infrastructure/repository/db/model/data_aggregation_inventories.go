package model

import (
	"time"

	"gorm.io/plugin/soft_delete"
)

const TableNameDataAggregationInventories = "data_aggregation_inventories"

// DataAggregationInventory mapped from table <data_aggregation_inventories>
type DataAggregationInventory struct {
	// ID
	ID string `json:"id,omitempty" gorm:"primaryKey"`
	// 编号
	Code string `json:"code,omitempty"`
	// 名称
	Name string `json:"name,omitempty"`
	// 创建方式
	CreationMethod DataAggregationInventoryCreationMethod `json:"creation_method,omitempty"`
	// 数源单位的 ID
	DepartmentID string `json:"department_id,omitempty"`
	// 归集资源列表
	Resources []DataAggregationResource `json:"resources,omitempty" gorm:"-"`
	// Workflow 审核的 ApplyID
	ApplyID string `json:"apply_id,omitempty"`
	// 状态
	Status DataAggregationInventoryStatus `json:"status,omitempty"`
	// 创建时间
	CreatedAt time.Time `json:"created_at,omitempty"`
	// 创建人，创建清单的人的 ID
	CreatorID string `json:"creator_id,omitempty"`
	// 申请时间
	RequestedAt *time.Time `json:"requested_at,omitempty"`
	// 申请人 ID，提交归集清单申请的人的 ID
	RequesterID string `json:"requester_id,omitempty"`
	// 删除时间
	DeletedAt soft_delete.DeletedAt `json:"deleted_at,omitempty" gorm:"softDelete:milli"`
}

func (DataAggregationInventory) TableName() string { return TableNameDataAggregationInventories }

// 数据归集清单创建方式
type DataAggregationInventoryCreationMethod int

// 数据归集清单创建方式
const (
	// 直接创建
	DataAggregationInventoryCreationRaw DataAggregationInventoryCreationMethod = iota
	// 通过工单创建
	DataAggregationInventoryCreationWorkOrder
)

// 数据归集清单状态
type DataAggregationInventoryStatus int

// 数据归集清单状态
const (
	// 草稿，未发起审核
	DataAggregationInventoryDraft = DataAggregationInventoryStatus(iota)
	// 审核中
	DataAggregationInventoryAuditing
	// 已完成，直接创建的数据归集清单被批准、或通过工单创建的数据归集清单。
	DataAggregationInventoryCompleted
	// 被拒绝
	DataAggregationInventoryReject
)
