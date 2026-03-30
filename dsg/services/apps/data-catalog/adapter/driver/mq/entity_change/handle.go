package entity_change

import (
	"context"
	"encoding/json"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/data_resource"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/data_resource/impl"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
)

type EntityChangeHandler struct {
	dataResourceDomain *impl.DataResourceDomain
}

func NewEntityChangeHandler(dataResourceDomain *impl.DataResourceDomain) *EntityChangeHandler {
	return &EntityChangeHandler{dataResourceDomain: dataResourceDomain}
}

func (f *EntityChangeHandler) EntityChange(msg []byte) (err error) {
	ctx := context.Background()
	defer func() {
		if e := recover(); e != nil {
			log.WithContext(ctx).Error("[mq] EntityChange panic", zap.Any("err", e))
		}
	}()
	var data data_resource.EntityChangeReq
	if err = json.Unmarshal(msg, &data); err != nil {
		log.WithContext(ctx).Errorf("[mq] json.Unmarshal EntityChange msg (%s) failed: %v", string(msg), err)
		return err
	}
	if data.Payload.Type == data_resource.PayloadTypeCognitiveSearchDataResourceGraph &&
		(data.Payload.Content.TableName == data_resource.TableNameFormView) {
		//data.Payload.Content.TableName == data_resource.TableNameService) {
		//log.Infof("【mq】 EntityChange msg :%s", string(msg))
		err = f.dataResourceDomain.ReliabilityEntityChange(ctx, data.Payload.Content)
		if err != nil {
			return err
		}
	}
	return nil
}
