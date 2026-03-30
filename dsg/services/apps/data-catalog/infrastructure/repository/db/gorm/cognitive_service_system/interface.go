package cognitive_service_system

import (
	"context"

	domain "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/cognitive_service_system"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
)

type Repo interface {
	GetSingleCatalogTemplateList(ctx context.Context) ([]*model.TDataCatalogSearchTemplate, error)
	GetSingleCatalogTemplateListByCondition(ctx context.Context, req *domain.GetSingleCatalogTemplateListReq, userId string) (total int64, singleCatalogTemplateList []*model.TDataCatalogSearchTemplateData, err error)
	GetSingleCatalogTemplateDetail(ctx context.Context, id string) (*model.TDataCatalogSearchTemplate, error)
	CreateSingleCatalogTemplate(ctx context.Context, singleCatalogTemplate *model.TDataCatalogSearchTemplate) error
	UpdateSingleCatalogTemplate(ctx context.Context, singleCatalogTemplate *model.TDataCatalogSearchTemplate) error
	DeleteSingleCatalogTemplate(ctx context.Context, id string, userId string) error
	GetSingleCatalogHistoryListByCondition(ctx context.Context, req *domain.GetSingleCatalogHistoryListReq, userId string) (total int64, singleCatalogTemplateList []*model.TDataCatalogSearchHistoryData, err error)
	GetSingleCatalogHistoryDetail(ctx context.Context, id string) (singleCatalogHistory *model.TDataCatalogSearchHistory, err error)
	CreateSingleCatalogHistory(ctx context.Context, singleCatalogHistory *model.TDataCatalogSearchHistory) error
	CheckTemplateNameUnique(ctx context.Context, name string, userId string) (bool, error)
}
