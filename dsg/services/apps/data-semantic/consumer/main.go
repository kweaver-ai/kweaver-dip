// Package main Kafka消费者入口
package main

import (
	"context"
	"flag"
	"os"
	"os/signal"
	"syscall"

	"github.com/kweaver-ai/dsg/services/apps/data-semantic/consumer/internal/config"
	"github.com/kweaver-ai/dsg/services/apps/data-semantic/consumer/internal/handler"
	"github.com/kweaver-ai/dsg/services/apps/data-semantic/consumer/internal/logic"
	"github.com/kweaver-ai/dsg/services/apps/data-semantic/consumer/internal/svc"
	"github.com/zeromicro/go-zero/core/conf"
	"github.com/zeromicro/go-zero/core/logx"
)

var configFile = flag.String("f", "etc/consumer.yaml", "配置文件路径")

func main() {
	flag.Parse()

	var c config.Config
	conf.MustLoad(*configFile, &c)

	logx.MustSetup(logx.LogConf{
		ServiceName: c.Log.ServiceName,
		Mode:        c.Log.Mode,
		Level:       c.Log.Level,
	})

	logx.Infof("启动 %s 服务...", c.Name)

	svcCtx := svc.NewServiceContext(c)

	topic := c.MQ.Kafka.Topic

	consumer, err := logic.NewKafkaConsumerWithAuth(
		c.MQ.Kafka.Brokers, c.MQ.Kafka.Group, c.MQ.Kafka.Username, c.MQ.Kafka.Password,
	)
	if err != nil {
		logx.Errorf("创建Kafka消费者失败: %v", err)
		os.Exit(1)
	}
	defer func() {
		if err := consumer.Close(); err != nil {
			logx.Errorf("关闭Kafka消费者失败: %v", err)
		}
		logx.Info("Kafka消费者已关闭")
	}()

	dataUnderstandingHandler := handler.NewDataUnderstandingHandler(svcCtx)
	consumer.RegisterHandler(topic, dataUnderstandingHandler)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// 消费 Errors 通道，防止内部阻塞
	go func() {
		for err := range consumer.Errors() {
			logx.Errorf("Kafka消费者错误: %v", err)
		}
	}()

	go func() {
		if err := consumer.Start(ctx); err != nil {
			if ctx.Err() != nil {
				logx.Infof("Kafka消费者正常退出: %v", err)
			} else {
				logx.Errorf("Kafka消费者异常退出: %v", err)
			}
		}
	}()

	logx.Infof("Kafka消费者已启动，订阅主题: %s, 消费者组: %s", topic, c.MQ.Kafka.Group)

	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
	<-sigChan

	logx.Info("收到退出信号，正在关闭...")
	cancel()
	logx.Info("服务已停止")
}
