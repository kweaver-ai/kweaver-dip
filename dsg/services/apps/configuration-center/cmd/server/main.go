package main

import (
	"context"
	"flag"
	"fmt"
	"runtime"
	"strconv"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/settings"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/firm/excel"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/conf"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db"
	"github.com/kweaver-ai/idrm-go-frame/core/config"
	"github.com/kweaver-ai/idrm-go-frame/core/logx/zapx"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	af_trace "github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"github.com/redis/go-redis/v9"
)

var arg = MainArgs{
	Name:    "af_configuration_center",
	Version: "1.0",
}

func init() {
	flag.StringVar(&arg.ConfigPath, "confPath", "cmd/server/config/", "config path, eg: -conf config.yaml")
	flag.StringVar(&arg.Addr, "addr", ":8133", "config path, eg: -addr 0.0.0.0:8133")
}

// @title       configuration-center
// @version     0.0
// @description AnyFabric configuration center
// @BasePath    /api/configuration-center/v1
// @schemes https
func main() {
	runtime.GOMAXPROCS(runtime.NumCPU())
	flag.Parse()
	//加载配置文件
	config.InitSources(arg.ConfigPath)
	options := config.Scan[zapx.LogConfigs]()
	//log.Loads(options)
	//初始化验证器
	form_validator.SetupValidator()
	//模板配置
	excel.TemplateStruct = config.Scan[excel.Templates]()
	//解析规则配置
	excel.LineRulesStruct = config.Scan[excel.LineRules]()
	//init application controller
	settings.ConfigInstance = config.Scan[settings.ConfigContains]()
	//初始化日志
	tc := settings.ConfigInstance.Config.DepServices.TelemetryConf
	log.InitLogger(options.Logs, &tc)
	//初始化Telemetry
	if tc.TraceEnabled {
		// 初始化ar_trace
		tracerProvider := af_trace.InitTracer(&tc, "")
		defer func() {
			if err := tracerProvider.Shutdown(context.Background()); err != nil {
				panic(err)
			}
		}()
	}
	//初始化全局静态变量
	settings.Init()
	//region 读取数据库配置信息
	bc := config.Scan[conf.Bootstrap]()
	if arg.Addr != "" {
		bc.Server.Http.Addr = arg.Addr
	}
	database := config.Scan[db.Database]("database")
	//初始化redis配置
	redisConfig := config.Scan[settings.RedisConfig]()
	redisOption := &redis.Options{
		Addr:         redisConfig.Redis.Host,
		Password:     redisConfig.Redis.Password,
		DB:           redisConfig.Redis.DB,
		MinIdleConns: redisConfig.Redis.MinIdleConns,
	}
	expireTime, err := strconv.ParseInt(settings.ConfigInstance.Config.VEClientExpire, 10, 64)
	if err != nil {
		fmt.Println("expireTime use default 70s")
		settings.ConfigInstance.Config.VEClientExpireDuration = 70 * time.Second //大于引擎60s
	} else {
		settings.ConfigInstance.Config.VEClientExpireDuration = time.Duration(expireTime) * time.Second
	}
	//初始化excel
	if err := excel.InitExcel(); err != nil {
		panic(err)
	}
	appRunner, cleanup, err := InitApp(bc.Server, &database, redisOption)
	if err != nil {
		panic(err)
	}
	defer cleanup()

	//数据同步
	go StartCDC(&bc)

	go func() {
		if err = appRunner.Mq.Start(); err != nil {
			panic(err)
		}
	}()

	//start and wait for stop signal
	if err = appRunner.Run(); err != nil {
		panic(err)
	}
}
