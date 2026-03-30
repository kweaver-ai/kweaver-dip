package af_tasks

import (
	"context"

	"gorm.io/gorm"

	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
)

type WorkOrderInterface interface {
	Get(ctx context.Context, id string) (*model.WorkOrder, error)
}

type workOrders struct {
	db *gorm.DB

	database string
	table    string
}

func newWorkOrders(db *gorm.DB, database string) *workOrders {
	return &workOrders{
		db:       db,
		database: database,
		table:    "work_order",
	}
}

func (c *workOrders) Get(ctx context.Context, id string) (*model.WorkOrder, error) {
	var record = model.WorkOrder{WorkOrderID: id}
	if err := c.db.Table(c.database + "." + c.table).Where(&record).Take(&record).Error; err != nil {
		return nil, err
	}
	return &record, nil
}
