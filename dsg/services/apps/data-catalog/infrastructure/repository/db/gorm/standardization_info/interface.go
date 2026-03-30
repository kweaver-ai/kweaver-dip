package standardization_info

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
)

type RepoOp interface {
	Update(ctx context.Context, infos []*model.TStandardizationInfo) error
	Get(ctx context.Context) ([]*model.TStandardizationInfo, error)
}
