package data_catalog_score

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models"
	domain "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/data_catalog_score"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"gorm.io/gorm"
)

type DataCatalogScoreRepo interface {
	Db() *gorm.DB
	GetByCatalogIdAndUid(ctx context.Context, catalogId uint64, uid string, tx ...*gorm.DB) (catalogScore *model.TDataCatalogScore, err error)
	Create(ctx context.Context, catalogScore *model.TDataCatalogScore) error
	Update(ctx context.Context, id uint64, score int8) error
	GetCatalogScoreList(ctx context.Context, req *domain.PageInfo) (totalCount int64, catalogScoreList []*domain.DataCatalogScoreVo, err error)
	GetDataCatalogScoreDetail(ctx context.Context, catalogId uint64, req *domain.ScoreDetailReq) (totalCount int64, userScoreList []*domain.UserScoreVo, err error)
	GetAverageScoreByCatalogId(ctx context.Context, catalogId uint64) (avgScore float32, err error)
	GetScoreStatByCatalogId(ctx context.Context, catalogId uint64) (scoreStat []*domain.ScoreCountInfo, err error)
	GetScoreSummaryByCatalogIds(ctx context.Context, catalogIds []models.ModelID) (scoreSummary []*domain.ScoreSummaryVo, err error)
}
