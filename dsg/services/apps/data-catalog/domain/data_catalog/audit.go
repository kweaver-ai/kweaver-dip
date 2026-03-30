package data_catalog

import (
	"context"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/constant"
	"go.uber.org/zap"

	"github.com/samber/lo"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/common"
	wf_common "github.com/kweaver-ai/idrm-go-common/workflow/common"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

func (d *DataCatalogDomain) AuditResultPorc(ctx context.Context, auditType string, msg *wf_common.AuditResultMsg) error {
	catalogID, applySN, err := common.ParseAuditApplyID(msg.ApplyID)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to parse audit result apply_id: %s, err: %v", msg.ApplyID, err)
		return err
	}

	alterInfo := map[string]interface{}{"updated_at": &util.Time{Time: time.Now()}}
	switch msg.Result {
	case common.AUDIT_RESULT_PASS:
		alterInfo["audit_state"] = constant.AuditStatusPass
		alterInfo["audit_advice"] = ""
		switch auditType {
		case constant.AuditTypeOnline:
			alterInfo["online_status"] = constant.LineStatusOnLine
			alterInfo["is_indexed"] = 0
			alterInfo["online_time"] = alterInfo["updated_at"]
		case constant.AuditTypeOffline:
			alterInfo["state"] = constant.LineStatusOffLine
			alterInfo["is_indexed"] = 0
			alterInfo["is_canceled"] = 0
		case constant.AuditTypePublish:
			alterInfo["publish_status"] = constant.PublishStatusPublished
			alterInfo["published_at"] = alterInfo["updated_at"]
		}
	case common.AUDIT_RESULT_REJECT:
		switch auditType {
		case constant.AuditTypeOnline:
			alterInfo["online_status"] = constant.LineStatusUpReject
		case constant.AuditTypeOffline:
			alterInfo["online_status"] = constant.LineStatusDownReject
		case constant.AuditTypePublish:
			alterInfo["publish_status"] = constant.PublishStatusPubReject
		}

	case common.AUDIT_RESULT_UNDONE:
		alterInfo["audit_state"] = constant.AuditStatusUndone
	default:
		log.WithContext(ctx).Warnf("unknown audit result type: %s, ignore it", msg.Result)
		return nil
	}

	var bRet bool
	bRet, err = d.catalogRepo.AuditResultUpdate(nil, ctx, auditType, catalogID, applySN, alterInfo)
	if msg.Result == common.AUDIT_RESULT_PASS && bRet && err == nil {
		mqMsgType := ""
		switch auditType {
		case constant.AuditTypeOnline:
			mqMsgType = MQ_MSG_TYPE_UPDATE
		case constant.AuditTypeOffline:
			mqMsgType = MQ_MSG_TYPE_DELETE
		}

		if len(mqMsgType) > 0 {
			if catalog, tmpErr := d.catalogRepo.GetDetail(nil, ctx, catalogID, nil); tmpErr == nil {
				infos := make([]*InfoItem, 0)
				// 关联的业务对象及信息系统
				objMap, infoSysMap, err := d.getInfosFromDB(ctx, []uint64{catalog.ID})
				if err != nil {
					log.WithContext(ctx).Errorf("failed to get data-catalog info from db, err info: %v", err.Error())
					return err
				}
				if res, ok := objMap[catalog.ID]; ok {
					// catalog 可关联多个业务对象
					obj := &InfoItem{
						InfoType: common.INFO_TYPE_BUSINESS_DOMAIN,
						Entries: lo.Map(res, func(item IDNameEntity, _ int) *InfoBase {
							return &InfoBase{InfoKey: item.ID, InfoValue: item.Name}
						}),
					}
					infos = append(infos, obj)
				}
				if res, ok := infoSysMap[catalog.ID]; ok {
					obj := &InfoItem{
						InfoType: common.INFO_TYPE_RELATED_SYSTEM,
						Entries:  []*InfoBase{{InfoKey: res[0].ID, InfoValue: res[0].Name}},
					}
					infos = append(infos, obj)
				}

				go packAndProduceMsg(d, ctx, mqMsgType, catalog, infos)
				if auditType == constant.AuditTypeOffline {
					go downloadAuditCancel(d, ctx, catalog.Code)
				}
			} else {
				log.WithContext(ctx).Warnf("get catalog detail for es index %s catalog id: %d failed: %v", mqMsgType, catalogID, tmpErr)
			}
		}
	}
	return err
}

func (d *DataCatalogDomain) AuditProcessMsgProc(ctx context.Context, msg *wf_common.AuditProcessMsg) error {
	defer func() {
		if err := recover(); err != nil {
			log.WithContext(ctx).Error("[mq] AuditProcessMsgProc ", zap.Any("err", err))
		}
	}()
	catalogID, applySN, err := common.ParseAuditApplyID(msg.ProcessInputModel.Fields.ApplyID)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to parse audit result flow_type: %v  apply_id: %s, err: %v", msg.ProcessDef.Category, msg.ProcessInputModel.Fields.ApplyID, err)
		return err
	}

	alterInfo := map[string]interface{}{
		"audit_advice": "",
		"updated_at":   &util.Time{Time: time.Now()},
	}

	alterInfo["flow_id"] = msg.ProcInstId
	alterInfo["flow_apply_id"] = msg.ProcessInputModel.Fields.FlowApplyID
	if msg.CurrentActivity == nil {
		if len(msg.NextActivity) > 0 {
			alterInfo["flow_node_id"] = msg.NextActivity[0].ActDefId
			alterInfo["flow_node_name"] = msg.NextActivity[0].ActDefName
		} else {
			log.WithContext(ctx).Infof("audit result flow_type: %v catalog_id: %d audit_apply_sn: %s auto finished, do nothing", msg.ProcessDef.Category, catalogID, applySN)
		}
	} else if len(msg.NextActivity) == 0 {
		if !msg.ProcessInputModel.Fields.AuditIdea {
			alterInfo["audit_state"] = constant.AuditStatusReject
			alterInfo["audit_advice"] = common.GetAuditMsg(&msg.ProcessInputModel.WFCurComment, &msg.ProcessInputModel.Fields.AuditMsg)
		}
	} else {
		if msg.ProcessInputModel.Fields.AuditIdea {
			alterInfo["flow_node_id"] = msg.NextActivity[0].ActDefId
			alterInfo["flow_node_name"] = msg.NextActivity[0].ActDefName
		} else {
			alterInfo["audit_state"] = constant.AuditStatusReject
			alterInfo["audit_advice"] = common.GetAuditMsg(&msg.ProcessInputModel.WFCurComment, &msg.ProcessInputModel.Fields.AuditMsg)
		}
	}

	_, err = d.catalogRepo.AuditResultUpdate(nil, ctx, msg.ProcessDef.Category, catalogID, applySN, alterInfo)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to update audit result flow_type: %v catalog_id: %d audit_apply_sn: %s alterInfo: %+v, err: %v", msg.ProcessDef.Category, catalogID, applySN, alterInfo, err)
	}
	return err
}

func (d *DataCatalogDomain) AuditProcessDelMsgProc(ctx context.Context, auditType string, msg *wf_common.AuditProcDefDelMsg) error {
	defer func() {
		if err := recover(); err != nil {
			log.WithContext(ctx).Error("[mq] AuditProcessDelMsgProc ", zap.Any("err", err))
		}
	}()
	if len(msg.ProcDefKeys) == 0 {
		return nil
	}

	log.WithContext(ctx).Infof("recv audit type: %s proc_def_keys: %v delete msg, proc related unfinished audit process",
		auditType, msg.ProcDefKeys)

	_, err := d.catalogRepo.UpdateAuditStateByProcDefKey(nil, ctx, auditType, msg.ProcDefKeys)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to update audit type: %s proc_def_keys: %v related unfinished audit process to reject status, err: %v",
			auditType, msg.ProcDefKeys, err)
	}
	return err
}

/*
func (d *DataCatalogDomain) CreateAuditInstance(ctx context.Context, req *ReqAuditApplyParams) error {
	catalog, err := d.createAuditInstanceProc(ctx, req, req.FlowType)
	if err != nil {
		return err
	}

	if catalog != nil {
		mqMsgType := ""
		infos := make([]*InfoItem, 0)
		switch req.FlowType {
		case common.AUDIT_FLOW_TYPE_ONLINE:
			mqMsgType = MQ_MSG_TYPE_UPDATE

			// 关联的业务对象及信息系统
			objMap, infoSysMap, err := d.getInfosFromDB(ctx, []uint64{catalog.ID})
			if err != nil {
				log.WithContext(ctx).Errorf("failed to get data-catalog info from db, err info: %v", err.Error())
				return errorcode.Detail(errorcode.PublicInvalidParameter, err)
			}
			if res, ok := objMap[catalog.ID]; ok {
				// catalog 可关联多个业务对象
				obj := &InfoItem{
					InfoType: common.INFO_TYPE_BUSINESS_DOMAIN,
					Entries: lo.Map(res, func(item IDNameEntity, _ int) *InfoBase {
						return &InfoBase{InfoKey: item.ID, InfoValue: item.Name}
					}),
				}
				infos = append(infos, obj)
			}
			if res, ok := infoSysMap[catalog.ID]; ok {
				obj := &InfoItem{
					InfoType: common.INFO_TYPE_RELATED_SYSTEM,
					Entries:  []*InfoBase{{InfoKey: res[0].ID, InfoValue: res[0].Name}},
				}
				infos = append(infos, obj)
			}

		case common.AUDIT_FLOW_TYPE_OFFLINE:
			mqMsgType = MQ_MSG_TYPE_DELETE
		}

		c := context.Background()
		go packAndProduceMsg(d, c, mqMsgType, catalog, infos)
		if req.FlowType == common.AUDIT_FLOW_TYPE_OFFLINE {
			go downloadAuditCancel(d, c, catalog.Code)
		}
	}
	return err
}*/

/*
func (d *DataCatalogDomain) createAuditInstanceProc(ctx context.Context, req *ReqAuditApplyParams, flowType int) (catalog *model.TDataCatalog, resp *response.NameIDResp2, err error) {
	uInfo := request.GetUserInfo(ctx)
	catalogID := req.CatalogID.Uint64()
	catalog, err = d.catalogRepo.GetDetail(nil, ctx, catalogID, nil)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to get catalog from db, err: %v", err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil, errorcode.Detail(errorcode.PublicResourceNotExisted, "资源不存在")
		} else {
			return nil, nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
		}
	}

	//if _, exist := common.UserOrgContainsCatalogOrg(uInfo, catalog.Orgcode); !exist {
	//	// 目录的部门编码不存在用户所属的所有部门编码中
	//	log.WithContext(ctx).Errorf("failed to generate catalog id, err: %v", err)
	//	return nil, errorcode.Detail(errorcode.PublicNoAuthorization, "无当前资源操作权限")
	//}

	// if flowType == common.AUDIT_FLOW_TYPE_PUBLISH && len(catalog.OwnerId) == 0 {
	// 	log.WithContext(ctx).Errorf("audit apply not allowed, owner is required for catalog id %v audit type %d", flowType, req.CatalogID)
	// 	return nil, nil, errorcode.Desc(errorcode.DataCatalogNoOwnerErr)
	// }

	if !((flowType == common.AUDIT_FLOW_TYPE_PUBLISH &&
		(catalog.State == common.CATALOG_STATUS_DRAFT &&
			((catalog.FlowType == nil && catalog.AuditState == nil) ||
				(catalog.FlowType != nil && catalog.AuditState != nil &&
					*catalog.FlowType == common.AUDIT_FLOW_TYPE_PUBLISH && *catalog.AuditState == common.CATALOG_AUDIT_STATUS_REJECT))) ||
		(catalog.State == common.CATALOG_STATUS_OFFLINE && catalog.FlowType != nil && catalog.AuditState != nil &&
			((*catalog.FlowType == common.AUDIT_FLOW_TYPE_OFFLINE && *catalog.AuditState == common.CATALOG_AUDIT_STATUS_PASS) ||
				(*catalog.FlowType == common.AUDIT_FLOW_TYPE_PUBLISH && *catalog.AuditState == common.CATALOG_AUDIT_STATUS_REJECT)))) ||
		(flowType == common.AUDIT_FLOW_TYPE_ONLINE && catalog.State == common.CATALOG_STATUS_PUBLISHED &&
			catalog.FlowType != nil && catalog.AuditState != nil &&
			((*catalog.FlowType == common.AUDIT_FLOW_TYPE_PUBLISH && *catalog.AuditState == common.CATALOG_AUDIT_STATUS_PASS) ||
				(*catalog.FlowType == common.AUDIT_FLOW_TYPE_ONLINE && *catalog.AuditState == common.CATALOG_AUDIT_STATUS_REJECT))) ||
		(flowType == common.AUDIT_FLOW_TYPE_OFFLINE && catalog.State == common.CATALOG_STATUS_ONLINE &&
			catalog.FlowType != nil && catalog.AuditState != nil &&
			((*catalog.FlowType == common.AUDIT_FLOW_TYPE_ONLINE && *catalog.AuditState == common.CATALOG_AUDIT_STATUS_PASS) ||
				(*catalog.FlowType == common.AUDIT_FLOW_TYPE_OFFLINE && *catalog.AuditState == common.CATALOG_AUDIT_STATUS_REJECT)))) {
		var realFlowType, realAuditState interface{}
		if catalog.FlowType != nil {
			realFlowType = *catalog.FlowType
			realAuditState = *catalog.AuditState
		}
		log.WithContext(ctx).Errorf("audit apply not allowed, catalog id: %d audit type not matched (req: %d) or catalog state: %v flow type: %v audit state: %v not allowed",
			catalogID, flowType, catalog.State, realFlowType, realAuditState)
		// 目录不支持发起当前类型审核
		return nil, nil, errorcode.Detail(errorcode.PublicAuditApplyNotAllowedError, "目录不支持发起当前类型审核")
	}

	var auditType string
	switch flowType {
	case common.AUDIT_FLOW_TYPE_ONLINE:
		auditType = workflow.WORKFLOW_AUDIT_TYPE_CATALOG_ONLINE
	case common.AUDIT_FLOW_TYPE_CHANGE:
		auditType = workflow.WORKFLOW_AUDIT_TYPE_CATALOG_CHANGE
	case common.AUDIT_FLOW_TYPE_OFFLINE:
		auditType = workflow.WORKFLOW_AUDIT_TYPE_CATALOG_OFFLINE
	case common.AUDIT_FLOW_TYPE_PUBLISH:
		auditType = workflow.WORKFLOW_AUDIT_TYPE_CATALOG_PUBLISH
	}

	var flowInfos []*model.TDataCatalogAuditFlowBind
	flowInfos, err = d.flowRepo.Get(nil, ctx, 0, auditType)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to get audit flow info (type: %s), err: %v", auditType, err)
		return nil, nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	isPassDirectly := false
	// if len(flowInfos) != 1 {
	// 	if flowType == common.AUDIT_FLOW_TYPE_PUBLISH {
	// 		log.WithContext(ctx).Errorf("no audit flow info (type: %s) found", auditType)
	// 		// 没有可用的审核流程
	// 		return nil, nil, errorcode.Detail(errorcode.PublicNoAuditDefFoundError, "没有可用的审核流程")
	// 	}
	// 	isPassDirectly = true
	// }

	// if !isPassDirectly {
	if len(flowInfos) > 0 {
		if err = common.CheckAuditProcessDefinition(ctx, auditType, flowInfos[0].ProcDefKey); err != nil {
			// if flowType == common.AUDIT_FLOW_TYPE_PUBLISH {
			// 	return nil, nil, err
			// }
			isPassDirectly = true
		}
	} else {
		isPassDirectly = true
	}

	if !isPassDirectly && flowType == common.AUDIT_FLOW_TYPE_PUBLISH && len(catalog.OwnerId) == 0 {
		log.WithContext(ctx).Errorf("audit apply not allowed, owner is required for catalog id %v audit type %d", flowType, req.CatalogID)
		return nil, nil, errorcode.Desc(errorcode.DataCatalogNoOwnerErr)
	}

	t := time.Now()
	alterInfo := map[string]interface{}{
		"flow_id":        "",
		"flow_type":      flowType,
		"updated_at":     &util.Time{Time: t},
		"audit_apply_sn": catalog.AuditApplySN,
		"proc_def_key":   "",
	}

	if isPassDirectly {
		alterInfo["is_indexed"] = 0
		catalog.UpdatedAt = &t
		switch flowType {
		case common.AUDIT_FLOW_TYPE_PUBLISH:
			catalog.State = common.CATALOG_STATUS_PUBLISHED
			catalog.PublishedAt = catalog.UpdatedAt
			alterInfo["state"] = common.CATALOG_STATUS_PUBLISHED
			alterInfo["published_at"] = alterInfo["updated_at"]
		case common.AUDIT_FLOW_TYPE_ONLINE:
			catalog.State = common.CATALOG_STATUS_ONLINE
			catalog.PublishedAt = catalog.UpdatedAt
			alterInfo["state"] = common.CATALOG_STATUS_ONLINE
			alterInfo["published_at"] = alterInfo["updated_at"]
		case common.AUDIT_FLOW_TYPE_OFFLINE:
			catalog.State = common.CATALOG_STATUS_OFFLINE
			alterInfo["state"] = common.CATALOG_STATUS_OFFLINE
			alterInfo["is_canceled"] = 0
		}

		alterInfo["audit_state"] = common.CATALOG_AUDIT_STATUS_PASS
	} else {
		catalog.AuditApplySN, err = utils.GetUniqueID()
		if err != nil {
			log.WithContext(ctx).Errorf("failed to generate audit apply sn, err: %v", err)
			return nil, nil, errorcode.Detail(errorcode.PublicInternalError, err)
		}
		alterInfo["proc_def_key"] = flowInfos[0].ProcDefKey
		alterInfo["audit_state"] = common.CATALOG_AUDIT_STATUS_UNDER_REVIEW
		alterInfo["audit_apply_sn"] = catalog.AuditApplySN
	}

	tx := d.data.DB.WithContext(ctx).Begin()
	defer func(err *error, cata *model.TDataCatalog) {
		if e := recover(); e != nil {
			cata = nil
			*err = e.(error)
			tx.Rollback()
		} else if e = tx.Commit().Error; e != nil {
			cata = nil
			*err = errorcode.Detail(errorcode.PublicDatabaseError, e)
			tx.Rollback()
		}
	}(&err, catalog)

	var bRet bool
	bRet, err = d.catalogRepo.AuditApplyUpdate(tx, ctx, catalogID, flowType, alterInfo)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to audit apply (catalog_id: %d audit_type: %s) update, err: %v",
			catalogID, auditType, err)
		panic(errorcode.Detail(errorcode.PublicDatabaseError, err))
	}
	if !bRet {
		log.WithContext(ctx).Errorf("audit apply (catalog_id: %d audit_type: %s) not allowed",
			catalogID, auditType)
		// 目录不支持发起当前类型审核
		panic(errorcode.Detail(errorcode.PublicAuditApplyNotAllowedError, "目录不支持发起当前类型审核"))
	}

	if !isPassDirectly {
		msg := &workflow.AuditApplyMsg{}
		msg.Process.ApplyID = common.GenAuditApplyID(catalog.ID, catalog.AuditApplySN)
		msg.Process.AuditType = auditType
		msg.Process.UserID = uInfo.ID
		msg.Process.UserName = uInfo.Name
		msg.Process.ProcDefKey = flowInfos[0].ProcDefKey
		msg.Data = map[string]any{
			"id":             fmt.Sprint(catalog.ID),
			"code":           catalog.Code,
			"title":          catalog.Title,
			"version":        catalog.Version,
			"submitter":      uInfo.ID,
			"submit_time":    t.UnixMilli(),
			"submitter_name": uInfo.Name,
		}
		msg.Workflow.TopCsf = 5
		msg.Workflow.AbstractInfo.Icon = common.AUDIT_ICON_BASE64
		msg.Workflow.AbstractInfo.Text = "目录名称：" + catalog.Title
		msg.Workflow.Webhooks = []workflow.Webhook{
			{
				Webhook:     settings.GetConfig().DepServicesConf.DataCatalogHost + "/api/internal/data-catalog/v1/audits/" + msg.Process.ApplyID + "/auditors?auditGroupType=2",
				StrategyTag: common.OWNER_AUDIT_STRATEGY_TAG,
			},
		}

		err = d.wf.AuditApply(msg)
		if err != nil {
			log.WithContext(ctx).Errorf("failed to apply audit (catalog_id: %d audit_type: %s), produce msg to nsq failed, err: %v",
				catalogID, auditType, err)
			panic(errorcode.Detail(errorcode.PublicAuditApplyFailedError, err))
		}
		catalog = nil
	}

	return catalog, &response.NameIDResp2{ID: fmt.Sprint(catalogID)}, nil
}
*/
