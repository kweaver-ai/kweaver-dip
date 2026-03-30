package impl

import (
	"context"
	"fmt"
	"sort"
	"strings"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/basic_search"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/request"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/response"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/util"
	score_domain "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/data_catalog_score"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/frontend/common"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/info_resource_catalog"
	domain "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/my_favorite"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_catalog_score"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/my_favorite"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"github.com/samber/lo"
)

type useCase struct {
	fRepo             my_favorite.Repo
	dsRepo            data_catalog_score.DataCatalogScoreRepo
	basicSearchDriven basic_search.Repo
	data              *db.Data
}

func NewUseCase(
	fRepo my_favorite.Repo,
	dsRepo data_catalog_score.DataCatalogScoreRepo,
	basicSearchDriven basic_search.Repo,
	data *db.Data) domain.UseCase {
	return &useCase{
		fRepo:             fRepo,
		dsRepo:            dsRepo,
		basicSearchDriven: basicSearchDriven,
		data:              data,
	}
}

func (uc *useCase) resourceCheck(ctx context.Context, favorite *model.TMyFavorite) (err error) {
	switch my_favorite.ResType(favorite.ResType) {
	case my_favorite.RES_TYPE_DATA_CATALOG:
		var datas *basic_search.SearchDataRescoureseCatalogResp
		if datas, err = uc.basicSearchDriven.SearchDataCatalog(ctx,
			&basic_search.SearchReqBodyParam{
				Size: 1,
				CommonSearchParam: basic_search.CommonSearchParam{
					IDs: []string{favorite.ResID},
				},
			},
		); err != nil {
			log.WithContext(ctx).Errorf("uc.basicSearchDriven.SearchDataCatalog failed: %v", err)
			return err
		}
		if len(datas.Entries) == 0 {
			log.WithContext(ctx).Errorf("data catalog %s not existed, cannot favor")
			return errorcode.Desc(errorcode.CatalogNotExisted)
		}
		if !datas.Entries[0].IsOnline {
			log.WithContext(ctx).Errorf("data catalog %s not online, cannot favor")
			return errorcode.Detail(errorcode.CatalogFavorNotAllowed, "当前待收藏数据资源目录未上线")
		}
	case my_favorite.RES_TYPE_INFO_CATALOG:
		var datas *info_resource_catalog.EsSearchResult
		if datas, err = uc.basicSearchDriven.SearchInfoCatalog(ctx,
			&info_resource_catalog.EsSearchParam{
				Size: 1,
				IDs:  []string{favorite.ResID},
			},
		); err != nil {
			log.WithContext(ctx).Errorf("uc.basicSearchDriven.SearchInfoCatalog failed: %v", err)
			return err
		}
		if len(datas.Entries) == 0 {
			log.WithContext(ctx).Errorf("info catalog %s not existed, cannot favor", favorite.ResID)
			return errorcode.Desc(errorcode.CatalogNotExisted)
		}
		if !(datas.Entries[0].OnlineStatus == constant.LineStatusOnLine ||
			datas.Entries[0].OnlineStatus == constant.LineStatusDownAuditing ||
			datas.Entries[0].OnlineStatus == constant.LineStatusDownReject) {
			log.WithContext(ctx).Errorf("info catalog %s not online, cannot favor", favorite.ResID)
			return errorcode.Detail(errorcode.CatalogFavorNotAllowed, "当前待收藏信息资源目录未上线")
		}
	case my_favorite.RES_TYPE_ELEC_CATALOG:
		var datas *basic_search.SearchElecLicenceResponse
		if datas, err = uc.basicSearchDriven.SearchElecLicence(ctx,
			&basic_search.SearchElecLicenceRequest{
				Size: 1,
				CommonSearchParam: basic_search.CommonSearchParam{
					IDs: []string{favorite.ResID},
				},
			},
		); err != nil {
			log.WithContext(ctx).Errorf("uc.basicSearchDriven.SearchElecLicence failed: %v", err)
			return err
		}
		if len(datas.Entries) == 0 {
			log.WithContext(ctx).Errorf("elec licence catalog %s not existed, cannot favor", favorite.ResID)
			return errorcode.Desc(errorcode.CatalogNotExisted)
		}

		if !datas.Entries[0].IsOnline {
			log.WithContext(ctx).Errorf("elec licence catalog %s not online, cannot favor", favorite.ResID)
			return errorcode.Detail(errorcode.CatalogFavorNotAllowed, "当前待收藏电子证照目录未上线")
		}
	}
	return
}

func (uc *useCase) Create(ctx context.Context, req *domain.CreateReq) (resp *response.IDResp, err error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()

	uInfo := request.GetUserInfo(ctx)
	favorite := &model.TMyFavorite{
		ResType:   int(domain.ResType2Enum(req.ResType)),
		ResID:     req.ResID,
		CreatedAt: time.Now(),
		CreatedBy: uInfo.ID,
	}
	if err = uc.resourceCheck(ctx, favorite); err != nil {
		return nil, err
	}

	if err = uc.fRepo.Create(nil, ctx, favorite); err != nil {
		if util.IsMysqlDuplicatedErr(err) {
			log.WithContext(ctx).
				Errorf("user (id: %s name: %s) has favored catalog (type: %s id: %s)",
					uInfo.ID, uInfo.Name, req.ResType, req.ResID)
			return nil, errorcode.Desc(errorcode.CatalogHasBeenFavoredErr)
		}
		log.WithContext(ctx).
			Errorf("uc.fRepo.Create failed: %v", err)
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	resp = &response.IDResp{ID: models.NewModelID(favorite.ID)}
	return
}

func (uc *useCase) Delete(ctx context.Context, favorID uint64) (resp *response.IDResp, err error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()

	uInfo := request.GetUserInfo(ctx)
	bRet := false
	if bRet, err = uc.fRepo.Delete(nil, ctx, uInfo.ID, favorID); err != nil {
		log.WithContext(ctx).
			Errorf("uc.fRepo.Delete failed: %v", err)
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	if !bRet {
		log.WithContext(ctx).
			Errorf("favorite (id: %d) not existed or user (id: %s name: %s) not matched",
				favorID, uInfo.ID, uInfo.Name)
		return nil, errorcode.Desc(errorcode.FavoriteNotExistedOrUserNotMatchedErr)
	}
	resp = &response.IDResp{ID: models.NewModelID(favorID)}
	return
}

/*func (uc *useCase) GetList(ctx context.Context, req *domain.ListReq) (resp *domain.ListResp, err error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()

	uInfo := request.GetUserInfo(ctx)
	params := domain.ListReqParam2Map(req)
	resType := domain.ResType2Enum(req.ResType)
	resp = &domain.ListResp{}
	var favorites []*my_favorite.FavorDetail
	if resp.TotalCount, favorites, err =
		uc.fRepo.GetList(nil, ctx, resType, uInfo.ID, params); err != nil {
		log.WithContext(ctx).
			Errorf("uc.fRepo.GetList failed: %v", err)
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	resp.Entries = make([]*domain.ListItem, 0, len(favorites))
	if len(favorites) > 0 {
		cids := make([]string, 0, len(favorites))
		cid2idx := map[string]int{}
		for i := range favorites {
			resp.Entries = append(resp.Entries,
				&domain.ListItem{
					FavorBase: favorites[i].FavorBase,
					CreatedAt: favorites[i].CreatedAt.UnixMilli(),
				},
			)
			cids = append(cids, favorites[i].ResID)
			cid2idx[favorites[i].ResID] = i
		}

		switch resType {
		case my_favorite.RES_TYPE_DATA_CATALOG:
			uc.dataCatalogListProc(ctx, resp.Entries, cids, cid2idx)
		case my_favorite.RES_TYPE_INFO_CATALOG:
			uc.infoCatalogListProc(ctx, resp.Entries, cids, cid2idx)
		case my_favorite.RES_TYPE_ELEC_CATALOG:
			uc.elecCatalogListProc(ctx, resp.Entries, cids, cid2idx)
		}
	}
	return
}*/

/*
	func (uc *useCase) GetList(ctx context.Context, req *domain.ListReq) (resp *domain.ListResp, err error) {
		ctx, span := trace.StartInternalSpan(ctx)
		defer func() { trace.TelemetrySpanEnd(span, err) }()

		uInfo := request.GetUserInfo(ctx)
		params := domain.ListReqParam2Map(req)
		resType := domain.ResType2Enum(req.ResType)
		resp = &domain.ListResp{}

		// 添加空指针检查
		if uc.fRepo == nil {
			log.WithContext(ctx).Errorf("uc.fRepo is nil")
			return nil, errorcode.Detail(errorcode.PublicDatabaseError, fmt.Errorf("repository not initialized"))
		}

		// 检查是否需要按online_at排序
		isOnlineAtSort := req.Sort == "online_at"

		// 如果按online_at排序，需要获取所有数据然后手动分页
		if isOnlineAtSort {
			log.WithContext(ctx).Infof("按online_at排序，获取所有数据后手动分页")
			// 移除分页参数，获取所有数据
			delete(params, "offset")
			delete(params, "limit")
		}

		var favorites []*my_favorite.FavorDetail
		if resp.TotalCount, favorites, err =
			uc.fRepo.GetList(nil, ctx, resType, uInfo.ID, params); err != nil {
			log.WithContext(ctx).
				Errorf("uc.fRepo.GetList failed: %v", err)
			return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
		}

		// 记录原始的数据库记录总数
		originalTotalCount := resp.TotalCount
		log.WithContext(ctx).Infof("数据库查询结果: 总数=%d, 记录数=%d", originalTotalCount, len(favorites))

		resp.Entries = make([]*domain.ListItem, 0, len(favorites))
		if len(favorites) > 0 {
			cids := make([]string, 0, len(favorites))
			cid2idx := map[string]int{}

			// 第一步：构建基础数据结构
			for i := range favorites {
				resp.Entries = append(resp.Entries,
					&domain.ListItem{
						FavorBase: favorites[i].FavorBase,
						CreatedAt: favorites[i].CreatedAt.UnixMilli(),
						OrgCode:   favorites[i].OrgCode,
					},
				)
				cids = append(cids, favorites[i].ResID)
				cid2idx[favorites[i].ResID] = i
			}

			// 第二步：根据资源类型进行后处理，包括department_id过滤
			var filteredEntries []*domain.ListItem
			switch resType {
			case my_favorite.RES_TYPE_DATA_CATALOG:
				filteredEntries, err = uc.dataCatalogListProc(ctx, resp.Entries, cids, cid2idx, req)
			case my_favorite.RES_TYPE_INFO_CATALOG:
				filteredEntries, err = uc.infoCatalogListProc(ctx, resp.Entries, cids, cid2idx, req)
			case my_favorite.RES_TYPE_ELEC_CATALOG:
				filteredEntries, err = uc.elecCatalogListProc(ctx, resp.Entries, cids, cid2idx, req)
			case my_favorite.RES_TYPE_DATA_VIEW:
				filteredEntries, err = uc.dataViewListProc(ctx, resp.Entries, cids, cid2idx, req)
			case my_favorite.RES_TYPE_INTERFACE_SVC:
				filteredEntries, err = uc.interfaceSVCListProc(ctx, resp.Entries, cids, cid2idx, req)
			case my_favorite.RES_TYPE_INDICATOR:
				filteredEntries, err = uc.indicatorListProc(ctx, resp.Entries, cids, cid2idx, req)
			default:
				// 其他资源类型不需要department_id过滤，直接使用原始数据
				filteredEntries = resp.Entries
			}

			if err != nil {
				return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
			}

			// 如果按online_at排序，需要手动分页
			if isOnlineAtSort && len(filteredEntries) > 0 {
				log.WithContext(ctx).Infof("按online_at排序，手动分页处理: 总数=%d, offset=%d, limit=%d",
					len(filteredEntries), req.Offset, req.Limit)

				// 计算分页参数
				start := (req.Offset - 1) * req.Limit
				end := start + req.Limit

				// 边界检查
				if start >= len(filteredEntries) {
					// 超出范围，返回空结果
					filteredEntries = []*domain.ListItem{}
				} else if end > len(filteredEntries) {
					// 最后一页
					filteredEntries = filteredEntries[start:]
				} else {
					// 正常分页
					filteredEntries = filteredEntries[start:end]
				}

				log.WithContext(ctx).Infof("手动分页后结果: 数量=%d", len(filteredEntries))
			}

			// 更新最终结果
			resp.Entries = filteredEntries
			// 保持原始的数据库记录总数，而不是过滤后的数量
			// resp.TotalCount = int64(len(filteredEntries))  // 注释掉这行
			resp.TotalCount = originalTotalCount // 使用原始的数据库记录总数

			log.WithContext(ctx).Infof("最终结果: 原始总数=%d, 过滤后数量=%d, 最终总数=%d",
				originalTotalCount, len(filteredEntries), resp.TotalCount)
		}
		return
	}
*/
func (uc *useCase) GetList(ctx context.Context, req *domain.ListReq) (resp *domain.ListResp, err error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()

	uInfo := request.GetUserInfo(ctx)
	params := domain.ListReqParam2Map(req)
	resType := domain.ResType2Enum(req.ResType)
	resp = &domain.ListResp{}

	// 添加空指针检查
	if uc.fRepo == nil {
		log.WithContext(ctx).Errorf("uc.fRepo is nil")
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, fmt.Errorf("repository not initialized"))
	}

	// 检查是否需要按online_at排序
	isOnlineAtSort := req.Sort == "online_at"

	// 如果按online_at排序，需要获取所有数据然后手动分页
	if isOnlineAtSort {
		log.WithContext(ctx).Infof("按online_at排序，获取所有数据后手动分页")
		// 移除分页参数，获取所有数据
		delete(params, "offset")
		delete(params, "limit")
	}

	var favorites []*my_favorite.FavorDetail
	if resp.TotalCount, favorites, err =
		uc.fRepo.GetList(nil, ctx, resType, uInfo.ID, params); err != nil {
		log.WithContext(ctx).
			Errorf("uc.fRepo.GetList failed: %v", err)
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	// 记录原始的数据库记录总数
	originalTotalCount := resp.TotalCount
	log.WithContext(ctx).Infof("数据库查询结果: 总数=%d, 记录数=%d", originalTotalCount, len(favorites))

	resp.Entries = make([]*domain.ListItem, 0, len(favorites))
	if len(favorites) > 0 {
		cids := make([]string, 0, len(favorites))
		cid2idx := map[string]int{}

		// 第一步：构建基础数据结构
		for i := range favorites {
			resp.Entries = append(resp.Entries,
				&domain.ListItem{
					FavorBase: favorites[i].FavorBase,
					CreatedAt: favorites[i].CreatedAt.UnixMilli(),
					OrgCode:   favorites[i].OrgCode,
				},
			)
			cids = append(cids, favorites[i].ResID)
			cid2idx[favorites[i].ResID] = i
		}

		// 第二步：根据资源类型进行后处理，包括department_id过滤
		var filteredEntries []*domain.ListItem
		switch resType {
		case my_favorite.RES_TYPE_DATA_CATALOG:
			filteredEntries, err = uc.dataCatalogListProc(ctx, resp.Entries, cids, cid2idx, req)
		case my_favorite.RES_TYPE_INFO_CATALOG:
			filteredEntries, err = uc.infoCatalogListProc(ctx, resp.Entries, cids, cid2idx, req)
		case my_favorite.RES_TYPE_ELEC_CATALOG:
			filteredEntries, err = uc.elecCatalogListProc(ctx, resp.Entries, cids, cid2idx, req)
		case my_favorite.RES_TYPE_DATA_VIEW:
			filteredEntries, err = uc.dataViewListProc(ctx, resp.Entries, cids, cid2idx, req)
		case my_favorite.RES_TYPE_INTERFACE_SVC:
			filteredEntries, err = uc.interfaceSVCListProc(ctx, resp.Entries, cids, cid2idx, req)
		case my_favorite.RES_TYPE_INDICATOR:
			filteredEntries, err = uc.indicatorListProc(ctx, resp.Entries, cids, cid2idx, req)
		default:
			// 其他资源类型不需要department_id过滤，直接使用原始数据
			filteredEntries = resp.Entries
		}

		if err != nil {
			return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
		}

		// 如果按online_at排序，需要手动分页
		if isOnlineAtSort && len(filteredEntries) > 0 {
			log.WithContext(ctx).Infof("按online_at排序，手动分页处理: 总数=%d, offset=%d, limit=%d",
				len(filteredEntries), req.Offset, req.Limit)

			// 计算分页参数
			start := (req.Offset - 1) * req.Limit
			end := start + req.Limit

			// 边界检查
			if start >= len(filteredEntries) {
				// 超出范围，返回空结果
				filteredEntries = []*domain.ListItem{}
			} else if end > len(filteredEntries) {
				// 最后一页
				filteredEntries = filteredEntries[start:]
			} else {
				// 正常分页
				filteredEntries = filteredEntries[start:end]
			}

			log.WithContext(ctx).Infof("手动分页后结果: 数量=%d", len(filteredEntries))
		}

		// 更新最终结果
		resp.Entries = filteredEntries
		// 保持原始的数据库记录总数，而不是过滤后的数量
		// resp.TotalCount = int64(len(filteredEntries))  // 注释掉这行
		resp.TotalCount = originalTotalCount // 使用原始的数据库记录总数

		log.WithContext(ctx).Infof("最终结果: 原始总数=%d, 过滤后数量=%d, 最终总数=%d",
			originalTotalCount, len(filteredEntries), resp.TotalCount)
	}
	return
}
func (uc *useCase) dataCatalogListProc(ctx context.Context,
	list []*domain.ListItem, cids []string, cid2idx map[string]int, req *domain.ListReq) (filteredList []*domain.ListItem, err error) {
	var (
		datas  *basic_search.SearchDataRescoureseCatalogResp
		scores []*score_domain.ScoreSummaryVo
		score  string
		idx    int
	)
	if scores, err = uc.dsRepo.GetScoreSummaryByCatalogIds(ctx,
		lo.Map[string, models.ModelID](
			cids,
			func(item string, index int) models.ModelID { return models.ModelID(item) },
		),
	); err != nil {
		log.WithContext(ctx).
			Errorf("uc.dsRepo.GetScoreSummaryByCatalogIds failed: %v", err)
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	if datas, err = uc.basicSearchDriven.SearchDataCatalog(ctx,
		&basic_search.SearchReqBodyParam{
			Size: len(cids),
			CommonSearchParam: basic_search.CommonSearchParam{
				IDs: cids,
			},
		},
	); err != nil {
		log.WithContext(ctx).Errorf("uc.basicSearchDriven.SearchDataCatalog failed: %v", err)
		return nil, err
	}

	for i := range scores {
		idx = cid2idx[fmt.Sprint(scores[i].CatalogID)]
		score = fmt.Sprintf("%.1f", scores[i].AverageScore)
		list[idx].Score = &score
	}

	for i := range datas.Entries {
		idx = cid2idx[datas.Entries[i].ID.String()]
		for j := range datas.Entries[i].CateInfos {
			switch datas.Entries[i].CateInfos[j].CateID {
			case common.CATEGORY_TYPE_ORGANIZATION:
				list[idx].OrgCode = datas.Entries[i].CateInfos[j].NodeID
				list[idx].OrgName = datas.Entries[i].CateInfos[j].NodeName
				list[idx].OrgPath = datas.Entries[i].CateInfos[j].NodePath
				// case common.CATEGORY_TYPE_SUBJECT_DOMAIN:
				// 	if len(list[idx].Subjects) == 0 {
				// 		list[idx].Subjects = make([]*domain.Subject, 0)
				// 	}
				// 	list[idx].Subjects = append(list[idx].Subjects,
				// 		&domain.Subject{
				// 			ID:   datas.Entries[i].CateInfos[j].NodeID,
				// 			Name: datas.Entries[i].CateInfos[j].NodeName,
				// 			Path: datas.Entries[i].CateInfos[j].NodePath,
				// 		},
				// 	)
			}
		}

		if len(datas.Entries[i].BusinessObjects) > 0 {
			list[idx].Subjects = make([]*domain.Subject, 0, len(datas.Entries[i].BusinessObjects))
			for j := range datas.Entries[i].BusinessObjects {
				list[idx].Subjects = append(list[idx].Subjects,
					&domain.Subject{
						ID:   datas.Entries[i].BusinessObjects[j].ID,
						Name: datas.Entries[i].BusinessObjects[j].Name,
						Path: datas.Entries[i].BusinessObjects[j].Path,
					},
				)
			}
		}

		resTypeMap := map[string]bool{}
		resTypes := make([]string, 0)
		for k := range datas.Entries[i].MountDataResources {
			if resTypeMap[datas.Entries[i].MountDataResources[k].DataResourcesType] {
				continue
			}
			resTypes = append(resTypes, datas.Entries[i].MountDataResources[k].DataResourcesType)
			resTypeMap[datas.Entries[i].MountDataResources[k].DataResourcesType] = true
		}
		resTypeMap = nil
		if len(resTypes) > 0 {
			list[idx].ResType = util.ValueToPtr(strings.Join(resTypes, ","))
		}
		// list[idx].OnlineStatus = datas.Entries[i].OnlineStatus == "online"
		list[idx].OnlineStatus = datas.Entries[i].IsOnline
		list[idx].PublishStatus = datas.Entries[i].IsPublish
		if datas.Entries[i].IsOnline {
			list[idx].OnlineAt = &datas.Entries[i].OnlineAt
		}
	}

	// 构造返回列表（保持顺序）
	filteredList = list

	// 应用层按online_at排序（若需要）
	if req != nil && req.Sort == "online_at" && len(filteredList) > 0 {
		if req.Direction == "asc" {
			sort.Slice(filteredList, func(i, j int) bool {
				vi, vj := int64(0), int64(0)
				if filteredList[i].OnlineAt != nil {
					vi = *filteredList[i].OnlineAt
				}
				if filteredList[j].OnlineAt != nil {
					vj = *filteredList[j].OnlineAt
				}
				return vi < vj
			})
		} else {
			sort.Slice(filteredList, func(i, j int) bool {
				vi, vj := int64(0), int64(0)
				if filteredList[i].OnlineAt != nil {
					vi = *filteredList[i].OnlineAt
				}
				if filteredList[j].OnlineAt != nil {
					vj = *filteredList[j].OnlineAt
				}
				return vi > vj
			})
		}
	}

	return filteredList, nil
}

func (uc *useCase) infoCatalogListProc(ctx context.Context,
	list []*domain.ListItem, cids []string, cid2idx map[string]int, req *domain.ListReq) (filteredList []*domain.ListItem, err error) {
	var (
		datas    *info_resource_catalog.EsSearchResult
		idx      int
		onlineAt int64
	)
	if datas, err = uc.basicSearchDriven.SearchInfoCatalog(ctx,
		&info_resource_catalog.EsSearchParam{
			Size: len(cids),
			IDs:  cids,
		},
	); err != nil {
		log.WithContext(ctx).Errorf("uc.basicSearchDriven.SearchInfoCatalog failed: %v", err)
		return nil, err
	}
	for i := range datas.Entries {
		idx = cid2idx[datas.Entries[i].ID]
		for j := range datas.Entries[i].CateInfo {
			switch datas.Entries[i].CateInfo[j].CateID {
			case common.CATEGORY_TYPE_ORGANIZATION:
				list[idx].OrgCode = datas.Entries[i].CateInfo[j].NodeID
				list[idx].OrgName = datas.Entries[i].CateInfo[j].NodeName
				list[idx].OrgPath = datas.Entries[i].CateInfo[j].NodePath
			case common.CATEGORY_TYPE_SUBJECT_DOMAIN:
				if len(list[idx].Subjects) == 0 {
					list[idx].Subjects = make([]*domain.Subject, 0)
				}
				list[idx].Subjects = append(list[idx].Subjects,
					&domain.Subject{
						ID:   datas.Entries[i].CateInfo[j].NodeID,
						Name: datas.Entries[i].CateInfo[j].NodeName,
						Path: datas.Entries[i].CateInfo[j].NodePath,
					},
				)
			}
		}

		list[idx].OnlineStatus = datas.Entries[i].OnlineStatus == "online"
		if datas.Entries[i].OnlineStatus == constant.LineStatusOnLine ||
			datas.Entries[i].OnlineStatus == constant.LineStatusDownAuditing ||
			datas.Entries[i].OnlineStatus == constant.LineStatusDownReject {
			onlineAt = int64(datas.Entries[i].OnlineAt)
			list[idx].OnlineAt = &onlineAt
		}
	}

	// 构造返回列表（保持顺序）
	filteredList = list

	// 应用层按online_at排序（若需要）
	if req != nil && req.Sort == "online_at" && len(filteredList) > 0 {
		if req.Direction == "asc" {
			sort.Slice(filteredList, func(i, j int) bool {
				vi, vj := int64(0), int64(0)
				if filteredList[i].OnlineAt != nil {
					vi = *filteredList[i].OnlineAt
				}
				if filteredList[j].OnlineAt != nil {
					vj = *filteredList[j].OnlineAt
				}
				return vi < vj
			})
		} else {
			sort.Slice(filteredList, func(i, j int) bool {
				vi, vj := int64(0), int64(0)
				if filteredList[i].OnlineAt != nil {
					vi = *filteredList[i].OnlineAt
				}
				if filteredList[j].OnlineAt != nil {
					vj = *filteredList[j].OnlineAt
				}
				return vi > vj
			})
		}
	}

	return filteredList, nil
}

func (uc *useCase) elecCatalogListProc(ctx context.Context,
	list []*domain.ListItem, cids []string, cid2idx map[string]int, req *domain.ListReq) (filteredList []*domain.ListItem, err error) {
	var (
		datas *basic_search.SearchElecLicenceResponse
		idx   int
	)
	if datas, err = uc.basicSearchDriven.SearchElecLicence(ctx,
		&basic_search.SearchElecLicenceRequest{
			Size: len(cids),
			CommonSearchParam: basic_search.CommonSearchParam{
				IDs: cids,
			},
		},
	); err != nil {
		log.WithContext(ctx).Errorf("uc.basicSearchDriven.SearchElecLicence failed: %v", err)
		return nil, err
	}

	for i := range datas.Entries {
		idx = cid2idx[datas.Entries[i].ID]
		list[idx].ResType = &datas.Entries[i].LicenseType
		list[idx].OrgName = datas.Entries[i].Department
		list[idx].OnlineStatus = datas.Entries[i].OnlineStatus == "online"
		if datas.Entries[i].IsOnline {
			list[idx].OnlineAt = &datas.Entries[i].OnlineAt
		}
	}

	// 构造返回列表（保持顺序）
	filteredList = list

	// 应用层按online_at排序（若需要）
	if req != nil && req.Sort == "online_at" && len(filteredList) > 0 {
		if req.Direction == "asc" {
			sort.Slice(filteredList, func(i, j int) bool {
				vi, vj := int64(0), int64(0)
				if filteredList[i].OnlineAt != nil {
					vi = *filteredList[i].OnlineAt
				}
				if filteredList[j].OnlineAt != nil {
					vj = *filteredList[j].OnlineAt
				}
				return vi < vj
			})
		} else {
			sort.Slice(filteredList, func(i, j int) bool {
				vi, vj := int64(0), int64(0)
				if filteredList[i].OnlineAt != nil {
					vi = *filteredList[i].OnlineAt
				}
				if filteredList[j].OnlineAt != nil {
					vj = *filteredList[j].OnlineAt
				}
				return vi > vj
			})
		}
	}

	return filteredList, nil
}

func (uc *useCase) CheckIsFavoredV1(ctx context.Context, req *domain.CheckV1Req) (resp *domain.CheckV1Resp, err error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()

	var datas []*my_favorite.FavorIDBase
	resp = &domain.CheckV1Resp{IsFavored: false}
	// 添加空指针检查
	if uc.fRepo == nil {
		log.WithContext(ctx).Errorf("uc.fRepo is nil")
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, fmt.Errorf("repository not initialized"))
	}

	if datas, err = uc.fRepo.FilterFavoredRIDSV1(nil, ctx, req.CreatedBy, []string{req.ResID}, domain.ResType2Enum(req.ResType)); err != nil {
		log.WithContext(ctx).
			Errorf("uc.fRepo.FilterFavoredRIDSV1 failed: %v", err)
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	log.Infof("--------------enter CheckIsFavoredV1---------datas------------------is: %v, len: %d", datas, len(datas))

	if len(datas) > 0 {
		for _, data := range datas {
			if data != nil {
				resp.IsFavored = true
				resp.FavorID = data.ID
				break // 只取第一个非空元素
			}
		}
	}
	return
}

func (uc *useCase) CheckIsFavoredV2(ctx context.Context, req *domain.CheckV2Req) (resp []*domain.CheckV2Resp, err error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()

	var (
		datas         []*my_favorite.FavorIDBase
		resType       my_favorite.ResType
		rtIdx, ridIdx int
	)
	uInfo := request.GetUserInfo(ctx)
	rt2idxMap := make(map[my_favorite.ResType]int, len(req.Resources))
	idxMap := make(map[my_favorite.ResType]map[string]int, len(req.Resources))
	params := make([]*my_favorite.FilterFavoredRIDSParams, 0, len(req.Resources))
	resp = make([]*domain.CheckV2Resp, 0, len(req.Resources))
	for i := range req.Resources {
		resp = append(resp,
			&domain.CheckV2Resp{
				ResType:   req.Resources[i].ResType,
				Resources: make([]*domain.ResFavorCheckRet, 0, len(req.Resources[i].ResIDs)),
			},
		)
		resType = domain.ResType2Enum(req.Resources[i].ResType)
		rt2idxMap[resType] = i
		idxMap[resType] = make(map[string]int, len(req.Resources[i].ResIDs))
		for j := range req.Resources[i].ResIDs {
			idxMap[resType][req.Resources[i].ResIDs[j]] = j
			resp[i].Resources = append(resp[i].Resources,
				&domain.ResFavorCheckRet{
					ResID: req.Resources[i].ResIDs[j],
				},
			)
		}
		params = append(params,
			&my_favorite.FilterFavoredRIDSParams{
				ResType: resType,
				ResIDs:  req.Resources[i].ResIDs,
			},
		)
	}
	if datas, err = uc.fRepo.FilterFavoredRIDSV2(nil, ctx, uInfo.ID, params); err != nil {
		log.WithContext(ctx).
			Errorf("uc.fRepo.FilterFavoredRIDSV2 failed: %v", err)
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	for i := range datas {
		rtIdx = rt2idxMap[datas[i].ResType]
		ridIdx = idxMap[datas[i].ResType][datas[i].ResID]
		resp[rtIdx].Resources[ridIdx].IsFavored = true
		resp[rtIdx].Resources[ridIdx].FavorID = datas[i].ID
	}
	return
}

func (uc *useCase) dataViewListProc(ctx context.Context,
	list []*domain.ListItem, cids []string, cid2idx map[string]int, req *domain.ListReq) (filteredList []*domain.ListItem, err error) {
	var (
		datas *basic_search.SearchDataResourceResponse
	)
	log.WithContext(ctx).Infof("department_id过滤参数: req.DepartmentId=%s", req.DepartmentId)

	// 构建搜索请求
	searchReq := &basic_search.SearchDataResourceRequest{
		Size: len(cids),
		IDs:  cids,
		Type: []string{constant.DataView},
	}

	// 不依赖SearchDataResource的排序，在应用层处理
	// if req.Sort == "online_at" {
	// 	searchReq.Orders = []basic_search.Order{{Sort: req.Sort, Direction: req.Direction}}
	// }

	if datas, err = uc.basicSearchDriven.SearchDataResource(ctx, searchReq); err != nil {
		log.WithContext(ctx).Errorf("uc.basicSearchDriven.SearchDataResource failed: %v", err)
		return nil, err
	}

	log.WithContext(ctx).Infof("从SearchDataResource获取到数据条数: %d", len(datas.Entries))

	// 添加调试日志，验证SearchDataResource返回的online_at数据
	if req.Sort == "online_at" {
		log.WithContext(ctx).Infof("按online_at排序，方向: %s", req.Direction)
		for i, entry := range datas.Entries {
			log.WithContext(ctx).Infof("SearchDataResource返回数据[%d]: ID=%s, online_at=%d", i, entry.ID, entry.OnlineAt)
		}
	}

	// 添加调试日志，验证SearchDataResource返回的online_at数据
	log.WithContext(ctx).Infof("SearchDataResource返回的所有数据:")
	for i, entry := range datas.Entries {
		log.WithContext(ctx).Infof("  [%d] ID=%s, Name=%s, online_at=%d", i, entry.ID, entry.Name, entry.OnlineAt)
	}

	// 创建过滤后的结果列表
	filteredList = make([]*domain.ListItem, 0)

	// 统计过滤信息
	matchedCount := 0
	skippedCount := 0

	// 关键修改：按照原始SQL查询的顺序处理，保持原始排序
	for _, originalItem := range list {
		// 从SearchDataResource结果中查找对应的数据
		var data *basic_search.SearchDataResourceResponseEntry
		for _, entry := range datas.Entries {
			if entry.ID == originalItem.ResID {
				data = &entry
				break
			}
		}

		if data == nil {
			log.WithContext(ctx).Warnf("未找到对应的SearchDataResource数据: ResID=%s", originalItem.ResID)
			continue
		}

		// 添加详细的调试日志
		log.WithContext(ctx).Infof("处理资源: ID=%s, DepartmentId=%s, OrgCode=%s, OrgName=%s",
			data.ID, data.DepartmentId, data.OrgCode, data.OrgName)

		// 从cate_info中提取部门信息用于过滤
		dataDepartmentId := data.DepartmentId
		if dataDepartmentId == "" {
			// 尝试从cate_info中获取部门信息
			for _, cateInfo := range data.CateInfos {
				if cateInfo.CateID == common.CATEGORY_TYPE_ORGANIZATION {
					dataDepartmentId = cateInfo.NodeID
					log.WithContext(ctx).Infof("从cate_info中获取部门信息: 资源ID=%s, DepartmentId=%s",
						data.ID, dataDepartmentId)
					break
				}
			}
		}

		// 如果仍然为空，使用OrgCode作为备选
		if dataDepartmentId == "" {
			dataDepartmentId = data.OrgCode
			log.WithContext(ctx).Infof("DepartmentId为空，使用OrgCode作为备选: 资源ID=%s, OrgCode=%s", data.ID, data.OrgCode)
		}

		// department_id过滤逻辑：如果请求中指定了department_id，则只返回匹配的数据
		if req.DepartmentId != "" && req.DepartmentId != dataDepartmentId {
			log.WithContext(ctx).Infof("跳过不匹配的department_id: 请求=%s, 数据=%s, 资源ID=%s", req.DepartmentId, dataDepartmentId, data.ID)
			skippedCount++
			continue // 跳过不匹配的数据，而不是直接返回
		}

		// 复制原始数据 - 修复：创建新的ListItem而不是使用指针引用
		item := &domain.ListItem{
			FavorBase:     originalItem.FavorBase,
			CreatedAt:     originalItem.CreatedAt,
			OrgCode:       originalItem.OrgCode,
			OrgName:       originalItem.OrgName,
			OrgPath:       originalItem.OrgPath,
			Subjects:      originalItem.Subjects,
			ResType:       originalItem.ResType,
			OnlineStatus:  originalItem.OnlineStatus,
			OnlineAt:      originalItem.OnlineAt,
			PublishStatus: originalItem.PublishStatus,
			PublishedAt:   originalItem.PublishedAt,
			//IndicatorType: originalItem.IndicatorType,
		}

		// 更新online_at相关信息
		item.OnlineStatus = data.IsOnline
		if data.OnlineAt > 0 {
			item.OnlineAt = &data.OnlineAt
		}

		// 设置部门信息
		item.OrgCode = data.DepartmentId
		item.OrgName = data.DepartmentName
		item.OrgPath = data.DepartmentPath

		// 处理分类信息
		for j := range data.CateInfos {
			switch data.CateInfos[j].CateID {
			case common.CATEGORY_TYPE_ORGANIZATION:
				item.OrgCode = data.CateInfos[j].NodeID
				item.OrgName = data.CateInfos[j].NodeName
				item.OrgPath = data.CateInfos[j].NodePath
			case common.CATEGORY_TYPE_SUBJECT_DOMAIN:
				if len(item.Subjects) == 0 {
					item.Subjects = make([]*domain.Subject, 0)
				}
				item.Subjects = append(item.Subjects,
					&domain.Subject{
						ID:   data.CateInfos[j].NodeID,
						Name: data.CateInfos[j].NodeName,
						Path: data.CateInfos[j].NodePath,
					},
				)
			}
		}

		// 添加到过滤后的列表
		filteredList = append(filteredList, item)
		matchedCount++
	}

	log.WithContext(ctx).Infof("dataViewListProc过滤结果: 原始数量=%d, 匹配数量=%d, 跳过数量=%d, 过滤后数量=%d",
		len(list), matchedCount, skippedCount, len(filteredList))

	// 如果没有匹配的数据，记录警告日志
	if req.DepartmentId != "" && len(filteredList) == 0 {
		log.WithContext(ctx).Warnf("未找到匹配department_id=%s的数据，返回空结果", req.DepartmentId)
	}

	// 在应用层进行online_at排序
	if req.Sort == "online_at" && len(filteredList) > 0 {
		log.WithContext(ctx).Infof("在应用层进行online_at排序，方向: %s", req.Direction)

		// 打印排序前的数据
		log.WithContext(ctx).Infof("排序前的数据:")
		for i, item := range filteredList {
			onlineAt := int64(0)
			if item.OnlineAt != nil {
				onlineAt = *item.OnlineAt
			}
			log.WithContext(ctx).Infof("  排序前[%d]: ID=%s, Name=%s, online_at=%d", i, item.ResID, item.ResName, onlineAt)
		}

		// 按online_at排序
		if req.Direction == "asc" {
			// 升序排序
			sort.Slice(filteredList, func(i, j int) bool {
				onlineAtI := int64(0)
				onlineAtJ := int64(0)
				if filteredList[i].OnlineAt != nil {
					onlineAtI = *filteredList[i].OnlineAt
				}
				if filteredList[j].OnlineAt != nil {
					onlineAtJ = *filteredList[j].OnlineAt
				}
				log.WithContext(ctx).Infof("比较: %s(%d) vs %s(%d)", filteredList[i].ResName, onlineAtI, filteredList[j].ResName, onlineAtJ)
				return onlineAtI < onlineAtJ
			})
		} else {
			// 降序排序
			sort.Slice(filteredList, func(i, j int) bool {
				onlineAtI := int64(0)
				onlineAtJ := int64(0)
				if filteredList[i].OnlineAt != nil {
					onlineAtI = *filteredList[i].OnlineAt
				}
				if filteredList[j].OnlineAt != nil {
					onlineAtJ = *filteredList[j].OnlineAt
				}
				log.WithContext(ctx).Infof("比较: %s(%d) vs %s(%d)", filteredList[i].ResName, onlineAtI, filteredList[j].ResName, onlineAtJ)
				return onlineAtI > onlineAtJ
			})
		}

		// 打印排序后的结果
		log.WithContext(ctx).Infof("排序后的数据:")
		for i, item := range filteredList {
			onlineAt := int64(0)
			if item.OnlineAt != nil {
				onlineAt = *item.OnlineAt
			}
			log.WithContext(ctx).Infof("  排序后[%d]: ID=%s, Name=%s, online_at=%d", i, item.ResID, item.ResName, onlineAt)
		}
	}

	return filteredList, nil
}

func (uc *useCase) interfaceSVCListProc(ctx context.Context,
	list []*domain.ListItem, cids []string, cid2idx map[string]int, req *domain.ListReq) (filteredList []*domain.ListItem, err error) {
	var (
		datas *basic_search.SearchDataResourceResponse
	)
	log.WithContext(ctx).Infof("department_id过滤参数: req.DepartmentId=%s", req.DepartmentId)

	// 构建搜索请求
	searchReq := &basic_search.SearchDataResourceRequest{
		Size: len(cids),
		IDs:  cids,
		Type: []string{constant.InterfaceSvc},
	}

	// 不依赖SearchDataResource的排序，在应用层处理
	// if req.Sort == "online_at" {
	// 	searchReq.Orders = []basic_search.Order{{Sort: req.Sort, Direction: req.Direction}}
	// }

	if datas, err = uc.basicSearchDriven.SearchDataResource(ctx, searchReq); err != nil {
		log.WithContext(ctx).Errorf("uc.basicSearchDriven.SearchDataResource failed: %v", err)
		return nil, err
	}
	log.WithContext(ctx).Infof("从SearchDataResource获取到数据条数: %d", len(datas.Entries))

	// 添加调试日志，验证SearchDataResource返回的online_at数据
	if req.Sort == "online_at" {
		log.WithContext(ctx).Infof("按online_at排序，方向: %s", req.Direction)
		for i, entry := range datas.Entries {
			log.WithContext(ctx).Infof("SearchDataResource返回数据[%d]: ID=%s, online_at=%d", i, entry.ID, entry.OnlineAt)
		}
	}

	// 创建ID到原始数据的映射
	idToOriginalItem := make(map[string]*domain.ListItem)
	for _, item := range list {
		idToOriginalItem[item.ResID] = item
	}

	// 创建过滤后的结果列表
	filteredList = make([]*domain.ListItem, 0)

	// 统计过滤信息
	matchedCount := 0
	skippedCount := 0

	// 关键修改：按照原始SQL查询的顺序处理，保持原始排序
	for _, originalItem := range list {
		// 从SearchDataResource结果中查找对应的数据
		var data *basic_search.SearchDataResourceResponseEntry
		for _, entry := range datas.Entries {
			if entry.ID == originalItem.ResID {
				data = &entry
				break
			}
		}

		if data == nil {
			log.WithContext(ctx).Warnf("未找到对应的SearchDataResource数据: ResID=%s", originalItem.ResID)
			continue
		}

		// 添加详细的调试日志
		log.WithContext(ctx).Infof("处理资源: ID=%s, DepartmentId=%s, OrgCode=%s, OrgName=%s",
			data.ID, data.DepartmentId, data.OrgCode, data.OrgName)

		// 从cate_info中提取部门信息用于过滤
		dataDepartmentId := data.DepartmentId
		if dataDepartmentId == "" {
			// 尝试从cate_info中获取部门信息
			for _, cateInfo := range data.CateInfos {
				if cateInfo.CateID == common.CATEGORY_TYPE_ORGANIZATION {
					dataDepartmentId = cateInfo.NodeID
					log.WithContext(ctx).Infof("从cate_info中获取部门信息: 资源ID=%s, DepartmentId=%s",
						data.ID, dataDepartmentId)
					break
				}
			}
		}

		// 如果仍然为空，使用OrgCode作为备选
		if dataDepartmentId == "" {
			dataDepartmentId = data.OrgCode
			log.WithContext(ctx).Infof("DepartmentId为空，使用OrgCode作为备选: 资源ID=%s, OrgCode=%s", data.ID, data.OrgCode)
		}

		// department_id过滤逻辑：如果请求中指定了department_id，则只返回匹配的数据
		if req.DepartmentId != "" && req.DepartmentId != dataDepartmentId {
			log.WithContext(ctx).Infof("跳过不匹配的department_id: 请求=%s, 数据=%s, 资源ID=%s", req.DepartmentId, dataDepartmentId, data.ID)
			skippedCount++
			continue // 跳过不匹配的数据，而不是直接返回
		}

		// 复制原始数据 - 修复：创建新的ListItem而不是使用指针引用
		item := &domain.ListItem{
			FavorBase:     originalItem.FavorBase,
			CreatedAt:     originalItem.CreatedAt,
			OrgCode:       originalItem.OrgCode,
			OrgName:       originalItem.OrgName,
			OrgPath:       originalItem.OrgPath,
			Subjects:      originalItem.Subjects,
			ResType:       originalItem.ResType,
			OnlineStatus:  originalItem.OnlineStatus,
			OnlineAt:      originalItem.OnlineAt,
			PublishStatus: originalItem.PublishStatus,
			PublishedAt:   originalItem.PublishedAt,
			//IndicatorType: originalItem.IndicatorType,
		}

		// 更新online_at相关信息
		item.OnlineStatus = data.IsOnline
		if data.OnlineAt > 0 {
			item.OnlineAt = &data.OnlineAt
		}

		// 设置部门信息
		item.OrgCode = data.DepartmentId
		item.OrgName = data.DepartmentName
		item.OrgPath = data.DepartmentPath

		// 处理分类信息
		for j := range data.CateInfos {
			switch data.CateInfos[j].CateID {
			case common.CATEGORY_TYPE_ORGANIZATION:
				item.OrgCode = data.CateInfos[j].NodeID
				item.OrgName = data.CateInfos[j].NodeName
				item.OrgPath = data.CateInfos[j].NodePath
			case common.CATEGORY_TYPE_SUBJECT_DOMAIN:
				if len(item.Subjects) == 0 {
					item.Subjects = make([]*domain.Subject, 0)
				}
				item.Subjects = append(item.Subjects,
					&domain.Subject{
						ID:   data.CateInfos[j].NodeID,
						Name: data.CateInfos[j].NodeName,
						Path: data.CateInfos[j].NodePath,
					},
				)
			}
		}

		// 添加到过滤后的列表
		filteredList = append(filteredList, item)
		matchedCount++
		log.WithContext(ctx).Infof("匹配department_id: 资源ID=%s, department_id=%s", data.ID, data.DepartmentId)
	}

	log.WithContext(ctx).Infof("interfaceSVCListProc过滤结果: 原始数量=%d, 匹配数量=%d, 跳过数量=%d, 过滤后数量=%d",
		len(list), matchedCount, skippedCount, len(filteredList))

	// 如果没有匹配的数据，记录警告日志
	if req.DepartmentId != "" && len(filteredList) == 0 {
		log.WithContext(ctx).Warnf("未找到匹配department_id=%s的数据，返回空结果", req.DepartmentId)
	}

	// 在应用层进行online_at排序
	if req.Sort == "online_at" && len(filteredList) > 0 {
		log.WithContext(ctx).Infof("在应用层进行online_at排序，方向: %s", req.Direction)

		// 打印排序前的数据
		log.WithContext(ctx).Infof("排序前的数据:")
		for i, item := range filteredList {
			onlineAt := int64(0)
			if item.OnlineAt != nil {
				onlineAt = *item.OnlineAt
			}
			log.WithContext(ctx).Infof("  排序前[%d]: ID=%s, Name=%s, online_at=%d", i, item.ResID, item.ResName, onlineAt)
		}

		// 按online_at排序
		if req.Direction == "asc" {
			// 升序排序
			sort.Slice(filteredList, func(i, j int) bool {
				onlineAtI := int64(0)
				onlineAtJ := int64(0)
				if filteredList[i].OnlineAt != nil {
					onlineAtI = *filteredList[i].OnlineAt
				}
				if filteredList[j].OnlineAt != nil {
					onlineAtJ = *filteredList[j].OnlineAt
				}
				log.WithContext(ctx).Infof("比较: %s(%d) vs %s(%d)", filteredList[i].ResName, onlineAtI, filteredList[j].ResName, onlineAtJ)
				return onlineAtI < onlineAtJ
			})
		} else {
			// 降序排序
			sort.Slice(filteredList, func(i, j int) bool {
				onlineAtI := int64(0)
				onlineAtJ := int64(0)
				if filteredList[i].OnlineAt != nil {
					onlineAtI = *filteredList[i].OnlineAt
				}
				if filteredList[j].OnlineAt != nil {
					onlineAtJ = *filteredList[j].OnlineAt
				}
				log.WithContext(ctx).Infof("比较: %s(%d) vs %s(%d)", filteredList[i].ResName, onlineAtI, filteredList[j].ResName, onlineAtJ)
				return onlineAtI > onlineAtJ
			})
		}

		// 打印排序后的结果
		log.WithContext(ctx).Infof("排序后的数据:")
		for i, item := range filteredList {
			onlineAt := int64(0)
			if item.OnlineAt != nil {
				onlineAt = *item.OnlineAt
			}
			log.WithContext(ctx).Infof("  排序后[%d]: ID=%s, Name=%s, online_at=%d", i, item.ResID, item.ResName, onlineAt)
		}
	}

	return filteredList, nil
}

func (uc *useCase) indicatorListProc(ctx context.Context,
	list []*domain.ListItem, cids []string, cid2idx map[string]int, req *domain.ListReq) (filteredList []*domain.ListItem, err error) {
	var (
		datas *basic_search.SearchDataResourceResponse
	)
	log.WithContext(ctx).Infof("department_id过滤参数: req.DepartmentId=%s", req.DepartmentId)

	// 构建搜索请求
	searchReq := &basic_search.SearchDataResourceRequest{
		Size: len(cids),
		IDs:  cids,
		Type: []string{constant.Indicator},
	}

	// 不依赖SearchDataResource的排序，在应用层处理
	// if req.Sort == "online_at" {
	// 	searchReq.Orders = []basic_search.Order{{Sort: req.Sort, Direction: req.Direction}}
	// }

	if datas, err = uc.basicSearchDriven.SearchDataResource(ctx, searchReq); err != nil {
		log.WithContext(ctx).Errorf("uc.basicSearchDriven.SearchDataResource failed: %v", err)
		return nil, err
	}

	log.WithContext(ctx).Infof("从SearchDataResource获取到数据条数: %d", len(datas.Entries))

	// 添加调试日志，验证SearchDataResource返回的online_at数据
	if req.Sort == "online_at" {
		log.WithContext(ctx).Infof("按online_at排序，方向: %s", req.Direction)
		for i, entry := range datas.Entries {
			log.WithContext(ctx).Infof("SearchDataResource返回数据[%d]: ID=%s, online_at=%d", i, entry.ID, entry.OnlineAt)
		}
	}

	// 创建ID到原始数据的映射
	idToOriginalItem := make(map[string]*domain.ListItem)
	for _, item := range list {
		idToOriginalItem[item.ResID] = item
	}

	// 创建过滤后的结果列表
	filteredList = make([]*domain.ListItem, 0)

	// 统计过滤信息
	matchedCount := 0
	skippedCount := 0

	// 关键修改：按照原始SQL查询的顺序处理，保持原始排序
	for _, originalItem := range list {
		// 从SearchDataResource结果中查找对应的数据
		var data *basic_search.SearchDataResourceResponseEntry
		for _, entry := range datas.Entries {
			if entry.ID == originalItem.ResID {
				data = &entry
				break
			}
		}

		if data == nil {
			log.WithContext(ctx).Warnf("未找到对应的SearchDataResource数据: ResID=%s", originalItem.ResID)
			continue
		}

		// 添加详细的调试日志
		log.WithContext(ctx).Infof("处理资源: ID=%s, DepartmentId=%s, OrgCode=%s, OrgName=%s",
			data.ID, data.DepartmentId, data.OrgCode, data.OrgName)

		// 从cate_info中提取部门信息用于过滤
		dataDepartmentId := data.DepartmentId
		if dataDepartmentId == "" {
			// 尝试从cate_info中获取部门信息
			for _, cateInfo := range data.CateInfos {
				if cateInfo.CateID == common.CATEGORY_TYPE_ORGANIZATION {
					dataDepartmentId = cateInfo.NodeID
					log.WithContext(ctx).Infof("从cate_info中获取部门信息: 资源ID=%s, DepartmentId=%s",
						data.ID, dataDepartmentId)
					break
				}
			}
		}

		// 如果仍然为空，使用OrgCode作为备选
		if dataDepartmentId == "" {
			dataDepartmentId = data.OrgCode
			log.WithContext(ctx).Infof("DepartmentId为空，使用OrgCode作为备选: 资源ID=%s, OrgCode=%s", data.ID, data.OrgCode)
		}

		// department_id过滤逻辑：如果请求中指定了department_id，则只返回匹配的数据
		if req.DepartmentId != "" && req.DepartmentId != dataDepartmentId {
			log.WithContext(ctx).Infof("跳过不匹配的department_id: 请求=%s, 数据=%s, 资源ID=%s", req.DepartmentId, dataDepartmentId, data.ID)
			skippedCount++
			continue // 跳过不匹配的数据，而不是直接返回
		}

		// 复制原始数据 - 修复：创建新的ListItem而不是使用指针引用
		item := &domain.ListItem{
			FavorBase:     originalItem.FavorBase,
			CreatedAt:     originalItem.CreatedAt,
			OrgCode:       originalItem.OrgCode,
			OrgName:       originalItem.OrgName,
			OrgPath:       originalItem.OrgPath,
			Subjects:      originalItem.Subjects,
			ResType:       originalItem.ResType,
			OnlineStatus:  originalItem.OnlineStatus,
			OnlineAt:      originalItem.OnlineAt,
			PublishStatus: originalItem.PublishStatus,
			PublishedAt:   originalItem.PublishedAt,
			//IndicatorType: originalItem.IndicatorType,
		}

		// 更新online_at相关信息
		item.OnlineStatus = data.IsOnline
		if data.OnlineAt > 0 {
			item.OnlineAt = &data.OnlineAt
		}
		item.PublishStatus = data.IsPublish
		if data.PublishedAt > 0 {
			item.PublishedAt = data.PublishedAt
		}

		// 设置部门信息
		item.OrgCode = data.DepartmentId
		item.OrgName = data.DepartmentName
		item.OrgPath = data.DepartmentPath

		// 处理分类信息
		for j := range data.CateInfos {
			switch data.CateInfos[j].CateID {
			case common.CATEGORY_TYPE_ORGANIZATION:
				item.OrgCode = data.CateInfos[j].NodeID
				item.OrgName = data.CateInfos[j].NodeName
				item.OrgPath = data.CateInfos[j].NodePath
			case common.CATEGORY_TYPE_SUBJECT_DOMAIN:
				if len(item.Subjects) == 0 {
					item.Subjects = make([]*domain.Subject, 0)
				}
				item.Subjects = append(item.Subjects,
					&domain.Subject{
						ID:   data.CateInfos[j].NodeID,
						Name: data.CateInfos[j].NodeName,
						Path: data.CateInfos[j].NodePath,
					},
				)
			}
		}

		// 添加到过滤后的列表
		filteredList = append(filteredList, item)
		matchedCount++
	}

	log.WithContext(ctx).Infof("indicatorListProc过滤结果: 原始数量=%d, 匹配数量=%d, 跳过数量=%d, 过滤后数量=%d",
		len(list), matchedCount, skippedCount, len(filteredList))

	// 如果没有匹配的数据，记录警告日志
	if req.DepartmentId != "" && len(filteredList) == 0 {
		log.WithContext(ctx).Warnf("未找到匹配department_id=%s的数据，返回空结果", req.DepartmentId)
	}

	// 在应用层进行online_at排序
	if req.Sort == "online_at" && len(filteredList) > 0 {
		log.WithContext(ctx).Infof("在应用层进行online_at排序，方向: %s", req.Direction)

		// 打印排序前的数据
		log.WithContext(ctx).Infof("排序前的数据:")
		for i, item := range filteredList {
			onlineAt := int64(0)
			if item.OnlineAt != nil {
				onlineAt = *item.OnlineAt
			}
			log.WithContext(ctx).Infof("  排序前[%d]: ID=%s, Name=%s, online_at=%d", i, item.ResID, item.ResName, onlineAt)
		}

		// 按online_at排序
		if req.Direction == "asc" {
			// 升序排序
			sort.Slice(filteredList, func(i, j int) bool {
				onlineAtI := int64(0)
				onlineAtJ := int64(0)
				if filteredList[i].OnlineAt != nil {
					onlineAtI = *filteredList[i].OnlineAt
				}
				if filteredList[j].OnlineAt != nil {
					onlineAtJ = *filteredList[j].OnlineAt
				}
				log.WithContext(ctx).Infof("比较: %s(%d) vs %s(%d)", filteredList[i].ResName, onlineAtI, filteredList[j].ResName, onlineAtJ)
				return onlineAtI < onlineAtJ
			})
		} else {
			// 降序排序
			sort.Slice(filteredList, func(i, j int) bool {
				onlineAtI := int64(0)
				onlineAtJ := int64(0)
				if filteredList[i].OnlineAt != nil {
					onlineAtI = *filteredList[i].OnlineAt
				}
				if filteredList[j].OnlineAt != nil {
					onlineAtJ = *filteredList[j].OnlineAt
				}
				log.WithContext(ctx).Infof("比较: %s(%d) vs %s(%d)", filteredList[i].ResName, onlineAtI, filteredList[j].ResName, onlineAtJ)
				return onlineAtI > onlineAtJ
			})
		}

		// 打印排序后的结果
		log.WithContext(ctx).Infof("排序后的数据:")
		for i, item := range filteredList {
			onlineAt := int64(0)
			if item.OnlineAt != nil {
				onlineAt = *item.OnlineAt
			}
			log.WithContext(ctx).Infof("  排序后[%d]: ID=%s, Name=%s, online_at=%d", i, item.ResID, item.ResName, onlineAt)
		}
	}

	return filteredList, nil
}
