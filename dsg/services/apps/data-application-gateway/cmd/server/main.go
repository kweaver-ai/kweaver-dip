package main

import (
	"context"
	"flag"

	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"

	"github.com/kweaver-ai/dsg/services/apps/data-application-gateway/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/data-application-gateway/common/settings"
	af_go_frame "github.com/kweaver-ai/idrm-go-frame"
	"github.com/kweaver-ai/idrm-go-frame/core/config"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest"
)

var (
	Name = "af_data_application_gateway"
	// Version is the version of the compiled software.
	Version = "1.0"

	confPath string
	addr     string
)

type AppRunner struct {
	App *af_go_frame.App
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

// @title			data-application-gateway
// @version		0.0
// @description	data application gateway
func main() {
	flag.Parse()
	config.InitSources(confPath)
	settings.Instance = config.Scan[settings.Settings]()
	s := &settings.Instance
	if addr != "" {
		settings.Instance.Server.Http.Addr = addr
	}

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

	appRunner, cleanup, err := InitApp(s)
	if err != nil {
		panic(err)
	}
	defer cleanup()

	//start and wait for stop signal
	if err = appRunner.App.Run(); err != nil {
		panic(err)
	}
}
