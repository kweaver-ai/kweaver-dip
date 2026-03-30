package mock

import (
	"github.com/gin-gonic/gin"
)

func (m *Middleware) AuditLogger() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()
	}
}
