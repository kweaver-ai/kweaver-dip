package impl

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/data_set"
	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
	"gorm.io/gorm"
)

type dataSetRepo struct {
	db *gorm.DB
}

func NewDataSetRepo(db *gorm.DB) data_set.DataSetRepo {
	return &dataSetRepo{db: db}
}

func (r *dataSetRepo) Db() *gorm.DB {
	return r.db
}

func (r *dataSetRepo) GetById(ctx context.Context, id string, tx ...*gorm.DB) (*model.DataSet, error) {
	var db *gorm.DB
	if len(tx) > 0 {
		db = tx[0]
	} else {
		db = r.db.WithContext(ctx)
	}
	var dataSet model.DataSet
	err := db.Where("id = ?", id).Where("deleted_at = 0").First(&dataSet).Error
	if err != nil {
		return nil, err
	}
	return &dataSet, nil
}

func (r *dataSetRepo) Create(ctx context.Context, dataSet *model.DataSet) (id string, err error) {
	err = r.db.WithContext(ctx).Create(dataSet).Error
	if err != nil {
		return "", err
	}
	return dataSet.ID, nil
}

func (r *dataSetRepo) Update(ctx context.Context, dataSet *model.DataSet) error {
	return r.db.WithContext(ctx).Where("id = ?", dataSet.ID).Where("deleted_at = 0").Updates(dataSet).Error
}

func (r *dataSetRepo) Delete(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).
		Model(&model.DataSet{}).
		Where("id = ?", id).
		Where("deleted_at = 0").
		Update("deleted_at", time.Now().Unix()).
		Error
}

func (r *dataSetRepo) PageList(ctx context.Context, sort string, direction string, keyword string, limit, offset int, user string) (total int64, dataSets []*model.DataSet, err error) {
	db := r.db.WithContext(ctx).Model(&model.DataSet{}).Where("deleted_at = 0")
	if keyword != "" {
		keyword = strings.Replace(keyword, "_", "\\_", -1)
		keyword = "%" + keyword + "%"
		db = db.Where("data_set_name like ?", keyword)
	}
	if user != "" {
		db = db.Where("created_by_uid = ?", user)
	}
	err = db.Count(&total).Error
	if err != nil {
		return total, dataSets, err
	}
	offset = limit * (offset - 1)
	err = db.Order(fmt.Sprintf(" %s %s ", sort, direction)).Limit(limit).Offset(offset).Find(&dataSets).Error
	return total, dataSets, err
}

// 修改 GetByName 方法
func (r *dataSetRepo) GetByName(ctx context.Context, name string) (*model.DataSet, error) {
	var dataSet model.DataSet
	err := r.db.WithContext(ctx).Where("data_set_name = ? AND deleted_at = 0", name).First(&dataSet).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &dataSet, nil
}

func (r *dataSetRepo) GetByNameCount(ctx context.Context, name string, id string) (*int64, error) {
	var count int64
	query := r.db.WithContext(ctx).Table("data_set").Where("data_set_name = ? AND deleted_at = 0 and id != ? ", name, id)
	fmt.Println(query.Statement.SQL.String()) // 打印生成的 SQL
	err := query.Count(&count).Error
	if err != nil {
		return nil, err
	}
	return &count, nil
}

// 新增 GetFormViewDetailsByDataSetId 方法
func (r *dataSetRepo) GetFormViewDetailsByDataSetId(ctx context.Context, dataSetId string, limit, offset int) ([]model.FormView, int64, error) {
	var formViews []model.FormView
	var totalCount int64

	// 计算 offset
	offset = (offset - 1) * limit

	db := r.db.WithContext(ctx).
		Table("data_set_view_relation a").
		Select("b.business_name, b.technical_name, b.subject_id, b.department_id, a.updated_at")

	// 添加 JOIN 条件
	db = db.Joins("INNER JOIN form_view b ON a.form_view_id = b.id")

	// 添加 WHERE 条件
	db = db.Where("b.deleted_at = 0")

	// 如果 dataSetId 不为空，则添加 data_set_id 过滤条件
	/*if dataSetId != "" {
		db = db.Where("a.id = ?", dataSetId)
	}*/

	// 如果 limit 和 offset 有效，则添加分页条件
	if limit > 0 {
		db = db.Limit(limit).Offset(offset)
	}

	err := db.Order("a.updated_at DESC").Find(&formViews).Error
	if err != nil {
		return nil, 0, fmt.Errorf("query form views failed: %w", err)
	}

	// 获取总数
	db = r.db.WithContext(ctx).
		Table("data_set_view_relation a")

	// 添加 JOIN 条件
	db = db.Joins("INNER JOIN form_view b ON a.form_view_id = b.id")

	// 添加 WHERE 条件
	db = db.Where("b.deleted_at = 0")

	// 如果 dataSetId 不为空，则添加 data_set_id 过滤条件
	if dataSetId != "" {
		db = db.Where("a.id = ?", dataSetId)
	}

	err = db.Count(&totalCount).Error
	if err != nil {
		return nil, 0, fmt.Errorf("count form views failed: %w", err)
	}

	return formViews, totalCount, nil
}

func (r *dataSetRepo) GetAllDataSets(ctx context.Context) ([]model.DataSet, error) {
	var dataSets []model.DataSet
	err := r.db.WithContext(ctx).Where("deleted_at = 0").Find(&dataSets).Error
	if err != nil {
		return nil, err
	}
	return dataSets, nil
}

func (r *dataSetRepo) GetViewsByDataSetId(ctx context.Context, dataSetId string) ([]model.FormView, error) {
	var views []model.FormView
	err := r.Db().Unscoped().
		Table("data_set_view_relation a").
		Joins("INNER JOIN form_view b ON a.form_view_id = b.id").
		Where("a.id = ? AND b.deleted_at = 0", dataSetId).
		Select("b.business_name, b.technical_name, b.id, b.uniform_catalog_code, a.updated_at").
		Find(&views).Error
	return views, err
}
