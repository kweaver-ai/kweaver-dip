package impl

import (
	"context"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/classification_rule_algorithm_relation"
	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
	"gorm.io/gorm"
)

type classificationRuleAlgorithmRelationRepo struct {
	db *gorm.DB
}

func NewClassificationRuleAlgorithmRelationRepo(db *gorm.DB) classification_rule_algorithm_relation.ClassificationRuleAlgorithmRelationRepo {
	return &classificationRuleAlgorithmRelationRepo{db: db}
}

func (r *classificationRuleAlgorithmRelationRepo) Db() *gorm.DB {
	return r.db
}

func (r *classificationRuleAlgorithmRelationRepo) GetById(ctx context.Context, id string, tx ...*gorm.DB) (*model.ClassificationRuleAlgorithmRelation, error) {
	var db *gorm.DB
	if len(tx) > 0 {
		db = tx[0]
	} else {
		db = r.db.WithContext(ctx)
	}
	var relation model.ClassificationRuleAlgorithmRelation
	err := db.Where("id = ?", id).Where("deleted_at = 0").First(&relation).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &relation, nil
}

func (r *classificationRuleAlgorithmRelationRepo) Create(ctx context.Context, relation *model.ClassificationRuleAlgorithmRelation) (string, error) {
	err := r.db.WithContext(ctx).Create(relation).Error
	if err != nil {
		return "", err
	}
	return relation.ID, nil
}

func (r *classificationRuleAlgorithmRelationRepo) Update(ctx context.Context, relation *model.ClassificationRuleAlgorithmRelation) error {
	return r.db.WithContext(ctx).Where("id = ?", relation.ID).Where("deleted_at = 0").Updates(relation).Error
}

func (r *classificationRuleAlgorithmRelationRepo) Delete(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).
		Model(&model.ClassificationRuleAlgorithmRelation{}).
		Where("id = ?", id).
		Where("deleted_at = 0").
		Update("deleted_at", time.Now().Unix()).
		Error
}

func (r *classificationRuleAlgorithmRelationRepo) GetByRuleId(ctx context.Context, ruleId string) ([]*model.ClassificationRuleAlgorithmRelation, error) {
	var relations []*model.ClassificationRuleAlgorithmRelation
	err := r.db.WithContext(ctx).
		Where("classification_rule_id = ?", ruleId).
		Where("deleted_at = 0").
		Find(&relations).Error
	if err != nil {
		return nil, err
	}
	return relations, nil
}

func (r *classificationRuleAlgorithmRelationRepo) BatchCreate(ctx context.Context, relations []*model.ClassificationRuleAlgorithmRelation) error {
	return r.db.WithContext(ctx).Create(relations).Error
}

func (r *classificationRuleAlgorithmRelationRepo) BatchDeleteByRuleId(ctx context.Context, ruleId string) error {
	return r.db.WithContext(ctx).
		Model(&model.ClassificationRuleAlgorithmRelation{}).
		Where("classification_rule_id = ?", ruleId).
		Where("deleted_at = 0").
		Update("deleted_at", time.Now().Unix()).
		Error
}

func (r *classificationRuleAlgorithmRelationRepo) BatchDeleteByAlgorithmId(ctx context.Context, algorithmId string) error {
	return r.db.WithContext(ctx).
		Model(&model.ClassificationRuleAlgorithmRelation{}).
		Where("recognition_algorithm_id = ?", algorithmId).
		Where("deleted_at = 0").
		Update("deleted_at", time.Now().Unix()).
		Error
}

func (r *classificationRuleAlgorithmRelationRepo) BatchDeleteByRuleIds(ctx context.Context, ruleIds []string) error {
	return r.db.WithContext(ctx).
		Model(&model.ClassificationRuleAlgorithmRelation{}).
		Where("classification_rule_id IN ?", ruleIds).
		Where("deleted_at = 0").
		Update("deleted_at", time.Now().Unix()).
		Error
}

func (r *classificationRuleAlgorithmRelationRepo) BatchDeleteByAlgorithmIds(ctx context.Context, algorithmIds []string) error {
	return r.db.WithContext(ctx).
		Model(&model.ClassificationRuleAlgorithmRelation{}).
		Where("recognition_algorithm_id IN ?", algorithmIds).
		Where("deleted_at = 0").
		Update("deleted_at", time.Now().Unix()).
		Error
}

func (r *classificationRuleAlgorithmRelationRepo) GetWorkingAlgorithmByAlgorithmIds(ctx context.Context, algorithmIds []string) ([]*model.ClassificationRuleAlgorithmRelation, error) {
	var relations []*model.ClassificationRuleAlgorithmRelation
	err := r.db.WithContext(ctx).
		Where("recognition_algorithm_id IN ?", algorithmIds).
		Where("deleted_at = 0").
		Find(&relations).Error
	if err != nil {
		return nil, err
	}
	return relations, nil
}

func (r *classificationRuleAlgorithmRelationRepo) GetWorkingAlgorithmByRuleIds(ctx context.Context, ruleIds []string) ([]*model.ClassificationRuleAlgorithmRelation, error) {
	var relations []*model.ClassificationRuleAlgorithmRelation
	err := r.db.WithContext(ctx).
		Where("classification_rule_id IN ?", ruleIds).
		Where("deleted_at = 0").
		Find(&relations).Error
	if err != nil {
		return nil, err
	}
	return relations, nil
}
