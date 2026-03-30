package driver

import (
	"errors"
	"io/ioutil"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	"github.com/kweaver-ai/dsg/services/apps/data-application-service/cmd/server/docs"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/settings"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest"
)

func NewHttpServer(s *settings.Settings, r IRouter) *rest.Server {

	engine := NewHttpEngine(r)

	httpSrv := rest.NewServer(engine, rest.Address(s.Server.Http.Addr))

	return httpSrv
}

// NewHttpEngine 创建了一个绑定了路由的Web引擎
func NewHttpEngine(r IRouter) *gin.Engine {
	// 设置为Release，为的是默认在启动中不输出调试信息
	gin.SetMode(gin.ReleaseMode)
	// 默认启动一个Web引擎
	app := gin.New()

	// 默认注册recovery中间件
	app.Use(gin.Recovery())

	//writer := log.NewZapWriter()
	//logx.SetWriter(writer)

	//app.Use(ginMiddleWare.GinZap(writer, time.RFC3339, false))
	//app.Use(ginMiddleWare.RecoveryWithZap(writer, true))

	docs.SwaggerInfo.Host = settings.Instance.Doc.Host
	docs.SwaggerInfo.Version = settings.Instance.Doc.Version

	app.GET("/swagger/*any", handleReDoc)
	// 业务绑定路由操作
	err := r.Register(app)
	if err != nil {
		panic(err)
	}

	// 返回绑定路由后的Web引擎
	return app
}

func handleReDoc(ctx *gin.Context) {
	executable, err := os.Executable()
	if err != nil {
		log.Panic("handleReDoc", zap.Error(err))
		return
	}

	executableDir := filepath.Dir(executable)

	log.Info("handleReDoc", zap.String("executableDir", executableDir))

	i := strings.LastIndex(ctx.Request.URL.Path, "/")
	if i == -1 {
		return
	}
	suffix := ctx.Request.URL.Path[i+1:]
	switch suffix {
	case "doc.json":
		data, err := ioutil.ReadFile(executableDir + "/cmd/server/docs/swagger.json")
		if err != nil {
			log.Panic("open swagger.json", zap.Error(err))
		}

		_, _ = ctx.Writer.Write(data)
		return
	case "index.html", "":
		data, err := ioutil.ReadFile(executableDir + "/cmd/server/docs/index.html")
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
