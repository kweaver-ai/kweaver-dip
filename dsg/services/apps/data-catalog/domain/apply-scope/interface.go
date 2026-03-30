package apply_scope

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
)

type ApplyScopeUseCase interface {
	AllList(ctx context.Context) (res []*model.ApplyScope, err error)
}
