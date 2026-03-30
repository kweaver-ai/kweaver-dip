package model

import (
	"time"

	"github.com/google/uuid"
)

const TableNameWorkOrderSingle = "work_order"

// WorkOrder mapped from table <work_order>
//
// 工单，只包含用到的字段。剩下的用到的时候再补充
type WorkOrderSingle struct {
	// 工单id
	WorkOrderID uuid.UUID `json:"work_order_id,omitempty"`
	// 名称
	Name string `json:"name,omitempty"`
	// 编码
	Code string `json:"code,omitempty"`
	// 责任人 ID
	ResponsibleUID uuid.UUID `json:"responsible_uid,omitempty"`
	// 截止日期
	FinishedAt time.Time `json:"finished_at,omitempty"`
}

func (m *WorkOrderSingle) TableName() string { return TableNameWorkOrderSingle }
