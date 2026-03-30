package category

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/common_model"
	"gorm.io/gorm"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
)

type Repo interface {
	CreateCategory(ctx context.Context, m *model.Category, nodes []*model.CategoryNode, n *model.CategoryNode) error
	Delete(ctx context.Context, id string) (bool, error)
	UpdateByEdit(ctx context.Context, m *model.Category) error
	EditUsing(ctx context.Context, m *model.Category) error
	ExistByName(ctx context.Context, name, id string) (bool, error)
	ExistByID(ctx context.Context, id string) (bool, error)
	BatchEdit(ctx context.Context, BatchEdit []model.Category) error
	ListTree(ctx context.Context, id string) ([]*model.CategoryNodeExt, error)
	ListTreeExt(ctx context.Context, id string) ([]*model.CategoryNodeExt, error)
	GetCategory(ctx context.Context, id string) (*model.Category, error)
	GetAllCategory(ctx context.Context, keyword string) ([]*model.Category, error)
	GetCategoryByUsing(ctx context.Context, using int) ([]*model.Category, error)
	GetCategoryByID(ctx context.Context, id string) (*model.Category, error)
	GetCategoryByIDs(ctx context.Context, ids []string) (categoryList []*model.Category, err error)
	GetCategoryNodeByNames(ctx context.Context, names []string) (categoryNode []*model.CategoryNode, err error)
	GetCategoryAndNodeByNodeID(ctx context.Context, nodeIds []string) ([]*common_model.CategoryInfo, error)
	UpdateInfoSystemSubjectCategory(ctx context.Context, catalogID uint64, category []*model.TDataCatalogCategory, tx ...*gorm.DB) error
}

type TreeRepo interface {
	Create(ctx context.Context, m *model.CategoryNode, maxLayer int) error
	Delete(ctx context.Context, categoryid, id, updaterUID, updaterName string) (bool, error)
	UpdateByEdit(ctx context.Context, m *model.CategoryNode) error
	UpdateNodeRequired(ctx context.Context, categoryID, nodeID string, required int, updaterUID, updaterName string) error
	UpdateNodeSelected(ctx context.Context, nodeID string, selected int, updaterUID, updaterName string) error
	UpdateNodeRequiredExt(ctx context.Context, categoryID, nodeID string, required int, updaterUID, updaterName string) error
	UpdateNodeSelectedExt(ctx context.Context, nodeID string, selected int, updaterUID, updaterName string) error
	ExistByName(ctx context.Context, name, parentId, nodeId, catalogId string) (bool, error)
	ExistByID(ctx context.Context, catagoryNodeId, catagoryId string) (bool, error)
	Reorder(ctx context.Context, id, destParentId, nextID, treeID models.ModelID, maxLayer int, updaterUID, updaterName string) error
	GetParentID(ctx context.Context, nodeId string) (id string, err error)
	GetNodeInfoById(ctx context.Context, nodeId string) (nodeInfo *model.CategoryNode, err error)
	GetCategoryNodeByID(ctx context.Context, id string) (categoryNode *model.CategoryNode, err error)
}

type ModuleConfigRepo interface {
	GetByCategory(ctx context.Context, categoryID string) ([]*model.CategoryModuleConfig, error)
	UpsertAll(ctx context.Context, categoryID string, items []*model.CategoryModuleConfig) error
	UpdateFields(ctx context.Context, m *model.CategoryModuleConfig, fields []string) error
}
