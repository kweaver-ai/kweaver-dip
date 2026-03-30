package business_structure

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
)

type Repo interface {
	GetSubtypeByObjectId(ctx context.Context, objectId string) (resp int32, err error)
	Create(ctx context.Context, m *model.TObjectSubtype) error
	Update(ctx context.Context, m *model.TObjectSubtype) error
	BatchDelete(ctx context.Context, ids []string, uid string) error
	GetCountSubTypeById(ctx context.Context, objectId string) (count int64, err error)
	GetMainDeptByObjectIds(ctx context.Context, objectIds []string) (deptIds []string, err error)
}
