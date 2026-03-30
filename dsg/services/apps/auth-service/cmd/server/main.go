package main

import (
	"context"
	"flag"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/adapter/driven/resources"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/adapter/driven/workflow/custom"

	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/settings"
	af_go_frame "github.com/kweaver-ai/idrm-go-frame"
	"github.com/kweaver-ai/idrm-go-frame/core/config"
	"github.com/kweaver-ai/idrm-go-frame/core/config/sources/env"
	"github.com/kweaver-ai/idrm-go-frame/core/config/sources/file"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
)

var (
	Name = "auth-service"
	// Version is the version of the compiled software.
	Version = "1.0.0"

	confPath string
	addr     string
)

type AppRunner struct {
	App              *af_go_frame.App
	nsq              *custom.WFConsumerRegister
	resourceRegister *resources.RegisterClient
}

func (r *AppRunner) Run() error {
	//注册资源，重复注册也没关系
	if err := r.resourceRegister.RegisterAll(context.Background()); err != nil {
		return err
	}
	return r.App.Run()
}

func init() {
	flag.StringVar(&confPath, "confPath", "cmd/server/config/", "config path, eg: -conf config.yaml")
	flag.StringVar(&addr, "addr", "", "config path, eg: -addr 0.0.0.0:8153")
}

// @title			auth-service
// @version		0.0
// @description	AnyFabric auth service
func main() {
	flag.Parse()

	c := config.New(
		config.WithSource(
			env.NewSource(),
			file.NewSource(confPath),
		),
	)
	if err := c.Load(); err != nil {
		panic(err)
	}

	s := &settings.Instance
	if err := c.Scan(&s); err != nil {
		panic(err)
	}

	if addr != "" {
		s.Server.Http.Addr = addr
	}
	// 初始化日志
	log.InitLogger(s.LogConfigs.Logs, &s.TelemetryConf)
	// 初始化ar_trace
	tracerProvider := trace.InitTracer(&s.TelemetryConf, "")
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
	if err := appRunner.Run(); err != nil {
		panic(err)
	}
}
