package impl

import (
	"context"
	"strconv"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/common"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/info_resource_catalog"
	"github.com/kweaver-ai/idrm-go-common/errorcode"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"gorm.io/gorm"
)

var onlineStatusOnline = []any{
	info_resource_catalog.OnlineStatusOnline.Integer.Int8(),
	info_resource_catalog.OnlineStatusOnlineDownAuditing.Integer.Int8(),
	info_resource_catalog.OnlineStatusOnlineDownReject.Integer.Int8(),
}

func (d *infoResourceCatalogDomain) nextStatus(entity *info_resource_catalog.InfoResourceCatalog) (success bool) {
	switch entity.PublishStatus {
	// [提交发布] 变为发布审核中
	case info_resource_catalog.PublishStatusUnpublished, info_resource_catalog.PublishStatusPubReject:
		entity.PublishStatus = info_resource_catalog.PublishStatusPubAuditing
		success = true // [/]
	case info_resource_catalog.PublishStatusPublished:
		if entity.NextID == "0" {
			switch entity.OnlineStatus {
			// [申请上线] 变为未上线（上线审核中）
			case info_resource_catalog.OnlineStatusNotOnline, info_resource_catalog.OnlineStatusNotOnlineUpReject:
				entity.OnlineStatus = info_resource_catalog.OnlineStatusNotOnlineUpAuditing
				success = true // [/]
			// [申请上线] 变为已下线（上线审核中）
			case info_resource_catalog.OnlineStatusOffline, info_resource_catalog.OnlineStatusOfflineUpReject:
				entity.OnlineStatus = info_resource_catalog.OnlineStatusOfflineUpAuditing
				success = true // [/]
			// [申请下线] 变为已上线（下线审核中）
			case info_resource_catalog.OnlineStatusOnline, info_resource_catalog.OnlineStatusOnlineDownReject:
				entity.OnlineStatus = info_resource_catalog.OnlineStatusOnlineDownAuditing
				success = true // [/]
			}
		}
	}
	return
}

func (d *infoResourceCatalogDomain) stateTransfer(entity *info_resource_catalog.InfoResourceCatalog, target info_resource_catalog.EnumTargetStatus) (err error) {
	if !entity.CurrentVersion {
		return
	}
	// [执行状态转移并记录结果]
	var success bool
	switch target {
	case info_resource_catalog.StatusTargetNext:
		success = d.nextStatus(entity)
	case info_resource_catalog.StatusTargetPrevious:
		success = d.prevStatus(entity)
	} // [/]
	// [生成状态转移失败的业务错误]
	if !success {
		log.Infof("[state transfer fail] catalog name: %v, current status: %v-%v\n", entity.Name, entity.PublishStatus.String, entity.OnlineStatus.String)
		err = errorcode.Desc(info_resource_catalog.ErrUpdateStatusFailInvalidTargetStatus)
	} // [/]
	return
}

func (d *infoResourceCatalogDomain) prevStatus(entity *info_resource_catalog.InfoResourceCatalog) (success bool) {
	switch entity.PublishStatus {
	// [撤销发布] 变为未发布
	case info_resource_catalog.PublishStatusPubAuditing:
		entity.PublishStatus = info_resource_catalog.PublishStatusUnpublished
		success = true // [/]
	case info_resource_catalog.PublishStatusPublished:
		if entity.NextID == "0" {
			switch entity.OnlineStatus {
			// [撤销上线] 变为未上线
			case info_resource_catalog.OnlineStatusNotOnlineUpAuditing:
				entity.OnlineStatus = info_resource_catalog.OnlineStatusNotOnline
				success = true // [/]
				// [撤销上线] 变为已下线
			case info_resource_catalog.OnlineStatusOfflineUpAuditing:
				entity.OnlineStatus = info_resource_catalog.OnlineStatusOffline
				success = true // [/]
			// [撤销下线] 变为已上线
			case info_resource_catalog.OnlineStatusOnlineDownAuditing:
				entity.OnlineStatus = info_resource_catalog.OnlineStatusOnline
				success = true // [/]
			}
		}
	}
	return
}

func (d *infoResourceCatalogDomain) initStatus(catalog *info_resource_catalog.InfoResourceCatalog) {
	catalog.PublishStatus = info_resource_catalog.PublishStatusUnpublished
	catalog.PublishAt = time.UnixMilli(0)
	catalog.OnlineStatus = info_resource_catalog.OnlineStatusNotOnline
	catalog.OnlineAt = time.UnixMilli(0)
	catalog.UpdateAt = time.Now()
	catalog.DeleteAt = time.UnixMilli(0)
	catalog.CurrentVersion = true
	catalog.AlterUID = ""
	catalog.AlterName = ""
	catalog.AlterAt = time.UnixMilli(0)
	catalog.PreID = "0"
	catalog.NextID = "0"
	catalog.AlterAuditMsg = ""
	return
}

func (d *infoResourceCatalogDomain) publishAuditTargetStatus(catalog *info_resource_catalog.InfoResourceCatalog, auditResult string) (success bool, origin, target string, updateFields []string) {
	originStatus := catalog.PublishStatus
	updateFields = make([]string, 1, 2)
	updateFields[0] = "PublishStatus"
	// [计算目标状态]
	var targetStatus info_resource_catalog.EnumPublishStatus
	switch auditResult {
	case common.AUDIT_RESULT_PASS:
		targetStatus = info_resource_catalog.PublishStatusPublished
		catalog.PublishAt = time.Now()
		updateFields = append(updateFields, "PublishAt")
	case common.AUDIT_RESULT_REJECT:
		targetStatus = info_resource_catalog.PublishStatusPubReject
	case common.AUDIT_RESULT_UNDONE:
		targetStatus = info_resource_catalog.PublishStatusUnpublished
	} // [/]
	// [记录初始状态和目标状态]
	origin = originStatus.String
	target = targetStatus.String // [/]
	// [检查并更新状态]
	if originStatus != info_resource_catalog.PublishStatusPubAuditing {
		return
	}
	catalog.PublishStatus = targetStatus
	success = true // [/]
	return
}

func (d *infoResourceCatalogDomain) onlineAuditTargetStatus(catalog *info_resource_catalog.InfoResourceCatalog, auditResult string) (success bool, origin, target string, updateFields []string) {
	originStatus := catalog.OnlineStatus
	parentStatus := catalog.PublishStatus
	updateFields = make([]string, 1, 2)
	updateFields[0] = "OnlineStatus"
	// [计算目标状态]
	var targetStatus info_resource_catalog.EnumOnlineStatus
	switch auditResult {
	case common.AUDIT_RESULT_PASS:
		targetStatus = info_resource_catalog.OnlineStatusOnline
		catalog.OnlineAt = time.Now()
		updateFields = append(updateFields, "OnlineAt")
	case common.AUDIT_RESULT_REJECT:
		if catalog.OnlineStatus == info_resource_catalog.OnlineStatusNotOnlineUpAuditing {
			targetStatus = info_resource_catalog.OnlineStatusNotOnlineUpReject
		} else if catalog.OnlineStatus == info_resource_catalog.OnlineStatusOfflineUpAuditing {
			targetStatus = info_resource_catalog.OnlineStatusOfflineUpReject
		}
	case common.AUDIT_RESULT_UNDONE:
		if catalog.OnlineStatus == info_resource_catalog.OnlineStatusNotOnlineUpAuditing {
			targetStatus = info_resource_catalog.OnlineStatusNotOnline
		} else if catalog.OnlineStatus == info_resource_catalog.OnlineStatusOfflineUpAuditing {
			targetStatus = info_resource_catalog.OnlineStatusOffline
		}
	} // [/]
	// [记录初始状态和目标状态]
	origin = originStatus.String + "(" + parentStatus.String + ")"
	target = targetStatus.String // [/]
	// [检查并更新状态]
	if parentStatus != info_resource_catalog.PublishStatusPublished ||
		(originStatus != info_resource_catalog.OnlineStatusNotOnlineUpAuditing &&
			originStatus != info_resource_catalog.OnlineStatusOfflineUpAuditing) {
		return
	}
	catalog.OnlineStatus = targetStatus
	success = true // [/]
	return
}

func (d *infoResourceCatalogDomain) offlineAuditTargetStatus(catalog *info_resource_catalog.InfoResourceCatalog, auditResult string) (success bool, origin, target string, updateFields []string) {
	originStatus := catalog.OnlineStatus
	parentStatus := catalog.PublishStatus
	updateFields = []string{"OnlineStatus"}
	// [计算目标状态]
	var targetStatus info_resource_catalog.EnumOnlineStatus
	switch auditResult {
	case common.AUDIT_RESULT_PASS:
		targetStatus = info_resource_catalog.OnlineStatusOffline
	case common.AUDIT_RESULT_REJECT:
		targetStatus = info_resource_catalog.OnlineStatusOnlineDownReject
	case common.AUDIT_RESULT_UNDONE:
		targetStatus = info_resource_catalog.OnlineStatusOnline
	} // [/]
	// [记录初始状态和目标状态]
	origin = originStatus.String + "(" + parentStatus.String + ")"
	target = targetStatus.String // [/]
	// [检查并更新状态]
	if parentStatus != info_resource_catalog.PublishStatusPublished ||
		originStatus != info_resource_catalog.OnlineStatusOnlineDownAuditing {
		return
	}
	catalog.OnlineStatus = targetStatus
	success = true // [/]
	return
}

func (d *infoResourceCatalogDomain) alterAuditProc(ctx context.Context, catalog *info_resource_catalog.InfoResourceCatalog, auditResult string) (err error) {
	var (
		curCatalog *info_resource_catalog.InfoResourceCatalog
		preID      int64
	)
	if len(catalog.PreID) > 0 {
		if preID, err = strconv.ParseInt(catalog.PreID, 10, 64); err != nil {
			return
		}
	}
	if curCatalog, err = d.repo.FindByID(ctx, preID); err != nil {
		return
	}

	timeNow := time.Now()
	switch auditResult {
	case common.AUDIT_RESULT_PASS:
		curCatalog.Name = catalog.Name
		// curCatalog.SourceBusinessForm = catalog.SourceBusinessForm
		// curCatalog.SourceDepartment = catalog.SourceDepartment
		curCatalog.BelongDepartment = catalog.BelongDepartment
		curCatalog.BelongOffice = catalog.BelongOffice
		curCatalog.BelongBusinessProcessList = catalog.BelongBusinessProcessList
		curCatalog.DataRange = catalog.DataRange
		curCatalog.UpdateCycle = catalog.UpdateCycle
		curCatalog.OfficeBusinessResponsibility = catalog.OfficeBusinessResponsibility
		curCatalog.Description = catalog.Description
		curCatalog.CategoryNodeList = catalog.CategoryNodeList
		curCatalog.RelatedInfoSystemList = catalog.RelatedInfoSystemList
		curCatalog.RelatedDataResourceCatalogList = catalog.RelatedDataResourceCatalogList
		curCatalog.SourceBusinessSceneList = catalog.SourceBusinessSceneList
		curCatalog.RelatedBusinessSceneList = catalog.RelatedBusinessSceneList
		curCatalog.RelatedInfoClassList = catalog.RelatedInfoClassList
		curCatalog.RelatedInfoItemList = catalog.RelatedInfoItemList
		curCatalog.SharedType = catalog.SharedType
		curCatalog.SharedMessage = catalog.SharedMessage
		curCatalog.SharedMode = catalog.SharedMode
		curCatalog.OpenType = catalog.OpenType
		curCatalog.OpenCondition = catalog.OpenCondition
		curCatalog.PublishStatus = info_resource_catalog.PublishStatusPublished
		curCatalog.UpdateAt = time.Now()
		curCatalog.Columns = catalog.Columns
		curCatalog.AlterUID = ""
		curCatalog.AlterName = ""
		curCatalog.AlterAt = time.UnixMilli(0)
		curCatalog.PreID = "0"
		curCatalog.AlterAuditMsg = ""
		if err = d.repo.HandleDbTx(ctx,
			func(tx *gorm.DB) error {
				return d.repo.AlterComplete(tx, curCatalog)
			},
		); err == nil {
			err = d.updateEsIndex(ctx, curCatalog)
		}
	case common.AUDIT_RESULT_REJECT:
		curCatalog.PublishStatus = info_resource_catalog.PublishStatusChReject
		curCatalog.UpdateAt = timeNow
		catalog.PublishStatus = info_resource_catalog.PublishStatusChReject
		catalog.AuditInfo.ID = 0
		catalog.UpdateAt = timeNow
		err = d.repo.HandleDbTx(ctx,
			func(tx *gorm.DB) error {
				return d.repo.BatchUpdateForAudit(tx, []*info_resource_catalog.InfoResourceCatalog{curCatalog, catalog})
			},
		)
	case common.AUDIT_RESULT_UNDONE:
		curCatalog.PublishStatus = info_resource_catalog.PublishStatusPublished
		curCatalog.UpdateAt = timeNow
		catalog.PublishStatus = info_resource_catalog.PublishStatusUnpublished
		catalog.UpdateAt = timeNow
		catalog.AuditInfo.ID = 0
		err = d.repo.HandleDbTx(ctx,
			func(tx *gorm.DB) error {
				return d.repo.BatchUpdateForAudit(tx, []*info_resource_catalog.InfoResourceCatalog{curCatalog, catalog})
			},
		)
	}
	return
}

func (d *infoResourceCatalogDomain) resetAudit(ctx context.Context, auditType info_resource_catalog.EnumAuditType) (catalogs []*info_resource_catalog.InfoResourceCatalog, err error) {
	// [查询审核流程，流程存在时跳过处理]
	processKey, err := d.getAuditProcessKey(ctx, auditType)
	if err != nil || processKey != "" {
		return
	} // [/]
	// [根据审核类型重置审核状态]
	switch auditType {
	case info_resource_catalog.AuditTypePublish:
		return d.resetPublishAuditStatus(ctx)
	case info_resource_catalog.AuditTypeOnline:
		return d.resetOnlineAuditStatus(ctx)
	case info_resource_catalog.AuditTypeOffline:
		return d.resetOfflineAuditStatus(ctx)
	} // [/]
	return
}

func (d *infoResourceCatalogDomain) resetPublishAuditStatus(ctx context.Context) (catalogs []*info_resource_catalog.InfoResourceCatalog, err error) {
	// [构建查询参数]
	equals := []*info_resource_catalog.SearchParamItem{
		{
			Keys:     []string{"PublishStatus"},
			Values:   []any{info_resource_catalog.PublishStatusPubAuditing.Integer.Int8()},
			Exclude:  false,
			Priority: 0,
		},
	} // [/]
	// [查询更新项]
	catalogs, err = d.repo.ListBy(ctx, nil, "", nil, equals, nil, nil, nil, 0, 0)
	if err != nil {
		return
	}
	for _, catalog := range catalogs {
		catalog.PublishStatus = info_resource_catalog.PublishStatusUnpublished
		d.resetAuditID(catalog)
	} // [/]
	// [重置发布审核]
	updates := map[string]any{
		"PublishStatus": info_resource_catalog.PublishStatusUnpublished.Integer.Int8(),
		"AuditID":       0,
	}
	err = d.repo.BatchUpdateBy(ctx, equals, updates) // [/]
	return
}

func (d *infoResourceCatalogDomain) resetOnlineAuditStatus(ctx context.Context) (catalogs []*info_resource_catalog.InfoResourceCatalog, err error) {
	// [构建查询参数]
	in := []*info_resource_catalog.SearchParamItem{
		{
			Keys: []string{"OnlineStatus"},
			Values: []any{
				info_resource_catalog.OnlineStatusNotOnlineUpAuditing.Integer.Int8(),
				info_resource_catalog.OnlineStatusOfflineUpAuditing.Integer.Int8(),
			},
			Exclude:  false,
			Priority: 0,
		},
	} // [/]
	// [查询更新项]
	catalogs, err = d.repo.ListBy(ctx, nil, "", in, nil, nil, nil, nil, 0, 0)
	if err != nil {
		return
	}
	for _, catalog := range catalogs {
		catalog.OnlineStatus = info_resource_catalog.OnlineStatusNotOnline
		d.resetAuditID(catalog)
	} // [/]
	// [重置上线审核]
	updates := map[string]any{
		"OnlineStatus": info_resource_catalog.OnlineStatusNotOnline.Integer.Int8(),
		"AuditID":      0,
	}
	err = d.repo.BatchUpdateBy(ctx, in, updates) // [/]
	return
}

func (d *infoResourceCatalogDomain) resetOfflineAuditStatus(ctx context.Context) (catalogs []*info_resource_catalog.InfoResourceCatalog, err error) {
	// [构建查询参数]
	equals := []*info_resource_catalog.SearchParamItem{
		{
			Keys:     []string{"OnlineStatus"},
			Values:   []any{info_resource_catalog.OnlineStatusOnlineDownAuditing.Integer.Int8()},
			Exclude:  false,
			Priority: 0,
		},
	} // [/]
	// [查询更新项]
	catalogs, err = d.repo.ListBy(ctx, nil, "", nil, equals, nil, nil, nil, 0, 0)
	if err != nil {
		return
	}
	for _, catalog := range catalogs {
		catalog.OnlineStatus = info_resource_catalog.OnlineStatusOnline
		d.resetAuditID(catalog)
	} // [/]
	// [重置下线审核]
	updates := map[string]any{
		"OnlineStatus": info_resource_catalog.OnlineStatusOnline.Integer.Int8(),
		"AuditID":      0,
	}
	err = d.repo.BatchUpdateBy(ctx, equals, updates) // [/]
	return
}
