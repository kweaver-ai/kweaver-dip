# OpenSearch Docker 镜像

这个目录包含自定义的 OpenSearch Docker 镜像配置。

## 构建镜像

### 方法1: 使用构建脚本（推荐）

```bash
cd deploy/docker/opensearch
./build.sh
```

或者从项目根目录：

```bash
cd deploy
docker compose build opensearch
```

### 方法2: 直接使用 Docker Compose

```bash
cd deploy
docker compose build opensearch
```

## 镜像版本

- **OpenSearch 版本**: 2.17.1
- **镜像标签**: `dsg-opensearch:2.17.1`

## 配置说明

当前镜像使用官方 OpenSearch 基础镜像，不包含任何自定义插件。

如果需要安装插件，可以：
1. 修改 `Dockerfile` 添加插件安装步骤
2. 重新构建镜像

## 验证服务

启动服务后，可以通过以下方式验证 OpenSearch 是否正常运行：

```bash
# 检查集群健康状态
curl http://localhost:9200/_cluster/health

# 检查已安装的插件
curl http://localhost:9200/_cat/plugins

# 检查节点信息
curl http://localhost:9200/_cat/nodes
```

## 注意事项

1. OpenSearch 2.17.1 需要设置强密码（至少 8 个字符，包含大小写字母、数字和特殊字符）
2. 默认配置中安全插件已禁用（`plugins.security.disabled=true`），仅用于开发环境
3. 生产环境请启用安全插件并配置适当的认证和授权

## 相关文件

- `Dockerfile` - Docker 镜像构建文件
- `build.sh` - 构建脚本
- `README.md` - 本文档
