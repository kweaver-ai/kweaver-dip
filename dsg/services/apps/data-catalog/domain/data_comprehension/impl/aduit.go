package impl

import (
	"context"
	"fmt"
	"strconv"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/data_comprehension"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	wf_common "github.com/kweaver-ai/idrm-go-common/workflow/common"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
)

func (c *ComprehensionDomainImpl) AuditProcessMsgProc(ctx context.Context, msg *wf_common.AuditProcessMsg) error {
	defer func() {
		if err := recover(); err != nil {
			log.WithContext(ctx).Error("[mq] AuditProcessMsgProc ", zap.Any("err", err))
		}
	}()
	log.WithContext(ctx).Infof("AuditProcessMsgProc", zap.Any("msg", msg))
	applyID, err := strconv.ParseUint(msg.ProcessInputModel.Fields.ApplyID, 10, 64)
	if err != nil {
		log.Error("ComprehensionDomainImpl AuditResult ParseUint", zap.Any("msg", fmt.Sprintf("%#v", msg)))
		return err
	}
	orgModel, err := c.repo.GetByAppId(ctx, applyID)
	if err != nil {
		log.Error("ComprehensionDomainImpl AuditResult GetByAppId", zap.Any("msg", fmt.Sprintf("%#v", msg)))
		return err
	}
	updateModel := &model.DataComprehensionDetail{
		CatalogID: orgModel.CatalogID,
		ApplyID:   applyID,
		UpdatedAt: &util.Time{
			Time: time.Now(),
		},
	}
	if !msg.ProcessInputModel.Fields.AuditIdea && len(msg.ProcessInputModel.WFCurComment) > 0 {
		updateModel.Status = data_comprehension.Refuse
		updateModel.AuditAdvice = msg.ProcessInputModel.WFCurComment
		if err = c.repo.Update(ctx, updateModel); err != nil {
			return err
		}
	}
	return nil

}
func (c *ComprehensionDomainImpl) AuditResult(ctx context.Context, auditType string, msg *wf_common.AuditResultMsg) error {
	defer func() {
		if err := recover(); err != nil {
			log.WithContext(ctx).Error("[mq] AuditResult ", zap.Any("err", err))
		}
	}()
	applyID, err := strconv.ParseUint(msg.ApplyID, 10, 64)
	if err != nil {
		log.Error("ComprehensionDomainImpl AuditResult ParseUint", zap.Any("msg", fmt.Sprintf("%#v", msg)))
		return err
	}
	orgModel, err := c.repo.GetByAppId(ctx, applyID)
	if err != nil {
		log.Error("ComprehensionDomainImpl AuditResult GetByAppId", zap.Any("msg", fmt.Sprintf("%#v", msg)))
		return err
	}
	updateModel := &model.DataComprehensionDetail{
		CatalogID: orgModel.CatalogID,
		ApplyID:   applyID,
		UpdatedAt: &util.Time{
			Time: time.Now(),
		},
	}
	switch msg.Result {
	case constant.WorkFlowAuditStatusPass: //审核通过
		updateModel.Status = data_comprehension.Comprehended
	case constant.WorkFlowAuditStatusReject: // 审核拒绝，结果为reject
		updateModel.Status = data_comprehension.Refuse
	case constant.WorkFlowAuditStatusUndone:
		updateModel.Status = data_comprehension.Refuse
	}

	if err = c.repo.Update(ctx, updateModel); err != nil {
		return err
	}

	return nil

}
func (c *ComprehensionDomainImpl) AuditProcessDelMsgProc(ctx context.Context, auditType string, msg *wf_common.AuditProcDefDelMsg) error {
	defer func() {
		if err := recover(); err != nil {
			log.WithContext(ctx).Error("[mq] AuditProcessDelMsgProc ", zap.Any("err", err))
		}
	}()
	updateModel := &model.DataComprehensionDetail{
		Status:      4,
		AuditAdvice: "流程删除，审核撤销",
	}
	if err := c.repo.UpdateByAuditType(ctx, msg.ProcDefKeys, updateModel); err != nil {
		return err
	}
	return nil
}
