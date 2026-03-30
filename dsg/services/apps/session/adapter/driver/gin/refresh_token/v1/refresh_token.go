package v1

import (
	"net/http"
	"net/url"

	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/session/common/cookie_util"
	"github.com/kweaver-ai/dsg/services/apps/session/common/errorcode"
	domain "github.com/kweaver-ai/dsg/services/apps/session/domain/refresh_token"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

type RefreshToken struct {
	refreshService domain.RefreshService
}

func NewRefreshToken(r domain.RefreshService) *RefreshToken {
	return &RefreshToken{
		refreshService: r,
	}
}

type RefreshTokenResp struct {
	SessionID   string `json:"session_id"` // session id
	AccessToken string `json:"access_token"`
}

// RefreshToken  godoc
// @Summary     刷新令牌接口
// @Description 刷新令牌接口
// @Accept      plain
// @Produce     application/json
// @Tags        session
// @Success     200
// @Failure     400 {object} rest.HttpError
// @Router      /refresh-token [GET]
func (r *RefreshToken) RefreshToken(c *gin.Context) {
	var err error
	ctx, span := trace.StartInternalSpan(c.Request.Context())
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	cookies, err := cookie_util.GetCookieValue(c)
	if err != nil {
		cookies, err = cookie_util.GetCookieValueFromHeader(c)
		if err != nil {
			log.WithContext(ctx).Errorf("LogOut failed GetCookieValue, err: %v", err)
			c.Writer.WriteHeader(http.StatusBadRequest)
			ginx.ResErrJson(c, errorcode.Detail(errorcode.GetCookieValueNotExist, err))
			return
		}
	}
	log.Infof("Session refreshToken :[%s]", cookies.SessionId)
	refresh, err := r.refreshService.DoRefresh(ctx, cookies)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.RefreshTokenError, err))
		return
	}
	// c.SetCookie(cookie_util.Oauth2Token, refresh.Token, cookie_util.CookieTimeOut, "/", cookie_util.CookieDomain, false, false)
	http.SetCookie(c.Writer, &http.Cookie{
		Name:     cookie_util.Oauth2Token,
		Value:    url.QueryEscape(refresh.Token),
		MaxAge:   cookie_util.CookieTimeOut,
		Path:     "/",
		Domain:   cookie_util.CookieDomain,
		SameSite: http.SameSiteNoneMode,
		Secure:   true,
		HttpOnly: false,
	})
	// c.Writer.WriteHeader(http.StatusOK)
	ginx.ResOKJson(c, &RefreshTokenResp{
		SessionID:   cookies.SessionId,
		AccessToken: refresh.Token,
	})
}
