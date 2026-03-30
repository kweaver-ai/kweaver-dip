package middleware

import (
	"context"

	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/idrm-go-common/interception"
	gocommon_middleware "github.com/kweaver-ai/idrm-go-common/middleware"
)

func LocalToken() gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenID := c.GetHeader("Authorization")
		userInfo := &gocommon_middleware.User{
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
