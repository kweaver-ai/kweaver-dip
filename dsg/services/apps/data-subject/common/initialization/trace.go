package initialization

import (
	"github.com/IBM/sarama"
	my_config "github.com/kweaver-ai/dsg/services/apps/data-subject/infrastructure/config"
	"github.com/kweaver-ai/idrm-go-common/audit"
	"github.com/kweaver-ai/idrm-go-frame/core/logx/zapx"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	af_trace "github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"go.opentelemetry.io/otel/sdk/trace"
)

func InitTraceAndLog(bc *my_config.Bootstrap) (tracerProvider *trace.TracerProvider) {
	tc := telemetry.Config{
		LogLevel:      bc.Telemetry.LogLevel,
		TraceUrl:      bc.Telemetry.TraceUrl,
		LogUrl:        bc.Telemetry.LogUrl,
		ServerName:    bc.Telemetry.ServerName,
		ServerVersion: bc.Telemetry.ServerVersion,
	}
	log.InitLogger(make([]zapx.Options, 0), &tc)
	if bc.Telemetry.TraceEnabled == "true" {
		tc.TraceEnabled = true
		// 初始化ar_trace
		tracerProvider = af_trace.InitTracer(&tc, "")
	}
	return
}

func InitAuditLog(bc *my_config.Bootstrap) (logger audit.Logger, cleanup func(), err error) {
	// Kafka 连接信息
	k := &KafkaConf{
		Host:      bc.DepServices.KafkaMQ.Host,
		Mechanism: sarama.SASLTypePlaintext,
		Password:  bc.DepServices.KafkaMQ.Sasl.Password,
		UserName:  bc.DepServices.KafkaMQ.Sasl.Username,
	}
	// Kafka 客户端 github.com/IBM/sarama 配置
	c := k.SaramaConfig()
	// 创建 github.com/IBM/sarama.SyncProducer
	p, err := sarama.NewSyncProducer([]string{k.Host}, c)
	if err != nil {
		return
	}
	cleanup = func() { p.Close() }
	// 创建日志器
	logger = audit.NewKafka(p)
	return
}

type KafkaConf struct {
	Host      string `json:"host"`
	Mechanism string `json:"mechanism"`
	Password  string `json:"password"`
	UserName  string `json:"username"`
}

// 返回用于生成 sarama.SyncProducer 的 Config
func (c *KafkaConf) SaramaConfig() *sarama.Config {
	config := sarama.NewConfig()
	config.Net.SASL.Enable = c.UserName != "" || c.Password != ""
	config.Net.SASL.Mechanism = sarama.SASLMechanism(c.Mechanism)
	config.Net.SASL.User = c.UserName
	config.Net.SASL.Password = c.Password
	config.Net.SASL.Handshake = true
	config.Producer.Return.Successes = true
	return config
}
