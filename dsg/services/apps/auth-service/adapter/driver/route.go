package driver

import (
	"bytes"
	"context"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/wire"

	auth_v2 "github.com/kweaver-ai/dsg/services/apps/auth-service/adapter/driver/v2/auth"
	"github.com/kweaver-ai/idrm-go-common/interception"
	"github.com/kweaver-ai/idrm-go-common/middleware"
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

func ResponseLoggerMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		blw := &bodyLogWriter{body: bytes.NewBufferString(""), ResponseWriter: c.Writer}
		c.Writer = blw

		c.Next()

		if c.Writer.Status() != 200 {
			log.WithContext(c.Request.Context()).Errorf("%s", blw.body.String())
		}
	}
}

type IRouter interface {
	Register(r *gin.Engine) error
}

type Router struct {
	Middleware       middleware.Middleware
	AuthV2Controller *auth_v2.Controller
}

func (r *Router) Register(engine *gin.Engine) error {
	engine.Use(trace.MiddlewareTrace())
	engine.Use(ResponseLoggerMiddleware())
	r.RegisterApi(engine)
	return nil
}

func LocalToken() gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenID := c.GetHeader("Authorization")
		userInfo := &middleware.User{
			ID:   "82cdcd86-dbf1-11f0-af22-f69a51d1d671",
			Name: "zyy",
		}
		c.Set(interception.InfoName, userInfo)
		c.Set(interception.Token, tokenID)
		c.Set(interception.TokenType, interception.TokenTypeUser)
		c.Request = c.Request.WithContext(context.WithValue(c.Request.Context(), interception.InfoName, userInfo))
		c.Request = c.Request.WithContext(context.WithValue(c.Request.Context(), interception.Token, tokenID))

		c.Next()
	}
}

func (r *Router) RegisterApi(engine *gin.Engine) {
	router := engine.Group("/api/auth-service/v1", r.Middleware.TokenInterception())
	router.Use(r.Middleware.AuditLogger())
	routerInternal := engine.Group("/api/internal/auth-service/v1")

	{
		policyRouter := router.Group("/policy")
		policyRouter.POST("", r.AuthV2Controller.Create)   // 策略创建
		policyRouter.GET("", r.AuthV2Controller.Get)       // 策略详情
		policyRouter.PUT("", r.AuthV2Controller.Update)    // 策略更新
		policyRouter.DELETE("", r.AuthV2Controller.Delete) // 策略删除

		//资源接口
		router.GET("/subject/objects", r.AuthV2Controller.GetObjectsBySubjectId)     // 访问者拥有的资源
		router.GET("/sub-views", r.AuthV2Controller.ListSubViews)                    // 获取拥有指定动作权限的子视图列表
		router.GET("/menu-resource/actions", r.AuthV2Controller.MenuResourceActions) //查询菜单资源的允许的操作
		//策略验证
		rawRouter := engine.Group("/api/auth-service/v1")
		rawRouter.POST("/enforce", setContextWithToken, r.AuthV2Controller.Enforce) //策略验证
		//内部接口
		//routerInternal.GET("policies", r.AuthV2Controller.ListPolicies)                                            //获取策略列表
		routerInternal.GET("/objects/policy/expired", r.AuthV2Controller.QueryPolicyExpiredObjects)                //查询某个资源有没有过期的
		routerInternal.POST("/enforce", setContextWithToken, r.AuthV2Controller.Enforce)                           //数据权限验证
		routerInternal.POST("/rule/enforce", setContextWithToken, r.AuthV2Controller.RuleEnforce)                  //数据策略验证
		routerInternal.POST("/menu-resource/enforce", setContextWithToken, r.AuthV2Controller.MenuResourceEnforce) //权限资源验证, 废弃
		routerInternal.GET("/menu-resource/actions", setContextWithToken, r.AuthV2Controller.MenuResourceActions)  //查询菜单资源的允许的操作
	}

}

// setContextWithToken 不进行身份认证，只是在 context 中设置 token 用于向 configuration-center 查询用户拥有的角色
func setContextWithToken(c *gin.Context) {
	tokenID := c.GetHeader("Authorization")
	if tokenID == "" {
		return
	}
	token := strings.TrimPrefix(tokenID, "Bearer ")
	c.Set(interception.Token, token)
	c.Request = c.Request.WithContext(context.WithValue(c.Request.Context(), interception.Token, token))
}
