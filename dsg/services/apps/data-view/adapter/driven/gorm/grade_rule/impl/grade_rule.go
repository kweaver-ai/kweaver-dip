package impl

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/grade_rule"
	domain "github.com/kweaver-ai/dsg/services/apps/data-view/domain/grade_rule"
	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
	"gorm.io/gorm"
)

type gradeRuleRepo struct {
	db *gorm.DB
}

func NewGradeRuleRepo(db *gorm.DB) grade_rule.GradeRuleRepo {
	return &gradeRuleRepo{db: db}
}

func (r *gradeRuleRepo) Db() *gorm.DB {
	return r.db
}

func (r *gradeRuleRepo) GetById(ctx context.Context, id string, tx ...*gorm.DB) (*model.GradeRule, error) {
	var db *gorm.DB
	if len(tx) > 0 {
		db = tx[0]
	} else {
		db = r.db.WithContext(ctx)
	}
	var rule model.GradeRule
	err := db.Where("id = ?", id).Where("deleted_at = 0").First(&rule).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &rule, nil
}

func (r *gradeRuleRepo) GetByIds(ctx context.Context, ids []string, tx ...*gorm.DB) ([]*model.GradeRule, error) {
	var db *gorm.DB
	if len(tx) > 0 {
		db = tx[0]
	} else {
		db = r.db.WithContext(ctx)
	}
	var rules []*model.GradeRule
	err := db.Where("id IN (?)", ids).Where("deleted_at = 0").Where("type != ?", "inner").Find(&rules).Error
	if err != nil {
		return nil, err
	}
	return rules, nil
}

func (r *gradeRuleRepo) GetByGroupIds(ctx context.Context, businessObjID string, groupIds []string, tx ...*gorm.DB) ([]*model.GradeRule, error) {
	var db *gorm.DB
	if len(tx) > 0 {
		db = tx[0]
	} else {
		db = r.db.WithContext(ctx)
	}
	var rules []*model.GradeRule
	err := db.Where("subject_id = ?", businessObjID).Where("group_id IN (?)", groupIds).Where("deleted_at = 0").Where("type != ?", "inner").Find(&rules).Error
	if err != nil {
		return nil, err
	}
	return rules, nil
}

func (r *gradeRuleRepo) Create(ctx context.Context, rule *model.GradeRule) (string, error) {
	err := r.db.WithContext(ctx).Create(rule).Error
	if err != nil {
		return "", err
	}
	return rule.ID, nil
}

func (r *gradeRuleRepo) Update(ctx context.Context, rule *model.GradeRule) error {
	return r.db.WithContext(ctx).Where("id = ?", rule.ID).Where("deleted_at = 0").Select("*").Updates(rule).Error
}

// UpdateStatus 更新分级规则状态
func (r *gradeRuleRepo) UpdateStatus(ctx context.Context, id string, status int32) error {
	return r.db.WithContext(ctx).
		Model(&model.GradeRule{}).
		Where("id = ?", id).
		Where("deleted_at = 0").
		Update("status", status).
		Error
}

func (r *gradeRuleRepo) Delete(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).
		Model(&model.GradeRule{}).
		Where("id = ?", id).
		Where("deleted_at = 0").
		Update("deleted_at", time.Now().Unix()).
		Error
}

func (r *gradeRuleRepo) PageList(ctx context.Context, req *domain.PageListGradeRuleReq) (total int64, rules []*model.GradeRule, err error) {
	db := r.db.WithContext(ctx).Model(&model.GradeRule{}).Where("deleted_at = 0").Where("type != ?", "inner")

	// 处理关键字搜索
	keyword := req.Keyword
	if keyword != "" {
		keyword = strings.Replace(keyword, "_", "\\_", -1)
		keyword = "%" + keyword + "%"
		db = db.Where("name LIKE ? OR description LIKE ?", keyword, keyword)
	}

	// 处理分级属性ID筛选
	if req.SubjectID != "" {
		db = db.Where("subject_id = ?", req.SubjectID)
	}

	// 处理分级标签ID筛选
	if req.LabelID != "" {
		db = db.Where("label_id = ?", req.LabelID)
	}

	// 规则组ID筛选-指定分组
	if req.GroupID != nil && *req.GroupID != "" {
		db = db.Where("group_id = ?", req.GroupID)
	}

	// 规则组ID筛选-未分组
	if req.GroupID != nil && *req.GroupID == "" {
		db = db.Where("group_id = ''")
	}

	// 统计总数
	err = db.Count(&total).Error
	if err != nil {
		return 0, nil, err
	}

	// 处理分页
	limit := 10
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
	err = db.Find(&rules).Error
	return total, rules, err
}

// GetBySubjectId 根据主题ID获取分级规则记录
func (r *gradeRuleRepo) GetBySubjectId(ctx context.Context, subjectId string) ([]*model.GradeRule, error) {
	var rules []*model.GradeRule
	err := r.db.WithContext(ctx).
		Where("subject_id = ?", subjectId).
		Where("deleted_at = 0").
		Find(&rules).Error
	if err != nil {
		return nil, err
	}
	return rules, nil
}

// GetBySubjectIds 根据主题ID数组获取分级规则记录
func (r *gradeRuleRepo) GetBySubjectIds(ctx context.Context, subjectIds []string) ([]*model.GradeRule, error) {
	var rules []*model.GradeRule
	err := r.db.WithContext(ctx).
		Where("subject_id IN (?)", subjectIds).
		Where("deleted_at = 0").
		Find(&rules).Error
	if err != nil {
		return nil, err
	}
	return rules, nil
}

// GetByLabelId 根据标签ID获取分级规则记录
func (r *gradeRuleRepo) GetByLabelId(ctx context.Context, labelId string) ([]*model.GradeRule, error) {
	var rules []*model.GradeRule
	err := r.db.WithContext(ctx).
		Where("label_id = ?", labelId).
		Where("deleted_at = 0").
		Find(&rules).Error
	if err != nil {
		return nil, err
	}
	return rules, nil
}

// GetWorkingRules 获取所有启用的分级规则
func (r *gradeRuleRepo) GetWorkingRules(ctx context.Context) ([]*model.GradeRule, error) {
	var rules []*model.GradeRule
	err := r.db.WithContext(ctx).
		Where("status = ?", 1).
		Where("deleted_at = 0").
		Find(&rules).Error
	if err != nil {
		return nil, err
	}
	return rules, nil
}

// GetCount 获取分级规则数量
func (r *gradeRuleRepo) GetCount(ctx context.Context) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&model.GradeRule{}).
		Where("deleted_at = 0").
		Count(&count).Error
	if err != nil {
		return 0, err
	}
	return count, nil
}

func (r *gradeRuleRepo) BindGroup(ctx context.Context, ruleIds []string, groupId string) error {
	return r.db.WithContext(ctx).Model(&model.GradeRule{}).Where("id IN (?)", ruleIds).Updates(map[string]interface{}{
		"group_id": groupId,
	}).Error
}

func (r *gradeRuleRepo) BatchDelete(ctx context.Context, ids []string) error {
	return r.db.WithContext(ctx).Model(&model.GradeRule{}).
		Where("id IN (?)", ids).
		Where("deleted_at = 0").
		Update("deleted_at", time.Now().Unix()).Error
}
