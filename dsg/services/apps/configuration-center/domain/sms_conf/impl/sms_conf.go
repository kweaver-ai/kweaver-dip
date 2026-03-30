package impl

import (
	"context"
	"encoding/json"

	"gorm.io/gorm"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/configuration"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	domain "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/sms_conf"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
)

type useCase struct {
	confRepo configuration.Repo
	data     *gorm.DB
}

func NewUseCase(
	confRepo configuration.Repo,
	data *gorm.DB,
) domain.UseCase {
	return &useCase{
		confRepo: confRepo,
		data:     data,
	}
}

func (uc *useCase) Get(ctx context.Context) (resp *domain.SMSConfResp, err error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()

	confs, err := uc.confRepo.GetByName(ctx, domain.GLOBAL_SMS_CONF)
	if err != nil {
		log.WithContext(ctx).Errorf("uc.confRepo.GetByName failed: %v", err)
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	resp = &domain.SMSConfResp{
		SwitchStatus: domain.SwitchStatusOff,
	}
	if len(confs) > 0 && len(confs[0].Value) > 0 {
		if err = json.Unmarshal([]byte(confs[0].Value), resp); err != nil {
			log.WithContext(ctx).Errorf("json.Unmarshal sms conf failed: %v", err)
			return nil, errorcode.Detail(errorcode.PublicInternalError, err)
		}
	}
	return resp, nil
}

func (uc *useCase) Update(ctx context.Context, req *domain.UpdateReq) (err error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()

	confs, err := uc.confRepo.GetByName(ctx, domain.GLOBAL_SMS_CONF)
	if err != nil {
		log.WithContext(ctx).Errorf("uc.confRepo.GetByName failed: %v", err)
		return errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	var buf []byte
	if buf, err = json.Marshal(req); err != nil {
		log.WithContext(ctx).Errorf("json.Marshal sms conf failed: %v", err)
		return errorcode.Detail(errorcode.PublicInternalError, err)
	}
	if len(confs) > 0 {
		confs[0].Value = string(buf)
		if err = uc.confRepo.Update(ctx, confs[0]); err != nil {
			log.WithContext(ctx).Errorf("uc.confRepo.Update failed: %v", err)
			return errorcode.Detail(errorcode.PublicDatabaseError, err)
		}
	} else {
		conf := &model.Configuration{
			Key:   domain.GLOBAL_SMS_CONF,
			Value: string(buf),
		}
		if err = uc.confRepo.Insert(ctx, conf); err != nil {
			log.WithContext(ctx).Errorf("uc.confRepo.Insert failed: %v", err)
			return errorcode.Detail(errorcode.PublicDatabaseError, err)
		}
	}
	return nil
}
