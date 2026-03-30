package impl

import (
	"context"
	"errors"

	"go.uber.org/zap"

	driven "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/code_generation_rule"
	domain "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/code_generation_rule"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

func (c *UseCase) Upgrade(ctx context.Context) error {
	log := log.WithContext(ctx)

	for _, rule := range domain.PredefinedCodeGenerationRules {
		log.Info("create predefined code generation rule", zap.String("name", rule.Name), zap.Stringer("id", rule.ID))
		_, err := c.codeRepo.Create(ctx, &rule.CodeGenerationRule)

		if errors.Is(err, driven.ErrAlreadyExists) {
			log.Info("code generation rule already exists", zap.String("name", rule.Name), zap.Stringer("id", rule.ID))
			continue
		}

		if err != nil {
			return err
		}
	}
	return nil
}
