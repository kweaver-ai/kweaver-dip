package es

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
)

type ESRepo interface {
	PubToES(ctx context.Context, logicView *model.FormView, fieldObjs []*FieldObj) (err error)
	DeletePubES(ctx context.Context, id string) (err error)
}
