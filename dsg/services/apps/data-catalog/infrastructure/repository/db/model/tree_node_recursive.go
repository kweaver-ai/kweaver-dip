package model

import "sort"

type TreeNodeRecursive struct {
	*TreeNode
	Children []*TreeNodeRecursive
}

func TreeNodeToRecursive(nodes ...*TreeNode) []*TreeNodeRecursive {
	if len(nodes) < 1 {
		return nil
	}

	ret := make([]*TreeNodeRecursive, len(nodes))
	for i, node := range nodes {
		ret[i] = &TreeNodeRecursive{TreeNode: node}
	}

	if len(ret) > 1 {
		sort.Slice(ret, func(i, j int) bool {
			return ret[i].SortWeight < ret[j].SortWeight
		})
	}

	return ret
}

type TreeNodeExt struct {
	*TreeNode
	Expansion           bool           `gorm:"-:all"`
	Hit                 bool           `gorm:"-:all"`
	NotDefaultExpansion bool           `gorm:"-:all"`
	Children            []*TreeNodeExt `gorm:"-:all"`
}
