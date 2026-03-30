package impl

import (
	"context"

	"go.uber.org/zap"

	driven "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/code_generation_rule"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

// 获取符合条件的编码生成规则的数量
func (c *CodeGenerationRuleRepo) Count(ctx context.Context, opts driven.ListOptions) (int, error) {
	log := log.WithContext(ctx)
	tx := c.db.WithContext(ctx).Debug()

	var countInt64 int64
	if err := tx.Model(&model.CodeGenerationRule{}).Clauses(ConvertListOptionsToExpressions(opts)...).Count(&countInt64).Error; err != nil {
		log.Error("count code generation rules", zap.Error(err), zap.Any("options", opts))
		return 0, errorcode.Detail(errorcode.ConfigurationDataBaseError, err)
	}

	return int(countInt64), nil
}
