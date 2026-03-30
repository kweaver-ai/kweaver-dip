# DSG Docker 部署指南

**中文** | [English](./DEPLOYMENT.md)

本文档说明如何使用 Docker Compose 快速部署 DSG（Data Semantic Governance，数据语义治理）系统。

## 概述

DSG 系统采用 Docker Compose 进行容器化部署，所有服务通过环境变量注入配置，支持一键启动。

## 快速开始

### 1. 前置要求

- **Docker**: 20.10+ 版本
- **Docker Compose**: 2.0+ 版本（或 `docker compose` 命令）
- **内存**: 最低 8GB RAM（推荐 16GB）
- **磁盘**: 至少 20GB 可用空间

### 2. 配置环境变量

```bash
cd deploy

# 从模板创建 .env 文件
cp .env.example .env

# 编辑 .env 文件，根据需要修改配置
vim .env  # 或使用其他编辑器
```

`.env` 文件包含所有服务的环境变量配置，主要配置项包括:

- **数据库配置** (MariaDB)
- **Redis 配置**
- **Kafka 配置** (SASL/PLAIN 认证)
- **OpenSearch 配置**
- **OAuth/Hydra 配置**
- **各服务端点配置**
- **日志和追踪配置**

### 3. 启动所有服务

使用提供的 Makefile 命令（推荐）：

```bash
# 启动所有服务
make docker-compose-up

# 或使用 docker compose 命令
docker compose up -d
```

### 4. 启动特定服务

```bash
# 仅启动基础服务（OpenSearch、Kafka、Redis、MariaDB）
docker compose up -d opensearch kafka redis mariadb

# 仅启动某个 Go 服务
docker compose up -d basic-search
```

### 5. 查看服务状态

```bash
# 查看所有服务状态
make docker-compose-ps

# 或使用 docker compose
docker compose ps
```

### 6. 查看服务日志

```bash
# 查看所有服务日志
make docker-compose-logs

# 查看特定服务日志
docker compose logs basic-search

# 实时查看日志
docker compose logs -f basic-search
```

### 7. 停止服务

```bash
# 停止所有服务
make docker-compose-down

# 或使用 docker compose
docker compose down
```

## 开发环境

使用开发环境配置（启用 DEBUG 模式、使用 dev-config 目录）：

```bash
# 使用开发环境配置
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

开发环境配置特点：
- 启用 DEBUG 模式和 debug 日志级别
- 使用 `dev-config` 目录的配置文件（如果存在）
- 减少资源使用（内存限制等）
- 优化的超时和重试配置

## 配置文件说明

### 环境变量文件 (.env)

所有服务的环境变量统一在 `deploy/.env` 文件中配置。主要配置项：

```bash
# 数据库配置
MYSQL_ROOT_PASSWORD=root123
MYSQL_USER=dsg
MYSQL_PASSWORD=dsg123
MYSQL_DATABASE=dsg

# Kafka 配置
KAFKA_USERNAME=admin
KAFKA_PASSWORD=admin123

# OpenSearch 配置
OPENSEARCH_INITIAL_ADMIN_PASSWORD=OpenSearch2024!@#

# OAuth 配置
OAUTH_CLIENT_ID=default-client-id
OAUTH_CLIENT_SECRET=default-client-secret
```

### 服务配置文件

每个服务的配置文件位于：
- `services/apps/{service-name}/cmd/server/config/config.yaml` - 生产配置
- `services/apps/{service-name}/dev-config/config.yaml` - 开发配置（可选，不提交到 Git）
- `services/apps/{service-name}/dev-config/config.docker.yaml` - Docker 环境配置（可选，不提交到 Git）

**注意**: `dev-config` 目录和 `.env` 文件不会被提交到 Git 仓库，需要本地配置。

## 服务端口

| 服务 | 端口 | 说明 |
|------|------|------|
| basic-search | 8163 | 基础搜索服务 |
| configuration-center | 8133 | 配置中心服务 |
| data-catalog | 8153 | 数据目录服务 |
| data-exploration-service | 8281 | 数据探索服务 |
| data-view | 8123 | 数据视图服务 |
| auth-service | 8155 | 认证授权服务 |
| data-subject | 8134 | 数据主体服务 |
| session | 8000 | 会话服务 |
| task-center | 8080 | 任务中心服务 |
| opensearch | 9200, 9600 | OpenSearch 搜索引擎 |
| kafka | 9092, 31000 | Kafka 消息队列 |
| zookeeper | 2181 | Zookeeper 协调服务 |
| hydra | 4444, 4445 | OAuth2 认证服务 |
| redis | 6379 | Redis 缓存 |
| mariadb | 3306 | MariaDB 数据库 |

## 健康检查

```bash
# 检查各服务健康状态
curl http://localhost:9200/_cluster/health  # OpenSearch
curl http://localhost:8163/health           # Basic Search
curl http://localhost:8133/health           # Configuration Center
```

## 常见问题

### 1. 服务启动失败

**问题**: 服务启动后立即退出

**解决**:
- 检查日志: `docker compose logs [service-name]`
- 检查配置文件是否存在
- 检查环境变量是否正确设置
- 检查依赖服务是否已启动

### 2. 端口冲突

**问题**: 端口已被占用

**解决**: 修改 `.env` 文件或 `docker-compose.yml` 中的端口映射

### 3. 内存不足

**问题**: 服务因内存不足而崩溃

**解决**:
- 减少服务实例数量
- 调整 `docker-compose.dev.yml` 中的内存限制
- 增加系统内存

### 4. 数据库连接失败

**问题**: 服务无法连接到 MariaDB

**解决**:
- 确保 MariaDB 服务已启动: `docker compose ps mariadb`
- 检查环境变量 `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD` 是否正确
- 检查 MariaDB 健康状态: `docker compose exec mariadb mysqladmin ping -h localhost -u root -proot123`

### 5. Kafka 连接失败

**问题**: 服务无法连接到 Kafka

**解决**:
- 确保 Kafka 和 Zookeeper 服务已启动
- 检查 SASL 认证配置（用户名和密码）
- 检查 `KAFKA_HOST` 环境变量是否为 `kafka`（Docker 服务名）

### 6. 配置文件找不到

**问题**: `panic: stat cmd/server/config/: no such file or directory`

**解决**:
- 确保配置文件在正确的位置
- 检查 Dockerfile 是否正确复制配置文件
- 检查 volume 挂载路径是否正确

## 数据持久化

所有数据存储在 Docker volumes 中：

```bash
# 查看所有 volumes
docker volume ls | grep dsg

# 查看特定 volume 的详细信息
docker volume inspect dsg_opensearch-data

# 备份数据（示例）
docker run --rm -v dsg_opensearch-data:/data -v $(pwd):/backup \
  ubuntu tar czf /backup/opensearch-backup.tar.gz /data
```

## 清理和重置

```bash
# 停止所有服务并删除 volumes（⚠️ 会删除所有数据）
docker compose down -v
docker system prune -f
```

## 生产环境注意事项

⚠️ **当前配置仅适用于开发/测试环境**

生产环境需要：

1. **启用安全功能**
   - OpenSearch 安全插件
   - Kafka SASL/PLAIN 认证（已启用）
   - 数据库访问控制

2. **使用外部服务**
   - 外部数据库集群
   - 外部 Redis 集群
   - 外部 Kafka 集群
   - 外部 OpenSearch 集群

3. **配置持久化**
   - 使用外部存储卷
   - 配置数据库备份
   - 配置日志收集

4. **监控和告警**
   - 配置服务监控
   - 设置资源告警
   - 配置日志聚合

5. **高可用部署**
   - 使用 Kubernetes 或其他编排工具
   - 配置负载均衡
   - 实现服务自动恢复

## 进阶使用

### 仅启动基础设施服务

```bash
docker compose up -d opensearch kafka zookeeper redis mariadb hydra
```

### 重启特定服务

```bash
docker compose restart basic-search
```

### 重新构建服务镜像

```bash
# 重新构建所有服务
docker compose build

# 重新构建特定服务
docker compose build basic-search
```

### 查看服务资源使用

```bash
docker stats
```

## 故障排查

### 查看服务日志

```bash
# 查看所有服务日志
docker compose logs

# 查看最近 100 行日志
docker compose logs --tail=100

# 实时查看日志
docker compose logs -f
```

### 进入容器调试

```bash
# 进入容器
docker compose exec basic-search /bin/bash

# 查看容器内的文件
docker compose exec basic-search ls -la /opt/basic-search/config/
```

### 检查网络连接

```bash
# 检查容器之间的网络连接
docker compose exec basic-search ping opensearch
docker compose exec basic-search ping kafka
```

## 相关文档

- [README.md](../README.md) - 项目总体说明
- [README.zh.md](../README.zh.md) - 项目总体说明（中文）
- [docker-compose.yml](docker-compose.yml) - Docker Compose 配置
- 各服务 README - 查看 `services/apps/{service-name}/README.md`

## 支持

如有问题，请：
1. 查看服务日志
2. 检查配置文件
3. 查看本文档的常见问题部分
4. 创建 Issue 或联系开发团队
