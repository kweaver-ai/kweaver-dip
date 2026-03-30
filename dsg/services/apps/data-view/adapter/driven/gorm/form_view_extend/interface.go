package form_view_extend

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
	"gorm.io/gorm"
)

type FormViewExtendRepo interface {
	Db() *gorm.DB
	Save(ctx context.Context, record *model.TFormViewExtend) error
}
