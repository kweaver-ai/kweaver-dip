package data_privacy_policy_field

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
)

type DataPrivacyPolicyFieldRepo interface {
	GetFieldsByDataPrivacyPolicyId(ctx context.Context, dataPrivacyPolicyId string) (dataPrivacyPolicyField []*model.DataPrivacyPolicyField, err error)
	GetFieldsByDataPrivacyPolicyIds(ctx context.Context, dataPrivacyPolicyIds []string) (dataPrivacyPolicyField []*model.DataPrivacyPolicyField, err error)
	CreateBatch(ctx context.Context, policyID string, dataPrivacyPolicyFields []*model.DataPrivacyPolicyField) (fieldIds []string, err error)
	DeleteByPolicyID(ctx context.Context, policyID string) error
	DeleteByRuleID(ctx context.Context, ruleID string) error
	GetFieldPolicyByFieldId(ctx context.Context, fieldId string) (dataPrivacyPolicyField *model.DataPrivacyPolicyField, err error)
}
