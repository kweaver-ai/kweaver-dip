package server

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/common/settings"
	"github.com/kweaver-ai/idrm-go-frame/core/config"
	log "github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
)

func Run(runCfg MainArgs) error {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	arg = runCfg

	//加载配置文件
	config.InitSources(arg.ConfigPath)

	//init application controller
	globalConfig := config.Scan[settings.Config]()
	settings.ResetConfig(&globalConfig)
	//初始化全局静态变量
	settings.Init()

	tc := globalConfig.Telemetry
	// 初始化日志
	log.InitLogger(globalConfig.LogConfigs.Logs, &tc)

	if tc.TraceEnabled {
		// 初始化ar_trace
		tracerProvider := trace.InitTracer(&tc, "")
		defer func() {
			if err := tracerProvider.Shutdown(ctx); err != nil {
				panic(err)
			}
		}()
	}

	//初始化验证器
	form_validator.SetupValidator()

	httpConf := settings.HttpConf{Addr: arg.Addr}

	//region 读取数据库配置信息
	appRunner, cleanup, err := InitApp(httpConf)
	if err != nil {
		return err
	}
	app := appRunner.App
	defer cleanup()

	appRunner.Mq.MQRegister()
	//appRunner.Callbacks.Register()

	//start and wait for stop signal
	if err := app.Run(); err != nil {
		return err
	}

	return nil
}
