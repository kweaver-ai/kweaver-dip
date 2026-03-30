package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/adapter/driven/configuration_center"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/adapter/driven/hydra"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/adapter/driven/user_management"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/common/errorcode"
	"github.com/kweaver-ai/idrm-go-frame/core/errorx/agcodes"
	"github.com/kweaver-ai/idrm-go-frame/core/errorx/agerrors"
	log "github.com/kweaver-ai/idrm-go-frame/core/logx/zapx"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

type Middleware struct {
	hydra    hydra.Hydra
	ccDriven configuration_center.DrivenConfigurationCenter
}

func NewMiddleware(hydra hydra.Hydra) *Middleware {
	return &Middleware{hydra: hydra}
}

func (m *Middleware) Auth() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		tokenID := ctx.GetHeader("Authorization")
		token := strings.TrimPrefix(tokenID, "Bearer ")
		info, err := m.hydra.Introspect(ctx, token)
		if err != nil {
			log.Errorf("TokenInterception Introspect err, err: %v", err)
			ctx.Writer.WriteHeader(http.StatusUnauthorized)
			AbortResponse(ctx, errorcode.Desc(errorcode.TokenAuditFailed))
			return
		}
		if !info.Active {
			ctx.Writer.WriteHeader(http.StatusUnauthorized)
			AbortResponse(ctx, errorcode.Desc(errorcode.UserNotActive))
			return
		}
		if info.VisitorID == info.ClientID {
			ctx.Set(constant.UserTokenKey, tokenID)
			return
		}
		userInfo, err := user_management.GetUserInfoByUserID(token, info.VisitorID)
		if err != nil {
			ctx.Writer.WriteHeader(http.StatusBadRequest)
			AbortResponse(ctx, errorcode.Desc(errorcode.GetUserInfoFailed))
			return
		}
		//userInfo := &models.UserInfo{Uid: "90eb80b6-dd8e-11ed-aa82-6ab2600d0295", UserName: "002"}
		ctx.Set(constant.UserInfoContextKey, userInfo)
		ctx.Set(constant.UserTokenKey, tokenID)

		ctx.Next()
	}
}

func (m *Middleware) InternalAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		userId := c.GetHeader("userId")
		userToken := c.GetHeader("userToken")
		c.Set(constant.UserId, userId)
		c.Set(constant.UserTokenKey, userToken)
		c.Next()
	}
}

func AbortResponse(c *gin.Context, err error) {
	var code = agerrors.Code(err)
	if err == nil {
		code = agcodes.CodeNotAuthorized
	}
	c.AbortWithStatusJSON(c.Writer.Status(), ginx.HttpError{
		Code:        code.GetErrorCode(),
		Description: code.GetDescription(),
		Solution:    code.GetSolution(),
		Cause:       code.GetCause(),
		Detail:      code.GetErrorDetails(),
	})
}

func GetUserIdFromCtx(ctx context.Context) string {
	return ctx.Value(constant.UserId).(string)
}

func GetUserTokenFromCtx(ctx context.Context) string {
	return ctx.Value(constant.UserTokenKey).(string)
}
