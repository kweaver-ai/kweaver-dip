package impl

import (
	"context"
	"fmt"
	"strconv"
	"time"

	"github.com/biocrosscoder/flex/typed/collections/arraylist"
	"github.com/biocrosscoder/flex/typed/collections/dict"
	"github.com/biocrosscoder/flex/typed/functools"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/request"
	local_util "github.com/kweaver-ai/dsg/services/apps/data-catalog/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/common"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/info_resource_catalog"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-common/errorcode"
	"github.com/kweaver-ai/idrm-go-common/rest/base"
	"github.com/kweaver-ai/idrm-go-common/rest/business_grooming"
	"github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
	"github.com/kweaver-ai/idrm-go-common/rest/workflow"
	"github.com/kweaver-ai/idrm-go-common/util"
	common_util "github.com/kweaver-ai/idrm-go-common/util"
	"github.com/kweaver-ai/idrm-go-frame/core/enum"
	"github.com/samber/lo"
)

// 查询未编目业务表
func (d *infoResourceCatalogDomain) QueryUncatalogedBusinessForms(ctx context.Context, req *info_resource_catalog.QueryUncatalogedBusinessFormsReq) (res *info_resource_catalog.QueryUncatalogedBusinessFormsRes, err error) {
	return util.HandleReqWithErrLog(ctx, func(ctx context.Context) (res *info_resource_catalog.QueryUncatalogedBusinessFormsRes, err error) {
		// [生成等值查询参数]
		equals := make([]*info_resource_catalog.SearchParamItem, 0, 1)
		if req.DepartmentID != nil && *req.DepartmentID != "" {
			equals = append(equals, &info_resource_catalog.SearchParamItem{
				Keys:     []string{"DepartmentID"},
				Values:   []any{*req.DepartmentID},
				Exclude:  false,
				Priority: 0,
			})
		} // [/]
		// [生成模糊搜索参数]
		likes := make([]*info_resource_catalog.SearchParamItem, 0, 1)
		if req.Keyword != "" {
			likes = append(likes, &info_resource_catalog.SearchParamItem{
				Keys:     []string{"Name"},
				Values:   []any{req.Keyword},
				Exclude:  false,
				Priority: 0,
			})
		} // [/]
		// [查询未编目业务表列表]
		records, err := d.repo.ListUncatalogedBusinessFormsBy(ctx, equals, likes, buildOrderByParams(req.SortBy), calculateOffset(*req.PageNumber, *req.Limit), *req.Limit)
		if err != nil {
			return
		} // [/]
		// [查询未编目业务表总数]
		count, err := d.repo.CountUncatalogedBusinessForms(ctx, equals, likes)
		if err != nil {
			return
		} // [/]
		// [获取业务表详情]
		formIDs := functools.Map(func(x *info_resource_catalog.BusinessFormCopy) string {
			return x.ID
		}, records)
		businessFormDetails := make([]*business_grooming.BusinessFormDetail, 0)
		if len(formIDs) > 0 {
			businessFormDetails, err = d.bizGrooming.GetBusinessFormDetails(ctx, formIDs, []string{fmt.Sprintf("%d", business_grooming.TableKindBusinessStandard)}, 1, *req.Limit)
			if err != nil {
				return
			}
			if len(formIDs) != len(businessFormDetails) {
				return nil, errorcode.Detail(errorcode.PublicInternalError, "部分业务表不存在")
			}
		} // [/]
		fid2detailMap := lo.SliceToMap(businessFormDetails, func(item *business_grooming.BusinessFormDetail) (string, *business_grooming.BusinessFormDetail) {
			return item.ID, item
		})
		// [组装响应]
		entries := functools.Map(func(x *info_resource_catalog.BusinessFormCopy) *info_resource_catalog.BusinessFormVO {
			detail := fid2detailMap[x.ID]
			return &info_resource_catalog.BusinessFormVO{
				ID:             x.ID,
				Name:           detail.Name,
				Description:    detail.Description,
				DepartmentID:   detail.DepartmentID,
				DepartmentName: detail.DepartmentName,
				DepartmentPath: detail.DepartmentPath,
				RelatedInfoSystems: functools.Map(func(x base.IDNameResp) *info_resource_catalog.BusinessEntity {
					return &info_resource_catalog.BusinessEntity{
						ID:   x.ID,
						Name: x.Name,
					}
				}, detail.RelatedInfoSystems),
				UpdateAt: x.UpdateAt.UnixMilli(),
				UpdateBy: detail.UpdateByName,
			}
		}, records)
		res = &info_resource_catalog.QueryUncatalogedBusinessFormsRes{
			TotalCount: count,
			Entries:    entries,
		} // [/]
		return
	})
}

// 查询信息资源目录编目列表
func (d *infoResourceCatalogDomain) QueryCatalogingList(ctx context.Context, req *info_resource_catalog.QueryInfoResourceCatalogCatalogingListReq) (res *info_resource_catalog.QueryInfoResourceCatalogCatalogingListRes, err error) {
	return util.HandleReqWithErrLog(ctx, func(ctx context.Context) (res *info_resource_catalog.QueryInfoResourceCatalogCatalogingListRes, err error) {
		cateID2NodeIDs := make(map[string][]string)
		if req.UserDepartment && ((req.CateInfo != nil && req.CateInfo.CateID != constant.DepartmentCateId) || req.CateInfo == nil) {
			userInfo := request.GetUserInfo(ctx)
			if len(userInfo.OrgInfos) == 0 {
				return &info_resource_catalog.QueryInfoResourceCatalogCatalogingListRes{
					TotalCount: 0,
					Entries:    make([]*info_resource_catalog.InfoResourceCatalogCatalogingListItem, 0),
				}, nil
			}

			mainDepartments, err := d.confCenter.GetMainDepartIdsByUserID(ctx, userInfo.ID)
			if err != nil {
				return nil, err
			}
			cateID2NodeIDs[info_resource_catalog.CATEGORY_TYPE_ORGANIZATION] = mainDepartments
			/*cateID2NodeIDs[info_resource_catalog.CATEGORY_TYPE_ORGANIZATION], err = d.parseUserOrgCateInfos(ctx, cateID2NodeIDs[info_resource_catalog.CATEGORY_TYPE_ORGANIZATION])
			if err != nil {
				return
			}*/
		}

		// [生成等值查询条件]
		equals := []*info_resource_catalog.SearchParamItem{}
		if req.AutoRelatedSourceID != "" {
			// [根据业务表ID查询其字段引用来源的业务表]
			var resp *business_grooming.BusinessFormSourceRes
			resp, err = d.bizGrooming.GetBusinessFormSource(ctx, req.AutoRelatedSourceID)
			if err != nil {
				return
			} // [/]
			// [根据来源业务表ID查询编目的信息资源目录]
			if resp.Forms != nil && len(resp.Forms) > 0 {
				equals = append(equals, &info_resource_catalog.SearchParamItem{
					Keys:     []string{"BusinessFormID"},
					Values:   local_util.TypedListToAnyList(resp.Forms),
					Exclude:  false,
					Priority: 0,
				})
			}
			var autoRelatedInfoClass []*info_resource_catalog.InfoResourceCatalog
			autoRelatedInfoClass, err = d.repo.GetSourceInfos(ctx, equals)
			if err != nil {
				return
			} // [/]
			// [查询排除自动关联信息类]
			equals = []*info_resource_catalog.SearchParamItem{
				{
					Keys: []string{"ID"},
					Values: functools.Map(func(x *info_resource_catalog.InfoResourceCatalog) any {
						return x.ID
					}, autoRelatedInfoClass),
					Exclude:  true,
					Priority: 0,
				},
			} // [/]
		} // [/]
		equals = append(equals,
			&info_resource_catalog.SearchParamItem{
				Keys:     []string{"CurrentVersion"},
				Values:   []any{true},
				Exclude:  false,
				Priority: 1,
			},
		)
		in, between := d.buildCatalogingFilterParams(req.Filter)
		likes := d.buildLikeParams([]string{"Name", "Code"}, req.Keyword)
		orderBy := buildOrderByParams(req.SortBy)
		var categoryNodeIDs []string
		var categoryID string
		var records []*info_resource_catalog.InfoResourceCatalog
		var count int
		if req.CateInfo != nil {
			cateInfo := req.CateInfo
			categoryID = cateInfo.CateID
			if cateInfo.NodeID == constant.UnallocatedId {
				cateID2NodeIDs[categoryID] = []string{constant.UnallocatedId}
			} else {
				// [解析分类信息]
				categoryNodeIDs, err = d.parseCateInfo(ctx, cateInfo)
				if err != nil {
					return
				} // [/]
				// [类目节点不存在时返回空列表]
				if len(categoryNodeIDs) == 0 {
					res = &info_resource_catalog.QueryInfoResourceCatalogCatalogingListRes{
						TotalCount: 0,
						Entries:    []*info_resource_catalog.InfoResourceCatalogCatalogingListItem{},
					}
					return
				} // [/]
				cateID2NodeIDs[categoryID] = categoryNodeIDs
			}
			// if cateInfo.NodeID == constant.UnallocatedId {
			// 	// [查询未分类信息资源目录]
			// 	records, err = d.repo.ListUnallocatedBy(ctx, categoryID, in, equals, likes, between, orderBy, calculateOffset(*req.PageNumber, *req.Limit), *req.Limit)
			// 	if err != nil {
			// 		return
			// 	} // [/]
			// 	// [查询未分类信息资源目录总数]
			// 	count, err = d.repo.CountUnallocatedBy(ctx, categoryID, in, equals, likes, between)
			// 	if err != nil {
			// 		return
			// 	} // [/]
			// 	goto NEXT
			// }
			// // [解析分类信息]
			// categoryNodeIDs, err = d.parseCateInfo(ctx, cateInfo)
			// if err != nil {
			// 	return
			// } // [/]
			// // [类目节点不存在时返回空列表]
			// if len(categoryNodeIDs) == 0 {
			// 	res = &info_resource_catalog.QueryInfoResourceCatalogCatalogingListRes{
			// 		TotalCount: 0,
			// 		Entries:    []*info_resource_catalog.InfoResourceCatalogCatalogingListItem{},
			// 	}
			// 	return
			// } // [/]
			// cateID2NodeIDs[categoryID] = categoryNodeIDs
		}

		// [查询信息资源目录]
		records, err = d.repo.ListByMultiCateFilter(ctx, cateID2NodeIDs, in, equals, likes, between, orderBy, calculateOffset(*req.PageNumber, *req.Limit), *req.Limit)
		if err != nil {
			return
		} // [/]
		// [查询信息资源目录总数]
		count, err = d.repo.CountByMultiCateFilter(ctx, cateID2NodeIDs, in, equals, likes, between)
		if err != nil {
			return
		} // [/]
		// NEXT:
		// [查询所属部门和关联数据资源目录]
		departmentMap, relatedDataResourceCatalogMap, err := d.getListExtraInfo(ctx, records)
		if err != nil {
			return
		} // [/]
		// [组装响应]
		entries := functools.Map(func(x *info_resource_catalog.InfoResourceCatalog) *info_resource_catalog.InfoResourceCatalogCatalogingListItem {
			vo := &info_resource_catalog.InfoResourceCatalogCatalogingListItem{
				InfoResourceCatalogListAttrs: *d.buildListCommonItem(x, departmentMap, relatedDataResourceCatalogMap),
				UpdateAt:                     int(x.UpdateAt.UnixMilli()),
				Status:                       d.buildInfoResourceCatalogStatusVO(x),
				AlterInfo: &info_resource_catalog.AlterInfo{
					AlterUID:      x.AlterUID,
					AlterName:     x.AlterName,
					AlterAt:       x.AlterAt.UnixMilli(),
					AlterAuditMsg: x.AlterAuditMsg,
				},
			}
			vo.AlterInfo.NextID, _ = strconv.ParseInt(x.NextID, 10, 64)
			// [补充审核拒绝意见]
			if d.isAuditRejected(x) {
				vo.AuditMsg = x.AuditInfo.Msg
			} // [/]
			if len(x.LabelIds) > 0 {
				labelList, err := d.label.GetLabelByIds(ctx, x.LabelIds)
				if err == nil {
					vo.LabelListResp = labelList.LabelResp
				}
			}
			return vo
		}, records)
		res = &info_resource_catalog.QueryInfoResourceCatalogCatalogingListRes{
			TotalCount: count,
			Entries:    entries,
		} // [/]
		return
	})
}

// 查询信息项
func (d *infoResourceCatalogDomain) QueryInfoItems(ctx context.Context, req *info_resource_catalog.GetInfoResourceCatalogColumnsReq) (res *info_resource_catalog.GetInfoResourceCatalogColumnsRes, err error) {
	return util.HandleReqWithErrLog(ctx, func(ctx context.Context) (res *info_resource_catalog.GetInfoResourceCatalogColumnsRes, err error) {
		// [解析信息资源目录ID]
		id, err := strconv.ParseInt(req.ID, 10, 64)
		if err != nil {
			return
		} // [/]
		// [检查信息资源目录是否存在]
		exist, err := d.isCatalogExist(ctx, id)
		if err != nil {
			return
		}
		if !exist {
			err = errorcode.Desc(info_resource_catalog.ErrGetInfoItemsFailParentResourceNotExist)
			return
		} // [/]
		// [查询信息项列表]
		equals := []*info_resource_catalog.SearchParamItem{
			{
				Keys:   []string{"InfoResourceCatalogID"},
				Values: []any{req.ID},
			},
		}
		likes := []*info_resource_catalog.SearchParamItem{
			{
				Keys:     []string{"Name"},
				Values:   []any{req.Keyword},
				Exclude:  false,
				Priority: 0,
			},
		}
		records, err := d.repo.ListColumnsBy(ctx, equals, likes, calculateOffset(*req.PageNumber, *req.Limit), *req.Limit)
		if err != nil {
			return
		} // [/]
		// [查询信息项总数]
		count, err := d.repo.CountColumnsBy(ctx, equals, likes)
		if err != nil {
			return
		} // [/]
		// [更新关联项]
		_, _, err = d.updateInfoItemRelatedInfo(ctx, records)
		if err != nil {
			return
		} // [/]
		// [组装响应]
		entries := functools.Map(func(x *info_resource_catalog.InfoItem) *info_resource_catalog.InfoItemObject {
			vo := new(info_resource_catalog.InfoItemObject)
			vo.ID = x.ID
			vo.Name = x.Name
			vo.FieldNameEN = x.FieldNameEN
			vo.FieldNameCN = x.FieldNameCN
			vo.DataRefer = x.RelatedDataRefer
			vo.CodeSet = x.RelatedCodeSet
			vo.Metadata = &info_resource_catalog.MetadataVO{
				DataType:   x.DataType.String,
				DataLength: int(x.DataLength),
				DataRange:  x.DataRange,
			}
			vo.IsSensitive = x.IsSensitive
			vo.IsSecret = x.IsSecret
			vo.IsPrimaryKey = x.IsPrimaryKey
			vo.IsIncremental = x.IsIncremental
			vo.IsLocalGenerated = x.IsLocalGenerated
			vo.IsStandardized = x.IsStandardized
			return vo
		}, records)
		res = &info_resource_catalog.GetInfoResourceCatalogColumnsRes{
			TotalCount: count,
			Entries:    entries,
		} // [/]
		return
	})
}

// 查询信息资源目录待审核列表
func (d *infoResourceCatalogDomain) QueryAuditList(ctx context.Context, req *info_resource_catalog.QueryInfoResourceCatalogAuditListReq) (res *info_resource_catalog.QueryInfoResourceCatalogAuditListRes, err error) {
	return util.HandleReqWithErrLog(ctx, func(ctx context.Context) (res *info_resource_catalog.QueryInfoResourceCatalogAuditListRes, err error) {
		// [查询我的待办列表]
		var reqParamAuditType []string
		if req.Filter != nil && len(req.Filter.AuditType) != 0 {
			reqParamAuditType = functools.Map(info_resource_catalog.EnumAuditTypeValue, req.Filter.AuditType)
		} else {
			reqParamAuditType = functools.Map(func(x info_resource_catalog.EnumAuditType) string {
				return x.String
			}, enum.List[info_resource_catalog.EnumAuditType]())
		}
		innerReq := &workflow.GetMyTodoListReq{
			Abstracts: req.Keyword,
			Type:      reqParamAuditType,
			Limit:     *req.Limit,
			Offset:    calculateOffset(*req.PageNumber, *req.Limit),
		}
		innerRes, err := d.docAudit.GetMyTodoList(ctx, innerReq)
		if err != nil {
			return
		} // [/]
		entries := make([]*info_resource_catalog.InfoResourceCatalogAuditListItem, len(innerRes.Entries))
		ids := make([]any, len(innerRes.Entries))
		var (
			catalogID uint64
			auditAt   time.Time
		)
		for i, item := range innerRes.Entries {
			// [解析并记录ID]
			catalogID, _, err = common.ParseAuditApplyID(item.ApplyDetail.Process.ApplyID)
			if err != nil {
				return
			}
			ids[i] = strconv.FormatUint(catalogID, 10) // [/]
			// [解析时间戳]
			auditAt, err = time.Parse(time.RFC3339Nano, item.ApplyTime)
			if err != nil {
				return
			} // [/]
			// [生成响应列表项]
			entry := &info_resource_catalog.InfoResourceCatalogAuditListItem{
				AuditAt:       int(auditAt.UnixMilli()),
				AuditType:     enum.Get[info_resource_catalog.EnumAuditType](item.ApplyDetail.Process.AuditType).Display,
				ProcessID:     item.ID,
				ApplyUserName: item.ApplyUserName,
			}
			entry.ID = strconv.FormatUint(catalogID, 10)
			entries[i] = entry // [/]
		}
		// [查询信息资源目录]
		in := []*info_resource_catalog.SearchParamItem{
			{
				Keys:     []string{"ID"},
				Values:   ids,
				Exclude:  false,
				Priority: 0,
			},
		}
		records, err := d.repo.ListBy(ctx, []string{}, "", in, nil, nil, nil, nil, 0, 0)
		if err != nil {
			return
		}
		infoResourceCatalogMap := make(map[string]*info_resource_catalog.InfoResourceCatalog)
		for _, record := range records {
			infoResourceCatalogMap[record.ID] = record
		} // [/]
		// [查询所属部门和关联数据资源目录]
		departmentMap, relatedDataResourceCatalogMap, err := d.getListExtraInfo(ctx, records)
		if err != nil {
			return
		} // [/]
		// [组装响应]
		for _, entry := range entries {
			// [根据ID匹配信息资源目录，不存在则跳过]
			infoCatalog := infoResourceCatalogMap[entry.ID]
			if infoCatalog == nil {
				continue
			} // [/]
			entry.InfoResourceCatalogListAttrs = *d.buildListCommonItem(infoCatalog, departmentMap, relatedDataResourceCatalogMap)
		}
		res = &info_resource_catalog.QueryInfoResourceCatalogAuditListRes{
			Entries:    entries,
			TotalCount: innerRes.TotalCount,
		} // [/]
		return
	})
}

// 构建模糊查询参数
func (d *infoResourceCatalogDomain) buildLikeParams(fields []string, value string) []*info_resource_catalog.SearchParamItem {
	return []*info_resource_catalog.SearchParamItem{
		{
			Keys:     fields,
			Values:   []any{value},
			Exclude:  false,
			Priority: 0,
		},
	}
}

// 根据编目列表筛选字段构建查询参数
func (d *infoResourceCatalogDomain) buildCatalogingFilterParams(entry *info_resource_catalog.CatalogQueryFilterParamsVO) (in, between []*info_resource_catalog.SearchParamItem) {
	if entry == nil {
		return
	}
	// [构建IN查询参数]
	in = make([]*info_resource_catalog.SearchParamItem, 0, 2)
	if entry.PublishStatus != nil {
		in = append(in, &info_resource_catalog.SearchParamItem{
			Keys: []string{"PublishStatus"},
			Values: functools.Map(func(x string) any {
				return enum.Get[info_resource_catalog.EnumPublishStatus](x).Integer.Int8()
			}, entry.PublishStatus),
			Exclude:  false,
			Priority: 0,
		})
	}
	if entry.OnlineStatus != nil {
		in = append(in, &info_resource_catalog.SearchParamItem{
			Keys: []string{"OnlineStatus"},
			Values: functools.Map(func(x string) any {
				return enum.Get[info_resource_catalog.EnumOnlineStatus](x).Integer.Int8()
			}, entry.OnlineStatus),
			Exclude:  false,
			Priority: 0,
		})
	} // [/]
	// [构建范围查询参数]
	if entry.UpdateAt != nil {
		between = []*info_resource_catalog.SearchParamItem{
			{
				Keys: []string{"UpdateAt"},
				Values: []any{
					entry.UpdateAt.Start,
					entry.UpdateAt.End,
				},
			},
		}
	} // [/]
	return
}

// 获取列表所需额外信息
func (d *infoResourceCatalogDomain) getListExtraInfo(
	ctx context.Context,
	infoCatalogs []*info_resource_catalog.InfoResourceCatalog,
) (
	departmentMap dict.Dict[string, *configuration_center.DepartmentInternal],
	dataCatalogMap dict.Dict[string, []*model.TDataCatalog],
	err error,
) {
	// [提取信息资源目录ID]
	infoResourceCatalogIDs := functools.Map(func(x *info_resource_catalog.InfoResourceCatalog) any {
		return x.ID
	}, infoCatalogs)
	if len(infoResourceCatalogIDs) == 0 {
		return
	} // [/]
	// [查询关联数据资源目录和所属部门]
	equals := []*info_resource_catalog.SearchParamItem{
		{
			Keys:     []string{"InfoResourceCatalogID"},
			Values:   infoResourceCatalogIDs,
			Exclude:  false,
			Priority: 0,
		},
		{
			Keys:     []string{"RelationType"},
			Values:   []any{info_resource_catalog.RelatedDataResourceCatalog, info_resource_catalog.BelongDepartment},
			Exclude:  false,
			Priority: 1,
		},
	}
	var relatedItems []*info_resource_catalog.InfoResourceCatalogRelatedItemPO
	relatedItems, err = d.repo.ListRelatedItemsBy(ctx, equals, 0, 0)
	if err != nil {
		return
	} // [/]
	// [区分关联数据资源目录和所属部门]
	dataCatalogList := make([]*info_resource_catalog.InfoResourceCatalogRelatedItemPO, 0, len(relatedItems))
	departmentList := make([]*info_resource_catalog.InfoResourceCatalogRelatedItemPO, 0, len(relatedItems))
	relatedDataCatalogIDs := make(dict.Dict[string, arraylist.ArrayList[uint64]])
	belongDepartmentIDs := make(dict.Dict[string, string])
	var dataCatalogID uint64
	for _, item := range relatedItems {
		infoCatalogID := strconv.FormatInt(item.InfoResourceCatalogID, 10)
		switch item.RelationType {
		case info_resource_catalog.RelatedDataResourceCatalog:
			// [记录关联数据资源目录]
			dataCatalogList = append(dataCatalogList, item)
			datacatalogIDs := relatedDataCatalogIDs.Get(infoCatalogID, arraylist.Of[uint64]())
			dataCatalogID, err = strconv.ParseUint(item.RelatedItemID, 10, 64)
			if err != nil {
				return
			}
			relatedDataCatalogIDs.Set(infoCatalogID, datacatalogIDs.Concat(arraylist.Of(dataCatalogID))) // [/]
		case info_resource_catalog.BelongDepartment:
			// [记录所属部门]
			departmentList = append(departmentList, item)
			belongDepartmentIDs.Set(infoCatalogID, item.RelatedItemID) // [/]
		}
	} // [/]
	// [数据资源目录ID去重]
	dataCatalogSet := make(dict.Dict[uint64, *model.TDataCatalog])
	for _, catalog := range dataCatalogList {
		dataCatalogID, err = strconv.ParseUint(catalog.RelatedItemID, 10, 64)
		if err != nil {
			return
		}
		dataCatalogSet.Set(dataCatalogID, nil)
	} // [/]
	// [根据ID获取关联数据资源目录详情]
	if dataCatalogSet.Size() > 0 {
		var dataCatalogs []*model.TDataCatalog
		dataCatalogs, err = d.dataResourceCatalogRepo.ListCatalogsByIDs(ctx, dataCatalogSet.Keys())
		if err != nil {
			return
		}
		for _, catalog := range dataCatalogs {
			dataCatalogSet.Set(catalog.ID, catalog)
		}
	} // [/]
	// [将关联数据资源目录存入映射表]
	dataCatalogMap = make(dict.Dict[string, []*model.TDataCatalog])
	for infoCatalogID, dataCatalogIDs := range relatedDataCatalogIDs {
		dataCatalogs := make([]*model.TDataCatalog, 0, dataCatalogIDs.Len())
		for _, catalogID := range dataCatalogIDs {
			if catalog := dataCatalogSet.Get(catalogID); catalog != nil {
				dataCatalogs = append(dataCatalogs, catalog)
			}
		}
		dataCatalogMap.Set(infoCatalogID, dataCatalogs)
	} // [/]
	// [部门ID去重]
	departmentSet := make(dict.Dict[string, *configuration_center.DepartmentInternal])
	for _, department := range departmentList {
		departmentSet.Set(department.RelatedItemID, nil)
	} // [/]
	// [根据部门ID查询部门路径]
	if departmentSet.Size() > 0 {
		var departmentInfos *configuration_center.GetDepartmentPrecisionRes
		departmentInfos, err = d.confCenter.GetDepartmentPrecision(ctx, departmentSet.Keys())
		if err != nil {
			return
		}
		for _, info := range departmentInfos.Departments {
			departmentSet.Set(info.ID, info)
		}
	} // [/]
	// [将所属部门存入映射表]
	departmentMap = make(dict.Dict[string, *configuration_center.DepartmentInternal])
	for infoCatalogID, departmentID := range belongDepartmentIDs {
		departmentMap.Set(infoCatalogID, departmentSet.Get(departmentID))
	} // [/]
	return
}

func (d *infoResourceCatalogDomain) QueryInfoResourceCatalogStatistics(ctx context.Context,
	req *info_resource_catalog.StatisticsParam) (res *info_resource_catalog.StatisticsResp, err error) {
	return util.HandleReqWithErrLog(ctx, func(ctx context.Context) (res *info_resource_catalog.StatisticsResp, err error) {
		// uInfo := request.GetUserInfo(ctx)
		// var (
		// 	roles      []configuration_center.Role
		// 	isOperator bool
		// )
		// if roles, err = d.confCenter.UsersRoles(ctx); err != nil {
		// 	log.WithContext(ctx).Errorf("d.confCenter.UsersRoles failed: %v", err)
		// 	return nil, errorcode.Detail(errorcode.PublicInternalError, err)
		// }
		// for i := range roles {
		// 	if roles[i].ID == common.USER_ROLE_OPERATOR {
		// 		isOperator = true
		// 		break
		// 	}
		// }

		// [查询部门子节点]
		userInfo, err := common_util.GetUserInfo(ctx)
		if err != nil {
			return nil, err
		}
		mainDepartIds, err := d.confCenter.GetMainDepartIdsByUserID(ctx, userInfo.ID)
		if err != nil {
			return nil, err
		}
		equals := []*info_resource_catalog.SearchParamItem{
			{
				Keys:     []string{"CurrentVersion"},
				Values:   []any{true},
				Exclude:  false,
				Priority: 0,
			},
		}
		res = &info_resource_catalog.StatisticsResp{}
		if res.OrgRelatedCatalogNum, err = d.repo.CountBy(ctx, mainDepartIds, info_resource_catalog.CATEGORY_TYPE_ORGANIZATION, nil, equals, nil, nil); err != nil {
			return nil, err
		}
		// if isOperator {
		var num int
		in := []*info_resource_catalog.SearchParamItem{
			{
				Keys: []string{"OnlineStatus"},
				Values: []any{
					info_resource_catalog.OnlineStatusOnline.Integer.Int8(),
					info_resource_catalog.OnlineStatusOnlineDownAuditing.Integer.Int8(),
					info_resource_catalog.OnlineStatusOnlineDownReject.Integer.Int8(),
				},
				Exclude:  false,
				Priority: 1,
			},
		}
		if num, err = d.repo.CountBy(ctx, nil, "", in, equals, nil, nil); err != nil {
			return nil, err
		}
		res.AllCatalogNum = &num
		// }
		return
	})
}
