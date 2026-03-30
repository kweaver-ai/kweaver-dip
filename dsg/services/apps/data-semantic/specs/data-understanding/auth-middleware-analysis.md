# 鉴权中间件分析报告

## 当前项目鉴权中间件分析

### 1. 当前技术栈

项目当前使用 **Gin框架** + **idrm-go-common** 内部框架进行鉴权：

**核心依赖**（`go.mod`）：
```go
github.com/gin-gonic/gin v1.9.1
github.com/kweaver-ai/idrm-go-common v0.1.4
github.com/zeromicro/go-zero v1.4.1  // 已引入但未用于HTTP层
```

### 2. 当前鉴权架构

| 层级 | 中间件 | 位置 | 功能 |
|------|--------|------|------|
| 全局 | `MiddlewareTrace()` | `route.go:77` | 链路追踪 |
| API组级 | `TokenInterception()` | `route.go:80` | Token拦截，调用外部OAuth2服务验证 |
| 资源级 | `AccessControl()` | `route.go:86/108/179` | 基于资源类型的访问控制 |

### 3. Token拦截实现

**生产环境** - `TokenInterception()`：
- 调用 Hydra OAuth2 服务进行Token验证
- 将用户信息存入Context
- 支持多种Token类型

**开发环境** - `LocalToken()` (`token.go:11-26`）：
```go
func LocalToken() gin.HandlerFunc {
    return func(c *gin.Context) {
        tokenID := c.GetHeader("Authorization")
        userInfo := &middleware.User{
            ID:   "b8d82278-fee8-11ef-949b-02ac3a17c81f",
            Name: "af",
        }
        // 设置到Gin Context 和 Request Context
        c.Set(interception.InfoName, userInfo)
        c.Request = c.Request.WithContext(context.WithValue(c.Request.Context(), interception.InfoName, userInfo))
        c.Next()
    }
}
```

### 4. 访问控制实现

基于资源类型的细粒度访问控制：
```go
// route.go:86 - 项目级访问控制
projectsRouter := taskCenterRouter.Group("", a.Middleware.AccessControl(access_control.Project))

// route.go:108 - 任务级访问控制
tasksRouter := taskCenterRouter.Group("", a.Middleware.AccessControl(access_control.Task))

// route.go:179 - 工单级访问控制
workOrderRouter := taskCenterRouter.Group("", a.Middleware.AccessControl(access_control.WorkOrder))
```

### 5. 用户信息获取

`user.go:23-38`：
```go
func ObtainUserInfo(c context.Context) (*middleware.User, error) {
    value := c.Value(interception.InfoName)
    if value == nil {
        return nil, errorcode.Desc(errorcode.GetUserInfoFailedInterior)
    }
    user, ok := value.(*middleware.User)
    if !ok {
        return nil, errorcode.Desc(errorcode.GetUserInfoFailedInterior)
    }
    return user, nil
}
```

---

## go-zero框架鉴权方式

### 核心模块

| 模块 | 位置 | 功能 |
|------|------|------|
| JWT认证 | `rest/server.go` | 令牌生成、验证与生命周期管理 |
| 权限控制中间件 | `rest/handler/authhandler.go` | 基于RBAC模型的访问控制 |
| 令牌解析器 | `rest/token/tokenparser.go` | Token提取与验证 |

### 使用方式

```go
// 配置JWT
server.AddRoutes(
    []rest.Route{
        {Method: http.MethodGet, Path: "/api/user", Handler: handler},
    },
    rest.WithJwt(serverCtx.Config.Auth.AccessSecret),  // 启用JWT
)

// 支持密钥轮换
rest.WithJwtTransition(secret, prevSecret)
```

### JWT认证配置

```yaml
# 配置文件
Auth:
  AccessSecret: "your-256-bit-secret-key-here"  # 至少8位，建议32位随机字符串
  AccessExpire: 3600                             # 令牌有效期(秒)
```

### 自定义未授权回调

```go
func unauthorizedCallback(w http.ResponseWriter, r *http.Request, err error) {
    httpx.WriteJson(w, http.StatusUnauthorized, map[string]string{
        "code":    "401",
        "message": "invalid or expired token",
        "detail":  err.Error(),
    })
}

server := rest.MustNewServer(cfg, rest.WithUnauthorizedCallback(unauthorizedCallback))
```

### RBAC权限模型

```go
// 定义角色常量
const (
    RoleAdmin = "admin"
    RoleUser  = "user"
    RoleGuest = "guest"
)

// 权限验证中间件
func RBACMiddleware() rest.Middleware {
    return func(next http.HandlerFunc) http.HandlerFunc {
        return func(w http.ResponseWriter, r *http.Request) {
            // 从上下文获取用户角色(由JWT中间件存入)
            role, ok := r.Context().Value("role").(string)
            if !ok {
                httpx.WriteJson(w, http.StatusForbidden, map[string]string{
                    "code":    "403",
                    "message": "role not found",
                })
                return
            }

            // 检查角色是否有权限访问当前路径
            if !hasPermission(role, r.URL.Path) {
                httpx.WriteJson(w, http.StatusForbidden, map[string]string{
                    "code":    "403",
                    "message": "insufficient permissions",
                })
                return
            }

            next(w, r)
        }
    }
}
```

---

## 适配性分析与方案

### 是否可以适配？

**可以适配，但需要考虑以下因素**：

| 对比维度 | 当前Gin方式 | go-zero方式 | 适配复杂度 |
|----------|-------------|-------------|-----------|
| 框架切换 | Gin | go-zero REST | 高 |
| Token验证 | 外部OAuth2服务(Hydra) | 内置JWT | 中 |
| 中间件机制 | Gin中间件 | go-zero中间件 | 中 |
| 用户信息传递 | Context.Value | Context.Value | 低 |
| 访问控制 | 自定义AccessControl | 自定义RBAC | 中 |
| 依赖注入 | Wire | go-zero ServiceContext | 中 |

### 适配方案建议

#### 方案一：保留Gin框架，引入go-zero组件（推荐）

如果只需要使用go-zero的部分功能（如限流、熔断、缓存），可以保留现有架构：

```go
// 保留Gin + 当前鉴权，引入go-zero工具库
import (
    "github.com/zeromicro/go-zero/core/stores/cache"
    "github.com/zeromicro/go-zero/core/load"
)

// 在现有中间件基础上添加功能
```

#### 方案二：完全迁移到go-zero框架

需要重写路由和中间件：

```go
// 新的go-zero风格代码
func RegisterHandlers(server *rest.Server, serverCtx *svc.ServiceContext) {
    server.AddRoutes(
        []rest.Route{
            {Method: http.MethodPost, Path: "/projects", Handler: projectHandler},
        },
        rest.WithMiddlewares(OAuth2Middleware()),  // 替换TokenInterception
        rest.WithMiddlewares(AccessControlMiddleware()), // 替换AccessControl
    )
}

// 自定义OAuth2中间件适配Hydra
func OAuth2Middleware() rest.Middleware {
    return func(next http.HandlerFunc) http.HandlerFunc {
        return func(w http.ResponseWriter, r *http.Request) {
            // 调用Hydra验证Token
            // 设置用户信息到Context
            next(w, r)
        }
    }
}
```

#### 方案三：混合使用（渐进式迁移）

保留现有服务，新服务使用go-zero：

```
task_center/
├── adapter/
│   ├── driver/          # Gin + 现有鉴权
│   └── driver_v2/       # go-zero + JWT（新功能）
```

### 关键差异处理

#### 1. 用户信息获取

统一接口适配：
```go
// 统一的用户信息接口
type UserInfo interface {
    GetID() string
    GetName() string
}
```

#### 2. 外部服务依赖

当前依赖Hydra OAuth2服务，go-zero默认使用内置JWT。适配时需要：
- 保留Hydra调用逻辑，封装为go-zero中间件
- 或实现JWT ↔ OAuth2 Token的转换层

#### 3. Wire依赖注入

go-zero使用自己的ServiceContext，需要迁移Wire配置。

---

## 总结

| 项目 | 现状 |
|------|------|
| **当前框架** | Gin + idrm-go-common |
| **go-zero依赖** | 已在go.mod中，但未用于HTTP层 |
| **适配可行性** | 可行，但需要重写路由层 |
| **推荐方案** | 如果只需JWT功能，建议保留Gin；要全面迁移需重写 |

---

## 参考资源

- [零信任时代的API防护：用go-zero实现JWT认证与RBAC权限控制](https://blog.csdn.net/gitblog_01128/article/details/152642316)
- [go-zero官方文档](https://go-zero.dev/)
