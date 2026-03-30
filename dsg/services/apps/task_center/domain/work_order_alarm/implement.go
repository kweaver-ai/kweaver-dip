package work_order_alarm

import (
	"context"

	"github.com/google/uuid"
	"go.uber.org/zap"

	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/alarm_rule"
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/work_order_alarm"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
	meta_v1 "github.com/kweaver-ai/idrm-go-common/api/meta/v1"
	task_v1 "github.com/kweaver-ai/idrm-go-common/api/task_center/v1"
	"github.com/kweaver-ai/idrm-go-common/reconcile"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

type Domain struct {
	// 数据库表 alarm_rule
	AlarmRule alarm_rule.Interface
	// 数据库表 work_order_alarm
	WorkOrderAlarms work_order_alarm.Interface
}

func New(
	AlarmRule alarm_rule.Interface,
	WorkOrderAlarms work_order_alarm.Interface,
) Interface {
	return &Domain{
		AlarmRule:       AlarmRule,
		WorkOrderAlarms: WorkOrderAlarms,
	}
}

// WorkOrderReconciler implements Interface.
func (d *Domain) WorkOrderReconciler() reconcile.Reconciler[task_v1.WorkOrder] {
	return &WorkOrderReconciler{
		AlarmRule:       d.AlarmRule,
		WorkOrderAlarms: d.WorkOrderAlarms,
	}
}

var _ Interface = &Domain{}

// 处理工单 WorkOrder 消息的 Reconciler。根据工单 WorkOrder 创建、删除工单告警
// WorkOrderAlarm
type WorkOrderReconciler struct {
	// 数据库表 alarm_rule
	AlarmRule alarm_rule.Interface
	// 数据库表 work_order_alarm
	WorkOrderAlarms work_order_alarm.Interface
}

// Reconcile implements reconcile.Reconciler.
func (w *WorkOrderReconciler) Reconcile(ctx context.Context, event *meta_v1.WatchEvent[task_v1.WorkOrder]) error {
	log.Debug("reconcile work order", zap.Any("event", event))
	workOrderID, err := uuid.Parse(event.Resource.ID)
	if err != nil {
		return err
	}
	// 只有数据质量工单需要告警
	if event.Resource.Type != task_v1.WorkOrderDataQuality {
		log.Debug("Ignore non data quality work order", zap.Any("workOrder", event.Resource))
		return nil
	}

	switch event.Type {
	case meta_v1.Added:
		// 获取告警规则
		log.Debug("get alarm rule by type", zap.Any("type", model.AlarmRuleDataQuality))
		r, err := w.AlarmRule.GetByType(ctx, model.AlarmRuleDataQuality)
		if err != nil {
			return err
		}
		// 根据工单生成工单告警
		alarm := &model.WorkOrderAlarm{
			Metadata: model.Metadata{
				ID: uuid.Must(uuid.NewV7()),
			},
			Spec: model.WorkOrderAlarmSpec{
				WorkOrderID: workOrderID,
				Deadline:    event.Resource.CreatedAt.Time.AddDate(0, 0, r.DeadlineTime),
			},
		}
		// TODO: 区分工单 ID 冲突
		log.Info("create work order alarm for work order", zap.Any("alarm", alarm))
		return w.WorkOrderAlarms.Create(ctx, alarm)

	// 工单更新
	case meta_v1.Modified:
		// 只需要处理工单变更为已完成
		if event.Resource.Status != task_v1.WorkOrderStatusFinished {
			log.Debug("ignore work order not in finished status")
			return nil
		}
		// 已完成工单不需要告警，删除对应的 WorkOrderAlarm
		log.Info("delete work order alarm for finished work order", zap.Any("workOrderID", event.Resource.ID))
		return w.WorkOrderAlarms.DeleteByWorkOrderID(ctx, workOrderID)

	// 工单删除
	case meta_v1.Deleted:
		log.Info("delete work order alarm for deleted work order", zap.Any("workOrderID", event.Resource.ID))
		return w.WorkOrderAlarms.DeleteByWorkOrderID(ctx, workOrderID)
	default:
		log.Warn("unsupported watch event type", zap.Any("event", event))
		// 返回 nil 为了忽略这个消息继续消费
		return nil
	}
}

var _ reconcile.Reconciler[task_v1.WorkOrder] = &WorkOrderReconciler{}
