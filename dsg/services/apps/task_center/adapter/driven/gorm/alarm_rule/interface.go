package alarm_rule

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
)

// 告警规则的数据库接口
type Interface interface {
	// 获取，根据类型
	GetByType(ctx context.Context, t model.AlarmRuleType) (*model.AlarmRule, error)
}
