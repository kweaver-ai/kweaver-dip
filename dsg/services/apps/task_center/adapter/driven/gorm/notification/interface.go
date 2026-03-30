package notification

import (
	"context"

	"github.com/google/uuid"

	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
)

// 用户通知的数据库接口
type Interface interface {
	// 创建用户通知
	Create(ctx context.Context, notification *model.Notification) error
	// 获取指定用户收到的通知
	Get(ctx context.Context, recipientID, id uuid.UUID) (result *model.Notification, err error)
	// 返回指定工单告警、索引对应的用户消息是否存在
	CheckExistenceByWorkOrderIDAndWorkOrderAlarmIndex(ctx context.Context, id uuid.UUID, index int) (bool, error)
	// 获取指定用户收到的通知列表
	List(ctx context.Context, recipientID uuid.UUID, opts *ListOptions) (result []model.Notification, total int, err error)
	// 标记指定用户收到的通知为已读
	Read(ctx context.Context, recipientID, id uuid.UUID) error
	// 标记指定用户收到的所有通知为已读
	ReadAll(ctx context.Context, recipientID uuid.UUID) error
}

// 数据库的 List 选项
type ListOptions struct {
	Limit  int
	Offset int
	// 根据是否已读过滤
	//
	//  nil     不过滤
	//  false   返回未读的用户通知
	//  true    返回已读的用户通知
	Read *bool
}
