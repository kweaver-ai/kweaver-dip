# 会话管理服务

**Language / 语言**: [English](README.md) | [中文](README.zh.md)

一个使用 Go 构建的综合会话管理服务，基于 OAuth2/OIDC 协议和 Redis 会话存储，提供认证、授权和会话管理功能。

## 概述

会话管理服务是一个微服务，负责处理用户认证、会话管理和令牌操作。它支持 OAuth2/OIDC 流程、单点登录（SSO）、第三方认证（如 AnyShare），并提供用于登录、登出、令牌刷新和用户信息检索的 RESTful API。

## 功能特性

- **OAuth2/OIDC 认证**：
  - OAuth2 授权码流程
  - 登录和登出回调
  - 令牌管理和刷新
  - 支持多平台

- **单点登录（SSO）**：
  - SSO 认证支持
  - 第三方 SSO 集成（AnyShare）
  - 基于会话的认证

- **会话管理**：
  - 基于 Redis 的会话存储
  - 会话创建、检索和删除
  - 可配置的会话过期时间
  - 基于 Cookie 的会话跟踪

- **用户信息**：
  - 用户资料检索
  - 用户名查询
  - 平台信息

- **可观测性**：
  - OpenTelemetry 集成，支持分布式追踪
  - 使用 Zap 的结构化日志
  - 请求/响应追踪中间件
  - 审计日志支持

- **API 文档**：
  - Swagger/OpenAPI 文档
  - 自动生成的 API 文档

## 技术栈

- **编程语言**: Go 1.24.0
- **Web 框架**: Gin
- **会话存储**: Redis (通过 go-redis)
- **认证**: OAuth2/OIDC (Hydra)
- **依赖注入**: Google Wire
- **API 文档**: Swagger
- **可观测性**: OpenTelemetry
- **日志**: Zap
- **配置管理**: Viper
- **消息队列**: Kafka (通过 Sarama，可选)

## 项目结构

```
session/
├── adapter/          # 适配器层（驱动和被驱动）
│   ├── driver/       # HTTP 处理器和 REST API (Gin)
│   └── driven/       # 外部服务客户端（OAuth2、用户管理等）
├── cmd/              # 应用入口点
│   └── server/       # 主服务器应用
├── common/           # 共享工具和中间件
│   ├── constant/     # 常量
│   ├── cookie_util/  # Cookie 工具
│   ├── errorcode/    # 错误码
│   ├── form_validator/ # 表单验证
│   ├── initialization/ # 初始化逻辑
│   ├── settings/     # 配置设置
│   ├── trace_util/   # 追踪工具
│   └── units/        # 单元工具
├── domain/           # 业务逻辑和领域模型
│   ├── d_session/   # 会话领域（Redis 实现）
│   ├── login/        # 登录用例
│   ├── logout/       # 登出用例
│   ├── refresh_token/ # 令牌刷新用例
│   └── user_info/    # 用户信息用例
└── session/          # 额外的会话工具
```

## 前置要求

- Go 1.24.0 或更高版本
- Redis 服务器（用于会话存储）
- OAuth2/OIDC 提供者（如 Hydra）
- 用户管理服务（用于用户信息）
- Kafka（可选，用于消息消费）

## 快速开始

### 安装

1. 克隆仓库：
```bash
git clone <repository-url>
cd services/apps/session
```

2. 安装依赖：
```bash
go mod download
```

3. 生成代码：
```bash
# 生成 Wire 依赖注入代码
go generate ./...

# 生成 Swagger API 文档（如果已安装 swag）
swag init -g cmd/server/main.go
```

### 配置

服务使用 Viper 进行配置管理。配置文件应放置在 `cmd/server/config/` 目录中。

主要配置部分：
- **Server**: HTTP 服务器设置（端口、超时等）
- **Redis**: Redis 连接设置（用于会话存储）
- **OAuth2**: OAuth2/OIDC 提供者设置（Hydra）
- **User Management**: 用户管理服务端点
- **Authentication**: 认证服务端点
- **Telemetry**: OpenTelemetry 配置
- **Logging**: 日志级别和输出设置
- **Session**: 会话过期和 Cookie 设置

配置示例结构：
```yaml
server:
  port: 8080
  timeout: 30s

redis:
  addr: localhost:6379
  password: ""
  db: 0

oauth2:
  client_id: your-client-id
  client_secret: your-client-secret
  auth_url: http://hydra:4444/oauth2/auth
  token_url: http://hydra:4444/oauth2/token

session:
  expire_seconds: 3600
  cookie_name: session_id
```

### 构建

构建服务二进制文件：

```bash
# 为当前平台构建
go build -o bin/session-server ./cmd/server

# 为 Linux 构建
GOOS=linux GOARCH=amd64 go build -o bin/session-server-linux ./cmd/server
```

二进制文件将生成在 `bin/` 目录中，名为 `session-server`。

### 运行

启动服务：

```bash
# 直接运行
./bin/session-server --confPath cmd/server/config/

# 或使用 Go
go run cmd/server/main.go --confPath cmd/server/config/
```

服务将在配置的端口上启动（默认：8080）。

### API 端点

所有端点都以 `/af/api/session/v1` 为前缀：

#### 认证
- `GET /login` - 发起 OAuth2 登录流程（重定向到授权服务器）
- `GET /login/callback` - 处理 OAuth2 登录回调
- `GET /logout` - 发起登出流程
- `GET /logout/callback` - 处理登出回调
- `GET /refresh-token` - 刷新访问令牌

#### 单点登录
- `POST /sso` - 第三方 SSO 认证（AnyShare）
- `GET /sso` - 单点登录认证

#### 用户信息
- `GET /userinfo` - 获取用户信息
- `GET /username` - 获取用户名
- `GET /platform` - 获取登录平台信息

### API 文档

生成 Swagger 文档后，可通过以下地址访问 API 文档：
- Swagger UI: `http://localhost:<port>/swagger/index.html`
- JSON: `http://localhost:<port>/swagger/doc.json`

## 开发

### 代码生成

```bash
# 生成 Wire 依赖注入代码
go generate ./...

# 生成 Swagger 文档（如果已安装 swag）
swag init -g cmd/server/main.go
```

### 运行测试

```bash
go test ./...
```

### 代码质量

项目遵循 Go 最佳实践和清洁架构原则。建议使用：
- `golangci-lint` 进行代码质量检查
- `go vet` 进行静态分析
- `go fmt` 进行代码格式化

## 架构

服务遵循清洁架构模式：

- **领域层**：业务逻辑和领域模型
  - `d_session`: 会话领域（Redis 实现）
  - `login`: 登录用例
  - `logout`: 登出用例
  - `refresh_token`: 令牌刷新用例
  - `user_info`: 用户信息用例

- **适配器层**：
  - **驱动端**：HTTP 处理器、REST API 端点（Gin）
  - **被驱动端**：外部服务客户端（OAuth2、用户管理、认证）

- **公共层**：共享工具、中间件和配置

## 会话管理

会话存储在 Redis 中，具有以下特性：
- 会话 ID 存储在 HTTP Cookie 中
- 会话数据包括：令牌、用户信息、平台、SSO 状态
- 可配置的过期时间
- 登出时自动清理

## 安全考虑

- 会话存储在服务器端的 Redis 中
- 会话 ID 通过安全 Cookie 传输
- 使用 OAuth2/OIDC 协议进行安全认证
- 令牌刷新机制支持长期会话
- 支持多种认证平台

## 贡献

1. 遵循现有的代码风格和模式
2. 为新功能添加测试
3. 添加新端点时更新 API 文档
4. 运行 `swag init` 重新生成 Swagger 文档
5. 提交前确保所有测试通过

## 许可证

请查看仓库根目录中的 LICENSE 文件。

## 支持

如有问题和疑问，请联系开发团队或在仓库中创建 issue。
