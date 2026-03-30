# 数据应用服务

**语言**: **中文** | [English](README.md)

基于 Go 构建的综合数据应用服务，为 DSG（数据语义治理）系统提供 API 接口管理、数据服务发布和数据应用生命周期管理功能。

## 概述

数据应用服务是一个核心微服务，负责管理数据应用接口，包括 API 创建、发布、版本管理和访问控制。它使用户能够将数据视图和数据目录发布为 RESTful API，并提供完整的生命周期管理。

## 功能特性

- **API 接口管理**：
  - 创建、更新和删除 API 接口
  - API 版本控制和生命周期管理
  - API 元数据和文档
  - 接口授权和访问控制

- **数据服务发布**：
  - 将数据视图发布为 API
  - 将数据目录发布为 API
  - 配置请求/响应格式
  - 设置数据转换规则

- **工作流集成**：
  - API 审批工作流
  - 发布流水线管理
  - 工作流状态跟踪
  - 回调机制支持

- **服务集成**：
  - 配置中心集成
  - 用户管理集成
  - 授权服务集成
  - 元数据管理集成

- **可观测性**：
  - OpenTelemetry 分布式追踪
  - Zap 结构化日志
  - 审计日志支持
  - 健康检查端点

- **CDC（变更数据捕获）**：
  - 实时数据同步
  - 定时数据轮询
  - 事件驱动更新

## 技术栈

- **语言**: Go 1.24.0
- **Web 框架**: Gin
- **数据库**: MariaDB/MySQL (GORM)
- **缓存**: Redis
- **消息队列**: Kafka/NSQ
- **依赖注入**: Google Wire
- **API 文档**: Swagger
- **可观测性**: OpenTelemetry
- **日志**: Zap
- **配置管理**: Viper

## 项目结构

```
data-application-service/
├── adapter/          # 适配器层（驱动和被驱动）
│   ├── driver/       # HTTP 处理器和 REST API (Gin)
│   └── driven/       # 外部服务客户端
├── cmd/              # 应用程序入口
│   └── server/       # 主服务器应用
├── common/           # 共享工具和中间件
│   ├── constant/     # 常量
│   ├── errorcode/    # 错误码
│   ├── form_validator/ # 表单验证
│   └── initialization/ # 初始化逻辑
├── domain/           # 业务逻辑和领域模型
├── infrastructure/   # 基础设施层
│   ├── config/       # 配置
│   └── repository/   # 数据库仓储
├── migrations/       # 数据库迁移文件
│   └── mariadb/      # MariaDB 迁移
├── docker/           # Docker 配置
└── helm/             # Kubernetes Helm 图表
```

## 前置要求

- Go 1.24.0 或更高版本
- MariaDB/MySQL 数据库
- Redis 服务器
- Kafka 或 NSQ 消息队列
- 配置中心服务
- OAuth2/OIDC 提供者（Hydra）

## 快速开始

### 安装

1. 克隆仓库：
```bash
git clone <repository-url>
cd services/apps/data-application-service
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
- **Kafka/NSQ**: 消息队列设置
- **Services**: 微服务端点
- **Telemetry**: OpenTelemetry 配置
- **Workflow**: 工作流集成设置
- **Callback**: 回调机制配置

配置示例：
```yaml
server:
  http:
    addr: 0.0.0.0:8156
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
  data_catalog: "data-catalog:8153"
  data_view: "data-view:8123"
```

### 构建

构建服务二进制文件：

```bash
# 为当前平台构建
make build

# 为 Linux 构建
make build-linux
```

二进制文件将生成在 `bin/` 目录中，名为 `data-application-service-server`。

### 运行

启动服务：

```bash
# 直接运行
./bin/data-application-service-server --confPath cmd/server/config/

# 或使用 Go
go run cmd/server/main.go --confPath cmd/server/config/

# 或使用 Make
make run
```

服务默认在端口 8156 启动。

### 数据库迁移

服务使用 [golang-migrate](https://github.com/golang-migrate/migrate) 进行数据库迁移。

```bash
# 创建新的迁移文件
make mc name=add_column

# 执行迁移
make mu

# 执行到指定版本
make mu v=3

# 回滚迁移
make md v=3

# 强制设置版本
make mf v=3
```

迁移所需的环境变量：
| 变量 | 说明 | 示例 |
|------|------|------|
| MYSQL_HOST | 数据库主机 | 127.0.0.1 |
| MYSQL_PORT | 数据库端口 | 3306 |
| MYSQL_USERNAME | 数据库用户 | root |
| MYSQL_PASSWORD | 数据库密码 | 123 |
| MYSQL_DB | 数据库名称 | dsg |

### API 端点

所有端点前缀为 `/api/data-application-service/v1`：

#### 服务管理
- `POST /services` - 创建新的数据服务
- `GET /services` - 列出所有数据服务
- `GET /services/:id` - 获取服务详情
- `PUT /services/:id` - 更新服务
- `DELETE /services/:id` - 删除服务

#### 发布
- `POST /services/:id/publish` - 发布服务
- `POST /services/:id/unpublish` - 下线服务
- `GET /services/:id/versions` - 获取服务版本

#### 执行
- `POST /execute/:service_id` - 执行数据服务

### API 文档

生成 Swagger 文档后，可以访问：
- Swagger UI: `http://localhost:8156/swagger/index.html`
- JSON: `http://localhost:8156/swagger/doc.json`

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
docker build -f docker/Dockerfile -t data-application-service .

# 运行容器
docker run -p 8156:8156 data-application-service
```

## 架构

服务遵循整洁架构模式：

- **领域层**: 业务逻辑和领域模型
  - 服务管理
  - API 生命周期管理
  - 发布工作流

- **适配器层**:
  - **驱动**: HTTP 处理器、REST API 端点 (Gin)
  - **被驱动**: 外部服务客户端（配置中心、数据目录等）

- **基础设施层**: 数据库仓储、外部集成

## 安全考虑

- 通过 Hydra 进行 OAuth2/OIDC 认证
- 基于角色的访问控制
- API 授权策略
- 所有操作的审计日志

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
