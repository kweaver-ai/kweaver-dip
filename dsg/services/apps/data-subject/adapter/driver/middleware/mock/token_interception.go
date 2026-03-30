package mock

import (
	"context"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/idrm-go-common/interception"
	"github.com/kweaver-ai/idrm-go-common/middleware"
)

func (m *Middleware) TokenInterception() gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenID := c.GetHeader("Authorization")
		token := strings.TrimPrefix(tokenID, "Bearer ")
		if tokenID == "" || token == "" {
			token = "ory_at_O5jqz_g7EHPxIRDcwwJmWg00zXQPlDkQy3OZBL8k6xE.lhu7Fb4MXyCQP-LFg_0X2hX5S_K77Q9Bw7K2s0c2Rgo"
			c.Set(interception.Token, token)
			c.Request = c.Request.WithContext(context.WithValue(c.Request.Context(), interception.Token, token))
		} else {
			c.Set(interception.Token, token)
			c.Request = c.Request.WithContext(context.WithValue(c.Request.Context(), interception.Token, token))
		}
		userInfo := &middleware.User{
			ID:   "299b97e0-d22d-11ee-a654-2e9626c9c96f",
			Name: "admin",
		}
		c.Set(interception.InfoName, userInfo)
		c.Request = c.Request.WithContext(context.WithValue(c.Request.Context(), interception.InfoName, userInfo))
		c.Next()
	}
}
