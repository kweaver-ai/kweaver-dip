package menu

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
)

type MenuRepo interface {
	GetMenus(ctx context.Context) ([]*model.Menu, error)
	GetMenusByPlatform(ctx context.Context, belong int32) (res []*model.Menu, err error)
	GetMenusByPlatformWithKeyword(ctx context.Context, belong int32, id string, keyword string) (res []*model.Menu, err error)
	Create(ctx context.Context, formView *model.Menu) error
	CreateBatch(ctx context.Context, formView []*model.Menu) error
	Truncate(ctx context.Context) error
}
