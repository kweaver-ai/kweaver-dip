package impl

import (
	"context"
	"fmt"
	"strings"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/classify"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"gorm.io/gorm"
)

type ClassifyRepo struct {
	db *gorm.DB
}

func NewClassifyRepo(db *gorm.DB) classify.ClassifyRepo {
	return &ClassifyRepo{db: db}
}

func (r *ClassifyRepo) Create(ctx context.Context, classify *model.Classify) error {
	return r.db.WithContext(ctx).Create(classify).Error
}
func (r *ClassifyRepo) CreateInBatches(ctx context.Context, classify []*model.Classify) error {
	return r.db.WithContext(ctx).CreateInBatches(classify, len(classify)).Error
}

func (r *ClassifyRepo) GetClassifyByID(ctx context.Context, id string) (*model.Classify, error) {
	var classify model.Classify
	if err := r.db.Where("classify_id =?", id).First(&classify).Error; err != nil {
		return nil, err
	}
	return &classify, nil
}
func (r *ClassifyRepo) GetClassifyByParentID(ctx context.Context, parentID string) ([]*model.Classify, error) {
	tx := r.db.WithContext(ctx).Where("parent_id =?", parentID)
	var classifies []*model.Classify
	if err := tx.Find(&classifies).Error; err != nil {
		return nil, err
	}
	return classifies, nil
}

func (r *ClassifyRepo) GetClassifyByPathID(ctx context.Context, pathId string) ([]*model.Classify, error) {
	var classifies []*model.Classify
	if err := r.db.WithContext(ctx).Where("path_id  like ? ", fmt.Sprintf("%s%", pathId)).Find(&classifies).Error; err != nil {
		return nil, err
	}
	return classifies, nil
}

// UpdateClassify 更新分类
func (r *ClassifyRepo) UpdateClassify(ctx context.Context, classify *model.Classify) error {
	return r.db.WithContext(ctx).Save(classify).Error
}

// DeleteClassify 删除分类
func (r *ClassifyRepo) DeleteClassify(ctx context.Context, id int) error {
	return r.db.WithContext(ctx).Where("classify_id =?", id).Delete(&model.Classify{}).Error
}

func (r *ClassifyRepo) ListClassifies(ctx context.Context, keyword string) ([]*model.Classify, error) {
	tx := r.db.WithContext(ctx).Table(model.TableNameClassify)
	if keyword != "" {
		if strings.Contains(keyword, "_") {
			keyword = strings.Replace(keyword, "_", "\\_", -1)
		}
		keyword = "%" + keyword + "%"
		tx = tx.Where("name like ? ", keyword)
	}
	var classifies []*model.Classify
	if err := tx.Find(&classifies).Error; err != nil {
		return nil, err
	}
	return classifies, nil
}

func (r *ClassifyRepo) Truncate(ctx context.Context) error {
	return r.db.WithContext(ctx).Exec("TRUNCATE " + model.TableNameClassify).Error
}
func (r *ClassifyRepo) GetAll(ctx context.Context) ([]*model.Classify, error) {
	var classifies []*model.Classify
	err := r.db.WithContext(ctx).Find(&classifies).Error
	return classifies, err
}
