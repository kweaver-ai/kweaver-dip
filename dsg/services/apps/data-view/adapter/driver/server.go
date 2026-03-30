package driver

import (
	"errors"
	"io/ioutil"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/data-view/cmd/server/docs"
	my_config "github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/config"
	"github.com/kweaver-ai/idrm-go-frame/core/middleware/ginMiddleWare"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	"github.com/zeromicro/go-zero/core/logx"
	"go.uber.org/zap"
)

//func NewHttpEngine(conf *my_config.Bootstrap, r IRouter) *gin.Engine {

func NewHttpEngine(conf *my_config.Bootstrap, r IRouter) *rest.Server {
	// 设置为Release，为的是默认在启动中不输出调试信息
	gin.SetMode(gin.ReleaseMode)
	// 默认启动一个Web引擎
	engine := gin.New()

	// 默认注册recovery中间件
	engine.Use(gin.Recovery())

	writer := log.NewZapWriter(conf.Server.Name + "_request")
	logx.SetWriter(writer)

	engine.Use(ginMiddleWare.GinZap(writer, time.RFC3339, false))
	engine.Use(ginMiddleWare.RecoveryWithZap(writer, true))
	//engine.Use(otelgin.Middleware("router"))

	docs.SwaggerInfo.Host = conf.Doc.Host
	docs.SwaggerInfo.Version = conf.Doc.Version
	// engine.GET("/swagger/*any", handleReDoc)
	engine.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	r.Register(engine)
	r.RegisterInternal(engine)
	r.RegisterMigration(engine)

	// 返回绑定路由后的Web引擎
	return rest.NewServer(engine, rest.Address(conf.Server.Http.Addr))

}
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
