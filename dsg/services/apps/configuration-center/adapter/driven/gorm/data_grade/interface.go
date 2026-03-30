package data_grade

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/models"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/data_grade"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
)

type IDataGradeRepo interface {
	ExistByName(ctx context.Context, name string, id models.ModelID, nodeType int) (bool, error)
	ExistByIcon(ctx context.Context, icon string, id models.ModelID) (bool, error)
	IsGroup(ctx context.Context, id models.ModelID) (bool, error)
	InsertWithMaxLayer(ctx context.Context, m *model.DataGrade, maxLayer int) error
	GetRootNodeId(ctx context.Context, id models.ModelID) (models.ModelID, error)
	GetNameById(ctx context.Context, id models.ModelID) (string, error)
	ExistByIdAndTreeId(ctx context.Context, id, treeId models.ModelID) (bool, error)
	ExistByIdAndParentIdTreeId(ctx context.Context, id, parentId, treeId models.ModelID) (bool, error)
	Reorder(ctx context.Context, id, destParentId, nextID, treeID models.ModelID, maxLayer int) error
	GetList(ctx context.Context, keyword string) ([]*model.DataGrade, error)
	ListByKeyword(ctx context.Context, keyword string) ([]*model.DataGrade, error)
	Delete(ctx context.Context, id models.ModelID) ([]uint64, bool, error)
	GetListByParentId(ctx context.Context, parentId string) ([]*model.DataGrade, error)
	ListTree(ctx context.Context, treeID models.ModelID) ([]*data_grade.TreeNodeExt, error)
	ListTreeAndKeyword(ctx context.Context, treeID models.ModelID, keyword string) ([]*data_grade.TreeNodeExt, error)
	GetInfoByID(ctx context.Context, id models.ModelID) (*model.DataGrade, error)
	GetInfoByName(ctx context.Context, name string) (*model.DataGrade, error)
	ListIcon(ctx context.Context) ([]*model.DataGrade, error)
	GetListByIds(ctx context.Context, ids string) ([]*model.DataGrade, error)
	GetCountByNodeType(ctx context.Context, nodeType string) (int64, error)
	GetBindObjects(ctx context.Context, label string) (DataStandardization,
		BusinessAttri,
		DataView,
		DataCatalog []data_grade.EntrieObj, err error)
}
