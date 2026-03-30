package impl

type MQ interface {
	Handler(topic string, handler func(msg []byte) error)
	Produce(topic string, key []byte, msg []byte) error
	Start() error
	Stop() error
}
