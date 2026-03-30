package impl

import (
	"context"
	"sort"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/response"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/util"
	domain "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/tree_node"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/samber/lo"
)

func (u *useCase) List(ctx context.Context, req *domain.ListReqParam) (*domain.ListRespParam, error) {
	if err := u.parentNodeExistCheckDie(ctx, &req.ParentID, req.TreeID); err != nil {
		return nil, err
	}

	if len(req.Keyword) > 0 && !util.CheckKeyword(&req.Keyword) {
		log.WithContext(ctx).Errorf("keyword is invalid, keyword: %s", req.KeywordInfo)
		return domain.NewListRespParam(nil, 0), nil
	}

	if req.Recursive {
		// 需要递归查询子树
		if len(req.Keyword) == 0 {
			return u.recursiveList(ctx, req.ParentID, req.TreeID, req.Keyword)
		}

		// 平铺展示搜索结果
		return u.listByKeyword(ctx, req.TreeID, req.Keyword)
	}

	// 获取当前parent节点下满足条件的子节点列表
	return u.list(ctx, req.ParentID, req.TreeID, req.Keyword)
}

const rootNodeParentID models.ModelID = "0"

func (u *useCase) listByKeyword(ctx context.Context, treeID models.ModelID, keyword string) (*domain.ListRespParam, error) {
	nodes, err := u.repo.ListByKeyword(ctx, treeID, keyword)
	if err != nil {
		return nil, err
	}

	resp := &domain.ListRespParam{
		PageResult: response.PageResult[domain.SubNode]{
			Entries: lo.Map(nodes, func(item *model.TreeNodeExt, _ int) *domain.SubNode {
				return &domain.SubNode{IDResp: response.IDResp{ID: item.ID}, Name: item.Name, Expansion: item.Expansion}
			}),
			TotalCount: int64(len(nodes)),
		},
	}

	return resp, nil
}

func (u *useCase) recursiveList(ctx context.Context, parentID, treeID models.ModelID, keyword string) (*domain.ListRespParam, error) {
	curParentId := parentID
	var nodes []*model.TreeNodeExt
	var err error
	if len(keyword) > 0 {
		curParentId = rootNodeParentID
		nodes, err = u.repo.ListRecursiveAndKeyword(ctx, treeID, keyword)
	} else {
		nodes, err = u.repo.ListRecursive(ctx, parentID, treeID)
	}
	if err != nil {
		return nil, err
	}

	nodeRs := parentIdToTreeNodeRecursiveSlice(curParentId, nodes)

	return domain.NewListRespParamByTreeNode(nodeRs, int64(len(nodeRs))), nil
}

func (u *useCase) list(ctx context.Context, parentID, treeID models.ModelID, keyword string) (*domain.ListRespParam, error) {
	nodes, err := u.repo.ListShow(ctx, parentID, treeID, keyword)
	if err != nil {
		return nil, err
	}

	return domain.NewListRespParamByTreeNode(nodes, int64(len(nodes))), nil
}

func (u *useCase) ListTree(ctx context.Context, req *domain.ListTreeReqParam) (*domain.ListTreeRespParam, error) {
	if err := u.treeExistCheckDie(ctx, req.TreeID); err != nil {
		return nil, err
	}

	if len(req.Keyword) > 0 && !util.CheckKeyword(&req.Keyword) {
		log.WithContext(ctx).Errorf("keyword is invalid, keyword: %s", req.KeywordInfo)
		return domain.NewListTreeRespParam(nil, "", false), nil
	}

	var nodeMs []*model.TreeNodeExt
	var err error
	var defaultExpansion bool
	if len(req.Keyword) < 1 {
		defaultExpansion = false
		nodeMs, err = u.repo.ListTree(ctx, req.TreeID)
	} else {
		defaultExpansion = true
		nodeMs, err = u.repo.ListTreeAndKeyword(ctx, req.TreeID, req.Keyword)
	}

	if err != nil {
		return nil, err
	}

	nodes := parentIdToTreeNodeRecursiveSlice(rootNodeParentID, nodeMs)
	return domain.NewListTreeRespParam(nodes, req.Keyword, defaultExpansion), nil
}

func parentIdToTreeNodeRecursiveSlice(parentId models.ModelID, nodes []*model.TreeNodeExt) []*model.TreeNodeExt {
	if len(nodes) < 1 {
		return nil
	}

	// sort
	sort.Slice(nodes, func(i, j int) bool {
		return nodes[i].SortWeight < nodes[j].SortWeight
	})

	parentSubMap := lo.GroupBy(nodes, func(item *model.TreeNodeExt) models.ModelID {
		return item.ParentID
	})

	parentNodeR := &model.TreeNodeExt{TreeNode: &model.TreeNode{ID: parentId}, Expansion: true}
	tmpQueue := make([]*model.TreeNodeExt, 0, 5)
	tmpQueue = append(tmpQueue, parentNodeR)
	var curNodeRec *model.TreeNodeExt
	for len(tmpQueue) > 0 {
		curNodeRec = tmpQueue[0]
		curNodeRec.Children = parentSubMap[curNodeRec.ID]
		if len(curNodeRec.Children) > 0 {
			curNodeRec.Expansion = true
			tmpQueue = append(tmpQueue, curNodeRec.Children...)
		}
		tmpQueue = tmpQueue[1:]
	}

	if parentId == rootNodeParentID && len(parentNodeR.Children) > 0 {
		// root节点不需要返回
		return parentNodeR.Children[0].Children
	}

	return parentNodeR.Children
}
