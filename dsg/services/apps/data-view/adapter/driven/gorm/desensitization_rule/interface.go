package desensitization_rule

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-view/domain/form_view"
	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
)

type DesensitizationRuleRepo interface {
	GetByID(ctx context.Context, id string) (desensitizationRule *model.DesensitizationRule, err error)
	GetByIds(ctx context.Context, ids []string) (desensitizationRules []*model.DesensitizationRule, err error)
	GetDesensitizationRuleList(ctx context.Context) (desensitizationRule []*model.DesensitizationRule, err error)
	GetDesensitizationRuleListByCondition(ctx context.Context, req *form_view.GetDesensitizationRuleListReq) (total int64, desensitizationRule []*model.DesensitizationRule, err error)
	GetDesensitizationRuleDetail(ctx context.Context, id string) (desensitizationRule *model.DesensitizationRule, err error)
	CreateDesensitizationRule(ctx context.Context, desensitizationRule *model.DesensitizationRule) error
	UpdateDesensitizationRule(ctx context.Context, desensitizationRule *model.DesensitizationRule) error
	DeleteDesensitizationRule(ctx context.Context, id string, userid string) error
	GetDesensitizationRuleListByIDs(ctx context.Context, ids []string) (desensitizationRule []*model.DesensitizationRule, err error)
	GetDesensitizationRuleListWithRelatePolicy(ctx context.Context, ids []string) (result []*model.DesensitizationRuleRelate, err error)
}
