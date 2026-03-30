package impl

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/classification_rule"
	domain "github.com/kweaver-ai/dsg/services/apps/data-view/domain/classification_rule"
	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
	"gorm.io/gorm"
)

type classificationRuleRepo struct {
	db *gorm.DB
}

func NewClassificationRuleRepo(db *gorm.DB) classification_rule.ClassificationRuleRepo {
	return &classificationRuleRepo{db: db}
}

func (r *classificationRuleRepo) Db() *gorm.DB {
	return r.db
}

func (r *classificationRuleRepo) GetById(ctx context.Context, id string, tx ...*gorm.DB) (*model.ClassificationRule, error) {
	var db *gorm.DB
	if len(tx) > 0 {
		db = tx[0]
	} else {
		db = r.db.WithContext(ctx)
	}
	var rule model.ClassificationRule
	err := db.Where("id = ?", id).Where("deleted_at = 0").First(&rule).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &rule, nil
}

func (r *classificationRuleRepo) GetByIds(ctx context.Context, ids []string, tx ...*gorm.DB) ([]*model.ClassificationRule, error) {
	var db *gorm.DB
	if len(tx) > 0 {
		db = tx[0]
	} else {
		db = r.db.WithContext(ctx)
	}
	var rules []*model.ClassificationRule
	err := db.Where("id IN (?)", ids).Where("deleted_at = 0").Where("type != ?", "inner").Find(&rules).Error
	if err != nil {
		return nil, err
	}
	return rules, nil
}

func (r *classificationRuleRepo) Create(ctx context.Context, rule *model.ClassificationRule) (string, error) {
	err := r.db.WithContext(ctx).Create(rule).Error
	if err != nil {
		return "", err
	}
	return rule.ID, nil
}

func (r *classificationRuleRepo) Update(ctx context.Context, rule *model.ClassificationRule) error {
	return r.db.WithContext(ctx).Where("id = ?", rule.ID).Where("deleted_at = 0").Updates(rule).Error
}

// UpdateStatus 更新分类规则状态
func (r *classificationRuleRepo) UpdateStatus(ctx context.Context, id string, status int32) error {
	return r.db.WithContext(ctx).
		Model(&model.ClassificationRule{}).
		Where("id = ?", id).
		Where("deleted_at = 0").
		Update("status", status).
		Error
}

func (r *classificationRuleRepo) Delete(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).
		Model(&model.ClassificationRule{}).
		Where("id = ?", id).
		Where("deleted_at = 0").
		Update("deleted_at", time.Now().Unix()).
		Error
}

func (r *classificationRuleRepo) PageList(ctx context.Context, req *domain.PageListClassificationRuleReq) (total int64, rules []*model.ClassificationRule, err error) {
	db := r.db.WithContext(ctx).Model(&model.ClassificationRule{}).Where("deleted_at = 0").Where("type != ?", "inner")

	// 处理关键字搜索
	keyword := req.Keyword
	if keyword != "" {
		keyword = strings.Replace(keyword, "_", "\\_", -1)
		keyword = "%" + keyword + "%"
		db = db.Where("name LIKE ? OR description LIKE ?", keyword, keyword)
	}

	// 处理分类属性ID筛选
	if req.SubjectID != "" {
		db = db.Where("subject_id = ?", req.SubjectID)
	}

	// 统计总数
	err = db.Count(&total).Error
	if err != nil {
		return 0, nil, err
	}

	// 处理分页
	limit := 100
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
			db = db.Order(fmt.Sprintf(" name %s", req.Direction))
		} else {
			db = db.Order(fmt.Sprintf("%s %s", req.Sort, req.Direction))
		}
	} else {
		// 默认按创建时间降序排列
		db = db.Order("created_at DESC")
	}

	// 获取数据
	err = db.Find(&rules).Error
	return total, rules, err
}
