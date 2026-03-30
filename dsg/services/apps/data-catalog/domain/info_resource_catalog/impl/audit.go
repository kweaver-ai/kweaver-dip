package impl

import (
	"context"
	"database/sql"
	"fmt"
	"strconv"
	"time"

	"github.com/biocrosscoder/flex/typed/collections/arraylist"
	"github.com/biocrosscoder/flex/typed/functools"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/request"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/common"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/info_resource_catalog"
	"github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
	wf_common "github.com/kweaver-ai/idrm-go-common/workflow/common"
	"github.com/kweaver-ai/idrm-go-frame/core/enum"
	"github.com/kweaver-ai/idrm-go-frame/core/utils"
	"gorm.io/gorm"
)

func (d *infoResourceCatalogDomain) getAuditProcessKey(ctx context.Context, auditType info_resource_catalog.EnumAuditType) (key string, err error) {
	req := &configuration_center.GetProcessBindByAuditTypeReq{
		AuditType: auditType.String,
	}
	process, err := d.confCenter.GetProcessBindByAuditType(ctx, req)
	if err != nil {
		return
	}
	key = process.ProcDefKey
	return
}

func (d *infoResourceCatalogDomain) generateAuditApplyID(catalog *info_resource_catalog.InfoResourceCatalog) (applyID string) {
	// [解析对象ID]
	objectID, err := strconv.ParseUint(catalog.ID, 10, 64)
	if err != nil {
		return
	} // [/]
	// [生成审核序号]
	if catalog.AuditInfo.ID == 0 {
		applySN, err := utils.GetUniqueID()
		if err != nil {
			return
		}
		catalog.AuditInfo.ID = int64(applySN)
	} // [/]
	return common.GenAuditApplyID(objectID, uint64(catalog.AuditInfo.ID))
}

func (d *infoResourceCatalogDomain) createAudit(ctx context.Context, catalog *info_resource_catalog.InfoResourceCatalog, auditType info_resource_catalog.EnumAuditType, processKey string, createTime time.Time) (err error) {
	userInfo := request.GetUserInfo(ctx)
	msg := &wf_common.AuditApplyMsg{
		Process: wf_common.AuditApplyProcessInfo{
			AuditType:  auditType.String,
			ApplyID:    d.generateAuditApplyID(catalog),
			UserID:     userInfo.ID,
			UserName:   userInfo.Name,
			ProcDefKey: processKey,
		},
		Data: map[string]any{
			"id":             catalog.ID,
			"code":           catalog.Code,
			"title":          catalog.Name,
			"submitter":      userInfo.ID,
			"submit_time":    createTime,
			"submitter_name": userInfo.Name,
		},
		Workflow: wf_common.AuditApplyWorkflowInfo{
			TopCsf: 5,
			AbstractInfo: wf_common.AuditApplyAbstractInfo{
				Icon: common.AUDIT_ICON_BASE64,
				Text: "目录名称：" + catalog.Name + "(" + catalog.Code + ")",
			},
		}, // [/]
	}
	// [发起审核]
	err = d.workflow.AuditApply(msg)
	if err != nil {
		catalog.AuditInfo.ID = 0
	} // [/]
	return
}

func (d *infoResourceCatalogDomain) execAudit(ctx context.Context, auditType info_resource_catalog.EnumAuditType, catalog *info_resource_catalog.InfoResourceCatalog) (updateFields []string, err error) {
	// [查询审核流程]
	processKey, err := d.getAuditProcessKey(ctx, auditType)
	if err != nil {
		return
	} // [/]
	// [审核流程不存在则直接通过审核]
	currentTime := time.Now()
	if processKey == "" {
		switch auditType {
		case info_resource_catalog.AuditTypePublish:
			catalog.PublishStatus = info_resource_catalog.PublishStatusPublished
			catalog.PublishAt = catalog.UpdateAt
		case info_resource_catalog.AuditTypeOnline:
			catalog.OnlineStatus = info_resource_catalog.OnlineStatusOnline
			catalog.OnlineAt = currentTime
		case info_resource_catalog.AuditTypeOffline:
			catalog.OnlineStatus = info_resource_catalog.OnlineStatusOffline
		}
	} else {
		err = d.createAudit(ctx, catalog, auditType, processKey, currentTime)
		if err != nil {
			return
		}
	} // [/]
	updateFields = d.generateUpdateFields(auditType)
	return
}

func (d *infoResourceCatalogDomain) generateUpdateFields(auditType info_resource_catalog.EnumAuditType) (updateFields []string) {
	updateFields = []string{"AuditID"}
	switch auditType {
	case info_resource_catalog.AuditTypePublish:
		updateFields = append(updateFields, "PublishStatus", "PublishAt")
	case info_resource_catalog.AuditTypeOnline:
		updateFields = append(updateFields, "OnlineStatus", "OnlineAt")
	case info_resource_catalog.AuditTypeOffline:
		updateFields = append(updateFields, "OnlineStatus")
	}
	return
}

func (d *infoResourceCatalogDomain) cancelAudit(catalog *info_resource_catalog.InfoResourceCatalog, auditType info_resource_catalog.EnumAuditType) (updateFields []string, err error) {
	msg := &wf_common.AuditCancelMsg{
		ApplyIDs: []string{d.generateAuditApplyID(catalog)},
	}
	err = d.workflow.AuditCancel(msg)
	if err == nil {
		catalog.AuditInfo.ID = 0
		updateFields = d.generateUpdateFields(auditType)
	}
	return
}

func (d *infoResourceCatalogDomain) handleAuditResult(ctx context.Context, auditType string, msg *wf_common.AuditResultMsg) error {
	return util.SafeRun(ctx, func(ctx context.Context) (err error) {
		// [解析审核ID]
		catalogID, auditID, err := common.ParseAuditApplyID(msg.ApplyID)
		if err != nil {
			return
		} // [/]
		// [查询审核对象]
		catalog, err := d.repo.FindByIDForAlter(ctx, int64(catalogID))
		if err != nil {
			return
		} // [/]
		if catalog.AuditInfo.ID != int64(auditID) {
			return
		}
		// [根据审核结果更新状态]
		var originStatus, targetStatus string
		var success bool
		var updateFields []string
		switch auditType {
		case info_resource_catalog.AuditTypePublish.String:
			success, originStatus, targetStatus, updateFields = d.publishAuditTargetStatus(catalog, msg.Result)
		case info_resource_catalog.AuditTypeOnline.String:
			success, originStatus, targetStatus, updateFields = d.onlineAuditTargetStatus(catalog, msg.Result)
		case info_resource_catalog.AuditTypeOffline.String:
			success, originStatus, targetStatus, updateFields = d.offlineAuditTargetStatus(catalog, msg.Result)
		case info_resource_catalog.AuditTypeAlter.String:
			return d.alterAuditProc(ctx, catalog, msg.Result)
		}
		if !success {
			err = fmt.Errorf("InvalidStatusTransfer: %s -> %s", originStatus, targetStatus)
			return
		} // [/]
		// [更新数据库]
		catalog.AuditInfo.ID = 0
		updateFields = append(updateFields, "AuditID")
		err = d.repo.Modify(ctx, catalog, updateFields)
		if err != nil {
			return
		} // [/]
		err = d.updateEsIndex(ctx, catalog)
		return
	})
}

func (d *infoResourceCatalogDomain) handleAuditProcessDelete(ctx context.Context, auditType string, msg *wf_common.AuditProcDefDelMsg) error {
	return util.SafeRun(ctx, func(ctx context.Context) (err error) {
		if len(msg.ProcDefKeys) == 0 {
			return
		}
		catalogs, err := d.resetAudit(ctx, *enum.Get[info_resource_catalog.EnumAuditType](auditType))
		if err != nil {
			return
		}
		// [查询类目节点]
		equals := []*info_resource_catalog.SearchParamItem{
			{
				Keys: []string{"InfoResourceCatalogID"},
				Values: functools.Map(func(x *info_resource_catalog.InfoResourceCatalog) any {
					return x.ID
				}, catalogs),
			},
		}
		categoryNodes, err := d.repo.GetRelatedCategoryNodes(ctx, equals)
		if err != nil {
			return
		} // [/]
		// [推送搜索引擎更新] 由于目前使用create消息全量更新，需要补齐必要信息防止更新索引导致文档字段数据丢失
		for _, catalog := range catalogs {
			catalog.CategoryNodeList = categoryNodes.Get(catalog.ID, arraylist.Of[*info_resource_catalog.CategoryNode]())
			err = d.updateEsIndex(ctx, catalog)
			if err != nil {
				return
			}
		} // [/]
		return
	})
}

func (d *infoResourceCatalogDomain) handleAuditStatusChange() {
	// [处理发布审核]
	d.workflow.RegistConusmeHandlers(
		info_resource_catalog.AuditTypePublish.String,
		d.handleAuditProcessMsg,
		common.HandlerFunc(info_resource_catalog.AuditTypePublish.String, d.handleAuditResult),
		common.HandlerFunc(info_resource_catalog.AuditTypePublish.String, d.handleAuditProcessDelete),
	) // [/]
	// [处理上线审核]
	d.workflow.RegistConusmeHandlers(
		info_resource_catalog.AuditTypeOnline.String,
		d.handleAuditProcessMsg,
		common.HandlerFunc(info_resource_catalog.AuditTypeOnline.String, d.handleAuditResult),
		common.HandlerFunc(info_resource_catalog.AuditTypeOnline.String, d.handleAuditProcessDelete),
	) // [/]
	// [处理下线审核]
	d.workflow.RegistConusmeHandlers(
		info_resource_catalog.AuditTypeOffline.String,
		d.handleAuditProcessMsg,
		common.HandlerFunc(info_resource_catalog.AuditTypeOffline.String, d.handleAuditResult),
		common.HandlerFunc(info_resource_catalog.AuditTypeOffline.String, d.handleAuditProcessDelete),
	) // [/]
	// [处理下线审核]
	d.workflow.RegistConusmeHandlers(
		info_resource_catalog.AuditTypeAlter.String,
		d.handleAlterAuditProcessMsg,
		common.HandlerFunc(info_resource_catalog.AuditTypeAlter.String, d.handleAuditResult),
		nil,
	) // [/]
}

func (d *infoResourceCatalogDomain) resetAuditID(catalog *info_resource_catalog.InfoResourceCatalog) {
	catalog.AuditInfo.ID = 0
}

func (d *infoResourceCatalogDomain) handleAuditProcessMsg(ctx context.Context, msg *wf_common.AuditProcessMsg) error {
	return util.SafeRun(ctx, func(ctx context.Context) (err error) {
		// [检查审核类型与审核意见] 审核类型不匹配或审核意见不是拒绝时跳过处理
		if !util.Contains(functools.Map(func(x info_resource_catalog.EnumAuditType) string {
			return x.String
		}, enum.List[info_resource_catalog.EnumAuditType]()), msg.GetAuditType()) || msg.ProcessInputModel.Fields.AuditIdea {
			return
		} // [/]
		// [解析审核ID]
		catalogID, auditID, err := common.ParseAuditApplyID(msg.ProcessInputModel.Fields.ApplyID)
		if err != nil {
			return
		} // [/]
		// [查询审核对象]
		catalog, err := d.repo.FindByID(ctx, int64(catalogID))
		if err != nil {
			// [未匹配到记录则跳过处理]
			if err == sql.ErrNoRows || err == gorm.ErrRecordNotFound {
				err = nil
			} // [/]
			return
		} // [/]
		if catalog.AuditInfo.ID != int64(auditID) {
			return
		}
		// [更新数据库]
		catalog.AuditInfo.Msg = *msg.GetAuditMsg()
		if catalog.AuditInfo.Msg != "" {
			err = d.repo.Modify(ctx, catalog, []string{"AuditMsg"})
		} // [/]
		return
	})
}

func (d *infoResourceCatalogDomain) handleAlterAuditProcessMsg(ctx context.Context, msg *wf_common.AuditProcessMsg) error {
	return util.SafeRun(ctx, func(ctx context.Context) (err error) {
		// [检查审核类型与审核意见] 审核类型不匹配或审核意见不是拒绝时跳过处理
		if !util.Contains(functools.Map(func(x info_resource_catalog.EnumAuditType) string {
			return x.String
		}, enum.List[info_resource_catalog.EnumAuditType]()), msg.GetAuditType()) || msg.ProcessInputModel.Fields.AuditIdea {
			return
		} // [/]
		// [解析审核ID]
		catalogID, auditID, err := common.ParseAuditApplyID(msg.ProcessInputModel.Fields.ApplyID)
		if err != nil {
			return
		} // [/]
		var (
			preID               int64
			catalog, curCatalog *info_resource_catalog.InfoResourceCatalog
		)
		// [查询审核对象]
		catalog, err = d.repo.FindByID(ctx, int64(catalogID))
		if err != nil {
			// [未匹配到记录则跳过处理]
			if err == sql.ErrNoRows || err == gorm.ErrRecordNotFound {
				err = nil
			} // [/]
			return
		} // [/]
		if catalog.AuditInfo.ID != int64(auditID) {
			return
		}
		if catalog.CurrentVersion {
			return
		}
		if len(catalog.PreID) == 0 {
			return
		}
		if preID, err = strconv.ParseInt(catalog.PreID, 10, 64); err != nil {
			return
		}
		if preID == 0 {
			return
		}
		if curCatalog, err = d.repo.FindByID(ctx, int64(preID)); err != nil {
			return
		}

		// [更新数据库]
		catalog.AlterAuditMsg = *msg.GetAuditMsg()
		curCatalog.AlterAuditMsg = catalog.AlterAuditMsg
		if catalog.AlterAuditMsg != "" {
			if err = d.repo.Modify(ctx, catalog, []string{"AlterAuditMsg"}); err == nil {
				err = d.repo.Modify(ctx, curCatalog, []string{"AlterAuditMsg"})
			}
		} // [/]
		return
	})
}

func (d *infoResourceCatalogDomain) isAuditRejected(entity *info_resource_catalog.InfoResourceCatalog) bool {
	return entity.PublishStatus == info_resource_catalog.PublishStatusPubReject ||
		entity.OnlineStatus == info_resource_catalog.OnlineStatusNotOnlineUpReject ||
		entity.OnlineStatus == info_resource_catalog.OnlineStatusOfflineUpReject ||
		entity.OnlineStatus == info_resource_catalog.OnlineStatusOnlineDownReject
}
