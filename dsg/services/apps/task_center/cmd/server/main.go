package main

import (
	"context"
	"flag"

	"github.com/kweaver-ai/dsg/services/apps/task_center/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/settings"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/conf"
	"github.com/kweaver-ai/idrm-go-frame/core/config"
	"github.com/kweaver-ai/idrm-go-frame/core/logx/zapx"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
)

var (
	//Name 项目名称
	Name = "af_task_center"
	// Version is the version of the compiled software.
	Version = "1.0"
	//configPath 配置文件的路径
	configPath string
	//serverAddr 监听端口
	serverAddr string
)

func init() {
	flag.StringVar(&configPath, "confPath", "cmd/server/config", "config path, eg: -conf config.yaml")
	flag.StringVar(&serverAddr, "addr", "", "config path, eg: -addr 0.0.0.0:8000")

}

// @title			task_center
// @version		1.0
// @description	AnyFabric task_center
// @BasePath		/api/task-center/v1
// @schemes https
func main() {
	flag.Parse()
	//初始化配置文件路径
	config.InitSources(configPath)
	//初始化验证器
	form_validator.SetupValidator()
	//初始化配置
	settings.ConfigInstance = config.Scan[settings.ConfigContains]()
	// 初始化日志
	option := zapx.LogConfigs{Logs: settings.ConfigInstance.Logs}
	tc := settings.ConfigInstance.Telemetry
	log.InitLogger(option.Logs, &tc)

	//初始化Telemetry
	if settings.ConfigInstance.Telemetry.TraceEnabled {
		// 初始化ar_trace
		tracerProvider := trace.InitTracer(&tc, "")
		defer func() {
			if err := tracerProvider.Shutdown(context.Background()); err != nil {
				panic(err)
			}
		}()
	}
	//init settings and Micro service url
	settings.Init()

	//init application controller
	bc := config.Scan[conf.Bootstrap]()
	if serverAddr != "" {
		bc.Server.Http.Addr = serverAddr
	}
	//region 读取数据库配置信息
	database := settings.ConfigInstance.Database
	appRunner, cleanup, err := InitApp(bc.Server, &database)
	if err != nil {
		panic(err)
	}
	defer cleanup()

	// start and wait for stop signal
	if err = appRunner.Run(); err != nil {
		panic(err)
	}
}
