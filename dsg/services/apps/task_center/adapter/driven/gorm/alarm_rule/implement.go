package alarm_rule

import (
	"context"

	"gorm.io/gorm"

	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
)

// 告警规则的数据库客户端
type Client struct {
	DB *gorm.DB
}

func New(data *db.Data) Interface { return &Client{DB: data.DB} }

// 获取，根据类型
func (c *Client) GetByType(ctx context.Context, t model.AlarmRuleType) (*model.AlarmRule, error) {
	var result model.AlarmRule
	if err := c.DB.WithContext(ctx).Table("af_configuration."+model.TableNameAlarmRule).
		Where("type=?", t).
		Take(&result).Error; err != nil {
		return nil, err
	}
	return &result, nil
}
