package tree_node

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
)

type Repo interface {
	ExistByIdAndTreeId(ctx context.Context, id, treeId models.ModelID) (bool, error)
	ExistByIdAndParentIdTreeId(ctx context.Context, id, parentId, treeId models.ModelID) (bool, error)
	ExistByNameAndTreeId(ctx context.Context, name string, treeId models.ModelID, excludedIds ...models.ModelID) (bool, error)
	ExistByName(ctx context.Context, name string, parentId, treeId /*treeId纯粹为了使用到索引*/ models.ModelID, excludedIds ...models.ModelID) (bool, error)
	InsertWithMaxLayer(ctx context.Context, m *model.TreeNode, maxLayer int) error
	Delete(ctx context.Context, id, treeID models.ModelID) (bool, error)
	GetByIdAndTreeId(ctx context.Context, id, treeId models.ModelID) (*model.TreeNode, error)
	UpdateByEdit(ctx context.Context, m *model.TreeNode) error
	ListShow(ctx context.Context, parentID, treeID models.ModelID, keyword string) ([]*model.TreeNodeExt, error)
	ListRecursiveAndKeyword(ctx context.Context, treeID models.ModelID, keyword string) ([]*model.TreeNodeExt, error)
	ListRecursive(ctx context.Context, parentId models.ModelID, treeId models.ModelID) ([]*model.TreeNodeExt, error)
	ListTree(ctx context.Context, treeID models.ModelID) ([]*model.TreeNodeExt, error)
	ListTreeAndKeyword(ctx context.Context, treeID models.ModelID, keyword string) ([]*model.TreeNodeExt, error)
	GetNameById(ctx context.Context, id models.ModelID) (string, error)
	Reorder(ctx context.Context, id, destParentId, nextID, treeID models.ModelID, maxLayer int) error

	ListByKeyword(ctx context.Context, treeID models.ModelID, keyword string) ([]*model.TreeNodeExt, error)
}
