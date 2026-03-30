package driver

import (
	"errors"
	"io/ioutil"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/settings"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/conf"
	"github.com/kweaver-ai/idrm-go-frame/core/middleware/ginMiddleWare"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"

	"github.com/zeromicro/go-zero/core/logx"
	"go.uber.org/zap"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/cmd/server/docs"
)

func handleReDoc(ctx *gin.Context) {
	i := strings.LastIndex(ctx.Request.URL.Path, "/")
	if i == -1 {
		return
	}
	suffix := ctx.Request.URL.Path[i+1:]
	switch suffix {
	case "index.html":
		data, err := ioutil.ReadFile("cmd/server/docs/index.html")
		if err != nil {
			log.WithContext(ctx).Error("read file error", zap.Error(err))
			_ = ctx.AbortWithError(http.StatusNotFound, errors.New("page not found"))
			return
		}
		_, _ = ctx.Writer.Write(data)
		return
	default:
		_ = ctx.AbortWithError(http.StatusNotFound, errors.New("page not found"))
	}
}

func NewHttpServer(c *conf.Server, r IRouter) *rest.Server {

	engine := NewHttpEngine(r)

	httpSrv := rest.NewServer(engine, rest.Address(c.Http.Addr))

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

	writer := log.NewZapWriter("configuration_center_request")
	logx.SetWriter(writer)

	app.Use(ginMiddleWare.GinZap(writer, time.RFC3339, false))
	app.Use(ginMiddleWare.RecoveryWithZap(writer, true))
	//app.Use(otelgin.Middleware("router"))

	docs.SwaggerInfo.Host = settings.SwagConfig.Doc.Host
	docs.SwaggerInfo.Version = settings.SwagConfig.Doc.Version

	//app.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
	//使用新皮肤
	app.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// 业务绑定路由操作
	err := r.Register(app)
	if err != nil {
		panic(err)
	}

	// 返回绑定路由后的Web引擎
	return app
}
