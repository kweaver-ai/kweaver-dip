package gin

import (
	"github.com/gin-gonic/gin"
	"github.com/google/wire"
	"github.com/kweaver-ai/dsg/services/apps/session/adapter/driven/audit"
	login "github.com/kweaver-ai/dsg/services/apps/session/adapter/driver/gin/login/v1"
	logout "github.com/kweaver-ai/dsg/services/apps/session/adapter/driver/gin/logout/v1"
	refresh_token "github.com/kweaver-ai/dsg/services/apps/session/adapter/driver/gin/refresh_token/v1"
	user_info "github.com/kweaver-ai/dsg/services/apps/session/adapter/driver/gin/user_info/v1"
	af_trace "github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
)

var _ IRouter = (*Router)(nil)

var RouterSet = wire.NewSet(wire.Struct(new(Router), "*"), wire.Bind(new(IRouter), new(*Router)))

type IRouter interface {
	Register(r *gin.Engine)
}

type Router struct {
	Login        *login.Login
	Logout       *logout.LogOut
	RefreshToken *refresh_token.RefreshToken
	UserInfo     *user_info.UserInfo
}

func (r *Router) Register(engine *gin.Engine) {
	engine.Use(af_trace.MiddlewareTrace())
	engine.Use(audit.SetAgent()) //获取agent信息
	sessionRouter := engine.Group("/af/api/session/v1")
	{
		sessionRouter.GET("/login", r.Login.Login)                  //请求授权
		sessionRouter.GET("/login/callback", r.Login.LoginCallback) //登录回调
		//sessionRouter.GET("/login/callback2", r.Login.LoginCallback2)
		sessionRouter.GET("/logout", r.Logout.LogOut)                    //登出
		sessionRouter.GET("/logout/callback", r.Logout.LogOutCallback)   //登出回调
		sessionRouter.GET("/refresh-token", r.RefreshToken.RefreshToken) //刷新授权
		sessionRouter.GET("/username", r.UserInfo.GetUserName)           //获取用户名称
		sessionRouter.GET("/userinfo", r.UserInfo.GetUserInfo)           //获取用户信息
		sessionRouter.POST("/sso", r.Login.SingleSignOn)                 //第三方登录认证（anyshare）
		sessionRouter.GET("/platform", r.Login.GetPlatform)              //获取登录平台
		sessionRouter.GET("/sso", r.Login.SingleSignOn2)                 //单点登录认证
	}
}
