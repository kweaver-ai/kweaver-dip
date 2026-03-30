package main

import (
	"context"
	"fmt"
	"runtime"

	"github.com/kweaver-ai/dsg/services/apps/basic-search/adapter/driver"

	"github.com/spf13/cobra"

	"github.com/kweaver-ai/dsg/services/apps/basic-search/cmd/server/docs"
	"github.com/kweaver-ai/dsg/services/apps/basic-search/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/basic-search/common/settings"
	goframe "github.com/kweaver-ai/idrm-go-frame"
	cf "github.com/kweaver-ai/idrm-go-frame/core/config"
	"github.com/kweaver-ai/idrm-go-frame/core/config/sources/env"
	"github.com/kweaver-ai/idrm-go-frame/core/config/sources/file"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest"
)

var (
	Name = "af_basic_search"
	// Version is the version of the compiled software.
	Version = "1.0"

	confPath string
	addr     string

	rootCmd = &cobra.Command{
		Use:     "basic-search",
		Short:   "搜索服务服务",
		Version: Version,
	}
	serveCmd = &cobra.Command{
		Use:   "server",
		Short: "启动搜索服务服务",
		RunE:  serveCmdRun,
	}
)

func newApp(hs *rest.Server, consumeSvc *driver.MQConsumerService) *goframe.App {
	return goframe.New(
		goframe.Name(Name),
		goframe.Server(hs, consumeSvc),
	)
}

func init() {
	rootCmd.PersistentFlags().StringVarP(&confPath, "conf", "c", "config/config.yaml", "config path, eg: -conf config.yaml")
	serveCmd.LocalFlags().StringVarP(&addr, "addr", "a", ":8163", "http server host, eg: -addr 0.0.0.0:8000")
	rootCmd.AddCommand(serveCmd)
}

// "搜索服务"
func ExecuteCmd() {
	if err := rootCmd.Execute(); err != nil {
		fmt.Println("command exec failed:", err.Error())
	}
}

// "启动搜索服务服务"
func serveCmdRun(cmd *cobra.Command, args []string) error {
	runtime.GOMAXPROCS(runtime.NumCPU())
	config := initConfig()

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	tc := telemetry.Config{
		LogLevel:      config.TelemetryConf.LogLevel,
		TraceUrl:      config.TelemetryConf.TraceUrl,
		LogUrl:        config.TelemetryConf.LogUrl,
		ServerName:    config.TelemetryConf.ServerName,
		ServerVersion: config.TelemetryConf.ServerVersion,
		TraceEnabled:  config.TelemetryConf.TraceEnabled,
		AuditUrl:      config.TelemetryConf.AuditUrl,
		AuditEnabled:  config.TelemetryConf.AuditEnabled,
	}
	// 初始化日志
	log.InitLogger(config.LogConfigs.Logs, &tc)
	// 初始化trace
	if tc.TraceEnabled {
		tracerProvider := trace.InitTracer(&tc, "")
		defer func() {
			if err := tracerProvider.Shutdown(context.Background()); err != nil {
				panic(err)
			}
		}()
	}

	// 初始化验证器
	err := form_validator.SetupValidator()
	if err != nil {
		return err
	}

	app, cleanup, err := InitApp(
		ctx,
		config,
	)
	if err != nil {
		return err
	}
	defer cleanup()

	//start and wait for stop signal
	if err := app.Run(); err != nil {
		return err
	}
	return nil
}

func initConfig() *settings.Config {
	c := cf.New(
		cf.WithSource(
			env.NewSource(),
			file.NewSource(confPath),
		),
	)
	if err := c.Load(); err != nil {
		panic(err)
	}

	config := settings.GetConfig()
	// 读取所有配置信息
	if err := c.Scan(config); err != nil {
		panic(err)
	}

	if addr != "" {
		config.HttpConf.Host = addr
	}

	if config.SwagConf.Host == "" {
		config.SwagConf.Host = "127.0.0.1:8000"
	}

	// 更新swag文档服务配置
	docs.SwaggerInfo.Host = config.SwagConf.Host
	docs.SwaggerInfo.Version = config.SwagConf.Version

	return config
}
