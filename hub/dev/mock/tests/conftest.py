"""
Pytest 配置文件

定义测试 fixtures。
"""

import sys
import os
import pytest
from flask import Flask

# 将项目根目录添加到 Python 路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from src.storage import storage


@pytest.fixture
def app() -> Flask:
    """
    创建测试应用

    Returns:
        Flask 应用实例
    """
    app = create_app()
    app.config["TESTING"] = True
    return app


@pytest.fixture
def client(app: Flask):
    """
    创建测试客户端

    Args:
        app: Flask 应用实例

    Returns:
        测试客户端
    """
    return app.test_client()


@pytest.fixture(autouse=True)
def clear_storage():
    """
    每个测试前清空存储

    自动在每个测试前后运行。
    """
    storage.clear()
    yield
    storage.clear()
