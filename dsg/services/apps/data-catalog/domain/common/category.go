package common

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/category"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"github.com/samber/lo"
)

func GetSubCategoryNodeIDList(ctx context.Context, repo category.Repo,
	categoryID string, categoryNodeID string) ([]string, error) {
	if len(categoryID) == 0 {
		nodes, err := repo.GetCategoryAndNodeByNodeID(ctx, []string{categoryNodeID})
		if err != nil {
			return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
		}
		if len(nodes) == 0 {
			return nil, errorcode.Desc(errorcode.CategoryNodeNotExist)
		}
		categoryID = nodes[0].CategoryID
	}
	nodeMs, err := repo.ListTree(ctx, categoryID)
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	parentSubMap := lo.GroupBy(nodeMs, func(item *model.CategoryNodeExt) string {
		return item.ParentID
	})

	return recursiveSubNodeIDs(parentSubMap, categoryNodeID), nil
}

func recursiveSubNodeIDs(parentSubMap map[string][]*model.CategoryNodeExt, nodeID string) []string {
	retNodeIDs := make([]string, 0)
	subNodes := parentSubMap[nodeID]
	for i := range subNodes {
		retNodeIDs = append(retNodeIDs, recursiveSubNodeIDs(parentSubMap, subNodes[i].CategoryNodeID)...)
	}
	return append(retNodeIDs, nodeID)
}

func GetSubCategoryNodeIDListV1(ctx context.Context, repo category.Repo,
	categoryID string, categoryNodeIDs []string) ([]string, error) {
	if len(categoryID) == 0 {
		nodes, err := repo.GetCategoryAndNodeByNodeID(ctx, categoryNodeIDs)
		if err != nil {
			return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
		}
		if len(nodes) == 0 {
			return nil, errorcode.Desc(errorcode.CategoryNodeNotExist)
		}
		categoryID = nodes[0].CategoryID
	}
	nodeMs, err := repo.ListTree(ctx, categoryID)
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	parentSubMap := lo.GroupBy(nodeMs, func(item *model.CategoryNodeExt) string {
		return item.ParentID
	})

	return recursiveSubNodeIDsV1(parentSubMap, categoryNodeIDs), nil
}

func recursiveSubNodeIDsV1(parentSubMap map[string][]*model.CategoryNodeExt, nodeIDs []string) []string {
	retNodeIDs := make([]string, 0)
	for j := range nodeIDs {
		subNodes := parentSubMap[nodeIDs[j]]
		for i := range subNodes {
			retNodeIDs = append(retNodeIDs, recursiveSubNodeIDs(parentSubMap, subNodes[i].CategoryNodeID)...)
		}
	}

	return append(retNodeIDs, nodeIDs...)
}
