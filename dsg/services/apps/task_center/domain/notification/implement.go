package notification

import (
	"context"

	"github.com/google/uuid"

	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/notification"
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/work_order_single"
	asset_portal_v1 "github.com/kweaver-ai/idrm-go-common/api/asset_portal/v1"
	asset_portal_v1_frontend "github.com/kweaver-ai/idrm-go-common/api/asset_portal/v1/frontend"
)

type Domain struct {
	// 数据库表 notification
	notification notification.Interface
	// 数据库表 work_order
	workOrder work_order_single.Interface
}

func New(
	// 数据库表 notification
	notification notification.Interface,
	// 数据库表 work_order
	workOrder work_order_single.Interface,
) Interface {
	return &Domain{
		// 数据库表 notification
		notification: notification,
		// 数据库表 work_order
		workOrder: workOrder,
	}
}

var _ Interface = &Domain{}

// 获取指定用户收到的通知
func (c *Domain) Get(ctx context.Context, recipientID, notificationID uuid.UUID) (*asset_portal_v1_frontend.Notification, error) {
	got, err := c.notification.Get(ctx, recipientID, notificationID)
	if err != nil {
		return nil, err
	}
	return c.aggregate_Notification(ctx, got), nil
}

// 获取指定用户收到的通知列表
func (c *Domain) List(ctx context.Context, recipientID uuid.UUID, opts *asset_portal_v1.NotificationListOptions) (*asset_portal_v1_frontend.NotificationList, error) {
	got, total, err := c.notification.List(ctx, recipientID, &notification.ListOptions{
		Limit:  opts.Limit,
		Offset: (opts.Offset - 1) * opts.Limit,
		Read:   opts.Read,
	})
	if err != nil {
		return nil, err
	}
	return &asset_portal_v1_frontend.NotificationList{
		Entries:    c.aggregate_Notifications(ctx, got),
		TotalCount: total,
	}, nil
}

// 标记指定用户收到的通知为已读
func (c *Domain) Read(ctx context.Context, recipientID, id uuid.UUID) error {
	return c.notification.Read(ctx, recipientID, id)
}

// 标记指定用户收到的所有通知为已读
func (c *Domain) ReadAll(ctx context.Context, recipientID uuid.UUID) error {
	return c.notification.ReadAll(ctx, recipientID)
}
