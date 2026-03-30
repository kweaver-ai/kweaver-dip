package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/basic-search/adapter/driven/hydra"
	"github.com/kweaver-ai/dsg/services/apps/basic-search/adapter/driven/user_management"
	"github.com/kweaver-ai/dsg/services/apps/basic-search/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/basic-search/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/basic-search/common/trace_util"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.opentelemetry.io/otel/attribute"
)

func Auth(hydra hydra.Hydra) gin.HandlerFunc {
	return func(c *gin.Context) {
		trace_util.TraceA0R0(c, "TokenInterceptionWithSpan", func(ctx context.Context) {
			tokenID := c.GetHeader("Authorization")
			token := strings.TrimPrefix(tokenID, "Bearer ")
			info, err := hydra.Introspect(ctx, token)
			if err != nil {
				log.Errorf("TokenInterception Introspect err, err: %v", err)
				c.Writer.WriteHeader(http.StatusUnauthorized)
				AbortResponse(c, errorcode.Desc(errorcode.TokenAuditFailed))
				return
			}
			if !info.Active {
				c.Writer.WriteHeader(http.StatusUnauthorized)
				AbortResponse(c, errorcode.Desc(errorcode.UserNotActive))
				return
			}
			userInfo, err := user_management.GetUserInfoByUserID(token, info.VisitorID)
			if err != nil {
				c.Writer.WriteHeader(http.StatusBadRequest)
				AbortResponse(c, errorcode.Desc(errorcode.GetUserInfoFailed))
				return
			}
			c.Set(constant.UserInfoContextKey, userInfo)
			c.Set(constant.UserTokenKey, tokenID)

			if span := trace_util.GetSpan(ctx); span != nil {
				span.SetAttributes(attribute.String("username", userInfo.UserName))
				span.SetAttributes(attribute.String("userID", userInfo.Uid))
			}
		})

		c.Next()
	}
}
