package common

type (
	ESIndexProducer     MQProducer
	AuditApplyProducer  MQProducer
	AuditCancelProducer MQProducer
)

const (
	MQ_TYPE_KAFKA = "kafka"
	MQ_TYPE_NSQ   = "nsq"
)

const (
	MQ_PRODUCER = iota + 1
	MQ_CONSUMER
)

const (
	MQ_PUB_MODE_SYNC = iota + 1
	MQ_PUB_MODE_ASYNC
)

const (
	PRODUCER_SEND_DEFAULT_BUFF_SIZE = 100
	PRODUCER_RECV_DEFAULT_BUFF_SIZE = 100
)

type saslOption struct {
	Enabled  bool   `json:"enabled"`
	User     string `json:"username"`
	Password string `json:"password"`
}

func NewSaslOption(enabled bool, user, password string) *saslOption {
	return &saslOption{Enabled: enabled, User: user, Password: password}
}
