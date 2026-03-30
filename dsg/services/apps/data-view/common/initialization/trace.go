package initialization

import (
	"github.com/IBM/sarama"
	"go.opentelemetry.io/otel/sdk/trace"

	"github.com/kweaver-ai/idrm-go-common/audit"
	my_config "github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/config"
	"github.com/kweaver-ai/idrm-go-frame/core/logx/zapx"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	af_trace "github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
)

func InitTraceAndLog(logConfig zapx.LogConfigs, bc *my_config.Bootstrap) (tracerProvider *trace.TracerProvider) {
	tc := telemetry.Config{
		LogLevel:      bc.Telemetry.LogLevel,
		TraceUrl:      bc.Telemetry.TraceUrl,
		LogUrl:        bc.Telemetry.LogUrl,
		ServerName:    bc.Telemetry.ServerName,
		ServerVersion: bc.Telemetry.ServerVersion,
		AuditUrl:      bc.Telemetry.AuditUrl,
	}
	log.InitLogger(logConfig.Logs, &tc)
	if bc.Telemetry.TraceEnabled == "true" {
		tc.TraceEnabled = true
		// 初始化ar_trace
		tracerProvider = af_trace.InitTracer(&tc, "")
	}
	if bc.Telemetry.AuditEnabled == "true" {
		tc.AuditEnabled = true
	}

	return tracerProvider
}

func InitAuditLog(bc *my_config.Bootstrap) (logger audit.Logger, cleanup func(), err error) {
	// Kafka 连接信息
	k := bc.DepServices.KafkaMQ
	// Kafka 客户端 github.com/IBM/sarama 配置
	c := saramaConfigForDepServices_Sasl(k.GetSasl())
	// 创建 Kafka ClusterAdmin 客户端
	a, err := sarama.NewClusterAdmin([]string{k.Host}, c)
	if err != nil {
		return
	}
	defer a.Close()
	// 创建 Kafka Topic 用于记录审计日志
	if err = audit.NewKafkaTopic(a); err != nil {
		return
	}

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

// saramaConfigForDepServices_Sasl 返回 Kafka 客户端配置
// github.com/IBM/sarama.Config，根据指定的 DepServices_Sasl 创建
func saramaConfigForDepServices_Sasl(sasl *my_config.DepServices_Sasl) *sarama.Config {
	config := sarama.NewConfig()

	config.Net.SASL.Enable = sasl.GetEnabled()
	config.Net.SASL.Mechanism = sarama.SASLTypePlaintext
	config.Net.SASL.User = sasl.GetUsername()
	config.Net.SASL.Password = sasl.GetPassword()
	config.Net.SASL.Handshake = true
	config.Producer.Return.Successes = true

	return config
}
