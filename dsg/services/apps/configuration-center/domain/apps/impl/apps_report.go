package impl

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/rest/sszd_service"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/rest/workflow"
	wf_common "github.com/kweaver-ai/idrm-go-common/workflow/common"
	"github.com/kweaver-ai/idrm-go-frame/core/utils"

	// "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driver/mq/nsq"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/models/response"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/apps"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
)

func (u appsUseCase) ReportAppsList(ctx context.Context, req *apps.ProvinceAppListReq) (*apps.GetAppDetailInfoListResp, error) {
	// 只有数据运营工程是才能上报, 其他角色上报失败,暂定

	// 获取数据库中处于上报的应用列表
	appsFromDB, count, err := u.appsRepo.GetReportApps(ctx, req)
	if err != nil {
		return nil, err
	}

	// 批量获取部门信息
	var departmentIds []string
	departmentNameMap := make(map[string]string)
	departmentPathMap := make(map[string]string)
	for _, app := range appsFromDB {
		departmentIds = append(departmentIds, app.DepartmentID)
	}
	objects, err := u.business_structure_repo.GetObjectsByIDs(ctx, departmentIds)
	if err != nil {
		return nil, err
	}
	for _, object := range objects {
		departmentNameMap[object.ID] = object.Name
		departmentPathMap[object.ID] = object.Path
	}

	entries := []*apps.GetAppDetailInfoListItem{}
	for _, appsTemp := range appsFromDB {
		// todo 待重写
		var auditStatus string
		if appsTemp.ReportAuditStatus == 0 || appsTemp.ReportAuditStatus == 4 || appsTemp.ReportAuditStatus == 3 {
			auditStatus = "normal"
		}
		if appsTemp.ReportAuditStatus == 1 {
			auditStatus = "auditing"
		}
		if appsTemp.ReportAuditStatus == 2 {
			auditStatus = "audit_rejected"
		}
		if (appsTemp.ReportAuditStatus == 4 || appsTemp.ReportAuditStatus == 0) && appsTemp.ReportStatus == 2 {
			auditStatus = "report_failed"
		}

		entries = append(entries, &apps.GetAppDetailInfoListItem{
			ID:             appsTemp.Apps.AppsID,
			Name:           appsTemp.Name,
			Description:    *appsTemp.Description,
			AuditStatus:    auditStatus,
			RejectedReason: appsTemp.AppsHistory.ReportRejectReason,
			DepartmentName: departmentNameMap[appsTemp.DepartmentID],
			DepartmentPath: departmentPathMap[appsTemp.DepartmentID],
			UpdatedAt:      appsTemp.AppsHistory.UpdatedAt.UnixMilli(),
			ReportedAt:     appsTemp.AppsHistory.ReportAt.UnixMilli(),
			IsUpdate:       appsTemp.AppsHistory.ProvinceAppID != "",
		})
	}
	// 响应
	res := &apps.GetAppDetailInfoListResp{
		PageResults: response.PageResults[apps.GetAppDetailInfoListItem]{
			Entries:    entries,
			TotalCount: count,
		},
	}
	return res, nil
}

func (u appsUseCase) Report(ctx context.Context, req *apps.AppsIDS, userInfo *model.User) error {
	// 只有应用开发者、数据运营才能上报
	// 如果当前编辑版本上报状态为上报未成功，则是重新上报，只发省直达请求

	// 不是重新上报
	// 1, 如果没有审核流程, 直接调上报接口
	// 2, 如果有审核流程,走审核流程,入库,状态为审核中,此处需要考虑是更新上报还是创建上报
	var (
		bIsAuditNeeded bool
		err            error
	)

	// 此处需要检查ids中应用是否存在

	// 检查角色，如果不是运营工程师，不允许设置
	// var lsApplicationDeveloper bool
	// roleUsers, err := u.rolerepo.GetUserRole(ctx, userInfo.ID)
	// if err != nil {
	// 	log.WithContext(ctx).Error("GetUserListCanAddToRole GetRoleUsers ", zap.Error(err))
	// 	return errorcode.Desc(errorcode.RoleDatabaseError)
	// }
	// for _, roleUser := range roleUsers {
	// 	if roleUser.RoleID == access_control.TCDataOperationEngineer {
	// 		lsApplicationDeveloper = true
	// 		break
	// 	}
	// }
	// if !lsApplicationDeveloper {
	// 	return errorcode.Desc(errorcode.UeserNotApplicationDeveloperRole)
	// }

	// 查看是否有审核流程
	afs, err := u.auditProcessBindRepo.GetByAuditType(ctx, constant.AppApplyReport)
	if err != nil {
		log.WithContext(ctx).Errorf("get demand escalate audit flow bind failed: %v", err)
		return errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	if afs.ProcDefKey != "" {
		res, err := u.workflow.ProcessDefinitionGet(ctx, afs.ProcDefKey)
		if err != nil {
			log.Error("AuditProcessBindCreate ProcessDefinitionGet Error: ", zap.Error(err))
			return errorcode.Detail(errorcode.PublicDatabaseError, err)
		} else {
			bIsAuditNeeded = true
		}
		if res.Key != afs.ProcDefKey {
			return errorcode.Detail(errorcode.PublicDatabaseError, err)
		} else {
			bIsAuditNeeded = true
		}
	}
	if bIsAuditNeeded {
		// 有审核流程
		for _, id := range req.IDs {
			appFromDb, err := u.appsRepo.GetAppByAppsId(ctx, id, "published")
			if err != nil {
				return err
			}
			if appFromDb.ReportAuditStatus == 4 && appFromDb.ReportStatus == 2 {
				err = u.reportAppWithoutAudit(ctx, appFromDb, id, userInfo)
				if err != nil {
					return err
				}
			} else {
				err = u.reportAppWithAudit(ctx, appFromDb, id, userInfo, afs.ProcDefKey)
				if err != nil {
					return err
				}
			}
		}
		// 后续workflow的处理
		// 1， 审核拒绝：更新数据库状态
		// 2， 审核撤回：更新数据库状态
		// 3， 审核通过：调hydra接口，调省直达接口，更改数据库状态
	} else {
		// 无审核流程
		for _, id := range req.IDs {
			appFromDb, err := u.appsRepo.GetAppByAppsId(ctx, id, "published")
			if err != nil {
				return err
			}
			err = u.reportAppWithoutAudit(ctx, appFromDb, id, userInfo)
			if err != nil {
				return err
			}
		}
	}
	return err
}

func (u appsUseCase) reportAppWithoutAudit(ctx context.Context, appFromDb *model.AllApp, id string, userInfo *model.User) error {
	// 数据库中获取信息，构造数据上报，且根据返回信息填写id，key，secret
	// 1，数据库中获取信息，根据信息判断是更新，还是创建
	// 2, 构造上报数据，上报成功，返回appid，key， secret，
	// 3, 更新id，key，secret到数据库和状态
	var (
		err error
	)
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
			appFromDb.AppsHistory.ReportStatus = 2
			errT := u.appsRepo.UpdateApp(ctx, id, &appFromDb.Apps, &appFromDb.AppsHistory)
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
			appFromDb.AppsHistory.ReportStatus = 2
			errT := u.appsRepo.UpdateApp(ctx, id, &appFromDb.Apps, &appFromDb.AppsHistory)
			if errT != nil {
				return errT
			}
			return err
		}
	}

	// 成功后更新数据库
	var a uint64
	appFromDb.Apps.ReportPublishedVersionID = appFromDb.AppsHistory.ID
	appFromDb.Apps.ReportEditingVersionID = &a
	appFromDb.AppsHistory.ReportStatus = 1
	appFromDb.AppsHistory.UpdaterUID = userInfo.ID
	appFromDb.AppsHistory.UpdatedAt = time.Now()
	appFromDb.AppsHistory.ReportAt = time.Now()
	err = u.appsRepo.UpdateApp(ctx, id, &appFromDb.Apps, &appFromDb.AppsHistory)
	if err != nil {
		return err
	}
	return err
}

func (u appsUseCase) reportAppWithAudit(ctx context.Context, appFromDb *model.AllApp, id string, userInfo *model.User, procDefKey string) error {
	// 有审核流程
	// 1, 给workflow发审核消息
	// 2, 入库，创建版本信息，更新指向
	var (
		err error
	)
	if appFromDb.AppsHistory.ReportAuditStatus == 1 {
		fmt.Println("当前app处于审核中，不允许再次上报")
	}
	// workflow操作
	// 发审核消息给workflow
	var auditRecID uint64
	auditRecID, err = utils.GetUniqueID()
	if err != nil {
		return errorcode.Detail(errorcode.PublicInternalError, err)
	}
	msg := &wf_common.AuditApplyMsg{
		Process: wf_common.AuditApplyProcessInfo{
			ApplyID:    GenAuditApplyID(appFromDb.Apps.ID, auditRecID),
			AuditType:  constant.AppApplyReport,
			UserID:     userInfo.ID,
			UserName:   userInfo.Name,
			ProcDefKey: procDefKey,
		},
		Data: map[string]any{
			"id":          appFromDb.Apps.AppsID,
			"title":       appFromDb.Name,
			"description": appFromDb.Description,
			"submit_time": time.Now().UnixMilli(),
			"type":        "report",
		},
		Workflow: wf_common.AuditApplyWorkflowInfo{
			TopCsf: 5,
			AbstractInfo: wf_common.AuditApplyAbstractInfo{
				Icon: AUDIT_ICON_BASE64,
				Text: "应用名称:" + appFromDb.Name,
			},
		},
	}

	if err := u.wf.AuditApply(msg); err != nil {
		log.WithContext(ctx).Error("send app create info error", zap.Error(err))
		return errorcode.Desc(errorcode.UserCreateMessageSendError)
	}

	// 入库
	appFromDb.AppsHistory.ReportAuditStatus = 1
	appFromDb.AppsHistory.ReportAuditID = auditRecID
	appFromDb.AppsHistory.UpdaterUID = userInfo.ID
	appFromDb.AppsHistory.UpdatedAt = time.Now()
	err = u.appsRepo.UpdateApp(ctx, id, &appFromDb.Apps, &appFromDb.AppsHistory)
	if err != nil {
		return err
	}
	return err
}

func (u appsUseCase) GetReportAuditList(ctx context.Context, req *apps.AuditListGetReq) (*apps.AuditListResp, error) {
	var (
		err    error
		audits *workflow.AuditResponse
	)

	audits, err = u.workflow.GetList(ctx, workflow.WorkflowListType(req.Target), []string{constant.AppApplyReport}, req.Offset, req.Limit)
	if err != nil {
		log.WithContext(ctx).Errorf("uc.workflow.GetList failed: %v", err)
		return nil, errorcode.Detail(errorcode.PublicInternalError, err)
	}
	resp := &apps.AuditListResp{}
	resp.TotalCount = int64(audits.TotalCount)
	resp.Entries = make([]*apps.AuditListItem, 0, len(audits.Entries))
	for i := range audits.Entries {
		respa := apps.Data{}
		a := audits.Entries[i].ApplyDetail.Data
		if err = json.Unmarshal([]byte(a), &respa); err != nil {
			return nil, err
		}
		resp.Entries = append(resp.Entries,
			&apps.AuditListItem{
				ApplyTime:   audits.Entries[i].ApplyTime,
				Applyer:     audits.Entries[i].ApplyUserName,
				ProcInstID:  audits.Entries[i].ID,
				TaskID:      audits.Entries[i].ProcInstID,
				Name:        respa.Title,
				ReportType:  respa.Type,
				AuditStatus: audits.Entries[i].AuditStatus,
				AuditTime:   audits.Entries[i].EndTime,
			},
		)
		resp.Entries[i].ID = respa.Id
		if err != nil {
			log.WithContext(ctx).Errorf("common.ParseAuditApplyID failed: %v", err)
			return nil, errorcode.Detail(errorcode.PublicInternalError, err)
		}
	}
	return resp, nil
}

func (u appsUseCase) ReportCancel(ctx context.Context, req *apps.DeleteReq) error {
	// 只有应用开发者、数据运营可以操作
	appFromDb, err := u.appsRepo.GetAppByAppsId(ctx, req.Id, "published")
	if err != nil {
		return err
	}
	// 查询当前编辑版本是否处在审核中，如果是，取消审核,
	// 数据库更改状态
	if appFromDb.Apps.ReportEditingVersionID != nil {
		appEdingFromDb, err := u.appsRepo.GetAppByAppsId(ctx, req.Id, "to_report")
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
				appFromDb.ReportAuditStatus = 3
				err = u.appsRepo.UpdateApp(ctx, appFromDb.AppsID, &appFromDb.Apps, &appFromDb.AppsHistory)
				if err != nil {
					return err
				}
			}
		}
	}
	return nil
}
