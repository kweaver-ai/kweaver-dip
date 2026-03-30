package controller

import (
	"bytes"
	"context"
	"html/template"
	"strings"
	"time"

	"github.com/google/uuid"
	"go.uber.org/zap"
	"k8s.io/utils/clock"

	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/alarm_rule"
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/notification"
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/user_single"
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/work_order_alarm"
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/work_order_single"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-common/callback"
	asset_portal_v1 "github.com/kweaver-ai/idrm-go-common/callback/asset_portal/v1"
	"github.com/kweaver-ai/idrm-go-common/util/ptr"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/transport"
)

// 工单告警控制器，负责根据工单告警 WorkOrderAlarm 创建用户通知 Notification
type WorkOrderAlarmController struct {
	AlarmRule      alarm_rule.Interface
	Notification   notification.Interface
	WorkOrder      work_order_single.Interface
	WorkOrderAlarm work_order_alarm.Interface
	User           user_single.Interface
	// 集成开发提供的消息通知回调
	CallbackNotification asset_portal_v1.NotificationServiceClient

	clock   clock.WithTicker
	cancel  context.CancelFunc // Stop 通过调用 cancel 结束业务逻辑
	stopped chan struct{}      // Start 退出时关闭这个 channel
}

var _ transport.Server = &WorkOrderAlarmController{}

// 创建工单告警控制器
func NewWorkOrderAlarm(
	AlarmRule alarm_rule.Interface,
	Notification notification.Interface,
	WorkOrder work_order_single.Interface,
	WorkOrderAlarm work_order_alarm.Interface,
	User user_single.Interface,
	Callback callback.Interface,
) *WorkOrderAlarmController {
	return &WorkOrderAlarmController{
		AlarmRule:            AlarmRule,
		Notification:         Notification,
		WorkOrder:            WorkOrder,
		WorkOrderAlarm:       WorkOrderAlarm,
		User:                 User,
		CallbackNotification: Callback.AssetPortalV1().Notification(),
		clock:                clock.RealClock{},
	}
}

// Start implements transport.Server.
func (c *WorkOrderAlarmController) Start(ctx context.Context) error {
	c.stopped = make(chan struct{})
	defer close(c.stopped)

	ctx, c.cancel = context.WithCancel(ctx)
	defer c.cancel()

	ticker := c.clock.NewTicker(time.Minute)

	for {
		select {
		// context 结束，视为正常行为，返回 nil
		case <-ctx.Done():
			return nil
		case <-ticker.C():
			log.Debug("reconcile work order alarms")
			if err := c.Reconcile(ctx); err != nil {
				log.Warn("reconcile deadline fail", zap.Error(err))
			}
		}
	}
}

// Stop implements transport.Server.
func (c *WorkOrderAlarmController) Stop(ctx context.Context) error {
	c.cancel()

	// 等待优雅结束
	select {
	case <-ctx.Done():
		return ctx.Err()
	case <-c.stopped:
		return nil
	}
}

// Reconcile 根据工单告警 WorkOrderAlarm 创建用户通知 Notification
func (c *WorkOrderAlarmController) Reconcile(ctx context.Context) error {
	// 获取告警规则
	log.Debug("get alarm rule by type", zap.Any("type", model.AlarmRuleDataQuality))
	r, err := c.AlarmRule.GetByType(ctx, model.AlarmRuleDataQuality)
	if err != nil {
		return err
	}
	log.Debug("get alarm rule by type", zap.Any("type", model.AlarmRuleDataQuality), zap.Any("rule", r))

	// 如果告警规则中的消息不是预定义的格式，记录 Warn 日志。与告警规则协商如何
	// 解析占位符、渲染消息。
	if r.DeadlineReminder != predefinedDeadlineReminder {
		log.Warn("undefined deadline reminder format", zap.String("reminder", r.DeadlineReminder))
	}
	if r.BeforehandReminder != predefinedBeforehandReminder {
		log.Warn("undefined beforehand reminder format", zap.String("reminder", r.BeforehandReminder))
	}

	// 获取需要处理的工单告警
	alarms, err := c.WorkOrderAlarm.ListForNotification(ctx, c.clock.Now(), r.BeforehandTime, 1<<10)
	if err != nil {
		return err
	}

	// 如果没有需要处理的告警则退出
	if len(alarms) == 0 {
		log.Debug("no work order alarms to reconcile")
		return nil
	}

	for _, a := range alarms {
		log.Debug("reconcile work order alarm", zap.Any("alarm", a))

		// 获取告警对应的工单
		log.Debug("get work order by id", zap.Any("id", a.Spec.WorkOrderID))
		o, err := c.WorkOrder.GetByWorkOrderID(ctx, a.Spec.WorkOrderID)
		if err != nil {
			return err
		}

		// 生成工单告警对应的消息
		n, err := newNotificationForWorkOrderAlarm(o, c.clock.Now(), a.Spec.Deadline)
		if err != nil {
			return err
		}

		// 如果工单告警对应的用户通知已经存在，则不创建用户通知
		log.Debug("check notification existence by work order id and index", zap.Any("workOrderID", n.Spec.WorkOrderID), zap.Any("index", n.Spec.WorkOrderAlarmIndex))
		ok, err := c.Notification.CheckExistenceByWorkOrderIDAndWorkOrderAlarmIndex(ctx, n.Spec.WorkOrderID, ptr.Deref(n.Spec.WorkOrderAlarmIndex, 0))
		if err != nil {
			return err
		}
		if ok {
			log.Debug("notification for work order alarm already exists", zap.Any("workOrderID", n.Spec.WorkOrderID), zap.Any("index", n.Spec.WorkOrderAlarmIndex))
			// 更新告警的状态，记录工单告警已经成功处理
			log.Info("update work order alarm's last notified at", zap.Any("id", a.Metadata.ID))
			c.WorkOrderAlarm.UpdateLastNotifiedAt(ctx, a.Metadata.ID, c.clock.Now())
			continue
		}

		// 创建用户通知。如果工单告警对应的用户通知已经存在，则忽略错误
		log.Info("create notification for work order alarm", zap.Any("notification", n))
		if err := c.Notification.Create(ctx, n); notification.IsAlreadyExistsForWorkOrderAlarm(err) {
			log.Debug("notification for work order alarm already exists", zap.Any("id", a.ID), zap.Any("notification", n))
		} else if err != nil {
			return err
		}

		// 获取收件人的手机号，用于调用集成开发的回调服务
		log.Debug("get recipient phone number", zap.Stringer("id", n.Spec.RecipientID))
		phoneNumber, err := c.User.GetPhoneNumber(ctx, n.Spec.RecipientID.String())
		if err != nil {
			return err
		}
		if phoneNumber == "" {
			log.Warn("recipient phone number is missing", zap.Stringer("id", n.Spec.RecipientID))
		}

		// 集成开发只需要纯文本，不需要格式化，所以移除消息中 <a> 等标签
		notificationWithoutLabel := &asset_portal_v1.Notification{
			PhoneNumber: phoneNumber,
			Message:     labelRemover.Replace(n.Spec.Message),
		}
		log.Info("invoke callback", zap.Any("notification", notificationWithoutLabel))
		if _, err := c.CallbackNotification.Create(ctx, notificationWithoutLabel); err != nil {
			log.Warn("invoke callback fail", zap.Error(err), zap.Any("notification", notificationWithoutLabel))
		}

		// 更新告警的状态，记录已经成功处理
		log.Info("update work order alarm's last notified at", zap.Any("id", a.Metadata.ID))
		if err := c.WorkOrderAlarm.UpdateLastNotifiedAt(ctx, a.Metadata.ID, c.clock.Now()); err != nil {
			return err
		}
	}

	return nil
}

func newNotificationForWorkOrderAlarm(order *model.WorkOrderSingle, now, deadline time.Time) (*model.Notification, error) {
	// 当前时间在工单的截止日期之前，发送提前告警，否则发送临期告警
	var tpl = deadlineTpl
	if now.Before(deadline) {
		tpl = beforehandTpl
	}

	index := diffDaysCeil(now, deadline)

	// 渲染用户通知的内容
	var buf bytes.Buffer
	if err := tpl.Execute(&buf, &workOrderAlarmNotificationMessageValue{
		Name: order.Name,
		Code: order.Code,
		Days: index,
	}); err != nil {
		return nil, err
	}

	return &model.Notification{
		Metadata: model.Metadata{
			ID:        uuid.Must(uuid.NewV7()),
			CreatedAt: now,
			UpdatedAt: now,
		},
		Spec: model.NotificationSpec{
			RecipientID:         order.ResponsibleUID,
			Reason:              model.NotificationReasonDataQualityWorkOrderAlarm,
			Message:             buf.String(),
			WorkOrderID:         order.WorkOrderID,
			WorkOrderAlarmIndex: ptr.To(index),
		},
		Status: model.NotificationStatus{
			Read: ptr.To(false),
		},
	}, nil
}

var (
	deadlineTpl   = template.Must(template.New("deadline").Parse(`【<a><b>{{ .Name }}</b>({{ .Code }})</a>】已到截止时间，请及时处理！`))
	beforehandTpl = template.Must(template.New("beforehand").Parse(`【<a><b>{{ .Name }}</b>({{ .Code }})</a>】<c>距离截止日期仅剩 {{ .Days }} 天</c>，请及时处理！`))
	// 移除消息通知中的标签，在调用集成开发的回调时使用
	labelRemover = strings.NewReplacer("<a>", "", "</a>", "", "<b>", "", "</b>", "", "<c>", "", "</c>", "")
)

const (
	predefinedDeadlineReminder   string = "【工单名称(工单编号)】 已到截止时间，请及时处理！"
	predefinedBeforehandReminder string = "【工单名称(工单编号)】 距离截止日期仅剩 X 天，请及时处理！"
)

// 用于填充工单告警对应的用户消息的值
type workOrderAlarmNotificationMessageValue struct {
	// 工单名称
	Name string `json:"name,omitempty"`
	// 工单编号
	Code string `json:"code,omitempty"`
	// 剩余天数
	Days int `json:"days,omitempty"`
}

// diffDaysCeil 计算两个时间相差多少天向上取整
func diffDaysCeil(now, finishedAt time.Time) int {
	d := finishedAt.Sub(now)
	days := int(d / time.Hour / 24)
	if d%(time.Hour*24) != 0 {
		days++
	}
	return days
}
