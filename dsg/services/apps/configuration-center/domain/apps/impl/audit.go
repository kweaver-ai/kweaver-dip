package impl

import (
	"context"
	"errors"
	"strconv"
	"strings"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/rest/sszd_service"
	"github.com/kweaver-ai/idrm-go-frame/core/utils"

	wf_common "github.com/kweaver-ai/idrm-go-common/workflow/common"

	// domain_nsq "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driver/mq/nsq"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/util"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	af_trace "github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"go.uber.org/zap"
)

func (u *appsUseCase) AppApplyAuditResultMsgProc(ctx context.Context, msg *wf_common.AuditResultMsg) error {
	var (
		err       error
		appFromDb *model.AllApp
	)

	ctx, span := af_trace.StartProducerSpan(context.Background())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()

	var appID, auditRecID uint64
	appID, auditRecID, err = ParseAuditApplyID(msg.ApplyID)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to parse audit result apply_id: %s, err: %v", msg.ApplyID, err)
		return err
	}

	// 根据Id获取数据库中的Apps
	appFromDb, err = u.appsRepo.GetAppById(ctx, appID, "editing")
	if err != nil {
		return err
	}
	if !(appFromDb.AuditID != 0 && appFromDb.AuditID == auditRecID) {
		log.WithContext(ctx).
			Warnf("APP: %s audit: %d not found, ignore it",
				appFromDb.Apps.AppsID, auditRecID)
		return nil
	}

	switch msg.Result {
	case "pass":
		var (
			bIsAuditNeeded bool
			accountID      string
		)

		// 检查应用上报是否有流程
		afs, err := u.auditProcessBindRepo.GetByAuditType(ctx, constant.AppApplyEscalate)
		if err != nil {
			log.WithContext(ctx).Errorf("get demand escalate audit flow bind failed: %v", err)
			return errorcode.Detail(errorcode.PublicDatabaseError, err)
		}
		if afs.ProcDefKey != "" {
			bIsAuditNeeded = true
			// res, err := u.workflow.ProcessDefinitionGet(ctx, afs.ProcDefKey)
			// if err != nil {
			// 	log.Error("AuditProcessBindCreate ProcessDefinitionGet Error: ", zap.Error(err))
			// 	return errorcode.Detail(errorcode.PublicDatabaseError, err)
			// } else {
			// 	bIsAuditNeeded = true
			// }
			// if res.Key != afs.ProcDefKey {
			// 	return errorcode.Detail(errorcode.PublicDatabaseError, err)
			// } else {
			// 	bIsAuditNeeded = true
			// }

		}

		// 如果有，创建或者修改hydra中应用账号
		if appFromDb.AccountPassowrd != "" && appFromDb.AccountName != "" {
			// 创建
			if appFromDb.AccountID == "" {
				strPwd, err := util.DecodeRSA(appFromDb.AccountPassowrd, util.RSA2048)
				if err != nil {
					return err
				}
				accountID, err = u.hydra.Register(appFromDb.AccountName, strPwd)
				if err != nil {
					return err
				}
				appFromDb.AppsHistory.AccountID = accountID
			} else {
				// 修改
				var strPwd string
				if appFromDb.AccountPassowrd != "" {
					strPwd, err = util.DecodeRSA(appFromDb.AccountPassowrd, util.RSA2048)
					if err != nil {
						return err
					}
				}
				err = u.hydra.Update(appFromDb.AppsHistory.AccountID, appFromDb.AccountName, strPwd)
				if err != nil {
					return err
				}
			}
		}

		// 如果上报是否有流程，查询是否有上报版本处在审核中，如果有，取消审核, 自动发起审核
		if bIsAuditNeeded && appFromDb.Apps.ReportEditingVersionID != nil && *appFromDb.Apps.ReportEditingVersionID != 0 {
			appEdingFromDb, err := u.appsRepo.GetAppById(ctx, appID, "to_report")
			if err != nil {
				return err
			}
			if appEdingFromDb.ReportAuditStatus == 1 {
				if appEdingFromDb.ReportAuditID > 0 {
					msg := &wf_common.AuditCancelMsg{
						ApplyIDs: []string{GenAuditApplyID(appEdingFromDb.Apps.ID, appEdingFromDb.ReportAuditID)},
						Cause: struct {
							ZHCN string "json:\"zh-cn\""
							ZHTW string "json:\"zh-tw\""
							ENUS string "json:\"en-us\""
						}{
							ZHCN: "revocation",
							ZHTW: "revocation",
							ENUS: "revocation",
						}}

					if err := u.wf.AuditCancel(msg); err != nil {
						log.WithContext(ctx).Error("send app create info error", zap.Error(err))
						return errorcode.Desc(errorcode.UserCreateMessageSendError)
					}
					// 自动重新发起
					var auditRecID uint64
					auditRecID, err = utils.GetUniqueID()
					if err != nil {
						return errorcode.Detail(errorcode.PublicInternalError, err)
					}
					msg2 := &wf_common.AuditApplyMsg{
						Process: wf_common.AuditApplyProcessInfo{
							ApplyID:    GenAuditApplyID(appFromDb.Apps.ID, auditRecID),
							AuditType:  constant.AppApplyReport,
							UserID:     "266c6a42-6131-4d62-8f39-853e7093701c",
							UserName:   "admin",
							ProcDefKey: afs.ProcDefKey,
						},
						Data: map[string]any{
							"id":          appFromDb.Apps.AppsID,
							"title":       appEdingFromDb.Name,
							"description": appEdingFromDb.Description,
							"submit_time": time.Now().UnixMilli(),
							"type":        "report",
						},
						Workflow: wf_common.AuditApplyWorkflowInfo{
							TopCsf: 5,
							AbstractInfo: wf_common.AuditApplyAbstractInfo{
								Icon: AUDIT_ICON_BASE64,
								Text: "应用名称:" + appEdingFromDb.Name,
							},
						},
					}

					if err := u.wf.AuditApply(msg2); err != nil {
						log.WithContext(ctx).Error("send app create info error", zap.Error(err))
						return errorcode.Desc(errorcode.UserCreateMessageSendError)
					}
					appEdingFromDb.ReportAuditID = auditRecID
					appEdingFromDb.ReportAuditStatus = 1
				}
			}
		}

		appFromDb.Apps.PublishedVersionID = appFromDb.AppsHistory.ID
		appFromDb.Apps.ReportEditingVersionID = &appFromDb.AppsHistory.ID
		appFromDb.Apps.EditingVersionID = &zero
		appFromDb.AppsHistory.Status = 4
	case "reject":
		appFromDb.AppsHistory.Status = 2
	case "undone":
		log.WithContext(ctx).Warnf("undone audit result type: %s, ignore it", msg.Result)
		return nil
	default:
		log.WithContext(ctx).Warnf("unknown audit result type: %s, ignore it", msg.Result)
		return nil
	}

	// 更新数据库
	appFromDb.AppsHistory.AuditResult = msg.Result
	appFromDb.AppsHistory.UpdatedAt = time.Now()
	err = u.appsRepo.UpdateApp(ctx, appFromDb.Apps.AppsID, &appFromDb.Apps, &appFromDb.AppsHistory)
	if err != nil {
		return err
	}
	return err
}

func (u *appsUseCase) AppApplyProcessMsgProc(ctx context.Context, msg *wf_common.AuditProcessMsg) error {
	var (
		err       error
		appFromDb *model.AllApp
	)

	ctx, span := af_trace.StartProducerSpan(context.Background())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()

	var appID, auditRecID uint64
	appID, auditRecID, err = ParseAuditApplyID(msg.ProcessInputModel.Fields.ApplyID)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to parse audit result apply_id: %s, err: %v", appID, err)
		return err
	}

	// 根据Id获取数据库中的Apps
	appFromDb, err = u.appsRepo.GetAppById(ctx, appID, "editing")
	if err != nil {
		return err
	}
	if !(appFromDb.AuditID != 0 && appFromDb.AuditID == auditRecID) {
		log.WithContext(ctx).
			Warnf("APP: %s audit: %d not found, ignore it",
				appFromDb.Apps.AppsID, auditRecID)
		return nil
	}

	if !msg.ProcessInputModel.Fields.AuditIdea && len(msg.ProcessInputModel.Fields.AuditMsg) > 0 {
		appFromDb.AppsHistory.RejectReason = msg.ProcessInputModel.WFCurComment
		appFromDb.AppsHistory.Status = 2
		appFromDb.AppsHistory.UpdatedAt = time.Now()
		err = u.appsRepo.UpdateApp(ctx, appFromDb.Apps.AppsID, nil, &appFromDb.AppsHistory)
		if err != nil {
			return err
		}
	}

	return nil
}

func (u *appsUseCase) AppReportAuditResultMsgProc(ctx context.Context, msg *wf_common.AuditResultMsg) error {
	var (
		err       error
		appFromDb *model.AllApp
	)

	ctx, span := af_trace.StartProducerSpan(context.Background())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	var appID, auditRecID uint64
	appID, auditRecID, err = ParseAuditApplyID(msg.ApplyID)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to parse audit result apply_id: %s, err: %v", msg.ApplyID, err)
		return err
	}

	// 根据Id获取数据库中的Apps
	appFromDb, err = u.appsRepo.GetAppById(ctx, appID, "to_report")
	if err != nil {
		// return nil
		return err
	}
	if !(appFromDb.ReportAuditID != 0 && appFromDb.ReportAuditID == auditRecID) {
		log.WithContext(ctx).
			Warnf("APP: %s report_audit: %d not found, ignore it",
				appFromDb.Apps.AppsID, auditRecID)
		return nil
	}

	switch msg.Result {
	case "pass":
		if appFromDb.ProvinceAppID == "" {
			// 省平台创建
			req := &sszd_service.AppReq{
				Name:         appFromDb.Name,
				Description:  appFromDb.Description,
				OrgCode:      appFromDb.OrgCode,
				OrgName:      appFromDb.OrgCode,
				ProvinceIp:   appFromDb.ProvinceIP,
				ProvinceUrl:  appFromDb.ProvinceURL,
				ContactName:  appFromDb.ContactName,
				ContactPhone: appFromDb.ContactPhone,
				AreaName:     appFromDb.AreaID,
				RangeName:    appFromDb.RangeID,
				DeployPlace:  &appFromDb.DeployPlace,
				DepartmentID: appFromDb.DepartmentID,
			}
			b, err := u.app.CreateProvinceApp(ctx, req)
			if err != nil {
				appFromDb.AppsHistory.ReportAuditStatus = 4
				appFromDb.AppsHistory.ReportStatus = 2
				appFromDb.AppsHistory.ReportAuditResult = msg.Result
				errT := u.appsRepo.UpdateApp(ctx, appFromDb.Apps.AppsID, &appFromDb.Apps, &appFromDb.AppsHistory)
				if errT != nil {
					return errT
				}
				return err
			}
			appFromDb.ProvinceID = b.ID
			appFromDb.ProvinceAppID = b.AppID
			appFromDb.AccessKey = b.AccessKey
			appFromDb.AccessSecret = b.AccessSecret
		} else {
			// 省平台修改
			appReq := &sszd_service.AppReq{
				Name:         appFromDb.Name,
				Description:  appFromDb.Description,
				OrgCode:      appFromDb.OrgCode,
				OrgName:      appFromDb.OrgCode,
				ProvinceIp:   appFromDb.ProvinceIP,
				ProvinceUrl:  appFromDb.ProvinceURL,
				ContactName:  appFromDb.ContactName,
				ContactPhone: appFromDb.ContactPhone,
				AreaName:     appFromDb.AreaID,
				RangeName:    appFromDb.RangeID,
				DeployPlace:  &appFromDb.DeployPlace,
				DepartmentID: appFromDb.DepartmentID,
			}
			_, err := u.app.UpdateProvinceApp(ctx, appFromDb.ProvinceID, appReq)
			if err != nil {
				appFromDb.AppsHistory.ReportAuditStatus = 4
				appFromDb.AppsHistory.ReportStatus = 2
				appFromDb.AppsHistory.ReportAuditResult = msg.Result
				errT := u.appsRepo.UpdateApp(ctx, appFromDb.Apps.AppsID, &appFromDb.Apps, &appFromDb.AppsHistory)
				if errT != nil {
					return errT
				}
				return err
			}
		}
		appFromDb.Apps.ReportPublishedVersionID = appFromDb.AppsHistory.ID
		appFromDb.Apps.ReportEditingVersionID = &zero
		appFromDb.AppsHistory.ReportAuditStatus = 4
		appFromDb.AppsHistory.ReportStatus = 1
		appFromDb.AppsHistory.ReportAt = time.Now()
	case "reject":
		appFromDb.AppsHistory.ReportAuditStatus = 2
	case "undone":
		log.WithContext(ctx).Warnf("undone audit result type: %s, ignore it", msg.Result)
		return nil
	default:
		log.WithContext(ctx).Warnf("unknown audit result type: %s, ignore it", msg.Result)
		return nil
	}

	// 更新数据库
	appFromDb.AppsHistory.ReportAuditResult = msg.Result
	appFromDb.AppsHistory.UpdatedAt = time.Now()
	err = u.appsRepo.UpdateApp(ctx, appFromDb.Apps.AppsID, &appFromDb.Apps, &appFromDb.AppsHistory)
	if err != nil {
		return err
	}
	return err
}

func (u *appsUseCase) AppReportProcessMsgProc(ctx context.Context, msg *wf_common.AuditProcessMsg) error {
	var (
		err       error
		appFromDb *model.AllApp
	)

	ctx, span := af_trace.StartProducerSpan(context.Background())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()

	if msg.ProcessInputModel.Fields.AuditIdea && len(msg.ProcessInputModel.Fields.AuditMsg) == 0 {
		log.Warnf("APP: %s AuditIdea: %t, ignore it",
			msg.ProcessInputModel.Fields.ApplyID, msg.ProcessInputModel.Fields.AuditIdea)
		return nil
	}

	var appID, auditRecID uint64
	appID, auditRecID, err = ParseAuditApplyID(msg.ProcessInputModel.Fields.ApplyID)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to parse report_audit result apply_id: %s, err: %v", appID, err)
		return err
	}
	// 根据Id获取数据库中的Apps
	appFromDb, err = u.appsRepo.GetAppById(ctx, appID, "to_report")
	if err != nil {
		// return nil
		return err
	}
	if !(appFromDb.ReportAuditID != 0 && appFromDb.ReportAuditID == auditRecID) {
		log.WithContext(ctx).
			Warnf("APP: %d audit: %d not found, ignore it",
				appFromDb.Apps.AppsID, auditRecID)
		return nil
	}

	if !msg.ProcessInputModel.Fields.AuditIdea && len(msg.ProcessInputModel.Fields.AuditMsg) > 0 {
		appFromDb.AppsHistory.ReportRejectReason = msg.ProcessInputModel.WFCurComment
		appFromDb.AppsHistory.ReportAuditStatus = 2
		appFromDb.AppsHistory.UpdatedAt = time.Now()
		err = u.appsRepo.UpdateApp(ctx, appFromDb.Apps.AppsID, nil, &appFromDb.AppsHistory)
		if err != nil {
			return err
		}
	}
	return nil
}

func ParseAuditApplyID(auditApplyID string) (uint64, uint64, error) {
	strs := strings.Split(auditApplyID, "-")
	if len(strs) != 2 {
		return 0, 0, errors.New("audit apply id format invalid")
	}

	var auditID uint64
	demandID, err := strconv.ParseUint(strs[0], 10, 64)
	if err == nil {
		auditID, err = strconv.ParseUint(strs[1], 10, 64)
	}
	return demandID, auditID, err
}
