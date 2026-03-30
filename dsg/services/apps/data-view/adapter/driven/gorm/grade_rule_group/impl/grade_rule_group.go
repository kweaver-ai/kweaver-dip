package impl

import (
	"context"
	"errors"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/grade_rule_group"
	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
	"gorm.io/gorm"
)

type gradeRuleGroupRepo struct {
	db *gorm.DB
}

func NewGradeRuleGroupRepo(db *gorm.DB) grade_rule_group.GradeRuleGroupRepo {
	return &gradeRuleGroupRepo{db: db}
}

func (r *gradeRuleGroupRepo) Db() *gorm.DB {
	return r.db
}

func (r *gradeRuleGroupRepo) List(ctx context.Context, businessObjId string) ([]*model.GradeRuleGroup, error) {
	result := make([]*model.GradeRuleGroup, 0)
	err := r.db.WithContext(ctx).Model(&model.GradeRuleGroup{}).
		Where("business_object_id = ?", businessObjId).
		Where("deleted_at = 0").
		Find(&result).Error
	if err != nil {
		return nil, err
	}
	return result, nil
}

func (r *gradeRuleGroupRepo) Create(ctx context.Context, group *model.GradeRuleGroup) (string, error) {
	err := r.db.WithContext(ctx).Model(&model.GradeRuleGroup{}).Create(group).Error
	if err != nil {
		return "", err
	}
	return group.ID, nil
}

func (r *gradeRuleGroupRepo) Update(ctx context.Context, group *model.GradeRuleGroup) error {
	err := r.db.WithContext(ctx).Model(&model.GradeRuleGroup{}).Where("id = ?", group.ID).Updates(map[string]interface{}{
		"name":        group.Name,
		"description": group.Description,
	}).Error
	if err != nil {
		return err
	}
	return nil
}

func (r *gradeRuleGroupRepo) Delete(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Model(&model.GradeRuleGroup{}).Where("id = ?", id).Where("deleted_at = 0").Update("deleted_at", time.Now().Unix()).Error
}

func (r *gradeRuleGroupRepo) Repeat(ctx context.Context, businessObjID string, id string, name string) (bool, error) {
	db := r.db.WithContext(ctx)
	if id != "" {
		db = db.Where("id <> ? ", id)
	}
	err := db.Where("business_object_id = ?", businessObjID).Where("name = ?", name).Where("deleted_at = 0").First(&model.GradeRuleGroup{}).Error
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return false, err
	}

	return err == nil, nil
}

func (r *gradeRuleGroupRepo) Details(ctx context.Context, ids []string) ([]*model.GradeRuleGroup, error) {
	result := make([]*model.GradeRuleGroup, 0)
	err := r.db.WithContext(ctx).Model(&model.GradeRuleGroup{}).Where("id in ?", ids).Where("deleted_at = 0").Find(&result).Error
	if err != nil {
		return nil, err
	}
	return result, nil
}

func (r *gradeRuleGroupRepo) Limited(ctx context.Context, businessObjID string, max int64) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&model.GradeRuleGroup{}).
		Where("business_object_id = ?", businessObjID).
		Where("deleted_at = 0").
		Count(&count).Error
	if err != nil {
		return false, err
	}
	if count >= max {
		return true, nil
	}
	return false, nil
}
