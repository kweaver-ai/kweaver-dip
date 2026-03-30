package standard_info

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-subject/infrastructure/db/model"
)

type StandardInfoRepo interface {
	GetStandardById(ctx context.Context, id uint64) (standard *model.StandardInfo, err error)
	GetStandardByIdSlice(ctx context.Context, idSlice ...uint64) (standardSlice []*model.StandardInfo, err error)
	Create(ctx context.Context, standard *model.StandardInfo) error
	Upsert(ctx context.Context, standards []*model.StandardInfo) (err error)
}
