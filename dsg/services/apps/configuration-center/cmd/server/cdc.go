package main

import (
	"fmt"

	my_config "github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/conf"
	"github.com/kweaver-ai/idrm-go-frame/core/cdc"
	"github.com/kweaver-ai/idrm-go-frame/core/options"
	"github.com/kweaver-ai/idrm-go-frame/core/store/redis"
)

func StartCDC(bc *my_config.Bootstrap) {
	fmt.Println("cdc started")
	fmt.Println("cdc running...")
	//select {}
	sourceConfig := &cdc.SourceConf{
		Broker:        bc.SourceConf.GetBroker(),
		KafkaUser:     bc.SourceConf.GetKafkaUser(),
		KafkaPassword: bc.SourceConf.GetKafkaPassword(),
		ClientID:      bc.SourceConf.GetClientId(),
		Mechanism:     bc.SourceConf.GetMechanism(),
		RedisConfig: redis.RedisConf{
			Host: bc.SourceConf.GetRedisHost(),
			Pass: bc.SourceConf.GetRedisPassword(),
		},
		Sources: struct {
			Options options.DBOptions
			Source  []*cdc.CronConf `json:"source"`
		}{
			Options: options.DBOptions{
				DBType:   bc.SourceConf.Sources.GetType(),
				Host:     bc.SourceConf.Sources.GetHost(),
				Port:     bc.SourceConf.Sources.GetPort(),
				Username: bc.SourceConf.Sources.GetUsername(),
				Password: bc.SourceConf.Sources.GetPassword(),
				Database: bc.SourceConf.Sources.GetDb(),
			},
			Source: make([]*cdc.CronConf, 0),
		},
	}

	pbSource := bc.SourceConf.Sources.GetSource()
	target := make([]*cdc.CronConf, 0, len(pbSource))
	for _, s := range pbSource {
		target = append(target, &cdc.CronConf{
			Expression:          s.Expression,
			Table:               s.Table,
			Column:              s.Column,
			IDColumnName:        s.IdColumnName,
			TimestampColumnName: s.TimestampColumnName,
		})
	}
	sourceConfig.Sources.Source = target

	source, err := cdc.InitSource(sourceConfig)
	if err != nil {
		panic(err)
	}
	source.Start()
}
