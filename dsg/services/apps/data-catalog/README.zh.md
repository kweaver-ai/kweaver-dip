# 数据目录服务

**Language / 语言**: [English](README.md) | [中文](README.zh.md)

一个使用 Go 构建的综合数据目录管理服务，提供数据资源编目、信息系统管理、数据推送能力、数据理解和工作流编排功能，支持多租户。

## 概述

数据目录服务是一个微服务，负责处理数据资源目录管理、信息目录管理、数据推送工作流、数据理解处理、评估管理，并提供用于目录操作、资源管理、数据推送处理和工作流编排的 RESTful API。

## 功能特性

- **数据资源目录管理**：
  - 数据目录创建、管理和跟踪
  - 数据资源注册和组织
  - 目录列管理和元数据
  - 目录挂载资源管理
  - 目录编码序列生成
  - 目录审核流程绑定

- **信息目录与系统管理**：
  - 信息目录创建和管理
  - 信息系统注册和跟踪
  - 系统操作管理
  - 信息资源组织

- **数据推送与工作流**：
  - 数据推送请求管理
  - 推送工作流编排
  - 推送统计和监控
  - 审核流程管理
  - 工作流集成

- **数据理解**：
  - 数据理解模板管理
  - 理解处理和分析
  - 模板规则配置

- **评估与评分**：
  - 数据目录评估管理
  - 目录评分计算和跟踪
  - 评估工作流支持
  - 自动化评估调度

- **分类与树管理**：
  - 分类树结构管理
  - 树节点操作
  - 分类配置
  - 适用范围配置
  - 模块配置

- **数据资产管理**：
  - 数据资产概览和统计
  - 资产计数和跟踪
  - 前端数据资产界面

- **文件资源管理**：
  - 文件资源注册
  - 文件元数据管理
  - 资源组织

- **开放目录**：
  - 开放目录管理
  - 公共目录访问
  - 目录共享能力

- **认知服务集成**：
  - 认知服务系统集成
  - 单目录处理
  - AI 驱动的目录增强

- **统计与分析**：
  - 每日统计收集
  - 表计数同步
  - 目录统计概览
  - 用户目录统计

- **反馈与通信**：
  - 目录反馈管理
  - 资源反馈系统
  - 用户交互跟踪

- **我的收藏**：
  - 用户收藏目录管理
  - 个人目录收藏

- **可观测性**：
  - OpenTelemetry 集成，支持分布式追踪
  - 使用 Zap 的结构化日志
  - 请求/响应追踪中间件
  - 全面的审计日志

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
- **搜索**: 通过基础搜索服务集成 OpenSearch

## 项目结构

```
data-catalog/
├── adapter/              # 适配器层（驱动和被驱动）
│   ├── controller/     # HTTP 处理器和 REST API (Gin)
│   │   ├── data_catalog/ # 数据目录端点
│   │   ├── data_resource/ # 数据资源端点
│   │   ├── info_catalog/ # 信息目录端点
│   │   ├── info_system/ # 信息系统端点
│   │   ├── data_push/   # 数据推送端点
│   │   ├── data_comprehension/ # 数据理解端点
│   │   ├── assessment/  # 评估端点
│   │   ├── audit_process/ # 审核流程端点
│   │   ├── category/    # 分类管理
│   │   ├── tree/        # 树结构管理
│   │   ├── tree_node/   # 树节点操作
│   │   ├── statistics/  # 统计端点
│   │   ├── my_favorite/ # 用户收藏
│   │   ├── open_catalog/ # 开放目录
│   │   └── middleware/  # HTTP 中间件
│   ├── driver/          # 驱动适配器
│   │   ├── http_client/ # HTTP 客户端工具
│   │   └── mq/          # 消息队列处理器
│   └── driven/          # 外部服务客户端和存储
│       ├── gorm/        # 数据库实现
│       ├── basic_search/ # 基础搜索集成
│       ├── configuration_center/ # 配置服务
│       ├── auth/        # 认证服务
│       ├── auth_service/ # 认证服务客户端
│       ├── cognitive_assistant/ # 认知服务
│       └── workflow/    # 工作流集成
├── cmd/                  # 应用入口点
│   └── server/          # 主服务器应用
│       ├── config/      # 配置文件
│       ├── docs/        # Swagger 文档
│       └── cmd.go       # 命令定义
├── common/               # 共享工具和中间件
│   ├── constant/        # 常量
│   ├── errorcode/       # 错误码
│   ├── form_validator/  # 表单验证
│   ├── models/          # 通用模型
│   ├── settings/        # 配置设置
│   └── util/            # 工具函数
├── domain/              # 业务逻辑和领域模型
│   ├── data_catalog/    # 数据目录领域
│   ├── data_resource_catalog/ # 数据资源目录领域
│   ├── info_catalog/    # 信息目录领域
│   ├── info_resource_catalog/ # 信息资源目录
│   ├── data_push/       # 数据推送领域
│   ├── data_comprehension/ # 数据理解领域
│   ├── assessment/      # 评估领域
│   ├── audit_process/   # 审核流程领域
│   ├── category/        # 分类领域
│   ├── tree/            # 树领域
│   ├── tree_node/       # 树节点领域
│   ├── statistics/      # 统计领域
│   ├── my_favorite/     # 我的收藏领域
│   ├── open_catalog/    # 开放目录领域
│   ├── frontend/        # 前端领域逻辑
│   └── common/          # 通用领域工具
├── infrastructure/      # 基础设施层
│   ├── repository/      # 仓库实现
│   │   └── db/          # 数据库模型和迁移
│   └── mq/              # 消息队列实现
└── migrations/          # 数据库迁移
    ├── dm8/             # DM8 数据库迁移
    └── mariadb/         # MariaDB/MySQL 迁移
```

## 前置要求

- Go 1.24+ 或更高版本
- MySQL 服务器（用于数据存储）
- Redis（用于缓存）
- Kafka 或 NSQ（用于消息队列）
- OpenSearch（通过基础搜索服务）
- 配置管理服务

## 快速开始

### 安装

1. 克隆仓库：
```bash
git clone <repository-url>
cd services/apps/data-catalog
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
- **Server**: HTTP 服务器设置（端口、超时等）
- **Database**: MySQL 连接设置
- **Redis**: 缓存设置
- **Message Queue**: Kafka/NSQ 设置
- **Telemetry**: OpenTelemetry 配置
- **Logging**: 日志级别和输出设置
- **DepServices**: 外部服务端点

配置示例结构：
```yaml
server:
  http:
    host: 0.0.0.0:8153

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
  host: "${REDIS_HOST}"
  password: "${REDIS_PASSWORD}"
  database: ${REDIS_DB}

mq:
  connConfs:
    - mqType: kafka
      host: "${KAFKA_MQ_HOST}"
      auth:
        username: "${KAFKA_MQ_USENAME}"
        password: "${KAFKA_MQ_PASSWORD}"
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
| KAFKA_MQ_HOST | Kafka 代理地址 | - |
| KAFKA_MQ_USENAME | Kafka 用户名 | - |
| KAFKA_MQ_PASSWORD | Kafka 密码 | - |
| CONFIGURATION_CENTER_HOST | 配置中心服务主机 | - |
| BASIC_SEARCH_HOST | 基础搜索服务主机 | - |

### 构建

构建服务二进制文件：

```bash
# 为当前平台构建
make build

# 为 Linux 构建
make build-linux

# 或直接构建
go build -o bin/data-catalog-server ./cmd/server
```

二进制文件将生成在 `bin/` 目录中，名为 `data-catalog-server`。

### 运行

启动服务：

```bash
# 使用 Make 运行（构建并启动）
make start-dev

# 或使用现有二进制文件启动
make start

# 或直接运行
go run ./cmd/server server --conf cmd/server/config/config.yaml --addr :8153
```

服务将在配置的端口上启动（默认：8153）。

### API 端点

服务为各种功能提供 RESTful API。关键端点类别包括：

#### 数据目录管理
- 数据目录 CRUD 操作
- 目录列管理
- 目录挂载资源操作
- 目录审核流程管理
- 目录编码序列生成

#### 数据资源管理
- 数据资源注册和管理
- 资源目录操作
- 资源元数据管理

#### 信息目录与系统
- 信息目录操作
- 信息系统管理
- 系统操作跟踪

#### 数据推送
- 数据推送请求管理
- 推送工作流编排
- 推送统计和监控

#### 数据理解
- 理解模板管理
- 模板规则配置
- 理解处理

#### 评估与评分
- 评估管理
- 目录评分计算
- 自动化评估调度

#### 分类与树
- 分类树管理
- 树节点操作
- 分类配置

#### 统计
- 每日统计收集
- 表计数同步
- 目录统计概览

### API 文档

生成 Swagger 文档后，可通过以下地址访问 API 文档：
- Swagger UI: `http://localhost:8153/swagger/index.html`
- JSON: `http://localhost:8153/swagger/doc.json`

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

### 数据库迁移

```bash
# 设置迁移环境变量
export MYSQL_HOST=localhost
export MYSQL_PORT=3306
export MYSQL_USERNAME=root
export MYSQL_PASSWORD=password
export MYSQL_DB=data_catalog

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
  - 数据目录管理、资源组织
  - 信息目录和系统管理
  - 数据推送工作流编排
  - 评估和评分逻辑
  - 分类和树管理

- **适配器层**：
  - **控制器**：HTTP 处理器、REST API 端点（Gin）
  - **被驱动端**：数据库实现、外部服务客户端

- **公共层**：共享工具、中间件和配置

## 数据目录功能

服务提供全面的数据目录能力：
- 多级目录组织
- 目录编码序列生成
- 目录审核工作流集成
- 目录挂载资源管理
- 目录列元数据管理
- 目录统计和分析
- 与 OpenSearch 的目录搜索集成

## 消息队列集成

服务与 Kafka 和 NSQ 集成，用于：
- 异步目录操作
- 事件驱动架构
- 目录变更通知
- 工作流事件处理
- 可靠的消息传递

## 搜索集成

服务与基础搜索服务（OpenSearch）集成，用于：
- 目录搜索能力
- 全文搜索支持
- 搜索结果高亮
- 目录索引和更新

## 工作流集成

服务与工作流系统集成，用于：
- 数据推送工作流编排
- 审核流程管理
- 评估工作流支持
- 自动化任务调度

## 安全考虑

- 输入验证和清理
- 通过 GORM 防止 SQL 注入
- 安全数据库连接
- 通过 Hydra 进行 OAuth2 认证
- 访问控制中间件
- 所有操作的审计日志

## 监控与可观测性

- OpenTelemetry 用于分布式追踪
- 带关联 ID 的结构化日志
- 性能指标收集
- 健康检查端点
- 关键操作的审计跟踪
- 每日统计收集
- 自动化任务调度

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
