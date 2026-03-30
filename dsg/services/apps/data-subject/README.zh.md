# 业务对象管理服务

**Language / 语言**: [English](README.md) | [中文](README.zh.md)

一个使用 Go 构建的综合业务对象管理服务，基于 Clean Architecture 原则，提供业务对象（Subject Domain）CRUD 操作、表单-主体关系管理以及 Excel 数据导入导出功能。

## 概述

业务对象管理服务是一个微服务，负责处理业务对象管理、表单-主体关联和数据处理操作。它支持基于 Excel 的数据导入导出、变更数据捕获（CDC）、模板处理，并提供用于创建、更新和删除业务对象及其关系的 RESTful API。

## 功能特性

- **业务对象管理**：
  - 创建、读取、更新和删除业务对象定义
  - 名称唯一性校验
  - 业务逻辑验证

- **表单-主体关系**：
  - 管理表单与业务对象之间的关联
  - 属性映射和字段链接
  - 关系验证

- **Excel 数据处理**：
  - Excel 数据导入/导出
  - 基于模板的处理
  - 基于规则的数据验证
  - 标准模板支持

- **变更数据捕获（CDC）**：
  - 实时数据变更跟踪
  - 基于 Kafka 的事件流
  - 数据库变更通知

- **数据标准化**：
  - 标准信息管理
  - 数据分类和归类
  - 属性分组和组织

- **可观测性**：
  - OpenTelemetry 集成，支持分布式追踪
  - 结构化日志
  - 请求/响应追踪中间件
  - 审计日志支持

- **API 文档**：
  - Swagger/OpenAPI 文档
  - 自动生成的 API 文档

## 技术栈

- **编程语言**: Go 1.19+
- **Web 框架**: Gin
- **数据库**: MySQL/MariaDB, DM8
- **ORM**: GORM
- **消息队列**: Kafka
- **依赖注入**: Google Wire
- **API 文档**: Swagger
- **可观测性**: OpenTelemetry
- **架构**: Clean Architecture

## 项目结构

```
data-subject/
├── adapter/                    # 适配器层
│   ├── driver/                # HTTP 处理器和 REST API (Gin)
│   │   ├── middleware/        # 中间件
│   │   ├── route.go          # 路由配置
│   │   ├── server.go         # 服务器入口
│   │   └── subject_domain/   # 业务对象 API
│   └── driven/               # 外部服务客户端
│       ├── business-grooming/ # 业务梳理服务
│       ├── callbacks/        # 回调处理
│       ├── gorm/            # 数据库访问 (GORM)
│       └── mq/              # 消息队列 (Kafka)
├── cmd/                      # 应用入口点
│   └── server/              # 主服务器应用
│       ├── config/          # 配置文件
│       ├── mock/            # Mock 实现
│       └── main.go          # 主入口
├── common/                   # 共享工具和中间件
│   ├── constant/           # 常量
│   ├── errorcode/          # 错误码
│   ├── form_validator/      # 表单验证
│   ├── initialization/     # 初始化逻辑
│   └── util/               # 工具函数
├── domain/                  # 业务逻辑和领域模型
│   ├── excel_process/      # Excel 处理
│   ├── file_manager/       # 文件管理
│   ├── model/             # 领域模型
│   └── subject_domain/    # 业务对象领域
├── infrastructure/         # 基础设施层
│   ├── config/            # 配置管理
│   └── db/                # 数据库模型
└── migrations/            # 数据库迁移
    ├── dm8/                # DM8 数据库迁移
    └── mariadb/            # MariaDB/MySQL 迁移
```

## 前置要求

- Go 1.19 或更高版本
- MySQL 5.7+ 或 MariaDB 10.3+ 或 DM8 数据库
- Kafka（可选，用于消息队列）
- Make 构建工具

## 快速开始

### 安装

1. 克隆仓库：
```bash
git clone <repository-url>
cd services/apps/data-subject
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

服务使用 Viper 进行配置管理。配置文件应放置在 `cmd/server/config/` 目录中。

主要配置部分：
- **Server**: HTTP 服务器设置（端口、超时等）
- **Database**: 数据库连接设置
- **Telemetry**: OpenTelemetry 配置
- **Logging**: 日志级别和输出设置
- **DepServices**: 外部服务端点

配置示例结构：
```yaml
server:
  name: "data-subject"
  http:
    network: "tcp"
    addr: ":8133"
    timeout: "30s"
  grpc:
    network: "tcp"
    addr: ":8134"
    timeout: "30s"

database:
  dbtype: "mysql"
  host: "${MYSQL_HOST}"
  port: "${MYSQL_PORT}"
  username: "${MYSQL_USERNAME}"
  password: "${MYSQL_PASSWORD}"
  database: "${MYSQL_DB}"
  maxIdleConnections: 10
  maxOpenConnections: 100
```

环境变量：
| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| MYSQL_HOST | 数据库主机地址 | 127.0.0.1 |
| MYSQL_PORT | 数据库端口 | 3306 |
| MYSQL_USERNAME | 数据库用户名 | root |
| MYSQL_PASSWORD | 数据库密码 | 123 |
| MYSQL_DB | 数据库名称 | af_subject |

### 构建

构建服务二进制文件：

```bash
# 使用 Wire 构建
go generate ./...

# 构建二进制文件
go build -o bin/data-subject ./cmd/server

# 为 Linux 构建
GOOS=linux GOARCH=amd64 go build -o bin/data-subject-linux ./cmd/server
```

### 运行

启动服务：

```bash
# 使用 Make 运行
make run

# 或直接运行
go run ./cmd/server/main.go --confPath cmd/server/config/

# 指定地址运行
go run ./cmd/server/main.go --addr :8133
```

服务将在配置的端口上启动（默认：8133）。

### API 端点

所有端点都以 `/api/data-subject/v1` 为前缀：

#### 业务对象管理
- `GET /subject-domains` - 获取业务对象列表
- `POST /subject-domains` - 创建新的业务对象
- `PUT /subject-domains` - 更新现有业务对象
- `DELETE /subject-domains/{did}` - 删除业务对象
- `POST /subject-domains/check` - 检查业务对象名称唯一性

#### 表单-主体关系
- `GET /form-subject-relations` - 获取表单-主体关系
- `POST /form-subject-relations` - 创建表单-主体关系
- `PUT /form-subject-relations` - 更新表单-主体关系
- `DELETE /form-subject-relations/{id}` - 删除表单-主体关系

#### 导入导出
- `POST /import` - 从 Excel 导入数据
- `GET /export` - 导出数据到 Excel

#### 标准信息
- `GET /standard-info` - 获取标准信息
- `POST /standard-info` - 创建标准信息
- `PUT /standard-info` - 更新标准信息

### API 文档

生成 Swagger 文档后，可通过以下地址访问 API 文档：
- Swagger UI: `http://localhost:<port>/swagger/index.html`
- JSON: `http://localhost:<port>/swagger/doc.json`

## 数据库迁移

### DM8 数据库
```bash
# 执行 DM8 迁移脚本
ls migrations/dm8/0.1.0/pre/
```

### MariaDB/MySQL 数据库
```bash
# 执行 MariaDB 迁移脚本
ls migrations/mariadb/0.1.0/pre/
```

## 开发

### 代码生成

```bash
# 生成 Wire 依赖注入
make wire

# 生成 Swagger 文档
make swag

# 生成 gRPC 代码
make protoc
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
  - `subject_domain`: 业务对象领域
  - `excel_process`: Excel 处理领域
  - `file_manager`: 文件管理领域
  - `model`: 领域模型

- **适配器层**：
  - **驱动端**：HTTP 处理器、REST API 端点（Gin）
  - **被驱动端**：外部服务客户端（GORM、Kafka 等）

- **公共层**：共享工具、中间件和配置

## Excel 处理

服务提供全面的 Excel 处理能力：
- 基于模板的数据导入
- 基于规则的验证
- 标准模板支持
- 数据导出功能
- 文件验证和错误处理

## CDC（变更数据捕获）

服务支持变更数据捕获，用于：
- 实时数据库变更通知
- 通过 Kafka 进行事件流
- 跨服务数据同步

## 安全考虑

- 输入验证和清理
- 通过 GORM 防止 SQL 注入
- 安全数据库连接
- 所有操作的审计日志
- 访问控制中间件

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
