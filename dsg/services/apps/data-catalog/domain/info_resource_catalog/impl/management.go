package impl

import (
	"context"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/samber/lo"
	"gorm.io/gorm"

	"github.com/biocrosscoder/flex/typed/collections/arraylist"
	"github.com/biocrosscoder/flex/typed/collections/dict"
	"github.com/biocrosscoder/flex/typed/functools"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/request"
	local_util "github.com/kweaver-ai/dsg/services/apps/data-catalog/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/info_resource_catalog"
	"github.com/kweaver-ai/idrm-go-common/errorcode"
	"github.com/kweaver-ai/idrm-go-common/rest/business_grooming"
	"github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
	"github.com/kweaver-ai/idrm-go-common/util"
	wf_common "github.com/kweaver-ai/idrm-go-common/workflow/common"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/utils"
)

// 创建信息资源目录
func (d *infoResourceCatalogDomain) CreateInfoResourceCatalog(ctx context.Context, req *info_resource_catalog.CreateInfoResourceCatalogReq) (res *info_resource_catalog.CreateInfoResourceCatalogRes, err error) {
	return util.HandleReqWithErrLog(ctx, func(ctx context.Context) (res *info_resource_catalog.CreateInfoResourceCatalogRes, err error) {
		// [校验来源信息]
		err = d.verifySource(ctx, req.SourceInfo)
		if err != nil {
			return
		} // [/]
		// [检查当前业务表是否被编目]
		equals := []*info_resource_catalog.SearchParamItem{
			{
				Keys:     []string{"BusinessFormID"},
				Values:   []any{req.SourceInfo.BusinessForm.ID},
				Exclude:  false,
				Priority: 0,
			},
		}
		cataloged, err := d.repo.GetSourceInfos(ctx, equals)
		if err != nil {
			return
		}
		if len(cataloged) > 0 {
			err = errorcode.Desc(info_resource_catalog.ErrCreateFailBusinessFormCataloged)
			return
		} // [/]
		// [检查是否重名]
		repeat, err := d.isNameRepeat(ctx, 0, req.Name)
		if err != nil {
			return
		}
		if repeat {
			err = errorcode.Desc(info_resource_catalog.ErrCreateFailNameRepeat)
			return
		} // [/]
		// [生成唯一ID]
		id, err := utils.GetUniqueID()
		if err != nil {
			return
		}
		idStr := strconv.FormatUint(id, 10) // [/]
		// [生成编码]
		codeList, err := d.confCenter.Generate(ctx, configuration_center.GenerateCodeIdInfoCatalog, 1)
		if err != nil {
			return
		}
		if codeList == nil || len(codeList.Entries) == 0 {
			err = errorcode.Desc(errorcode.GenerateCodeError)
			return
		}
		code := codeList.Entries[0] // [/]
		// [查询类目节点]
		categoryNodes, err := operateSkipEmpty(ctx, req.CategoryNodeIDs, d.categoryRepo.GetCategoryAndNodeByNodeID)
		if err != nil {
			return
		} // [/]
		// [构建信息资源目录实体]
		columns := make([]*info_resource_catalog.InfoItemObject, len(req.Columns))
		columnIDs := make([]string, len(req.Columns))
		for i, item := range req.Columns {
			// [生成信息项ID]
			var columnID uint64
			columnID, err = utils.GetUniqueID()
			if err != nil {
				return
			}
			columnIDStr := strconv.FormatUint(columnID, 10)
			columnIDs[i] = columnIDStr // [/]
			// [构建信息项实体]
			columns[i] = &info_resource_catalog.InfoItemObject{
				ID:         columnIDStr,
				InfoItemVO: *item,
			} // [/]
		}
		entity := d.buildInfoResourceCatalogEntity(
			idStr,
			code,
			&info_resource_catalog.InfoResourceCatalogEditableAttrs{
				Name:            req.Name,
				BelongInfo:      req.BelongInfo,
				DataRange:       req.DataRange,
				UpdateCycle:     req.UpdateCycle,
				Description:     req.Description,
				CategoryNodeIDs: req.CategoryNodeIDs,
				RelationInfo:    req.RelationInfo,
				SharedOpenInfo:  req.SharedOpenInfo,
			},
			req.SourceInfo,
			d.buildInfoResourceCatalogColumnsEntity(columns),
			categoryNodes,
			nil,
		)
		entity.CurrentVersion = true
		entity.AlterAt = time.UnixMilli(0)
		entity.PreID = "0"
		entity.NextID = "0"
		entity.AlterAuditMsg = ""
		entity.LabelIds = req.LabelIds
		d.initStatus(entity) // [/]
		// [验证并记录无效关联项]
		invalidItemMap, isValid, belongDepartmentPath, err := d.verifyCatalog(ctx, entity)
		if err != nil {
			return
		}
		invalidItems := d.buildRelatedItemsVO(invalidItemMap) // [/]
		// [参数不合法时返回错误响应]
		isValid = isValid && (req.Action != info_resource_catalog.ActionSubmit || len(invalidItems) == 0)
		if !isValid {
			err = errorcode.WithDetail(info_resource_catalog.ErrCreateFailInvalidReference, map[string]any{
				"invalid_items": invalidItems,
			})
			return
		} // [/]
		// [根据动作与审核设置目录状态]
		if req.Action == info_resource_catalog.ActionSubmit {
			err = d.stateTransfer(entity, info_resource_catalog.StatusTargetNext)
			if err != nil {
				return
			}
			_, err = d.execAudit(ctx, info_resource_catalog.AuditTypePublish, entity)
			if err != nil {
				return
			}
		} // [/]
		// [更新数据库]
		d.completeCateInfo(entity, belongDepartmentPath)
		err = d.repo.Create(ctx, entity)
		if err != nil {
			return
		} // [/]
		formPathInfo, _ := d.bizGrooming.QueryFormPathInfo(ctx, req.SourceInfo.BusinessForm.ID)
		err = d.es.CreateInfoCatalog(ctx, d.buildEsCreateMsg(entity, formPathInfo))
		// [组装响应]
		res = &info_resource_catalog.CreateInfoResourceCatalogRes{
			ID:        idStr,
			Code:      code,
			ColumnIDs: columnIDs,
		}
		res.InvalidItems = invalidItems // [/]
		return
	})
}

// 更新信息资源目录
func (d *infoResourceCatalogDomain) UpdateInfoResourceCatalog(ctx context.Context, req *info_resource_catalog.UpdateInfoResourceCatalogReq) (res *info_resource_catalog.UpdateInfoResourceCatalogRes, err error) {
	return util.HandleReqWithErrLog(ctx, func(ctx context.Context) (res *info_resource_catalog.UpdateInfoResourceCatalogRes, err error) {
		// [解析ID]
		id, err := strconv.ParseInt(req.ID, 10, 64)
		if err != nil {
			return
		} // [/]
		// [检查是否存在]
		exist, err := d.isCatalogExist(ctx, id)
		if err != nil {
			return
		}
		if !exist {
			err = errorcode.Desc(info_resource_catalog.ErrUpdateFailResourceNotExist)
			return
		} // [/]
		// [检查是否重名]
		repeat, err := d.isNameRepeat(ctx, id, req.Name)
		if err != nil {
			return
		}
		if repeat {
			err = errorcode.Desc(info_resource_catalog.ErrUpdateFailNameRepeat)
			return
		} // [/]
		// [查询类目节点]
		categoryNodes, err := operateSkipEmpty(ctx, req.CategoryNodeIDs, d.categoryRepo.GetCategoryAndNodeByNodeID)
		if err != nil {
			return
		} // [/]
		// [构建信息资源目录实体]
		originEntity, err := d.repo.FindByID(ctx, id)
		if err != nil {
			return
		}
		if !(originEntity.CurrentVersion && (originEntity.PublishStatus == info_resource_catalog.PublishStatusUnpublished ||
			originEntity.PublishStatus == info_resource_catalog.PublishStatusPubReject)) {
			log.Infof("edit catalog name: %v failed, current status: %v-%v\n",
				originEntity.Name, originEntity.PublishStatus.String, originEntity.OnlineStatus.String)
			err = errorcode.Desc(info_resource_catalog.ErrUpdateNotAllowed)
			return
		}
		entity := d.buildInfoResourceCatalogEntity(
			req.ID,
			originEntity.Code,
			&info_resource_catalog.InfoResourceCatalogEditableAttrs{
				Name:            req.Name,
				BelongInfo:      req.BelongInfo,
				DataRange:       req.DataRange,
				UpdateCycle:     req.UpdateCycle,
				Description:     req.Description,
				CategoryNodeIDs: req.CategoryNodeIDs,
				RelationInfo:    req.RelationInfo,
				SharedOpenInfo:  req.SharedOpenInfo,
			},
			d.buildSourceInfoVO(originEntity),
			d.buildInfoResourceCatalogColumnsEntity(req.Columns),
			categoryNodes,
			nil,
		)
		entity.CurrentVersion = true
		entity.AlterAt = time.UnixMilli(0)
		entity.PreID = "0"
		entity.NextID = "0"
		entity.AlterAuditMsg = ""
		entity.LabelIds = req.LabelIds
		d.initStatus(entity) // [/]
		// [验证并记录无效关联项]
		invalidItemMap, isValid, belongDepartmentPath, err := d.verifyCatalog(ctx, entity)
		if err != nil {
			return
		}
		invalidItems := d.buildRelatedItemsVO(invalidItemMap) // [/]
		// [参数不合法时返回错误响应]
		isValid = isValid && (req.Action != info_resource_catalog.ActionSubmit || len(invalidItems) == 0)
		if !isValid {
			err = errorcode.WithDetail(info_resource_catalog.ErrCreateFailInvalidReference, map[string]any{
				"invalid_items": invalidItems,
			})
			return
		} // [/]
		// [根据动作与审核设置目录状态]
		if req.Action == info_resource_catalog.ActionSubmit {
			err = d.stateTransfer(entity, info_resource_catalog.StatusTargetNext)
			if err != nil {
				return
			}
			_, err = d.execAudit(ctx, info_resource_catalog.AuditTypePublish, entity)
			if err != nil {
				return
			}
		} // [/]
		// [更新数据库]
		d.completeCateInfo(entity, belongDepartmentPath)
		err = d.repo.Update(ctx, entity)
		if err != nil {
			return
		} // [/]
		formPathInfo, _ := d.bizGrooming.QueryFormPathInfo(ctx, originEntity.SourceBusinessForm.ID)
		err = d.es.CreateInfoCatalog(ctx, d.buildEsCreateMsg(entity, formPathInfo))
		// [组装响应]
		res = new(info_resource_catalog.UpdateInfoResourceCatalogRes)
		res.InvalidItems = invalidItems // [/]
		return
	})
}

// 修改信息资源目录
func (d *infoResourceCatalogDomain) ModifyInfoResourceCatalog(ctx context.Context, req *info_resource_catalog.ModifyInfoResourceCatalogReq) (err error) {
	_, err = util.HandleReqWithErrLog(ctx, func(ctx context.Context) (_ any, err error) {
		// [解析ID]
		id, err := strconv.ParseInt(req.ID, 10, 64)
		if err != nil {
			return
		} // [/]
		// [检查是否存在]
		exist, err := d.isCatalogExist(ctx, id)
		if err != nil {
			return
		}
		if !exist {
			err = errorcode.Desc(info_resource_catalog.ErrUpdateStatusFailResourceNotExist)
			return
		} // [/]
		// [获取对象执行状态转移]
		object, err := d.repo.FindByID(ctx, id)
		if err != nil {
			return
		}
		if !object.CurrentVersion {
			log.Infof("[state transfer fail] catalog name: %v is not current version\n", object.Name)
			err = errorcode.Desc(info_resource_catalog.ErrUpdateStatusFailInvalidTargetStatus)
			return
		}
		err = d.stateTransfer(object, req.Status)
		if err != nil {
			return
		} // [/]
		// [处理审核]
		var updateFields []string
		switch {
		case req.Status == info_resource_catalog.StatusTargetNext &&
			object.PublishStatus == info_resource_catalog.PublishStatusPubAuditing:
			updateFields, err = d.execAudit(ctx, info_resource_catalog.AuditTypePublish, object)
		case req.Status == info_resource_catalog.StatusTargetNext &&
			(object.OnlineStatus == info_resource_catalog.OnlineStatusNotOnlineUpAuditing ||
				object.OnlineStatus == info_resource_catalog.OnlineStatusOfflineUpAuditing):
			updateFields, err = d.execAudit(ctx, info_resource_catalog.AuditTypeOnline, object)
		case req.Status == info_resource_catalog.StatusTargetNext &&
			object.OnlineStatus == info_resource_catalog.OnlineStatusOnlineDownAuditing:
			updateFields, err = d.execAudit(ctx, info_resource_catalog.AuditTypeOffline, object)
		case req.Status == info_resource_catalog.StatusTargetPrevious &&
			object.PublishStatus == info_resource_catalog.PublishStatusUnpublished:
			updateFields, err = d.cancelAudit(object, info_resource_catalog.AuditTypePublish)
		case req.Status == info_resource_catalog.StatusTargetPrevious &&
			(object.OnlineStatus == info_resource_catalog.OnlineStatusNotOnline ||
				object.OnlineStatus == info_resource_catalog.OnlineStatusOffline):
			updateFields, err = d.cancelAudit(object, info_resource_catalog.AuditTypeOnline)
		case req.Status == info_resource_catalog.StatusTargetPrevious &&
			object.OnlineStatus == info_resource_catalog.OnlineStatusOnline:
			updateFields, err = d.cancelAudit(object, info_resource_catalog.AuditTypeOffline)
		}
		if err != nil {
			return
		} // [/]
		// [更新数据库]
		err = d.repo.Modify(ctx, object, updateFields)
		if err != nil {
			return
		} // [/]
		err = d.updateEsIndex(ctx, object)
		return
	})
	return
}

// 变更信息资源目录
func (d *infoResourceCatalogDomain) AlterInfoResourceCatalog(ctx context.Context,
	req *info_resource_catalog.AlterInfoResourceCatalogReq) (res *info_resource_catalog.AlterInfoResourceCatalogRes, err error) {
	return util.HandleReqWithErrLog(ctx, func(ctx context.Context) (res *info_resource_catalog.AlterInfoResourceCatalogRes, err error) {
		var (
			exist           bool
			nextID          int64
			curCatalog      *info_resource_catalog.InfoResourceCatalog
			catalog         *info_resource_catalog.InfoResourceCatalog
			bIsAlterExisted bool
		)
		userInfo := request.GetUserInfo(ctx)
		curCatalogID := req.IDParamV1.ID.Uint64()
		exist, err = d.isCatalogExist(ctx, int64(curCatalogID))
		if err != nil {
			return
		}
		if !exist {
			err = errorcode.Desc(info_resource_catalog.ErrResourceNotExist)
			return
		}
		curCatalog, err = d.repo.FindByIDForAlter(ctx, int64(curCatalogID))
		if err != nil {
			return
		}
		if (curCatalog.PublishStatus != info_resource_catalog.PublishStatusPublished &&
			curCatalog.PublishStatus != info_resource_catalog.PublishStatusChReject) ||
			curCatalog.OnlineStatus == info_resource_catalog.OnlineStatusNotOnlineUpAuditing ||
			curCatalog.OnlineStatus == info_resource_catalog.OnlineStatusOfflineUpAuditing ||
			curCatalog.OnlineStatus == info_resource_catalog.OnlineStatusOnlineDownAuditing {
			err = errorcode.Desc(info_resource_catalog.ErrAlterNotAllowed)
			return
		}
		if len(curCatalog.NextID) == 0 {
			err = errorcode.Desc(info_resource_catalog.ErrAlterNotAllowed)
			return
		}
		if nextID, err = strconv.ParseInt(curCatalog.NextID, 10, 64); err != nil {
			err = errorcode.Desc(info_resource_catalog.ErrAlterNotAllowed)
			return
		}
		if req.ID.Uint64() > 0 && uint64(nextID) != req.ID.Uint64() {
			err = errorcode.Desc(info_resource_catalog.ErrAlterNotAllowed)
			return
		}
		excludeIDs := make([]int64, 0, 2)
		excludeIDs = append(excludeIDs, int64(curCatalogID))
		if nextID > 0 {
			bIsAlterExisted = true
			excludeIDs = append(excludeIDs, nextID)
		} else {
			bIsAlterExisted = false
			// [生成唯一ID]
			var id uint64
			id, err = utils.GetUniqueID()
			if err != nil {
				return nil, err
			}
			nextID = int64(id)
		}

		// [检查是否重名]
		repeat, err := d.isNameRepeatV1(ctx, excludeIDs, req.Name)
		if err != nil {
			return
		}
		if repeat {
			err = errorcode.Desc(info_resource_catalog.ErrCreateFailNameRepeat)
			return
		} // [/]

		// [查询类目节点]
		categoryNodes, err := operateSkipEmpty(ctx, req.CategoryNodeIDs, d.categoryRepo.GetCategoryAndNodeByNodeID)
		if err != nil {
			return
		} // [/]
		// [构建信息资源目录实体]
		columns := make([]*info_resource_catalog.InfoItemObject, len(req.Columns))
		columnIDs := make([]string, len(req.Columns))
		for i, item := range req.Columns {
			// [生成信息项ID]
			var columnID uint64
			columnID, err = utils.GetUniqueID()
			if err != nil {
				return
			}
			columnIDStr := strconv.FormatUint(columnID, 10)
			columnIDs[i] = columnIDStr // [/]
			// [构建信息项实体]
			columns[i] = &info_resource_catalog.InfoItemObject{
				ID:         columnIDStr,
				InfoItemVO: *item,
			} // [/]
		}

		catalog = d.buildInfoResourceCatalogEntity(
			strconv.FormatInt(nextID, 10),
			curCatalog.Code,
			&info_resource_catalog.InfoResourceCatalogEditableAttrs{
				Name:            req.Name,
				BelongInfo:      req.BelongInfo,
				DataRange:       req.DataRange,
				UpdateCycle:     req.UpdateCycle,
				Description:     req.Description,
				CategoryNodeIDs: req.CategoryNodeIDs,
				RelationInfo:    req.RelationInfo,
				SharedOpenInfo:  req.SharedOpenInfo,
			},
			nil,
			d.buildInfoResourceCatalogColumnsEntity(columns),
			categoryNodes,
			nil,
		)
		d.initStatus(catalog) // [/]
		catalog.CurrentVersion = false
		catalog.PreID = req.IDParamV1.ID.String()
		catalog.LabelIds = req.LabelIds
		catalog.AlterAuditMsg = ""
		curCatalog.NextID = catalog.ID
		curCatalog.AlterAuditMsg = ""
		curCatalog.PublishStatus = info_resource_catalog.PublishStatusPublished
		if !bIsAlterExisted {
			curCatalog.AlterUID = userInfo.ID
			curCatalog.AlterName = userInfo.Name
			curCatalog.AlterAt = catalog.UpdateAt
		}
		catalog.AlterUID = curCatalog.AlterUID
		catalog.AlterName = curCatalog.AlterName
		catalog.AlterAt = curCatalog.AlterAt
		// [验证并记录无效关联项]
		invalidItemMap, isValid, belongDepartmentPath, err := d.verifyCatalog(ctx, catalog)
		if err != nil {
			return
		}
		invalidItems := d.buildRelatedItemsVO(invalidItemMap) // [/]
		// [参数不合法时返回错误响应]
		isValid = isValid && (req.Action != info_resource_catalog.ActionSubmit || len(invalidItems) == 0)
		if !isValid {
			err = errorcode.WithDetail(info_resource_catalog.ErrCreateFailInvalidReference, map[string]any{
				"invalid_items": invalidItems,
			})
			return
		} // [/]

		// [更新数据库]
		d.completeCateInfo(catalog, belongDepartmentPath)

		processKey := ""
		// [根据动作与审核设置目录状态]
		if req.Action == info_resource_catalog.ActionSubmit {
			bIsNeedAudit := false
			// 判断是否需要审核
			if isAuditNessessary(curCatalog, catalog) {
				// [查询审核流程]
				processKey, err = d.getAuditProcessKey(ctx, info_resource_catalog.AuditTypeAlter)
				if err != nil {
					return
				} // [/]
				// [审核流程不存在则直接通过审核]
				if processKey != "" {
					bIsNeedAudit = true
				}
			}
			if !bIsNeedAudit {
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
				curCatalog.LabelIds = catalog.LabelIds
				if err = d.repo.HandleDbTx(ctx,
					func(tx *gorm.DB) error {
						return d.repo.AlterComplete(tx, curCatalog)
					},
				); err == nil {
					err = d.updateEsIndex(ctx, curCatalog)
				}
			} else {
				var auditSN uint64
				catalog.PublishStatus = info_resource_catalog.PublishStatusChAuditing
				curCatalog.PublishStatus = info_resource_catalog.PublishStatusChAuditing
				if auditSN, err = utils.GetUniqueID(); err == nil {
					catalog.AuditInfo.ID = int64(auditSN)
					err = d.repo.HandleDbTx(ctx,
						func(tx *gorm.DB) error {
							var err error
							if err = d.repo.UpsertAlterVersion(tx, bIsAlterExisted, catalog); err == nil {
								if err = d.repo.BatchUpdate(tx, []*info_resource_catalog.InfoResourceCatalog{curCatalog}); err == nil {
									err = d.createAudit(ctx, catalog, info_resource_catalog.AuditTypeAlter, processKey, time.Now())
									if err != nil {
										return err
									}
								}
							}
							return err
						},
					)
				}
			}
		} else { // 暂存情况下仅更新
			err = d.repo.HandleDbTx(ctx,
				func(tx *gorm.DB) error {
					var err error
					if err = d.repo.UpsertAlterVersion(tx, bIsAlterExisted, catalog); err == nil {
						err = d.repo.BatchUpdate(tx, []*info_resource_catalog.InfoResourceCatalog{curCatalog})
					}
					return err
				},
			)
		}
		return
	})
}

func isAuditNessessary(cCatalog, aCatalog *info_resource_catalog.InfoResourceCatalog) bool {
	if cCatalog.BelongDepartment != nil && aCatalog.BelongDepartment != nil && cCatalog.BelongDepartment.ID != aCatalog.BelongDepartment.ID {
		return true
	}
	if (cCatalog.BelongDepartment == nil && aCatalog.BelongDepartment != nil) || (cCatalog.BelongDepartment != nil && aCatalog.BelongDepartment == nil) {
		return true
	}

	if cCatalog.Name != aCatalog.Name ||
		(cCatalog.BelongDepartment != nil && aCatalog.BelongDepartment != nil &&
			cCatalog.BelongDepartment.ID != aCatalog.BelongDepartment.ID) ||
		((cCatalog.BelongOffice == nil &&
			aCatalog.BelongOffice != nil) ||
			(cCatalog.BelongOffice != nil &&
				aCatalog.BelongOffice == nil) ||
			(cCatalog.BelongOffice != nil &&
				aCatalog.BelongOffice != nil &&
				cCatalog.BelongOffice.ID != aCatalog.BelongOffice.ID)) ||
		// cCatalog.BelongBusinessProcessList.Len() != aCatalog.BelongBusinessProcessList.Len() ||
		cCatalog.DataRange.Integer.Int() != aCatalog.DataRange.Integer.Int() ||
		cCatalog.UpdateCycle.Integer.Int() != aCatalog.UpdateCycle.Integer.Int() ||
		// cCatalog.CategoryNodeList.Len() != aCatalog.CategoryNodeList.Len() ||
		cCatalog.SharedType.Integer.Int() != aCatalog.SharedType.Integer.Int() ||
		cCatalog.SharedMessage != aCatalog.SharedMessage ||
		cCatalog.SharedMode.Integer.Int() != aCatalog.SharedMode.Integer.Int() ||
		cCatalog.OpenType.Integer.Int() != aCatalog.OpenType.Integer.Int() ||
		cCatalog.OpenCondition != aCatalog.OpenCondition ||
		cCatalog.Columns.Len() != aCatalog.Columns.Len() {
		return true
	}

	// businessProcessMap := lo.SliceToMap(cCatalog.BelongBusinessProcessList, func(item *info_resource_catalog.BusinessEntity) (string, bool) {
	// 	return item.ID, true
	// })
	// if cCatalog.BelongBusinessProcessList.Len() !=
	// 	lo.CountBy(aCatalog.BelongBusinessProcessList,
	// 		func(item *info_resource_catalog.BusinessEntity) bool {
	// 			return businessProcessMap[item.ID]
	// 		},
	// 	) {
	// 	return true
	// }

	tmpCateNodeList := lo.Filter(cCatalog.CategoryNodeList, func(item *info_resource_catalog.CategoryNode, index int) bool {
		var bRet bool
		if item.CateID != constant.InfoSystemCateId {
			bRet = true
		}
		return bRet
	})
	tmpAlterCateNodeList := lo.Filter(aCatalog.CategoryNodeList, func(item *info_resource_catalog.CategoryNode, index int) bool {
		var bRet bool
		if item.CateID != constant.InfoSystemCateId {
			bRet = true
		}
		return bRet
	})
	if len(tmpAlterCateNodeList) != len(tmpCateNodeList) {
		return true
	}
	cCateGroup := lo.GroupBy(tmpCateNodeList /*cCatalog.CategoryNodeList*/, func(item *info_resource_catalog.CategoryNode) string {
		return item.CateID
	})
	aCateGroup := lo.GroupBy(tmpAlterCateNodeList /*aCatalog.CategoryNodeList*/, func(item *info_resource_catalog.CategoryNode) string {
		return item.CateID
	})
	if len(cCateGroup) != len(aCateGroup) {
		return true
	}
	for k, cvs := range cCateGroup {
		avs, ok := aCateGroup[k]
		if !ok || len(avs) != len(cvs) {
			return true
		}
		cateNodes := lo.SliceToMap(cvs, func(item *info_resource_catalog.CategoryNode) (string, bool) {
			return item.NodeID, true
		})
		if len(cvs) !=
			lo.CountBy(avs,
				func(item *info_resource_catalog.CategoryNode) bool {
					return cateNodes[item.NodeID]
				},
			) {
			return true
		}
	}

	columnMap := lo.SliceToMap(cCatalog.Columns, func(item *info_resource_catalog.InfoItem) (string, *info_resource_catalog.InfoItem) {
		return item.FieldNameEN, item
	})
	for i := range aCatalog.Columns {
		cColumn, ok := columnMap[aCatalog.Columns[i].FieldNameEN]
		if !ok {
			return true
		}

		if cColumn.Name != aCatalog.Columns[i].Name ||
			cColumn.RelatedCodeSet.ID != aCatalog.Columns[i].RelatedCodeSet.ID ||
			cColumn.RelatedDataRefer.ID != aCatalog.Columns[i].RelatedDataRefer.ID ||
			cColumn.DataType.Integer.Int() != aCatalog.Columns[i].DataType.Integer.Int() ||
			cColumn.DataLength != aCatalog.Columns[i].DataLength ||
			cColumn.DataRange != aCatalog.Columns[i].DataRange ||
			(cColumn.IsSensitive == nil &&
				aCatalog.Columns[i].IsSensitive != nil) ||
			(cColumn.IsSensitive != nil &&
				aCatalog.Columns[i].IsSensitive == nil) ||
			(cColumn.IsSensitive != nil &&
				aCatalog.Columns[i].IsSensitive != nil &&
				*cColumn.IsSensitive != *aCatalog.Columns[i].IsSensitive) ||
			(cColumn.IsSecret == nil &&
				aCatalog.Columns[i].IsSecret != nil) ||
			(cColumn.IsSecret != nil &&
				aCatalog.Columns[i].IsSecret == nil) ||
			(cColumn.IsSecret != nil &&
				aCatalog.Columns[i].IsSecret != nil &&
				*cColumn.IsSecret != *aCatalog.Columns[i].IsSecret) ||
			cColumn.IsPrimaryKey != aCatalog.Columns[i].IsPrimaryKey ||
			cColumn.IsIncremental != aCatalog.Columns[i].IsIncremental ||
			cColumn.IsLocalGenerated != aCatalog.Columns[i].IsLocalGenerated ||
			cColumn.IsStandardized != aCatalog.Columns[i].IsStandardized {
			return true
		}
	}
	return false
}

// 变更信息资源目录
func (d *infoResourceCatalogDomain) AlterAuditCancel(ctx context.Context, req *info_resource_catalog.IDParamV1) (err error) {
	_, err = util.HandleReqWithErrLog(ctx, func(ctx context.Context) (_ any, err error) {
		var (
			exist      bool
			nextID     int64
			curCatalog *info_resource_catalog.InfoResourceCatalog
			catalog    *info_resource_catalog.InfoResourceCatalog
		)
		exist, err = d.isCatalogExist(ctx, int64(req.ID.Uint64()))
		if err != nil {
			return
		}
		if !exist {
			err = errorcode.Desc(info_resource_catalog.ErrResourceNotExist)
			return
		}
		curCatalog, err = d.repo.FindByID(ctx, int64(req.ID.Uint64()))
		if err != nil {
			return
		}
		if curCatalog.PublishStatus != info_resource_catalog.PublishStatusChAuditing {
			err = errorcode.Desc(info_resource_catalog.ErrAlterAuditCancelNotAllowed)
			return
		}
		if len(curCatalog.NextID) == 0 {
			err = errorcode.Desc(info_resource_catalog.ErrAlterAuditCancelNotAllowed)
			return
		}
		if nextID, err = strconv.ParseInt(curCatalog.NextID, 10, 64); err != nil {
			err = errorcode.Desc(info_resource_catalog.ErrAlterAuditCancelNotAllowed)
			return
		}
		if nextID == 0 {
			err = errorcode.Desc(info_resource_catalog.ErrAlterAuditCancelNotAllowed)
			return
		}
		exist, err = d.isCatalogExist(ctx, nextID)
		if err != nil {
			return
		}
		if !exist {
			err = errorcode.Desc(info_resource_catalog.ErrResourceNotExist)
			return
		}
		catalog, err = d.repo.FindByID(ctx, nextID)
		if err != nil {
			return
		}

		msg := &wf_common.AuditCancelMsg{
			ApplyIDs: []string{d.generateAuditApplyID(catalog)},
			Cause: struct {
				ZHCN string "json:\"zh-cn\""
				ZHTW string "json:\"zh-tw\""
				ENUS string "json:\"en-us\""
			}{
				ZHCN: "revocation",
				ZHTW: "revocation",
				ENUS: "revocation",
			},
		}
		err = d.workflow.AuditCancel(msg)
		return
	})
	return
}

// 变更恢复
func (d *infoResourceCatalogDomain) AlterRecover(ctx context.Context, req *info_resource_catalog.AlterDelReq) (err error) {
	_, err = util.HandleReqWithErrLog(ctx, func(ctx context.Context) (_ any, err error) {
		var (
			exist      bool
			curCatalog *info_resource_catalog.InfoResourceCatalog
			catalog    *info_resource_catalog.InfoResourceCatalog
		)
		exist, err = d.isCatalogExist(ctx, int64(req.ID.Uint64()))
		if err != nil {
			return
		}
		if !exist {
			err = errorcode.Desc(info_resource_catalog.ErrResourceNotExist)
			return
		}
		exist, err = d.isCatalogExist(ctx, int64(req.AlterID.Uint64()))
		if err != nil {
			return
		}
		if !exist {
			err = errorcode.Desc(info_resource_catalog.ErrResourceNotExist)
			return
		}
		curCatalog, err = d.repo.FindByID(ctx, int64(req.ID.Uint64()))
		if err != nil {
			return
		}
		catalog, err = d.repo.FindByID(ctx, int64(req.AlterID.Uint64()))
		if err != nil {
			return
		}
		if catalog.CurrentVersion ||
			!curCatalog.CurrentVersion ||
			curCatalog.NextID != catalog.ID ||
			curCatalog.ID != catalog.PreID {
			err = errorcode.Desc(info_resource_catalog.ErrAlterRecoverNotAllowed)
			return
		}
		if (curCatalog.PublishStatus != info_resource_catalog.PublishStatusPublished &&
			curCatalog.PublishStatus != info_resource_catalog.PublishStatusChReject) ||
			curCatalog.OnlineStatus == info_resource_catalog.OnlineStatusNotOnlineUpAuditing ||
			curCatalog.OnlineStatus == info_resource_catalog.OnlineStatusOfflineUpAuditing ||
			curCatalog.OnlineStatus == info_resource_catalog.OnlineStatusOnlineDownAuditing {
			err = errorcode.Desc(info_resource_catalog.ErrAlterAuditCancelNotAllowed)
			return
		}

		curCatalog.PublishStatus = info_resource_catalog.PublishStatusPublished
		curCatalog.AlterUID = ""
		curCatalog.AlterName = ""
		curCatalog.AlterAt = time.UnixMilli(0)
		curCatalog.PreID = "0"
		curCatalog.NextID = "0"
		curCatalog.AlterAuditMsg = ""

		return nil, d.repo.HandleDbTx(ctx,
			func(tx *gorm.DB) error {
				var err error
				if err = d.repo.DeleteForAlterRecover(tx, ctx, int64(req.AlterID.Uint64())); err == nil {
					err = d.repo.BatchUpdate(tx, []*info_resource_catalog.InfoResourceCatalog{curCatalog})
				}
				return err
			},
		)
	})
	return
}

// 删除信息资源目录
func (d *infoResourceCatalogDomain) DeleteInfoResourceCatalog(ctx context.Context, req *info_resource_catalog.DeleteInfoResourceCatalogReq) (err error) {
	_, err = util.HandleReqWithErrLog(ctx, func(ctx context.Context) (_ any, err error) {
		// [解析ID]
		id, err := strconv.ParseInt(req.ID, 10, 64)
		if err != nil {
			return
		} // [/]
		// [检查是否存在]
		exist, err := d.isCatalogExist(ctx, id)
		if err != nil {
			return
		}
		if !exist {
			err = errorcode.Desc(info_resource_catalog.ErrResourceNotExist)
			return
		} // [/]
		// [查询]
		entity, err := d.repo.FindByID(ctx, id)
		if err != nil {
			return
		} // [/]
		if !(entity.CurrentVersion &&
			(entity.PublishStatus == info_resource_catalog.PublishStatusUnpublished ||
				entity.PublishStatus == info_resource_catalog.PublishStatusPubReject)) {
			log.Infof("delete catalog name: %v failed, current status: %v\n",
				entity.Name, entity.PublishStatus.String)
			err = errorcode.Desc(info_resource_catalog.ErrDeleteNotAllowed)
			return
		}
		// [更新数据库]
		err = d.repo.DeleteByID(ctx, id)
		if err != nil {
			return
		} // [/]
		err = d.es.DeleteInfoCatalog(ctx, entity.ID)
		return
	})
	return
}

// 获取冲突项
func (d *infoResourceCatalogDomain) GetConflictItems(ctx context.Context, req *info_resource_catalog.GetConflictItemsReq) (res info_resource_catalog.GetConflictItemsRes, err error) {
	return util.HandleReqWithErrLog(ctx, func(ctx context.Context) (res info_resource_catalog.GetConflictItemsRes, err error) {
		equals := make([]*info_resource_catalog.SearchParamItem, 0)
		if req.ID != "" {
			ids := strings.Split(req.ID, ",")
			for i := range ids {
				// [解析ID]
				_, err = strconv.ParseInt(ids[i], 10, 64)
				if err != nil {
					return
				} // [/]
			}

			// [添加排除项]
			equals = []*info_resource_catalog.SearchParamItem{
				{
					Keys:     []string{"ID"},
					Values:   lo.ToAnySlice(ids),
					Exclude:  true,
					Priority: 0,
				},
			} // [/]
		}
		res = make(info_resource_catalog.GetConflictItemsRes, 0)
		if req.Name != "" {
			// [查询重名]
			equals := append(equals, &info_resource_catalog.SearchParamItem{
				Keys:     []string{"Name"},
				Values:   []any{req.Name},
				Exclude:  false,
				Priority: 1,
			})
			var records []*info_resource_catalog.InfoResourceCatalog
			records, err = d.repo.ListBy(ctx, []string{}, "", nil, equals, nil, nil, nil, 0, 1)
			if err != nil {
				return
			} // [/]
			if len(records) > 0 {
				res = append(res, "name")
			}
		}
		return
	})
}

// GetCatalogByStandardForms  通过业务标准表查询目录
func (d *infoResourceCatalogDomain) GetCatalogByStandardForms(ctx context.Context, req *info_resource_catalog.GetCatalogByStandardForm) (res info_resource_catalog.GetCatalogByStandardFormResp, err error) {
	return util.HandleReqWithErrLog(ctx, func(ctx context.Context) (res info_resource_catalog.GetCatalogByStandardFormResp, err error) {
		equals := []*info_resource_catalog.SearchParamItem{
			{
				Keys:     []string{"BusinessFormID"},
				Values:   local_util.TypedListToAnyList(req.StandardFormID),
				Exclude:  false,
				Priority: 0,
			},
		}
		records, err := d.repo.GetSourceInfos(ctx, equals)
		if err != nil {
			return
		}
		if len(records) <= 0 {
			return nil, fmt.Errorf("record not found")
		}
		catalogStandardDict := lo.SliceToMap(records, func(item *info_resource_catalog.InfoResourceCatalog) (string, string) {
			return item.ID, item.SourceBusinessForm.ID
		})
		catalogIDs := functools.Map(func(x *info_resource_catalog.InfoResourceCatalog) any {
			return x.ID
		}, records) // [/]
		// [根据ID查询信息资源目录详情]
		in := []*info_resource_catalog.SearchParamItem{
			{
				Keys:     []string{"ID"},
				Values:   catalogIDs,
				Exclude:  false,
				Priority: 0,
			},
		}
		catalogs, err := d.repo.ListBy(ctx, []string{}, "", in, nil, nil, nil, nil, 0, 0)
		if err != nil {
			return
		} // [/]

		// [组装响应]
		res = make([]*info_resource_catalog.GetCatalogByStandardFormItem, 0, len(catalogs))
		for _, x := range catalogs {
			if x.PublishStatus.String == info_resource_catalog.PublishStatusPublished.String {
				res = append(res, &info_resource_catalog.GetCatalogByStandardFormItem{
					ID:             x.ID,
					Name:           x.Name,
					Code:           x.Code,
					BusinessFormID: catalogStandardDict[x.ID],
				})
			}
		}
		return res, nil
	})
}

// 获取信息资源目录自动关联信息类
func (d *infoResourceCatalogDomain) GetAutoRelatedInfoClasses(ctx context.Context, req *info_resource_catalog.GetInfoResourceCatalogAutoRelatedInfoClassesReq) (res info_resource_catalog.GetInfoResourceCatalogAutoRelatedInfoClassesRes, err error) {
	return util.HandleReqWithErrLog(ctx, func(ctx context.Context) (res info_resource_catalog.GetInfoResourceCatalogAutoRelatedInfoClassesRes, err error) {
		// [查询信息表字段引用源表]
		sourceFormIDs, err := d.bizGrooming.GetBusinessFormSource(ctx, req.SourceID)
		if err != nil {
			return
		} // [/]
		// [根据来源业务表查询信息资源目录]
		equals := []*info_resource_catalog.SearchParamItem{
			{
				Keys:     []string{"BusinessFormID"},
				Values:   local_util.TypedListToAnyList(sourceFormIDs.Forms),
				Exclude:  false,
				Priority: 0,
			},
		}
		records, err := d.repo.GetSourceInfos(ctx, equals)
		if err != nil {
			return
		}
		catalogIDs := functools.Map(func(x *info_resource_catalog.InfoResourceCatalog) any {
			return x.ID
		}, records) // [/]
		// [根据ID查询信息资源目录详情]
		in := []*info_resource_catalog.SearchParamItem{
			{
				Keys:     []string{"ID"},
				Values:   catalogIDs,
				Exclude:  false,
				Priority: 0,
			},
		}
		catalogs, err := d.repo.ListBy(ctx, []string{}, "", in, nil, nil, nil, nil, 0, 0)
		if err != nil {
			return
		} // [/]
		// [根据信息资源目录ID查询信息项]
		columnsMap := make(dict.Dict[string, arraylist.ArrayList[*info_resource_catalog.InfoItemCard]])
		equals = []*info_resource_catalog.SearchParamItem{
			{
				Keys:     []string{"InfoResourceCatalogID"},
				Values:   catalogIDs,
				Exclude:  false,
				Priority: 0,
			},
			{
				Keys:     []string{"OnlineStatus"},
				Values:   onlineStatusOnline,
				Exclude:  false,
				Priority: 1,
			},
		}
		columns, err := d.repo.ListColumnsBy(ctx, equals, nil, 0, 0)
		if err != nil {
			return
		} // [/]
		// [按信息类分组信息项]
		for _, column := range columns {
			group := columnsMap.Get(column.Parent.ID, arraylist.Of[*info_resource_catalog.InfoItemCard]())
			vo := new(info_resource_catalog.InfoItemCard)
			vo.ID = column.ID
			vo.Name = column.Name
			vo.DataType = column.DataType.String
			columnsMap.Set(column.Parent.ID, group.Concat(arraylist.Of(vo)))
		} // [/]
		// [组装响应]
		res = functools.Map(func(x *info_resource_catalog.InfoResourceCatalog) *info_resource_catalog.InfoClassVO {
			return &info_resource_catalog.InfoClassVO{
				ID:      x.ID,
				Name:    x.Name,
				Code:    x.Code,
				Columns: columnsMap.Get(x.ID),
			}
		}, catalogs) // [/]
		return
	})
}

// 校验信息资源目录关联项
func (d *infoResourceCatalogDomain) verifyCatalog(ctx context.Context, catalog *info_resource_catalog.InfoResourceCatalog) (invalidItems map[info_resource_catalog.EnumObjectType][]*info_resource_catalog.BusinessEntity, valid bool, belongDepartmentPath string, err error) {
	invalidItems = make(map[info_resource_catalog.EnumObjectType][]*info_resource_catalog.BusinessEntity)
	// [处理所属部门/所属处室]
	departmentToUpdate, invalidDepartment, belongDepartmentPath, err := d.updateDepartments(ctx, catalog)
	if err != nil {
		return
	}
	invalidItems[info_resource_catalog.ObjectTypeDepartment] = invalidDepartment // [/]
	// [处理所属业务流程]
	businessProcessToUpdate, invalidBusinessProcess, err := d.updateSkipEmptyAndUncataloged(ctx, catalog.BelongBusinessProcessList, d.requestBusinessProcessByID)
	if err != nil {
		return
	}
	invalidItems[info_resource_catalog.ObjectTypeBusinessProcess] = invalidBusinessProcess
	catalog.BelongBusinessProcessList.RemoveIf(isEntityInvalid, -1) // [/]
	// [处理关联信息系统]
	infoSystemToUpdate, invalidInfoSystem, err := d.updateSkipEmptyAndUncataloged(ctx, catalog.RelatedInfoSystemList, d.requestInfoSystemByID)
	if err != nil {
		return
	}
	if len(invalidInfoSystem) > 0 {
		invalidItems[info_resource_catalog.ObjectTypeInfoSystem] = invalidInfoSystem
	}
	catalog.RelatedInfoSystemList.RemoveIf(isEntityInvalid, -1) // [/]
	// [处理关联数据资源目录]
	dataResourceCatalogToUpdate, invalidDataResourceCatalog, err := d.updateSkipEmptyAndUncataloged(ctx, catalog.RelatedDataResourceCatalogList, d.queryDataResourceCatalogByID)
	if err != nil {
		return
	}
	invalidItems[info_resource_catalog.ObjectTypeDataResourceCatalog] = invalidDataResourceCatalog
	catalog.RelatedDataResourceCatalogList.RemoveIf(isEntityInvalid, -1) // [/]
	// [处理关联信息类]
	infoResourceCatalogToUpdate, invalidInfoResourceCatalog, err := d.updateSkipEmptyAndUncataloged(ctx, catalog.RelatedInfoClassList, d.queryInfoResourceCatalogByID)
	if err != nil {
		return
	}
	if len(invalidInfoResourceCatalog) > 0 {
		invalidItems[info_resource_catalog.ObjectTypeInfoClass] = invalidInfoResourceCatalog
	}
	catalog.RelatedInfoClassList.RemoveIf(isEntityInvalid, -1) // [/]
	// [处理关联信息项]
	infoItemToUpdate, invalidInfoItem, err := d.updateSkipEmptyAndUncataloged(ctx, catalog.RelatedInfoItemList, d.queryInfoItemByID)
	if err != nil {
		return
	}
	if len(invalidInfoItem) > 0 {
		invalidItems[info_resource_catalog.ObjectTypeInfoItem] = invalidInfoItem
	}
	catalog.RelatedInfoItemList.RemoveIf(isEntityInvalid, -1) // [/]
	// [异步更新关联项名称]
	asyncUpdate(map[info_resource_catalog.InfoResourceCatalogRelatedItemRelationTypeEnum][]*info_resource_catalog.BusinessEntity{
		info_resource_catalog.BelongDepartment:           departmentToUpdate,
		info_resource_catalog.BelongOffice:               departmentToUpdate,
		info_resource_catalog.BelongBusinessProcess:      businessProcessToUpdate,
		info_resource_catalog.RelatedInfoSystem:          infoSystemToUpdate,
		info_resource_catalog.RelatedDataResourceCatalog: dataResourceCatalogToUpdate,
		info_resource_catalog.RelatedInfoClass:           infoResourceCatalogToUpdate,
		info_resource_catalog.RelatedInfoItem:            infoItemToUpdate,
	}, d.repo.UpdateRelatedItemNames) // [/]
	// [处理信息项关联信息]
	invalidDataRefers, invalidCodeSets, err := d.updateInfoItemRelatedInfo(ctx, catalog.Columns)
	if err != nil {
		return
	}
	invalidItems[info_resource_catalog.ObjectTypeDataRefer] = invalidDataRefers
	invalidItems[info_resource_catalog.ObjectTypeCodeSet] = invalidCodeSets // [/]
	valid = len(invalidDepartment) == 0 && len(invalidDataRefers) == 0 && len(invalidCodeSets) == 0
	return
}

func (d *infoResourceCatalogDomain) isNameRepeat(ctx context.Context, excludeID int64, name string) (repeat bool, err error) {
	// [生成等值查询条件]
	equals := []*info_resource_catalog.SearchParamItem{
		{
			Keys:     []string{"Name"},
			Values:   []any{name},
			Exclude:  false,
			Priority: 0,
		},
	} // [/]
	// [添加排除条件]
	if excludeID != 0 {
		equals = append(equals, &info_resource_catalog.SearchParamItem{
			Keys:     []string{"ID"},
			Values:   []any{strconv.FormatInt(excludeID, 10)},
			Exclude:  true,
			Priority: 1,
		})
	} // [/]
	hasSameName, err := d.repo.ListBy(ctx, []string{}, "", nil, equals, nil, nil, nil, 0, 1)
	if err != nil {
		return
	}
	repeat = hasSameName != nil && len(hasSameName) > 0
	return
}

func (d *infoResourceCatalogDomain) isNameRepeatV1(ctx context.Context, excludeIDs []int64, name string) (repeat bool, err error) {
	// [生成等值查询条件]
	ins := []*info_resource_catalog.SearchParamItem{
		{
			Keys:     []string{"Name"},
			Values:   []any{name},
			Exclude:  false,
			Priority: 0,
		},
	} // [/]

	// [添加排除条件]
	if len(excludeIDs) != 0 {
		ins = append(ins, &info_resource_catalog.SearchParamItem{
			Keys:     []string{"ID"},
			Values:   lo.Map(excludeIDs, func(item int64, index int) any { return strconv.FormatInt(item, 10) }),
			Exclude:  true,
			Priority: 1,
		})
	} // [/]
	hasSameName, err := d.repo.ListBy(ctx, []string{}, "", ins, nil, nil, nil, nil, 0, 1)
	if err != nil {
		return
	}
	repeat = hasSameName != nil && len(hasSameName) > 0
	return
}

func (d *infoResourceCatalogDomain) isCatalogExist(ctx context.Context, catalogID int64) (exist bool, err error) {
	equals := []*info_resource_catalog.SearchParamItem{
		{
			Keys:     []string{"ID"},
			Values:   []any{strconv.FormatInt(catalogID, 10)},
			Exclude:  false,
			Priority: 0,
		},
	}
	count, err := d.repo.CountBy(ctx, []string{}, "", nil, equals, nil, nil)
	if err != nil {
		return
	}
	exist = count > 0
	return
}

func (d *infoResourceCatalogDomain) completeCateInfo(catalog *info_resource_catalog.InfoResourceCatalog, belongDepartmentPath string) {
	// [添加组织架构类目节点]
	if catalog.BelongDepartment != nil && catalog.BelongDepartment.ID != "" {
		node := &info_resource_catalog.CategoryNode{
			CateID:   constant.DepartmentCateId,
			NodeID:   catalog.BelongDepartment.ID,
			NodeName: catalog.BelongDepartment.Name,
			NodePath: belongDepartmentPath,
		}
		catalog.CategoryNodeList.RemoveIf(func(x *info_resource_catalog.CategoryNode) bool {
			return Equal(x, node)
		})
		catalog.CategoryNodeList.Push(node) // [/]
	}
	// [添加信息系统类目节点]
	for _, item := range catalog.RelatedInfoSystemList {
		node := &info_resource_catalog.CategoryNode{
			CateID:   constant.InfoSystemCateId,
			NodeID:   item.ID,
			NodeName: item.Name,
		}
		catalog.CategoryNodeList.RemoveIf(func(x *info_resource_catalog.CategoryNode) bool {
			return Equal(x, node)
		})
		catalog.CategoryNodeList.Push(node)
	} // [/]
}

func (d *infoResourceCatalogDomain) verifySource(ctx context.Context, source *info_resource_catalog.SourceInfoVO) (err error) {
	// [检查当前业务表是否存在] 不存在返回业务错误，存在时更新名称
	businessFormID := []string{source.BusinessForm.ID}
	businessFormDetails, err := d.bizGrooming.GetBusinessFormDetails(ctx, businessFormID, []string{fmt.Sprintf("%d", business_grooming.TableKindBusinessStandard)}, 1, 1)
	if err != nil {
		return
	}
	if len(businessFormDetails) == 0 {
		err = errorcode.WithDetail(info_resource_catalog.ErrCreateFailInvalidReference, map[string]any{
			"invalid_items": []*info_resource_catalog.RelatedItemVO{
				{
					ID:   source.BusinessForm.ID,
					Name: source.BusinessForm.Name,
					Type: info_resource_catalog.ObjectTypeBusinessForm,
				},
			},
		})
		return
	}
	source.BusinessForm.Name = businessFormDetails[0].Name // [/]
	// [没有来源部门时跳过检查]
	if source.Department == nil {
		source.Department = &info_resource_catalog.BusinessEntity{
			ID:   emptyItemID,
			Name: "",
		}
		return
	} // [/]
	// [检查来源部门是否存在] 不存在返回业务错误，存在时更新名称
	departmentID := []string{source.Department.ID}
	resp, err := d.confCenter.GetDepartmentPrecision(ctx, departmentID)
	if err != nil {
		return
	}
	if resp == nil || len(resp.Departments) == 0 {
		err = errorcode.WithDetail(info_resource_catalog.ErrCreateFailInvalidReference, map[string]any{
			"invalid_items": []*info_resource_catalog.RelatedItemVO{
				{
					ID:   source.Department.ID,
					Name: source.Department.Name,
					Type: info_resource_catalog.ObjectTypeDepartment,
				},
			},
		})
		return
	}
	source.Department.Name = resp.Departments[0].Name // [/]
	return
}
