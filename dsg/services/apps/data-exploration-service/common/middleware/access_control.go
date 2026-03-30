package middleware

import (
	"context"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/common/errorcode"
	"github.com/kweaver-ai/idrm-go-common/access_control"
)

func (m *Middleware) AccessControl(resource access_control.Resource) gin.HandlerFunc {
	return func(c *gin.Context) {
		pass, err := m.distributeAccessType(c, c.Request.Method, resource)
		if err != nil {
			c.Writer.WriteHeader(http.StatusBadRequest)
			AbortResponse(c, err)
		}
		if !pass {
			c.Writer.WriteHeader(http.StatusForbidden)
			AbortResponse(c, errorcode.Desc(errorcode.UserNotHavePermission))
		}

		c.Next()
	}
}
func (m *Middleware) MultipleAccessControl(resources ...access_control.Resource) gin.HandlerFunc {
	return func(c *gin.Context) {
		for _, resource := range resources {
			pass, err := m.distributeAccessType(c, c.Request.Method, resource)
			if err != nil {
				c.Writer.WriteHeader(http.StatusBadRequest)
				AbortResponse(c, err)
			}
			if pass {
				c.Next()
				return
			}
		}
		c.Writer.WriteHeader(http.StatusForbidden)
		AbortResponse(c, errorcode.Desc(errorcode.UserNotHavePermission))
	}
}
func (m *Middleware) distributeAccessType(ctx context.Context, method string, resource access_control.Resource) (bool, error) {
	switch method {
	case http.MethodGet:
		return m.ccDriven.HasAccessPermission(ctx, access_control.GET_ACCESS, resource)
	case http.MethodPost:
		return m.ccDriven.HasAccessPermission(ctx, access_control.POST_ACCESS, resource)
	case http.MethodPut:
		return m.ccDriven.HasAccessPermission(ctx, access_control.PUT_ACCESS, resource)
	case http.MethodDelete:
		return m.ccDriven.HasAccessPermission(ctx, access_control.DELETE_ACCESS, resource)
	default:
		return false, errorcode.Desc(errorcode.AccessTypeNotSupport)
	}
}

func (m *Middleware) AccessControlWithAccessType(accessType access_control.AccessType, resource access_control.Resource) gin.HandlerFunc {
	return func(c *gin.Context) {
		pass, err := m.ccDriven.HasAccessPermission(c, accessType, resource)
		if err != nil {
			c.Writer.WriteHeader(http.StatusBadRequest)
			AbortResponse(c, err)
		}
		if !pass {
			c.Writer.WriteHeader(http.StatusForbidden)
			AbortResponse(c, errorcode.Desc(errorcode.UserNotHavePermission))
		}

		c.Next()
	}
}
