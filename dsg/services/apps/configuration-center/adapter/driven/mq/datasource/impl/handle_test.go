package impl

import (
	"context"
	"testing"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/mq/datasource"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/settings"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/mq/kafka"
)

func Test_mQHandleInstance_CreateDataSource(t *testing.T) {
	settings.ConfigInstance.Config.KafkaMQ.Host = "10.4.133.71:31000"
	settings.ConfigInstance.Config.KafkaMQ.Sasl.Enabled = true
	settings.ConfigInstance.Config.KafkaMQ.Sasl.User = "kafkaclient"
	settings.ConfigInstance.Config.KafkaMQ.Sasl.Password = "***"
	producer, err := kafka.NewSyncProducer()
	if err != nil {
		t.Errorf(err.Error())
	}
	m := datasourceHandle{
		producer: producer,
	}
	if err = m.CreateDataSource(context.Background(), &datasource.DatasourcePayload{
		DataSourceID: 21312,
		ID:           "ddddfaf",
		Name:         "test",
	}); err != nil {
		t.Error("CreateDataSource() faild", err.Error())
	}

}
