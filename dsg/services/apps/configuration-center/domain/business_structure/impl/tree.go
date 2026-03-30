package impl

import (
	"context"
	"sort"
	"strings"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/util"
	domain "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/business_structure"
)

type treeNodeList []*domain.SummaryInfoTreeNode

func (t treeNodeList) Len() int {
	return len(t)
}

func (t treeNodeList) Swap(i, j int) {
	t[i], t[j] = t[j], t[i]
}

type sortByType struct {
	treeNodeList
}

func (m sortByType) Less(i, j int) bool {
	return constant.ObjectTypeStringToInt(m.treeNodeList[i].Type) < constant.ObjectTypeStringToInt(m.treeNodeList[j].Type)
}

type sortByName struct {
	treeNodeList
}

func (m sortByName) Less(i, j int) bool {
	a, _ := util.UTF82GBK(m.treeNodeList[i].Name)
	b, _ := util.UTF82GBK(m.treeNodeList[j].Name)
	bLen := len(b)
	for idx, chr := range a {
		if idx > bLen-1 {
			return false
		}
		if chr != b[idx] {
			return chr < b[idx]
		}
	}
	return true
}

func (uc *businessStructUseCase) getTreeWithType(ctx context.Context, q *domain.QueryPageReapParam) (tree []*domain.SummaryInfoTreeNode, err error) {
	// 要转化为树的节点列表
	// nodes := make([]*domain.SummaryInfoTreeNode, 0)

	// 响应的树列表
	tree = make([]*domain.SummaryInfoTreeNode, 0)

	if q == nil || q.TotalCount == 0 {
		return tree, nil
	}

	objectMap := make(map[string]*domain.SummaryInfoTreeNode)
	objects := q.Entries

	for _, obj := range objects {

		paths := strings.Split(obj.PathID, "/")
		names := strings.Split(obj.Path, "/")

		for i, path := range paths {
			if _, ok := objectMap[path]; !ok {
				// 遍历所有节点的所有path，加入到map树中
				node := &domain.SummaryInfoTreeNode{
					ID:         path,
					Name:       names[i],
					Expand:     obj.Expand,
					Attributes: obj.Attributes,
				}

				if i == 0 {
					// paths 里面的第一个节点，表示这是一个根节点
					node.FatherID = node.ID
				} else {
					// paths != 1，不是根节点，则该节点的father节点id为path倒数第二个
					node.FatherID = paths[i-1]
				}
				objectMap[path] = node
			}
		}
	}
	// 根据所有对象的id查出所有对象，为节点类型赋值
	objectIDs := make([]string, 0, len(objectMap))
	for _, node := range objectMap {
		objectIDs = append(objectIDs, node.ID)
	}
	objectsByIDs, err := uc.repo.GetObjectsByIDs(ctx, objectIDs)
	if err != nil {
		return nil, err
	}

	idsMap := make(map[string]string)
	for _, obj := range objectsByIDs {
		idsMap[obj.ID] = constant.ObjectTypeToString(obj.Type)
	}

	for _, node := range objectMap {
		node.Type = idsMap[node.ID]
		//nodes = append(nodes, node)
	}

	//sort.Slice(nodes, func(i, j int) bool {
	//	a, _ := util.UTF82GBK(nodes[i].Name)
	//	b, _ := util.UTF82GBK(nodes[j].Name)
	//	bLen := len(b)
	//	for idx, chr := range a {
	//		if idx > bLen-1 {
	//			return false
	//		}
	//		if chr != b[idx] {
	//			return chr < b[idx]
	//		}
	//	}
	//	return true
	//})

	//tree = generateTree(nodes)
	tree = buildTree(objectMap)

	return tree, nil
}

func buildTree(nodeMap map[string]*domain.SummaryInfoTreeNode) []*domain.SummaryInfoTreeNode {
	result := make([]*domain.SummaryInfoTreeNode, 0)

	for _, node := range nodeMap {
		if node.ID == node.FatherID {
			// 根节点
			result = append(result, node)
		} else {
			parent := nodeMap[node.FatherID]
			parent.Children = append(parent.Children, node)
		}
	}

	for _, nodes := range nodeMap {
		if len(nodes.Children) > 0 {
			children := nodes.Children
			sortTreeNodes(children)
		}
	}

	return result
}

func generateTree(nodes []*domain.SummaryInfoTreeNode) (tree []*domain.SummaryInfoTreeNode) {
	tree = make([]*domain.SummaryInfoTreeNode, 0)

	var roots, children []*domain.SummaryInfoTreeNode
	for _, node := range nodes {
		if node.FatherID == node.ID {
			// 这是一个根节点
			roots = append(roots, node)
		} else {
			children = append(children, node)
		}
	}

	for _, root := range roots {
		// 构建子树的根节点
		childTree := &domain.SummaryInfoTreeNode{
			ID:       root.ID,
			FatherID: root.FatherID,
			Name:     root.Name,
			Type:     root.Type,
			//Path:     root.Path,
			//PathID:   root.PathID,
			Expand: root.Expand,
		}

		// 递归生成树
		recursiveTree(childTree, children)

		tree = append(tree, childTree)
	}
	// sort root
	sortTreeNodes(roots)

	return
}

func recursiveTree(tree *domain.SummaryInfoTreeNode, children []*domain.SummaryInfoTreeNode) {

	for _, child := range children {
		// 当前节点是根节点则跳过
		if child.FatherID == child.ID {
			continue
		}

		// 当前child节点是tree节点的子节点
		if child.FatherID == tree.ID {
			// 把当前child节点作为父节点再去构造树
			childTree := &domain.SummaryInfoTreeNode{
				ID:       child.ID,
				FatherID: child.FatherID,
				Name:     child.Name,
				Type:     child.Type,
				//Path:     child.Path,
				//PathID:   child.PathID,
				Expand: child.Expand,
			}
			recursiveTree(childTree, children)

			// 构造完child节点的children切片后，将当前childTree节点作为添加到tree的children切片中
			tree.Children = append(tree.Children, childTree)
		}
	}

	// sort children
	sortTreeNodes(children)
}

func sortTreeNodes(nodes []*domain.SummaryInfoTreeNode) {
	// 先按照类型排序，再按照名称排序
	sort.Sort(sortByType{nodes})
	sort.Stable(sortByName{nodes})
}
