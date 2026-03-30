package impl

import (
	"context"
	"strconv"

	"github.com/biocrosscoder/flex/typed/collections/arraylist"
	"github.com/biocrosscoder/flex/typed/collections/dict"
	"github.com/biocrosscoder/flex/typed/functools"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/basic_search"
	cf "github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/configuration_center"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/common"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/info_resource_catalog"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-common/rest/business_grooming"
	"github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
	"github.com/kweaver-ai/idrm-go-common/rest/standardization"
)

type queryItems func(ctx context.Context, ids []string) (items []*info_resource_catalog.BusinessEntity, err error)

func (d *infoResourceCatalogDomain) updateItems(ctx context.Context, q queryItems, items []*info_resource_catalog.BusinessEntity) (updates, invalids []*info_resource_catalog.BusinessEntity, err error) {
	// [根据ID查询项]
	itemMap := make(dict.Dict[string, arraylist.ArrayList[*info_resource_catalog.BusinessEntity]])
	for _, item := range items {
		itemGroup := itemMap.Get(item.ID, arraylist.Of[*info_resource_catalog.BusinessEntity]())
		itemMap.Set(item.ID, itemGroup.Concat(arraylist.Of(item)))
	}
	records, err := q(ctx, itemMap.Keys())
	if err != nil {
		return
	} // [/]
	// [处理关联项]
	existItems := make(dict.Dict[string, *info_resource_catalog.BusinessEntity], len(records))
	for _, info := range records {
		existItems.Set(info.ID, info)
	}
	updates = make([]*info_resource_catalog.BusinessEntity, 0, existItems.Size())
	invalids = make([]*info_resource_catalog.BusinessEntity, 0, itemMap.Size()-cap(updates))
	for k, v := range itemMap {
		// [对象被删除时]
		if !existItems.Has(k) {
			// [记录失效项]
			invalids = append(invalids, &info_resource_catalog.BusinessEntity{
				ID:       v[0].ID,
				Name:     v[0].Name,
				DataType: v[0].DataType,
			}) // [/]
			// [将ID置空]
			for _, item := range v {
				item.ID = ""
			} // [/]
			continue
		} // [/]
		newName := existItems.Get(k).Name
		newDataType := existItems.Get(k).DataType
		// [对象改名时追加更新项]
		if newName != v[0].Name || newDataType != v[0].DataType {
			for _, item := range v {
				item.Name = newName
				item.DataType = newDataType
			}
			updates = append(updates, v[0])
		} // [/]
	} // [/]
	return
}

func (d *infoResourceCatalogDomain) requestDepartmentByID(ctx context.Context, ids []string) (items []*configuration_center.DepartmentInternal, err error) {
	res, err := d.confCenter.GetDepartmentPrecision(ctx, ids)
	if err != nil {
		return
	}
	items = res.Departments
	return
}

func (d *infoResourceCatalogDomain) updateDepartments(ctx context.Context, catalog *info_resource_catalog.InfoResourceCatalog) (updates, invalids []*info_resource_catalog.BusinessEntity, belongDepartmentPath string, err error) {
	items := functools.Filter(func(x *info_resource_catalog.BusinessEntity) bool {
		return x != nil
	}, []*info_resource_catalog.BusinessEntity{
		catalog.BelongDepartment,
		catalog.BelongOffice,
	})
	query := func(ctx context.Context, ids []string) (items []*info_resource_catalog.BusinessEntity, err error) {
		data, err := operateSkipEmpty(ctx, ids, d.requestDepartmentByID)
		items = functools.Map(func(x *configuration_center.DepartmentInternal) *info_resource_catalog.BusinessEntity {
			// [记录所属部门路径]
			if catalog.BelongDepartment != nil && x.ID == catalog.BelongDepartment.ID {
				belongDepartmentPath = x.Path
			} // [/]
			return &info_resource_catalog.BusinessEntity{
				ID:   x.ID,
				Name: x.Name,
			}
		}, data)
		return
	}
	updates, invalids, err = d.updateItems(ctx, query, items)
	return
}

func (d *infoResourceCatalogDomain) requestInfoSystemByID(ctx context.Context, ids []string) (items []*info_resource_catalog.BusinessEntity, err error) {
	res, err := d.confCenter.GetInfoSystemsPrecision(ctx, ids, nil)
	if err != nil {
		return
	}
	items = functools.Map(func(x *configuration_center.GetInfoSystemByIdsRes) *info_resource_catalog.BusinessEntity {
		return &info_resource_catalog.BusinessEntity{
			ID:   x.ID,
			Name: x.Name,
		}
	}, res)
	return
}

func (d *infoResourceCatalogDomain) queryDataResourceCatalogByID(ctx context.Context, ids []string) (items []*info_resource_catalog.BusinessEntity, err error) {
	// [转换ID类型]
	idInts := make([]uint64, len(ids))
	var idInt uint64
	for i, id := range ids {
		idInt, err = strconv.ParseUint(id, 10, 64)
		if err != nil {
			return
		}
		idInts[i] = idInt
	} // [/]
	res, err := d.dataResourceCatalogRepo.ListCatalogsByIDs(ctx, idInts)
	if err != nil {
		return
	}
	items = functools.Map(func(x *model.TDataCatalog) *info_resource_catalog.BusinessEntity {
		return &info_resource_catalog.BusinessEntity{
			ID:   strconv.FormatUint(x.ID, 10),
			Name: x.Title,
		}
	}, res)
	return
}

func (d *infoResourceCatalogDomain) queryInfoResourceCatalogByID(ctx context.Context, ids []string) (items []*info_resource_catalog.BusinessEntity, err error) {
	// [生成等值查询条件]
	equals := []*info_resource_catalog.SearchParamItem{
		{
			Keys:     []string{"ID"},
			Values:   util.TypedListToAnyList(ids),
			Exclude:  false,
			Priority: 0,
		},
	} // [/]
	res, err := d.repo.ListBy(ctx, []string{}, "", nil, equals, nil, nil, nil, 0, 0)
	if err != nil {
		return
	}
	items = functools.Map(func(x *info_resource_catalog.InfoResourceCatalog) *info_resource_catalog.BusinessEntity {
		return &info_resource_catalog.BusinessEntity{
			ID:   x.ID,
			Name: x.Name,
		}
	}, res)
	return
}

func (d *infoResourceCatalogDomain) queryInfoItemByID(ctx context.Context, ids []string) (items []*info_resource_catalog.BusinessEntity, err error) {
	// [生成等值查询条件]
	equals := []*info_resource_catalog.SearchParamItem{
		{
			Keys:     []string{"ID"},
			Values:   util.TypedListToAnyList(ids),
			Exclude:  false,
			Priority: 0,
		},
	} // [/]
	res, err := d.repo.ListColumnsBy(ctx, equals, nil, 0, 0)
	if err != nil {
		return
	}
	items = functools.Map(func(x *info_resource_catalog.InfoItem) *info_resource_catalog.BusinessEntity {
		return &info_resource_catalog.BusinessEntity{
			ID:       x.ID,
			Name:     x.Name,
			DataType: x.DataType.String,
		}
	}, res)
	return
}

func (d *infoResourceCatalogDomain) queryDataElements(ctx context.Context, ids []string) (items []*info_resource_catalog.BusinessEntity, err error) {
	res, err := d.standardization.GetDataElementDetailByID(ctx, ids...)
	if err != nil {
		return
	}
	items = functools.Map(func(x *standardization.DataResp) *info_resource_catalog.BusinessEntity {
		return &info_resource_catalog.BusinessEntity{
			ID:   x.ID,
			Name: x.NameCn,
		}
	}, res)
	return
}

func (d *infoResourceCatalogDomain) queryStandards(ctx context.Context, ids []string) (items []*info_resource_catalog.BusinessEntity, err error) {
	res, err := d.standardization.GetStandardDict(ctx, ids)
	if err != nil {
		return
	}
	items = functools.Map(func(x standardization.DictResp) *info_resource_catalog.BusinessEntity {
		return &info_resource_catalog.BusinessEntity{
			ID:   x.ID,
			Name: x.NameZh,
		}
	}, dict.Dict[string, standardization.DictResp](res).Values())
	return
}

func (d *infoResourceCatalogDomain) updateInfoItemRelatedInfo(ctx context.Context, records []*info_resource_catalog.InfoItem) (invalidDataRefers, invalidCodeSets []*info_resource_catalog.BusinessEntity, err error) {
	// [提取数据元和代码集]
	dataRefersToCheck := make([]*info_resource_catalog.BusinessEntity, 0, len(records))
	codeSetsToCheck := make([]*info_resource_catalog.BusinessEntity, 0, len(records))
	for _, record := range records {
		// [未传值设置占位空值，查询时检测到占位ID则置空项，其它值全部加入待检查列表]
		if record.RelatedDataRefer == nil {
			record.RelatedDataRefer = &info_resource_catalog.BusinessEntity{
				ID: emptyItemID,
			}
		} else if record.RelatedDataRefer.ID == emptyItemID {
			record.RelatedDataRefer = nil
		} else {
			dataRefersToCheck = append(dataRefersToCheck, record.RelatedDataRefer)
		}
		if record.RelatedCodeSet == nil {
			record.RelatedCodeSet = &info_resource_catalog.BusinessEntity{
				ID: emptyItemID,
			}
		} else if record.RelatedCodeSet.ID == emptyItemID {
			record.RelatedCodeSet = nil
		} else {
			codeSetsToCheck = append(codeSetsToCheck, record.RelatedCodeSet)
		} // [/]
	} // [/]
	// [更新数据元]
	dataRefersToUpdate, invalidDataRefers, err := d.updateSkipEmptyAndUncataloged(ctx, dataRefersToCheck, d.queryDataElements)
	if err != nil {
		return
	} // [/]
	// [更新代码集]
	codeSetsToUpdate, invalidCodeSets, err := d.updateSkipEmptyAndUncataloged(ctx, codeSetsToCheck, d.queryStandards)
	if err != nil {
		return
	} // [/]
	// [异步更新信息项关联项]
	asyncUpdate(map[info_resource_catalog.ColumnRelatedInfoRelatedTypeEnum][]*info_resource_catalog.BusinessEntity{
		info_resource_catalog.RelatedDataRefer: dataRefersToUpdate,
		info_resource_catalog.RelatedCodeSet:   codeSetsToUpdate,
	}, d.repo.UpdateColumnRelatedInfos) // [/]
	return
}

func (d *infoResourceCatalogDomain) requestBusinessProcessByID(ctx context.Context, ids []string) (items []*info_resource_catalog.BusinessEntity, err error) {
	res, err := d.bizGrooming.GetBusinessNodesBrief(ctx, ids)
	if err != nil {
		return
	}
	items = functools.Map(func(x *business_grooming.BusinessNode) *info_resource_catalog.BusinessEntity {
		return &info_resource_catalog.BusinessEntity{
			ID:   x.ID,
			Name: x.Name,
		}
	}, functools.Filter(func(x *business_grooming.BusinessNode) bool {
		return x.Type == "process"
	}, res))
	return
}

func (d *infoResourceCatalogDomain) parseCateInfo(ctx context.Context, cateInfo *info_resource_catalog.CateInfoParam) (categoryNodeIDs []string, err error) {
	// [匹配未分类项]
	if cateInfo.NodeID == constant.UnallocatedId {
		categoryNodeIDs = []string{basic_search.UnclassifiedID}
		return
	} // [/]
	categoryNodeIDs = []string{cateInfo.NodeID}
	// [信息系统没有子节点]
	if cateInfo.CateID == constant.InfoSystemCateId {
		return
	} // [/]
	if cateInfo.CateID == constant.DepartmentCateId {
		// [查询部门子节点]
		innerReq := &cf.GetSubOrgCodesReq{
			OrgCode: cateInfo.NodeID,
		}
		var innerRes *cf.GetSubOrgCodesResp
		innerRes, err = d.confCenterLocal.GetSubOrgCodes(ctx, innerReq)
		if err != nil {
			return
		} // [/]
		categoryNodeIDs = append(categoryNodeIDs, innerRes.Codes...)
		return
	}
	// [查询类目节点]
	categoryNodeInfo, err := d.categoryRepo.GetCategoryAndNodeByNodeID(ctx, []string{cateInfo.NodeID})
	if err != nil {
		return
	} // [/]
	// [类目节点不存在时返回空列表]
	if len(categoryNodeInfo) == 0 {
		categoryNodeIDs = []string{}
		return
	} // [/]
	// [查询类目子节点] 此方法内部经过处理，返回包含了作为入参的根类目节点
	categoryNodeIDs, err = common.GetSubCategoryNodeIDList(ctx, d.categoryRepo, cateInfo.CateID, cateInfo.NodeID) // [/]
	return
}

func (d *infoResourceCatalogDomain) parseUserOrgCateInfos(ctx context.Context, orgCodes []string) (categoryNodeIDs []string, err error) {
	categoryNodeIDs = orgCodes
	for i := range orgCodes {
		// [查询部门子节点]
		innerReq := &cf.GetSubOrgCodesReq{
			OrgCode: orgCodes[i],
		}
		var innerRes *cf.GetSubOrgCodesResp
		innerRes, err = d.confCenterLocal.GetSubOrgCodes(ctx, innerReq)
		if err != nil {
			return
		} // [/]
		categoryNodeIDs = append(categoryNodeIDs, innerRes.Codes...)
	}
	return
}

func (d *infoResourceCatalogDomain) updateEsIndex(ctx context.Context, catalog *info_resource_catalog.InfoResourceCatalog) (err error) {
	// [补齐信息项列表]
	equals := []*info_resource_catalog.SearchParamItem{
		{
			Keys:   []string{"InfoResourceCatalogID"},
			Values: []any{catalog.ID},
		},
	}
	catalog.Columns, err = d.repo.ListColumnsBy(ctx, equals, nil, 0, 0)
	if err != nil {
		return
	} // [/]

	// TODO 部门非必填时此处报错，故增加判断
	belongDepartmentPath := ""
	if catalog.BelongDepartment != nil && catalog.BelongDepartment.ID != "" {
		// [补齐类目信息]
		depts, err1 := d.requestDepartmentByID(ctx, []string{catalog.BelongDepartment.ID})
		if err1 != nil {
			return
		}
		if len(depts) > 0 {
			belongDepartmentPath = depts[0].Path
		}
	}
	d.completeCateInfo(catalog, belongDepartmentPath) // [/]
	// TODO 目前基础搜索服务没有提供update消息的消费处理，所以此处先用create消息
	// 由于更新时使用create消息处理做全量覆盖式更新，必须补齐未更改信息防止更新导致索引中被更新文档的字段数据丢失 // [/]
	formPathInfo, _ := d.bizGrooming.QueryFormPathInfo(ctx, catalog.SourceBusinessForm.ID)
	err = d.es.CreateInfoCatalog(ctx, d.buildEsCreateMsg(catalog, formPathInfo))
	return
}

// 异步更新
func asyncUpdate[K comparable, T map[K][]*info_resource_catalog.BusinessEntity](data T, update func(context.Context, T) error) {
	go func() {
		util.SafeRun(nil, func(ctx context.Context) error {
			return update(ctx, data)
		})
	}()
}
