package middleware

import (
	"context"
	v1 "github.com/kweaver-ai/idrm-go-common/api/auth-service/v1"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	"github.com/kweaver-ai/idrm-go-common/access_control"
	"github.com/kweaver-ai/idrm-go-common/errorcode"
	"github.com/kweaver-ai/idrm-go-common/interception"
	"github.com/kweaver-ai/idrm-go-common/middleware"
	"github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
	configuration_center_impl "github.com/kweaver-ai/idrm-go-common/rest/configuration_center/impl"
	"github.com/kweaver-ai/idrm-go-common/rest/hydra"
	"github.com/kweaver-ai/idrm-go-common/rest/user_management"
	my_config "github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/config"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)


func NewConfigurationCenterLabelService(conf *my_config.Bootstrap, client *http.Client) configuration_center.LabelService {
	return configuration_center_impl.NewConfigurationCenterDrivenByService(client)
}

type WrappedMiddleware struct {
	// hydra client
	Hydra hydra.Hydra
	// user management client
	UserMgmt user_management.DrivenUserMgnt

	// underlying middleware
	middleware.Middleware
}

var _ middleware.Middleware = &WrappedMiddleware{}


func (m *WrappedMiddleware) AccessControl(resource access_control.Resource) gin.HandlerFunc {
	underlying := m.Middleware.AccessControl(resource)
	return func(c *gin.Context) {
		// 如果 TokenType 是 Client，即请求源自 APP 允许访问。
		v, exists := c.Get(interception.TokenType)
		if exists {
			vType, ok := v.(int)
			if ok && vType == interception.TokenTypeClient {
				c.Next()
				return
			}
		}

		underlying(c)
		c.Next()
	}

}

// TokenInterception overwrites underlying middleware's TokenInterception.
func (m *WrappedMiddleware) TokenInterception() gin.HandlerFunc {
	return func(c *gin.Context) {
		var err error
		newCtx, span := trace.StartInternalSpan(c.Request.Context())
		defer func() { trace.TelemetrySpanEnd(span, err) }()
		tokenID := c.GetHeader("Authorization")
		token := strings.TrimPrefix(tokenID, "Bearer ")
		if tokenID == "" || token == "" {
			ginx.AbortResponseWithCode(c, http.StatusUnauthorized, errorcode.Desc(errorcode.NotAuthentication))
			return
		}
		info, err := m.Hydra.Introspect(newCtx, token)
		if err != nil {
			log.WithContext(c.Request.Context()).Error("TokenInterception Introspect", zap.Error(err))
			ginx.AbortResponseWithCode(c, http.StatusBadRequest, errorcode.Desc(errorcode.HydraException))
			return
		}
		if !info.Active {
			ginx.AbortResponseWithCode(c, http.StatusUnauthorized, errorcode.Desc(errorcode.AuthenticationFailure))
			return
		}

		if info.VisitorID == info.ClientID {
			c.Set(interception.Token, tokenID)
			c.Request = c.Request.WithContext(context.WithValue(c.Request.Context(), interception.Token, tokenID))
			c.Set(interception.TokenType, interception.TokenTypeClient)
			c.Next()
			return
		}

		// 来自 APP 的访问不需要获取用户信息
		if info.VisitorTyp == hydra.App {
			c.Set(interception.Token, tokenID)
			c.Request = c.Request.WithContext(context.WithValue(c.Request.Context(), interception.Token, tokenID))
			c.Set(interception.TokenType, interception.TokenTypeClient)
			c.Next()
			return
		}

		name, _, _, err := m.UserMgmt.GetUserNameByUserID(newCtx, info.VisitorID)
		if err != nil {
			log.WithContext(c.Request.Context()).Error("UserMgmt GetUserNameByUserID err", zap.Error(err))
			ginx.AbortResponseWithCode(c, http.StatusBadRequest, errorcode.Desc(errorcode.GetUserInfoFailure))
			return
		}
		userInfo := &middleware.User{ID: info.VisitorID, Name: name}
		c.Set(interception.InfoName, userInfo)
		c.Set(interception.Token, tokenID)
		c.Set(interception.TokenType, interception.TokenTypeUser)
		c.Request = c.Request.WithContext(context.WithValue(c.Request.Context(), interception.InfoName, userInfo))
		c.Request = c.Request.WithContext(context.WithValue(c.Request.Context(), interception.Token, tokenID))
		c.Next()
	}
}

func AddToken() gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenID := c.GetHeader("Authorization")
		userInfo := &middleware.User{
			Name: "zyy",
			ID:   "596b76a4-eaa2-11f0-a32f-b6cb8b59d785",
		}
		c.Set(interception.InfoName, userInfo)
		c.Set(interception.Token, tokenID)
		c.Set(interception.TokenType, interception.TokenTypeUser)
		subject := &v1.Subject{Type: v1.SubjectUser, ID: userInfo.ID}
		interception.SetGinContextWithAuthServiceSubject(c, subject)
		c.Request = c.Request.WithContext(context.WithValue(c.Request.Context(), interception.InfoName, userInfo))
		c.Request = c.Request.WithContext(context.WithValue(c.Request.Context(), interception.Token, tokenID))

		c.Next()
	}
}


func LocalToken() gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenID := c.GetHeader("Authorization")
		userInfo := &middleware.User{
			ID:   "bb827eba-2337-11f0-83a6-ce8b55c1fd02",
			Name: "zy",
		}
		subject := &v1.Subject{Type: v1.SubjectUser, ID: userInfo.ID}
		interception.SetGinContextWithAuthServiceSubject(c, subject)

		c.Set(interception.InfoName, userInfo)
		c.Set(interception.Token, tokenID)
		c.Set(interception.TokenType, interception.TokenTypeUser)
		c.Request = c.Request.WithContext(context.WithValue(c.Request.Context(), interception.InfoName, userInfo))
		c.Request = c.Request.WithContext(context.WithValue(c.Request.Context(), interception.Token, tokenID))

		c.Next()
	}
}

