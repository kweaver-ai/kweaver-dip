package v1

import (
	"fmt"
	"net/http"
	"net/url"

	"github.com/kweaver-ai/dsg/services/apps/session/adapter/driven/audit"
	"github.com/kweaver-ai/dsg/services/apps/session/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/session/domain/d_session"
	"github.com/kweaver-ai/idrm-go-common/built_in"

	"github.com/gin-gonic/gin"
	deploy_management "github.com/kweaver-ai/dsg/services/apps/session/adapter/driven/http_client/deploy_manager"
	"github.com/kweaver-ai/dsg/services/apps/session/common/cookie_util"
	"github.com/kweaver-ai/dsg/services/apps/session/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/session/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/session/common/units"
	domain "github.com/kweaver-ai/dsg/services/apps/session/domain/logout"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
	"go.uber.org/zap"
)

type LogOut struct {
	logoutService domain.LogOutService
	deployMgm     deploy_management.DrivenDeployMgm
}

func NewLogOut(l domain.LogOutService, d deploy_management.DrivenDeployMgm) *LogOut {
	return &LogOut{
		logoutService: l,
		deployMgm:     d,
	}
}

const RedirectURL = "/anyfabric"

// LogOut  godoc
// @Summary     登出接口
// @Description 登出接口，重定向到登出接口
// @Accept      plain
// @Produce     text/html
// @Tags        session
// @Success     301
// @Failure     400 {object} rest.HttpError
// @Router      /logout [GET]
func (l *LogOut) LogOut(c *gin.Context) {
	var err error
	ctx, span := trace.StartInternalSpan(c.Request.Context())
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	cookies, err := cookie_util.GetSession(c)
	if err != nil {
		cookies, err = cookie_util.GetSessionFromHeader(c)
		if err != nil {
			log.WithContext(ctx).Errorf("LogOut failed GetCookieValue, err: %v", err)
			l.clearCookie(c)
			LogOutHTML(c, nil) //cookies not find , direct ASRedirect not call back
			return
		}
	}
	log.Infof("Session logout :[%s]", cookies.SessionId)
	sessionInfo, err := l.logoutService.GetSession(ctx, cookies)
	if err != nil {
		l.clearCookie(c)
		LogOutHTML(c, nil) //session not find , direct Revoke not call back
		return
	}
	if sessionInfo.SSO == constant.SSOLogin {
		err = l.logoutService.RevokeADelSession(ctx, sessionInfo, cookies.SessionId)
		if err != nil {
			c.Writer.WriteHeader(http.StatusBadRequest)
			return
		}
		LogOutHTML(c, sessionInfo)
		return
	}
	log.Infof("LogOut sessionInfo : %v,%v", sessionInfo.IdToken, sessionInfo.State)
	GetHostRes, err := l.deployMgm.GetHost(ctx)
	if err != nil {
		log.WithContext(ctx).Error("deployMgm GetHost error", zap.Error(err))
		l.logoutService.DelSessionAndRevoke(c, cookies, sessionInfo)
		l.clearCookie(c)
		LogOutHTML(c, nil)
		return
	}
	url := fmt.Sprintf("https://%s:%s", units.ParseHost(GetHostRes.Host), GetHostRes.Port)
	//url := fmt.Sprintf("https://%s:%s", "10.4.132.246", "443")
	redirectUri := fmt.Sprintf(`/oauth2/sessions/logout`+
		`?post_logout_redirect_uri=%s/af/api/session/v1/logout/callback`+
		`&id_token_hint=%s`+
		`&state=%s`, url, sessionInfo.IdToken, sessionInfo.State)
	c.Redirect(http.StatusMovedPermanently, redirectUri)
	log.Info("LogOut finish")

}

type LogoutCallbackReq struct {
	State            string `json:"state" form:"state"`
	Error            string `json:"error" form:"error"`
	ErrorDescription string `json:"error_description" form:"error_description"`
	ErrorHint        string `json:"error_hint" form:"error_hint"`
}

// LogOutCallback  godoc
// @Summary     登出回调接口
// @Description 登出回调接口，接收回调请求
// @Accept      plain
// @Produce     text/html
// @param       state query string true "随机字符串"
// @param       error query string true "错误码"
// @Tags        session
// @Success     301
// @Failure     400 {object} rest.HttpError
// @Router      /logout/callback [GET]
func (l *LogOut) LogOutCallback(c *gin.Context) {
	var err error
	ctx, span := trace.StartInternalSpan(c.Request.Context())
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	log.Infof("LogOutCallback URL : %s", c.Request.URL.String())
	cookies, err := cookie_util.GetSession(c)
	if err != nil {
		log.WithContext(ctx).Errorf("LogOutCallback failed GetCookieValue, err: %v", err)
		l.clearCookie(c)
		//ginx.ResErrJson(c, errorcode.Detail(errorcode.GetCookieValueNotExist, err))
		LogOutHTML(c, nil)
		return
	}
	log.Infof("Session logout callback :[%s]", cookies.SessionId)
	req := &LogoutCallbackReq{}
	valid, err := form_validator.BindQueryAndValid(c, req)
	if !valid {
		log.WithContext(ctx).Errorf("LogOutCallback failed BindQueryAndValid, err: %v", err)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}
	if req.Error != "" {
		log.WithContext(ctx).Errorf("LogOutCallback req error err: %v ", err)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.DoLogOutCallBackFailed, err))
		return
	}
	ctx = audit.SaveAgent(c, ctx)
	sessionInfo, err := l.logoutService.DoLogOutCallBack(ctx, cookies, req.State)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		LogOutHTML(c, sessionInfo)
		return
	}
	l.clearCookie(c)
	LogOutHTML(c, sessionInfo)
	log.Info("LogOutCallback success")
}
func LogOutHTML(c *gin.Context, sessionInfo *d_session.SessionInfo) {
	switch sessionInfo.Platform {
	case built_in.NormalPlatform:
		c.HTML(http.StatusOK, "index.html", gin.H{"url": "/anyfabric/login"})
	case built_in.DataResourceManagementBackupPlatform:
		c.HTML(http.StatusOK, "index.html", gin.H{"url": "/anyfabric/drmb/login"})
	case built_in.DataResourceManagementPortalPlatform:
		c.HTML(http.StatusOK, "index.html", gin.H{"url": "/anyfabric/drmp/login"})
	case built_in.CognitiveApplicationPlatform:
		c.HTML(http.StatusOK, "index.html", gin.H{"url": "/anyfabric/ca/login"})
	default:
		c.HTML(http.StatusBadRequest, "index.html", gin.H{"url": "/anyfabric"})
	}
}

func (l *LogOut) clearCookie(c *gin.Context) {
	// c.SetCookie(cookie_util.SessionId, "", -1, "/", cookie_util.CookieDomain, false, false)
	http.SetCookie(c.Writer, &http.Cookie{
		Name:     cookie_util.SessionId,
		Value:    url.QueryEscape(""),
		MaxAge:   -1,
		Path:     "/",
		Domain:   cookie_util.CookieDomain,
		SameSite: http.SameSiteNoneMode,
		Secure:   true,
		HttpOnly: false,
	})
	// c.SetCookie(cookie_util.Oauth2Token, "", -1, "/", cookie_util.CookieDomain, false, false)
	http.SetCookie(c.Writer, &http.Cookie{
		Name:     cookie_util.Oauth2Token,
		Value:    url.QueryEscape(""),
		MaxAge:   -1,
		Path:     "/",
		Domain:   cookie_util.CookieDomain,
		SameSite: http.SameSiteNoneMode,
		Secure:   true,
		HttpOnly: false,
	})
	//c.SetCookie(cookie_util.UserName, "", -1, "/", cookie_util.CookieDomain, false, false)
	// c.SetCookie(cookie_util.Userid, "", -1, "/", cookie_util.CookieDomain, false, false)
	http.SetCookie(c.Writer, &http.Cookie{
		Name:     cookie_util.Userid,
		Value:    url.QueryEscape(""),
		MaxAge:   -1,
		Path:     "/",
		Domain:   cookie_util.CookieDomain,
		SameSite: http.SameSiteNoneMode,
		Secure:   true,
		HttpOnly: false,
	})

}
