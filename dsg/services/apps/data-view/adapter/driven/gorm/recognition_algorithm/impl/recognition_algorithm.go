package impl

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/recognition_algorithm"
	domain "github.com/kweaver-ai/dsg/services/apps/data-view/domain/recognition_algorithm"
	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
	"gorm.io/gorm"
)

type recognitionAlgorithmRepo struct {
	db *gorm.DB
}

func NewRecognitionAlgorithmRepo(db *gorm.DB) recognition_algorithm.RecognitionAlgorithmRepo {
	return &recognitionAlgorithmRepo{db: db}
}

func (r *recognitionAlgorithmRepo) Db() *gorm.DB {
	return r.db
}

func (r *recognitionAlgorithmRepo) GetById(ctx context.Context, id string, tx ...*gorm.DB) (*model.RecognitionAlgorithm, error) {
	var db *gorm.DB
	if len(tx) > 0 {
		db = tx[0]
	} else {
		db = r.db.WithContext(ctx)
	}
	var algorithm model.RecognitionAlgorithm
	err := db.Where("id = ?", id).Where("deleted_at = 0").First(&algorithm).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &algorithm, nil
}

func (r *recognitionAlgorithmRepo) GetByIds(ctx context.Context, ids []string, tx ...*gorm.DB) ([]*model.RecognitionAlgorithm, error) {
	var db *gorm.DB
	if len(tx) > 0 {
		db = tx[0]
	} else {
		db = r.db.WithContext(ctx)
	}
	var algorithms []*model.RecognitionAlgorithm
	err := db.Where("id IN ?", ids).Where("deleted_at = 0").Find(&algorithms).Error
	if err != nil {
		return nil, err
	}
	return algorithms, nil
}

func (r *recognitionAlgorithmRepo) Create(ctx context.Context, algo *model.RecognitionAlgorithm) (string, error) {
	err := r.db.WithContext(ctx).Create(algo).Error
	if err != nil {
		return "", err
	}
	return algo.ID, nil
}

func (r *recognitionAlgorithmRepo) Update(ctx context.Context, algo *model.RecognitionAlgorithm) error {
	return r.db.WithContext(ctx).Where("id = ?", algo.ID).Where("deleted_at = 0").Updates(algo).Error
}

// UpdateStatus 更新识别算法状态
func (r *recognitionAlgorithmRepo) UpdateStatus(ctx context.Context, id string, status int32) error {
	return r.db.WithContext(ctx).
		Model(&model.RecognitionAlgorithm{}).
		Where("id = ?", id).
		Where("deleted_at = 0").
		Update("status", status).
		Error
}

func (r *recognitionAlgorithmRepo) Delete(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).
		Model(&model.RecognitionAlgorithm{}).
		Where("id = ?", id).
		Where("deleted_at = 0").
		Update("deleted_at", time.Now().Unix()).
		Error
}

func (r *recognitionAlgorithmRepo) DeleteBatch(ctx context.Context, ids []string) error {
	return r.db.WithContext(ctx).
		Model(&model.RecognitionAlgorithm{}).
		Where("id IN ?", ids).
		Where("deleted_at = 0").
		Update("deleted_at", time.Now().Unix()).
		Error
}

func (r *recognitionAlgorithmRepo) PageList(ctx context.Context, req *domain.PageListRecognitionAlgorithmReq) (total int64, recognitionAlgorithms []*model.RecognitionAlgorithm, err error) {
	db := r.db.WithContext(ctx).Model(&model.RecognitionAlgorithm{}).Where("deleted_at = 0")

	// 处理关键字搜索
	keyword := req.Keyword
	if keyword != "" {
		keyword = strings.Replace(keyword, "_", "\\_", -1)
		keyword = "%" + keyword + "%"
		db = db.Where("name LIKE ?", keyword)
	}

	//处理状态
	if req.Status != "" {
		db = db.Where("status = ?", req.Status)
	}

	// 内置模板这条数据不显示
	if req.TrimDefault {
		db = db.Where("recognition_algorithm_id > 1")
	}

	// 统计总数
	err = db.Count(&total).Error
	if err != nil {
		return 0, nil, err
	}

	// 处理分页
	limit := 20
	offset := 0
	if req.Limit != nil {
		limit = *req.Limit
	}
	if req.Offset != nil {
		offset = limit * (*req.Offset - 1)
	}

	if limit > 0 {
		db = db.Limit(limit).Offset(offset)
	}

	// 处理排序
	if req.Sort != "" {
		if req.Sort == "name" {
			db = db.Order(fmt.Sprintf("name %s", req.Direction))
		} else {
			db = db.Order(fmt.Sprintf("%s %s", req.Sort, req.Direction))
		}
	} else {
		// 默认按创建时间降序排列
		db = db.Order("created_at DESC")
	}

	// 获取数据
	err = db.Find(&recognitionAlgorithms).Error
	return total, recognitionAlgorithms, err
}

func (r *recognitionAlgorithmRepo) GetInnerType(ctx context.Context, innerType string) ([]*model.RecognitionAlgorithm, error) {
	var algorithms []*model.RecognitionAlgorithm
	var err error
	if innerType != "" {
		err = r.db.WithContext(ctx).Where("deleted_at = 0").Where("type = ?", "inner").Where("inner_type = ?", innerType).Find(&algorithms).Error
	} else {
		err = r.db.WithContext(ctx).Where("deleted_at = 0").Where("type = ?", "inner").Where("inner_type != ?", "默认").Find(&algorithms).Error
	}
	if err != nil {
		return nil, err
	}
	return algorithms, nil
}

func (r *recognitionAlgorithmRepo) DuplicateCheck(ctx context.Context, name string, id string) (bool, error) {
	var count int64
	var err error
	if id != "" {
		err = r.db.WithContext(ctx).Model(&model.RecognitionAlgorithm{}).Where("deleted_at = 0").Where("name = ?", name).Where("id != ?", id).Count(&count).Error
	} else {
		err = r.db.WithContext(ctx).Model(&model.RecognitionAlgorithm{}).Where("deleted_at = 0").Where("name = ?", name).Count(&count).Error
	}
	if err != nil {
		return false, err
	}
	return count > 0, nil
}
