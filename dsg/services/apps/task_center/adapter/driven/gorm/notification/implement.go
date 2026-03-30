package notification

import (
	"context"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-common/util/ptr"
)

// 用户通知的数据库客户端
type Client struct {
	DB *gorm.DB
}

func New(data *db.Data) Interface { return &Client{DB: data.DB} }

// 创建用户通知
func (c *Client) Create(ctx context.Context, notification *model.Notification) error {
	return c.DB.WithContext(ctx).Create(notification).Error
}

// 获取指定用户收到的通知
func (c *Client) Get(ctx context.Context, recipientID, id uuid.UUID) (*model.Notification, error) {
	var result model.Notification
	if err := c.DB.WithContext(ctx).
		Model(&model.Notification{}).
		Where(&model.NotificationSpec{RecipientID: recipientID}).
		Where(&model.Metadata{ID: id}).
		Take(&result).Error; err != nil {
		return nil, err
	}
	return &result, nil
}

// 返回指定工单告警、索引对应的用户消息是否存在
func (c *Client) CheckExistenceByWorkOrderIDAndWorkOrderAlarmIndex(ctx context.Context, id uuid.UUID, index int) (result bool, err error) {
	var count int64
	if err = c.DB.WithContext(ctx).
		Model(&model.Notification{}).
		Where(&model.NotificationSpec{
			WorkOrderID:         id,
			WorkOrderAlarmIndex: &index,
		}).
		Count(&count).Error; err != nil {
		return
	}
	result = count > 0
	return
}

// 获取指定用户收到的通知列表
func (c *Client) List(ctx context.Context, recipientID uuid.UUID, opts *ListOptions) (result []model.Notification, total int, err error) {
	tx := c.DB.WithContext(ctx).
		Model(&model.Notification{}).
		Where(&model.NotificationSpec{RecipientID: recipientID}).
		Where(&model.NotificationStatus{Read: opts.Read})

	// 总数
	var count int64
	if err = tx.Count(&count).
		Error; err != nil {
		return
	}
	total = int(count)

	// 分页
	if opts.Limit > 0 {
		tx = tx.Limit(opts.Limit)
		if opts.Offset > 0 {
			tx = tx.Offset(opts.Offset)
		}
	}
	// 按照创建时间（接收时间）降序
	if err = tx.Order("`created_at` DESC").Find(&result).Error; err != nil {
		return
	}

	return
}

// 标记指定用户收到的通知为已读
func (c *Client) Read(ctx context.Context, recipientID, id uuid.UUID) error {
	return c.DB.WithContext(ctx).
		Model(&model.Notification{}).
		Where(&model.Metadata{ID: id}).
		Where(&model.NotificationSpec{RecipientID: recipientID}).
		Updates(&model.NotificationStatus{Read: ptr.To(true)}).Error
}

// 标记指定用户收到的所有通知为已读
func (c *Client) ReadAll(ctx context.Context, recipientID uuid.UUID) error {
	return c.DB.WithContext(ctx).
		Model(&model.Notification{}).
		Where(&model.NotificationSpec{RecipientID: recipientID}).
		Updates(&model.NotificationStatus{Read: ptr.To(true)}).Error
}

var _ Interface = &Client{}
