package impl

import (
	"context"
	"fmt"
	"strconv"

	"github.com/biocrosscoder/flex/typed/functools"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/request"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/info_resource_catalog"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/my_favorite"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-common/errorcode"
	"github.com/kweaver-ai/idrm-go-common/util"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

// 获取信息资源目录卡片基本信息
func (d *infoResourceCatalogDomain) GetInfoResourceCatalogCardBaseInfo(ctx context.Context, req *info_resource_catalog.GetInfoResourceCatalogCardBaseInfoReq) (res *info_resource_catalog.GetInfoResourceCatalogCardBaseInfoRes, err error) {
	return util.HandleReqWithErrLog(ctx, func(ctx context.Context) (res *info_resource_catalog.GetInfoResourceCatalogCardBaseInfoRes, err error) {
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
			err = errorcode.Desc(info_resource_catalog.ErrGetInfoResourceCatalogCardFailResourceNotExist)
			return
		} // [/]
		// [根据ID获取信息资源目录详情]
		catalog, err := d.repo.FindByID(ctx, id)
		if err != nil {
			return
		} // [/]
		// [组装响应]
		res = &info_resource_catalog.GetInfoResourceCatalogCardBaseInfoRes{
			Name:        catalog.Name,
			Code:        catalog.Code,
			Description: catalog.Description,
		} // [/]
		return
	})
}

// 获取信息资源目录关联数据资源目录
func (d *infoResourceCatalogDomain) GetRelatedDataResourceCatalogs(ctx context.Context, req *info_resource_catalog.GetInfoResourceCatalogRelatedDataResourceCatalogsReq) (res *info_resource_catalog.GetInfoResourceCatalogRelatedDataResourceCatalogsRes, err error) {
	return util.HandleReqWithErrLog(ctx, func(ctx context.Context) (res *info_resource_catalog.GetInfoResourceCatalogRelatedDataResourceCatalogsRes, err error) {
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
			err = errorcode.Desc(info_resource_catalog.ErrGetInfoResourceCatalogCardFailResourceNotExist)
			return
		} // [/]
		// [查询关联数据资源目录]
		equals := []*info_resource_catalog.SearchParamItem{
			{
				Keys:     []string{"InfoResourceCatalogID"},
				Values:   []any{req.ID},
				Exclude:  false,
				Priority: 0,
			},
			{
				Keys:     []string{"RelationType"},
				Values:   []any{info_resource_catalog.RelatedDataResourceCatalog},
				Exclude:  false,
				Priority: 1,
			},
		}
		relatedDataResourceCatalogs, err := d.repo.ListRelatedItemsBy(ctx, equals, calculateOffset(*req.PageNumber, *req.Limit), *req.Limit)
		if err != nil {
			return
		} // [/]
		// [根据ID获取关联数据资源目录详情]
		relatedDataResourceCatalogIDs := make([]uint64, len(relatedDataResourceCatalogs))
		var catalogID uint64
		for i, catalog := range relatedDataResourceCatalogs {
			catalogID, err = strconv.ParseUint(catalog.RelatedItemID, 10, 64)
			if err != nil {
				return
			}
			relatedDataResourceCatalogIDs[i] = catalogID
		}
		dataCatalogs, err := operateSkipEmpty(ctx, relatedDataResourceCatalogIDs, d.dataResourceCatalogRepo.ListCatalogsByIDs)
		if err != nil {
			return
		} // [/]
		// [查询关联数据资源目录总数]
		count, err := d.repo.CountRelatedItemsBy(ctx, equals)
		if err != nil {
			return
		} // [/]
		// [组装响应]
		entries := functools.Map(func(x *model.TDataCatalog) *info_resource_catalog.DataResoucreCatalogCard {
			card := &info_resource_catalog.DataResoucreCatalogCard{
				ID:   strconv.FormatUint(x.ID, 10),
				Name: x.Title,
				Code: x.Code,
			}
			// [特殊处理数据资源目录表中发布时间为NULL的情况]
			if x.PublishedAt != nil {
				card.PublishAt = int(x.PublishedAt.UnixMilli())
			} // [/]
			return card
		}, dataCatalogs)
		res = &info_resource_catalog.GetInfoResourceCatalogRelatedDataResourceCatalogsRes{
			TotalCount: count,
			Entries:    entries,
		} // [/]
		return
	})
}

// 用户获取信息资源目录详情
func (d *infoResourceCatalogDomain) GetInfoResourceCatalogDetailByUser(ctx context.Context, req *info_resource_catalog.GetInfoResourceCatalogDetailReq) (res *info_resource_catalog.GetInfoResourceCatalogDetailByUserRes, err error) {
	return util.HandleReqWithErrLog(ctx, func(ctx context.Context) (res *info_resource_catalog.GetInfoResourceCatalogDetailByUserRes, err error) {
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
			err = errorcode.Desc(info_resource_catalog.ErrGetInfoResourceCatalogDetailFailResourceNotExist)
			return
		} // [/]
		// [根据ID获取信息资源目录详情]
		catalog, err := d.repo.FindByID(ctx, id)
		if err != nil {
			return
		} // [/]
		// [检查关联项存在性并更新名称]
		belongDepartmentPath, err := d.pretreatCatalog(ctx, catalog)
		if err != nil {
			return
		} // [/]
		// [查询类目节点]
		categoryNodeIDs := d.extractCategoryNodeIDs(catalog.CategoryNodeList)
		categoryNodes, err := operateSkipEmpty(ctx, categoryNodeIDs, d.categoryRepo.GetCategoryAndNodeByNodeID)
		if err != nil {
			return
		} // [/]
		// [组装响应]
		res = &info_resource_catalog.GetInfoResourceCatalogDetailByUserRes{
			InfoResourceCatalogDetail: *d.buildInfoResourceCatalogDetail(catalog, categoryNodes, belongDepartmentPath),
		} // [/]

		uInfo := request.GetUserInfo(ctx)
		favorites, err := d.myFavoriteRepo.FilterFavoredRIDSV1(nil, ctx, uInfo.ID, []string{fmt.Sprint(req.ID)}, my_favorite.RES_TYPE_INFO_CATALOG)
		if err != nil {
			log.WithContext(ctx).Errorf("d.myFavoriteRepo.FilterFavoredRIDS err: %v", err)
			return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
		}
		if len(favorites) > 0 {
			res.IsFavored = true
			res.FavorID = favorites[0].ID
		}
		return
	})
}

// 运营获取信息资源目录详情
func (d *infoResourceCatalogDomain) GetInfoResourceCatalogDetailByAdmin(ctx context.Context, req *info_resource_catalog.GetInfoResourceCatalogDetailReq) (res *info_resource_catalog.GetInfoResourceCatalogDetailByAdminRes, err error) {
	return util.HandleReqWithErrLog(ctx, func(ctx context.Context) (res *info_resource_catalog.GetInfoResourceCatalogDetailByAdminRes, err error) {
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
			err = errorcode.Desc(info_resource_catalog.ErrGetInfoResourceCatalogDetailFailResourceNotExist)
			return
		} // [/]
		// [根据ID获取信息资源目录详情]
		catalog, err := d.repo.FindByID(ctx, id)
		if err != nil {
			return
		} // [/]
		// [检查关联项存在性并更新名称]
		belongDepartmentPath, err := d.pretreatCatalog(ctx, catalog)
		if err != nil {
			return
		} // [/]
		// [查询类目节点]
		categoryNodeIDs := d.extractCategoryNodeIDs(catalog.CategoryNodeList)
		categoryNodes, err := operateSkipEmpty(ctx, categoryNodeIDs, d.categoryRepo.GetCategoryAndNodeByNodeID)
		if err != nil {
			return
		} // [/]
		// [组装响应]
		res = &info_resource_catalog.GetInfoResourceCatalogDetailByAdminRes{
			InfoResourceCatalogDetail: *d.buildInfoResourceCatalogDetail(catalog, categoryNodes, belongDepartmentPath),
			Status:                    d.buildInfoResourceCatalogStatusVO(catalog),
			AuditInfo: &info_resource_catalog.AuditInfo{
				ID:  catalog.AuditInfo.ID,
				Msg: catalog.AuditInfo.Msg,
			},
			AlterInfo: &info_resource_catalog.AlterInfo{
				AlterUID:      catalog.AlterUID,
				AlterName:     catalog.AlterName,
				AlterAt:       catalog.AlterAt.UnixMilli(),
				AlterAuditMsg: catalog.AlterAuditMsg,
			},
		} // [/]
		if res.NextID, err = strconv.ParseInt(catalog.NextID, 10, 64); err != nil {
			log.WithContext(ctx).Errorf("strconv.ParseInt err: %v", err)
			return nil, errorcode.Detail(errorcode.PublicInternalError, err)
		}

		uInfo := request.GetUserInfo(ctx)
		favorites, err := d.myFavoriteRepo.FilterFavoredRIDSV1(nil, ctx, uInfo.ID, []string{fmt.Sprint(req.ID)}, my_favorite.RES_TYPE_INFO_CATALOG)
		if err != nil {
			log.WithContext(ctx).Errorf("d.myFavoriteRepo.FilterFavoredRIDS err: %v", err)
			return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
		}
		if len(favorites) > 0 {
			res.IsFavored = true
			res.FavorID = favorites[0].ID
		}
		return
	})
}

// 预处理关联项
func (d *infoResourceCatalogDomain) pretreatCatalog(ctx context.Context, catalog *info_resource_catalog.InfoResourceCatalog) (belongDepartmentPath string, err error) {
	// [处理所属部门/所属处室]
	departmentToUpdate, _, belongDepartmentPath, err := d.updateDepartments(ctx, catalog)
	if err != nil {
		return
	} // [/]
	// [处理所属业务流程]
	businessProcessToUpdate, _, err := d.updateSkipEmptyAndUncataloged(ctx, catalog.BelongBusinessProcessList, d.requestBusinessProcessByID)
	if err != nil {
		return
	} // [/]
	// [处理关联信息系统]
	infoSystemToUpdate, _, err := d.updateSkipEmptyAndUncataloged(ctx, catalog.RelatedInfoSystemList, d.requestInfoSystemByID)
	if err != nil {
		return
	} // [/]
	// [处理关联数据资源目录]
	dataResourceCatalogToUpdate, _, err := d.updateSkipEmptyAndUncataloged(ctx, catalog.RelatedDataResourceCatalogList, d.queryDataResourceCatalogByID)
	if err != nil {
		return
	} // [/]
	// [处理关联信息类]
	infoResourceCatalogToUpdate, _, err := d.updateSkipEmptyAndUncataloged(ctx, catalog.RelatedInfoClassList, d.queryInfoResourceCatalogByID)
	if err != nil {
		return
	} // [/]
	// [处理关联信息项]
	infoItemToUpdate, _, err := d.updateSkipEmptyAndUncataloged(ctx, catalog.RelatedInfoItemList, d.queryInfoItemByID)
	if err != nil {
		return
	} // [/]
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
	return
}
