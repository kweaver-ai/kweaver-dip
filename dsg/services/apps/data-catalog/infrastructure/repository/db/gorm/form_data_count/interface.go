package form_data_count

import (
	"context"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
)

type FormDataCountRepo interface {
	Create(ctx context.Context, detail *model.TFormDataCount) error
	QueryList(ctx context.Context, formViewId string, startDate, endDate time.Time) ([]*model.TFormDataCount, error)
}
