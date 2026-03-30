# 数据探查服务

**Language / 语言**: [English](README.md) | [中文](README.zh.md)

一个使用 Go 构建的综合数据探查服务，基于 Clean Architecture 原则，提供异步数据探查能力、任务配置管理和报告生成功能。

## 概述

数据探查服务是一个微服务，负责处理数据探查任务、管理探查配置、生成探查报告，并与虚拟化引擎集成以执行查询。它支持并发探查、重试机制，并提供用于创建、管理和查询数据探查任务的 RESTful API。

## 功能特性

- **数据探查**：
  - 异步数据探查执行
  - 支持分组查询和探查任务
  - 与虚拟化引擎集成
  - 查询结果缓存和管理
  - 探查超时处理

- **任务配置管理**：
  - 创建、读取、更新和删除探查任务配置
  - 任务调度和执行管理
  - 任务状态跟踪和监控

- **报告管理**：
  - 探查报告生成和存储
  - 报告项管理
  - 报告查询和检索
  - 第三方报告支持

- **并发控制**：
  - 可配置的并发限制
  - 任务级并发控制
  - 服务级并发管理

- **重试机制**：
  - 可配置的重试次数和等待时间
  - SQL 执行重试支持
  - 重试超时处理

- **可观测性**：
  - OpenTelemetry 集成，支持分布式追踪
  - 结构化日志
  - 请求/响应追踪中间件
  - 审计日志支持

- **API 文档**：
  - Swagger/OpenAPI 文档
  - 自动生成的 API 文档

## 技术栈

- **编程语言**: Go 1.24+
- **Web 框架**: Gin
- **数据库**: MySQL/MariaDB
- **ORM**: GORM
- **消息队列**: Kafka
- **缓存**: Redis
- **依赖注入**: Google Wire
- **API 文档**: Swagger
- **可观测性**: OpenTelemetry
- **架构**: Clean Architecture

## 项目结构

```
data-exploration-service/
├── adapter/                    # 适配器层
│   ├── driver/                # HTTP 处理器和 REST API (Gin)
│   │   ├── exploration/       # 数据探查 API
│   │   │   └── v1/           # API 版本 1
│   │   ├── task_config/       # 任务配置 API
│   │   │   └── v1/           # API 版本 1
│   │   ├── route.go          # 路由配置
│   │   └── httpEngine.go     # HTTP 引擎设置
│   └── driven/               # 外部服务客户端
│       ├── gorm/             # 数据库访问 (GORM)
│       │   ├── report/       # 报告仓库
│       │   ├── report_item/  # 报告项仓库
│       │   ├── task_config/ # 任务配置仓库
│       │   └── client_info/ # 客户端信息仓库
│       ├── virtualization_engine/ # 虚拟化引擎客户端
│       ├── configuration_center/  # 配置中心客户端
│       ├── user_management/      # 用户管理客户端
│       ├── hydra/                # OAuth2 客户端
│       ├── mq/                   # 消息队列 (Kafka)
│       └── redis_lock/           # Redis 分布式锁
├── cmd/                      # 应用入口点
│   ├── main.go              # 主入口
│   ├── root.go              # 根命令
│   ├── server.go            # 服务器命令
│   ├── migrate.go           # 迁移命令
│   └── server/              # 服务器应用
│       ├── config/          # 配置文件
│       ├── docs/            # Swagger 文档
│       ├── app.go           # 应用设置
│       └── run.go           # 服务器运行逻辑
├── common/                   # 共享工具和中间件
│   ├── constant/           # 常量
│   ├── errorcode/          # 错误码
│   ├── form_validator/      # 表单验证
│   ├── models/             # 通用模型
│   ├── middleware/         # 中间件
│   └── settings/           # 配置设置
├── domain/                  # 业务逻辑和领域模型
│   ├── exploration/        # 数据探查领域
│   │   ├── impl/          # 实现
│   │   ├── impl/v2/      # 版本 2 实现
│   │   ├── impl/tools/   # 工具和实用程序
│   │   ├── interface.go  # 领域接口
│   │   └── server.go     # 探查服务器
│   ├── task_config/       # 任务配置领域
│   └── common/            # 通用领域逻辑
├── infrastructure/         # 基础设施层
│   └── repository/        # 仓库实现
│       └── db/            # 数据库模型和迁移
└── migrations/            # 数据库迁移
    ├── dm8/                # DM8 数据库迁移
    └── mariadb/            # MariaDB/MySQL 迁移
```

## 前置要求

- Go 1.24 或更高版本
- MySQL 5.7+ 或 MariaDB 10.3+ 数据库
- Kafka（用于消息队列）
- Redis（用于缓存和分布式锁）
- Make 构建工具

## 快速开始

### 安装

1. 克隆仓库：
```bash
git clone <repository-url>
cd services/apps/data-exploration-service
```

2. 安装依赖和工具：
```bash
make init
```

3. 生成 Wire 依赖注入代码：
```bash
make wire
```

4. 生成 Swagger API 文档：
```bash
make swag
```

### 配置

服务使用配置文件进行设置。配置文件应放置在 `cmd/server/config/` 目录中。

主要配置部分：
- **Server**: HTTP 服务器设置（端口、超时等）
- **Database**: 数据库连接设置
- **Redis**: Redis 连接设置
- **Kafka**: Kafka 消息队列设置
- **Exploration**: 数据探查特定设置
- **Telemetry**: OpenTelemetry 配置
- **Logging**: 日志级别和输出设置
- **DepServices**: 外部服务端点

配置示例结构：
```yaml
server:
  http:
    addr: 0.0.0.0:8281
    timeout: 10s

database:
  dbtype: "${DB_TYPE}"
  host: "${DB_HOST}"
  port: "${DB_PORT}"
  username: "${DB_USERNAME}"
  password: "${DB_PASSWORD}"
  database: "${DB_NAME}"
  max-idle-connections: 5
  max-open-connections: 50

redis:
  addr: ${REDIS_HOST}
  password: ${REDIS_PASSWORD}
  DB: ${REDIS_DB}

kafka:
  addr: ${KAFKA_URI}
  username: ${KAFKA_USERNAME}
  password: ${KAFKA_PASSWORD}
  mechanism: ${KAFKA_MECHANISM}
  groupId: ${KAFKA_CONSUMER_GROUP}

exploration:
  cacheExpireTime: ${EXPLORE_CACHE_EXPIRE_TIME}
  groupLimit: ${EXPLORE_GROUP_LIMIT}
  reportDefaultOvertime: ${REPORT_DEFAULT_OVER_TIME}
  concurrency_enable: ${concurrency_enable}
  concurrency_limit: ${concurrency_limit}
  retry_count: ${retry_count}
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
| REDIS_PASSWORD | Redis 密码 | - |
| KAFKA_URI | Kafka 代理地址 | - |
| KAFKA_USERNAME | Kafka 用户名 | - |
| KAFKA_PASSWORD | Kafka 密码 | - |
| CONFIGURATION_CENTER_HOST | 配置中心服务主机 | - |
| VIRTUALIZATION_ENGINE_URL | 虚拟化引擎 URL | - |

### 构建

构建服务二进制文件：

```bash
# 构建二进制文件
make build

# 为 Linux 构建
make build-linux

# 或直接构建
go build -o bin/app ./cmd
```

### 运行

启动服务：

```bash
# 使用 Make 运行（构建并启动）
make start-dev

# 或使用现有二进制文件启动
make start

# 或直接运行
go run ./cmd server --conf cmd/server/config/ --addr :8281
```

服务将在配置的端口上启动（默认：8281）。

### API 端点

所有端点都以 `/api` 为前缀：

#### 数据探查
- `POST /exploration` - 执行异步数据探查
- `GET /exploration/{id}` - 获取探查任务状态
- `GET /exploration/{id}/result` - 获取探查结果
- `DELETE /exploration/{id}` - 取消探查任务

#### 任务配置
- `GET /task-config` - 获取任务配置列表
- `POST /task-config` - 创建任务配置
- `PUT /task-config/{id}` - 更新任务配置
- `DELETE /task-config/{id}` - 删除任务配置

#### 报告管理
- `GET /report` - 获取报告列表
- `GET /report/{id}` - 获取报告详情
- `GET /report/{id}/items` - 获取报告项

### API 文档

生成 Swagger 文档后，可通过以下地址访问 API 文档：
- Swagger UI: `http://localhost:8281/swagger/index.html`
- JSON: `http://localhost:8281/swagger/doc.json`

## 数据库迁移

### MariaDB/MySQL 数据库
```bash
# 设置迁移环境变量
export MYSQL_HOST=localhost
export MYSQL_PORT=3306
export MYSQL_USERNAME=root
export MYSQL_PASSWORD=password
export MYSQL_DB=data_exploration

# 执行迁移升级
make mu v=1

# 执行迁移回滚
make md v=1
```

### DM8 数据库
```bash
# 执行 DM8 迁移脚本
ls migrations/dm8/0.1.0/pre/
```

## 开发

### 代码生成

```bash
# 生成 Wire 依赖注入
make wire

# 生成 Swagger 文档
make swag

# 生成 GORM 模型
make model dsn="mysql://user:pass@tcp(host:port)/db" tables="table1,table2"
```

### 运行测试

```bash
go test ./...
```

### 代码质量

项目遵循 Go 最佳实践和 Clean Architecture 原则。建议使用：
- `golangci-lint` 进行代码质量检查
- `go vet` 进行静态分析
- `go fmt` 进行代码格式化

## 架构

服务遵循 Clean Architecture 模式：

- **领域层**：业务逻辑和领域模型
  - `exploration`: 数据探查领域逻辑
  - `task_config`: 任务配置领域逻辑
  - `common`: 通用领域工具

- **适配器层**：
  - **驱动端**：HTTP 处理器、REST API 端点（Gin）
  - **被驱动端**：外部服务客户端（GORM、Kafka、Redis 等）

- **公共层**：共享工具、中间件和配置

## 数据探查功能

服务提供全面的数据探查能力：
- 异步探查执行
- 分组查询支持
- 与虚拟化引擎集成
- 结果缓存和管理
- 并发探查支持
- 失败查询的重试机制
- 超时处理
- 报告生成和存储

## 消息队列集成

服务与 Kafka 集成，用于：
- 探查任务事件发布
- 虚拟查询结果消费
- 任务状态更新
- 事件驱动架构支持

## 安全考虑

- 输入验证和清理
- 通过 GORM 防止 SQL 注入
- 安全数据库连接
- 通过 Hydra 进行 OAuth2 认证
- 访问控制中间件
- 所有操作的审计日志

## 贡献

1. 遵循现有的代码风格和模式
2. 为新功能添加测试
3. 添加新端点时更新 API 文档
4. 运行 `make swag` 重新生成 Swagger 文档
5. 提交前确保所有测试通过

## 许可证

请查看仓库根目录中的 LICENSE 文件。

## 支持

如有问题和疑问，请联系开发团队或在仓库中创建 issue。
