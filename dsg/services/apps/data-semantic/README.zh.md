# data-semantic

> 库表数据语义理解和 AI 驱动的业务对象识别微服务

[![Go 版本](https://img.shields.io/badge/Go-1.24+-00ADD8?style=flat&logo=go)](https://golang.org)
[![框架](https://img.shields.io/badge/框架-Go--Zero-blue)](https://go-zero.dev)
[![许可证](https://img.shields.io/badge/许可证-MIT-green.svg)](LICENSE)

## 概述

`data-semantic` 是基于 Go-Zero 框架的微服务，提供库表数据的智能语义理解功能。通过 AI 驱动的分析，自动从表结构中识别业务对象，支持用户编辑和确认，并保持版本控制。

### 核心特性

- **AI 驱动的语义分析**：自动分析库表和字段的业务语义
- **业务对象识别**：将相关字段分组为业务对象
- **版本控制**：支持重新识别，保留历史版本
- **异步处理**：基于 Kafka 消息队列的 AI 分析
- **用户编辑**：完整支持手动编辑和修正 AI 结果
- **5 状态工作流**：未理解 → 理解中 → 待确认 → 已完成 → 已发布

## 架构

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   HTTP API  │ ──── │   Kafka      │ ──── │  AI 服务    │
│   (Go-Zero) │      │  消息队列    │      │             │
└─────────────┘      └──────────────┘      └─────────────┘
       │                     │
       ▼                     ▼
┌─────────────┐      ┌──────────────┐
│  MySQL 8.0  │      │   Redis 7.0  │
│             │      │   (限流)      │
└─────────────┘      └──────────────┘
```

## 技术栈

| 组件 | 技术 | 版本 |
|------|------|------|
| 语言 | Go | 1.24+ |
| 框架 | Go-Zero | v1.9+ |
| 数据库 | MySQL | 8.0 |
| 缓存 | Redis | 7.0 |
| 消息队列 | Kafka | 3.0 |
| ORM | SQLx / GORM | - |

### 核心依赖

- `github.com/zeromicro/go-zero` - 微服务框架
- `github.com/IBM/sarama` - Kafka 客户端
- `github.com/jmoiron/sqlx` - SQL 扩展
- `github.com/jinguoxing/idrm-go-base` - 通用工具库
- `github.com/stretchr/testify` - 测试框架
- `github.com/google/uuid` - UUID v7 生成

## 项目结构

```
data-semantic/
├── api/                      # API 服务层
│   ├── doc/                  # API 定义和文档
│   ├── etc/                  # 配置文件
│   └── internal/             # 内部实现
│       ├── handler/          # 请求处理器（参数校验）
│       ├── logic/            # 业务逻辑
│       ├── middleware/       # 中间件
│       └── types/            # 类型定义
├── consumer/                 # Kafka 消费者
├── model/                    # 数据模型 (SQLx)
├── migrations/               # 数据库迁移 (mariadb/dm8)
├── deploy/                   # 部署配置 (Docker/K8s)
├── specs/                    # SDD 规格文档
├── .specify/                 # Spec Kit 配置
├── Makefile                  # 构建命令
└── go.mod                    # Go 模块定义
```

## 快速开始

### 前置要求

- Go 1.24 或更高版本
- MySQL 8.0
- Redis 7.0
- Kafka 3.0
- Docker（可选，用于部署）

### 安装

```bash
# 克隆仓库
git clone https://github.com/tianyuliang/data-semantic.git
cd data-semantic

# 安装依赖
go mod download
```

### 配置

编辑 `api/etc/api.yaml`：

```yaml
Name: data-semantic
Host: 0.0.0.0
Port: 8888

# 数据库配置
DB:
  Host: localhost
  Port: 3306
  DBName: af_main
  Username: root
  Password: your_password

# Redis 配置
Redis:
  Host: localhost
  Port: 6379
  Type: node
  Pass: ""

# Kafka 配置
Kafka:
  Hosts:
    - localhost:9092
  GroupId: data-understanding-consumer-group

# JWT 认证
Auth:
  AccessSecret: your_secret_key
  AccessExpire: 7200
```

### 运行服务

```bash
# 运行 API 服务
go run api/api.go

# 或使用 Makefile
make run
```

服务将在 `http://localhost:8888` 上运行

## API 文档

### 基础 URL

```
/api/v1/data-semantic
```

### 认证

所有端点都需要 JWT Bearer Token 认证：

```
Authorization: Bearer <your-jwt-token>
```

### 接口列表

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/:id/status` | 查询库表理解状态 |
| POST | `/:id/generate` | 一键生成理解数据 |
| GET | `/:id/fields` | 查询字段语义补全数据 |
| PUT | `/:id/semantic-info` | 保存库表信息补全数据 |
| GET | `/:id/business-objects` | 查询业务对象识别结果 |
| PUT | `/:id/business-objects` | 保存业务对象及属性 |
| PUT | `/:id/business-objects/attributes/move` | 调整属性归属业务对象 |
| POST | `/:id/business-objects/regenerate` | 重新识别业务对象 |
| POST | `/:id/submit` | 提交确认理解数据 |
| DELETE | `/:id/business-objects` | 删除识别结果 |

### 理解状态

| 状态 | 值 | 描述 |
|------|-----|------|
| 未理解 | 0 | 初始状态 |
| 理解中 | 1 | AI 处理中 |
| 待确认 | 2 | 等待用户审核 |
| 已完成 | 3 | 已确认并发布 |
| 已发布 | 4 | 完全发布 |

### 示例：一键生成理解数据

```bash
curl -X POST http://localhost:8888/api/v1/data-semantic/{id}/generate \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"
```

响应：
```json
{
  "understand_status": 1
}
```

### Swagger 文档

交互式 API 文档：

- **JSON**: [api/doc/swagger/swagger.json](api/doc/swagger/swagger.json)
- **Markdown**: [api/doc/API.md](api/doc/API.md)

使用 [Swagger UI](https://petstore.swagger.io/) 导入 swagger.json 文件。

## 开发

### 代码生成

```bash
# 从 .api 定义生成 API 代码
make api

# 生成 Swagger 文档
make swagger

# 同时生成两者
make gen
```

### 测试

```bash
# 运行所有测试
make test

# 运行测试并查看覆盖率
go test -cover ./...

# 运行特定测试
go test -v ./api/internal/logic/data_semantic/...
```

### 代码检查

```bash
# 格式化代码
make fmt

# 运行代码检查
make lint
```

### 构建

```bash
# 构建二进制文件
make build

# 输出: bin/data-semantic
```

## 部署

### Docker

```bash
# 构建 Docker 镜像
make docker-build

# 运行容器
make docker-run

# 停止容器
make docker-stop
```

### Kubernetes

```bash
# 部署到开发环境
make k8s-deploy-dev

# 部署到生产环境
make k8s-deploy-prod

# 查看状态
make k8s-status
```

## 开发工作流

本项目遵循 **规范驱动开发（SDD）** 方法论：

```
1. Context   → 阅读 .specify/memory/constitution.md
2. Specify   → 创建 specs/{feature}/spec.md (EARS 格式)
3. Design    → 创建 specs/{feature}/plan.md
4. Tasks     → 创建 specs/{feature}/tasks.md
5. Implement → 编码、测试、验证
```

### Spec Kit 命令

```
/speckit.start <功能描述>     # 启动 SDD 工作流
/speckit.specify <功能描述>   # 创建规格文档
/speckit.plan                # 查看技术方案
/speckit.tasks               # 查看任务列表
/speckit.implement           # 开始实现
/speckit.constitution        # 查看项目宪法
```

## 编码规范

### 分层架构

```
HTTP 请求 → Handler → Logic → Model → 数据库
     ↓        ↓        ↓       ↓         ↓
  参数校验  业务逻辑  数据访问  MySQL
  响应格式  事务管理
```

### 职责划分

| 层 | 最大行数 | 职责 |
|----|----------|------|
| Handler | 30 | 参数绑定、校验、响应格式化 |
| Logic | 50 | 业务逻辑、事务管理 |
| Model | 50 | 数据访问 (SQLx/GORM) |

### 命名规范

- 文件: `snake_case.go`
- 包名: `lowercase`
- 结构体: `PascalCase`
- 方法: `PascalCase`
- 变量: `camelCase`
- 常量: `UPPER_SNAKE_CASE`

### 错误处理

```go
import "github.com/jinguoxing/idrm-go-base/errorx"

// 使用预定义错误码
if user == nil {
    return nil, errorx.NewWithCode(errorx.ErrCodeNotFound)
}
```

## 文档

- [CLAUDE.md](CLAUDE.md) - 项目开发指南
- [specs/](specs/) - SDD 规格文档
- [.specify/memory/constitution.md](.specify/memory/constitution.md) - 项目宪法

## 许可证

本项目采用 MIT 许可证。

## 贡献

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request
