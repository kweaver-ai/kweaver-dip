package data_catalog

import (
	"context"
	"encoding/json"

	domain "github.com/kweaver-ai/dsg/services/apps/task_center/domain/db_sandbox"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/mq/kafkax"
	"go.uber.org/zap"
)

type DataCatalogHandler struct {
	service domain.UseCase
}

func NewDataCatalogHandler(service domain.UseCase) *DataCatalogHandler {
	return &DataCatalogHandler{
		service: service,
	}
}

// HandlerDataPushMsg  处理数据推送消息
func (m *DataCatalogHandler) HandlerDataPushMsg(ctx context.Context, message *kafkax.Message) error {
	defer func() {
		if err := recover(); err != nil {
			log.WithContext(ctx).Error("[mq] HandlerDataPushMsg ", zap.Any("err", err))
		}
	}()

	msg := new(DataPushMsg[*domain.SandboxDataSetInfo])
	if err := json.Unmarshal(message.Value, msg); err != nil {
		log.WithContext(ctx).Error("consumer DeleteMainBusinessHandler Unmarshal error", zap.Error(err))
		return err
	}
	if msg == nil || msg.Body == nil {
		return nil
	}
	return m.service.HandlerDataPushMsg(ctx, msg.Body)
}
