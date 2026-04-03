package main

import (
	"context"
	"flag"
	"fmt"
	"strconv"

	"github.com/kweaver-ai/dsg/services/apps/session/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/session/common/cookie_util"
	"github.com/kweaver-ai/dsg/services/apps/session/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/session/common/initialization"
	"github.com/kweaver-ai/dsg/services/apps/session/common/settings"
	go_frame "github.com/kweaver-ai/idrm-go-frame"
	"github.com/kweaver-ai/idrm-go-frame/core/config"
	"github.com/kweaver-ai/idrm-go-frame/core/config/sources/env"
	"github.com/kweaver-ai/idrm-go-frame/core/config/sources/file"
	"github.com/kweaver-ai/idrm-go-frame/core/logx/zapx"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	af_trace "github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest"

	"github.com/spf13/viper"
)

var (
	Name     = "af_session"
	Version  = "1.0"
	confPath string
)

func init() {
	flag.StringVar(&confPath, "confPath", "cmd/server/config/", "config path, eg: --confPath config.yaml")
	flag.StringVar(&constant.StaticPath, "static", "", "static path, eg: --static cmd/server/static/*")
}

// @title       session
// @version     0.0
// @description AnyFabric session
// @BasePath /af/api/session/v1
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

	if err := c.Scan(&settings.ConfigInstance); err != nil {
		panic(err)
	}
	if settings.ConfigInstance.Doc.Host == "" {
		settings.ConfigInstance.Doc.Host = "127.0.0.1:8000"
	}
	// if settings.ConfigInstance.Config.Oauth.OauthClientID == "" || settings.ConfigInstance.Config.Oauth.OauthClientSecret == "" {
	// 	getOauth()
	// }
	expireTime, err := strconv.Atoi(settings.ConfigInstance.Config.SessionExpireSecond)
	if err != nil {
		fmt.Println("session expireTime use default 2h")
		settings.ConfigInstance.Config.SessionExpireSecondInt = 7200
	} else {
		settings.ConfigInstance.Config.SessionExpireSecondInt = expireTime
	}
	httpExpireTime, err := strconv.Atoi(settings.ConfigInstance.Config.HttpClientExpireSecond)
	if err != nil {
		fmt.Println("httpExpireTime use default 60s")
		settings.ConfigInstance.Config.HttpClientExpireSecondInt = 60
	} else {
		settings.ConfigInstance.Config.HttpClientExpireSecondInt = httpExpireTime
	}
	settings.CheckConfigPath()
	//settings.CheckConfig()

	// 初始化日志
	logConfigs := zapx.LogConfigs{}
	c.Scan(&logConfigs)
	tc := settings.ConfigInstance.Config.Telemetry
	log.InitLogger(logConfigs.Logs, &tc)
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

	if constant.StaticPath == "" {
		log.Info("--static empty")
		constant.StaticPath = settings.ConfigInstance.Config.StaticPath
	}

	initialization.Init()
	cookie_util.SetCookieDomain(context.Background())

	//初始化验证器
	form_validator.SetupValidator()
	form_validator.InitTrans("zh")

	fmt.Println(settings.ConfigInstance.HttpPort)
	appRunner, cleanup, err := InitApp(&settings.ConfigInstance)
	if err != nil {
		log.Errorf("initApp error %v", err.Error())
		defer cleanup()
	}
	// start and wait for stop signal
	if err = appRunner.Run(); err != nil {
		panic(err)
	}

}
func newApp(hs *rest.Server) *go_frame.App {
	return go_frame.New(
		go_frame.Name(Name),
		go_frame.Server(hs),
	)
}

// 适配新框架获取oauth的方法
func getOauth() {
	viper.SetConfigName("oauth-registry-info.yaml")
	viper.SetConfigType("yaml")
	viper.AddConfigPath("/etc/globalConfig/oauth/")
	err := viper.ReadInConfig()
	if err != nil {
		panic(fmt.Errorf("fatal error config file: %w", err))
	}
	//oauthClientID = viper.Get("session.oauthClientID").(string)
	//oauthClientSecret = viper.Get("session.oauthClientSecret").(string)
	settings.ConfigInstance.Config.Oauth.OauthClientID = viper.Get("session.oauthClientID").(string)
	settings.ConfigInstance.Config.Oauth.OauthClientSecret = viper.Get("session.oauthClientSecret").(string)
	settings.ConfigInstance.Config.Oauth.OauthClientID2 = viper.Get("webconsoleinterface.oauthClientID").(string)
	settings.ConfigInstance.Config.Oauth.OauthClientSecret2 = viper.Get("webconsoleinterface.oauthClientSecret").(string)
	return
}
