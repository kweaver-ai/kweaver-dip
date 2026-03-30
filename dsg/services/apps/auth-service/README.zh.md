# 认证授权服务

**Language / 语言**: [English](README.md) | [中文](README.zh.md)

一个使用 Go 构建的综合认证和授权服务，提供策略管理、权限验证、指标维度规则和数据仓库授权申请功能，支持多租户。

## 概述

认证授权服务是一个微服务，负责处理认证和授权操作。它提供基于策略的访问控制（PBAC）、权限验证、指标维度规则管理和数据仓库授权申请工作流。该服务支持多租户应用，提供基于角色的访问控制，并为策略管理、权限检查和授权工作流提供 RESTful API。

## 功能特性

- **策略管理**：
  - 策略创建、更新和删除
  - 策略查询和列表
  - 策略过期管理
  - 基于策略的访问控制（PBAC）
  - 主体-客体-动作策略模型
  - 策略验证和执行

- **权限验证**：
  - 权限检查和验证
  - 数据权限执行
  - 菜单资源权限检查
  - 基于规则的权限执行
  - 资源访问控制
  - 基于动作的授权

- **指标维度规则**：
  - 指标维度规则创建和管理
  - 规则规范更新
  - 规则查询和列表
  - 批量规则操作
  - 基于指标的规则查询
  - 维度规则执行

- **数据仓库授权申请**：
  - 授权申请创建和管理
  - 申请工作流处理
  - 审核工作流集成
  - 申请状态跟踪
  - 审核列表管理
  - 申请取消

- **资源管理**：
  - 主体拥有的资源查询
  - 具有动作权限的子视图列表
  - 菜单资源动作查询
  - 资源访问控制
  - 对象策略查询

- **用户权限管理**：
  - 用户创建权限检查
  - 用户修改权限检查
  - 权限绑定管理
  - 基于角色的权限分配

- **工作流集成**：
  - 工作流消费者注册
  - 工作流事件处理
  - 审核工作流支持
  - 资源注册

- **可观测性**：
  - OpenTelemetry 集成，支持分布式追踪
  - 使用 Zap 的结构化日志
  - 请求/响应追踪中间件
  - 全面的审计日志
  - 响应日志中间件

- **API 文档**：
  - Swagger/OpenAPI 文档
  - 自动生成的 API 文档
  - 交互式 API 测试界面

## 技术栈

- **编程语言**: Go 1.24+
- **Web 框架**: Gin
- **ORM**: GORM with MySQL driver
- **消息队列**: Kafka, NSQ
- **缓存**: Redis
- **依赖注入**: Google Wire
- **API 文档**: Swagger
- **可观测性**: OpenTelemetry
- **日志**: Zap
- **配置管理**: Viper
- **数据库**: MySQL with migration support
- **OAuth2**: Hydra 集成

## 项目结构

```
auth-service/
├── adapter/              # 适配器层（驱动和被驱动）
│   ├── driver/          # HTTP 处理器和 REST API (Gin)
│   │   ├── v1/          # 版本 1 API 端点
│   │   │   ├── dwh_auth_request_form/ # 数据仓库授权申请端点
│   │   │   └── indicator_dimensional_rule/ # 指标维度规则端点
│   │   ├── v2/          # 版本 2 API 端点
│   │   │   └── auth/    # 认证策略端点
│   │   ├── driver.go    # 驱动初始化
│   │   ├── httpEngine.go # HTTP 引擎设置
│   │   └── route.go     # 路由定义
│   └── driven/          # 外部服务客户端和存储
│       ├── database/    # 数据库客户端实现
│       │   ├── af_configuration/ # 配置数据库客户端
│       │   └── dynamic/ # 动态数据库客户端
│       ├── gorm/        # GORM 仓库实现
│       ├── hydra/       # OAuth2 Hydra 客户端
│       ├── microservice/ # 微服务客户端
│       ├── mq/          # 消息队列处理器
│       ├── resources/   # 资源注册
│       └── workflow/   # 工作流集成
├── cmd/                  # 应用入口点
│   └── server/          # 主服务器应用
│       ├── config/      # 配置文件
│       ├── docs/        # Swagger 文档
│       ├── main.go      # 主入口点
│       ├── wire.go      # Wire 依赖注入
│       └── wire_gen.go  # 生成的 Wire 代码
├── common/               # 共享工具和中间件
│   ├── constant/        # 常量
│   ├── dto/             # 数据传输对象
│   │   ├── auth.go      # 认证 DTOs
│   │   ├── completion/  # 完成 DTOs
│   │   ├── validation/ # 验证 DTOs
│   │   └── ...          # 其他 DTOs
│   ├── enum/            # 枚举
│   ├── errorcode/       # 错误码
│   ├── form_validator/  # 表单验证
│   ├── settings/        # 配置设置
│   └── util/            # 工具函数
├── domain/              # 业务逻辑和领域模型
│   ├── common_auth/     # 通用认证领域
│   │   ├── impl/        # 认证实现
│   │   └── interface.go  # 认证接口
│   ├── dwh_data_auth_request/ # 数据仓库授权申请领域
│   ├── indicator_dimensional_rule/ # 指标维度规则领域
│   └── domain.go        # 领域接口
├── infrastructure/      # 基础设施层
│   ├── mq/              # 消息队列实现
│   │   └── kafka/       # Kafka 实现
│   └── repository/      # 仓库实现
│       ├── db/          # 数据库仓库
│       └── redis/       # Redis 仓库
└── migrations/          # 数据库迁移
    ├── dm8/             # DM8 数据库迁移
    └── mariadb/         # MariaDB/MySQL 迁移
```

## 前置要求

- Go 1.24+ 或更高版本
- MySQL 服务器（用于数据存储）
- Redis（用于缓存）
- Kafka 或 NSQ（用于消息队列）
- OAuth2 服务器（Hydra）用于认证
- 配置中心服务

## 快速开始

### 安装

1. 克隆仓库：
```bash
git clone <repository-url>
cd services/apps/auth-service
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
- **Server**: HTTP 和 gRPC 服务器设置（端口、超时等）
- **Database**: MySQL 连接设置
- **Redis**: 缓存设置
- **Message Queue**: Kafka/NSQ 设置
- **Telemetry**: OpenTelemetry 配置
- **Logging**: 日志级别和输出设置
- **OAuth**: OAuth2 客户端配置
- **DepServices**: 外部服务端点

配置示例结构：
```yaml
server:
  http:
    addr: 0.0.0.0:8155
  grpc:
    addr: 0.0.0.0:9000

data:
  database:
    driver: mysql
    source: "${DB_USERNAME}:${DB_PASSWORD}@tcp(${DB_HOST}:${DB_PORT})/${DB_NAME}?charset=utf8mb4&parseTime=True&loc=Local"
  redis:
    addr: "${REDIS_HOST}"
    read_timeout: 0.2s
    write_timeout: 0.2s

database:
  dbtype: "${DB_TYPE}"
  host: "${DB_HOST}"
  port: "${DB_PORT}"
  username: "${DB_USERNAME}"
  password: "${DB_PASSWORD}"
  database: "${DB_NAME}"
  max-idle-connections: 5
  max-open-connections: 50

mq:
  kafka:
    Type: kafka
    Host: "${KAFKA_HOST}"
    username: "${KAFKA_USERNAME}"
    password: "${KAFKA_PASSWORD}"
    mechanism: "${KAFKA_MECHANISM}"

telemetry:
  logLevel: "${LOG_LEVEL}"
  traceUrl: "${TRACE_URL}"
  logUrl: "${LOG_URL}"
  serverName: "auth-service"
  serverVersion: "1.0.0"
  traceEnabled: "${TRACE_ENABLED}"
```

环境变量：
| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| DB_HOST | 数据库主机 | - |
| DB_PORT | 数据库端口 | 3306 |
| DB_USERNAME | 数据库用户名 | - |
| DB_PASSWORD | 数据库密码 | - |
| DB_NAME | 数据库名称 | - |
| REDIS_HOST | Redis 主机 | - |
| KAFKA_HOST | Kafka 代理地址 | - |
| KAFKA_USERNAME | Kafka 用户名 | - |
| KAFKA_PASSWORD | Kafka 密码 | - |
| KAFKA_MECHANISM | Kafka SASL 机制 | PLAIN |
| OAUTH_CLIENT_ID | OAuth2 客户端 ID | - |
| OAUTH_CLIENT_SECRET | OAuth2 客户端密钥 | - |

### 构建

构建服务二进制文件：

```bash
# 为当前平台构建
make build

# 为 Linux 构建
make build-linux

# 或直接构建
go build -o bin/auth-service-server ./cmd/server
```

二进制文件将生成在 `bin/` 目录中，名为 `auth-service-server`。

### 运行

启动服务：

```bash
# 直接运行
./bin/auth-service-server --confPath cmd/server/config/ --addr :8155

# 或使用 Go
go run ./cmd/server/main.go --confPath cmd/server/config/ --addr :8155
```

服务将在配置的端口上启动（默认：8155）。

### API 端点

服务为各种功能提供 RESTful API。关键端点类别包括：

#### 策略管理
- `POST /api/auth-service/v1/policy` - 创建策略
- `GET /api/auth-service/v1/policy` - 获取策略详情
- `PUT /api/auth-service/v1/policy` - 更新策略
- `DELETE /api/auth-service/v1/policy` - 删除策略

#### 权限验证
- `POST /api/auth-service/v1/enforce` - 策略验证执行
- `POST /api/internal/auth-service/v1/enforce` - 内部数据权限验证
- `POST /api/internal/auth-service/v1/rule/enforce` - 数据策略验证
- `POST /api/internal/auth-service/v1/menu-resource/enforce` - 菜单资源权限验证

#### 资源查询
- `GET /api/auth-service/v1/subject/objects` - 获取主体拥有的对象
- `GET /api/auth-service/v1/sub-views` - 列出具有动作权限的子视图
- `GET /api/auth-service/v1/menu-resource/actions` - 查询菜单资源的允许操作
- `GET /api/internal/auth-service/v1/objects/policy/expired` - 查询过期的策略对象

#### 指标维度规则
- `POST /api/auth-service/v1/indicator-dimensional-rules` - 创建指标维度规则
- `DELETE /api/auth-service/v1/indicator-dimensional-rules/:id` - 删除规则
- `PUT /api/auth-service/v1/indicator-dimensional-rules/:id/spec` - 更新规则规范
- `GET /api/auth-service/v1/indicator-dimensional-rules/:id` - 获取规则详情
- `GET /api/auth-service/v1/indicator-dimensional-rules` - 列出规则
- `GET /api/internal/auth-service/v1/indicator-dimensional-rules/indicators` - 根据指标 ID 批量获取规则
- `GET /api/internal/auth-service/v1/indicator-dimensional-rules/batch` - 根据指标获取规则

#### 数据仓库授权申请
- `POST /api/auth-service/v1/dwh-data-auth-request` - 创建授权申请
- `PUT /api/auth-service/v1/dwh-data-auth-request/:id` - 更新申请
- `GET /api/auth-service/v1/dwh-data-auth-request/:id` - 获取申请详情
- `DELETE /api/auth-service/v1/dwh-data-auth-request/:id` - 删除申请
- `GET /api/auth-service/v1/dwh-data-auth-request` - 列出申请
- `PUT /api/auth-service/v1/dwh-data-auth-request/audit/:id` - 取消审核
- `GET /api/auth-service/v1/dwh-data-auth-request/audit` - 获取审核列表
- `GET /api/internal/auth-service/v1/dwh-data-auth-request` - 查询申请人的申请状态

### API 文档

生成 Swagger 文档后，可通过以下地址访问 API 文档：
- Swagger UI: `http://localhost:8155/swagger/index.html`
- JSON: `http://localhost:8155/swagger/doc.json`

## 开发

### 代码生成

```bash
# 生成 Wire 依赖注入
make wire

# 生成 Swagger 文档
make swag

# 生成 GORM 模型
make model dsn="mysql://user:pass@tcp(host:port)/db"
```

### 数据库迁移

```bash
# 设置迁移环境变量
export MYSQL_HOST=localhost
export MYSQL_PORT=3306
export MYSQL_USERNAME=root
export MYSQL_PASSWORD=password
export MYSQL_DB=auth_service

# 创建迁移文件
make mc name=create_table

# 执行迁移升级
make mu v=1

# 执行迁移回滚
make md v=1

# 强制迁移版本
make mf v=3
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

服务遵循清洁架构模式，职责分离清晰：

- **领域层**：业务逻辑和领域模型
  - 策略管理和执行
  - 权限检查和验证
  - 指标维度规则管理
  - 数据仓库授权申请工作流

- **适配器层**：
  - **驱动端**：HTTP 处理器、REST API 端点（Gin）
  - **被驱动端**：数据库实现、外部服务客户端

- **公共层**：共享工具、中间件和配置

## 基于策略的访问控制（PBAC）

服务实现了基于策略的访问控制模型：
- **主体（Subject）**：请求访问的用户、角色或组
- **客体（Object）**：被访问的资源或数据
- **动作（Action）**：执行的操作（读取、写入、删除等）
- **策略（Policy）**：定义访问权限的规则

策略支持：
- 多个主体和客体
- 基于动作的权限
- 策略过期
- 策略继承
- 基于规则的执行

## 权限验证

服务提供多种验证机制：
- **策略验证**：基于策略的标准权限检查
- **规则验证**：基于规则的权限验证
- **菜单资源验证**：菜单和资源级别的权限检查
- **数据权限验证**：数据级别的访问控制

## 指标维度规则

服务管理指标维度规则，用于：
- 指标访问控制
- 维度过滤
- 规则规范管理
- 批量规则操作
- 基于规则的授权

## 数据仓库授权申请

服务处理数据仓库授权工作流：
- 申请创建和管理
- 工作流集成
- 审核流程支持
- 申请状态跟踪
- 审核列表管理

## 消息队列集成

服务与 Kafka 和 NSQ 集成，用于：
- 异步策略更新
- 事件驱动的授权工作流
- 工作流事件处理
- 可靠的消息传递

## 工作流集成

服务与工作流系统集成，用于：
- 授权申请工作流
- 审核流程管理
- 资源注册
- 工作流消费者注册

## 安全考虑

- 通过 Hydra 进行 OAuth2 认证
- 基于策略的访问控制（PBAC）
- 基于权限的授权
- 输入验证和清理
- 通过 GORM 防止 SQL 注入
- 安全数据库连接
- 所有操作的审计日志
- 基于令牌的认证

## 监控与可观测性

- OpenTelemetry 用于分布式追踪
- 带关联 ID 的结构化日志
- 性能指标收集
- 健康检查端点
- 关键操作的审计跟踪
- 响应日志中间件

## 贡献

1. 遵循现有的代码风格和模式
2. 为新功能添加测试
3. 添加新端点时更新 API 文档
4. 运行 `make swag` 重新生成 Swagger 文档
5. 提交前确保所有测试通过
6. 遵循清洁架构原则

## 许可证

请查看仓库根目录中的 LICENSE 文件。

## 支持

如有问题和疑问，请联系开发团队或在仓库中创建 issue。
