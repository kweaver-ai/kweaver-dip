package v1

import (
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/kweaver-ai/dsg/services/apps/session/adapter/driven/audit"
	"github.com/kweaver-ai/dsg/services/apps/session/adapter/driven/http_client"
	deploy_management "github.com/kweaver-ai/dsg/services/apps/session/adapter/driven/http_client/deploy_manager"
	"github.com/kweaver-ai/dsg/services/apps/session/adapter/driven/http_client/oauth2"
	_ "github.com/kweaver-ai/dsg/services/apps/session/adapter/driven/http_client/oauth2"
	logout "github.com/kweaver-ai/dsg/services/apps/session/adapter/driver/gin/logout/v1"
	"github.com/kweaver-ai/dsg/services/apps/session/common/cookie_util"
	"github.com/kweaver-ai/dsg/services/apps/session/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/session/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/session/common/settings"
	"github.com/kweaver-ai/dsg/services/apps/session/common/units"
	"github.com/kweaver-ai/dsg/services/apps/session/domain/d_session"
	domain "github.com/kweaver-ai/dsg/services/apps/session/domain/login"
	"github.com/kweaver-ai/idrm-go-common/built_in"
	"github.com/kweaver-ai/idrm-go-frame/core/errorx/agerrors"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
	"go.uber.org/zap"
)

type Login struct {
	loginService domain.LoginService
	redisClient  d_session.Session
	deployMgm    deploy_management.DrivenDeployMgm
}

func NewLogin(
	l domain.LoginService,
	r d_session.Session,
	d deploy_management.DrivenDeployMgm,
) *Login {
	return &Login{
		loginService: l,
		redisClient:  r,
		deployMgm:    d,
	}
}

// Login  godoc
// @Summary     登录接口
// @Description 登录接口，重定向到请求授权接口
// @Accept      plain
// @Produce     text/html
// @Tags        session
// @Success     301
// @Failure     400 {object} rest.HttpError
// @Router      /login [GET]
func (l *Login) Login(c *gin.Context) {
	req := &domain.LoginReq{}
	if _, err := form_validator.BindQueryAndValid(c, req); err != nil {
		c.HTML(http.StatusOK, "index.html", gin.H{"url": "/anyfabric"})
		return
	}
	var err error
	ctx, span := trace.StartInternalSpan(c.Request.Context())
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	token, err := c.Cookie(cookie_util.Oauth2Token)
	if err == nil {
		tokenEffect, err := l.loginService.TokenEffect(c, token)
		if err == nil && tokenEffect {
			if req.ASRedirect != "" {
				c.Redirect(http.StatusMovedPermanently, req.ASRedirect)
			} else {
				LogSuccessHTML(c, req.Platform)
			}
		}
	}

	state := units.RandLenRandString(10, 50)
	nonce := units.RandLenRandString(10, 50)
	sessionId, err := c.Cookie(cookie_util.SessionId)
	if err != nil {
		err = nil
		sessionId = uuid.New().String()
		log.Infof("sessionId create :%s", sessionId)
		// c.SetCookie(cookie_util.SessionId, sessionId, cookie_util.CookieTimeOut, "/", cookie_util.CookieDomain, false, false)
		http.SetCookie(c.Writer, &http.Cookie{
			Name:     cookie_util.SessionId,
			Value:    url.QueryEscape(sessionId),
			MaxAge:   cookie_util.CookieTimeOut,
			Path:     "/",
			Domain:   cookie_util.CookieDomain,
			SameSite: http.SameSiteNoneMode,
			Secure:   true,
			HttpOnly: false,
		})
		err = l.redisClient.SaveSession(ctx, sessionId, &d_session.SessionInfo{
			State:      state,
			Platform:   req.Platform,
			ASRedirect: req.ASRedirect,
		})
		if err != nil {
			c.Writer.WriteHeader(http.StatusBadRequest)
			time.Sleep(time.Second)
			c.HTML(http.StatusOK, "index.html", gin.H{"url": "/anyfabric"})
			return
		}
		log.Infof("New Session:[%s]", sessionId)
	} else {
		session, err := l.redisClient.GetSession(ctx, sessionId)
		if err != nil {
			log.Info("Login GetSession error", zap.Error(err))
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
			time.Sleep(time.Second)
			c.HTML(http.StatusOK, "index.html", gin.H{"url": "/anyfabric"})
			return
		}
		if req.Platform != session.Platform || req.ASRedirect != session.ASRedirect {
			session.Platform = req.Platform
			session.ASRedirect = req.ASRedirect
			if err = l.redisClient.SaveSession(ctx, sessionId, session); err != nil {
				c.HTML(http.StatusOK, "index.html", gin.H{"url": "/anyfabric"})
				return
			}
		}
		state = session.State
		log.Infof("Session login :[%s]", sessionId)
	}
	GetHostRes, err := l.deployMgm.GetHost(ctx)
	if err != nil {
		log.Info("deployMgm GetHost error", zap.Error(err))
		c.Writer.WriteHeader(http.StatusBadRequest)
		//ginx.ResErrJson(c, errorcode.Detail(errorcode.GetHostError, err))
		time.Sleep(time.Second)
		c.HTML(http.StatusOK, "index.html", gin.H{"url": "/anyfabric"})
		return
	}
	url := fmt.Sprintf("https://%s:%s", units.ParseHost(GetHostRes.Host), GetHostRes.Port)
	redirectUri := fmt.Sprintf(`/oauth2/auth`+
		`?redirect_uri=%s/af/api/session/v1/login/callback`+
		`&client_id=%s`+
		`&scope=openid+offline+all`+
		`&response_type=code`+
		`&state=%s`+
		`&nonce=%s`, url, settings.ConfigInstance.Config.Oauth.OauthClientID, state, nonce)
	c.Redirect(http.StatusMovedPermanently, redirectUri)
	log.Info("【Login Redirect success】")
}

type LoginCallbackReq struct {
	Code             string `json:"code" form:"code"`
	State            string `json:"state" form:"state"`
	Error            string `json:"error" form:"error"`
	ErrorDescription string `json:"error_description" form:"error_description"`
	ErrorHint        string `json:"error_hint" form:"error_hint"`
}

// LoginCallback  godoc
// @Summary     登录回调接口
// @Description 登录回调接口，接收回调请求
// @Accept      plain
// @Produce     text/html
// @param       code query string true "授权码"
// @param       state query string true "随机字符串"
// @param       error query string true "错误码"
// @Tags        session
// @Success     200
// @Failure     400 {object} rest.HttpError
// @Router      /login/callback [GET]
func (l *Login) LoginCallback(c *gin.Context) {
	var err error
	ctx, span := trace.StartInternalSpan(c.Request.Context())
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	sessionId, err := c.Cookie(cookie_util.SessionId)
	if err != nil {
		cookie_util.SetCookieDomain(c)
		c.HTML(http.StatusOK, "index.html", gin.H{"url": "/anyfabric"})
		return
	}
	log.Infof("Session login callback :[%s]", sessionId)
	req := &LoginCallbackReq{}
	valid, err := form_validator.BindQueryAndValid(c, req)
	if !valid {
		log.WithContext(ctx).Errorf("LoginCallback failed BindQueryAndValid, err: %v", err)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}
	if req.Error != "" || req.Code == "" {
		if strings.Contains(req.Error, "request_unauthorized") || strings.Contains(req.Error, "request_forbidden") {
			log.Warn("request_unauthorized")
			c.HTML(http.StatusOK, "index.html", gin.H{"url": "/anyfabric"})
			return
		}
		log.WithContext(ctx).Errorf("LoginCallback req error or code empty  err: %v ,code: %v", req.Error, req.Code)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.GetCodeFailed, err))
		return
	}
	log.Infof("login callback Code:[%s]", req.Code)

	ctx = audit.SaveAgent(c, ctx)
	sessionInfo, err := l.loginService.DoLogin(ctx, req.Code, req.State, sessionId)
	if err != nil {
		if agerrors.Code(err).GetErrorCode() == errorcode.UserHasNoPermissionError {
			LogFailedHTML(c, sessionInfo.Platform)
			return
		}
		log.WithContext(ctx).Errorf("LoginCallback DoLogin  err: %v", err.Error())
		c.Writer.WriteHeader(http.StatusBadRequest)
		logout.LogOutHTML(c, sessionInfo)
		return
	}
	http.SetCookie(c.Writer, &http.Cookie{
		Name:     cookie_util.Oauth2Token,
		Value:    url.QueryEscape(sessionInfo.Token),
		MaxAge:   cookie_util.CookieTimeOut,
		Path:     "/",
		Domain:   cookie_util.CookieDomain,
		SameSite: http.SameSiteNoneMode,
		Secure:   true,
		HttpOnly: false,
	})
	http.SetCookie(c.Writer, &http.Cookie{
		Name:     cookie_util.Userid,
		Value:    url.QueryEscape(sessionInfo.Userid),
		MaxAge:   cookie_util.CookieTimeOut,
		Path:     "/",
		Domain:   cookie_util.CookieDomain,
		SameSite: http.SameSiteNoneMode,
		Secure:   true,
		HttpOnly: false,
	})
	if sessionInfo.ASRedirect != "" {
		c.Redirect(http.StatusMovedPermanently, sessionInfo.ASRedirect)
	} else {
		LogSuccessHTML(c, sessionInfo.Platform)
	}
	log.Info("LoginCallback success")
}

func LogSuccessHTML(c *gin.Context, platform int32) {
	switch platform {
	case built_in.NormalPlatform:
		c.HTML(http.StatusOK, "index.html", gin.H{"url": "/anyfabric/login-success"})
	case built_in.DataResourceManagementBackupPlatform:
		c.HTML(http.StatusOK, "index.html", gin.H{"url": "/anyfabric/drmb/login-success"})
	case built_in.DataResourceManagementPortalPlatform:
		c.HTML(http.StatusOK, "index.html", gin.H{"url": "/anyfabric/drmp/login-success"})
	case built_in.CognitiveApplicationPlatform:
		c.HTML(http.StatusOK, "index.html", gin.H{"url": "/anyfabric/ca/login-success"})
	case built_in.CognitiveDiagnosisPlatform:
		c.HTML(http.StatusOK, "index.html", gin.H{"url": "/anyfabric/cd/login-success"})
	default:
		c.HTML(http.StatusBadRequest, "index.html", gin.H{"url": "/anyfabric"})
	}
}
func LogFailedHTML(c *gin.Context, platform int32) {
	switch platform {
	case built_in.NormalPlatform:
		c.HTML(http.StatusOK, "index.html", gin.H{"url": "/anyfabric/login-failed"})
	case built_in.DataResourceManagementBackupPlatform:
		c.HTML(http.StatusOK, "index.html", gin.H{"url": "/anyfabric/drmb/login-failed"})
	case built_in.DataResourceManagementPortalPlatform:
		c.HTML(http.StatusOK, "index.html", gin.H{"url": "/anyfabric/drmp/login-failed"})
	case built_in.CognitiveApplicationPlatform:
		c.HTML(http.StatusOK, "index.html", gin.H{"url": "/anyfabric/ca/login-failed"})
	case built_in.CognitiveDiagnosisPlatform:
		c.HTML(http.StatusOK, "index.html", gin.H{"url": "/anyfabric/cd/login-failed"})
	default:
		c.HTML(http.StatusBadRequest, "index.html", gin.H{"url": "/anyfabric"})
	}
}
func ResErrHtml(c *gin.Context, err error) {
	var e http_client.ExHTTPError
	var ok bool
	if e, ok = err.(http_client.ExHTTPError); !ok {
		ginx.ResErrJson(c, errorcode.Detail(errorcode.LoginCallbackFailed, err))
	}
	_, _ = c.Writer.Write(e.Body)
}

func (l *Login) clearCookie(c *gin.Context) {
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

type SingleSignOnReq struct {
	Code string `json:"code" form:"code" binding:"required"` // AS token
}

type SingleSignOnResp struct {
	SessionID string `json:"session_id"` // session id
	oauth2.Code2TokenRes
}

// SingleSignOn  godoc
// @Summary     第三方登录的认证
// @Description 第三方登录的认证
// @Produce     application/json
// @Param		_			 body		SingleSignOnReq	true "请求参数"
// @Tags        session
// @Success     200 {object} oauth2.Code2TokenRes
// @Failure     400 {object} rest.HttpError
// @Router      /sso [POST]
func (l *Login) SingleSignOn(c *gin.Context) {
	var err error
	ctx, span := trace.StartInternalSpan(c.Request.Context())
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	req := &SingleSignOnReq{}

	if err := c.ShouldBindJSON(req); err != nil {
		log.WithContext(ctx).Errorf("SingleSignOn failed ShouldBindJSON, err: %v", err)
		c.Writer.WriteHeader(http.StatusBadRequest)
		if errors.As(err, &form_validator.ValidErrors{}) {
			ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
			return
		}

		ginx.ResErrJson(c, errorcode.Desc(errorcode.PublicInvalidParameterJson))
		return
	}

	sessionId := uuid.New().String()
	// c.SetCookie(cookie_util.SessionId, sessionId, cookie_util.CookieTimeOut, "/", cookie_util.CookieDomain, false, false)
	http.SetCookie(c.Writer, &http.Cookie{
		Name:     cookie_util.SessionId,
		Value:    url.QueryEscape(sessionId),
		MaxAge:   cookie_util.CookieTimeOut,
		Path:     "/",
		Domain:   cookie_util.CookieDomain,
		SameSite: http.SameSiteNoneMode,
		Secure:   true,
		HttpOnly: false,
	})

	tokenInfo, userInfo, err := l.loginService.SingleSignOn(ctx, req.Code, sessionId)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	// c.SetCookie(cookie_util.Oauth2Token, tokenInfo.AccessToken, cookie_util.CookieTimeOut, "/", cookie_util.CookieDomain, false, false)
	http.SetCookie(c.Writer, &http.Cookie{
		Name:     cookie_util.Oauth2Token,
		Value:    url.QueryEscape(tokenInfo.AccessToken),
		MaxAge:   cookie_util.CookieTimeOut,
		Path:     "/",
		Domain:   cookie_util.CookieDomain,
		SameSite: http.SameSiteNoneMode,
		Secure:   true,
		HttpOnly: false,
	})
	// c.SetCookie(cookie_util.Userid, userInfo.ID, cookie_util.CookieTimeOut, "/", cookie_util.CookieDomain, false, false)
	http.SetCookie(c.Writer, &http.Cookie{
		Name:     cookie_util.Userid,
		Value:    url.QueryEscape(userInfo.ID),
		MaxAge:   cookie_util.CookieTimeOut,
		Path:     "/",
		Domain:   cookie_util.CookieDomain,
		SameSite: http.SameSiteNoneMode,
		Secure:   true,
		HttpOnly: false,
	})
	ginx.ResOKJson(c, &SingleSignOnResp{
		SessionID:     sessionId,
		Code2TokenRes: *tokenInfo,
	})
}

// GetPlatform  godoc
// @Summary     获取登录平台
// @Description 获取登录平台
// @Accept      plain
// @Produce     application/json
// @Tags        session
// @Success     301
// @Failure     400 {object} rest.HttpError
// @Router      /platform [GET]
func (l *Login) GetPlatform(c *gin.Context) {
	sessionId, err := c.Cookie(cookie_util.SessionId)
	if err != nil {
		ginx.ResBadRequestJson(c, errorcode.Detail(errorcode.GetCookieValueNotExist, err.Error()))
		return
	}
	session, err := l.redisClient.GetSession(c, sessionId)
	if err != nil {
		ginx.ResBadRequestJson(c, errorcode.Detail(errorcode.GetSessionFailed, err.Error()))
		return
	}
	ginx.ResOKJson(c, session.Platform)
}

// SingleSignOn2  godoc
// @Summary     单点登录认证
// @Description 单点登录认证
// @Produce     application/json
// @Param		_	query domain.SingleSignOn2Req	true "请求参数"
// @Tags        session
// @Success     200 {object} domain.SingleSignOn2Res
// @Failure     400 {object} rest.HttpError
// @Router      /sso [GET]
func (l *Login) SingleSignOn2(c *gin.Context) {
	params := make(map[string]string)
	err := c.BindQuery(&params)
	if err != nil {
		ginx.ResBadRequestJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err.Error()))
		return
	}
	sessionId := uuid.New().String()
	http.SetCookie(c.Writer, &http.Cookie{
		Name:     cookie_util.SessionId,
		Value:    url.QueryEscape(sessionId),
		MaxAge:   cookie_util.CookieTimeOut,
		Path:     "/",
		Domain:   cookie_util.CookieDomain,
		SameSite: http.SameSiteNoneMode,
		Secure:   true,
		HttpOnly: false,
	})
	ssoRes, userInfo, err := l.loginService.SingleSignOn2(c, params, sessionId)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}

	http.SetCookie(c.Writer, &http.Cookie{
		Name:     cookie_util.Oauth2Token,
		Value:    url.QueryEscape(ssoRes.AccessToken),
		MaxAge:   cookie_util.CookieTimeOut,
		Path:     "/",
		Domain:   cookie_util.CookieDomain,
		SameSite: http.SameSiteNoneMode,
		Secure:   true,
		HttpOnly: false,
	})
	http.SetCookie(c.Writer, &http.Cookie{
		Name:     cookie_util.Userid,
		Value:    url.QueryEscape(userInfo.ID),
		MaxAge:   cookie_util.CookieTimeOut,
		Path:     "/",
		Domain:   cookie_util.CookieDomain,
		SameSite: http.SameSiteNoneMode,
		Secure:   true,
		HttpOnly: false,
	})
	ginx.ResOKJson(c, &domain.SingleSignOn2Res{
		SessionID:   sessionId,
		AccessToken: ssoRes.AccessToken,
		UserID:      userInfo.ID,
	})
}
