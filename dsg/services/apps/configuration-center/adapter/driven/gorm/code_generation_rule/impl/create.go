package impl

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"go.uber.org/zap"

	driven "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/code_generation_rule"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

func (r *CodeGenerationRuleRepo) Create(ctx context.Context, rule *model.CodeGenerationRule) (*model.CodeGenerationRule, error) {
	log := log.WithContext(ctx)
	tx := r.db.WithContext(ctx).Debug()

	log.Info("create code generation rule", zap.Any("object", rule))

	existRule := &model.CodeGenerationRule{}
	if err := r.db.Where("id=?", rule.ID).First(existRule).Error; err != nil {
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errorcode.Detail(errorcode.ConfigurationDataBaseError, err)
		}
	}
	if existRule.ID != uuid.Nil {
		return nil, driven.ErrAlreadyExists
	}
	if err := tx.Create(rule).Error; err != nil {
		log.Error("create code generation rule fail", zap.Error(err), zap.Any("object", rule))
		return nil, errorcode.Detail(errorcode.ConfigurationDataBaseError, err)
	}
	return rule, nil
}
