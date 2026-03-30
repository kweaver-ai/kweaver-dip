package common

import (
	"strings"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/settings"
)

// type producerConfig struct {
// 	mqType           int    // mq type
// 	sendSize         int    // send chan buf size
// 	recvSize         int    // recv chan buf size
// 	addr             string // mq server host
// 	topic            string // topic to listen
// 	*producerOptions        // additional options
// }

// func NewProducerConfig(mqType, sBufSize, rBufSize int, addr, topic string, opts *producerOptions) MQProducerConfInterface {
// 	conf := &producerConfig{
// 		mqType:          mqType,
// 		sendSize:        PRODUCER_SEND_DEFAULT_BUFF_SIZE,
// 		recvSize:        PRODUCER_RECV_DEFAULT_BUFF_SIZE,
// 		addr:            addr,
// 		topic:           topic,
// 		producerOptions: opts,
// 	}

// 	if sBufSize > 0 {
// 		conf.sendSize = sBufSize
// 	}

// 	if rBufSize > 0 {
// 		conf.recvSize = rBufSize
// 	}
// 	return conf
// }

// type producerOptions struct {
// 	*saslOption
// }

// func NewProducerOptions(so *saslOption) *producerOptions {
// 	return &producerOptions{saslOption: so}
// }

// func (pc *producerConfig) MQType() int {
// 	return pc.mqType
// }

// func (pc *producerConfig) SendSize() int {
// 	return pc.sendSize
// }

// func (pc *producerConfig) RecvSize() int {
// 	return pc.recvSize
// }

// func (pc *producerConfig) Addr() string {
// 	return pc.addr
// }

// func (pc *producerConfig) Topic() string {
// 	return pc.topic
// }

// func (pc *producerConfig) ProducerOptions() *producerOptions {
// 	return pc.producerOptions
// }

// func (po *producerOptions) ProducerOptions() *saslOption {
// 	return po.saslOption
// }

// type consumerConfig struct {
// 	mqType int    // mq type
// 	addr   string // mq server host
// 	//topic       string // topic to listen
// 	lookupdAddr string
// 	channel     string
// 	clientID    string
// }

// func NewConsumerConfig(mqType int, addr, lookupdAddr /*topic, */, channel, clientID string) MQConsumerConfInterface {
// 	conf := &consumerConfig{
// 		mqType:      mqType,
// 		addr:        addr,
// 		lookupdAddr: lookupdAddr,
// 		//topic:       topic,
// 		channel:  channel,
// 		clientID: clientID,
// 	}

// 	return conf
// }

// func (cc *consumerConfig) MQType() int {
// 	return cc.mqType
// }

// func (cc *consumerConfig) Addr() string {
// 	return cc.addr
// }

// // func (cc *consumerConfig) Topic() string {
// // 	return cc.topic
// // }

// func (cc *consumerConfig) Channel() string {
// 	return cc.channel
// }

// func (cc *consumerConfig) ClientID() string {
// 	return cc.clientID
// }

// func (cc *consumerConfig) LookupdAddr() string {
// 	return cc.lookupdAddr
// }

type mqConfig struct {
	mqType      string // mq type
	addr        string // mq server host
	lookupdAddr string
	channel     string
	clientID    string
	mechanism   string
	username    string
	password    string
	sendSize    int // send chan buf size
	recvSize    int // recv chan buf size
}

func NewMQConfig(c *settings.MQConf, idx int) MQConfInterface {
	conf := &mqConfig{
		mqType:      strings.ToLower(c.ConnConfs[idx].MQType),
		addr:        c.ConnConfs[idx].Addr,
		lookupdAddr: c.ConnConfs[idx].LookupdAddr,
		channel:     c.Channel,
		clientID:    c.ClientID,
		mechanism:   c.ConnConfs[idx].MQAuthConf.Mechanism,
		username:    c.ConnConfs[idx].MQAuthConf.User,
		password:    c.ConnConfs[idx].MQAuthConf.Password,
		sendSize:    c.SendBufSize,
		recvSize:    c.RecvBufSize,
	}

	return conf
}

func (c *mqConfig) MQType() string {
	return c.mqType
}

func (c *mqConfig) Addr() string {
	return c.addr
}

func (c *mqConfig) Channel() string {
	return c.channel
}

func (c *mqConfig) ClientID() string {
	return c.clientID
}

func (c *mqConfig) LookupdAddr() string {
	return c.lookupdAddr
}

func (c *mqConfig) SendSize() int {
	return c.sendSize
}

func (c *mqConfig) RecvSize() int {
	return c.recvSize
}

func (c *mqConfig) UserName() string {
	return c.username
}

func (c *mqConfig) Password() string {
	return c.password
}

func (c *mqConfig) Mechanism() string {
	return c.mechanism
}
