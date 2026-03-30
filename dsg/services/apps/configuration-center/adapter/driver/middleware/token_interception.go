package middleware

import (
	"context"
	"fmt"
	"net/http"
	"strings"

	"github.com/kweaver-ai/idrm-go-common/middleware"

	"github.com/gin-gonic/gin"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/trace"
	"go.uber.org/zap"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/rest/hydra"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/trace_util"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/apps"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-common/interception"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

func (m *MiddlewareImpl) TokenInterception() gin.HandlerFunc {
	return func(c *gin.Context) {
		trace_util.TranceMiddleware(c, "TokenInterception", func(ctx context.Context) error {
			tokenID := c.GetHeader("Authorization")
			token := strings.TrimPrefix(tokenID, "Bearer ")
			if tokenID == "" || token == "" {
				ginx.AbortResponseWithCode(c, http.StatusUnauthorized, errorcode.Desc(errorcode.NotAuthentication))
				return errorcode.Desc(errorcode.NotAuthentication)
			}
			info, err := m.hydra.Introspect(ctx, token)
			if err != nil {
				log.WithContext(c.Request.Context()).Error("TokenInterception hydra Introspect", zap.Error(err))
				c.Writer.WriteHeader(http.StatusUnauthorized)
				ginx.AbortResponse(c, errorcode.Desc(errorcode.TokenAuditFailed))
				return err
			}
			if !info.Active {
				c.Writer.WriteHeader(http.StatusUnauthorized)
				ginx.AbortResponse(c, errorcode.Desc(errorcode.UserNotActive))
				return err
			}

			if info.VisitorID == info.ClientID || info.VisitorTyp == hydra.App {

				// 根据名称判断是不是虚拟化引擎的内部账号，如果是，后面不检查权限
				client_name, err := m.hydra.GetClientNameById(c, info.VisitorID)
				if err != nil {
					log.WithContext(c.Request.Context()).Error("TokenInterception GetUserFromHydarWrong", zap.Error(err))
					ginx.AbortResponseWithCode(c, http.StatusBadRequest, errorcode.Desc(errorcode.HydraException))
					return err
				}
				if client_name == VirtualEngineApp {
					c.Set(interception.Token, tokenID)
					c.Set(interception.TokenType, interception.TokenTypeClient)
					c.Request.WithContext(WithTokenType(c.Request.Context(), interception.TokenTypeClient))
					return nil
				}

				var id, name string
				// 查看是否是AF应用中创建的账号
				appsInfo, err := m.apps.AppByAccountId(ctx, &apps.AppsID{Id: info.VisitorID})
				if err != nil {
					log.WithContext(c.Request.Context()).Error("TokenInterception configuration AppByAccountId", zap.Error(err))
					c.Writer.WriteHeader(http.StatusBadRequest)
					ginx.AbortResponse(c, errorcode.Desc(errorcode.GetUserInfoFailed))
					return err
				}
				id = appsInfo.ID
				name = appsInfo.Name
				// 如果应用没有查到就是proton部署控制台建的账号
				if appsInfo.ID == "" {
					userInfo, err := m.userMgm.GetAppInfo(c, info.VisitorID)
					if err != nil {
						log.WithContext(c.Request.Context()).Error("TokenInterception userMgm GetAppInfo", zap.Error(err))
						c.Writer.WriteHeader(http.StatusBadRequest)
						ginx.AbortResponse(c, errorcode.Desc(errorcode.GetUserInfoFailed))
						return err
					}
					id = userInfo.ID
					name = userInfo.Name
				}
				userInfo := &model.User{ID: id, Name: name}
				c.Set(interception.InfoName, userInfo)
				c.Set(interception.Token, tokenID)
				c.Set(interception.TokenType, interception.TokenTypeClient)
				c.Request = c.Request.WithContext(context.WithValue(c.Request.Context(), interception.InfoName, userInfo))
				c.Request = c.Request.WithContext(context.WithValue(c.Request.Context(), interception.Token, tokenID))
				c.Request = c.Request.WithContext(context.WithValue(c.Request.Context(), interception.TokenType, interception.TokenTypeUser))
				trace.SpanFromContext(ctx).SetAttributes(attribute.String("username", userInfo.Name))
				trace.SpanFromContext(ctx).SetAttributes(attribute.String("userID", userInfo.ID))
				return nil
			}

			userInfo, err := m.user.GetByUserId(c, info.VisitorID)
			if err != nil {
				log.WithContext(c.Request.Context()).Error("TokenInterception userMgm GetByUserId", zap.Error(err))
				c.Writer.WriteHeader(http.StatusBadRequest)
				ginx.AbortResponse(c, errorcode.Desc(errorcode.GetUserInfoFailed))
				return err
			}
			c.Set(interception.InfoName, userInfo)
			c.Set(interception.Token, tokenID)
			c.Set(interception.TokenType, interception.TokenTypeUser)
			c.Request = c.Request.WithContext(context.WithValue(c.Request.Context(), interception.InfoName, userInfo))
			c.Request = c.Request.WithContext(context.WithValue(c.Request.Context(), interception.Token, tokenID))
			c.Request = c.Request.WithContext(context.WithValue(c.Request.Context(), interception.TokenType, interception.TokenTypeUser))
			trace.SpanFromContext(ctx).SetAttributes(attribute.String("username", userInfo.Name))
			trace.SpanFromContext(ctx).SetAttributes(attribute.String("userID", userInfo.ID))
			return nil
		})

		c.Next()
	}
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

func (m *MiddlewareImpl) SkipTokenInterception() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Set(interception.InfoName, &model.User{
			ID:   "266c6a42-6131-4d62-8f39-853e7093701c",
			Name: "af_admin",
		})
		c.Set(interception.Token, "McMnbaTohmkidrTrrbyEl3oJRvErt7WmBHgNAt04b4U.qp4Ky3cTgadqJiKNR1At66Is2-3VcwG45KWVFgipIJ0")
		c.Next()
	}
}

// WithUser returns a copy of parent which is associated with user.
func WithUser(ctx context.Context, user *model.User) context.Context {
	return context.WithValue(ctx, interception.InfoName, user)
}

// GetUser returns the user which the context is associated with.
func GetUser(ctx context.Context) *model.User {
	return ctx.Value(interception.InfoName).(*model.User)
}

// WithTokenType returns a copy of parent which is associated with token type.
func WithTokenType(ctx context.Context, tokenType int) context.Context {
	return context.WithValue(ctx, interception.TokenType, tokenType)
}

// TokenTypeFromContext returns a TokenType from context or an error if not found
func TokenTypeFromContext(ctx context.Context) (tokenType int, err error) {
	v := ctx.Value(interception.TokenType)
	if v == nil {
		return 0, errorcode.Detail(errorcode.PublicInternalError, "no no tokenType was present")
	}

	tokeType, ok := v.(int)
	if !ok {
		return 0, errorcode.Detail(errorcode.PublicInternalError, fmt.Sprintf("unexpected value for tokenType context key: %T", v))
	}
	return tokeType, nil
}
