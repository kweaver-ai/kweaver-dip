package driver

import (
	"bytes"

	"github.com/gin-gonic/gin"
	"github.com/google/wire"
	"go.uber.org/zap"

	"github.com/kweaver-ai/dsg/services/apps/data-application-gateway/adapter/driver/v1/query"
	"github.com/kweaver-ai/dsg/services/apps/data-application-gateway/common/settings"
	"github.com/kweaver-ai/idrm-go-common/middleware"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/common"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
)

var _ IRouter = (*Router)(nil)

var RouterSet = wire.NewSet(wire.Struct(new(Router), "*"), wire.Bind(new(IRouter), new(*Router)))

type bodyLogWriter struct {
	gin.ResponseWriter
	body *bytes.Buffer
}

func (w bodyLogWriter) Write(b []byte) (int, error) {
	w.body.Write(b)
	return w.ResponseWriter.Write(b)
}

func RequestLoggerMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		//var buf bytes.Buffer
		//tee := io.TeeReader(c.Request.Body, &buf)
		//body, _ := ioutil.ReadAll(tee)
		//c.Request.Body = ioutil.NopCloser(&buf)

		//buffer := new(bytes.Buffer)
		//if len(body) > 0 {
		//	if strings.ToLower(c.ContentType()) == "application/json" {
		//		if err := json.Compact(buffer, body); err != nil {
		//			log.WithContext(ctx).Error("RequestLoggerMiddleware", zap.Error(err))
		//		}
		//	}
		//}

		log.Info("request",
			zap.String("remote_ip", c.RemoteIP()),
			zap.String("method", c.Request.Method),
			zap.String("uri", c.Request.URL.String()),
			//zap.String("body", buffer.String()),
		)
		c.Next()
	}
}

func ResponseLoggerMiddleware(level string) gin.HandlerFunc {
	return func(c *gin.Context) {
		if level != common.ALL && level != common.TRACE {
			return
		}
		blw := &bodyLogWriter{body: bytes.NewBufferString(""), ResponseWriter: c.Writer}
		c.Writer = blw

		c.Next()

		if c.Writer.Status() != 200 {
			log.WithContext(c).Errorf("%s", blw.body.String())
		}
	}
}

type IRouter interface {
	Register(s *settings.Settings, r *gin.Engine) error
}

type Router struct {
	Middleware      middleware.Middleware
	QueryController *query.QueryController
}

func (r *Router) Register(s *settings.Settings, engine *gin.Engine) error {
	r.RegisterApi(s, engine)
	return nil
}

func (r *Router) NoTokenInterception() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()
	}
}

func (r *Router) RegisterApi(s *settings.Settings, engine *gin.Engine) {
	engine.Use(trace.MiddlewareTrace(), ResponseLoggerMiddleware(s.Telemetry.LogLevel))
	//数据查询
	engine.Any("/data-application-gateway/*service_path", r.Middleware.ShouldTokenInterception(), r.QueryController.Query)
	//数据查询测试
	engine.Any("/api/data-application-gateway/v1/query-test", r.Middleware.TokenInterception(), r.QueryController.QueryTest)
}
