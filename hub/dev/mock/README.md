# Deploy Installer Mock Service

这是一个轻量级的 Mock 服务，用于模拟 deploy-installer 的 API 接口。

## 功能特性

模拟以下 API 接口：

1. **上传镜像** - `PUT /internal/api/deploy-installer/v1/agents/image`
   - 模拟上传 OCI 镜像文件
   - 返回镜像映射列表

2. **上传 Chart** - `PUT /internal/api/deploy-installer/v1/agents/chart`
   - 模拟上传 Helm Chart 文件
   - 返回 Chart 信息和默认配置值

3. **安装/更新应用实例** - `POST /internal/api/deploy-installer/v1/agents/release/{release-name}`
   - 模拟 Helm Release 的安装或更新
   - 支持自动配置镜像仓库地址
   - 返回最终配置值

4. **删除应用实例** - `DELETE /internal/api/deploy-installer/v1/agents/release/{release-name}`
   - 模拟 Helm Release 的删除
   - 返回实例的最终配置值

5. **健康检查** - `GET /health`
   - 服务健康检查接口

## 技术栈

- **Python 3.10+**
- **Flask** - Web 框架
- **Pytest** - 单元测试框架

## 快速开始

### 1. 创建虚拟环境

```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 2. 安装依赖

```bash
pip install -r requirements.txt
pip install -r requirements-dev.txt
```

### 3. 运行服务

```bash
python app.py
```

服务将在 `http://0.0.0.0:8080` 启动。

### 4. 配置选项

通过环境变量配置服务：

- `HOST` - 服务监听地址（默认: `0.0.0.0`）
- `PORT` - 服务监听端口（默认: `8080`）
- `DEBUG` - 调试模式（默认: `true`）

示例：

```bash
HOST=127.0.0.1 PORT=9000 DEBUG=false python app.py
```

## 测试

### 运行所有测试

```bash
pytest
```

### 运行测试并查看覆盖率

```bash
pytest --cov=src --cov-report=html --cov-report=term-missing
```

### 查看覆盖率报告

```bash
open htmlcov/index.html
```

## 项目结构

```
mock/
├── app.py                  # 应用入口
├── src/                    # 源代码目录
│   ├── __init__.py
│   ├── config.py          # 配置模块
│   ├── routes.py          # 路由定义
│   ├── handlers.py        # 业务处理器
│   └── storage.py         # 内存存储
├── tests/                  # 测试目录
│   ├── __init__.py
│   ├── conftest.py        # Pytest 配置
│   ├── test_storage.py    # 存储模块测试
│   ├── test_handlers.py   # 处理器模块测试
│   └── test_api.py        # API 集成测试
├── requirements.txt        # 生产依赖
├── requirements-dev.txt    # 开发依赖
├── pyproject.toml         # 项目配置
└── README.md              # 项目说明

## API 使用示例

### 上传镜像

```bash
curl -X PUT \
  http://localhost:8080/internal/api/deploy-installer/v1/agents/image \
  -H 'Content-Type: application/octet-stream' \
  --data-binary '@image.tar'
```

### 上传 Chart

```bash
curl -X PUT \
  http://localhost:8080/internal/api/deploy-installer/v1/agents/chart \
  -H 'Content-Type: application/octet-stream' \
  --data-binary '@chart.tgz'
```

### 安装应用实例

```bash
curl -X POST \
  'http://localhost:8080/internal/api/deploy-installer/v1/agents/release/demo?namespace=default' \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "example-app",
    "version": "1.0.0",
    "values": {
      "replicas": 1
    }
  }'
```

### 删除应用实例

```bash
curl -X DELETE \
  'http://localhost:8080/internal/api/deploy-installer/v1/agents/release/demo?namespace=default'
```
