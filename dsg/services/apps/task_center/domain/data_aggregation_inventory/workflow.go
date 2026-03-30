package data_aggregation_inventory

import (
	"context"
	"errors"
	"fmt"

	"go.uber.org/zap"

	configuration_center_v1 "github.com/kweaver-ai/idrm-go-common/api/configuration-center/v1"
	task_center_v1 "github.com/kweaver-ai/idrm-go-common/api/task_center/v1"
	"github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
	"github.com/kweaver-ai/idrm-go-common/workflow"
	"github.com/kweaver-ai/idrm-go-common/workflow/common"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

const (
	ID                          = "id"
	WorkflowApplyMsgDataKeyCode = "code"
	WorkflowApplyMsgDataKeyName = "name"
)

func (d *domain) registerConsumeHandlers(wf workflow.WorkflowInterface) {
	wf.RegistConusmeHandlers(
		string(configuration_center_v1.AuditTypeTasksDataAggregationInventoryRequest),
		nil,
		d.consumeAuditResultMsg,
		d.consumeAuditProcDefDelMsg,
	)
}

// 生产 workflow 消息：数据归集清单申请
func (d *domain) produceAuditApplyMsg(ctx context.Context, inventory *task_center_v1.DataAggregationInventory) error {
	auditType := "af-data-aggregation-inventory"

	// 获取审核流程绑定
	bind, err := d.accessControlService.GetProcessBindByAuditType(ctx, &configuration_center.GetProcessBindByAuditTypeReq{AuditType: auditType})
	if err != nil {
		return err
	}
	if bind.AuditType == "" {
		return errors.New("audit process bind not found")
	}
	// 生成审核消息
	msg := &common.AuditApplyMsg{
		Process: common.AuditApplyProcessInfo{
			AuditType:  auditType,
			ApplyID:    inventory.ApplyID,
			UserID:     inventory.RequesterID,
			UserName:   d.aggregateUserName(ctx, inventory.RequesterID),
			ProcDefKey: bind.ProcDefKey,
		},
		Data: map[string]any{
			ID:                          inventory.ID,
			WorkflowApplyMsgDataKeyCode: inventory.Code,
			WorkflowApplyMsgDataKeyName: inventory.Name,
		},
		Workflow: common.AuditApplyWorkflowInfo{
			TopCsf: 5,
			AbstractInfo: common.AuditApplyAbstractInfo{
				Text: "归集清单 " + inventory.Name,
			},
		},
	}
	// 生产审核消息
	return d.workflow.AuditApply(msg)
}

// 消费 workflow 消息：审核结果
func (d *domain) consumeAuditResultMsg(ctx context.Context, msg *common.AuditResultMsg) error {
	switch msg.Result {
	case "pass":
		// TODO: 检查的状态是否匹配
		return d.dataAggregationInventory.UpdateStatusByApplyID(ctx, msg.ApplyID, task_center_v1.DataAggregationInventoryCompleted)
	case "undone":
		// TODO: 检查的状态是否匹配
		return d.dataAggregationInventory.UpdateStatusByApplyID(ctx, msg.ApplyID, task_center_v1.DataAggregationInventoryDraft)
	case "reject":
		// TODO: 检查的状态是否匹配
		return d.dataAggregationInventory.UpdateStatusByApplyID(ctx, msg.ApplyID, task_center_v1.DataAggregationInventoryReject)
	default:
		return fmt.Errorf("unsupported result: %v", msg.Result)
	}
}

// 消费 workflow 消息：审核流程被删除
func (d *domain) consumeAuditProcDefDelMsg(ctx context.Context, msg *common.AuditProcDefDelMsg) error {
	log.Debug("consume audit proc def del message", zap.Any("msg", msg))
	if err := d.dataAggregationInventory.UpdateByStatus(ctx, task_center_v1.DataAggregationInventoryAuditing, func(inventory *task_center_v1.DataAggregationInventory) error {
		if inventory.Status != task_center_v1.DataAggregationInventoryAuditing {
			log.Warn("忽略非指定状态的数据归集清单", zap.Any("inventory", inventory))
			return nil
		}
		inventory.Status = task_center_v1.DataAggregationInventoryDraft
		return nil
	}); err != nil {
		return err
	}
	return nil
}
