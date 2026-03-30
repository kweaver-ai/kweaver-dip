package v1

import (
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/session/common/cookie_util"
	"github.com/kweaver-ai/dsg/services/apps/session/common/errorcode"
	session "github.com/kweaver-ai/dsg/services/apps/session/domain/d_session"
	domain "github.com/kweaver-ai/dsg/services/apps/session/domain/user_info"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
	"go.uber.org/zap"
)

type UserInfo struct {
	userInfoService domain.UserInfoService
	session         session.Session
}

func NewUserInfo(
	u domain.UserInfoService,
	s session.Session,
) *UserInfo {
	return &UserInfo{
		userInfoService: u,
		session:         s,
	}
}

// GetUserInfo  godoc
// @Summary     获取用户信息接口
// @Description 获取用户信息接口
// @Accept      plain
// @Produce     application/json
// @Tags        session
// @Success     200
// @Failure     400 {object} rest.HttpError
// @Router      /userinfo [GET]
func (u *UserInfo) GetUserInfo(c *gin.Context) {
	/*	cookies, err := cookie_util.GetCookieValue(c)
		if err != nil {
			log.WithContext(ctx).Errorf("LogOut failed GetCookieValue, err: %v", err)
			c.Writer.WriteHeader(http.StatusBadRequest)
			ginx.ResErrJson(c, errorcode.Detail(errorcode.GetCookieValueNotExist, err))
			return
		}
		log.Infof("Session userinfo :[%s]", cookies.SessionId)*/
	var err error
	ctx, span := trace.StartInternalSpan(c.Request.Context())
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	tokenID := c.GetHeader("Authorization")
	token := strings.TrimPrefix(tokenID, "Bearer ")
	if tokenID == "" || token == "" {
		ginx.ResBadRequestJson(c, errorcode.Desc(errorcode.GetTokenError))
		return
	}
	userInfo, err := u.userInfoService.GetUserInfo(ctx, token)
	if err != nil {
		ginx.ResBadRequestJson(c, errorcode.Detail(errorcode.GetUserInfoError, err))
		return
	}
	ginx.ResOKJson(c, userInfo)

}

// GetUserName  godoc
// @Summary     获取用户名称接口
// @Description 获取用户名称接口
// @Accept      plain
// @Produce     application/json
// @Tags        session
// @Success     200
// @Failure     400 {object} rest.HttpError
// @Router      /username [GET]
func (u *UserInfo) GetUserName(c *gin.Context) {
	var err error
	ctx, span := trace.StartInternalSpan(c.Request.Context())
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	cookies, err := cookie_util.GetCookieValue(c)
	if err != nil {
		log.WithContext(ctx).Errorf("GetUserName failed GetCookieValue, err: %v", zap.Error(err))
		ginx.ResBadRequestJson(c, errorcode.Detail(errorcode.GetCookieValueNotExist, err.Error()))
		return
	}
	log.Infof("Session ID :[%s]", cookies.SessionId)

	userInfo, err := u.userInfoService.GetUserName(ctx, cookies.SessionId)
	if err != nil {
		ginx.ResBadRequestJson(c, errorcode.Detail(errorcode.GetUserNameError, err.Error()))
		return
	}
	ginx.ResOKJson(c, userInfo)

}

// GetLoginPlatform  获取登录平台
// @Summary     获取登录平台
// @Description 获取登录平台
// @Tags        session
// @Accept      plain
// @Produce     application/json
// @Param       session-id cookie string true "session-id"
// @Success     200 {object} int "平台"
// @Failure     400 {object} rest.HttpError
// @Router      /platform [GET]

func (u *UserInfo) GetLoginPlatform(c *gin.Context) {
	sessionId, err := c.Cookie(cookie_util.SessionId)
	if err != nil {
		ginx.ResBadRequestJson(c, errorcode.Desc(errorcode.GetCookieValueNotExist))
		return
	}
	session, err := u.session.GetSession(c, sessionId)
	if err != nil {
		ginx.ResBadRequestJson(c, errorcode.Desc(errorcode.GetSessionFailed))
		return
	}
	ginx.ResOKJson(c, session.Platform)
}
