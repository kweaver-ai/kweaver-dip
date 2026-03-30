package impl

import (
	"context"

	"go.uber.org/zap"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

// 获取编码生成规则列表
func (c *CodeGenerationRuleRepo) List(ctx context.Context) ([]model.CodeGenerationRule, error) {
	log := log.WithContext(ctx)
	tx := c.db.Debug().WithContext(ctx)

	var list []model.CodeGenerationRule
	if err := tx.Find(&list).Error; err != nil {
		log.Error("list code generation fail", zap.Error(err))
		return nil, errorcode.Detail(errorcode.ConfigurationDataBaseError, err)
	}

	return list, nil
}
