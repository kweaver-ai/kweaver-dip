package impl

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-common/workflow/common"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/samber/lo"
	"go.uber.org/zap"
	"time"
)

// ConsumerWorkflowAuditMsg 处理审核中的消息
func (u *useCaseImpl) ConsumerWorkflowAuditMsg(ctx context.Context, msg *common.AuditProcessMsg) error {
	log.Info("consumer workflow audit process msg", zap.String("audit_type", msg.ProcessDef.Category), zap.Any("msg", fmt.Sprintf("%#v", msg)))
	auditForm := &model.TDwhAuthRequestForm{
		ID:        parseApplyID(msg.ProcessInputModel.Fields.ApplyID),
		UpdatedAt: time.Now(),
	}
	if msg.CurrentActivity == nil {
		log.Info("audit result auto finished, do nothing", zap.String("apply_id", msg.ProcessInputModel.Fields.ApplyID))
	} else if len(msg.NextActivity) == 0 {
		if !msg.ProcessInputModel.Fields.AuditIdea {
			auditForm.Phase = constant.AUDIT_REJECT
			auditForm.Message = *msg.GetAuditMsg()
		}
	} else {
		if msg.ProcessInputModel.Fields.AuditIdea {
			//当前节点审核通过，暂不落库
			log.Info("current node audit pass: ", zap.String("apply_id", msg.ProcessInputModel.Fields.ApplyID))
		} else {
			auditForm.Phase = constant.AUDIT_REJECT
			auditForm.Message = *msg.GetAuditMsg()
		}
	}
	if auditForm.Phase == "" {
		return nil
	}
	//更新状态
	if err := u.repo.UpdateRequestPhaseAndMsg(ctx, auditForm); err != nil {
		log.Error("update auditing status error: ", zap.Error(err))
	}
	return nil
}

func (u *useCaseImpl) ConsumerWorkflowAuditResultRequest(ctx context.Context, msg *common.AuditResultMsg) error {
	auditForm := &model.TDwhAuthRequestForm{
		ID:      parseApplyID(msg.ApplyID),
		Phase:   msg.Result,
		Message: "",
	}
	log.Info("consumer workflow audit result msg", zap.String("auditForm", string(lo.T2(json.Marshal(auditForm)).A)), zap.Any("msg", fmt.Sprintf("%#v", msg)))
	//保存结果
	if err := u.repo.UpdateRequestPhaseAndMsg(ctx, auditForm); err != nil {
		log.Error("update audited status error: ", zap.Error(err))
		return err
	}
	// 只需要处理 Approved 的 LogicViewAuthorizingRequest
	if auditForm.Phase != constant.AUDIT_PASS {
		return nil
	}
	//生成或更新行列规则,添加授权
	authReqDetail, err := u.Get(ctx, auditForm.ID)
	if err != nil {
		log.Error("get auth request detail error: ", zap.Error(err))
		return err
	}
	return u.UpsertUserMonopolySubView(ctx, authReqDetail)
}

func (u *useCaseImpl) ConsumerWorkflowAuditProcDeleteRequest(ctx context.Context, msg *common.AuditProcDefDelMsg) error {
	log.Error("consumerWorkflowAuditProcDeleteRequest msg : ", zap.Any("msg", string(lo.T2(json.Marshal(msg)).A)))
	if len(msg.ProcDefKeys) == 0 {
		return nil
	}
	// 撤销正在进行的审核
	authRequest := &model.TDwhAuthRequestForm{
		Phase:     constant.AUDIT_REJECT,
		Message:   "workflow审核流程被删除，审核撤销",
		UpdatedAt: time.Now(),
	}
	err := u.repo.DeleteByAuditTypeKey(ctx, authRequest, func() error {
		return u.DeleteAuditPolicy(ctx, constant.DWHDataAuthRequestForm)
	})
	if err != nil {
		log.Error("ConsumerWorkflowAuditProcDeleteRequest error: ", zap.Error(err))
		return err
	}
	return nil
}
