package data_catalog

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/constant"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/common"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	wf_common "github.com/kweaver-ai/idrm-go-common/workflow/common"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/pkg/errors"
	"gorm.io/gorm"
)

func downloadAuditCancel(d *DataCatalogDomain, ctx context.Context, code string) {
	downloadApplyDatas, err := d.daRepo.Get(nil, ctx, code, "", 0, 0, constant.AuditStatusAuditing)
	if err != nil {
		log.WithContext(ctx).Errorf("", err)
		return
	}

	if len(downloadApplyDatas) > 0 {
		msg := &wf_common.AuditCancelMsg{}
		msg.ApplyIDs = make([]string, len(downloadApplyDatas))
		msg.Cause.ZHCN = "资源已下线"
		msg.Cause.ZHTW = "资源已下线"
		msg.Cause.ENUS = "The resource is invalid"
		for i := range downloadApplyDatas {
			msg.ApplyIDs[i] = common.GenAuditApplyID(downloadApplyDatas[i].ID, downloadApplyDatas[i].AuditApplySN)
		}

		err = d.wf.AuditCancel(msg)
	}

	if err != nil {
		log.WithContext(ctx).Errorf("failed to cancel download audit (catalog code: %s), err info: %v", code, err)
		return
	}

	_, err = d.catalogRepo.CancelFlagUpdate(nil, ctx, code, map[string]interface{}{"is_canceled": 1})
	if err != nil {
		log.WithContext(ctx).Errorf("failed to update catalog (code: %s) is_canceled to 1, err info: %v", code, err)
	}
}

func (d *DataCatalogDomain) OfflineCancelApplyAudit() {
	ctx := context.Background()
	codes, err := d.catalogRepo.GetOfflineWaitProcList(nil, ctx)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to GetOfflineWaitProcList, err: %v", err)
		return
	}

	for i := range codes {
		downloadAuditCancel(d, ctx, codes[i])
	}
}

func (d *DataCatalogDomain) GetOwnerAuditors(ctx context.Context, req *ReqAuditorsGetParams) ([]AuditUser, error) {
	ID, auditApplySN, err := common.ParseAuditApplyID(req.ApplyID)
	var catalog *model.TDataCatalog
	if err != nil {
		log.WithContext(ctx).Errorf("failed to parse audit apply_id: %s, err: %v", req.ApplyID, err)
		return nil, errorcode.Detail(errorcode.PublicAuditApplyIDParseFailed, err)
	}
	if req.AuditGroupType != 2 { // 下载审核获取owner审核员
		var daRecs []*model.TDataCatalogDownloadApply
		daRecs, err = d.daRepo.Get(nil, ctx, "", "", ID, auditApplySN, 0)
		if err != nil {
			log.WithContext(ctx).Errorf("failed to get download apply records (id: %d, applySN: %d), err: %v", ID, auditApplySN, err)
			return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
		}

		if len(daRecs) == 0 {
			log.WithContext(ctx).Errorf("download apply records (id: %d, applySN: %d) not existed", ID, auditApplySN)
			return nil, errorcode.Detail(errorcode.PublicResourceNotExisted, "资源不存在")
		}

		catalog, err = d.catalogRepo.GetDetailByCode(nil, ctx, daRecs[0].Code)
		if err != nil {
			log.WithContext(ctx).Errorf("get detail for catalog code: %s failed, err: %v", daRecs[0].Code, err)
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return nil, errorcode.Detail(errorcode.PublicResourceNotExisted, "资源不存在")
			} else {
				return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
			}
		}

		if catalog.OnlineStatus != constant.LineStatusOnLine {
			log.WithContext(ctx).Errorf("catalog code: %s current state is %v, get auditors failed", catalog.Code, catalog.OnlineStatus)
			return nil, errorcode.Detail(errorcode.PublicGetOwnerAuditorsNotAllowed, "当前资源不可获取owner审核员")
		}
	} else { // 发布/上线/下线审核获取owner审核员
		catalog, err = d.catalogRepo.GetDetail(nil, ctx, ID, nil)
		if err != nil {
			log.WithContext(ctx).Errorf("get detail for catalog id: %d failed, err: %v", ID, err)
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return nil, errorcode.Detail(errorcode.PublicResourceNotExisted, "资源不存在")
			} else {
				return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
			}
		}
	}

	if len(catalog.OwnerId) == 0 {
		log.WithContext(ctx).Errorf("catalog code: %s no auditors matched", catalog.Code)
		return nil, errorcode.Detail(errorcode.DataCatalogNoOwnerErr, "未匹配到owner审核员")
	}

	return []AuditUser{
		{
			UserId: catalog.OwnerId,
		},
	}, err
}
