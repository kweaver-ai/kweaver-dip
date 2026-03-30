package model

import (
	"time"

	"github.com/google/uuid"
	utilities "github.com/kweaver-ai/idrm-go-frame/core/utils"
	"gorm.io/gorm"
)

const TableNamePointsRuleConfig = "points_rule_config"

// PointsRuleConfig mapped from table <points_rule_config>
type PointsRuleConfig struct {
	PointRuleConfigID uint64    `gorm:"column:point_rule_config_id" json:"-"`                                                     // 雪花id
	ID                string    `gorm:"column:id;not null" json:"id"`                                                             // 对象id，uuid
	Code              string    `gorm:"column:code;not null" json:"strategy_code"`                                                // 名称
	RuleType          string    `gorm:"column:rule_type;not null" json:"rule_type"`                                               // 策略类型
	Config            []byte    `gorm:"column:config;not null" json:"strategy_config"`                                            // 积分规则配置
	Period            []byte    `gorm:"column:period;not null" json:"strategy_period"`                                            // 积分规则配置有效期
	CreatedAt         time.Time `gorm:"column:created_at;not null;default:current_timestamp(3)" json:"created_at"`                // 创建时间
	CreatedByUID      string    `gorm:"column:created_by_uid;not null" json:"created_by_id"`                                      // 创建用户ID
	UpdatedAt         time.Time `gorm:"column:updated_at;autoUpdateTime;not null;default:current_timestamp(3)" json:"updated_at"` // 更新时间
	UpdatedByUID      string    `gorm:"column:updated_by_uid;not null" json:"updated_by_id"`                                      // 更新用户ID
	DeletedAt         int64     `gorm:"column:deleted_at;not null;softDelete:milli" json:"-"`                                     // 删除时间(逻辑删除)
}

func (m *PointsRuleConfig) BeforeCreate(_ *gorm.DB) error {
	if m == nil {
		return nil
	}

	if m.PointRuleConfigID == 0 {
		m.PointRuleConfigID, _ = utilities.GetUniqueID()
	}

	if len(m.ID) == 0 {
		m.ID = uuid.NewString()
	}

	return nil
}

// TableName PointsRuleConfig's table name
func (*PointsRuleConfig) TableName() string {
	return TableNamePointsRuleConfig
}

type PointsRuleConfigObj struct {
	PointsRuleConfig
	UpdatedByUserName string `gorm:"column:updated_by_user_name" json:"updated_by"`
}
