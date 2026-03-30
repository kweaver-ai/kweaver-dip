package alarm_rule

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/mq/kafka"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/mq/kafkax"
)

type UseCase interface {
	GetList(ctx context.Context, req *ListReq) (*ListResp, error)
	Update(ctx context.Context, uid string, req *UpdateReq) (*UpdateResp, error)
}

type ListReq struct {
	Types []string `form:"types" binding:"omitempty"` // 告警规则类型，data_quality 数据质量
}
type ListResp struct {
	Entries []*ListItem `json:"entries" binding:"required"` // 告警规则列表
}
type ListItem struct {
	ID                 string `json:"id" binding:"required" example:"545911190992222513"` // 告警规则ID
	Type               string `json:"type" binding:"required"`                            // 规则类型，data_quality 数据质量
	DeadlineTime       int64  `json:"deadline_time" binding:"required"`                   // 截止告警时间
	DeadlineReminder   string `json:"deadline_reminder" binding:"required"`               // 截止告警内容
	BeforehandTime     int64  `json:"beforehand_time" binding:"required"`                 // 提前告警时间
	BeforehandReminder string `json:"beforehand_reminder" binding:"required"`             // 提前告警内容
	UpdatedAt          int64  `json:"updated_at" binding:"omitempty"`                     // 更新时间
	UpdatedBy          string `json:"updated_by" binding:"omitempty"`                     // 更新用户ID

}

type UpdateReq struct {
	AlarmRules []*AlarmRuleReq `json:"alarm_rules" binding:"required"` // 告警规则列表
}
type AlarmRuleReq struct {
	ID                 string `json:"id" binding:"required" example:"545911190992222513"` // 告警规则ID
	DeadlineTime       int64  `json:"deadline_time" binding:"required"`                   // 截止告警时间
	DeadlineReminder   string `json:"deadline_reminder" binding:"omitempty"`              // 截止告警内容
	BeforehandTime     int64  `json:"beforehand_time" binding:"required"`                 // 提前告警时间
	BeforehandReminder string `json:"beforehand_reminder" binding:"omitempty"`            // 提前告警内容
}
type UpdateResp struct {
	Res bool `json:"res" binding:"required" example:"true"` // 修改结果
}

func NewAlarmRuleModifyTopicMessage(alarmRule *model.TAlarmRule) *model.MqMessage {
	msg := kafkax.NewRawMessage()
	payload := kafkax.NewRawMessage()
	payload["id"] = alarmRule.ID
	payload["type"] = alarmRule.Type
	payload["deadline_time"] = alarmRule.DeadlineTime
	payload["deadline_reminder"] = alarmRule.DeadlineReminder
	payload["beforehand_time"] = alarmRule.BeforehandTime
	payload["beforehand_reminder"] = alarmRule.BeforehandReminder
	msg["payload"] = payload
	msg["header"] = kafkax.NewRawMessage()
	return &model.MqMessage{
		Topic:   kafka.AlarmRuleModifyTopic,
		Message: string(msg.Marshal()),
	}
}
