package impl

import (
	"context"
	"strconv"
	"time"

	"github.com/kweaver-ai/idrm-go-frame/core/transport/mq/kafkax"
	"go.uber.org/zap"
	"gorm.io/gorm"

	alarm_rule "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/alarm_rule"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	domain "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/alarm_rule"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
)

type useCase struct {
	alarmRuleRepo alarm_rule.Repo
	data          *gorm.DB
	producer      kafkax.Producer
}

func NewUseCase(
	alarmRuleRepo alarm_rule.Repo,
	data *gorm.DB,
	producer kafkax.Producer,
) domain.UseCase {
	return &useCase{
		alarmRuleRepo: alarmRuleRepo,
		data:          data,
		producer:      producer,
	}
}

func (uc *useCase) GetList(ctx context.Context, req *domain.ListReq) (resp *domain.ListResp, err error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()

	models, err := uc.alarmRuleRepo.GetList(nil, ctx, req)
	if err != nil {
		log.WithContext(ctx).Errorf("uc.alarmRuleRepo.GetList failed: %v", err)
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	resp = &domain.ListResp{Entries: make([]*domain.ListItem, len(models))}

	for i, rule := range models {
		resp.Entries[i] = &domain.ListItem{
			ID:                 strconv.FormatInt(rule.ID, 10),
			Type:               rule.Type,
			DeadlineTime:       rule.DeadlineTime,
			DeadlineReminder:   rule.DeadlineReminder,
			BeforehandTime:     rule.BeforehandTime,
			BeforehandReminder: rule.BeforehandReminder,
			UpdatedAt:          rule.UpdatedAt.UnixMilli(),
			UpdatedBy:          *rule.UpdatedBy,
		}
	}

	return resp, nil
}

func (uc *useCase) Update(ctx context.Context, uid string, req *domain.UpdateReq) (resp *domain.UpdateResp, err error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()

	timeNow := time.Now()
	for _, alarmRule := range req.AlarmRules {
		newRule := &model.TAlarmRule{}
		id, _ := strconv.ParseInt(alarmRule.ID, 10, 64)
		newRule.ID = id
		newRule.DeadlineTime = alarmRule.DeadlineTime
		newRule.DeadlineReminder = alarmRule.DeadlineReminder
		newRule.BeforehandTime = alarmRule.BeforehandTime
		newRule.BeforehandReminder = alarmRule.BeforehandReminder
		newRule.UpdatedAt = &timeNow
		newRule.UpdatedBy = &uid
		success, err := uc.alarmRuleRepo.Update(nil, ctx, newRule)
		if err != nil {
			log.WithContext(ctx).Errorf("uc.alarmRuleRepo.Update failed: %v", err)
			return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
		}
		if !success {
			log.WithContext(ctx).Errorf("uc.alarmRuleRepo.Update failed: %v", err)
			return nil, errorcode.Detail(errorcode.AlarmRuleNotExistedError, err)
		}
		//发送修改告警规则消息
		mqMessage := domain.NewAlarmRuleModifyTopicMessage(newRule)
		if mqMessage != nil {
			if err = uc.producer.Send(mqMessage.Topic, []byte(mqMessage.Message)); err != nil {
				log.WithContext(ctx).Error("send update alarm rule error", zap.Error(err))
				return nil, errorcode.Desc(errorcode.AlarmRuleModifyMessageSendError)
			}
		}
	}
	return &domain.UpdateResp{Res: true}, nil
}
