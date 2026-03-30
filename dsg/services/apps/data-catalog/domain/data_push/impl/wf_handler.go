package impl

import (
	"context"
	"encoding/json"
	"errors"
	"strconv"
	"strings"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/common"
	domain "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/data_push"
	wf_common "github.com/kweaver-ai/idrm-go-common/workflow/common"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/samber/lo"
	"go.uber.org/zap"
)

func (u *useCase) RegisterWorkflowHandler() {
	u.wf.RegistConusmeHandlers(constant.AuditTypeDataPushAudit,
		common.HandlerFunc[wf_common.AuditProcessMsg](constant.AuditTypeDataPushAudit, u.handleAuditProcess),
		common.HandlerFunc[wf_common.AuditResultMsg](constant.AuditTypeDataPushAudit, u.handleAuditResult),
		common.HandlerFunc[wf_common.AuditProcDefDelMsg](constant.AuditTypeDataPushAudit, u.handleAuditDefDel),
	)
}

// handleAuditProcess 处理审核过程消息
func (u *useCase) handleAuditProcess(ctx context.Context, auditType string, msg *wf_common.AuditProcessMsg) error {
	defer func() {
		if err := recover(); err != nil {
			log.WithContext(ctx).Error("[mq] AuditProcessMsgProc ", zap.Any("err", err))
		}
	}()
	//不需要处理这种消息
	if msg.CurrentActivity == nil {
		return nil
	}
	dataPushModelID, err := parseDataPushModelID(msg.ProcessInputModel.Fields.ApplyID)
	if err != nil {
		log.WithContext(ctx).Errorf("parseDataPushModelID data push model %v error %v", dataPushModelID, err)
		return errorcode.Detail(errorcode.DataPushNotExistError, err.Error())
	}

	alterInfo := map[string]interface{}{
		"audit_advice": "",
		"updated_at":   &util.Time{Time: time.Now()},
	}
	if !msg.ProcessInputModel.Fields.AuditIdea {
		alterInfo["audit_state"] = constant.AuditStatusReject
		alterInfo["audit_advice"] = common.GetAuditMsg(&msg.ProcessInputModel.WFCurComment, &msg.ProcessInputModel.Fields.AuditMsg)
	}
	//更新状态
	if _, err = u.repo.AuditResultUpdate(ctx, dataPushModelID, alterInfo); err != nil {
		log.WithContext(ctx).Errorf("failed to update audit result flow_type: %v  alterInfo: %+v, err: %v", msg.ProcessDef.Category, alterInfo, err)
	}
	return err
}

// handleAuditResult 处理审核结果消息
func (u *useCase) handleAuditResult(ctx context.Context, auditType string, msg *wf_common.AuditResultMsg) error {
	log.Warnf("handleAuditResult:%v", string(lo.T2(json.Marshal(msg)).A))
	dataPushModelID, err := parseDataPushModelID(msg.ApplyID)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to parse audit result apply_id: %s, err: %v", msg.ApplyID, err)
		return err
	}
	alterInfo := map[string]interface{}{"updated_at": &util.Time{Time: time.Now()}}
	switch msg.Result {
	case common.AUDIT_RESULT_PASS:
		alterInfo["audit_state"] = constant.AuditStatusPass
	case common.AUDIT_RESULT_REJECT:
		alterInfo["audit_state"] = constant.AuditStatusReject
	case common.AUDIT_RESULT_UNDONE:
		alterInfo["audit_state"] = constant.AuditStatusUndone
	default:
		log.WithContext(ctx).Warnf("unknown audit result type: %s, ignore it", msg.Result)
		return nil
	}
	var bRet bool
	bRet, err = u.repo.AuditResultUpdate(ctx, dataPushModelID, alterInfo)
	if !(msg.Result == common.AUDIT_RESULT_PASS && bRet && err == nil) {
		log.WithContext(ctx).Warnf("AuditResultUpdate data push model %v result %v", dataPushModelID, err)
		return err
	}
	//审核通过，执行下一步动作，流转下去
	pushData, err := u.repo.Get(ctx, dataPushModelID)
	if err != nil {
		log.WithContext(ctx).Errorf("query data push model %v error %v", dataPushModelID, err)
		return err
	}
	//应用调度计划, 然后执行性的
	domain.UpdateSchedule(pushData)
	if err = u.Operation.RunWithoutWorkflow(ctx, pushData); err != nil {
		return err
	}
	if err = u.repo.Update(ctx, pushData, nil); err != nil {
		log.WithContext(ctx).Errorf("update: %v err: %v", dataPushModelID, err.Error())
	}
	return err
}

// handleAuditDefDel 处理审核流程删除消息
func (u *useCase) handleAuditDefDel(ctx context.Context, auditType string, msg *wf_common.AuditProcDefDelMsg) error {
	defer func() {
		if err := recover(); err != nil {
			log.WithContext(ctx).Error("[mq] HandleAuditDefDel ", zap.Any("err", err))
		}
	}()
	if len(msg.ProcDefKeys) == 0 {
		return nil
	}

	log.WithContext(ctx).Infof("recv audit type: %s proc_def_keys: %v delete msg, proc related unfinished audit process",
		auditType, msg.ProcDefKeys)

	_, err := u.repo.UpdateAuditStateWhileDelProc(ctx, msg.ProcDefKeys)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to update audit type: %s proc_def_keys: %v related unfinished audit process to reject status, err: %v",
			auditType, msg.ProcDefKeys, err)
	}
	return err
}

func parseDataPushModelID(auditApplyID string) (uint64, error) {
	strs := strings.Split(auditApplyID, "-")
	if len(strs) != 2 {
		return 0, errors.New("audit apply id format invalid")
	}
	modelID, err := strconv.ParseUint(strs[0], 10, 64)
	if err != nil {
		return 0, errors.New("audit apply id format invalid: " + auditApplyID)
	}
	return modelID, nil
}
