package data_catalog

import (
	"context"

	"github.com/samber/lo"
	"go.uber.org/zap"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/basic_search"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/cognitive_assistant"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/request"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/common"
	fcommon "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/frontend/common"
	"github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
)

func (d *DataCatalogDomain) categoryFilterParamProc(ctx context.Context, businessObjectIDs []string, cateInfoReq []*basic_search.CateInfoReq) ([]string, error) {
	// 获取主题域及其子主题域的 ID 列表
	businessObjectIDS := make([]string, len(businessObjectIDs)*2)
	// 获取主题域及其子主题域的 ID 列表
	if len(businessObjectIDs) > 0 {
		for _, v := range businessObjectIDs {
			domainIDs, err := d.getSubjectDomainIDs(ctx, v)
			if err != nil {
				return nil, err
			}
			businessObjectIDS = append(businessObjectIDS, domainIDs...)
		}
	}

	for i := range cateInfoReq {
		nodes := make([]string, 0)
		for j := range cateInfoReq[i].NodeIDs {
			if cateInfoReq[i].NodeIDs[j] == constant.UnallocatedId {
				util.SliceAdd(&nodes, basic_search.UnclassifiedID)
				continue
			}
			switch cateInfoReq[i].CateID {
			case fcommon.CATEGORY_TYPE_ORGANIZATION:
				departmentList, err := d.configurationCenterDriven.GetDepartmentList(ctx,
					configuration_center.QueryPageReqParam{Offset: 1, Limit: 0, ID: cateInfoReq[i].NodeIDs[j]}) //limit 0 Offset 1 not available
				if err != nil {
					return nil, err
				}
				for _, entry := range departmentList.Entries {
					util.SliceAdd(&nodes, entry.ID)
				}
				nodes = append(nodes, cateInfoReq[i].NodeIDs[j])
			case fcommon.CATEGORY_TYPE_SYSTEM:
				nodes = append(nodes, cateInfoReq[i].NodeIDs[j])
			case fcommon.CATEGORY_TYPE_SUBJECT_DOMAIN:
				if cateInfoReq[i].NodeIDs[j] != constant.OtherSubject {
					subjectList, err := d.dataSubjectDriven.GetSubjectList(ctx,
						cateInfoReq[i].NodeIDs[j], "subject_domain_group,subject_domain,business_object,business_activity,logic_entity")
					if err != nil {
						return nil, err
					}
					for _, entry := range subjectList.Entries {
						util.SliceAdd(&nodes, entry.Id)
					}
				}
				nodes = append(nodes, cateInfoReq[i].NodeIDs[j])
			default:
				var err error
				nodes, err = common.GetSubCategoryNodeIDList(ctx,
					d.categoryRepo, cateInfoReq[i].CateID, cateInfoReq[i].NodeIDs[j])
				if err != nil {
					return nil, err
				}
			}
		}
		cateInfoReq[i].NodeIDs = nodes
	}
	return businessObjectIDS, nil
}

// SearchForOper implements DataResourceDomain.
func (d *DataCatalogDomain) Search(ctx context.Context, keyword string, filter DataCatalogSearchFilter, nextFlag NextFlag) (*SearchResult, error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer span.End()

	businessObjectIDS, err := d.categoryFilterParamProc(ctx, filter.BusinessObjectID, filter.CateInfoReq)
	if err != nil {
		return nil, err
	}

	// 生成 basic-search 搜索数据资源的请求
	req := newSearchDataResourcesCatalogRequest(ctx, keyword, businessObjectIDS, filter, nextFlag)

	// 在 basic-search 搜索数据资源
	resp, err := d.bsRepo.SearchDataCatalog(ctx, req)
	if err != nil {
		return nil, err
	}

	// 根据 basic-search 的响应生成搜索结果
	result, err := d.newSearchResult(ctx, request.GetUserInfo(ctx), d.myFavoriteRepo, resp)
	if err != nil {
		return nil, err
	}

	// 更新当前用户对搜索结果中的数据资源可以执行的动作列表 action
	//if err := d.updateDataCatalogSearchRespActions(ctx, result.Entries); err != nil {
	//	log.Warn("update data catalog search response's actions fail", zap.Error(err))
	//}

	// 更新共享申请状态
	if err := d.updateDataCatalogSearchRespSharedDeclarationStatus(ctx, result.Entries); err != nil {
		log.Warn("update data catalog search response's shared declaration statuses fail", zap.Error(err))
	}

	return result, nil
}

// SearchForOper implements DataResourceDomain.
func (d *DataCatalogDomain) SearchForOper(ctx context.Context, keyword string, filter DataCatalogSearchFilterForOper, nextFlag NextFlag) (*SearchResult, error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer span.End()

	// businessObjectIDS := make([]string, len(filter.BusinessObjectID)*2)
	// // 获取主题域及其子主题域的 ID 列表
	// if len(filter.BusinessObjectID) > 0 {
	// 	for _, v := range filter.BusinessObjectID {
	// 		domainIDs, err := d.getSubjectDomainIDs(ctx, v)
	// 		if err != nil {
	// 			return nil, err
	// 		}
	// 		businessObjectIDS = append(businessObjectIDS, domainIDs...)
	// 	}
	// }

	// // // 获取部门及其子部门的 ID 列表
	// // departmentIDs, err := d.getDepartmentIDs(ctx, "")
	// // if err != nil {
	// // 	return nil, err
	// // }

	businessObjectIDS, err := d.categoryFilterParamProc(ctx, filter.BusinessObjectID, filter.CateInfoReq)
	if err != nil {
		return nil, err
	}

	// 生成 basic-search 搜索数据资源的请求
	req := newSearchForOperDataResourcesCatalogRequest(ctx, keyword, businessObjectIDS, filter, nextFlag)

	// 在 basic-search 搜索数据资源
	resp, err := d.bsRepo.SearchDataCatalog(ctx, req)
	if err != nil {
		return nil, err
	}

	// 根据 basic-search 的响应生成搜索结果
	result, err := d.newSearchResult(ctx, request.GetUserInfo(ctx), d.myFavoriteRepo, resp)
	if err != nil {
		return nil, err
	}

	// 更新当前用户对搜索结果中的数据资源可以执行的动作列表 action
	//if err := d.updateDataCatalogSearchRespActions(ctx, result.Entries); err != nil {
	//	log.Warn("update data catalog search response's actions fail", zap.Error(err))
	//}

	// 更新共享申请状态
	if err := d.updateDataCatalogSearchRespSharedDeclarationStatus(ctx, result.Entries); err != nil {
		log.Warn("update data catalog search response's shared declaration statuses fail", zap.Error(err))
	}

	return result, nil
}

// // updateSearchRespParamActions 更新搜索结果的 Entries[].Actions
// func (d *DataCatalogDomain) updateSearchRespParamActions(ctx context.Context, resp *SearchRespParam) (err error) {
// 	// 从 context 获取当前用户信息
// 	user := request.GetUserInfo(ctx)
// 	if user == nil {
// 		return errors.New("context doesn't contain user info, skipping enforcing search result")
// 	}

// 	// 数据目录的 ID 列表
// 	var dataCatalogIDs []uint64
// 	for _, e := range resp.Entries {
// 		dataCatalogIDs = append(dataCatalogIDs, e.ID.Uint64())
// 	}
// 	// 获取数据目录对应的逻辑视图
// 	dataCatalogs, err := d.cataRepo.GetDetailByIds(nil, ctx, nil, dataCatalogIDs...)
// 	if err != nil {
// 		return
// 	}

// 	// 数据目录与逻辑视图的映射关系，key: 数据目录 ID，val: 逻辑视图 ID
// 	var mapDataCatalogIDToDataViewID = make(map[uint64]string)
// 	// 逻辑视图 ID 列表
// 	var formViewIDs []string
// 	for _, c := range dataCatalogs {
// 		if _, err := d.infoRepo.Get(nil, ctx, []int8{common.INFO_TYPE_LABEL, common.INFO_TYPE_RELATED_SYSTEM, common.INFO_TYPE_BUSINESS_DOMAIN}, []uint64{c.ID}); err != nil {
// 			log.Debug("get data catalog info fail", zap.Error(err), zap.Uint64("id", c.ID))
// 			continue
// 		}
// 		m, err := d.resourceMountRepo.Get(nil, ctx, c.Code, common.RES_TYPE_VIEW)
// 		if errors.Is(err, gorm.ErrRecordNotFound) {
// 			return errorcode.Detail(errorcode.PublicResourceNotExisted, "资源不存在")
// 		} else if err != nil {
// 			return errorcode.Detail(errorcode.PublicDatabaseError, err)
// 		}
// 		if len(m) < 1 {
// 			return fmt.Errorf("no table res, catalog code: %v", c.Code)
// 		}
// 		if m[0] == nil {
// 			log.Warn("TDataCatalogResourceMount[0] is nil", zap.Uint64("dataCatalogID", c.ID))
// 			continue
// 		}
// 		if m[0].ResID == "" {
// 			log.Warn("TDataCatalogResourceMount[0].ResIDStr is nil", zap.Uint64("dataCatalogID", c.ID))
// 			continue
// 		}
// 		mapDataCatalogIDToDataViewID[c.ID] = m[0].ResID
// 		formViewIDs = append(formViewIDs, m[0].ResID)
// 	}

// 	// 构建鉴权请求
// 	enforces := newPolicyEnforcesForUser(formViewIDs, user.ID)
// 	// 向 auth-service 鉴权
// 	effects, err := d.as.Enforce(ctx, enforces)
// 	if err != nil {
// 		return
// 	}

// 	// 根据鉴权结果更新 resp.Entries[].Actions
// 	updateSearchSummaryInfoEntriesActionsWithPolicyEnforceEffects(resp.Entries, effects, mapDataCatalogIDToDataViewID)
// 	return
// }

// type statusTime struct {
// 	status     int
// 	expireTime int64
// }

// // newPolicyEnforcesForUser 创建验证指定用户对逻辑视图的鉴权请求
// func newPolicyEnforcesForUser(logicViewIDs []string, userID string) (result []auth_service.PolicyEnforce) {
// 	for _, id := range logicViewIDs {
// 		for _, b := range auth_service.PolicyActionBindingsForObjectType(auth_service.ObjectTypeDataView) {
// 			pe := auth_service.PolicyEnforce{
// 				Action:      b.PolicyAction,
// 				ObjectID:    id,
// 				ObjectType:  b.ObjectType,
// 				SubjectID:   userID,
// 				SubjectType: auth_service.SubjectTypeUser,
// 			}
// 			result = append(result, pe)
// 		}
// 	}
// 	return
// }

// // updateSearchSummaryInfoEntriesActionsWithPolicyEnforceEffects 根据鉴权结果更新 Actions
// func updateSearchSummaryInfoEntriesActionsWithPolicyEnforceEffects(entries []*SearchSummaryInfo, effects []auth_service.PolicyEnforceEffect, mapDataCatalogIDToLogicViewID map[uint64]string) {
// 	for i, e := range entries {
// 		logicViewID, ok := mapDataCatalogIDToLogicViewID[e.ID.Uint64()]
// 		if !ok {
// 			continue
// 		}
// 		for _, eft := range effects {
// 			if eft.ObjectType != auth_service.ObjectTypeDataView {
// 				continue
// 			}
// 			if eft.ObjectID != logicViewID {
// 				continue
// 			}
// 			if eft.Effect != auth_service.PolicyEffectAllow {
// 				continue
// 			}
// 			entries[i].Actions = append(entries[i].Actions, eft.Action)
// 		}
// 	}
// }

// getSubjectDomainIDs 获取主题域及其子主题域的 ID 列表
func (d *DataCatalogDomain) getSubjectDomainIDs(ctx context.Context, id string) ([]string, error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer span.End()

	// 未指定所属主题域 ID，返回空 slice，用于搜索属于所有主题域的数据资源
	if id == "" {
		return nil, nil
	}

	// 搜索未分类、不属于任何主题域的数据资源
	if id == constant.UnallocatedId {
		return []string{basic_search.UnclassifiedID}, nil
	} else if id == constant.OtherSubject {
		return []string{constant.OtherSubject}, nil
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

// // getDepartmentIDs 获取指定部门及其子部门的 ID 列表
// func (d *DataCatalogDomain) getDepartmentIDs(ctx context.Context, id string) ([]string, error) {
// 	ctx, span := trace.StartInternalSpan(ctx)
// 	defer span.End()

// 	// 未指定所属部门 ID，返回空 slice，用于搜索属于所有部门的数据资源
// 	if id == "" {
// 		return nil, nil
// 	}

// 	// 搜索未分类、不属于任何部门的数据资源
// 	if id == fcommon.UncategorizedDepartmentID {
// 		return []string{basic_search.UnclassifiedID}, nil
// 	}

// 	// 获取指定部门及其子部门的 ID 列表
// 	resp, err := d.cc.GetSubOrgCodes(ctx, &configuration_center.GetSubOrgCodesReq{OrgCode: id})

// 	if err != nil {
// 		// 获取子部门失败时只搜索指定的部门
// 		log.WithContext(ctx).Error("get sub departments fail", zap.Error(err), zap.String("department", id))
// 		return []string{id}, nil
// 	}

// 	// 返回子部门和参数指定的部门
// 	return append(resp.Codes, id), nil
// }

func (d *DataCatalogDomain) SubGraph(ctx context.Context, req *SubGraphReqParam) (*SubGraphRespParam, error) {
	subgraphResp, err := d.cogCli.SubGraph(ctx, req.ToSubGraphSearch())
	if err != nil {
		log.WithContext(ctx).Errorf("failed to do SubGraphSearch, err info: %v", err.Error())
		return &SubGraphRespParam{}, nil
	}
	//log.WithContext(ctx).Infof("SubGraphSearch response: %s", lo.T2(json.Marshal(subgraphResp)).A)
	resp := d.NewSubGraphRespParam(subgraphResp)
	return resp, nil
}

func (d *DataCatalogDomain) NewSubGraphRespParam(resp *cognitive_assistant.SubGraphResp) *SubGraphRespParam {
	result := &SubGraphRespParam{}
	if resp == nil || lo.ToPtr(resp.Res) == nil || len(resp.Res.Nodes) == 0 {
		return result
	}

	nodesMap := make(map[string]*GraphNode, 0)
	// 创建图谱中所有节点
	for _, node := range resp.Res.Nodes {
		if _, ok := nodesMap[node.ID]; ok {
			continue
		}
		graphNode := &GraphNode{
			EntityType: node.Alias,
			VID:        node.ID,
			Name:       node.DefaultProperty.Value,
			Color:      node.Color,
		}
		if node.ClassName == "data_explore_report" {
			// 字段探查结果
		LOOP:
			for _, property := range node.Properties {
				for _, prop := range property.Props {
					if prop.Name == "explore_result_value" {
						graphNode.Name = prop.Value
						break LOOP
					}
				}
			}
		} else if node.ClassName == "datacatalog" || node.ClassName == "resource" {
			// 节点类型为 datacatalog 时，去属性取 color
		ROOT:
			for _, property := range node.Properties {
				for _, prop := range property.Props {
					if prop.Name == "color" {
						graphNode.Color = prop.Value
						break ROOT
					}
				}
			}
			result.Root = graphNode
		}
		nodesMap[node.ID] = graphNode
	}

	// 边关系去重
	edges := make([]*cognitive_assistant.Edge, 0)
	edgesMap := make(map[string]struct{}, 0)
	for _, edge := range resp.Res.Edges {
		id := edge.Source + edge.Target
		if _, ok := edgesMap[id]; !ok {
			edgesMap[id] = struct{}{}
			edges = append(edges, edge)
		}
	}

	// 构建节点层级关系
	for _, edge := range edges {
		source := nodesMap[edge.Source]
		target := nodesMap[edge.Target]

		source.Relation = edge.Alias
		target.Children = append(target.Children, source)
	}

	return result
}
