package datasource

import (
	"context"
	"encoding/json"
	"errors"

	"github.com/kweaver-ai/TelemetrySDK-Go/exporter/v2/ar_trace"
	datasourceRepo "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/datasource"
	datasourcemq "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/mq/datasource"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/datasource"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"gorm.io/gorm"
)

type Handler struct {
	datasourceUserCase datasource.UseCase
	datasourceRepo     datasourceRepo.Repo
	mqHandle           datasourcemq.DataSourceHandle
}

func NewHandler(
	datasourceUserCase datasource.UseCase,
	datasourceRepo datasourceRepo.Repo,
	mqHandle datasourcemq.DataSourceHandle,
) *Handler {
	return &Handler{
		datasourceUserCase: datasourceUserCase,
		datasourceRepo:     datasourceRepo,
		mqHandle:           mqHandle,
	}
}

func (h *Handler) ConsumeDatasource(body []byte) error {
	ctx, span := ar_trace.Tracer.Start(context.Background(), "MQ Driving Adapter DatasourceRepo Operation")
	defer span.End()
	if len(body) == 0 {
		return nil
	}

	var err error
	msg := new(datasourcemq.DatasourceMessage)
	if err = json.Unmarshal(body, msg); err != nil {
		log.WithContext(ctx).Errorf("mq datasource Unmarshal error: %s", err.Error())
		return err
	}

	repoDs := datasourcemq.ToModel(msg.Payload)
	log.WithContext(ctx).Infof("【datasource mq】: %#v, datasourceRepo datasource: %#v", msg, repoDs)

	switch msg.Header.Method {
	case "create":
		if err = h.datasourceRepo.Insert(ctx, repoDs); err != nil {
			log.WithContext(ctx).Errorf("mq datasource CreateDataSource datasourceRepo error: %s", err.Error())
		}
		if err = h.mqHandle.CreateDataSource(ctx, msg.Payload); err != nil {
			log.WithContext(ctx).Errorf("mq datasource CreateDataSource error: %s", err.Error())
		}
		if err != nil {
			return errorcode.Detail(errorcode.CreateDataSourceFailed, err.Error())
		}
	case "update":
		if _, err = h.datasourceRepo.GetByID2(ctx, repoDs.ID); err != nil && errors.Is(err, gorm.ErrRecordNotFound) {
			if err = h.datasourceRepo.Insert(ctx, repoDs); err != nil {
				log.WithContext(ctx).Errorf("mq datasource update CreateDataSource error: %s", err.Error())
			}
		} else {
			if err = h.datasourceRepo.Update(ctx, repoDs); err != nil {
				log.WithContext(ctx).Errorf("mq datasource UpdateDataSource error: %s", err.Error())
			}
		}
		if err = h.mqHandle.UpdateDataSource(ctx, msg.Payload); err != nil {
			log.WithContext(ctx).Errorf("mq datasource CreateDataSource error: %s", err.Error())
		}
		if err != nil {
			return errorcode.Detail(errorcode.ModifyDataSourceFailed, err.Error())
		}
	case "delete":
		if err = h.datasourceRepo.Delete(ctx, repoDs); err != nil {
			log.WithContext(ctx).Errorf("mq datasource datasourceRepo DeleteDatasource error: %s", err.Error())
		}

		if err = h.mqHandle.DeleteDataSource(ctx, msg.Payload); err != nil {
			log.WithContext(ctx).Errorf("mq datasource mqHandle DeleteDatasource error: %s", err.Error())
		}
		if err != nil {
			return errorcode.Detail(errorcode.DeleteDataSourceFailed, err.Error())
		}
	default:
		log.WithContext(ctx).Errorf("mq datasource method error: %s", msg.Header.Method)
	}
	return nil
}
