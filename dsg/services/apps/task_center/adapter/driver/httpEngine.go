package driver

import (
	"errors"
	"io/ioutil"
	"net/http"
	"strings"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/data_catalog"
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driver/mq"
	"github.com/kweaver-ai/idrm-go-frame/core/transport"

	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/business_grooming"
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/configuration_center"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/user_util"
	"github.com/kweaver-ai/dsg/services/apps/task_center/domain/user"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest"
	"go.uber.org/zap"

	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/conf"
	"github.com/kweaver-ai/idrm-go-frame/core/middleware/ginMiddleWare"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	"github.com/zeromicro/go-zero/core/logx"
)

type CommonService struct {
	UserDomain              user.IUser
	BusinessGroomingCall    business_grooming.Call
	ConfigurationCenterCall configuration_center.Call
	catalogServiceCall      data_catalog.Call
}

func NewCommonService(
	userDomain user.IUser,
	b business_grooming.Call,
	c configuration_center.Call,
	dc data_catalog.Call,
) *CommonService {
	return &CommonService{
		UserDomain:              userDomain,
		BusinessGroomingCall:    b,
		ConfigurationCenterCall: c,
		catalogServiceCall:      dc,
	}
}

func (c *CommonService) InitCommonService() {
	//初始化用户信息查询工具
	user_util.InitUserDomain(c.UserDomain)
	//初始化远程调用
	business_grooming.Service = c.BusinessGroomingCall
	configuration_center.Service = c.ConfigurationCenterCall
	data_catalog.Service = c.catalogServiceCall
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

func NewHttpServer(c *conf.Server, r IRouter, mq *mq.MQConsumerService) []transport.Server {
	engine := NewHttpEngine(r)
	httpSrv := rest.NewServer(engine, rest.Address(c.Http.Addr))
	//mq server
	return []transport.Server{httpSrv, mq}
}

// NewHttpEngine 创建了一个绑定了路由的Web引擎
func NewHttpEngine(r IRouter) *gin.Engine {
	// 设置为Release，为的是默认在启动中不输出调试信息
	gin.SetMode(gin.ReleaseMode)
	// 默认启动一个Web引擎
	app := gin.New()
	app.ContextWithFallback = true

	// 默认注册recovery中间件
	app.Use(gin.Recovery())

	//writer := zapx.ZapWriter(*zapx.GetLogger("task_center_request"))

	writer := log.NewZapWriter("task_center_request")
	logx.SetWriter(writer)

	app.Use(ginMiddleWare.GinZap(writer, time.RFC3339, false))
	app.Use(ginMiddleWare.RecoveryWithZap(writer, true))
	//app.Use(otelgin.Middleware("router"))

	//app.GET("/swagger/*any", handleReDoc)
	app.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
	// 业务绑定路由操作
	r.Register(app)

	// 返回绑定路由后的Web引擎
	return app
}
