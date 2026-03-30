package impl

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/request"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/common"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
	wf_common "github.com/kweaver-ai/idrm-go-common/workflow/common"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
)

// SendAuditMsg 发送审核消息
func (u *useCase) SendAuditMsg(ctx context.Context, dataPush *model.TDataPushModel) (isAuditProcessExist bool, err error) {
	ctx, _ = trace.StartInternalSpan(ctx)
	defer trace.EndSpan(ctx, err)

	//检查是否有绑定的审核流程
	process, err := u.ccDriven.GetProcessBindByAuditType(ctx,
		&configuration_center.GetProcessBindByAuditTypeReq{AuditType: constant.AuditTypeDataPushAudit})
	if err != nil {
		log.WithContext(ctx).Errorf("failed to check audit process info (type: %s), err: %v", constant.AuditTypeDataPushAudit, err)
		return false, nil
	}
	isAuditProcessExist = util.CE(process.ProcDefKey != "", true, false).(bool)
	if !isAuditProcessExist {
		return isAuditProcessExist, nil
	}

	uInfo := request.GetUserInfo(ctx)
	msg := &wf_common.AuditApplyMsg{
		Process: wf_common.AuditApplyProcessInfo{
			ApplyID:    genAuditApplyID(dataPush.ID, time.Now().Format(constant.COMMON_CODE_FORMAT)),
			AuditType:  process.AuditType,
			UserID:     uInfo.ID,
			UserName:   uInfo.Name,
			ProcDefKey: process.ProcDefKey,
		},
		Data: map[string]any{
			"id":         fmt.Sprintf("%v", dataPush.ID),
			"name":       dataPush.Name,
			"operation":  dataPush.Operation,
			"audit_time": time.Now().Unix(),
		},
		Workflow: wf_common.AuditApplyWorkflowInfo{
			TopCsf: 5,
			AbstractInfo: wf_common.AuditApplyAbstractInfo{
				Icon: common.AUDIT_ICON_BASE64,
				Text: "数据推送名称：" + dataPush.Name,
			},
		},
	}
	dataPush.ApplyID = msg.Process.ApplyID
	dataPush.ProcDefKey = process.ProcDefKey
	if err = u.wf.AuditApply(msg); err != nil {
		return isAuditProcessExist, errorcode.Detail(errorcode.SendAuditApplyMsgError, err.Error())
	}
	return isAuditProcessExist, nil
}

// CancelAuditMsg 撤回审核
func (u *useCase) CancelAuditMsg(ctx context.Context, applyID string) (err error) {
	ctx, _ = trace.StartInternalSpan(ctx)
	defer trace.EndSpan(ctx, err)

	msg := wf_common.GenNormalCancelMsg(applyID)
	if err = u.wf.AuditCancel(msg); err != nil {
		return errorcode.Detail(errorcode.SendAuditApplyMsgError, err.Error())
	}
	return nil
}

func genAuditApplyID(id uint64, code string) string {
	return fmt.Sprintf("%v-%s", id, code)
}

func parseAuditApplyID(auditApplyID string) (string, string) {
	ids := strings.Split(auditApplyID, "-")
	if len(ids) < 2 {
		return auditApplyID, ""
	}
	return ids[0], ids[1]
}
