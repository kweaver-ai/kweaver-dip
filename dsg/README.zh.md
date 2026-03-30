# DSG - 数据语义治理系统

[![Go Version](https://img.shields.io/badge/Go-1.24+-00ADD8?style=flat&logo=go)](https://golang.org)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**Language / 语言**: [English](README.md) | [中文](README.zh.md)

一个综合的企业级数据语义治理（DSG）系统，提供统一的数据目录管理、数据视图管理、数据探索、认证授权、任务编排和语义搜索能力。

## 概述

DSG（Data Semantic Governance，数据语义治理）是一个基于微服务架构的企业级数据治理和语义管理平台。它提供完整的数据编目、数据视图管理、数据探索、访问控制、工作流编排和跨多数据源的语义搜索解决方案。

该平台遵循微服务架构模式，每个服务处理特定的领域职责。所有服务均使用 Go 构建，采用清洁架构原则，可以独立部署或使用 Docker Compose 一起部署。

## 系统架构

DSG 由以下组件组成：

### 核心服务

#### 1. **数据目录服务** (端口: 8153)
- 数据资源目录管理
- 信息目录和系统管理
- 数据推送工作流
- 数据理解和评估
- 分类和树管理
- 统计和分析

#### 2. **数据视图服务** (端口: 8123)
- 元数据视图（表单视图）管理
- 逻辑视图管理
- 数据血缘分析
- 数据分级和脱敏
- 数据探索和数据集管理
- 图谱模型管理

#### 3. **数据探索服务** (端口: 8281)
- 数据探索任务管理
- 探索报告生成
- 数据质量评估
- 探索规则配置
- 任务调度和执行

#### 4. **基础搜索服务** (端口: 8163)
- 跨数据目录的全文搜索
- 信息目录搜索
- 接口服务搜索
- 数据视图搜索
- 电子证照搜索
- 指标和信息系统搜索
- 统一跨域搜索

#### 5. **配置中心服务** (端口: 8133)
- 系统配置管理
- 用户和角色管理
- 权限和访问控制
- 菜单和字典管理
- 数据源配置
- 工作流配置
- 代码生成规则

#### 6. **认证授权服务** (端口: 8155)
- 基于策略的访问控制（PBAC）
- 权限验证
- 指标维度规则
- 数据仓库授权申请
- 资源访问管理
- 工作流集成

#### 7. **数据主体服务** (端口: 8134)
- 数据主体管理
- 主体生命周期跟踪
- 主体关系管理

#### 8. **任务中心服务** (端口: 8080)
- 项目和任务管理
- 工单系统
- 数据处理管道
- 对象存储管理
- 通知和通信
- 分析和报告

#### 9. **会话服务** (端口: 8000)
- 用户会话管理
- 会话认证
- 令牌管理

#### 10. **数据应用服务** (端口: 8156)
- API 接口管理
- 数据服务发布
- API 生命周期管理
- API 审批工作流集成
- 变更数据捕获（CDC）实现实时同步
- 服务统计和监控

#### 11. **数据应用网关** (端口: 8157)
- 数据服务统一 API 网关
- 请求路由和转发
- API 执行和调用
- 服务发现
- 请求验证和转换
- 限流和访问控制

### 基础设施服务

- **OpenSearch** (端口: 9200, 9600): 全文搜索引擎
- **Kafka** (端口: 9092): 消息队列（支持 SASL/PLAIN 认证）
- **Zookeeper** (端口: 2181): Kafka 协调服务
- **Hydra** (端口: 4444, 4445): OAuth2 认证服务器
- **Redis** (端口: 6379): 缓存和会话存储
- **MariaDB** (端口: 3306): 所有服务的主数据库

### 前端应用

- 基于 React 的 Web 应用
- 微前端架构
- 多个业务模块和插件

## 核心功能

### 数据治理
- **数据编目**：全面的数据资源和信息目录管理
- **数据分类**：自动化数据分类和归类
- **数据质量**：数据质量评估和监控
- **数据血缘**：端到端数据血缘跟踪和可视化
- **数据脱敏**：敏感数据脱敏和隐私保护

### 语义管理
- **语义搜索**：高级全文搜索，支持可配置分词器
- **元数据管理**：丰富的元数据管理和组织
- **数据视图**：统一的数据视图管理（元数据和逻辑视图）
- **数据探索**：交互式数据探索和分析

### 访问控制
- **基于策略的访问控制（PBAC）**：细粒度访问控制策略
- **基于角色的访问控制（RBAC）**：角色和权限管理
- **资源授权**：资源级访问控制
- **工作流集成**：授权工作流支持

### 工作流与编排
- **任务管理**：全面的任务和项目管理
- **工单系统**：工单创建和跟踪
- **数据处理管道**：数据聚合和处理工作流
- **审核工作流**：审核流程管理和跟踪

### 数据应用与 API 管理
- **API 管理**：全面的 API 接口创建和生命周期管理
- **数据服务发布**：将数据视图和目录发布为 RESTful API
- **API 网关**：统一的 API 执行入口点，支持路由和负载均衡
- **服务发现**：动态发现已发布的数据服务
- **请求处理**：请求验证、转换和响应格式化
- **API 监控**：服务调用统计和性能监控

### 系统管理
- **配置管理**：集中式系统配置
- **用户管理**：用户、角色和权限管理
- **菜单管理**：动态菜单和导航管理
- **字典管理**：系统字典和元数据管理

## 技术栈

### 后端服务
- **编程语言**: Go 1.24+
- **Web 框架**: Gin
- **ORM**: GORM with MySQL/MariaDB driver
- **消息队列**: Kafka (支持 SASL/PLAIN), NSQ
- **缓存**: Redis
- **搜索引擎**: OpenSearch/Elasticsearch
- **依赖注入**: Google Wire
- **API 文档**: Swagger/OpenAPI
- **可观测性**: OpenTelemetry
- **日志**: Zap
- **配置管理**: Viper
- **CLI 框架**: Cobra

### 前端
- **框架**: React
- **构建工具**: Webpack, Vite
- **微前端**: 基于插件的架构

### 基础设施
- **容器化**: Docker, Docker Compose
- **数据库**: MariaDB/MySQL
- **消息队列**: Kafka, NSQ
- **缓存**: Redis
- **搜索**: OpenSearch
- **认证**: OAuth2 (Hydra)

## 项目结构

```
dsg/
├── services/              # 后端微服务
│   └── apps/             # 应用服务
│       ├── auth-service/           # 认证授权服务
│       ├── basic-search/           # 搜索服务
│       ├── configuration-center/  # 配置管理服务
│       ├── data-catalog/          # 数据目录管理服务
│       ├── data-exploration-service/ # 数据探索服务
│       ├── data-subject/          # 数据主体管理服务
│       ├── data-view/             # 数据视图管理服务
│       ├── session/              # 会话管理服务
│       ├── task_center/           # 任务和工作流管理服务
│       ├── data-application-service/  # 数据应用和 API 管理服务
│       └── data-application-gateway/  # 数据服务 API 网关
├── frontend/             # 前端 Web 应用
│   ├── src/             # 源代码
│   ├── public/          # 静态资源
│   └── config/          # 构建配置
├── deploy/              # 部署配置
│   ├── docker/         # Docker 配置
│   │   ├── kafka/      # Kafka 配置
│   │   └── opensearch/ # OpenSearch 配置
│   ├── docker-compose.yml      # 多服务编排
│   └── docker-compose.dev.yml  # 开发环境
├── script/              # 工具脚本
│   ├── start-go-services.sh   # 服务启动脚本
│   └── verify-go-work.sh      # Go 工作区验证
├── local_patches/       # 本地依赖补丁
├── go.work             # Go 工作区配置
└── LICENSE             # 许可证文件
```

## 前置要求

- **Go**: 1.24.0 或更高版本
- **Docker**: 20.10+ 和 Docker Compose 2.0+
- **Node.js**: 16+ (用于前端开发)
- **Make**: 用于构建自动化

### 基础设施要求
- **内存**: 最低 8GB RAM（推荐 16GB）
- **磁盘**: 至少 20GB 可用空间
- **CPU**: 推荐 4+ 核心

## 快速开始

### 1. 克隆仓库

```bash
git clone <repository-url>
cd dsg
```

### 2. 使用 Docker Compose 启动所有服务

最简单的方式是使用提供的脚本：

```bash
# 启动所有服务
./script/start-go-services.sh

# 或仅启动核心服务
./script/start-go-services.sh core

# 或仅启动 Go 服务
./script/start-go-services.sh go
```

### 3. 手动启动

或者，您可以手动启动服务：

```bash
cd deploy
docker-compose up -d
```

### 4. 验证服务

检查服务状态：

```bash
cd deploy
docker-compose ps
```

访问服务端点：
- **OpenSearch**: http://localhost:9200
- **Kafka UI**: http://localhost:8080 (如果启用)
- **Hydra Admin**: http://localhost:4445
- **基础搜索**: http://localhost:8163
- **配置中心**: http://localhost:8133
- **数据目录**: http://localhost:8153
- **数据视图**: http://localhost:8123
- **认证服务**: http://localhost:8155
- **任务中心**: http://localhost:8080
- **数据应用服务**: http://localhost:8156
- **数据应用网关**: http://localhost:8157

## 开发

### Go 工作区设置

DSG 使用 Go 工作区管理多个服务：

```bash
# 验证工作区配置
./script/verify-go-work.sh

# 工作区包含所有服务：
# - auth-service
# - basic-search
# - configuration-center
# - data-catalog
# - data-exploration-service
# - data-subject
# - session
# - task_center
# - data-view
# - data-application-service
# - data-application-gateway
```

### 构建单个服务

每个服务都有自己的 Makefile：

```bash
# 构建特定服务
cd services/apps/basic-search
make build

# 为 Linux 构建
make build-linux

# 生成代码（wire, swag）
make wire
make swag
```

### 本地运行服务

```bash
# 示例：本地运行 basic-search
cd services/apps/basic-search
make start-dev

# 或使用自定义配置
./bin/basic-search-server serve -conf dev-config/config.yaml
```

### 前端开发

```bash
cd frontend
npm install
npm start
```

## 配置

### 环境变量

在 `deploy/` 目录创建 `.env` 文件：

```bash
# 数据库
MYSQL_ROOT_PASSWORD=root123
MYSQL_USER=dsg
MYSQL_PASSWORD=dsg123
MYSQL_DATABASE=dsg

# OAuth
OAUTH_CLIENT_ID=your-client-id
OAUTH_CLIENT_SECRET=your-client-secret

# 用户组织
USER_ORG_CODE=your-org-code
USER_ORG_NAME=your-org-name
```

### 服务配置

每个服务的配置位于：
- `services/apps/{service-name}/cmd/server/config/config.yaml`
- `services/apps/{service-name}/dev-config/config.yaml` (用于开发)

主要配置区域：
- **Server**: HTTP/gRPC 端口和超时
- **Database**: 连接设置
- **Redis**: 缓存配置
- **Kafka**: 消息队列设置（支持 SASL 认证）
- **OpenSearch**: 搜索引擎配置
- **Telemetry**: OpenTelemetry 和日志设置

## 部署

### Docker Compose 部署

用于开发和测试：

```bash
cd deploy
docker-compose up -d
```

### 生产环境部署

对于生产环境，请考虑：

1. **Kubernetes 部署**：使用 Kubernetes 进行编排
2. **服务网格**：实现服务网格用于服务间通信
3. **监控**：设置全面的监控和告警
4. **安全**：启用所有安全功能（OpenSearch 安全、Kafka 认证）
5. **高可用性**：部署多个实例并负载均衡
6. **数据持久化**：为数据库和搜索索引使用持久卷

## 服务通信

服务通过以下方式通信：
- **REST API**：HTTP/REST 用于同步通信
- **gRPC**：用于高性能服务间调用
- **消息队列**：Kafka/NSQ 用于异步事件驱动通信
- **服务发现**：Docker 网络用于服务发现

## 数据流

1. **数据摄取**：通过各种服务摄取数据
2. **编目**：数据目录服务对数据进行编目和组织
3. **索引**：基础搜索服务在 OpenSearch 中索引数据
4. **视图管理**：数据视图服务管理数据视图和血缘
5. **访问控制**：认证服务执行访问策略
6. **探索**：数据探索服务提供探索能力
7. **工作流**：任务中心编排工作流和流程
8. **API 发布**：数据应用服务将数据发布为 RESTful API
9. **API 执行**：数据应用网关提供统一访问已发布 API 的入口

## 安全

- **OAuth2 认证**：基于 Hydra 的 OAuth2 认证
- **基于策略的访问控制**：细粒度 PBAC 策略
- **基于角色的访问控制**：用于用户和资源管理的 RBAC
- **数据脱敏**：敏感数据脱敏能力
- **审计日志**：全面的审计跟踪
- **安全通信**：服务间通信使用 TLS/SSL
- **Kafka SASL**：Kafka 的 SASL/PLAIN 认证

## 监控与可观测性

- **分布式追踪**：所有服务的 OpenTelemetry 集成
- **结构化日志**：基于 Zap 的结构化日志
- **健康检查**：所有服务的健康检查端点
- **指标收集**：性能和业务指标
- **审计跟踪**：全面的审计日志

## API 文档

每个服务都提供 Swagger/OpenAPI 文档：

- **基础搜索**: http://localhost:8163/swagger/index.html
- **配置中心**: http://localhost:8133/swagger/index.html
- **数据目录**: http://localhost:8153/swagger/index.html
- **数据视图**: http://localhost:8123/swagger/index.html
- **认证服务**: http://localhost:8155/swagger/index.html
- **任务中心**: http://localhost:8080/swagger/index.html
- **数据应用服务**: http://localhost:8156/swagger/index.html
- **数据应用网关**: http://localhost:8157/swagger/index.html

## 贡献

1. 遵循现有的代码风格和模式
2. 为新功能添加测试
3. 添加新端点时更新 API 文档
4. 运行 `make swag` 重新生成 Swagger 文档
5. 提交前确保所有测试通过
6. 遵循清洁架构原则
7. 添加重要功能时更新服务 README

## 服务特定文档

每个服务都有详细的 README：

- [基础搜索服务](services/apps/basic-search/README.md)
- [配置中心服务](services/apps/configuration-center/README.md)
- [数据目录服务](services/apps/data-catalog/README.md)
- [数据探索服务](services/apps/data-exploration-service/README.md)
- [数据视图服务](services/apps/data-view/README.md)
- [认证授权服务](services/apps/auth-service/README.md)
- [任务中心服务](services/apps/task_center/README.md)
- [数据应用服务](services/apps/data-application-service/README.md)
- [数据应用网关](services/apps/data-application-gateway/README.md)

## 许可证

请查看仓库根目录中的 [LICENSE](LICENSE) 文件。

## 支持

如有问题和疑问：
- 在仓库中创建 issue
- 联系开发团队
- 参考服务特定的 README 获取详细文档


