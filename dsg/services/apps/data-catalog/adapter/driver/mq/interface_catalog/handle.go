package interface_catalog

import (
	"context"
	"encoding/json"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/data_resource"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/data_resource/impl"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
)

type InterfaceCatalogHandler struct {
	dataResourceDomain *impl.DataResourceDomain
}

func NewInterfaceCatalogHandler(dataResourceDomain *impl.DataResourceDomain) *InterfaceCatalogHandler {
	return &InterfaceCatalogHandler{dataResourceDomain: dataResourceDomain}
}

func (h *InterfaceCatalogHandler) InterfaceCatalog(msg []byte) (err error) {
	ctx := context.Background()
	defer func() {
		if e := recover(); e != nil {
			log.WithContext(ctx).Error("[mq] InterfaceCatalog panic", zap.Any("err", e))
		}
	}()
	var data data_resource.InterfaceCatalog
	if err = json.Unmarshal(msg, &data); err != nil {
		log.WithContext(ctx).Errorf("[mq] json.Unmarshal InterfaceCatalog msg (%s) failed: %v", string(msg), err)
		return err
	}
	log.Infof("【mq】 InterfaceCatalog msg :%s", string(msg))
	err = h.dataResourceDomain.InterfaceCatalog(ctx, data)
	if err != nil {
		return err
	}
	return nil
}
