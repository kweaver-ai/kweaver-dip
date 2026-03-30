package middleware

import (
	"context"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/trace_util"
	"github.com/kweaver-ai/idrm-go-common/access_control"
	"github.com/kweaver-ai/idrm-go-common/interception"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

func (m *MiddlewareImpl) AccessControl(resource access_control.Resource) gin.HandlerFunc {
	return func(c *gin.Context) {
		trace_util.TranceMiddleware(c, "AccessControl", func(ctx context.Context) error {
			// 允许 token 是 client 类型的请求访问所有资源
			if tokenType, err := TokenTypeFromContext(ctx); err == nil && tokenType == interception.TokenTypeClient {
				// for _, url := range PathDisableList {
				// 	if strings.HasPrefix(c.Request.URL.Path, url) {
				// 		ginx.AbortResponse(c, errorcode.Desc(errorcode.UserNotHavePermission))
				// 		return nil
				// 	}
				// }
				// pass, err := m.distributeAppsAccessType(c, Resource)
				// if err != nil {
				// 	c.Writer.WriteHeader(http.StatusBadRequest)
				// 	ginx.AbortResponse(c, err)
				// 	return err
				// }
				// if !pass {
				// 	c.Writer.WriteHeader(http.StatusForbidden)
				// 	ginx.AbortResponse(c, errorcode.Desc(errorcode.UserNotHavePermission))
				// 	return err
				// }
				return nil
			}

			pass, err := m.distributeAccessType(c, c.Request.Method, resource)
			if err != nil {
				c.Writer.WriteHeader(http.StatusBadRequest)
				ginx.AbortResponse(c, err)
				return err
			}
			if !pass {
				c.Writer.WriteHeader(http.StatusForbidden)
				ginx.AbortResponse(c, errorcode.Desc(errorcode.UserNotHavePermission))
				return err
			}
			return nil
		})
		c.Next()
	}
}
func (m *MiddlewareImpl) distributeAccessType(ctx context.Context, method string, resource access_control.Resource) (bool, error) {
	switch method {
	case http.MethodGet:
		return m.user.HasAccessPermission(ctx, "", access_control.GET_ACCESS, resource)
	case http.MethodPost:
		return m.user.HasAccessPermission(ctx, "", access_control.POST_ACCESS, resource)
	case http.MethodPut:
		return m.user.HasAccessPermission(ctx, "", access_control.PUT_ACCESS, resource)
	case http.MethodDelete:
		return m.user.HasAccessPermission(ctx, "", access_control.DELETE_ACCESS, resource)
	case http.MethodPatch:
		// 因为 access_control.AccessType 不仅与 HTTP Method 有关还与业务逻辑中
		// 的用户权限有关。在缺少两者之间对应关系的现在，使用
		// access_control.PUT_ACCESS 作为 PATCH 方法的权限
		return m.user.HasAccessPermission(ctx, "", access_control.PUT_ACCESS, resource)
	default:
		return false, errorcode.Desc(errorcode.AccessTypeNotSupport)
	}
}

// func (m *MiddlewareImpl) distributeAppsAccessType(ctx context.Context, resource string) (bool, error) {
// 	req := &apps.HasAccessPermissionReq{UserId: "", Resource: resource}
// 	return m.apps.HasAccessPermission(ctx, req)
// }

func (m *MiddlewareImpl) MultipleAccessControl(resources ...access_control.Resource) gin.HandlerFunc {
	return func(c *gin.Context) {
		trace_util.TranceMiddleware(c, "MultipleAccessControl", func(ctx context.Context) error {
			// 允许 token 是 client 类型的请求访问所有资源
			if tokenType, err := TokenTypeFromContext(ctx); err == nil && tokenType == interception.TokenTypeClient {
				return nil
			}
			for _, resource := range resources {
				pass, err := m.distributeAccessType(ctx, c.Request.Method, resource)
				if err != nil {
					c.Writer.WriteHeader(http.StatusBadRequest)
					ginx.AbortResponse(c, err)
					return err
				}
				if pass {
					c.Next()
					return nil
				}
			}
			c.Writer.WriteHeader(http.StatusForbidden)
			ginx.AbortResponse(c, errorcode.Desc(errorcode.UserNotHavePermission))
			return nil

		})
	}
}
