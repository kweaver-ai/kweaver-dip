package impl

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"go.uber.org/zap"
	"gorm.io/gorm"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

// 获取指定 ID 的编码生成规则
func (c *CodeGenerationRuleRepo) Get(ctx context.Context, id uuid.UUID) (*model.CodeGenerationRule, error) {
	log := log.WithContext(ctx)
	tx := c.db.Debug().WithContext(ctx)

	var rule = &model.CodeGenerationRule{ID: id}
	if err := tx.First(rule).Error; errors.Is(err, gorm.ErrRecordNotFound) {
		log.Error("code generation rule is not found", zap.Stringer("id", id))
		return nil, errorcode.Desc(errorcode.CodeGenerationRuleNotFound)
	} else if err != nil {
		log.Error("get code generation rule fail", zap.Error(err), zap.Stringer("id", id))
		return nil, errorcode.Detail(errorcode.ConfigurationDataBaseError, err)
	}

	return rule, nil
}
