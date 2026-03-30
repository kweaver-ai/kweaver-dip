package kafka_pub

type KafkaPub interface {
	SyncProduce(topic string, key []byte, value []byte) error
}
