# 基础搜索服务

**Language / 语言**: [English](README.md) | [中文](README.zh.md)

一个使用 Go 构建的综合搜索服务，提供数据目录、信息目录、接口服务、数据视图、电子证照、指标和信息系统的全文搜索能力，使用 OpenSearch/Elasticsearch 作为搜索引擎。

## 概述

基础搜索服务是一个微服务，负责处理多个数据域的搜索操作。它为数据资源目录、信息资源目录、接口服务、数据视图、电子证照、指标和信息系统提供统一的搜索 API。该服务利用 OpenSearch/Elasticsearch 实现高性能全文搜索，支持可自定义的分词器（包括用于中文文本处理的 HanLP）。

## 功能特性

- **数据资源目录搜索**：
  - 跨数据资源目录的全文搜索
  - 高级过滤和排序功能
  - 搜索结果高亮
  - 统计和聚合支持
  - 多字段搜索支持

- **信息资源目录搜索**：
  - 跨信息资源目录的全文搜索
  - 基于关键词的搜索，支持相关性评分
  - 过滤和排序选项
  - 搜索结果高亮

- **接口服务搜索**：
  - 按名称、描述和元数据搜索接口服务
  - 服务发现和过滤
  - 基于相关性的排序
  - 搜索结果高亮

- **数据视图搜索**：
  - 跨系统搜索数据视图
  - 多条件过滤
  - 搜索结果高亮
  - 分页支持

- **电子证照搜索**：
  - 搜索电子证照和证书
  - 证照元数据搜索
  - 过滤和排序功能

- **指标搜索**：
  - 搜索指标和度量
  - 指标元数据搜索
  - 高级过滤选项

- **信息系统搜索**：
  - 搜索信息系统
  - 系统元数据搜索
  - 基于部门的过滤
  - 关键词搜索，支持相关性评分

- **统一数据资源搜索**：
  - 跨所有数据资源的跨域搜索
  - 统一搜索接口
  - 聚合搜索结果
  - 多类型资源搜索

- **搜索功能**：
  - 支持相关性评分的全文搜索
  - 多字段搜索支持
  - 高级过滤和排序
  - 搜索结果高亮
  - 分页和基于游标的导航
  - 搜索统计和聚合
  - 可配置的分词器支持（标准或 HanLP）

- **消息队列集成**：
  - Kafka 消息消费，用于索引更新
  - 实时索引同步
  - 事件驱动的搜索索引更新

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
- **搜索引擎**: OpenSearch/Elasticsearch
- **消息队列**: Kafka (通过 Sarama)
- **依赖注入**: Google Wire
- **API 文档**: Swagger
- **可观测性**: OpenTelemetry
- **日志**: Zap
- **配置管理**: Viper
- **CLI 框架**: Cobra
- **分词器**: 标准分词器（支持可选的 HanLP）

## 项目结构

```
basic-search/
├── adapter/              # 适配器层（驱动和被驱动）
│   ├── driver/          # HTTP 处理器和 REST API (Gin)
│   │   ├── data_catalog/ # 数据目录搜索端点
│   │   ├── data_view/   # 数据视图搜索端点
│   │   ├── data_search_all/ # 统一数据资源搜索端点
│   │   ├── interface_svc/ # 接口服务搜索端点
│   │   ├── info_catalog/ # 信息目录搜索端点
│   │   ├── info_system/ # 信息系统搜索端点
│   │   ├── elec_license/ # 电子证照搜索端点
│   │   ├── indicator/   # 指标搜索端点
│   │   ├── mq.go        # 消息队列处理器
│   │   └── route.go     # 路由定义
│   └── driven/          # 外部服务客户端和存储
│       ├── opensearch/  # OpenSearch 客户端实现
│       ├── es_data_datalog/ # 数据目录 ES 适配器
│       ├── es_data_view/ # 数据视图 ES 适配器
│       ├── es_info_catalog/ # 信息目录 ES 适配器
│       ├── es_info_system/ # 信息系统 ES 适配器
│       ├── es_interface_svc/ # 接口服务 ES 适配器
│       ├── es_elec_license/ # 电子证照 ES 适配器
│       ├── es_indicator/ # 指标 ES 适配器
│       ├── es_common/   # 通用 ES 工具
│       ├── configuration_center/ # 配置中心客户端
│       ├── user_management/ # 用户管理客户端
│       └── hydra/       # OAuth2 Hydra 客户端
├── cmd/                  # 应用入口点
│   └── server/          # 主服务器应用
│       ├── config/      # 配置文件
│       ├── docs/        # Swagger 文档
│       ├── cmd.go       # 命令定义
│       ├── main.go      # 主入口点
│       ├── wire.go      # Wire 依赖注入
│       └── wire_gen.go  # 生成的 Wire 代码
├── common/               # 共享工具和中间件
│   ├── constant/        # 常量
│   ├── errorcode/       # 错误码
│   ├── es/              # OpenSearch 工具
│   ├── form_validator/  # 表单验证
│   ├── middleware/      # HTTP 中间件
│   ├── models/          # 通用模型
│   ├── settings/        # 配置设置
│   ├── trace_util/      # 追踪工具
│   └── util/            # 工具函数
├── domain/              # 业务逻辑和领域模型
│   ├── data_catalog/    # 数据目录搜索领域
│   ├── data_view/       # 数据视图搜索领域
│   ├── data_search_all/ # 统一搜索领域
│   ├── interface_svc/   # 接口服务搜索领域
│   ├── info_catalog/    # 信息目录搜索领域
│   ├── info_system/     # 信息系统搜索领域
│   ├── elec_license/    # 电子证照搜索领域
│   ├── indicator/       # 指标搜索领域
│   └── domain.go        # 领域接口
├── dev-config/          # 开发配置
│   ├── config.yaml      # 本地开发配置
│   └── config.docker.yaml # Docker 环境配置
└── docker/              # Docker 配置
    └── Dockerfile        # Docker 构建文件
```

## 前置要求

- Go 1.24+ 或更高版本
- OpenSearch/Elasticsearch 集群（用于搜索索引）
- Kafka（用于消息队列，可选）
- OAuth2 服务器（Hydra）用于认证
- 配置中心服务

## 快速开始

### 安装

1. 克隆仓库：
```bash
git clone <repository-url>
cd services/apps/basic-search
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

服务使用 Viper 进行配置管理。开发环境的配置文件应放置在 `dev-config/` 目录，生产环境的配置文件应放置在 `cmd/server/config/` 目录。

主要配置部分：
- **Server**: HTTP 服务器设置（端口、超时等）
- **OpenSearch**: OpenSearch 连接设置（读写 URI、凭证）
- **Kafka**: 消息队列设置（可选）
- **Telemetry**: OpenTelemetry 配置
- **Logging**: 日志级别和输出设置
- **OAuth**: OAuth2 客户端配置
- **DepServices**: 外部服务端点

配置示例结构：
```yaml
server:
  http:
    host: 0.0.0.0:8163

opensearch:
  readUri: "http://opensearch:9200"
  writeUri: "http://opensearch:9200"
  username: "admin"
  password: "admin123"
  sniff: false
  healthcheck: true
  debug: true
  useHanLP: false  # 设置为 true 使用 HanLP 分词器（需要插件）
  highlight:
    preTag: <span style="color:#FF6304;">
    postTag: </span>

kafka:
  version: "2.3.1"
  uri: "kafka:9092"
  clientId: "af.basic-search"
  username: "admin"
  password: "admin123"
  groupId: "af.basic-search-1"

oauth:
  hydraAdmin: "http://hydra:4445"
  clientId: "${OAUTH_CLIENT_ID}"
  clientSecret: "${OAUTH_CLIENT_SECRET}"

telemetry:
  traceUrl: "${TRACE_URL}"
  logLevel: "error"
  logUrl: "${LOG_URL}"
  serverName: "basic-search"
  serverVersion: "2.3.1"
  traceEnabled: "true"
```

环境变量：
| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| USER_ORG_CODE | 用户组织代码 | - |
| USER_ORG_NAME | 用户组织名称 | - |
| OAUTH_CLIENT_ID | OAuth2 客户端 ID | - |
| OAUTH_CLIENT_SECRET | OAuth2 客户端密钥 | - |
| CONFIG_PATH | 配置文件路径 | config/config.yaml |

### 构建

构建服务二进制文件：

```bash
# 为当前平台构建
make build

# 为 Linux 构建
make build-linux

# 或直接构建
go build -o bin/basic-search-server ./cmd/server
```

二进制文件将生成在 `bin/` 目录中，名为 `basic-search-server`。

### 运行

启动服务：

```bash
# 使用 Make 运行（构建并启动）
make start-dev

# 或使用现有二进制文件启动
make start

# 或直接运行
go run ./cmd/server serve -conf dev-config/config.yaml

# 或使用自定义地址
./bin/basic-search-server serve -conf dev-config/config.yaml -addr :8163
```

服务将在配置的端口上启动（默认：8163）。

### API 端点

服务为各种搜索功能提供 RESTful API。关键端点类别包括：

#### 数据资源目录搜索
- `POST /api/basic-search/v1/data-catalog/search` - 搜索数据资源目录
- `POST /api/basic-search/v1/data-catalog/statistics` - 获取数据目录统计信息

#### 信息资源目录搜索
- `POST /api/basic-search/v1/info-catalog/search` - 搜索信息资源目录

#### 接口服务搜索
- `POST /api/basic-search/v1/interface-svc/search` - 搜索接口服务

#### 数据视图搜索
- `POST /api/basic-search/v1/data-view/search` - 搜索数据视图

#### 电子证照搜索
- `POST /api/basic-search/v1/elec-license/search` - 搜索电子证照

#### 信息系统搜索
- `GET /api/basic-search/v1/info-systems/search` - 搜索信息系统（GET）
- `POST /api/basic-search/v1/info-systems/search` - 搜索信息系统（POST）

#### 统一数据资源搜索
- `POST /api/basic-search/v1/data-resource/search` - 跨所有数据资源的统一搜索

### API 文档

生成 Swagger 文档后，可通过以下地址访问 API 文档：
- Swagger UI: `http://localhost:8163/swagger/index.html`
- JSON: `http://localhost:8163/swagger/doc.json`

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

### 代码质量

项目遵循 Go 最佳实践和清洁架构原则。建议使用：
- `golangci-lint` 进行代码质量检查
- `go vet` 进行静态分析
- `go fmt` 进行代码格式化

## 架构

服务遵循清洁架构模式，职责分离清晰：

- **领域层**：业务逻辑和领域模型
  - 每种资源类型的搜索领域逻辑
  - 搜索查询构建和结果处理
  - 搜索结果转换

- **适配器层**：
  - **驱动端**：HTTP 处理器、REST API 端点（Gin）
  - **被驱动端**：OpenSearch 客户端实现、外部服务客户端

- **公共层**：共享工具、中间件和配置

## 搜索引擎集成

服务与 OpenSearch/Elasticsearch 集成，用于：
- 高性能全文搜索
- 多字段搜索能力
- 相关性评分和排序
- 搜索结果高亮
- 聚合和统计
- 可配置的分词器（标准或 HanLP）
- 索引管理和更新

### 分词器配置

服务支持两种分词器模式：
- **标准分词器**：默认 OpenSearch 分词器（不需要插件）
- **HanLP 分词器**：中文文本处理分词器（需要 HanLP 插件）

通过配置文件中的 `opensearch.useHanLP` 进行配置：
```yaml
opensearch:
  useHanLP: false  # 设置为 true 使用 HanLP 分词器
```

当 `useHanLP` 为 `false` 时，服务会自动调整索引映射以使用标准分词器，确保兼容性，无需 HanLP 插件。

## 消息队列集成

服务与 Kafka 集成，用于：
- 实时索引更新
- 事件驱动的搜索索引同步
- 异步搜索索引操作
- 可靠的消息传递

## 索引管理

服务管理多个 OpenSearch 索引：
- 数据目录索引（支持版本控制）
- 信息目录索引
- 接口服务索引
- 数据视图索引
- 电子证照索引
- 指标索引
- 信息系统索引

每种索引类型都有自己的映射配置，可以独立管理和更新。

## 搜索功能

### 全文搜索
- 多字段搜索支持
- 基于关键词的搜索，支持相关性评分
- 短语匹配和模糊搜索
- 布尔查询支持

### 过滤和排序
- 多条件高级过滤
- 自定义排序选项
- 分页支持
- 基于游标的导航

### 搜索结果高亮
- 可配置的高亮标签
- 多字段高亮
- 高亮片段提取

### 统计和聚合
- 搜索结果统计
- 分析聚合支持
- 分面搜索能力

## 安全考虑

- 通过 Hydra 进行 OAuth2 认证
- 基于令牌的授权
- 输入验证和清理
- 安全的 OpenSearch 连接
- 所有搜索操作的审计日志

## 监控与可观测性

- OpenTelemetry 用于分布式追踪
- 带关联 ID 的结构化日志
- 性能指标收集
- 健康检查端点
- 关键操作的审计跟踪
- 搜索查询日志

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
