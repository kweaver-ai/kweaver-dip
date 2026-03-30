package notification

import (
	"context"

	"github.com/google/uuid"

	asset_portal_v1 "github.com/kweaver-ai/idrm-go-common/api/asset_portal/v1"
	asset_portal_v1_frontend "github.com/kweaver-ai/idrm-go-common/api/asset_portal/v1/frontend"
)

// 用户通知
type Interface interface {
	// 获取指定用户收到的通知
	Get(ctx context.Context, recipientID, id uuid.UUID) (*asset_portal_v1_frontend.Notification, error)
	// 获取指定用户收到的通知列表
	List(ctx context.Context, recipientID uuid.UUID, opts *asset_portal_v1.NotificationListOptions) (*asset_portal_v1_frontend.NotificationList, error)
	// 标记指定用户收到的通知为已读
	Read(ctx context.Context, recipientID, id uuid.UUID) error
	// 标记指定用户收到的所有通知为已读
	ReadAll(ctx context.Context, recipientID uuid.UUID) error
}
