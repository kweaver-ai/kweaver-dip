# 数据应用网关

**语言**: **中文** | [English](README.md)

基于 Go 构建的轻量级 API 网关服务，为 DSG（数据语义治理）系统提供统一的数据应用服务访问、请求路由和 API 执行能力。

## 概述

数据应用网关是一个微服务，作为执行数据应用 API 的统一入口点。它处理请求路由、认证、限流，并将请求转发到适当的数据应用服务。该网关使外部消费者能够通过单一端点访问已发布的数据服务。

## 功能特性

- **API 网关**：
  - 所有数据服务的统一 API 端点
  - 请求路由和转发
  - 动态服务发现
  - 负载均衡支持

- **请求处理**：
  - 请求验证和转换
  - 参数映射和转换
  - 响应格式化
  - 错误处理和标准化

- **安全**：
  - OAuth2/OIDC 认证集成
  - API 密钥验证
  - 限流和节流
  - 访问控制执行

- **集成**：
  - 数据应用服务集成
  - 配置中心集成
  - 用户管理集成
  - 授权服务集成

- **可观测性**：
  - OpenTelemetry 分布式追踪
  - Zap 结构化日志
  - 请求/响应日志
  - 健康检查端点

## 技术栈

- **语言**: Go 1.24.0
- **Web 框架**: Gin
- **数据库**: MariaDB/MySQL (GORM)
- **缓存**: Redis
- **依赖注入**: Google Wire
- **API 文档**: Swagger
- **可观测性**: OpenTelemetry
- **日志**: Zap
- **配置管理**: Viper

## 项目结构

```
data-application-gateway/
├── adapter/          # 适配器层（驱动和被驱动）
│   ├── driver/       # HTTP 处理器和 REST API (Gin)
│   └── driven/       # 外部服务客户端
├── cmd/              # 应用程序入口
│   └── server/       # 主服务器应用
├── common/           # 共享工具和中间件
│   ├── constant/     # 常量
│   ├── errorcode/    # 错误码
│   └── initialization/ # 初始化逻辑
├── domain/           # 业务逻辑和领域模型
├── infrastructure/   # 基础设施层
│   ├── config/       # 配置
│   └── repository/   # 数据库仓储
├── docker/           # Docker 配置
└── helm/             # Kubernetes Helm 图表
```

## 前置要求

- Go 1.24.0 或更高版本
- MariaDB/MySQL 数据库
- Redis 服务器
- 数据应用服务
- 配置中心服务
- OAuth2/OIDC 提供者（Hydra）

## 快速开始

### 安装

1. 克隆仓库：
```bash
git clone <repository-url>
cd services/apps/data-application-gateway
```

2. 安装依赖：
```bash
go mod download
```

3. 生成代码：
```bash
# 生成 Wire 依赖注入代码
make wire

# 生成 Swagger API 文档
make swag
```

### 配置

服务使用 Viper 进行配置管理。配置文件应放置在 `cmd/server/config/` 目录中。

主要配置部分：
- **Server**: HTTP/gRPC 服务器设置（端口、超时等）
- **Database**: MariaDB/MySQL 连接设置
- **Redis**: Redis 连接设置
- **Services**: 微服务端点
- **Telemetry**: OpenTelemetry 配置

配置示例：
```yaml
server:
  http:
    addr: 0.0.0.0:8157
  grpc:
    addr: 0.0.0.0:9000

database:
  dbtype: mysql
  host: localhost
  port: 3306
  username: dsg
  password: dsg123
  database: dsg

redis:
  host: localhost:6379
  password: ""

services:
  configuration_center: "configuration-center:8133"
  data_application_service: "data-application-service:8156"
  auth_service: "auth-service:8155"
```

### 构建

构建服务二进制文件：

```bash
# 为当前平台构建
make build

# 为 Linux 构建
make build-linux
```

二进制文件将生成在 `bin/` 目录中，名为 `data-application-gateway-server`。

### 运行

启动服务：

```bash
# 直接运行
./bin/data-application-gateway-server --confPath cmd/server/config/

# 或使用 Go
go run cmd/server/main.go --confPath cmd/server/config/

# 或使用 Make
make run
```

服务默认在端口 8157 启动。

### API 端点

所有端点前缀为 `/api/data-application-gateway/v1`：

#### API 执行
- `POST /execute/:service_id` - 执行已发布的数据服务
- `GET /execute/:service_id` - 执行数据服务（GET 方法）

#### 服务发现
- `GET /services` - 列出可用的已发布服务
- `GET /services/:id` - 获取服务元数据

#### 健康检查
- `GET /health` - 健康检查端点
- `GET /ready` - 就绪检查端点

### API 文档

生成 Swagger 文档后，可以访问：
- Swagger UI: `http://localhost:8157/swagger/index.html`
- JSON: `http://localhost:8157/swagger/doc.json`

## 开发

### 代码生成

```bash
# 生成 Wire 依赖注入
make wire

# 生成 Swagger 文档
make swag
```

### 运行测试

```bash
go test ./...
```

### Docker

使用 Docker 构建和运行：

```bash
# 构建 Docker 镜像
docker build -f docker/Dockerfile -t data-application-gateway .

# 运行容器
docker run -p 8157:8157 data-application-gateway
```

## 架构

服务遵循整洁架构模式：

- **领域层**: 业务逻辑和领域模型
  - 请求路由
  - 服务发现
  - API 执行

- **适配器层**:
  - **驱动**: HTTP 处理器、REST API 端点 (Gin)
  - **被驱动**: 外部服务客户端（数据应用服务、配置中心等）

- **基础设施层**: 数据库仓储、外部集成

## 请求流程

1. 客户端发送请求到网关
2. 网关认证请求
3. 网关查找目标服务
4. 请求被验证和转换
5. 请求被转发到数据应用服务
6. 接收并格式化响应
7. 响应返回给客户端

## 安全考虑

- 通过 Hydra 进行 OAuth2/OIDC 认证
- 服务间调用的 API 密钥验证
- 限流防止滥用
- 请求/响应日志用于审计

## 贡献

1. 遵循现有的代码风格和模式
2. 为新功能添加测试
3. 添加新端点时更新 API 文档
4. 运行 `make swag` 重新生成 Swagger 文档
5. 提交前确保所有测试通过

## 许可证

请参阅仓库根目录中的 LICENSE 文件。

## 支持

如有问题，请联系开发团队或在仓库中创建 Issue。
