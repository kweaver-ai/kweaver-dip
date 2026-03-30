package impl

import (
	"context"

	"github.com/biocrosscoder/flex/typed/functools"
	"github.com/samber/lo"
	"go.uber.org/zap"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/request"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/info_resource_catalog"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/my_favorite"
	"github.com/kweaver-ai/idrm-go-common/util"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

// 用户搜索信息资源目录
func (d *infoResourceCatalogDomain) SearchInfoResourceCatalogsByUser(ctx context.Context, req *info_resource_catalog.SearchInfoResourceCatalogsByUserReq) (res *info_resource_catalog.SearchInfoResourceCatalogsByUserRes, err error) {
	return util.HandleReqWithTraceIncludingErrLog(ctx, func(ctx context.Context) (res *info_resource_catalog.SearchInfoResourceCatalogsByUserRes, err error) {
		log.WithContext(ctx).Debug("search info resource catalogs by user", zap.Any("req", req))

		categoryNodeIDs := make([]string, 0, 1)
		var cateFullInfo *info_resource_catalog.CateInfoQuery
		if req.Filter != nil && req.Filter.CateInfo != nil {
			cateInfo := req.Filter.CateInfo
			// [解析分类信息]
			categoryNodeIDs, err = d.parseCateInfo(ctx, cateInfo)
			if err != nil {
				return
			} // [/]
			// [类目节点不存在时返回空列表]
			if len(categoryNodeIDs) == 0 {
				res = &info_resource_catalog.SearchInfoResourceCatalogsByUserRes{
					NextFlag: make([]string, 0),
				}
				res.TotalCount = 0
				res.Entries = make([]*info_resource_catalog.UserSearchListItem, 0)
				return
			} // [/]
			// [构建搜索匹配分类条件]
			cateFullInfo = &info_resource_catalog.CateInfoQuery{
				CateID:  cateInfo.CateID,
				NodeIDs: categoryNodeIDs,
			} // [/]
		}
		// [构建筛选条件] 普通用户只能查看已发布且已上线项
		publishStatus := []string{info_resource_catalog.PublishStatusPublished.String}
		onlineStatus := []string{
			info_resource_catalog.OnlineStatusOnline.String,
			info_resource_catalog.OnlineStatusOnlineDownAuditing.String,
			info_resource_catalog.OnlineStatusOnlineDownReject.String,
		} // [/]
		// [执行搜索]
		params := d.buildSearchRequest(req.KeywordParam, req.Filter, publishStatus, onlineStatus, req.NextFlag, cateFullInfo)
		log.WithContext(ctx).Debug("search info source catalog from basic-search", zap.Any("params", params))
		result, err := d.search.SearchInfoCatalog(ctx, params)
		if err != nil {
			return
		} // [/]
		log.WithContext(ctx).Debug("search info source catalog from basic-search", zap.Any("result", result))

		// 填充信息资源目录 - 业务表 - 业务模型 - 主干业务 - 所属属部门的类型
		// （组织 OR 部门） result.Entries[*].MainBusinessDepartments[*].Type
		for i := range result.Entries {
			for j := range result.Entries[i].MainBusinessDepartments {
				obj, err := d.objects.Get(ctx, result.Entries[i].MainBusinessDepartments[j].ID)
				if err != nil {
					log.Warn("get InfoResourceCatalog.BusinessForm.MainBusiness.Department failed", zap.Error(err), zap.Any("infoResourceCatalog", result.Entries[i]))
					continue
				}
				result.Entries[i].MainBusinessDepartments[j].Type = obj.Type.String()
			}
		}

		// [组装响应]
		res = &info_resource_catalog.SearchInfoResourceCatalogsByUserRes{
			NextFlag: result.NextFlag,
		}
		res.TotalCount = result.TotalCount
		res.Entries = functools.Map(d.buildSearchListEntry, result.Entries) // [/]

		if err = setInfoCatalogFavoredStatus(ctx, d,
			lo.Map(res.Entries,
				func(item *info_resource_catalog.UserSearchListItem, idx int) info_resource_catalog.SearchListItemInterface {
					return item
				},
			),
		); err != nil {
			return nil, err
		}
		return
	})
}

// 运营搜索信息资源目录
func (d *infoResourceCatalogDomain) SearchInfoResourceCatalogsByAdmin(ctx context.Context, req *info_resource_catalog.SearchInfoResourceCatalogsByAdminReq) (res *info_resource_catalog.SearchInfoResourceCatalogsByAdminRes, err error) {
	return util.HandleReqWithTraceIncludingErrLog(ctx, func(ctx context.Context) (res *info_resource_catalog.SearchInfoResourceCatalogsByAdminRes, err error) {
		log.WithContext(ctx).Debug("search info resource catalogs by user", zap.Any("req", req))

		categoryNodeIDs := make([]string, 0, 1)
		var cateFullInfo *info_resource_catalog.CateInfoQuery
		if req.Filter != nil && req.Filter.CateInfo != nil {
			cateInfo := req.Filter.CateInfo
			// [解析分类信息]
			categoryNodeIDs, err = d.parseCateInfo(ctx, cateInfo)
			if err != nil {
				return
			} // [/]
			// [类目节点不存在时返回空列表]
			if len(categoryNodeIDs) == 0 {
				res = &info_resource_catalog.SearchInfoResourceCatalogsByAdminRes{
					NextFlag: make([]string, 0),
				}
				res.TotalCount = 0
				res.Entries = make([]*info_resource_catalog.AdminSearchListItem, 0)
				return
			} // [/]
			// [构建搜索匹配分类条件]
			cateFullInfo = &info_resource_catalog.CateInfoQuery{
				CateID:  cateInfo.CateID,
				NodeIDs: categoryNodeIDs,
			} // [/]
		}
		// [执行搜索]
		var filter *info_resource_catalog.UserSearchFilterParams
		var publishStatus, onlineStatus []string
		if req.Filter != nil {
			filter = &req.Filter.UserSearchFilterParams
			publishStatus = req.Filter.PublishStatus
			onlineStatus = req.Filter.OnlineStatus
		}
		params := d.buildSearchRequest(req.KeywordParam, filter, publishStatus, onlineStatus, req.NextFlag, cateFullInfo)
		result, err := d.search.SearchInfoCatalog(ctx, params)
		if err != nil {
			return
		} // [/]
		// [组装响应]
		res = &info_resource_catalog.SearchInfoResourceCatalogsByAdminRes{
			NextFlag: result.NextFlag,
		}
		res.TotalCount = result.TotalCount
		res.Entries = functools.Map(func(x *info_resource_catalog.EsSearchEntryListItem) *info_resource_catalog.AdminSearchListItem {
			return &info_resource_catalog.AdminSearchListItem{
				UserSearchListItem: *d.buildSearchListEntry(x),
				Status:             d.extractStatusFromSearchResult(x),
			}
		}, result.Entries) // [/]

		if err = setInfoCatalogFavoredStatus(ctx, d,
			lo.Map(res.Entries,
				func(item *info_resource_catalog.AdminSearchListItem, idx int) info_resource_catalog.SearchListItemInterface {
					return item
				},
			),
		); err != nil {
			return nil, err
		}
		return
	})
}

func setInfoCatalogFavoredStatus(ctx context.Context, d *infoResourceCatalogDomain, entries []info_resource_catalog.SearchListItemInterface) (err error) {
	uInfo := request.GetUserInfo(ctx)
	cids := make([]string, 0, len(entries))
	cid2idx := make(map[string]int, len(entries))
	for i := range entries {
		cids = append(cids, entries[i].GetID())
		cid2idx[cids[i]] = i
	}

	if len(cids) > 0 {
		var (
			favoredRIDs []*my_favorite.FavorIDBase
			sli         info_resource_catalog.SearchListItemInterface
		)
		if favoredRIDs, err = d.myFavoriteRepo.FilterFavoredRIDSV1(nil, ctx,
			uInfo.ID, cids, my_favorite.RES_TYPE_INFO_CATALOG); err != nil {
			log.WithContext(ctx).Errorf("d.myFavoriteRepo.FilterFavoredRIDS failed: %v", err)
			return errorcode.Detail(errorcode.PublicDatabaseError, err)
		}
		for i := range favoredRIDs {
			sli = entries[cid2idx[favoredRIDs[i].ResID]]
			sli.SetIsFavored(true)
			sli.SetFavorID(favoredRIDs[i].ID)
		}
	}
	return
}
