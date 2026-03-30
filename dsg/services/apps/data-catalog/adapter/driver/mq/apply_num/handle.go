package apply_num

import (
	"context"
	"encoding/json"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/data_resource_catalog"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
)

type ApplyNumHandler struct {
	dataResourceCatalog data_resource_catalog.DataResourceCatalogDomain
}

func NewApplyNumHandler(dataResourceCatalog data_resource_catalog.DataResourceCatalogDomain) *ApplyNumHandler {
	return &ApplyNumHandler{dataResourceCatalog: dataResourceCatalog}
}

func (h *ApplyNumHandler) UpdateApplyNum(msg []byte) (err error) {
	ctx := context.Background()
	defer func() {
		if e := recover(); e != nil {
			log.WithContext(ctx).Error("[mq] ApplyNumHandler panic", zap.Any("err", e))
		}
	}()
	var data data_resource_catalog.EsIndexApplyNumUpdateMsg
	if err = json.Unmarshal(msg, &data); err != nil {
		log.WithContext(ctx).Errorf("[mq] json.Unmarshal ApplyNumHandler msg (%s) failed: %v", string(msg), err)
		return err
	}
	log.Infof("【mq】 ApplyNumHandler msg :%s", string(msg))
	err = h.dataResourceCatalog.UpdateApplyNum(ctx, &data)
	if err != nil {
		return err
	}
	return nil
}

func (h *ApplyNumHandler) UpdateApplyNumComplete(msg []byte) (err error) {
	ctx := context.Background()
	defer func() {
		if e := recover(); e != nil {
			log.WithContext(ctx).Error("[mq] ApplyNumHandler panic", zap.Any("err", e))
		}
	}()
	var data data_resource_catalog.EsIndexApplyNumUpdateMsg
	if err = json.Unmarshal(msg, &data); err != nil {
		log.WithContext(ctx).Errorf("[mq] json.Unmarshal ApplyNumHandler msg (%s) failed: %v", string(msg), err)
		return err
	}
	log.Infof("【mq】 ApplyNumHandler msg :%s", string(msg))
	err = h.dataResourceCatalog.UpdateApplyNumComplete(ctx, &data)
	if err != nil {
		return err
	}
	log.Info("【mq】 ApplyNumHandler msg success")
	return nil
}
