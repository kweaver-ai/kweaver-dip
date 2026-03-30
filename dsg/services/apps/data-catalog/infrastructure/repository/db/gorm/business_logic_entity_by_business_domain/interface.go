package business_logic_entity_by_business_domain

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
)

type RepoOp interface {
	Update(ctx context.Context, infos []*model.TBusinessLogicEntityByBusinessDomain) error
	Get(ctx context.Context) ([]*model.TBusinessLogicEntityByBusinessDomain, error)
}
