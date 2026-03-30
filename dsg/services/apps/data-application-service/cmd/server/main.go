package main

import (
	"context"
	"flag"
	"net/http"
	_ "net/http/pprof"
	"runtime"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/data-application-service/adapter/driven/mq/consumer"

	"go.uber.org/zap"

	"github.com/kweaver-ai/dsg/services/apps/data-application-service/adapter/driven/callbacks"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/adapter/driven/workflow"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/settings"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/domain"
	af_go_frame "github.com/kweaver-ai/idrm-go-frame"
	"github.com/kweaver-ai/idrm-go-frame/core/config"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest"
)

var (
	Name = "af_data_application_service"
	// Version is the version of the compiled software.
	Version = "1.0"

	confPath string
	addr     string
)

type AppRunner struct {
	App *af_go_frame.App
	// Workflow Consumer
	Consumer   *workflow.Consumer
	MQConsumer *consumer.Consumer
	Callbacks  *callbacks.Transports
	// 每日统计领域服务
	ServiceDailyRecordDomain *domain.ServiceDailyRecordDomain
}

func newApp(hs *rest.Server) *af_go_frame.App {

	return af_go_frame.New(
		af_go_frame.Name(Name),
		af_go_frame.Server(hs),
	)
}

func init() {
	flag.StringVar(&confPath, "confPath", "cmd/server/config/", "config path, eg: -conf config.yaml")
	flag.StringVar(&addr, "addr", "", "config path, eg: -addr 0.0.0.0:8153")
}

// @title			data-application-service
// @version		0.0
// @description	AnyFabric data application service
func main() {
	flag.Parse()
	config.InitSources(confPath)
	settings.Instance = config.Scan[settings.Settings]()
	if addr != "" {
		settings.Instance.Server.Http.Addr = addr
	}
	s := &settings.Instance

	// 初始化日志
	log.InitLogger(s.LogConfigs.Logs, &s.Telemetry)

	// 初始化ar_trace
	tracerProvider := trace.InitTracer(&s.Telemetry, "")
	defer func() {
		if err := tracerProvider.Shutdown(context.Background()); err != nil {
			panic(err)
		}
	}()

	// 初始化验证器
	err := form_validator.SetupValidator()
	if err != nil {
		panic(err)
	}
	log.Info("开始初始化应用")
	appRunner, cleanup, err := InitApp(s)
	if err != nil {
		log.Error("初始化应用失败")
		panic(err)
	}
	log.Info("应用初始化成功")
	defer cleanup()

	log.Info("开始启动每日统计初始化任务")
	// 启动每日统计定时任务
	appRunner.ServiceDailyRecordDomain.StartDailyRecordJob()
	log.Info("每日统计初始化任务执行完成")

	// 启动 Workflow Consumer
	log.Info("开始启动Workflow消费者")
	if err := appRunner.Consumer.Start(); err != nil {
		log.Error("启动Workflow消费者失败", zap.Error(err))
		panic(err)
	}
	log.Info("Workflow消费者启动成功")

	//启动 mq 消费者
	appRunner.MQConsumer.Register()

	// 数据同步
	go func() {
		defer func() {
			if r := recover(); r != nil {
				log.Error("CDC panic recovered", zap.Any("panic", r))
			}
		}()
		StartCDC(s)
	}()
	//注册数据库回调
	appRunner.Callbacks.Register()

	// 添加优雅关闭机制
	defer func() {
		log.Info("开始优雅关闭应用")

		// 停止Workflow消费者
		if appRunner.Consumer != nil {
			log.Info("开始停止Workflow消费者")
			appRunner.Consumer.Stop()
			log.Info("Workflow消费者已停止")
		}

		// 停止定时任务
		if appRunner.ServiceDailyRecordDomain != nil {
			appRunner.ServiceDailyRecordDomain.StopDailyRecordJob()
			log.Info("定时任务已停止")
		}

		log.Info("应用优雅关闭完成")
	}()

	// 启动健康检查goroutine
	healthCheckCtx, healthCheckCancel := context.WithCancel(context.Background())
	defer healthCheckCancel()

	go func() {
		ticker := time.NewTicker(600 * time.Second)
		defer ticker.Stop()

		for {
			select {
			case <-ticker.C:
				// 检查Workflow消费者状态
				if appRunner.Consumer != nil {
					if appRunner.Consumer.IsRunning() {
						log.Debug("Workflow消费者运行正常")
					} else {
						log.Warn("Workflow消费者状态异常")
					}
				}

				// 检查定时任务状态
				if appRunner.ServiceDailyRecordDomain != nil {
					if appRunner.ServiceDailyRecordDomain.IsRunning() {
						log.Debug("定时任务运行正常")
					} else {
						log.Warn("定时任务状态异常")
					}
				}

				// 添加资源监控
				var m runtime.MemStats
				runtime.ReadMemStats(&m)
				log.Info("资源监控",
					zap.Int("goroutines", runtime.NumGoroutine()),
					zap.Uint64("memory_alloc_mb", m.Alloc/1024/1024),
					zap.Uint64("memory_sys_mb", m.Sys/1024/1024),
				)
			case <-healthCheckCtx.Done():
				log.Info("健康检查goroutine收到退出信号")
				return
			}
		}
	}()

	// 启动pprof服务
	go func() {
		log.Info("启动pprof服务", zap.String("addr", ":6060"))
		// 使用默认 mux
		if err := http.ListenAndServe(":6060", nil); err != nil {
			log.Error("pprof服务退出", zap.Error(err))
		}
	}()

	//start and wait for stop signal
	if err := appRunner.App.Run(); err != nil {
		panic(err)
	}
}
