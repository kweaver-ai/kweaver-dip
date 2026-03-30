# 任务中心服务

**Language / 语言**: [English](README.md) | [中文](README.zh.md)

一个使用 Go 构建的综合任务管理和工作流编排服务，提供项目管理、任务跟踪、工单管理和数据处理能力，支持多租户。

## 概述

任务中心服务是一个微服务，负责处理任务管理、项目编排、工单工作流和数据处理管道。它支持多项目管理、任务生命周期跟踪、工单模板、数据质量监控，并提供用于项目管理、任务操作、工单处理和数据管道编排的 RESTful API。

## 功能特性

- **项目与任务管理**：
  - 项目创建、管理和跟踪
  - 任务生命周期管理（创建、分配、跟踪、完成）
  - 项目成员管理和权限控制
  - 任务依赖关系和工作流编排

- **工单系统**：
  - 工单创建和管理
  - 工单模板用于标准化流程
  - 工单任务分解和分配
  - 工单跟踪和状态监控
  - 工单告警和通知系统

- **数据处理管道**：
  - 数据聚合清单管理
  - 数据聚合计划与执行
  - 数据理解计划
  - 数据处理概览和监控
  - 数据处理计划编排
  - 数据质量评估和监控
  - 数据研究报告生成

- **对象存储管理**：
  - OSS 存储桶管理
  - 文件上传、下载和组织
  - 存储配额和权限管理

- **用户与租户管理**：
  - 多租户应用支持
  - 用户档案和权限管理
  - 基于角色的访问控制
  - 租户隔离和管理

- **通知与通信**：
  - 实时通知系统
  - 邮件和应用内通知
  - 通知模板和自定义
  - 操作日志跟踪和审计

- **数据库与分析**：
  - 数据库沙盒环境
  - 关联数据管理和查询
  - 积分管理和评分系统
  - 分析和报告

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

- **编程语言**: Go 1.24.0
- **Web 框架**: Gin
- **ORM**: GORM with MySQL driver
- **消息队列**: Kafka (通过 Sarama)
- **依赖注入**: Google Wire
- **API 文档**: Swagger
- **可观测性**: OpenTelemetry
- **日志**: Zap
- **配置管理**: Viper
- **数据库**: MySQL with migration support
- **多租户**: 租户隔离和管理

## 项目结构

```
task_center/
├── adapter/              # 适配器层（驱动和被驱动）
│   ├── driver/          # HTTP 处理器和 REST API (Gin)
│   │   ├── tc_task/     # 任务管理端点
│   │   ├── tc_project/  # 项目管理端点
│   │   ├── tc_oss/      # 对象存储端点
│   │   ├── work_order/ # 工单管理
│   │   ├── work_order_template/ # 工单模板
│   │   ├── work_order_task/ # 工单任务
│   │   ├── user/        # 用户管理端点
│   │   ├── data_aggregation_inventory/ # 数据聚合
│   │   ├── data_aggregation_plan/ # 数据聚合计划
│   │   ├── data_comprehension_plan/ # 数据理解
│   │   ├── data_processing_overview/ # 处理概览
│   │   ├── data_processing_plan/ # 处理计划
│   │   ├── data_quality/ # 数据质量监控
│   │   ├── data_research_report/ # 研究报告
│   │   ├── db_sandbox/  # 数据库沙盒
│   │   ├── notification/ # 通知系统
│   │   ├── operation_log/ # 操作日志
│   │   ├── points_management/ # 积分系统
│   │   ├── relation_data/ # 关联数据管理
│   │   ├── tenant_application/ # 租户应用
│   │   └── middleware/ # HTTP 中间件
│   └── driven/          # 外部服务客户端和存储
│       ├── gorm/         # 数据库实现
│       ├── business_grooming/ # 业务逻辑适配器
│       ├── configuration_center/ # 配置服务
│       ├── data_catalog/ # 数据目录集成
│       ├── data_exploration/ # 数据探索工具
│       └── data_view/    # 数据视图组件
├── cmd/                  # 应用入口点
│   └── server/           # 主服务器应用
├── common/               # 共享工具和中间件
│   ├── constant/         # 常量
│   ├── errorcode/        # 错误码
│   ├── initialization/   # 初始化逻辑
│   ├── settings/         # 配置设置
│   └── utils/            # 工具函数
├── controller/           # 业务逻辑控制器
├── domain/              # 业务逻辑和领域模型
│   ├── tc_task/          # 任务领域模型
│   ├── tc_project/       # 项目领域模型
│   ├── tc_oss/           # OSS 领域模型
│   ├── work_order/       # 工单领域模型
│   ├── work_order_template/ # 工单模板模型
│   ├── work_order_task/  # 工单任务模型
│   ├── user/             # 用户领域模型
│   ├── data_*/           # 数据处理领域模型
│   ├── notification/    # 通知领域模型
│   ├── operation_log/    # 操作日志模型
│   ├── points_management/ # 积分管理模型
│   └── relation_data/    # 关联数据模型
├── infrastructure/      # 基础设施层
│   ├── database/        # 数据库配置
│   └── message_queue/   # 消息队列设置
└── interface/          # 接口定义
```

## 前置要求

- Go 1.24.0 或更高版本
- MySQL 服务器（用于数据存储）
- Kafka（可选，用于消息队列）
- Redis（可选，用于缓存）
- 配置管理服务

## 快速开始

### 安装

1. 克隆仓库：
```bash
git clone <repository-url>
cd services/apps/task_center
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
- **Kafka**: 消息队列设置（可选）
- **Redis**: 缓存设置（可选）
- **Telemetry**: OpenTelemetry 配置
- **Logging**: 日志级别和输出设置
- **Multi-tenancy**: 租户管理设置

配置示例结构：
```yaml
server:
  port: 8080
  timeout: 30s

database:
  host: localhost
  port: 3306
  username: user
  password: password
  dbname: task_center

kafka:
  brokers:
    - localhost:9092
  topic: task_center

redis:
  addr: localhost:6379
  password: ""
  db: 0

telemetry:
  endpoint: localhost:4317
  service_name: task_center
```

### 构建

构建服务二进制文件：

```bash
# 为当前平台构建
go build -o bin/task-center ./cmd/server

# 为 Linux 构建
GOOS=linux GOARCH=amd64 go build -o bin/task-center-linux ./cmd/server
```

二进制文件将生成在 `bin/` 目录中，名为 `task-center`。

### 运行

启动服务：

```bash
# 直接运行
./bin/task-center --confPath cmd/server/config/

# 或使用 Go
go run cmd/server/main.go --confPath cmd/server/config/
```

服务将在配置的端口上启动（默认：8080）。

### API 端点

服务为各种功能提供 RESTful API。关键端点类别包括：

#### 项目管理
- 项目 CRUD 操作
- 项目成员管理
- 项目分析和报告

#### 任务管理
- 任务创建、分配和跟踪
- 任务工作流编排
- 任务依赖管理

#### 工单系统
- 工单创建和管理
- 工单模板操作
- 工单任务分解

#### 数据处理
- 数据聚合操作
- 数据质量监控
- 数据处理管道管理

#### 用户与租户管理
- 用户档案管理
- 租户应用管理
- 基于角色的访问控制

### API 文档

生成 Swagger 文档后，可通过以下地址访问 API 文档：
- Swagger UI: `http://localhost:<port>/swagger/index.html`
- JSON: `http://localhost:<port>/swagger/doc.json`

## 开发

### 代码生成

```bash
# 生成 Wire 依赖注入
make wire

# 生成 Swagger 文档
make swag
```

### 数据库迁移

```bash
# 运行数据库迁移
migrate -path migrations -database "mysql://user:password@tcp(host:3306)/task_center" up

# 回滚迁移
migrate -path migrations -database "mysql://user:password@tcp(host:3306)/task_center" down
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
  - 任务管理、项目编排、工单处理
  - 数据管道管理、质量监控
  - 用户和租户管理

- **适配器层**：
  - **驱动端**：HTTP 处理器、REST API 端点（Gin）
  - **被驱动端**：数据库实现、外部服务客户端

- **公共层**：共享工具、中间件和配置

## 多租户

服务支持多租户，具有：
- 数据库级别的租户隔离
- 租户特定的配置和权限
- 租户感知的路由和资源管理
- 租户范围的数据访问控制

## 数据管理

- MySQL 数据库用于持久化存储
- GORM 用于 ORM 和数据库操作
- 数据库迁移支持
- 事务管理
- 连接池

## 消息队列集成

- Kafka 集成用于异步处理
- 工作流的事件驱动架构
- 消息发布和消费
- 可靠的消息传递

## 安全

- 基于角色的访问控制（RBAC）
- 租户隔离和安全
- 安全的 API 端点
- 输入验证和清理
- 合规性审计日志

## 监控与可观测性

- OpenTelemetry 用于分布式追踪
- 带关联 ID 的结构化日志
- 性能指标收集
- 健康检查端点
- 关键操作的审计跟踪

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
