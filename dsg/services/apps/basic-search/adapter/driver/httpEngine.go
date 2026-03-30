package driver

import (
	"errors"
	"io/ioutil"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/basic-search/common/settings"
	"github.com/kweaver-ai/idrm-go-frame/core/middleware/ginMiddleWare"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest"
	"github.com/zeromicro/go-zero/core/logx"
	"go.opentelemetry.io/contrib/instrumentation/github.com/gin-gonic/gin/otelgin"
	"go.uber.org/zap"
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
			log.Error("read file error", zap.Error(err))
			_ = ctx.AbortWithError(http.StatusNotFound, errors.New("page not found"))
			return
		}
		_, _ = ctx.Writer.Write(data)
		return
	default:
		_ = ctx.AbortWithError(http.StatusNotFound, errors.New("page not found"))
	}
}

func NewHttpServer(r IRouter) *rest.Server {

	engine := NewHttpEngine(settings.GetConfig().ServerConf.SwagConf.Host, r)

	httpSrv := rest.NewServer(engine, rest.Address(settings.GetConfig().ServerConf.HttpConf.Host))

	return httpSrv
}

// NewHttpEngine 创建了一个绑定了路由的Web引擎
func NewHttpEngine(docHost string, r IRouter) *gin.Engine {
	// 设置为Release，为的是默认在启动中不输出调试信息
	gin.SetMode(gin.ReleaseMode)
	// 默认启动一个Web引擎
	app := gin.New()
	app.ContextWithFallback = true

	// 默认注册recovery中间件
	app.Use(gin.Recovery())

	writer := log.NewZapWriter("basic_search_request")
	logx.SetWriter(writer)

	app.Use(ginMiddleWare.GinZap(writer, time.RFC3339, false))
	app.Use(ginMiddleWare.RecoveryWithZap(writer, true))
	app.Use(otelgin.Middleware("router"))

	if len(docHost) > 0 {
		app.GET("/swagger/*any", handleReDoc)
		// 业务绑定路由操作
		err := r.Register(app)
		if err != nil {
			panic(err)
		}
	}

	// 返回绑定路由后的Web引擎
	return app
}
