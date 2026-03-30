package main

import (
	"fmt"
	"strings"

	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/settings"
	"github.com/kweaver-ai/idrm-go-frame/core/cdc"
	"github.com/kweaver-ai/idrm-go-frame/core/options"
	"github.com/kweaver-ai/idrm-go-frame/core/store/redis"
)

func StartCDC(config *settings.Settings) {
	fmt.Println("cdc running...")
	hs := strings.Split(config.Database.Host, ":")
	sourceConfig := &cdc.SourceConf{
		Broker:        config.MQ.Kafka.Host + ":" + config.MQ.Kafka.Port,
		KafkaUser:     config.MQ.Kafka.Username,
		KafkaPassword: config.MQ.Kafka.Password,
		ClientID:      config.Database.Database,
		Mechanism:     config.MQ.Kafka.Mechanism,
		RedisConfig: redis.RedisConf{
			Host: config.Redis.Host,
			Pass: config.Redis.Password,
		},
		Sources: struct {
			Options options.DBOptions
			Source  []*cdc.CronConf `json:"source"`
		}{
			Options: options.DBOptions{
				DBType:   config.Database.DBType,
				Host:     strings.TrimSpace(hs[0]),
				Port:     strings.TrimSpace(hs[1]),
				Username: config.Database.Username,
				Password: config.Database.Password,
				Database: config.Database.Database,
			},
			Source: make([]*cdc.CronConf, 0),
		},
	}

	source, err := cdc.InitSource(sourceConfig)
	if err != nil {
		panic(err)
	}
	source.Start()
}
