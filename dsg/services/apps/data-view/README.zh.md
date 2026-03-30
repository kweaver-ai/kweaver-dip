# Data-View - 数据视图服务

[![Go Version](https://img.shields.io/badge/Go-1.22+-00ADD8?style=flat&logo=go)](https://golang.org)
[![Gin](https://img.shields.io/badge/Gin-Web%20Framework-green)](https://gin-gonic.com)
[![GORM](https://img.shields.io/badge/GORM-ORM-blue)](https://gorm.io)
[![Wire](https://img.shields.io/badge/Wire-Dependency%20Injection-orange)](https://github.com/google/wire)

**Language / 语言**: [English](README.md) | [中文](README.zh.md)

一个企业级数据视图管理微服务，采用DDD（领域驱动设计）架构，为iDRM生态系统提供统一的数据视图管理、数据血缘、数据分级、数据脱敏等核心能力。

## 目录

- [项目概述](#项目概述)
- [功能特性](#功能特性)
- [技术栈](#技术栈)
- [项目结构](#项目结构)
- [快速开始](#快速开始)
- [环境配置](#环境配置)
- [API文档](#api文档)
- [开发指南](#开发指南)
- [部署指南](#部署指南)
- [架构设计](#架构设计)
- [安全考虑](#安全考虑)
- [贡献](#贡献)

## 项目概述

Data-View是一个功能完善的企业级数据视图管理服务，提供元数据视图管理、逻辑视图管理、数据血缘分析、数据分级管理、数据脱敏、数据探查、数据集管理和图谱模型等核心功能。

服务采用DDD（领域驱动设计）架构，具有良好的可扩展性和可维护性，支持多种数据库和消息队列，为企业提供统一的数据视图管理解决方案。

## 功能特性

### 核心功能模块

#### 1. 元数据视图（Form View）
- 元数据视图的创建、编辑、删除
- 视图字段管理
- 视图过滤规则配置
- 数据预览功能
- Excel视图支持
- 白名单策略管理
- 脱敏规则管理
- 视图发布和批量发布

#### 2. 逻辑视图（Logic View）
- 自定义视图创建和管理
- 逻辑实体视图管理
- 视图审核流程
- 视图草稿管理
- 合成数据和样例数据生成
- 视图授权管理

#### 3. 数据血缘（Data Lineage）
- 数据血缘关系查询
- 血缘关系可视化
- 血缘数据解析

#### 4. 数据隐私策略（Data Privacy Policy）
- 隐私策略创建和管理
- 策略与视图关联
- 脱敏数据查询

#### 5. 识别算法（Recognition Algorithm）
- 识别算法管理
- 算法启动和停止
- 算法导出
- 内置类型管理

#### 6. 分类规则（Classification Rule）
- 分类规则创建和管理
- 规则启动和停止
- 规则统计
- 规则导出

#### 7. 分级规则（Grade Rule）
- 分级规则创建和管理
- 规则分组管理
- 规则启动和停止
- 规则统计和导出
- 批量删除

#### 8. 数据集（Data Set）
- 数据集创建和管理
- 视图与数据集关联
- 数据集视图树结构

#### 9. 图谱模型（Graph Model）
- 图谱模型创建和管理
- 模型画布保存和查询
- 主题模型密级设置
- 标签推荐配置

#### 10. 探查规则（Explore Rule）
- 探查规则创建和管理
- 模板规则管理
- 规则启用状态管理
- 内置规则查询

#### 11. 探查任务（Explore Task）
- 探查任务创建和管理
- 任务取消和删除
- 探查报告查询

#### 12. 子视图（Sub View）
- 子视图创建和管理
- 行列规则配置

## 技术栈

| 类型 | 技术 |
|------|------|
| 语言 | Go 1.22+ |
| Web框架 | Gin |
| ORM | GORM |
| 依赖注入 | Wire |
| API文档 | Swagger |
| 消息队列 | Kafka / NSQ |
| 缓存 | Redis |
| 数据库 | MySQL / MariaDB / DM8 |
| 链路追踪 | OpenTelemetry |
| 日志 | Zap |

## 项目结构

```
data-view/
├── cmd/                          # 应用程序入口
│   ├── server/                   # HTTP服务器
│   │   ├── main.go              # 主入口文件
│   │   ├── wire.go              # Wire依赖注入配置
│   │   ├── wire_gen.go          # Wire生成的代码
│   │   ├── config/               # 配置文件
│   │   │   └── config.yaml      # 应用配置
│   │   └── docs/                # Swagger文档
│   └── script/                   # 脚本工具
│
├── domain/                        # 领域层（业务逻辑）
│   ├── form_view/                # 元数据视图领域
│   ├── logic_view/               # 逻辑视图领域
│   ├── data_lineage/             # 数据血缘领域
│   ├── data_privacy_policy/      # 数据隐私策略领域
│   ├── recognition_algorithm/    # 识别算法领域
│   ├── classification_rule/      # 分类规则领域
│   ├── grade_rule/              # 分级规则领域
│   ├── grade_rule_group/        # 分级规则组领域
│   ├── data_set/                # 数据集领域
│   ├── graph_model/             # 图谱模型领域
│   ├── explore_rule/            # 探查规则领域
│   ├── explore_task/           # 探查任务领域
│   ├── sub_view/                # 子视图领域
│   └── set.go                   # 领域模块集合
│
├── adapter/                      # 适配器层
│   ├── driver/                  # 驱动适配器（对外接口）
│   │   ├── form_view/           # 元数据视图API
│   │   ├── logic_view/          # 逻辑视图API
│   │   ├── data_lineage/        # 数据血缘API
│   │   ├── data_privacy_policy/ # 数据隐私策略API
│   │   ├── recognition_algorithm/# 识别算法API
│   │   ├── classification_rule/ # 分类规则API
│   │   ├── grade_rule/          # 分级规则API
│   │   ├── grade_rule_group/    # 分级规则组API
│   │   ├── data_set/            # 数据集API
│   │   ├── graph_model/         # 图谱模型API
│   │   ├── explore_rule/        # 探查规则API
│   │   ├── explore_task/        # 探查任务API
│   │   ├── sub_view/            # 子视图API
│   │   ├── middleware/          # 中间件
│   │   ├── mq/                  # 消息队列处理
│   │   ├── route.go             # 路由注册
│   │   └── server.go            # HTTP服务器配置
│   │
│   └── driven/                  # 被驱动适配器（外部依赖）
│       ├── configuration_center/# 配置中心客户端
│       ├── gorm/               # GORM数据库实现
│       ├── mq/                 # 消息队列实现
│       ├── redis/              # Redis缓存实现
│       ├── rest/               # REST客户端
│       ├── sailor_service/     # Sailor服务客户端
│       ├── workflow/           # 工作流服务
│       └── callbacks/          # 回调处理
│
├── infrastructure/               # 基础设施层
│   ├── config/                  # 配置管理
│   ├── db/                      # 数据库相关
│   ├── cache/                   # 缓存相关
│   └── mq/                      # 消息队列相关
│
├── common/                       # 公共层
│   ├── app/                     # 应用启动
│   ├── constant/                # 常量定义
│   ├── errorcode/               # 错误码定义
│   ├── form_validator/          # 表单验证
│   ├── initialization/          # 初始化逻辑
│   ├── models/                  # 数据模型
│   └── util/                    # 工具函数
│
├── migrations/                   # 数据库迁移脚本
│   ├── mariadb/                 # MariaDB迁移脚本
│   └── dm8/                     # DM8迁移脚本
│
├── go.mod                        # Go模块定义
├── go.sum                        # 依赖校验和
├── Makefile                      # 构建脚本
├── Dockerfile                    # Docker镜像构建
├── pipelines.yml                 # CI/CD流水线配置
├── README.md                     # 项目文档（英文）
└── README.zh.md                  # 项目文档（中文）
```

## 快速开始

### 前置要求

- Go 1.22 或更高版本
- MySQL/MariaDB 或 DM8 数据库
- Redis
- Kafka 或 NSQ（可选）

### 安装

1. 克隆仓库：
```bash
git clone <repository-url>
cd services/apps/data-view
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

服务使用环境变量和配置文件进行配置管理。配置文件位于 `cmd/server/config/config.yaml`。

主要配置部分：
- **server**: 服务器配置（HTTP/GRPC地址、超时时间等）
- **doc**: API文档配置
- **depServices**: 依赖服务地址配置
- **telemetry**: 链路追踪和日志配置
- **database**: 数据库连接配置
- **redisConfig**: Redis配置
- **exploration**: 探查任务配置
- **config**: 其他业务配置
- **logs**: 日志配置

配置示例结构：
```yaml
server:
  port: 8123
  timeout: 30s

database:
  type: mysql
  host: localhost
  port: 3306
  username: root
  password: password
  name: data_view

redisConfig:
  addr: localhost:6379
  password: ""
  db: 0

exploration:
  worker_count: 10
  task_timeout: 300s
```

环境变量示例：
```bash
export DB_TYPE=mysql
export DB_HOST=localhost
export DB_PORT=3306
export DB_USERNAME=root
export DB_PASSWORD=password
export DB_NAME=data_view
export REDIS_HOST=localhost
export REDIS_PASSWORD=""
export KAFKA_MQ_HOST=localhost:9092
export TRACE_URL=http://localhost:14268/api/traces
```

### 构建

构建服务二进制文件：

```bash
# 构建二进制文件
go build -o bin/data-view ./cmd/server/main.go

# 为 Linux 构建
GOOS=linux GOARCH=amd64 go build -o bin/data-view-linux ./cmd/server/main.go
```

### 运行

启动服务：

```bash
# 开发模式运行
make run

# 或直接运行
./bin/data-view --confPath ./cmd/server/config/

# 或使用 Go
go run ./cmd/server/main.go --confPath ./cmd/server/config/
```

服务将在配置的端口上启动（默认：8123）。

## API文档

项目使用Swagger生成API文档。

### 生成文档

```bash
make swag
```

### 访问文档

启动服务后，访问：
- Swagger UI: `http://localhost:8123/swagger/index.html`
- ReDoc: `http://localhost:8123/swagger/index.html`

### API路径

所有端点都以以下路径为前缀：

- **公开API**: `/api/data-view/v1/*`
- **内部API**: `/api/internal/data-view/v1/*`
- **迁移API**: `/api/internal/data-view/v1/*` (版本升级专用)

### 主要API模块

#### 元数据视图 API
- `POST /api/data-view/v1/form-view` - 创建元数据视图
- `GET /api/data-view/v1/form-view/{id}` - 获取元数据视图详情
- `PUT /api/data-view/v1/form-view/{id}` - 更新元数据视图
- `DELETE /api/data-view/v1/form-view/{id}` - 删除元数据视图
- `GET /api/data-view/v1/form-view` - 获取元数据视图列表
- `POST /api/data-view/v1/form-view/batch-publish` - 批量发布视图

#### 逻辑视图 API
- `POST /api/data-view/v1/logic-view` - 创建逻辑视图
- `GET /api/data-view/v1/logic-view/{id}` - 获取逻辑视图详情
- `PUT /api/data-view/v1/logic-view/{id}` - 更新逻辑视图
- `DELETE /api/data-view/v1/logic-view/{id}` - 删除逻辑视图
- `GET /api/data-view/v1/logic-view` - 获取逻辑视图列表
- `POST /api/data-view/v1/logic-view/{id}/publish` - 发布视图
- `POST /api/data-view/v1/logic-view/{id}/review` - 审核视图

#### 数据血缘 API
- `GET /api/data-view/v1/data-lineage/{source}` - 获取数据血缘关系
- `GET /api/data-view/v1/data-lineage` - 查询血缘关系
- `POST /api/data-view/v1/data-lineage/parse` - 解析血缘数据

#### 数据隐私策略 API
- `POST /api/data-view/v1/privacy-policy` - 创建隐私策略
- `GET /api/data-view/v1/privacy-policy/{id}` - 获取策略详情
- `PUT /api/data-view/v1/privacy-policy/{id}` - 更新策略
- `DELETE /api/data-view/v1/privacy-policy/{id}` - 删除策略
- `GET /api/data-view/v1/privacy-policy` - 获取策略列表

#### 识别算法 API
- `POST /api/data-view/v1/recognition-algorithm` - 创建识别算法
- `GET /api/data-view/v1/recognition-algorithm/{id}` - 获取算法详情
- `PUT /api/data-view/v1/recognition-algorithm/{id}` - 更新算法
- `DELETE /api/data-view/v1/recognition-algorithm/{id}` - 删除算法
- `GET /api/data-view/v1/recognition-algorithm` - 获取算法列表
- `POST /api/data-view/v1/recognition-algorithm/{id}/start` - 启动算法
- `POST /api/data-view/v1/recognition-algorithm/{id}/stop` - 停止算法

#### 分类规则 API
- `POST /api/data-view/v1/classification-rule` - 创建分类规则
- `GET /api/data-view/v1/classification-rule/{id}` - 获取规则详情
- `PUT /api/data-view/v1/classification-rule/{id}` - 更新规则
- `DELETE /api/data-view/v1/classification-rule/{id}` - 删除规则
- `GET /api/data-view/v1/classification-rule` - 获取规则列表
- `POST /api/data-view/v1/classification-rule/{id}/start` - 启动规则
- `POST /api/data-view/v1/classification-rule/{id}/stop` - 停止规则

#### 分级规则 API
- `POST /api/data-view/v1/grade-rule` - 创建分级规则
- `GET /api/data-view/v1/grade-rule/{id}` - 获取规则详情
- `PUT /api/data-view/v1/grade-rule/{id}` - 更新规则
- `DELETE /api/data-view/v1/grade-rule/{id}` - 删除规则
- `GET /api/data-view/v1/grade-rule` - 获取规则列表
- `POST /api/data-view/v1/grade-rule/{id}/start` - 启动规则
- `POST /api/data-view/v1/grade-rule/{id}/stop` - 停止规则

#### 数据集 API
- `POST /api/data-view/v1/data-set` - 创建数据集
- `GET /api/data-view/v1/data-set/{id}` - 获取数据集详情
- `PUT /api/data-view/v1/data-set/{id}` - 更新数据集
- `DELETE /api/data-view/v1/data-set/{id}` - 删除数据集
- `GET /api/data-view/v1/data-set` - 获取数据集列表

#### 图谱模型 API
- `POST /api/data-view/v1/graph-model` - 创建图谱模型
- `GET /api/data-view/v1/graph-model/{id}` - 获取模型详情
- `PUT /api/data-view/v1/graph-model/{id}` - 更新模型
- `DELETE /api/data-view/v1/graph-model/{id}` - 删除模型
- `GET /api/data-view/v1/graph-model` - 获取模型列表

#### 探查规则 API
- `POST /api/data-view/v1/explore-rule` - 创建探查规则
- `GET /api/data-view/v1/explore-rule/{id}` - 获取规则详情
- `PUT /api/data-view/v1/explore-rule/{id}` - 更新规则
- `DELETE /api/data-view/v1/explore-rule/{id}` - 删除规则
- `GET /api/data-view/v1/explore-rule` - 获取规则列表

#### 探查任务 API
- `POST /api/data-view/v1/explore-task` - 创建探查任务
- `GET /api/data-view/v1/explore-task/{id}` - 获取任务详情
- `PUT /api/data-view/v1/explore-task/{id}` - 更新任务
- `DELETE /api/data-view/v1/explore-task/{id}` - 删除任务
- `GET /api/data-view/v1/explore-task` - 获取任务列表
- `POST /api/data-view/v1/explore-task/{id}/cancel` - 取消任务

#### 子视图 API
- `POST /api/data-view/v1/sub-view` - 创建子视图
- `GET /api/data-view/v1/sub-view/{id}` - 获取子视图详情
- `PUT /api/data-view/v1/sub-view/{id}` - 更新子视图
- `DELETE /api/data-view/v1/sub-view/{id}` - 删除子视图
- `GET /api/data-view/v1/sub-view` - 获取子视图列表

## 开发指南

### 代码结构规范

项目采用DDD（领域驱动设计）架构，主要分为以下层次：

1. **领域层（Domain）**: 包含业务逻辑和领域接口
   - `interface.go`: 定义领域接口
   - `v1/`: 实现版本目录

2. **适配器层（Adapter）**:
   - **driver**: 实现HTTP处理器、消息队列消费者等
   - **driven**: 实现数据库操作、外部服务调用等

3. **依赖注入**: 使用Wire进行依赖注入
   - 修改 `cmd/server/wire.go` 添加新的依赖
   - 运行 `make wire` 生成代码

### 添加新功能

1. 在 `domain/` 下创建新的领域模块
2. 在 `adapter/driver/` 下创建API处理器
3. 在 `adapter/driven/` 下实现外部依赖
4. 在 `adapter/driver/route.go` 中注册路由
5. 更新Wire配置并生成代码

### 代码生成

```bash
# 生成 Wire 依赖注入代码
make wire

# 生成 Swagger 文档
make swag

# 生成所有代码
go generate ./...
```

### 数据库迁移

数据库迁移脚本位于 `migrations/` 目录：

- `mariadb/`: MariaDB迁移脚本
- `dm8/`: DM8迁移脚本

### 运行测试

```bash
# 运行测试
go test ./...

# 运行测试并查看覆盖率
go test -cover ./...
```

### Makefile命令

```bash
make help          # 查看所有可用命令
make init          # 安装开发依赖
make swag          # 生成Swagger文档
make wire          # 生成Wire依赖注入代码
make run           # 运行项目（拉取代码、生成文档、运行）
```

## 部署指南

### Docker部署

1. 构建镜像：
```bash
docker build -t data-view:latest .
```

2. 运行容器：
```bash
docker run -d \
  --name data-view \
  -p 8123:8123 \
  -v /path/to/config:/usr/local/bin/af/cmd/server/config \
  data-view:latest
```

### 编译二进制

```bash
# 编译
go build -o dv ./cmd/server/main.go

# 运行
./dv --confPath ./cmd/server/config/
```

### CI/CD

项目包含CI/CD配置：
- `pipelines.yml`: 流水线配置
- `CITemplate.yml`: CI模板
- `push-image.yml`: 镜像推送配置

## 架构设计

项目采用**DDD（领域驱动设计）**架构，主要分为以下层次：

```
┌─────────────────────────────────────┐
│         Adapter Layer               │
│  ┌──────────┐      ┌──────────┐    │
│  │  Driver   │      │  Driven  │    │
│  │ (HTTP API)│      │(External)│    │
│  └──────────┘      └──────────┘    │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│         Domain Layer                 │
│  (Business Logic & Interfaces)       │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│      Infrastructure Layer            │
│  (DB, Cache, MQ, Config)             │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│         Common Layer                 │
│  (Utils, Constants, Models)          │
└─────────────────────────────────────┘
```

### 目录说明

#### cmd/
应用程序入口点，包含主程序和启动逻辑。

#### domain/
领域层，包含业务逻辑和领域模型。每个子目录代表一个业务领域：
- **form_view**: 元数据视图相关业务逻辑
- **logic_view**: 逻辑视图相关业务逻辑
- **data_lineage**: 数据血缘分析业务逻辑
- 其他领域模块...

#### adapter/
适配器层，分为两部分：
- **driver**: 驱动适配器，实现对外接口（HTTP API、消息队列消费者等）
- **driven**: 被驱动适配器，实现对外部服务的调用（数据库、缓存、外部服务等）

#### infrastructure/
基础设施层，提供技术实现：
- **config**: 配置管理
- **db**: 数据库连接和配置
- **cache**: 缓存实现
- **mq**: 消息队列实现

#### common/
公共层，包含共享的工具和组件：
- **app**: 应用启动和生命周期管理
- **constant**: 常量定义
- **errorcode**: 错误码定义
- **form_validator**: 表单验证器
- **util**: 工具函数

## 安全考虑

- **数据访问控制**：通过白名单策略管理数据访问权限
- **数据脱敏**：支持多种数据脱敏规则，保护敏感信息
- **视图授权**：严格的视图授权机制，确保数据安全
- **审计日志**：完整的操作审计日志记录
- **链路追踪**：集成OpenTelemetry，支持安全事件追踪
- **输入验证**：严格的输入验证，防止注入攻击

## 主要依赖

- **GoCommon**: 内部公共库
- **GoUtils**: 工具库
- **go-frame**: 框架核心
- **Gin**: Web框架
- **GORM**: ORM框架
- **Wire**: 依赖注入
- **Swagger**: API文档
- **Kafka/NSQ**: 消息队列
- **Redis**: 缓存
- **OpenTelemetry**: 链路追踪

## 贡献

1. 遵循项目的代码规范和提交规范
2. 为新功能添加测试
3. 更新API文档当添加新端点时
4. 运行 `make swag` 重新生成Swagger文档
5. 确保所有测试通过后再提交

## 许可证

企业内部分发，版权所有。

## 联系方式

如有问题，请联系项目维护团队。
