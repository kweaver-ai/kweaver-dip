package datasource

import (
	"context"
	"encoding/json"
	"errors"
	"gorm.io/gorm"

	"github.com/Shopify/sarama"
	"go.uber.org/zap"

	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/datasource"
	form_view_repo "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/form_view"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/scan_record"
	"github.com/kweaver-ai/dsg/services/apps/data-view/domain/form_view"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/TelemetrySDK-Go/exporter/v2/ar_trace"
)

type DataSourceConsumer struct {
	datasourceRepo datasource.DatasourceRepo
	formViewRepo   form_view_repo.FormViewRepo
	formView       form_view.FormViewUseCase
	scanRecordRepo scan_record.ScanRecordRepo
}

func NewDataSourceConsumer(repo datasource.DatasourceRepo,
	formViewRepo form_view_repo.FormViewRepo,
	formView form_view.FormViewUseCase,
	scanRecordRepo scan_record.ScanRecordRepo,
) *DataSourceConsumer {
	return &DataSourceConsumer{
		datasourceRepo: repo,
		formViewRepo:   formViewRepo,
		formView:       formView,
		scanRecordRepo: scanRecordRepo,
	}
}

// Setup 方法在新会话开始时运行的，然后才使用声明
func (d *DataSourceConsumer) Setup(sarama.ConsumerGroupSession) error {
	// Mark the d as ready
	return nil
}

// Cleanup  一旦所有的订阅者协程都退出，Cleaup方法将在会话结束时运行
func (d *DataSourceConsumer) Cleanup(sarama.ConsumerGroupSession) error {
	return nil
}

// ConsumeClaim 订阅者在会话中消费消息，并标记当前消息已经被消费。
func (d *DataSourceConsumer) ConsumeClaim(session sarama.ConsumerGroupSession, claim sarama.ConsumerGroupClaim) error {
	/*	for message := range claim.Messages() {
		log.Errorf("Message claimed: value = %s, key = %s, timestamp = %v", string(message.Value), string(message.Key), message.Timestamp)
		session.MarkMessage(message, "")
	}*/
	defer func() {
		if r := recover(); r != nil {
			log.Error("【datasource mq】", zap.Any("recover", r))
		}
	}()
	for message := range claim.Messages() {
		body := message.Value
		err := d.ConsumeDatasource(body)
		if err != nil {
			return err
		}
		session.MarkMessage(message, "")
		return nil
	}
	return nil
}

func (d *DataSourceConsumer) ConsumeDatasource(body []byte) error {
	ctx, span := ar_trace.Tracer.Start(context.Background(), "MQ Driving Adapter DatasourceRepo Operation")
	defer span.End()
	if len(body) == 0 {
		return nil
	}

	var err error
	msg := new(DatasourceMessage)
	if err = json.Unmarshal(body, msg); err != nil {
		log.WithContext(ctx).Errorf("mq datasource Unmarshal error: %s", err.Error())
		return err
	}

	repoDs := ToModel(msg.Payload)
	log.WithContext(ctx).Infof("【datasource mq】: %#v, datasourceRepo datasource: %#v", msg, repoDs)
	switch msg.Header.Method {
	case "create":
		if err = d.datasourceRepo.CreateDataSource(ctx, repoDs); err != nil {
			log.WithContext(ctx).Errorf("mq datasource CreateDataSource error: %s", err.Error())
		}
	case "update":
		if _, err = d.datasourceRepo.GetById(ctx, repoDs.ID); err != nil && errors.Is(err, gorm.ErrRecordNotFound) {
			if err = d.datasourceRepo.CreateDataSource(ctx, repoDs); err != nil {
				log.WithContext(ctx).Errorf("mq datasource update CreateDataSource error: %s", err.Error())
			}
		}
		if err = d.datasourceRepo.UpdateDataSource(ctx, repoDs); err != nil {
			log.WithContext(ctx).Errorf("mq datasource UpdateDataSource error: %s", err.Error())
		}
	case "delete":
		log.WithContext(ctx).Infof("【datasource mq】:  datasource delete: %v", repoDs.ID)
		/*		if err = d.formView.DeleteDatasourceClearFormView(ctx, repoDs.ID); err != nil {
				log.WithContext(ctx).Errorf("mq datasource DeleteDatasourceClearFormView error: %s", err.Error())
			}*/
		/*		if err = d.formViewRepo.DataSourceDeleteTransaction(ctx, repoDs.ID); err != nil {
				log.WithContext(ctx).Errorf("mq datasource DeleteDataSource error: %s", err.Error())
			}*/
		if err = d.datasourceRepo.DeleteDataSource(ctx, repoDs.ID); err != nil {
			log.WithContext(ctx).Errorf("mq datasource DeleteDataSource error: %s", err.Error())
		}
	default:
		log.WithContext(ctx).Errorf("mq datasource method error: %s", msg.Header.Method)
	}
	return nil
}
