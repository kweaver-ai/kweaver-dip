package driver

import (
	"time"

	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/common/settings"
	log "github.com/kweaver-ai/idrm-go-frame/core/logx/zapx"
	"github.com/kweaver-ai/idrm-go-frame/core/middleware/ginMiddleWare"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest"
	"github.com/samber/lo"
	"github.com/zeromicro/go-zero/core/logx"
	"go.opentelemetry.io/contrib/instrumentation/github.com/gin-gonic/gin/otelgin"
)

func NewHttpServer(r IRouter, httpCfg settings.HttpConf) *rest.Server {
	addr := lo.Ternary(len(httpCfg.Addr) > 0, httpCfg.Addr, settings.GetConfig().ServerConf.HttpConf.Addr)
	app := NewHttpEngine(r)
	httpSrv := rest.NewServer(app, rest.Address(addr))
	return httpSrv
}

// NewHttpEngine 创建了一个绑定了路由的Web引擎
func NewHttpEngine(r IRouter) *gin.Engine {
	// 设置为Release，为的是默认在启动中不输出调试信息

	if settings.GetConfig().SysConf.Mode == settings.SysConfModeRelease {
		gin.SetMode(gin.ReleaseMode)
	}

	engine := ginEngine()

	//docs.SwaggerInfo.Host = settings.GetConfig().ServerConf.SwagConf.Host
	//docs.SwaggerInfo.Version = settings.GetConfig().ServerConf.SwagConf.Version

	//app.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
	//使用新皮肤
	//app.GET("/swagger/*any", handleReDoc)

	// 业务绑定路由操作
	if err := r.Register(engine); err != nil {
		panic(err)
	}

	// 返回绑定路由后的Web引擎
	return engine
}

func ginEngine() *gin.Engine {
	// 默认启动一个Web引擎
	app := gin.New()
	app.ContextWithFallback = true

	// 默认注册recovery中间件
	app.Use(gin.Recovery())

	writer := log.NewZapWriter("data_exploration_request")
	logx.SetWriter(writer)

	app.Use(ginMiddleWare.GinZap(writer, time.RFC3339, false))
	app.Use(ginMiddleWare.RecoveryWithZap(writer, true))
	app.Use(otelgin.Middleware("router"))

	return app
}
