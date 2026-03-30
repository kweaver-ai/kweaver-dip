package controller

import (
	"errors"
	"io/ioutil"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/settings"
	"github.com/kweaver-ai/idrm-go-frame/core/middleware/ginMiddleWare"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	"github.com/zeromicro/go-zero/core/logx"
	"go.uber.org/zap"
)

func handleReDoc(ctx *gin.Context) {

	i := strings.LastIndex(ctx.Request.URL.Path, "/")
	if i == -1 {
		return
	}
	suffix := ctx.Request.URL.Path[i+1:]
	filePath := "cmd/server/docs/" + suffix
	data, err := ioutil.ReadFile(filePath)
	if err != nil {
		log.Error("read file error", zap.Error(err))
		_ = ctx.AbortWithError(http.StatusNotFound, errors.New("page not found"))
		return
	}
	n, err := ctx.Writer.Write(data)
	if n <= 0 || err != nil {
		_ = ctx.AbortWithError(http.StatusNotFound, errors.New("page not found"))
		return
	}
}

func NewHttpServer(r IRouter) *rest.Server {
	docHost := settings.GetConfig().ServerConf.SwagConf.Host

	// 设置为Release，为的是默认在启动中不输出调试信息
	// gin.SetMode(gin.ReleaseMode)
	// 默认启动一个Web引擎
	engine := gin.New()
	engine.ContextWithFallback = true

	// 默认注册recovery中间件
	engine.Use(gin.Recovery())

	writer := log.NewZapWriter("data_catalog_request")
	logx.SetWriter(writer)

	engine.Use(ginMiddleWare.GinZap(writer, time.RFC3339, false))
	engine.Use(ginMiddleWare.RecoveryWithZap(writer, true))

	if len(docHost) > 0 {
		// app.GET("/swagger/*any", handleReDoc)
		engine.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
		// 业务绑定路由操作
		r.Register(engine)
		r.RegisterInternal(engine)

	}

	return rest.NewServer(engine, rest.Address(settings.GetConfig().ServerConf.HttpConf.Host))
}
