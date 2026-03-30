package business_logic_entity_by_department

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
)

type RepoOp interface {
	Update(ctx context.Context, infos []*model.TBusinessLogicEntityByDepartment) error
	Get(ctx context.Context) ([]*model.TBusinessLogicEntityByDepartment, error)
}
