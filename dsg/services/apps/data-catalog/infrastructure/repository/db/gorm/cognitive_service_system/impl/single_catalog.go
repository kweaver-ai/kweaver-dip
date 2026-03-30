package impl

import (
	"context"
	"fmt"
	"strings"

	domain "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/cognitive_service_system"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/cognitive_service_system"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"gorm.io/gorm"
	//"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_push"
)

type RepoImpl struct {
	data *db.Data
}

func NewRepoImpl(data *db.Data) cognitive_service_system.Repo {
	return &RepoImpl{
		data: data,
	}
}

func (r *RepoImpl) GetSingleCatalogTemplateList(ctx context.Context) (templateList []*model.TDataCatalogSearchTemplate, err error) {
	err = r.data.DB.WithContext(ctx).Table(model.TableNameTDataCatalogSearchTemplate).Find(&templateList).Error
	return
}

func (r *RepoImpl) GetSingleCatalogTemplateListByCondition(ctx context.Context, req *domain.GetSingleCatalogTemplateListReq, userId string) (total int64, singleCatalogTemplateList []*model.TDataCatalogSearchTemplateData, err error) {
	var db *gorm.DB
	db = r.data.DB.WithContext(ctx).Table("t_data_catalog_search_template t").Where("t.deleted_at=0").Joins("INNER JOIN t_data_catalog dc  ON t.data_catalog_id = dc.id") //deleted_at=0
	//db = db.Where("dc.deleted_at is null")
	db = db.Select("t.id as id, t.name as name, t.updated_at as updated_at, dc.id as data_catalog_id, dc.title as data_catalog_name, t.department_path as t_department_path, dc.department_id as d_department_id, t.type as type, t.description")

	if len(userId) > 0 {
		db = db.Where("t.created_by_uid = ?", userId)
	}

	keyword := req.Keyword
	if keyword != "" {
		if strings.Contains(keyword, "_") {
			keyword = strings.Replace(keyword, "_", "\\_", -1)
		}
		keyword = "%" + keyword + "%"
		db = db.Where("t.name like ? or dc.title like ?", keyword, keyword)
	}

	err = db.Count(&total).Error
	limit := *req.Limit
	offset := limit * (*req.Offset - 1)
	if limit > 0 {
		db = db.Limit(limit).Offset(offset)
	}

	db = db.Order(fmt.Sprintf(" %s %s ", req.Sort, req.Direction))

	err = db.Find(&singleCatalogTemplateList).Error
	return total, singleCatalogTemplateList, err
}

func (r *RepoImpl) GetSingleCatalogTemplateDetail(ctx context.Context, id string) (singleCatalogTemplate *model.TDataCatalogSearchTemplate, err error) {
	err = r.data.DB.WithContext(ctx).Table(model.TableNameTDataCatalogSearchTemplate).Where("id =? and deleted_at=0", id).Take(&singleCatalogTemplate).Error
	return
}

func (r *RepoImpl) CreateSingleCatalogTemplate(ctx context.Context, singleCatalogTemplate *model.TDataCatalogSearchTemplate) error {
	return r.data.DB.WithContext(ctx).Table(model.TableNameTDataCatalogSearchTemplate).Create(singleCatalogTemplate).Error
}

func (r *RepoImpl) UpdateSingleCatalogTemplate(ctx context.Context, singleCatalogTemplate *model.TDataCatalogSearchTemplate) error {
	return r.data.DB.WithContext(ctx).Table(model.TableNameTDataCatalogSearchTemplate).Where("id=?", singleCatalogTemplate.ID).Updates(singleCatalogTemplate).Error
}

func (r *RepoImpl) DeleteSingleCatalogTemplate(ctx context.Context, id string, userId string) error {
	return r.data.DB.WithContext(ctx).Where("id=?", id).Updates(model.TDataCatalogSearchTemplate{UpdatedByUID: userId, DeletedAt: 1}).Error
}

func (r *RepoImpl) GetSingleCatalogHistoryListByCondition(ctx context.Context, req *domain.GetSingleCatalogHistoryListReq, userId string) (total int64, singleCatalogTemplateList []*model.TDataCatalogSearchHistoryData, err error) {
	var db *gorm.DB
	db = r.data.DB.WithContext(ctx).Table("t_data_catalog_search_history t").Where("t.deleted_at=0").Joins("INNER JOIN t_data_catalog dc  ON t.data_catalog_id = dc.id") //deleted_at=0
	//db = db.Where("dc.deleted_at is null")
	db = db.Select("t.id as id, t.created_at as search_at, dc.id as data_catalog_id, dc.title as data_catalog_name, t.total_count, t.department_path as t_department_path, dc.department_id as d_department_id, t.type as type")

	if len(userId) > 0 {
		db = db.Where("t.created_by_uid = ?", userId)
	}

	keyword := req.Keyword
	if keyword != "" {
		if strings.Contains(keyword, "_") {
			keyword = strings.Replace(keyword, "_", "\\_", -1)
		}
		keyword = "%" + keyword + "%"
		db = db.Where("dc.title like ?", keyword)
	}
	err = db.Count(&total).Error
	limit := *req.Limit
	offset := limit * (*req.Offset - 1)
	if limit > 0 {
		db = db.Limit(limit).Offset(offset)
	}

	db = db.Order(fmt.Sprintf(" %s %s ", req.Sort, req.Direction))

	err = db.Find(&singleCatalogTemplateList).Error
	return total, singleCatalogTemplateList, err
}

func (r *RepoImpl) GetSingleCatalogHistoryDetail(ctx context.Context, id string) (singleCatalogHistory *model.TDataCatalogSearchHistory, err error) {
	err = r.data.DB.WithContext(ctx).Table(model.TableNameTDataCatalogSearchHistory).Where("id =? and deleted_at=0", id).Take(&singleCatalogHistory).Error
	return
}

func (r *RepoImpl) CreateSingleCatalogHistory(ctx context.Context, singleCatalogHistory *model.TDataCatalogSearchHistory) error {
	var count int64
	r.data.DB.WithContext(ctx).Table(model.TableNameTDataCatalogSearchHistory).Where("deleted_at = 0  and created_by_uid=?", singleCatalogHistory.CreatedByUID).Count(&count)

	if count >= 50 {

		var item model.TDataCatalogSearchHistory
		result := r.data.DB.WithContext(ctx).Table(model.TableNameTDataCatalogSearchHistory).Where("deleted_at = 0  and created_by_uid=?", singleCatalogHistory.CreatedByUID).Order("catalog_search_history_id desc").Offset(49).Limit(1).Find(&item)
		if result.Error != nil {
			return result.Error
		}

		update := r.data.DB.WithContext(ctx).Table(model.TableNameTDataCatalogSearchHistory).Where("catalog_search_history_id <= ? and deleted_at = 0 and created_by_uid=?", item.CatalogSearchHistoryID, singleCatalogHistory.CreatedByUID).Updates(model.TDataCatalogSearchTemplate{DeletedAt: 1})
		if update.Error != nil {
			return update.Error
		}
	}
	return r.data.DB.WithContext(ctx).Table(model.TableNameTDataCatalogSearchHistory).Create(singleCatalogHistory).Error
}

func (r *RepoImpl) CheckTemplateNameUnique(ctx context.Context, name string, userId string) (bool, error) {
	var count int64
	err := r.data.DB.WithContext(ctx).Table(model.TableNameTDataCatalogSearchTemplate).Where("deleted_at = 0  and name=? and created_by_uid = ?", name, userId).Count(&count).Error
	if err != nil {
		return false, err
	}
	if count > 0 {
		return true, nil
	}
	return false, nil
}
