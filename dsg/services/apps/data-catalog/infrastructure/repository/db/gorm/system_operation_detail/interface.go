package system_operation_detail

import (
	"context"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/request"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
)

type SystemOperationDetailRepo interface {
	Create(ctx context.Context, detail *model.TSystemOperationDetail) error
	Update(ctx context.Context, detail *model.TSystemOperationDetail) error
	UpdateWhiteList(ctx context.Context, detail *model.TSystemOperationDetail) error
	GetByFormViewID(ctx context.Context, formViewId string) (*model.TSystemOperationDetail, error)
	QueryList(ctx context.Context, page *request.BOPageInfo, keyword string, departmentIds, infoSystemIds []string, acceptanceStart, acceptanceEnd *time.Time, isWhitelisted *bool) ([]*model.TSystemOperationDetail, int64, error)
	QueryInfoSystemList(ctx context.Context, page *request.BOPageInfo, infoSystemIds []string, acceptanceStart, acceptanceEnd *time.Time) (map[string]int, int64, error)
	GetByInfoSystemID(ctx context.Context, infoSystemId string) ([]*model.TSystemOperationDetail, error)
	GetByFormViewIDs(ctx context.Context, formViewIds []string) ([]*model.TSystemOperationDetail, error)
	GetFormViewIDs(ctx context.Context) ([]string, error)
	Delete(ctx context.Context, id string) error
}
