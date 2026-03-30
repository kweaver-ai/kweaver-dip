package work_order_alarm

import (
	"context"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-common/util/ptr"
)

// 工单告警的数据库客户端
type Client struct {
	DB *gorm.DB
}

func New(data *db.Data) Interface { return &Client{DB: data.DB} }

// 创建
func (c *Client) Create(ctx context.Context, alarm *model.WorkOrderAlarm) error {
	return c.DB.WithContext(ctx).Create(alarm).Error
}

// 获取需要发送用户通知的工单告警
func (c *Client) ListForNotification(ctx context.Context, now time.Time, days int, limit int) (result []model.WorkOrderAlarm, err error) {
	err = c.DB.WithContext(ctx).Model(&model.WorkOrderAlarm{}).
		// 只关联责任人不为空的工单
		Joins("JOIN work_order ON work_order.work_order_id = work_order_alarms.work_order_id").
		Where("work_order.responsible_uid != ''").
		Where(
			clause.Or(
				// 临期告警
				clause.And(
					// 截至日期早于当前时间，需要告警
					&clause.Lte{Column: "deadline", Value: now},
					// 未发送过临期告警
					clause.Or(
						// 上次发送告警时间为 NULL，代表未发送过告警
						&clause.Eq{Column: "last_notified_at"},
						// 上次发送告警时间为 NULL，代表上次发送的是提前告警，而不是临期告警
						&clause.Lt{Column: "last_notified_at", Value: clause.Column{Name: "deadline"}},
					),
				),
				// 提前告警
				clause.And(
					// （截止日期 - 提前天数） ≤ 现在 ＜ 截止日期
					&clause.Lte{Column: "deadline", Value: now.AddDate(0, 0, days)}, &clause.Gt{Column: "deadline", Value: now},
					// 最近 1 天，未发送过提前告警，因为提前告警每天发送一次
					clause.Or(
						// 上次发送告警时间为 NULL，代表未发送过告警
						&clause.Eq{Column: "last_notified_at"},
						// 上次发送告警时间早于一天前，代表最近一天没有发送过告警
						&clause.Lte{Column: "last_notified_at", Value: now.AddDate(0, 0, -1)},
					),
				),
			),
		).
		Find(&result).Error
	return
}

// 获取需要发送的截止告警
func (c *Client) ListForDeadline(ctx context.Context, now time.Time, limit int) ([]model.WorkOrderAlarm, error) {
	var records []model.WorkOrderAlarm
	if err := c.DB.WithContext(ctx).
		Model(&model.WorkOrderAlarm{}).
		// 截止时间早于当前时间的工单需要告警
		Where("deadline < ?", now).
		// NULL 代表从未发过告警
		Where("last_deadline_at IS NULL").
		Limit(limit).
		Find(&records).
		Error; err != nil {
		return nil, err
	}
	return records, nil
}

// 获取需要发送的提前告警，days 是提前的天数，以输入参数 now 所在时区计算“天”
//
// 截止日期 03-10，提前 3 天告警。03-07、03-08、03-09 三天需要告警
func (c *Client) ListForBeforehand(ctx context.Context, now time.Time, limit int, days int) ([]model.WorkOrderAlarm, error) {
	var records []model.WorkOrderAlarm
	if err := c.DB.WithContext(ctx).
		Model(&model.WorkOrderAlarm{}).
		Where(clause.And(
			// 应该发告警：(deadline - days) ≤ now < deadline
			&clause.Lte{Column: "deadline", Value: now.AddDate(0, 0, days)},
			&clause.Gt{Column: "deadline", Value: now},
			clause.Or(
				// 从未发过告警
				&clause.Eq{Column: "last_beforehand_at"},
				// 一天内未发过告警
				&clause.Lt{Column: "last_beforehand_at", Value: now.AddDate(0, 0, -1)},
			),
		)).
		Limit(limit).
		Find(&records).Error; err != nil {
		return nil, err
	}
	c.DB.Clauses(&clause.Where{})
	return records, nil
}

// 更新截止日期
func (c *Client) UpdateDeadlineByWorkOrderID(ctx context.Context, workOrderID uuid.UUID, deadline time.Time) error {
	return c.DB.WithContext(ctx).
		Model(&model.WorkOrderAlarm{}).
		Where(&model.WorkOrderAlarmSpec{WorkOrderID: workOrderID}).
		Updates(&model.WorkOrderAlarmSpec{Deadline: deadline}).
		Error
}

// 更新上次发送用户通知的时间
func (c *Client) UpdateLastNotifiedAt(ctx context.Context, id uuid.UUID, now time.Time) error {
	return c.DB.WithContext(ctx).
		Model(&model.WorkOrderAlarm{}).
		Where(&model.Metadata{ID: id}).
		Updates(&model.WorkOrderAlarmStatus{LastNotifiedAt: ptr.To(now)}).
		Error
}

// 删除，根据工单 ID
func (c *Client) DeleteByWorkOrderID(ctx context.Context, workOrderID uuid.UUID) error {
	return c.DB.WithContext(ctx).
		Model(&model.WorkOrderAlarm{}).
		Where(&model.WorkOrderAlarmSpec{WorkOrderID: workOrderID}).
		Delete(&model.WorkOrderAlarm{}).
		Limit(1).
		Error
}

var _ Interface = &Client{}
