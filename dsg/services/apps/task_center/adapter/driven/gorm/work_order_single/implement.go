package work_order_single

import (
	"context"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
)

// 工单的数据库客户端
type Client struct {
	DB *gorm.DB
}

var _ Interface = &Client{}

func New(data *db.Data) Interface { return &Client{DB: data.DB} }

// 获取工单
func (c *Client) GetByWorkOrderID(ctx context.Context, id uuid.UUID) (*model.WorkOrderSingle, error) {
	var record model.WorkOrderSingle
	if err := c.DB.WithContext(ctx).Where(&model.WorkOrderSingle{WorkOrderID: id}).Take(&record).Error; err != nil {
		return nil, err
	}
	return &record, nil
}
