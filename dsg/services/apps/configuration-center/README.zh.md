# 配置中心服务

**Language / 语言**: [English](README.md) | [中文](README.zh.md)

一个使用 Go 构建的综合配置管理服务，提供系统配置、用户管理、角色权限管理、菜单管理、字典管理、数据源管理和工作流编排功能，支持多租户。

## 概述

配置中心服务是一个微服务，负责处理系统级配置管理、用户和角色管理、权限控制、菜单配置、字典管理、数据源配置、工作流配置，并提供用于配置操作、用户管理、角色权限管理和系统管理的 RESTful API。

## 功能特性

- **系统配置管理**：
  - 配置键值管理
  - 第三方服务地址配置
  - 项目提供者配置
  - 业务域级别配置
  - 数据使用类型配置
  - 时间戳黑名单管理
  - 政务数据共享配置

- **用户管理**：
  - 用户创建、管理和跟踪
  - 用户档案管理
  - 用户角色分配
  - 用户权限管理
  - 用户组管理
  - 用户认证和授权

- **角色与权限管理**：
  - 角色创建和管理
  - 角色组管理
  - 权限定义和分配
  - 角色-权限绑定
  - 用户-角色绑定
  - 基于范围的访问控制
  - 角色图标管理

- **菜单管理**：
  - 菜单结构配置
  - 菜单 API 绑定
  - 菜单权限控制
  - 动态菜单生成

- **字典管理**：
  - 字典定义和管理
  - 字典项管理
  - 字典验证
  - 多级字典支持

- **数据源管理**：
  - 数据源注册和配置
  - 数据源连接管理
  - 数据源类型支持
  - 连接池管理

- **工作流配置**：
  - 流程图配置和管理
  - 流程图节点配置
  - 流程图版本管理
  - 工作流编排

- **代码生成规则**：
  - 代码生成规则定义
  - 规则模板管理
  - 代码序列生成
  - 自定义代码格式支持

- **业务结构管理**：
  - 业务结构定义
  - 业务事项管理
  - 对象主业务配置
  - 业务域配置

- **信息系统管理**：
  - 信息系统注册
  - 系统配置管理
  - 系统集成支持

- **数据管理**：
  - 数据等级分类
  - 数据脱敏配置
  - 数据安全策略

- **审核与合规**：
  - 审核策略管理
  - 审核流程绑定
  - 审核工作流配置

- **应用管理**：
  - 应用注册和管理
  - 应用配置
  - 应用生命周期管理

- **前端配置**：
  - 前置机配置
  - 轮播图管理
  - 新闻策略管理
  - SMS 配置

- **通讯录**：
  - 联系人管理
  - 组织结构
  - 用户目录

- **告警管理**：
  - 告警规则配置
  - 告警策略管理
  - 通知设置

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
- **协议缓冲区**: gRPC 支持

## 项目结构

```
configuration-center/
├── adapter/              # 适配器层（驱动和被驱动）
│   ├── driver/          # HTTP 处理器和 REST API (Gin)
│   │   ├── user/        # 用户管理端点
│   │   ├── role/        # 角色管理端点
│   │   ├── permission/  # 权限管理端点
│   │   ├── menu/        # 菜单管理端点
│   │   ├── dict/        # 字典管理端点
│   │   ├── datasource/  # 数据源管理端点
│   │   ├── configuration/ # 配置管理端点
│   │   ├── flowchart/   # 工作流配置端点
│   │   ├── code_generation_rule/ # 代码生成规则端点
│   │   ├── business_structure/ # 业务结构端点
│   │   ├── info_system/ # 信息系统端点
│   │   ├── data_grade/  # 数据等级端点
│   │   ├── data_masking/ # 数据脱敏端点
│   │   ├── apps/        # 应用管理端点
│   │   ├── firm/        # 企业/机构管理端点
│   │   ├── front_end_processor/ # 前置机端点
│   │   ├── carousels/   # 轮播图管理端点
│   │   ├── news_policy/ # 新闻策略端点
│   │   ├── audit_policy/ # 审核策略端点
│   │   ├── address_book/ # 通讯录端点
│   │   ├── alarm_rule/  # 告警规则端点
│   │   └── middleware/ # HTTP 中间件
│   └── driven/          # 外部服务客户端和存储
│       ├── gorm/        # 数据库实现
│       ├── mq/          # 消息队列处理器
│       ├── rest/        # REST 客户端实现
│       ├── thrift/      # Thrift 客户端实现
│       ├── workflow/    # 工作流集成
│       └── callbacks/   # 回调处理器
├── cmd/                  # 应用入口点
│   └── server/          # 主服务器应用
│       ├── config/      # 配置文件
│       ├── docs/        # Swagger 文档
│       ├── static/      # 静态文件
│       ├── app.go      # 应用初始化
│       ├── cdc.go      # 变更数据捕获
│       └── main.go     # 主入口点
├── common/               # 共享工具和中间件
│   ├── constant/        # 常量
│   ├── errorcode/       # 错误码
│   ├── form_validator/  # 表单验证
│   ├── models/          # 通用模型
│   ├── settings/        # 配置设置
│   ├── trace_util/      # 追踪工具
│   ├── user_util/       # 用户工具
│   └── util/            # 工具函数
├── domain/              # 业务逻辑和领域模型
│   ├── user/            # 用户领域
│   ├── role/            # 角色领域
│   ├── role_v2/         # 角色 v2 领域
│   ├── role_group/      # 角色组领域
│   ├── permission/      # 权限领域
│   ├── permissions/     # 权限领域
│   ├── menu/            # 菜单领域
│   ├── menu_api/        # 菜单 API 领域
│   ├── dict/            # 字典领域
│   ├── datasource/      # 数据源领域
│   ├── configuration/   # 配置领域
│   ├── flowchart/       # 流程图领域
│   ├── code_generation_rule/ # 代码生成规则领域
│   ├── business_structure/ # 业务结构领域
│   ├── business_matters/ # 业务事项领域
│   ├── info_system/     # 信息系统领域
│   ├── data_grade/      # 数据等级领域
│   ├── data_masking/    # 数据脱敏领域
│   ├── apps/            # 应用领域
│   ├── firm/            # 企业领域
│   ├── front_end_processor/ # 前置机领域
│   ├── carousels/       # 轮播图领域
│   ├── news_policy/     # 新闻策略领域
│   ├── audit_policy/    # 审核策略领域
│   ├── audit_process_bind/ # 审核流程绑定领域
│   ├── address_book/    # 通讯录领域
│   ├── object_main_business/ # 对象主业务领域
│   ├── alarm_rule/      # 告警规则领域
│   ├── register/        # 注册领域
│   ├── sms_conf/        # SMS 配置领域
│   ├── tool/            # 工具领域
│   └── common/          # 通用领域工具
├── infrastructure/      # 基础设施层
│   ├── conf/            # 配置定义
│   ├── repository/      # 仓库实现
│   └── mq/              # 消息队列实现
├── interface/           # 接口定义
│   └── conf/            # 配置接口
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

## 快速开始

### 安装

1. 克隆仓库：
```bash
git clone <repository-url>
cd services/apps/configuration-center
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

# 生成 Protocol Buffers 代码
make protoc
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
    addr: 0.0.0.0:8133
    timeout: 1s
  grpc:
    addr: 0.0.0.0:9000
    timeout: 1s

data:
  database:
    driver: mysql
    source: "${DB_USERNAME}:${DB_PASSWORD}@tcp(${DB_HOST}:${DB_PORT})/${DB_NAME}?charset=utf8mb4&parseTime=True&loc=Local"
  redis:
    addr: "${REDIS_HOST}"
    password: "${REDIS_PASSWORD}"

config:
  oauth:
    oauthClientID: "${OAUTH_CLIENT_ID}"
    oauthClientSecret: "${OAUTH_CLIENT_SECRET}"
    oauthAdminHost: hydra-admin
    oauthAdminPort: 4445
  kafkaMQ:
    host: "${KAFKA_MQ_HOST}"
    clientID: "af.configuration-center"
    groupID: "af.configuration-center"
    sasl:
      enabled: true
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
go build -o bin/cc ./cmd/server
```

二进制文件将生成在 `bin/` 目录中，名为 `cc`。

### 运行

启动服务：

```bash
# 使用 Make 运行（构建并启动）
make start-dev

# 或使用现有二进制文件启动
make start

# 或直接运行
go run ./cmd/server/main.go --confPath cmd/server/config/ --addr :8133
```

服务将在配置的端口上启动（默认：8133）。

### API 端点

服务为各种功能提供 RESTful API。关键端点类别包括：

#### 配置管理
- 配置键值操作
- 第三方服务地址配置
- 项目提供者配置
- 业务域级别管理
- 数据使用类型配置

#### 用户管理
- 用户 CRUD 操作
- 用户档案管理
- 用户角色分配
- 用户权限管理

#### 角色与权限管理
- 角色 CRUD 操作
- 角色组管理
- 权限定义和分配
- 角色-权限绑定
- 用户-角色绑定

#### 菜单管理
- 菜单结构配置
- 菜单 API 绑定
- 菜单权限控制

#### 字典管理
- 字典 CRUD 操作
- 字典项管理
- 字典验证

#### 数据源管理
- 数据源注册和配置
- 数据源连接管理
- 连接池管理

#### 工作流配置
- 流程图配置和管理
- 流程图节点配置
- 流程图版本管理

#### 代码生成规则
- 代码生成规则定义
- 规则模板管理
- 代码序列生成

### API 文档

生成 Swagger 文档后，可通过以下地址访问 API 文档：
- Swagger UI: `http://localhost:8133/swagger/index.html`
- JSON: `http://localhost:8133/swagger/doc.json`

## 开发

### 代码生成

```bash
# 生成 Wire 依赖注入
make wire

# 生成 Swagger 文档
make swag

# 生成 Protocol Buffers 代码
make protoc

# 生成 GORM 模型
make model dsn="mysql://user:pass@tcp(host:port)/db" out_dao=true
```

### 数据库迁移

```bash
# 设置迁移环境变量
export MYSQL_HOST=localhost
export MYSQL_PORT=3306
export MYSQL_USERNAME=root
export MYSQL_PASSWORD=password
export MYSQL_DB=configuration_center

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
  - 用户管理、角色权限管理
  - 配置管理、菜单管理
  - 字典管理、数据源管理
  - 工作流配置、代码生成规则

- **适配器层**：
  - **驱动端**：HTTP 处理器、REST API 端点（Gin）
  - **被驱动端**：数据库实现、外部服务客户端

- **公共层**：共享工具、中间件和配置

## 配置管理功能

服务提供全面的配置管理能力：
- 键值配置存储
- 第三方服务地址管理
- 项目提供者配置
- 业务域级别配置
- 数据使用类型配置
- 时间戳黑名单管理
- 政务数据共享配置

## 用户与角色管理

服务提供全面的用户和角色管理：
- 多租户用户管理
- 基于角色的访问控制（RBAC）
- 权限定义和分配
- 角色组管理
- 基于范围的访问控制
- 用户-角色绑定管理

## 消息队列集成

服务与 Kafka 和 NSQ 集成，用于：
- 异步配置更新
- 事件驱动架构
- 配置变更通知
- 可靠的消息传递

## 变更数据捕获（CDC）

服务支持变更数据捕获，用于：
- 实时数据库变更跟踪
- 事件流
- 数据同步

## 安全考虑

- 通过 Hydra 进行 OAuth2 认证
- 基于角色的访问控制（RBAC）
- 基于权限的授权
- 输入验证和清理
- 通过 GORM 防止 SQL 注入
- 安全数据库连接
- 所有操作的审计日志

## 监控与可观测性

- OpenTelemetry 用于分布式追踪
- 带关联 ID 的结构化日志
- 性能指标收集
- 健康检查端点
- 关键操作的审计跟踪
- 变更数据捕获监控

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
