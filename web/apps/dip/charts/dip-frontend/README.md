# DIP Hub Frontend Helm Chart

这个 Helm Chart 用于在 Kubernetes 集群中部署 DIP Hub Frontend 应用。

## 前置要求

- Kubernetes 1.19+
- Helm 3.0+
- 已构建并推送到镜像仓库的 Docker 镜像

## 安装

### 1. 构建并推送 Docker 镜像

```bash
# 构建前端
cd /path/to/dip/hub/frontend
yarn build

# 构建 Docker 镜像
docker build -t your-registry/dip-frontend:1.0.0 .

# 推送镜像
docker push your-registry/dip-frontend:1.0.0
```

### 2. 修改 values.yaml

根据你的实际情况修改 `values.yaml`：

- `image.registry`: 镜像仓库地址
- `image.repository`: 镜像仓库路径
- `image.tag`: 镜像标签
- `ingress.hosts[0].host`: 域名
- `namespace`: 命名空间

### 3. 安装 Chart

```bash
# 安装到指定命名空间
helm install dip-frontend ./charts/dip-frontend \
  --namespace anyshare \
  --create-namespace \
  --set image.registry=your-registry \
  --set image.tag=1.0.0
```

### 4. 升级 Chart

```bash
# 升级到新版本
helm upgrade dip-frontend ./charts/dip-frontend \
  --namespace anyshare \
  --set image.tag=1.0.1
```

### 5. 卸载 Chart

```bash
helm uninstall dip-frontend --namespace anyshare
```

## 配置说明

### 主要配置项

| 参数                        | 说明             | 默认值                  |
| --------------------------- | ---------------- | ----------------------- |
| `replicaCount`              | 副本数量         | `2`                     |
| `namespace`                 | 命名空间         | `dip`                   |
| `image.registry`            | 镜像仓库地址     | `acr.aishu.cn`          |
| `image.repository`          | 镜像仓库路径     | `/dip/dip-frontend` |
| `image.tag`                 | 镜像标签         | `1.0.0`                 |
| `service.type`              | Service 类型     | `ClusterIP`             |
| `ingress.enabled`           | 是否启用 Ingress | `true`                  |
| `resources.requests.cpu`    | CPU 请求         | `100m`                  |
| `resources.requests.memory` | 内存请求         | `128Mi`                 |
| `resources.limits.cpu`      | CPU 限制         | `500m`                  |
| `resources.limits.memory`   | 内存限制         | `512Mi`                 |

### 健康检查

应用提供了 `/probe` 端点用于健康检查：

- **Liveness Probe**: 检查容器是否存活，失败会重启容器
- **Readiness Probe**: 检查容器是否就绪，失败会从 Service 中移除
- **Startup Probe**: 检查容器是否启动完成

## 验证部署

```bash
# 查看 Pod 状态
kubectl get pods -n anyshare -l app=dip-frontend

# 查看 Service
kubectl get svc -n anyshare -l app=dip-frontend

# 查看 Ingress
kubectl get ingress -n anyshare -l app=dip-frontend

# 查看 Pod 日志
kubectl logs -n anyshare -l app=dip-frontend --tail=100
```

## 故障排查

### Pod 无法启动

```bash
# 查看 Pod 详情
kubectl describe pod -n anyshare -l app=dip-frontend

# 查看事件
kubectl get events -n anyshare --sort-by='.lastTimestamp'
```

### 镜像拉取失败

- 检查镜像仓库地址是否正确
- 检查镜像标签是否存在
- 检查集群是否有权限访问镜像仓库

### 健康检查失败

- 检查 `/probe` 端点是否正常
- 检查容器端口是否正确（默认 80）
- 检查防火墙和网络策略

## 示例

### 使用自定义域名

```bash
helm install dip-frontend ./charts/dip-frontend \
  --namespace anyshare \
  --set ingress.hosts[0].host=dip-hub.yourdomain.com
```

### 使用 NodePort 类型 Service

```bash
helm install dip-frontend ./charts/dip-frontend \
  --namespace anyshare \
  --set service.type=NodePort
```

### 调整资源限制

```bash
helm install dip-frontend ./charts/dip-frontend \
  --namespace anyshare \
  --set resources.requests.cpu=200m \
  --set resources.requests.memory=256Mi \
  --set resources.limits.cpu=1000m \
  --set resources.limits.memory=1Gi
```
