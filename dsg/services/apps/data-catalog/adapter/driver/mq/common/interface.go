package common

import (
	"os"
)

type Handler func([]byte) error

type MQConfInterface interface {
	MQType() string
	SendSize() int
	RecvSize() int
	Addr() string
	Mechanism() string
	UserName() string
	Password() string
	Channel() string
	ClientID() string
	LookupdAddr() string
}

type MQProducerInterface interface {
	Topic() string
	Addr() string
	Mechanism() string
	UserName() string
	Password() string
	StopCh() <-chan os.Signal
}

type MQProducerConfInterface interface {
	MQType() string
	SendSize() int
	RecvSize() int
	Addr() string
	Mechanism() string
	UserName() string
	Password() string
}

type MQConsumerInterface interface {
	Topic() string
	Channel() string
	Addr() string
	ClientID() string
	LookupdAddr() string
	StopCh() <-chan os.Signal
	Handler() Handler
}

type MQConsumerConfInterface interface {
	MQType() string
	Addr() string
	Channel() string
	ClientID() string
	LookupdAddr() string
	Mechanism() string
	UserName() string
	Password() string
}

type Producer interface {
	Produce([]byte, []byte) error
	Close() error
}

type Consumer interface {
	Close() error
}

type MQProducer interface {
	Produce(msg *PubMsg) error
	Output() *PubResult
}
