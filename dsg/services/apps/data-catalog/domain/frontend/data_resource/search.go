package data_resource

import (
	"context"
	"strings"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/my_favorite"

	"go.uber.org/zap"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/auth_service"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/basic_search"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/configuration_center"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/data_view"
	indicator_management "github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/indicator-management"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/request"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/util/sets"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/common"
	"github.com/kweaver-ai/idrm-go-common/interception"
	"github.com/kweaver-ai/idrm-go-common/middleware"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
)

// Search implements DataResourceDomain.
func (d *dataResourceDomain) Search(ctx context.Context, keyword string, filter Filter, nextFlag NextFlag) (*SearchResult, error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer span.End()

	// 如果在用户有权限的数据资源中搜索，则更新 filter.IDs 为用户有权限的资源。
	if filter.HasPermission {
		var err error
		// 获取当前用户有权限的数据资源的 ID 列表
		if filter.IDs, err = d.dataResourceHasPermissionIDs(ctx, filter); err != nil {
			return nil, err
		}
		// 如果不存在用户有权限的资源，直接返回空列表
		if len(filter.IDs) == 0 {
			return &SearchResult{}, nil
		}
	}

	// 获取主题域及其子主题域的 ID 列表
	domainIDs, err := d.getSubjectDomainIDs(ctx, filter.SubjectDomainID)
	if err != nil {
		return nil, err
	}

	// 获取部门及其子部门的 ID 列表
	departmentIDs, err := d.getDepartmentIDs(ctx, filter.DepartmentID)
	if err != nil {
		return nil, err
	}

	// 生成 basic-search 搜索数据资源的请求
	req := newSearchDataResponseRequest(ctx, keyword, filter, domainIDs, departmentIDs, nextFlag)

	// 在 basic-search 搜索数据资源
	resp, err := d.bsRepo.SearchDataResource(ctx, req)
	if err != nil {
		return nil, err
	}

	// 根据 basic-search 的响应生成搜索结果
	result := newSearchResult(ctx, request.GetUserInfo(ctx), resp, d.myFavoriteRepo)
	// 向 auth-service 验证用户是否拥有搜索结果中数据资源的权限
	d.enforceSearchResult(ctx, &result)

	// 聚合搜索结果
	if allErrs := d.aggregateSearchResult(ctx, &result); allErrs != nil {
		log.Warn("aggregate search result fail", zap.Errors("allErrs", allErrs))
	}

	return &result, nil
}

// SearchForOper implements DataResourceDomain.
func (d *dataResourceDomain) SearchForOper(ctx context.Context, keyword string, filter FilterForOper, nextFlag NextFlag) (*SearchResult, error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer span.End()

	// 获取主题域及其子主题域的 ID 列表
	domainIDs, err := d.getSubjectDomainIDs(ctx, filter.SubjectDomainID)
	if err != nil {
		return nil, err
	}

	// 获取部门及其子部门的 ID 列表
	departmentIDs, err := d.getDepartmentIDs(ctx, filter.DepartmentID)
	if err != nil {
		return nil, err
	}

	// 生成 basic-search 搜索数据资源的请求
	req := newSearchForOperDataResponseRequest(keyword, filter, domainIDs, departmentIDs, nextFlag)

	// 在 basic-search 搜索数据资源
	resp, err := d.bsRepo.SearchDataResource(ctx, req)
	if err != nil {
		return nil, err
	}

	// 根据 basic-search 的响应生成搜索结果
	result := newSearchResult(ctx, request.GetUserInfo(ctx), resp, d.myFavoriteRepo)
	// 向 auth-service 验证用户是否拥有搜索结果中数据资源的权限
	d.enforceSearchResult(ctx, &result)
	// 聚合搜索结果
	if allErrs := d.aggregateSearchResult(ctx, &result); allErrs != nil {
		log.Warn("aggregate search result fail", zap.Errors("allErrs", allErrs))
	}

	// 对指标类型的数据资源进行敏感字段过滤
	if err := d.filterSensitiveFieldsForIndicators(ctx, &result); err != nil {
		log.Warn("filter sensitive fields for indicators fail", zap.Error(err))
	}

	return &result, nil
}

// getSubjectDomainIDs 获取主题域及其子主题域的 ID 列表
func (d *dataResourceDomain) getSubjectDomainIDs(ctx context.Context, id string) ([]string, error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer span.End()

	// 未指定所属主题域 ID，返回空 slice，用于搜索属于所有主题域的数据资源
	if id == "" {
		return nil, nil
	}

	// 搜索未分类、不属于任何主题域的数据资源
	if id == UncategorizedDepartmentID {
		return []string{basic_search.UnclassifiedID}, nil
	}

	// 获取主题域及其子主题域的 ID 列表
	nodeIDs, err := common.GetAllSubNodesByID(ctx, id)
	if err != nil {
		// 获取子域失败时只搜索指定的主题域
		log.WithContext(ctx).Error("get sub domain fail", zap.Error(err), zap.String("subjectDomain", id))
		return []string{id}, nil
	}

	return nodeIDs, nil
}

// getDepartmentIDs 获取指定部门及其子部门的 ID 列表
func (d *dataResourceDomain) getDepartmentIDs(ctx context.Context, id string) ([]string, error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer span.End()

	// 未指定所属部门 ID，返回空 slice，用于搜索属于所有部门的数据资源
	if id == "" {
		return nil, nil
	}

	// 搜索未分类、不属于任何部门的数据资源
	if id == UncategorizedDepartmentID {
		return []string{basic_search.UnclassifiedID}, nil
	}

	// 获取指定部门及其子部门的 ID 列表
	resp, err := d.cfgRepo.GetSubOrgCodes(ctx, &configuration_center.GetSubOrgCodesReq{OrgCode: id})
	if err != nil {
		// 获取子部门失败时只搜索指定的部门
		log.WithContext(ctx).Error("get sub departments fail", zap.Error(err), zap.String("department", id))
		return []string{id}, nil
	}

	// 返回子部门和参数指定的部门
	return append(resp.Codes, id), nil
}

// 向 auth-service 验证用户是否拥有搜索结果中数据资源的权限
func (d *dataResourceDomain) enforceSearchResult(ctx context.Context, result *SearchResult) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer span.End()

	log := log.WithContext(ctx)

	user := request.GetUserInfo(ctx)
	if user == nil {
		log.Warn("context doesn't contain user info, skipping enforcing search result")
		return
	}

	// 组装 auth-service.Enforce 的参数
	//
	// 验证当前用户是否拥有指定资源的权限
	var policyEnforces = newPolicyEnforcesForUser(result.Entries, user.ID)

	policyEnforceEffects, err := d.asRepo.Enforce(ctx, policyEnforces)
	if err != nil {
		log.Warn("enforce policy failed, backoff deny", zap.Error(err))
		return
	}

	// 根据 auth-service.Enforce 的结果更新搜索结果的字段 HasPermission
	for i := range result.Entries {
		// 跳过已知有权限的数据资源
		if result.Entries[i].HasPermission {
			continue
		}

		// 跳过未知的数据资源类型
		b, err := dataResourceTypeObjectTypePolicyActionBindingFromDataResourceType(result.Entries[i].Type)
		if err != nil {
			continue
		}

		pe := auth_service.PolicyEnforce{
			Action:      b.policyAction,
			ObjectID:    result.Entries[i].ID,
			ObjectType:  b.objectType,
			SubjectID:   user.ID,
			SubjectType: auth_service.SubjectTypeUser,
		}
		for _, e := range policyEnforceEffects {
			if e.PolicyEnforce != pe {
				continue
			}
			result.Entries[i].HasPermission = e.Effect == auth_service.PolicyEffectAllow
		}

		// 如果数据资源是逻辑视图，且没有下载权限，还需要判断逻辑视图的子视图的权
		// 限，拥有任意子视图的下载权限则认为拥有逻辑视图的下载权限
		if result.Entries[i].Type == DataResourceTypeDataView && !result.Entries[i].HasPermission {
			result.Entries[i].HasPermission, _ = d.enforceSubViews(ctx, result.Entries[i].ID)
		}
	}
	// 根据 auth-service.Enforce 的结果更新搜索结果的字段 Actions
	updateSearchResultEntriesActionsWithPolicyEnforceEffects(result.Entries, policyEnforceEffects)
}

// 向 auth-service 验证用户是否拥逻辑视图的任意一个子视图的下载权限
func (d *dataResourceDomain) enforceSubViews(ctx context.Context, logicViewID string) (hasPermission bool, err error) {
	user := request.GetUserInfo(ctx)
	if user == nil {
		log.Warn("context doesn't contain user info, skipping enforcing logic view's sub views")
		return
	}

	// auth-service.Enforce 的鉴权参数
	var policyEnforces []auth_service.PolicyEnforce

	var subViewList *data_view.List[data_view.SubView]
	for offset, uncompleted := 1, true; uncompleted; offset++ {
		// 获取逻辑视图的子视图
		subViewList, err = d.dvRepo.ListSubView(ctx, data_view.ListSubViewOptions{LogicViewID: logicViewID, Offset: offset})
		if err != nil || subViewList.Entries == nil {
			break
		}

		for _, v := range subViewList.Entries {
			policyEnforces = append(policyEnforces, auth_service.PolicyEnforce{
				Action:      auth_service.PolicyActionDownload,
				ObjectID:    v.ID,
				ObjectType:  auth_service.ObjectTypeSubView,
				SubjectID:   user.ID,
				SubjectType: auth_service.SubjectTypeUser,
			})
		}

		// 已获取子视图的数量少于 total_count 时继续获取
		uncompleted = len(policyEnforces) < subViewList.TotalCount
	}

	// 如果逻辑视图没有子视图则不需要再鉴权
	if policyEnforces == nil {
		return
	}

	policyEnforceEffects, err := d.asRepo.Enforce(ctx, policyEnforces)
	if err != nil {
		return
	}

	for _, e := range policyEnforceEffects {
		if hasPermission = e.Effect == auth_service.PolicyEffectAllow; hasPermission {
			break
		}
	}

	return
}

// dataResourceHasPermissionIDs 返回当前用户有权限的数据资源 ID 列表。如果
// filter 指定了 ID 列表，则返回其中有权限的 ID。
func (d *dataResourceDomain) dataResourceHasPermissionIDs(ctx context.Context, filter Filter) ([]string, error) {
	// 用户指定的 auth_service.ObjectTypes
	var objectTypeSet = sets.New(ObjectTypesFromDataResourceTypes(dataResourceTypesFromFilterType(filter.Type))...)
	// 获取当前用户拥有任意权限的数据资源
	list, err := d.asRepo.GetSubjectObjects(ctx, auth_service.GetObjectsOptions{
		SubjectType: auth_service.SubjectTypeUser,
		SubjectID:   request.GetUserInfo(ctx).ID,
		ObjectTypes: sets.List(objectTypeSet),
	})
	if err != nil {
		return nil, err
	}
	// 如果用户对所有资源都没有权限，直接返回空列表
	if list.TotalCount == 0 {
		return nil, nil
	}

	// 当前用户有权限的数据资源的 ID 集合
	var dataResourceHasPermissionIDSet = sets.New[string]()
	// filter.IDs 即用户指定的数据资源 ID 集合
	var filterIDSet = sets.New(filter.IDs...)
	for _, obj := range list.Entries {
		// 忽略未指定的 Object Time
		if !objectTypeSet.Has(obj.ObjectType) {
			continue
		}
		// 如果搜索指定 ID 的数据资源，跳过未指定 ID 的数据资源
		if len(filter.IDs) != 0 && !filterIDSet.Has(obj.ObjectID) {
			continue
		}
		// 忽略不支持的 Object Time
		binding, err := dataResourceTypeObjectTypePolicyActionBindingFromObjectType(obj.ObjectType)
		if err != nil {
			continue
		}
		// 检查权限
		for _, p := range obj.Permissions {
			// 忽略不是资源对应 action 或不是 allow 的 permission
			if p.Action != binding.policyAction || p.Effect != auth_service.PolicyEffectAllow {
				continue
			}
			dataResourceHasPermissionIDSet.Insert(obj.ObjectID)
			break
		}
	}
	if dataResourceHasPermissionIDSet.Len() == 0 {
		return nil, nil
	}

	return sets.List(dataResourceHasPermissionIDSet), nil
}

// aggregateSearchResult 聚合搜索结果
func (d *dataResourceDomain) aggregateSearchResult(ctx context.Context, result *SearchResult) (allErrs []error) {
	for i := range result.Entries {
		allErrs = append(allErrs, d.aggregateSearchResultEntry(ctx, &result.Entries[i])...)
	}
	return
}

// aggregateSearchResultEntry 聚合搜索结果
func (d *dataResourceDomain) aggregateSearchResultEntry(ctx context.Context, entry *SearchResultEntry) (allErrs []error) {
	// 主题域
	allErrs = append(allErrs, d.aggregateSearchResultEntrySubjectDomain(ctx, entry)...)
	return
}

// aggregateSearchResultEntrySubjectDomain 聚合搜索结果
func (d *dataResourceDomain) aggregateSearchResultEntrySubjectDomain(ctx context.Context, entry *SearchResultEntry) (allErrs []error) {
	if entry.SubjectDomainID == "" {
		return
	}
	got, err := d.databases.AFMain().SubjectDomain().Get(ctx, entry.SubjectDomainID)
	if err != nil {
		return append(allErrs, err)
	}
	entry.SubjectDomainName = got.Name
	entry.SubjectDomainPath = got.Path
	return
}

// 搜索返回数据资源的数量
const searchDataResourceRequestSize = 20

// 生成 basic-search 搜索数据资源的请求
func newSearchDataResponseRequest(ctx context.Context, keyword string, filter Filter, domainIDs, departmentIDs []string, nextFlag NextFlag) *basic_search.SearchDataResourceRequest {
	publish := true
	online := true
	r := &basic_search.SearchDataResourceRequest{
		Size:      searchDataResourceRequestSize,
		NextFlag:  nextFlag,
		Keyword:   keyword,
		IsPublish: &publish,
		IsOnline:  &online,
		CateInfos: make([]*basic_search.CateInfoReq, 0),
	}
	if filter.CateInfoReq != nil {
		for _, v := range filter.CateInfoReq {
			r.CateInfos = append(r.CateInfos, &basic_search.CateInfoReq{CateID: v.CateID, NodeIDs: v.NodeIDs})
		}
	}

	// 搜索 Owner 是当前用户的数据资源
	if filter.DataOwner {
		if info, ok := ctx.Value(interception.InfoName).(*middleware.User); ok && info != nil {
			r.DataOwnerID = info.ID
		}
	}

	// 如果指定了数据资源的类型则配置查询参数: Time
	if filter.Type != "" {
		r.Type = []string{string(filter.Type)}
	}

	// 指定接口类型则配置查询参数：APIType
	r.APIType = string(filter.APIType)

	// 如果指定了数据资源发布时间的范围则配置查询参数: PublishedAt
	if filter.PublishedAt.Start != nil || filter.PublishedAt.End != nil {
		r.PublishedAt = &basic_search.TimeRange{StartTime: filter.PublishedAt.Start, EndTime: filter.PublishedAt.End}
	}

	// 如果指定了数据资源上线时间的范围则配置查询参数: OnlineAt
	if filter.OnlineAt.Start != nil || filter.OnlineAt.End != nil {
		r.OnlineAt = &basic_search.TimeRange{StartTime: filter.OnlineAt.Start, EndTime: filter.OnlineAt.End}
	}

	if len(domainIDs) > 0 {
		r.CateInfos = append(r.CateInfos, &basic_search.CateInfoReq{CateID: CATEGORY_TYPE_SUBJECT_DOMAIN, NodeIDs: domainIDs})
	}
	if len(departmentIDs) > 0 {
		r.CateInfos = append(r.CateInfos, &basic_search.CateInfoReq{CateID: CATEGORY_TYPE_ORGANIZATION, NodeIDs: departmentIDs})
	}

	if len(filter.IDs) > 0 {
		r.IDs = filter.IDs
		r.Size = len(filter.IDs)
	}

	if len(filter.Fields) > 0 {
		r.Fields = filter.Fields
	}

	if len(filter.Orders) > 0 {
		r.Orders = filter.Orders
	}

	return r
}

// 生成 basic-search 搜索数据资源的请求
func newSearchForOperDataResponseRequest(keyword string, filter FilterForOper, domainIDs, departmentIDs []string, nextFlag NextFlag) *basic_search.SearchDataResourceRequest {
	request := &basic_search.SearchDataResourceRequest{
		Size:            searchDataResourceRequestSize,
		NextFlag:        nextFlag,
		CateInfos:       make([]*basic_search.CateInfoReq, 0),
		Keyword:         keyword,
		IsPublish:       filter.IsPublish,
		IsOnline:        filter.IsOnline,
		PublishedStatus: make([]string, len(filter.PublishedStatus)),
		OnlineStatus:    make([]string, len(filter.OnlineStatus)),
	}
	if filter.CateInfoReq != nil {
		for _, v := range filter.CateInfoReq {
			request.CateInfos = append(request.CateInfos, &basic_search.CateInfoReq{CateID: v.CateID, NodeIDs: v.NodeIDs})
		}
	}

	// 如果指定了数据资源的类型则配置查询参数: Time
	if filter.Type != "" {
		request.Type = []string{string(filter.Type)}
	}

	// 指定接口类型则配置查询参数：APIType
	request.APIType = string(filter.APIType)

	for i := range filter.PublishedStatus {
		request.PublishedStatus[i] = string(filter.PublishedStatus[i])
	}

	for i := range filter.OnlineStatus {
		request.OnlineStatus[i] = string(filter.OnlineStatus[i])
	}

	// 如果指定了数据资源发布时间的范围则配置查询参数: PublishedAt
	if filter.PublishedAt.Start != nil || filter.PublishedAt.End != nil {
		request.PublishedAt = &basic_search.TimeRange{StartTime: filter.PublishedAt.Start, EndTime: filter.PublishedAt.End}
	}

	// 如果指定了数据资源上线时间的范围则配置查询参数: OnlineAt
	if filter.OnlineAt.Start != nil || filter.OnlineAt.End != nil {
		request.OnlineAt = &basic_search.TimeRange{StartTime: filter.OnlineAt.Start, EndTime: filter.OnlineAt.End}
	}

	if len(domainIDs) > 0 {
		request.CateInfos = append(request.CateInfos, &basic_search.CateInfoReq{CateID: CATEGORY_TYPE_SUBJECT_DOMAIN, NodeIDs: domainIDs})
	}
	if len(departmentIDs) > 0 {
		request.CateInfos = append(request.CateInfos, &basic_search.CateInfoReq{CateID: CATEGORY_TYPE_ORGANIZATION, NodeIDs: departmentIDs})
	}

	if len(filter.IDs) > 0 {
		request.IDs = filter.IDs
		request.Size = len(filter.IDs)
	}

	if len(filter.Fields) > 0 {
		request.Fields = filter.Fields
	}

	if len(filter.Orders) > 0 {
		request.Orders = filter.Orders
	}

	return request
}

// 根据 basic-search 的响应生成搜索结果
//
//	 input
//		user: 发起请求的用户信息，可能为 nil
func newSearchResult(ctx context.Context, user *middleware.User, resp *basic_search.SearchDataResourceResponse, myFavoriteRepo my_favorite.Repo) SearchResult {
	result := SearchResult{NextFlag: resp.NextFlag}

	cids := make([]string, len(resp.Entries))
	cid2idx := make(map[string]int, len(resp.Entries))
	for i := range resp.Entries {
		var ownerID string
		owners := make([]*Owner, 0)
		for _, owner := range strings.Split(resp.Entries[i].OwnerID, ",") {
			if owner != "" {
				owners = append(owners, &Owner{OwnerID: owner})
				if ownerID == "" {
					ownerID = owner
				}
			}
		}
		result.Entries = append(result.Entries, SearchResultEntry{
			Type:           DataResourceType(resp.Entries[i].Type),
			ID:             string(resp.Entries[i].ID),
			RawName:        resp.Entries[i].RawName,
			Name:           resp.Entries[i].Name,
			NameEn:         resp.Entries[i].NameEn,
			RawCode:        resp.Entries[i].RawCode,
			Code:           resp.Entries[i].Code,
			OwnerID:        ownerID,
			Owners:         owners,
			RawDescription: resp.Entries[i].RawDescription,
			Description:    resp.Entries[i].Description,
			FieldCount:     len(resp.Entries[i].Fields),
			Fields:         newFields(resp.Entries[i].Fields),
			// 如果发起请求的用户是数据资源的 Owner 则有权限
			HasPermission:   user != nil && resp.Entries[i].OwnerID == user.ID,
			PublishedAt:     resp.Entries[i].PublishedAt,
			IsPublish:       resp.Entries[i].IsPublish,
			IsOnline:        resp.Entries[i].IsOnline,
			PublishedStatus: DataResourcePublishStatus(resp.Entries[i].PublishedStatus),
			OnlineStatus:    DataResourceOnlineStatus(resp.Entries[i].OnlineStatus),
			APIType:         resp.Entries[i].APIType,
			OnlineAt:        resp.Entries[i].OnlineAt,
			IndicatorType:   resp.Entries[i].IndicatorType,
			CateInfos:       resp.Entries[i].CateInfos,
		})

		isOrgExisted := false
		isSubjectDomainExisted := false
		for j := range resp.Entries[i].CateInfos {
			switch resp.Entries[i].CateInfos[j].CateID {
			case CATEGORY_TYPE_ORGANIZATION:
				if isOrgExisted {
					break
				}
				isOrgExisted = true
				result.Entries[i].DepartmentID = resp.Entries[i].CateInfos[j].NodeID
				result.Entries[i].DepartmentName = resp.Entries[i].CateInfos[j].NodeName
				result.Entries[i].DepartmentPath = resp.Entries[i].CateInfos[j].NodePath
			case CATEGORY_TYPE_SUBJECT_DOMAIN:
				if isSubjectDomainExisted {
					break
				}
				isSubjectDomainExisted = true
				result.Entries[i].SubjectDomainID = resp.Entries[i].CateInfos[j].NodeID
				result.Entries[i].SubjectDomainName = resp.Entries[i].CateInfos[j].NodeName
				result.Entries[i].SubjectDomainPath = resp.Entries[i].CateInfos[j].NodePath
			}
			if isOrgExisted && isSubjectDomainExisted {
				break
			}
		}
		cids = append(cids, result.Entries[i].ID)
		cid2idx[result.Entries[i].ID] = i
	}

	if len(cids) > 0 {
		// 按资源类型分组，为每种类型分别查询收藏状态
		typeGroups := make(map[my_favorite.ResType][]string)
		typeGroupIndices := make(map[my_favorite.ResType][]int)

		// 按类型分组
		for i, entry := range result.Entries {
			resType := getResourceTypeByDataResourceType(entry.Type)
			typeGroups[resType] = append(typeGroups[resType], entry.ID)
			typeGroupIndices[resType] = append(typeGroupIndices[resType], i)
		}

		// 为每种类型分别查询收藏状态
		for resType, typeCids := range typeGroups {
			log.Infof("------查询收藏状态，资源类型: %v, 资源数量: %d", resType, len(typeCids))
			favoredRIDs, _ := myFavoriteRepo.FilterFavoredRIDSV1(nil, ctx, user.ID, typeCids, resType)

			// 创建该类型资源的ID到索引的映射
			typeCid2idx := make(map[string]int)
			for i, cid := range typeCids {
				typeCid2idx[cid] = typeGroupIndices[resType][i]
			}

			// 创建已收藏资源的ID集合，用于快速查找
			favoredIDSet := make(map[string]uint64)
			for _, favoredRID := range favoredRIDs {
				favoredIDSet[favoredRID.ResID] = favoredRID.ID
			}

			// 为所有资源设置收藏状态
			for _, cid := range typeCids {
				idx := typeCid2idx[cid]
				if favorID, exists := favoredIDSet[cid]; exists {
					// 已收藏
					result.Entries[idx].IsFavored = true
					result.Entries[idx].FavorID = favorID
				} else {
					// 未收藏
					result.Entries[idx].IsFavored = false
				}
			}
		}
	}

	result.TotalCount = resp.TotalCount

	return result
}

// getResourceTypeByDataResourceType 根据数据资源类型返回对应的收藏资源类型
func getResourceTypeByDataResourceType(resourceType DataResourceType) my_favorite.ResType {
	switch resourceType {
	case DataResourceTypeDataView:
		// 影视数字 (data-view)
		return my_favorite.RES_TYPE_DATA_VIEW
	case DataResourceTypeInterface:
		// interface-svc
		return my_favorite.RES_TYPE_INTERFACE_SVC
	case DataResourceTypeIndicator:
		// indicator
		return my_favorite.RES_TYPE_INDICATOR
	default:
		// 默认使用数据目录类型
		return my_favorite.RES_TYPE_DATA_CATALOG
	}
}
func newFields(fields []basic_search.Field) []Field {
	var result []Field

	for i := 0; i < len(fields); i++ {
		result = append(result, Field{
			RawTechnicalName: fields[i].RawFieldNameEN,
			TechnicalName:    fields[i].FieldNameEN,
			RawBusinessName:  fields[i].RawFieldNameZH,
			BusinessName:     fields[i].FieldNameZH,
		})
	}

	return result
}

// newPolicyEnforcesForUser 创建验证指定用户对数据资源的鉴权请求
func newPolicyEnforcesForUser(entries []SearchResultEntry, userID string) (result []auth_service.PolicyEnforce) {
	for _, e := range entries {
		for _, b := range auth_service.PolicyActionBindingsForObjectType(objectTypeForDataSourceType(e.Type)) {
			pe := auth_service.PolicyEnforce{
				Action:      b.PolicyAction,
				ObjectID:    e.ID,
				ObjectType:  b.ObjectType,
				SubjectID:   userID,
				SubjectType: auth_service.SubjectTypeUser,
			}
			result = append(result, pe)
		}
	}
	return
}

// updateSearchResultEntriesActionsWithPolicyEnforceEffects 根据鉴权结果更新搜索结果的 Actions
func updateSearchResultEntriesActionsWithPolicyEnforceEffects(entries []SearchResultEntry, effects []auth_service.PolicyEnforceEffect) {
	for i, e := range entries {
		objectType := objectTypeForDataSourceType(e.Type)
		for _, eft := range effects {
			if eft.ObjectType != objectType {
				continue
			}
			if eft.ObjectID != e.ID {
				continue
			}
			if eft.Effect != auth_service.PolicyEffectAllow {
				continue
			}
			for _, b := range auth_service.PolicyActionBindingsForObjectType(objectType) {
				if b.PolicyAction != eft.Action {
					continue
				}
				entries[i].Actions = append(entries[i].Actions, eft.Action)
				break
			}
		}
	}
}

// filterSensitiveFieldsForIndicators 对指标类型的数据资源进行敏感字段过滤
func (d *dataResourceDomain) filterSensitiveFieldsForIndicators(ctx context.Context, result *SearchResult) error {
	ctx, span := trace.StartInternalSpan(ctx)
	defer span.End()

	// 收集所有指标类型的数据资源ID
	var indicatorIDs []string
	indicatorIndexMap := make(map[string][]int) // indicatorID -> []entryIndex

	for i, entry := range result.Entries {
		if entry.Type == DataResourceTypeIndicator {
			indicatorIDs = append(indicatorIDs, entry.ID)
			indicatorIndexMap[entry.ID] = append(indicatorIndexMap[entry.ID], i)
		}
	}

	// 如果没有指标类型的数据资源，直接返回
	if len(indicatorIDs) == 0 {
		return nil
	}

	// 批量获取指标详情，构建IndicatorID -> AnalysisDim的map
	indicatorAnalysisDimMap := make(map[string][]indicator_management.Dimension)

	for _, indicatorID := range indicatorIDs {
		req := &indicator_management.GetIndicatorDetailReq{
			IndicatorID: indicatorID,
		}

		resp, err := d.imRepo.GetIndicatorDetail(ctx, req)
		if err != nil {
			log.WithContext(ctx).Warn("get indicator detail failed, skip filtering",
				zap.String("indicatorID", indicatorID),
				zap.Error(err))
			continue
		}

		indicatorAnalysisDimMap[indicatorID] = resp.AnalysisDim
	}

	// 如果没有获取到任何指标的分析维度信息，直接返回
	if len(indicatorAnalysisDimMap) == 0 {
		return nil
	}

	// 对每个指标类型的SearchResultEntry进行敏感字段过滤
	for indicatorID, entryIndexes := range indicatorIndexMap {
		analysisDim, exists := indicatorAnalysisDimMap[indicatorID]
		if !exists {
			continue
		}

		// 构建AnalysisDim中FieldNameEN的集合，用于快速查找
		allowedFieldNameENSet := make(map[string]bool)
		for _, dim := range analysisDim {
			allowedFieldNameENSet[dim.FieldNameEN] = true
		}

		// 对该指标的每个SearchResultEntry进行字段过滤
		for _, entryIndex := range entryIndexes {
			entry := &result.Entries[entryIndex]

			// 过滤Fields，只保留在AnalysisDim中存在的字段
			var filteredFields []Field
			for _, field := range entry.Fields {
				// 如果字段的TechnicalName在AnalysisDim中找到对应的FieldNameEN，则保留该字段
				if allowedFieldNameENSet[field.TechnicalName] {
					filteredFields = append(filteredFields, field)
				}
			}

			// 更新Fields和FieldCount
			entry.Fields = filteredFields
			entry.FieldCount = len(filteredFields)
		}
	}

	return nil
}
