package nsq

import (
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/settings"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/mq/nsqx"
)

const ConfigurationCenterChannel = "Configuration-Center-Channel"

func NewProducer() nsqx.Producer {
	c := nsqx.Config{
		Host:        settings.ConfigInstance.Config.Nsq.Host,
		HttpHost:    settings.ConfigInstance.Config.Nsq.HttpHost,
		LookupdHost: settings.ConfigInstance.Config.Nsq.LookupdHost,
		Channel:     ConfigurationCenterChannel,
	}
	return nsqx.NewSyncProducer(c)
}
