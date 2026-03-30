package impl

import (
	"context"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/data_privacy_policy_field"
	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
	"gorm.io/gorm"
)

type dataPrivacyPolicyFieldRepo struct {
	db *gorm.DB
}

func NewDataPrivacyPolicyFieldRepo(db *gorm.DB) data_privacy_policy_field.DataPrivacyPolicyFieldRepo {
	return &dataPrivacyPolicyFieldRepo{db: db}
}
func (r *dataPrivacyPolicyFieldRepo) Db() *gorm.DB {
	return r.db
}

func (r *dataPrivacyPolicyFieldRepo) GetFieldsByDataPrivacyPolicyId(ctx context.Context, dataPrivacyPolicyId string) (dataPrivacyPolicyField []*model.DataPrivacyPolicyField, err error) {
	var db *gorm.DB
	db = r.db.WithContext(ctx).Table(model.TableNameDataPrivacyPolicyField).Where("deleted_at=0")
	db = db.Where("data_privacy_policy_id = ?", dataPrivacyPolicyId)
	err = db.Find(&dataPrivacyPolicyField).Error
	return
}

func (r *dataPrivacyPolicyFieldRepo) GetFieldsByDataPrivacyPolicyIds(ctx context.Context, dataPrivacyPolicyIds []string) (dataPrivacyPolicyField []*model.DataPrivacyPolicyField, err error) {
	var db *gorm.DB
	db = r.db.WithContext(ctx).Table(model.TableNameDataPrivacyPolicyField).Where("deleted_at=0")
	db = db.Where("data_privacy_policy_id in ?", dataPrivacyPolicyIds)
	err = db.Find(&dataPrivacyPolicyField).Error
	return
}

func (r *dataPrivacyPolicyFieldRepo) DeleteByPolicyID(ctx context.Context, policyID string) error {
	return r.db.WithContext(ctx).Model(&model.DataPrivacyPolicyField{}).Where("data_privacy_policy_id = ?", policyID).Update("deleted_at", time.Now().Unix()).Error
}

func (r *dataPrivacyPolicyFieldRepo) CreateBatch(ctx context.Context, policyID string, dataPrivacyPolicyFields []*model.DataPrivacyPolicyField) (fieldIds []string, err error) {
	err = r.DeleteByPolicyID(ctx, policyID)
	if err != nil {
		return nil, err
	}
	err = r.db.WithContext(ctx).CreateInBatches(dataPrivacyPolicyFields, len(dataPrivacyPolicyFields)).Error
	if err != nil {
		return nil, err
	}
	for _, field := range dataPrivacyPolicyFields {
		fieldIds = append(fieldIds, field.ID)
	}
	return
}

func (r *dataPrivacyPolicyFieldRepo) GetFieldPolicyByFieldId(ctx context.Context, fieldId string) (dataPrivacyPolicyField *model.DataPrivacyPolicyField, err error) {
	err = r.db.WithContext(ctx).Table(model.TableNameDataPrivacyPolicyField).Where("deleted_at=0").Where("form_view_field_id = ?", fieldId).First(&dataPrivacyPolicyField).Error
	return
}

func (r *dataPrivacyPolicyFieldRepo) DeleteByRuleID(ctx context.Context, ruleID string) error {
	return r.db.WithContext(ctx).Model(&model.DataPrivacyPolicyField{}).Where("desensitization_rule_id = ?", ruleID).Update("desensitization_rule_id", "").Error
}
