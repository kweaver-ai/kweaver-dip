# DIP Hub Backend

DIP Hub 后端服务，基于 FastAPI 框架，采用六边形架构设计。

## 架构说明

本项目采用六边形架构（Hexagonal Architecture），也称为端口与适配器架构（Ports and Adapters）：

```
src/
├── domains/          # 领域层：核心业务逻辑和领域模型
│   ├── application.py    # 应用管理领域模型
│   └── health.py         # 健康检查领域模型
├── ports/            # 端口层：端口定义（接口）
│   ├── application_port.py   # 应用管理端口接口
│   └── health_port.py        # 健康检查端口接口
├── application/      # 应用层：用例和业务编排
│   ├── application_service.py  # 应用管理服务
│   └── health_service.py       # 健康检查服务
├── adapters/         # 适配器层：端口的具体实现
│   ├── application_adapter.py  # 应用管理适配器（MariaDB）
│   └── health_adapter.py       # 健康检查适配器
├── routers/          # 路由层（入站适配器）：HTTP API 控制器
│   ├── application_router.py   # 应用管理路由
│   ├── health_router.py        # 健康检查路由
│   └── schemas/
│       ├── application.py      # 应用管理 API 模型
│       └── health.py           # 健康检查 API 模型
├── infrastructure/   # 基础设施层：配置、日志、容器等
│   ├── config/
│   │   └── settings.py
│   ├── logging/
│   │   └── logger.py
│   └── container.py
└── main.py           # FastAPI 应用程序入口
```

## 技术栈

- **Web 框架**: FastAPI
- **服务器**: Uvicorn
- **数据库**: MariaDB/MySQL
- **数据库驱动**: aiomysql (异步), pymysql (同步)
- **配置管理**: Pydantic Settings
- **架构模式**: 六边形架构

## 环境要求

- Python 3.10+
- pip
- MariaDB 10.5+ 或 MySQL 8.0+

## 安装

```bash
# 创建虚拟环境
python3 -m venv .venv
source .venv/bin/activate  # Linux/macOS
# or
.venv\Scripts\activate   # Windows

# 安装依赖
pip install -r requirements.txt

# 或使用开发依赖
pip install -e ".[dev]"
```

## 配置

创建 `.env` 文件（或使用环境变量）：

```bash
# 应用配置
DIP_HUB_HOST=0.0.0.0
DIP_HUB_PORT=8000
DIP_HUB_DEBUG=true
DIP_HUB_LOG_LEVEL=DEBUG

# 数据库配置
DIP_HUB_DB_HOST=localhost
DIP_HUB_DB_PORT=3306
DIP_HUB_DB_NAME=dip
DIP_HUB_DB_USER=root
DIP_HUB_DB_PASSWORD=your_password_here
```

## 数据库初始化

在首次运行应用前，需要初始化数据库：

```bash
# 设置数据库密码环境变量
export DIP_HUB_DB_PASSWORD=your_password_here

# 运行数据库初始化脚本
python scripts/init_db.py
```

详细的数据库配置说明请参考 [scripts/README.md](scripts/README.md)。

## 运行

```bash
# 开发模式（自动重载）
python src/main.py

# 或使用 uvicorn 直接运行
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

## 测试

```bash
# 运行所有测试
pytest

# 运行并生成覆盖率报告
pytest --cov=src --cov-report=html

# 查看覆盖率报告
open htmlcov/index.html
```

## API 端点

### 应用管理

- `GET /api/dip-hub/v1/applications` - 获取已安装应用列表
- `GET /api/dip-hub/v1/applications/{key}` - 获取单个应用详情

### 健康检查

- `GET /api/internal/dip-hub/v1/health` - 健康检查
- `GET /api/internal/dip-hub/v1/ready` - 就绪检查
- `GET /api/internal/dip-hub/v1/info` - 服务信息

### API 文档

启动服务后，可访问以下地址查看 API 文档：

- Swagger UI: http://localhost:8000/api/dip-hub/v1/docs
- ReDoc: http://localhost:8000/api/dip-hub/v1/redoc
- OpenAPI JSON: http://localhost:8000/api/dip-hub/v1/openapi.json

## 开发工具

```bash
# 代码格式化
black src tests

# 代码检查
ruff check src tests

# 类型检查
mypy src
```

## 项目结构

详细的项目结构说明请查看 [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)。

