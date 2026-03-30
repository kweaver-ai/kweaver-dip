package impl

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/request"
	domain "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/data_catalog_score"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_catalog_score"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"gorm.io/gorm"
)

type DataCatalogScoreRepo struct {
	db *gorm.DB
}

func (d *DataCatalogScoreRepo) Db() *gorm.DB {
	return d.db
}
func (d *DataCatalogScoreRepo) do(tx []*gorm.DB) *gorm.DB {
	if len(tx) > 0 && tx[0] != nil {
		return tx[0]
	}
	return d.db
}

func NewDataCatalogScoreRepo(db *gorm.DB) data_catalog_score.DataCatalogScoreRepo {
	return &DataCatalogScoreRepo{db: db}
}

func (d *DataCatalogScoreRepo) GetByCatalogIdAndUid(ctx context.Context, catalogId uint64, uid string, tx ...*gorm.DB) (catalogScore *model.TDataCatalogScore, err error) {
	err = d.do(tx).WithContext(ctx).Model(&model.TDataCatalogScore{}).
		Where("catalog_id = ? and scored_uid = ?", catalogId, uid).
		Find(&catalogScore).Error
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return catalogScore, nil
}

func (d *DataCatalogScoreRepo) Create(ctx context.Context, catalogScore *model.TDataCatalogScore) error {
	err := d.db.WithContext(ctx).Model(&model.TDataCatalogScore{}).Create(catalogScore).Error
	if err != nil {
		return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return nil
}

func (d *DataCatalogScoreRepo) Update(ctx context.Context, id uint64, score int8) error {
	res := d.db.WithContext(ctx).Model(&model.TDataCatalogScore{}).
		Where("id = ?", id).
		Updates(&model.TDataCatalogScore{Score: score, ScoredAt: time.Now()})
	if res.Error != nil {
		return errorcode.Detail(errorcode.PublicDatabaseError, res.Error.Error())
	}
	if res.RowsAffected == 0 {
		return errorcode.Desc(errorcode.DataCatalogNotFound)
	}
	return nil
}

func (d *DataCatalogScoreRepo) GetCatalogScoreList(ctx context.Context, req *domain.PageInfo) (totalCount int64, catalogScoreList []*domain.DataCatalogScoreVo, err error) {
	userInfo := request.GetUserInfo(ctx)
	db := d.db.WithContext(ctx).Table("t_data_catalog_score").
		Select("t_data_catalog_score.id, t_data_catalog_score.catalog_id, t_data_catalog_score.score, t_data_catalog_score.scored_at, t_data_catalog.title, t_data_catalog.code, t_data_catalog.department_id").
		Joins("JOIN t_data_catalog ON t_data_catalog_score.catalog_id = t_data_catalog.id").
		Where("t_data_catalog_score.scored_uid = ?", userInfo.ID)
	keyword := req.Keyword
	if keyword != "" {
		if strings.Contains(keyword, "_") {
			keyword = strings.Replace(keyword, "_", "\\_", -1)
		}
		keyword = "%" + keyword + "%"
		db = db.Where("t_data_catalog.title like ? or t_data_catalog.code like ? ", keyword, keyword)
	}

	err = db.Count(&totalCount).Error
	if err != nil {
		return 0, nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	limit := *req.Limit
	offset := limit * (*req.Offset - 1)
	if limit > 0 {
		db = db.Limit(limit).Offset(offset)
	}
	if *req.Sort == "name" {
		db = db.Order(fmt.Sprintf(" t_data_catalog.title %s", *req.Direction))
	} else {
		db = db.Order(fmt.Sprintf("t_data_catalog_score.%s %s", *req.Sort, *req.Direction))
	}
	err = db.Find(&catalogScoreList).Error
	if err != nil {
		return 0, nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return
}

func (d *DataCatalogScoreRepo) GetDataCatalogScoreDetail(ctx context.Context, catalogId uint64, req *domain.ScoreDetailReq) (totalCount int64, userScoreList []*domain.UserScoreVo, err error) {
	db := d.db.WithContext(ctx).Table("t_data_catalog_score").
		Select("t_data_catalog_score.catalog_id, t_data_catalog_score.score, t_data_catalog_score.scored_uid, t_data_catalog_score.scored_at, t_data_catalog.title, t_data_catalog.department_id").
		Joins("JOIN t_data_catalog ON t_data_catalog_score.catalog_id = t_data_catalog.id").
		Where("t_data_catalog_score.catalog_id = ?", catalogId)

	err = db.Count(&totalCount).Error
	if err != nil {
		return 0, nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	limit := *req.Limit
	offset := limit * (*req.Offset - 1)
	if limit > 0 {
		db = db.Limit(limit).Offset(offset)
	}
	db = db.Order(fmt.Sprintf("t_data_catalog_score.%s %s", *req.Sort, *req.Direction))
	err = db.Find(&userScoreList).Error
	if err != nil {
		return 0, nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return
}

func (d *DataCatalogScoreRepo) GetAverageScoreByCatalogId(ctx context.Context, catalogId uint64) (avgScore float32, err error) {
	var avg sql.NullFloat64
	err = d.db.WithContext(ctx).Model(&model.TDataCatalogScore{}).
		Select("ROUND(AVG(score)) as avg_score").
		Where("catalog_id = ?", catalogId).
		Find(&avg).Error
	if err != nil {
		return 0, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	if avg.Valid { // 检查 avg 是否有效
		avgScore = float32(avg.Float64) // 转换为 float32
	} else {
		avgScore = 0 // 如果没有有效的平均分，返回 0
	}
	return
}

func (d *DataCatalogScoreRepo) GetScoreStatByCatalogId(ctx context.Context, catalogId uint64) (scoreStat []*domain.ScoreCountInfo, err error) {
	err = d.db.WithContext(ctx).Model(&model.TDataCatalogScore{}).
		Select("score, COUNT(*) as count").
		Where("catalog_id = ?", catalogId).
		Group("score").
		Find(&scoreStat).Error
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return
}

func (d *DataCatalogScoreRepo) GetScoreSummaryByCatalogIds(ctx context.Context, catalogIds []models.ModelID) (scoreSummary []*domain.ScoreSummaryVo, err error) {
	userInfo := request.GetUserInfo(ctx)
	err = d.db.WithContext(ctx).Model(&model.TDataCatalogScore{}).
		Select("catalog_id, ROUND(AVG(score)) as average_score, COUNT(*) as count, MAX(CASE WHEN scored_uid = ? THEN 1 ELSE 0 END) as has_scored", userInfo.ID).
		Where("catalog_id IN ?", catalogIds).
		Group("catalog_id").
		Find(&scoreSummary).Error

	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}

	return
}
