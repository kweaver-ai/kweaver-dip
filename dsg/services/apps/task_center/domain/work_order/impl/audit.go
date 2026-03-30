package impl

import (
	"context"
	"encoding/json"

	"go.uber.org/zap"

	work_order "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/work_order"
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/workflow"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/errorcode"
	domain "github.com/kweaver-ai/dsg/services/apps/task_center/domain/work_order"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-common/util/sets"
	wf_common "github.com/kweaver-ai/idrm-go-common/workflow/common"
	"github.com/kweaver-ai/idrm-go-frame/core/enum"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

func (w *workOrderUseCase) WorkOrderAuditResultMsgProc(ctx context.Context, msg *wf_common.AuditResultMsg) (err error) {
	// 获取最终结果的消息处理
	var (
		workOrders              []*model.WorkOrder
		workOrderID, auditRecID uint64
	)
	workOrderID, auditRecID, err = ParseAuditApplyID(msg.ApplyID)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to parse audit result apply_id: %s, err: %v", msg.ApplyID, err)
		return err
	}

	if workOrders, err = w.repo.GetByUniqueIDs(ctx, []uint64{workOrderID}); err != nil {
		log.WithContext(ctx).
			Errorf("get workOrder: %d failed, error info: %v",
				workOrderID, err)
		return err
	}
	if len(workOrders) == 0 {
		log.WithContext(ctx).
			Warnf("workOrder: %d not found, ignore it",
				workOrderID)
		return nil
	}

	if !(workOrders[0].AuditID != nil && *workOrders[0].AuditID == auditRecID) {
		log.WithContext(ctx).
			Warnf("workOrder: %d audit: %d not found, ignore it",
				workOrderID, auditRecID)
		return nil
	}
	switch msg.Result {
	case domain.AuditStatusPass.String:
		workOrders[0].AuditStatus = domain.AuditStatusPass.Integer.Int32()
	case domain.AuditStatusReject.String:
		workOrders[0].AuditStatus = domain.AuditStatusReject.Integer.Int32()
	case domain.AuditStatusUndone.String:
		workOrders[0].AuditStatus = domain.AuditStatusUndone.Integer.Int32()
	default:
		log.WithContext(ctx).Warnf("unknown audit result type: %s, ignore it", msg.Result)
		return nil
	}
	if workOrders[0].Type == domain.WorkOrderTypeDataQuality.Integer.Int32() {
		if workOrders[0].AuditStatus == domain.AuditStatusPass.Integer.Int32() {
			workOrders[0].Status = domain.WorkOrderStatusFinished.Integer.Int32()
			alarmRuleInfo, err := w.GetAlarmRule(ctx)
			if err != nil {
				return err
			}
			if alarmRuleInfo != nil {
				deadline := workOrders[0].CreatedAt.AddDate(0, 0, int(alarmRuleInfo.DeadlineTime))
				workOrders[0].FinishedAt = &deadline
			}
		}
	}
	err = w.repo.Update(ctx, workOrders[0])
	if err != nil {
		return err
	}

	// 调用工单回调
	switch msg.Result {
	// 审核通过
	case domain.AuditStatusPass.String:
		if err := w.callback.OnApproved(ctx, workOrders[0]); err != nil {
			log.Warn("WorkOrder Callback OnApproved fail", zap.Error(err), zap.Any("workOrder", workOrders[0]))
		}

	// 其他结果没有对应的回调
	default:
	}

	return nil

}

func (w *workOrderUseCase) WorkOrderAuditProcessMsgProc(ctx context.Context, msg *wf_common.AuditProcessMsg) (err error) {
	// 获取审核原因的消息处理
	var (
		workOrders              []*model.WorkOrder
		workOrderID, auditRecID uint64
	)
	workOrderID, auditRecID, err = ParseAuditApplyID(msg.ProcessInputModel.Fields.ApplyID)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to parse audit result apply_id: %s, err: %v", msg.ProcessInputModel.Fields.ApplyID, err)
		return err
	}

	if workOrders, err = w.repo.GetByUniqueIDs(ctx, []uint64{workOrderID}); err != nil {
		log.WithContext(ctx).
			Errorf("get workOrder: %d failed, error info: %v",
				workOrderID, err)
		return err
	}

	if len(workOrders) == 0 {
		log.WithContext(ctx).
			Warnf("workOrder: %d not found, ignore it",
				workOrderID)
		return nil
	}

	if !(workOrders[0].AuditID != nil && *workOrders[0].AuditID == auditRecID) {
		log.WithContext(ctx).
			Warnf("workOrder: %d audit: %d not found, ignore it",
				workOrderID, auditRecID)
		return nil
	}

	// if workOrders[0].AuditStatus != domain.AuditStatusAuditing.Integer.Int32() {
	// 	log.WithContext(ctx).
	// 		Warnf("workOrder: %d status is not AUDITING, ignore it", workOrders[0].ID)
	// 	return nil
	// }

	if msg.ProcessInputModel.Fields.AuditIdeaV2 != nil && !*msg.ProcessInputModel.Fields.AuditIdeaV2 {
		workOrders[0].AuditStatus = domain.AuditStatusReject.Integer.Int32()
		workOrders[0].AuditDescription = GetAuditAdvice(msg.ProcessInputModel.WFCurComment, msg.ProcessInputModel.Fields.AuditMsg)
		err = w.repo.Update(ctx, workOrders[0])
		if err != nil {
			return err
		}

	}
	return nil
}

func (w *workOrderUseCase) Cancel(ctx context.Context, id string) (err error) {
	// 查询是否可以取消,只有审核状态为审核中的可以撤回
	workOrder, err := w.repo.GetById(ctx, id)
	if err != nil {
		return err
	}
	// 只有审核状态为审核中的可以撤回
	if workOrder.AuditStatus != domain.AuditStatusAuditing.Integer.Int32() {
		return errorcode.Desc(errorcode.WorkOrderUndoError)
	}

	if err = w.wf.AuditCancel(
		&wf_common.AuditCancelMsg{
			ApplyIDs: []string{GenAuditApplyID(workOrder.ID, *workOrder.AuditID)},
			Cause: struct {
				ZHCN string "json:\"zh-cn\""
				ZHTW string "json:\"zh-tw\""
				ENUS string "json:\"en-us\""
			}{
				ZHCN: "revocation",
				ZHTW: "revocation",
				ENUS: "revocation",
			},
		},
	); err != nil {
		log.WithContext(ctx).Errorf("send undo audit instance message error %v", err)
		return errorcode.Detail(errorcode.InternalError, err)
	}
	workOrder.AuditStatus = domain.AuditStatusUndone.Integer.Int32() //审核状态更改为已撤回
	err = w.repo.Update(ctx, workOrder)
	if err != nil {
		return err
	}
	return nil
}

func (w *workOrderUseCase) AuditList(ctx context.Context, query *domain.AuditListGetReq) (*domain.WorkOrderAuditListResp, error) {
	var (
		err    error
		audits *workflow.AuditResponse
	)
	auditType := auditTypeForWorkOrderType(enum.ToInteger[domain.WorkOrderType](query.Type).Int32())
	audits, err = w.wfRest.GetList(ctx, workflow.WorkflowListType(query.Target), []string{auditType}, query.Offset, query.Limit, query.Keyword)
	if err != nil {
		log.WithContext(ctx).Errorf("uc.workflow.GetList failed: %v", err)
		return nil, errorcode.Detail(errorcode.InternalError, err)
	}
	resp := &domain.WorkOrderAuditListResp{}
	resp.TotalCount = audits.TotalCount
	resp.Entries = make([]*domain.WorkOrderAuditInfo, 0, len(audits.Entries))
	for i := range audits.Entries {
		data := domain.Data{}
		a := audits.Entries[i].ApplyDetail.Data
		if err = json.Unmarshal([]byte(a), &data); err != nil {
			return nil, err
		}
		resp.Entries = append(resp.Entries,
			&domain.WorkOrderAuditInfo{
				ApplyTime:     audits.Entries[i].ApplyTime,
				ApplyUserName: audits.Entries[i].ApplyUserName,
				ProcInstID:    audits.Entries[i].ID,
				TaskID:        audits.Entries[i].ProcInstID,
				ID:            data.Id,
				Name:          data.Title,
				Type:          data.Type,
			},
		)
	}
	return resp, nil
}

// 数据归集工单审核消费者，处理 Workflow 发送的审核消息
type dataAggregationWorkOrderAuditConsumer struct {
	// 数据库表 work_order
	r work_order.Repo
	// 回调
	callback *WorkOrderCallback
}

// onProcess 处理数据归集工单的处理消息
func (c *dataAggregationWorkOrderAuditConsumer) onProcess(ctx context.Context, msg *wf_common.AuditProcessMsg) error {
	log.Debug("receive audit process msg", zap.Any("msg", msg))
	// 忽略缺少审核结果的消息
	if msg.ProcessInputModel.Fields.AuditIdeaV2 == nil {
		log.Debug("audit idea is nil")
		return nil
	}
	// 忽略缺少审核意见的消息
	if msg.ProcessInputModel.Fields.AuditMsg == "" {
		log.Debug("audit message is missing")
		return nil
	}

	// 解析 ApplyID 得到 WorkOrderID 和 AuditID
	workOrderID, auditID, err := ParseAuditApplyID(msg.ProcessInputModel.Fields.ApplyID)
	if err != nil {
		log.Warn("parse audit apply id fail", zap.Error(err), zap.String("applyID", msg.ProcessInputModel.Fields.ApplyID))
		// 忽略不合法的 ApplyID 继续消费其他消息
		return nil
	}

	var s = domain.AuditStatusReject.Integer.Int32()
	if *msg.ProcessInputModel.Fields.AuditIdeaV2 {
		s = domain.AuditStatusPass.Integer.Int32()
	}

	log.Info("update work order audit status and audit description", zap.Uint64("workOrderID", workOrderID), zap.Uint64("auditID", auditID), zap.Int32("auditStatus", s), zap.String("auditDescription", msg.ProcessInputModel.WFCurComment))
	if err := c.r.UpdateAuditStatusAndAuditDescriptionByIDAndAuditID(ctx, workOrderID, auditID, s, msg.ProcessInputModel.WFCurComment); err != nil {
		log.Info("update work order audit status and audit description fail", zap.Error(err), zap.Uint64("workOrderID", workOrderID), zap.Uint64("auditID", auditID), zap.Int32("auditStatus", s), zap.String("auditDescription", msg.ProcessInputModel.WFCurComment))
		return err
	}

	return nil
}

// onResult 处理数据归集工单的结果
func (c *dataAggregationWorkOrderAuditConsumer) onResult(ctx context.Context, msg *wf_common.AuditResultMsg) error {
	log.Info("receive audit result msg", zap.Any("msg", msg))

	// 解析 ApplyID 得到 WorkOrderID 和 AuditID
	workOrderID, auditID, err := ParseAuditApplyID(msg.ApplyID)
	if err != nil {
		log.Warn("parse audit apply id fail", zap.Error(err), zap.String("applyID", msg.ApplyID))
		// 忽略不合法的 ApplyID 继续消费其他消息
		return nil
	}

	// 根据 Workflow 审核结果更新工单审核状态
	if err := c.r.UpdateAuditStatusByIDAndAuditID(ctx, workOrderID, auditID, enum.ToInteger[domain.AuditStatus](msg.Result).Int32()); err != nil {
		return err
	}

	// 调用回调接口
	switch msg.Result {
	case domain.AuditStatusAuditing.String:
	case domain.AuditStatusUndone.String:
	// 工单通过审批
	case domain.AuditStatusPass.String:
		if err := c.callback.OnApprovedForSonyflakeID(ctx, workOrderID); err != nil {
			log.Warn("WorkOrder Callback OnApproved fail", zap.Error(err), zap.Any("sonyflakeID", workOrderID))
		}
	case domain.AuditStatusReject.String:
	case domain.AuditStatusNone.String:
	default:
		// 忽略不支持的类型，记录日志，返回 nil，继续消费其他消息
		log.Warn("unsupported audit result", zap.Any("result", msg.Result))
	}

	return nil
}

// onProcDefDel 处理数据归集工单审核流程被删除的消息
func (c *dataAggregationWorkOrderAuditConsumer) onProcDefDel(ctx context.Context, msg *wf_common.AuditProcDefDelMsg) error {
	log.Info("receive audit process definition deleted msg", zap.Any("msg", msg))
	// 审核流程被删除后，处于审核中的工单视为被撤销
	return c.r.UpdateAuditStatusByType(ctx, domain.AuditStatusAuditing.Integer.Int32(), domain.AuditStatusUndone.Integer.Int32())
}

// 创建阶段需要审核的工单类型
var workTypesOfCreationAudit = sets.New(
	domain.WorkOrderTypeDataAggregation.Integer.Int32(),
	domain.WorkOrderTypeDataComprehension.Integer.Int32(),
	domain.WorkOrderTypeDataFusion.Integer.Int32(),
	domain.WorkOrderTypeDataQualityAudit.Integer.Int32(),
	domain.WorkOrderTypeStandardization.Integer.Int32(),
	domain.WorkOrderTypeResearchReport.Integer.Int32(),
	domain.WorkOrderTypeDataCatalog.Integer.Int32(),
	domain.WorkOrderTypeFrontEndProcessors.Integer.Int32(),
)

func GetAuditAdvice(curComment, auditMsg string) string {
	auditAdvice := ""
	if len(curComment) > 0 {
		auditAdvice = curComment
	} else {
		auditAdvice = auditMsg
	}

	// workflow 里不填审核意见时默认是 default_comment, 排除这种情况
	if auditAdvice == "default_comment" {
		auditAdvice = ""
	}

	return auditAdvice
}
