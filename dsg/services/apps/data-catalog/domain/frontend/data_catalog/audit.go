package data_catalog

import (
	"context"

	"time"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/constant"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/common"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	wf_common "github.com/kweaver-ai/idrm-go-common/workflow/common"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

const (
	DAYS_INTERVAL = 24 * time.Hour
)

const (
	EXPIRED_TYPE_VALID   = iota + 1 // 未过期
	EXPIRED_TYPE_INVALID            // 已过期
)

func (d *DataCatalogDomain) DownloadAuditResultProc(ctx context.Context, msg *wf_common.AuditResultMsg) (err error) {
	var id, applySN uint64
	id, applySN, err = common.ParseAuditApplyID(msg.ApplyID)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to parse audit result apply_id: %s, err: %v", msg.ApplyID, err)
		return err
	}

	var applys []*model.TDataCatalogDownloadApply
	applys, err = d.daRepo.Get(nil, ctx, "", "", id, applySN, constant.AuditStatusAuditing)
	if err != nil {
		log.WithContext(ctx).Errorf("get catalog download apply data (id: %d audit_apply_sn: %d) failed, error info: %v", id, applySN, err)
		return err
	}

	if len(applys) == 0 {
		log.WithContext(ctx).Warnf("no catalog download apply data (id: %d audit_apply_sn: %d state: %d) found, ignore it",
			id, applySN, constant.AuditStatusAuditing)
		return nil
	}

	applys[0].UpdatedAt = &util.Time{time.Now()}
	switch msg.Result {
	case common.AUDIT_RESULT_PASS:
		applys[0].State = constant.AuditStatusPass
	case common.AUDIT_RESULT_REJECT:
		applys[0].State = constant.AuditStatusReject
	case common.AUDIT_RESULT_UNDONE:
		applys[0].State = constant.AuditStatusUndone
	default:
		log.WithContext(ctx).Warnf("unknown audit result type: %s, ignore it", msg.Result)
		return nil
	}

	tx := d.data.DB.WithContext(ctx).Begin()
	defer func(err *error) {
		if e := recover(); e != nil {
			*err = e.(error)
			tx.Rollback()
		} else if e = tx.Commit().Error; e != nil {
			*err = errorcode.Detail(errorcode.PublicDatabaseError, e)
			tx.Rollback()
		}
	}(&err)

	err = d.daRepo.Update(tx, ctx, applys[0])
	if err != nil {
		log.WithContext(ctx).Errorf("update catalog download apply data (%v) failed, error info: %v", applys[0], err)
		panic(err)
	}

	if applys[0].State == constant.AuditStatusPass {
		timeNow := &util.Time{time.Now()}
		uacr := &model.TUserDataCatalogRel{
			UID:         applys[0].UID,
			Code:        applys[0].Code,
			ApplyID:     applys[0].ID,
			CreatedAt:   timeNow,
			UpdatedAt:   timeNow,
			ExpiredAt:   &util.Time{timeNow.Time.Add(time.Duration(applys[0].ApplyDays) * DAYS_INTERVAL)},
			ExpiredFlag: EXPIRED_TYPE_VALID,
		}
		err = d.ucrRepo.Insert(tx, ctx, uacr)
		if err != nil {
			log.WithContext(ctx).Errorf("insert user catalog rel data (%v) failed, error info: %v", uacr, err)
			panic(err)
		}
	}

	return err
}

func (d *DataCatalogDomain) DownloadAuditProcessMsgProc(ctx context.Context, msg *wf_common.AuditProcessMsg) error {
	applyID, applySN, err := common.ParseAuditApplyID(msg.ProcessInputModel.Fields.ApplyID)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to parse audit result flow_type: %v apply_id: %s, err: %v", msg.ProcessDef.Category, msg.ProcessInputModel.Fields.ApplyID, err)
		return err
	}

	da := &model.TDataCatalogDownloadApply{
		ID:           applyID,
		AuditApplySN: applySN,
		FlowID:       msg.ProcInstId,
		FlowApplyId:  msg.ProcessInputModel.Fields.FlowApplyID,
	}

	err = d.daRepo.Update(nil, ctx, da)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to update audit result flow_type: %v apply_id: %d audit_apply_sn: %s alterInfo: %+v, err: %v", msg.ProcessDef.Category, applyID, applySN, da, err)
	}
	return err
}

func (d *DataCatalogDomain) DownloadAuditProcessDelMsgProc(ctx context.Context, msg *wf_common.AuditProcDefDelMsg) error {
	if len(msg.ProcDefKeys) == 0 {
		return nil
	}

	log.WithContext(ctx).Infof("recv audit type: %s proc_def_keys: %v delete msg, proc related unfinished audit process",
		common.WORKFLOW_AUDIT_TYPE_CATALOG_DOWNLOAD, msg.ProcDefKeys)

	_, err := d.daRepo.UpdateAuditStateByProcDefKey(nil, ctx, common.WORKFLOW_AUDIT_TYPE_CATALOG_DOWNLOAD, msg.ProcDefKeys)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to update audit type: %s proc_def_keys: %v related unfinished audit process to reject status, err: %v",
			common.WORKFLOW_AUDIT_TYPE_CATALOG_DOWNLOAD, msg.ProcDefKeys, err)
	}
	return err
}

// func (d *DataCatalogDomain) CreateAuditInstance(ctx context.Context,
// 	req *ReqAuditApplyPathParams, body *ReqAuditApplyBodyParams) (resp *response.IDResp, err error) {
// 	uInfo := request.GetUserInfo(ctx)
// 	var catalog *model.TDataCatalog
// 	catalogID := req.CatalogID.Uint64()
// 	catalog, err = d.cataRepo.GetDetail(nil, ctx, catalogID, nil)
// 	if err != nil {
// 		log.WithContext(ctx).Errorf("failed to get catalog from db, err: %v", err)
// 		if errors.Is(err, gorm.ErrRecordNotFound) {
// 			return nil, errorcode.Detail(errorcode.PublicResourceNotExisted, "资源不存在")
// 		} else {
// 			return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
// 		}
// 	}

// 	if err = common.CatalogPropertyCheckV1(catalog); err != nil {
// 		log.WithContext(ctx).Errorf("catalog (id: %v code: %v user: %v) download access apply forbidden, err: %v", catalog.ID, catalog.Code, uInfo.Uid, err)
// 		return nil, err
// 	}

// 	if len(uInfo.OrgInfos) > 0 {
// 		if _, exist := common.UserOrgContainsCatalogOrg(uInfo, catalog.DepartmentID); exist {
// 			// 目录的部门编码存在用户所属的所有部门编码中
// 			log.WithContext(ctx).Warnf("user: %v has owned catalog: %v download access, no need to apply")
// 			return nil, errorcode.Detail(errorcode.PublicAccessPermitted, "已有当前资源下载权限，无需申请")
// 		}
// 	}

// 	var ucrs []*model.TUserDataCatalogRel
// 	ucrs, err = d.ucrRepo.Get(nil, ctx, catalog.Code, uInfo.Uid)
// 	if err != nil {
// 		log.WithContext(ctx).Errorf("failed to get user catalog rel data (uid: %v code: %v) from db, err: %v", uInfo.Uid, catalog.Code, err)
// 		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
// 	}

// 	if len(ucrs) > 0 {
// 		log.WithContext(ctx).Warnf("user: %v has owned catalog: %v download access, no need to apply")
// 		return nil, errorcode.Detail(errorcode.PublicAccessPermitted, "已有当前资源下载权限，无需申请")
// 	}

// 	var applys []*model.TDataCatalogDownloadApply
// 	applys, err = d.daRepo.Get(nil, ctx, catalog.Code, uInfo.Uid, 0, 0, common.DOWNLOAD_ACCESS_AUDIT_RESULT_UNDER_REVIEW)
// 	if err != nil {
// 		log.WithContext(ctx).Errorf("failed to get download apply data (uid: %v code: %v state: %v) from db, err: %v",
// 			uInfo.Uid, catalog.Code, common.DOWNLOAD_ACCESS_AUDIT_RESULT_UNDER_REVIEW, err)
// 		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
// 	}

// 	if len(applys) > 0 {
// 		log.WithContext(ctx).Warnf("user: %v has owned catalog: %v download access, no need to apply")
// 		return nil, errorcode.Detail(errorcode.PublicDuplicatedAccessApply, "已发起过当前资源下载权限申请，正在审核中，无需重复申请")
// 	}

// 	var flowInfos []*model.TDataCatalogAuditFlowBind
// 	flowInfos, err = d.flowRepo.Get(nil, ctx, 0, req.AuditType)
// 	if err != nil {
// 		log.WithContext(ctx).Errorf("failed to get audit flow info (type: %s), err: %v", req.AuditType, err)
// 		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
// 	}

// 	if len(flowInfos) != 1 {
// 		log.WithContext(ctx).Errorf("no audit flow info (type: %s) found", req.AuditType)
// 		// 没有可用的审核流程
// 		return nil, errorcode.Detail(errorcode.PublicNoAuditDefFoundError, "没有可用的审核流程")
// 	}

// 	if err = common.CheckAuditProcessDefinition(ctx, req.AuditType, flowInfos[0].ProcDefKey); err != nil {
// 		return nil, err
// 	}

// 	timeNow := &util.Time{time.Now()}
// 	apply := &model.TDataCatalogDownloadApply{
// 		UID:         uInfo.Uid,
// 		Code:        catalog.Code,
// 		ApplyDays:   body.ApplyDays,
// 		ApplyReason: body.ApplyReason,
// 		AuditType:   req.AuditType,
// 		State:       common.DOWNLOAD_ACCESS_AUDIT_RESULT_UNDER_REVIEW,
// 		CreatedAt:   timeNow,
// 		UpdatedAt:   timeNow,
// 		ProcDefKey:  flowInfos[0].ProcDefKey,
// 	}

// 	apply.ID, err = utils.GetUniqueID()
// 	if err != nil {
// 		log.WithContext(ctx).Errorf("failed to generate download apply data id, err: %v", err)
// 		return nil, errorcode.Detail(errorcode.PublicInternalError, err)
// 	}

// 	apply.AuditApplySN, err = utils.GetUniqueID()
// 	if err != nil {
// 		log.WithContext(ctx).Errorf("failed to generate audit apply sn, err: %v", err)
// 		return nil, errorcode.Detail(errorcode.PublicInternalError, err)
// 	}

// 	tx := d.data.DB.WithContext(ctx).Begin()
// 	defer func(err *error) {
// 		if e := recover(); e != nil {
// 			*err = e.(error)
// 			tx.Rollback()
// 		} else if e = tx.Commit().Error; e != nil {
// 			*err = errorcode.Detail(errorcode.PublicDatabaseError, e)
// 			tx.Rollback()
// 		}
// 	}(&err)

// 	err = d.daRepo.Insert(tx, ctx, apply)
// 	if err != nil {
// 		log.WithContext(ctx).Errorf("failed to audit apply (uid: %v catalog_id: %v audit_type: %v) update, err: %v",
// 			uInfo.Uid, catalogID, req.AuditType, err)
// 		panic(errorcode.Detail(errorcode.PublicDatabaseError, err))
// 	}

// 	var stats []*model.TDataCatalogStatsInfo
// 	stats, err = d.siRepo.Get(tx, ctx, apply.Code)
// 	if err != nil {
// 		log.WithContext(ctx).Errorf("failed to get audit apply num (uid: %v catalog_id: %v code: %v audit_type: %v) update, err: %v",
// 			uInfo.Uid, catalogID, apply.Code, req.AuditType, err)
// 		panic(errorcode.Detail(errorcode.PublicDatabaseError, err))
// 	}

// 	if len(stats) > 0 {
// 		// 申请次数:按申请资产人次计算，只要用户提交申请，通过和没通过审核都算1次;如果再次申请，也不会累积。
// 		var count int64
// 		count, err = d.daRepo.CountByCodeAndUID(tx, ctx, apply.Code, uInfo.Uid, 0, 0, 0)
// 		if err != nil {
// 			log.WithContext(ctx).Errorf("failed to count apply num, err info: %v", err)
// 			panic(errorcode.Detail(errorcode.PublicDatabaseError, err))
// 		}
// 		if count == 1 {
// 			// 1表示刚插入的那一条记录
// 			err = d.siRepo.Update(tx, ctx, apply.Code, 1, 0)
// 		}
// 	} else {
// 		err = d.siRepo.Insert(tx, ctx, apply.Code, 1, 0)
// 	}
// 	if err != nil {
// 		log.WithContext(ctx).Errorf("failed to record audit apply num (uid: %v catalog_id: %v code: %v audit_type: %v) update, err: %v",
// 			uInfo.Uid, catalogID, apply.Code, req.AuditType, err)
// 		panic(errorcode.Detail(errorcode.PublicDatabaseError, err))
// 	}

// 	msg := &workflow.AuditApplyMsg{}
// 	msg.Process.ApplyID = common.GenAuditApplyID(apply.ID, apply.AuditApplySN)
// 	msg.Process.AuditType = req.AuditType
// 	msg.Process.UserID = uInfo.Uid
// 	msg.Process.UserName = uInfo.UserName
// 	msg.Process.ProcDefKey = flowInfos[0].ProcDefKey
// 	msg.Data = map[string]any{
// 		"id":             fmt.Sprint(catalog.ID),
// 		"code":           catalog.Code,
// 		"title":          catalog.Title,
// 		"version":        catalog.Version,
// 		"submitter":      uInfo.Uid,
// 		"submit_time":    timeNow.UnixMilli(),
// 		"submitter_name": uInfo.UserName,
// 		"apply_days":     body.ApplyDays,
// 		"apply_reason":   body.ApplyReason,
// 	}
// 	msg.Workflow.TopCsf = 5
// 	msg.Workflow.AbstractInfo.Icon = common.AUDIT_ICON_BASE64
// 	msg.Workflow.AbstractInfo.Text = "目录名称：" + catalog.Title
// 	msg.Workflow.Webhooks = []workflow.Webhook{
// 		{
// 			Webhook:     settings.GetConfig().DepServicesConf.DataCatalogHost + "/api/internal/data-catalog/v1/audits/" + msg.Process.ApplyID + "/auditors",
// 			StrategyTag: common.OWNER_AUDIT_STRATEGY_TAG,
// 		},
// 	}

// 	err = d.wf.AuditApply(msg)
// 	if err != nil {
// 		log.WithContext(ctx).Errorf("failed to apply audit (uid: %v catalog_id: %v audit_type: %v), produce msg to nsq failed, err: %v",
// 			uInfo.Uid, catalogID, req.AuditType, err)
// 		panic(errorcode.Detail(errorcode.PublicAuditApplyFailedError, err))
// 	}
// 	return &response.IDResp{ID: req.CatalogID}, nil
// }

// CheckDownloadAccess 单独的查看下载权限接口已删除
//func (d *DataCatalogDomain) CheckDownloadAccess(ctx context.Context, catalogID uint64) (resp *DownloadAccessResp, err error) {
//	uInfo := request.GetUserInfo(ctx)
//	var catalog *model.TDataCatalog
//	catalog, err = d.cataRepo.GetDetail(nil, ctx, catalogID, nil)
//	if err != nil {
//		log.WithContext(ctx).Errorf("failed to get catalog from db, err: %v", err)
//		if errors.Is(err, gorm.ErrRecordNotFound) {
//			return nil, errorcode.Detail(errorcode.PublicResourceNotExisted, "资源不存在")
//		} else {
//			return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
//		}
//	}
//
//	if err = common.CatalogPropertyCheckV1(catalog); err != nil {
//		log.WithContext(ctx).Errorf("check catalog (id: %v code: %v user: %v) download access apply forbidden, err: %v", catalog.ID, catalog.Code, uInfo.Uid, err)
//		return nil, err
//	}
//
//	// 当是申请得来的下载权限时，返回下载过期时间
//	accessResult, _, err := d.commonUseCase.GetDownloadAccessResult(ctx, catalog.Orgcode, catalog.Code)
//	if err != nil {
//		return nil, err
//	}
//
//	return &DownloadAccessResp{ID: catalogID, Result: accessResult}, nil
//}

func (d *DataCatalogDomain) ExpiredAccessClear(ctx context.Context) (err error) {
	err = d.ucrRepo.BatchUpdateExpiredFlag(nil, ctx)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to clear expired access from db, err: %v", err)
		return errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	return nil
}
