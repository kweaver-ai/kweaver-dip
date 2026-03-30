package gin

import (
	"github.com/kweaver-ai/idrm-go-frame/core/middleware/ginMiddleWare"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest"

	//"github.com/kweaver-ai/dsg/services/apps/session/cmd/server/docs"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/session/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/session/common/settings"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	"github.com/zeromicro/go-zero/core/logx"
)

func NewHttpServer(c *settings.ConfigContains, r IRouter) *rest.Server {

	engine := NewHttpEngine(r)

	httpSrv := rest.NewServer(engine, rest.Address(c.HttpPort))

	return httpSrv
}

// NewHttpEngine 创建了一个绑定了路由的Web引擎
func NewHttpEngine(r IRouter) *gin.Engine {
	// 设置为Release，为的是默认在启动中不输出调试信息
	gin.SetMode(gin.ReleaseMode)
	// 默认启动一个Web引擎
	app := gin.New()
	//app.ContextWithFallback = true

	// 默认注册recovery中间件
	app.Use(gin.Recovery())

	writer := log.NewZapWriter("af_session_request")
	logx.SetWriter(writer)

	app.Use(ginMiddleWare.GinZap(writer, time.RFC3339, false))
	app.Use(ginMiddleWare.RecoveryWithZap(writer, true))
	//app.Use(otelgin.Middleware("router"))

	app.LoadHTMLGlob(constant.StaticPath)
	//app.LoadHTMLFiles("cmd/server/static/index1.html", "cmd/server/static/index2.html")

	//docs.SwaggerInfo.Host = settings.ConfigInstance.Doc.Host
	//docs.SwaggerInfo.Version = settings.ConfigInstance.Doc.Version

	//app.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
	app.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
	// 业务绑定路由操作
	r.Register(app)

	// 返回绑定路由后的Web引擎
	return app
}
