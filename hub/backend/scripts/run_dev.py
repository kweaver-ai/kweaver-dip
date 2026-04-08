#!/usr/bin/env python3
"""
开发模式启动脚本

使用 Mock 外部服务启动 DIP Hub 服务，用于本地开发调试。
"""
import os
import sys
from pathlib import Path

# 添加项目根目录到 Python 路径
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

# 设置环境变量（Mock 模式）
os.environ.setdefault("DIP_HUB_DEBUG", "true")
os.environ.setdefault("DIP_HUB_LOG_LEVEL", "DEBUG")
os.environ.setdefault("DIP_HUB_USE_MOCK_SERVICES", "true")
os.environ.setdefault("DIP_HUB_PORT", "8000")

# 数据库配置（可选，如果没有数据库会报错）
os.environ.setdefault("DIP_HUB_DB_HOST", "localhost")
os.environ.setdefault("DIP_HUB_DB_PORT", "3306")
os.environ.setdefault("DIP_HUB_DB_NAME", "dip")
os.environ.setdefault("DIP_HUB_DB_USER", "root")
os.environ.setdefault("DIP_HUB_DB_PASSWORD", "123456")


def main():
    """启动开发服务器。"""
    import uvicorn
    from src.infrastructure.config.settings import get_settings
    
    # 清除缓存的 settings
    get_settings.cache_clear()
    settings = get_settings()
    
    print("=" * 60)
    print("DIP Hub 开发模式")
    print("=" * 60)
    print(f"应用名称: {settings.app_name}")
    print(f"应用版本: {settings.app_version}")
    print(f"调试模式: {settings.debug}")
    print(f"日志级别: {settings.log_level}")
    print(f"Mock 服务: {settings.use_mock_services}")
    print(f"服务地址: http://{settings.host}:{settings.port}")
    print(f"API 文档: http://localhost:{settings.port}{settings.api_prefix}/docs")
    print("=" * 60)
    print()
    
    uvicorn.run(
        "src.main:app",
        host=settings.host,
        port=settings.port,
        reload=True,
        log_level=settings.log_level.lower(),
    )


if __name__ == "__main__":
    main()

