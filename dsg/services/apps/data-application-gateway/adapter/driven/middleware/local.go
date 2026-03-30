package middleware

import (
	"context"

	"github.com/gin-gonic/gin"
	v1 "github.com/kweaver-ai/idrm-go-common/api/auth-service/v1"
	"github.com/kweaver-ai/idrm-go-common/interception"
	"github.com/kweaver-ai/idrm-go-common/middleware"
)

func LocalToken() gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenID := c.GetHeader("Authorization")
		userInfo := &middleware.User{
			ID:   "bb827eba-2337-11f0-83a6-ce8b55c1fd02",
			Name: "zyy",
		}
		c.Set(interception.InfoName, userInfo)
		c.Set(interception.Token, tokenID)
		c.Set(interception.TokenType, interception.TokenTypeClient)
		interception.SetGinContextWithAuthServiceSubject(c, &v1.Subject{Type: v1.SubjectAPP, ID: userInfo.ID})
		c.Request = c.Request.WithContext(context.WithValue(c.Request.Context(), interception.InfoName, userInfo))
		c.Request = c.Request.WithContext(context.WithValue(c.Request.Context(), interception.Token, tokenID))

		c.Next()
	}
}
