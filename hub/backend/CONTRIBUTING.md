# 贡献指南

感谢您对 DIP Hub 项目的关注！本文档将帮助您了解如何为本项目做出贡献。

## 目录

- [开发环境设置](#开发环境设置)
- [代码规范](#代码规范)
- [架构原则](#架构原则)
- [开发流程](#开发流程)
- [测试要求](#测试要求)
- [提交规范](#提交规范)

## 开发环境设置

### 前置要求

- Python 3.10 或更高版本
- MariaDB 10.5+ 或 MySQL 8.0+
- Git

### 环境配置

1. **克隆仓库**

```bash
git clone <repository-url>
cd hub/backend
```

2. **创建虚拟环境**

```bash
python3 -m venv .venv
source .venv/bin/activate  # Linux/macOS
# 或
.venv\Scripts\activate     # Windows
```

3. **安装依赖**

```bash
pip install -r requirements.txt
```

4. **配置环境变量**

复制 `.env` 文件并修改数据库连接信息：

```bash
cp .env.example .env  # 如果有示例文件
# 或直接创建 .env 文件
```

5. **初始化数据库**

```bash
export DIP_HUB_DB_PASSWORD=your_password
python scripts/init_db.py
```

6. **运行测试**

```bash
pytest
```

## 代码规范

### Python 代码风格

本项目遵循以下代码规范：

- **PEP 8**: Python 代码风格指南
- **类型注解**: 所有函数和方法都应使用类型注解
- **文档字符串**: 每个类、属性、函数、枚举、接口都必须写清楚注释
- **命名规范**:
  - 类名使用 PascalCase
  - 函数/变量名使用 snake_case
  - 常量使用 UPPER_SNAKE_CASE
  - 私有成员使用下划线前缀 `_`

### 注释要求

1. **类和函数文档**

```python
class ApplicationService:
    """
    应用服务类。

    负责协调应用管理相关的业务逻辑，通过端口与适配器交互。
    """

    def __init__(self, application_port: ApplicationPort):
        """
        初始化应用服务。

        参数:
            application_port: 应用端口接口实现
        """
        self._application_port = application_port

    async def get_all_applications(self) -> List[Application]:
        """
        获取所有已安装的应用。

        返回:
            List[Application]: 应用列表
        """
        return await self._application_port.get_all_applications()
```

2. **关键代码逻辑注释**

对于复杂的业务逻辑，应添加行内注释说明：

```python
# 将二进制图标数据转换为 Base64 编码字符串
icon_base64 = None
if row[4]:
    try:
        icon_base64 = base64.b64encode(row[4]).decode('utf-8')
    except Exception as e:
        logger.warning(f"应用图标 Base64 编码失败: {e}")
```

## 架构原则

本项目采用**六边形架构（端口-适配器架构）**，开发时必须遵循以下原则：

### 1. 依赖方向

- 外层依赖内层，内层不依赖外层
- 领域层不依赖任何外部框架或技术
- 应用层通过端口接口与适配器交互

```
路由层 → 应用层 → 端口层 ← 适配器层
              ↓
            领域层
```

### 2. 层次职责

- **领域层 (domains/)**: 纯业务模型和业务规则，不依赖任何框架
- **端口层 (ports/)**: 定义抽象接口（ABC），作为契约
- **应用层 (application/)**: 业务用例编排，依赖端口接口
- **适配器层 (adapters/)**: 实现端口接口，处理技术细节
- **路由层 (routers/)**: 输入适配器，处理 HTTP 请求

### 3. 设计原则

- **高内聚、低耦合**: 每个模块职责单一，模块间依赖最小化
- **依赖倒置原则 (DIP)**: 依赖抽象而非具体实现
- **开闭原则**: 对扩展开放，对修改关闭
- **单一职责原则**: 一个类只负责一个功能
- **接口隔离原则**: 使用多个专门的接口，而不是单一的总接口

## 开发流程

### 添加新功能

1. **创建领域模型** (`src/domains/`)

```python
from dataclasses import dataclass
from typing import Optional

@dataclass
class YourDomain:
    """领域模型描述。"""
    id: int
    name: str
    description: Optional[str] = None
```

2. **定义端口接口** (`src/ports/`)

```python
from abc import ABC, abstractmethod

class YourPort(ABC):
    """端口接口描述。"""

    @abstractmethod
    async def your_method(self) -> YourDomain:
        """方法描述。"""
        pass
```

3. **实现应用服务** (`src/application/`)

```python
class YourService:
    """服务描述。"""

    def __init__(self, your_port: YourPort):
        """初始化服务。"""
        self._your_port = your_port

    async def your_use_case(self) -> YourDomain:
        """用例描述。"""
        return await self._your_port.your_method()
```

4. **实现适配器** (`src/adapters/`)

```python
class YourAdapter(YourPort):
    """适配器描述。"""

    async def your_method(self) -> YourDomain:
        """实现端口方法。"""
        # 具体实现逻辑
        pass
```

5. **创建 API 模型** (`src/routers/schemas/`)

```python
from pydantic import BaseModel

class YourResponse(BaseModel):
    """API 响应模型描述。"""
    name: str
    description: str
```

6. **创建路由** (`src/routers/`)

```python
from fastapi import APIRouter

def create_your_router(your_service: YourService) -> APIRouter:
    """创建路由。"""
    router = APIRouter(tags=["your-tag"])

    @router.get("/your-endpoint")
    async def your_endpoint() -> YourResponse:
        """端点描述。"""
        result = await your_service.your_use_case()
        return YourResponse(name=result.name, description=result.description)

    return router
```

7. **注册到容器和主应用** (`src/infrastructure/container.py` 和 `src/main.py`)

## 测试要求

### 测试覆盖率目标

- **行覆盖率**: 100%
- **条件覆盖率**: 100%
- **边界场景覆盖**: 100%

### 测试类型

1. **单元测试**: 测试单个类或函数的逻辑
2. **集成测试**: 测试多个组件协作的场景
3. **API 测试**: 测试 HTTP 端点的行为

### 测试示例

```python
import pytest
from unittest.mock import AsyncMock

class TestYourService:
    """服务测试类。"""

    @pytest.mark.asyncio
    async def test_your_use_case(self):
        """测试用例描述。"""
        # Arrange
        mock_port = AsyncMock()
        mock_port.your_method.return_value = YourDomain(id=1, name="test")
        service = YourService(mock_port)

        # Act
        result = await service.your_use_case()

        # Assert
        assert result.id == 1
        assert result.name == "test"
        mock_port.your_method.assert_called_once()
```

### 运行测试

```bash
# 运行所有测试
pytest

# 运行特定测试文件
pytest tests/test_your_module.py

# 生成覆盖率报告
pytest --cov=src --cov-report=html

# 查看覆盖率报告
open htmlcov/index.html
```

## 提交规范

### Git 提交信息格式

使用语义化提交信息：

```
<类型>: <简短描述>

<详细描述（可选）>

<关联问题（可选）>
```

### 提交类型

- `feat`: 新功能
- `fix`: 错误修复
- `refactor`: 代码重构（不改变功能）
- `docs`: 文档更新
- `test`: 测试相关
- `chore`: 构建/工具链相关
- `style`: 代码格式调整（不影响功能）
- `perf`: 性能优化

### 提交示例

```
feat: 实现获取应用列表功能

- 添加 Application 领域模型
- 实现 ApplicationPort 端口接口
- 实现 ApplicationAdapter 数据库适配器
- 添加 GET /api/dip-hub/v1/applications 端点
- 完成单元测试，覆盖率 100%

Closes #123
```

### 分支策略

- `main`: 主分支，保持稳定
- `feature/*`: 功能分支
- `fix/*`: 修复分支
- `refactor/*`: 重构分支

### Pull Request 流程

1. 从 `main` 分支创建功能分支
2. 完成开发和测试
3. 确保所有测试通过
4. 提交 Pull Request
5. 等待代码审查
6. 根据反馈修改
7. 合并到 `main` 分支

## 常见问题

### 如何调试代码？

使用 Python 调试器或 IDE 调试功能：

```python
import pdb; pdb.set_trace()
```

### 如何查看日志？

日志配置在 `src/infrastructure/logging/logger.py`，通过环境变量 `DIP_HUB_LOG_LEVEL` 控制日志级别。

### 数据库迁移如何处理？

当前使用脚本方式初始化数据库，未来可能引入迁移工具（如 Alembic）。

## 参考资料

- [项目结构说明](PROJECT_STRUCTURE.md)
- [数据库初始化说明](scripts/README.md)
- [FastAPI 官方文档](https://fastapi.tiangolo.com/)
- [六边形架构](https://alistair.cockburn.us/hexagonal-architecture/)
- [Python PEP 8](https://pep8.org/)

## 联系方式

如有问题或建议，请通过以下方式联系：

- 提交 Issue
- 发起 Discussion
- 联系维护者

感谢您的贡献！
