package mock

import (
	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/idrm-go-common/access_control"
)

func (m *Middleware) AccessControl(resource access_control.Resource) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()
	}
}

func (m *Middleware) MultipleAccessControl(resources ...access_control.Resource) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()
	}
}
func (m *Middleware) AccessControlWithAccessType(accessType access_control.AccessType, resource access_control.Resource) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()
	}
}
