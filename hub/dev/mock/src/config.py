"""
配置模块

管理应用配置。
"""

import os
from dataclasses import dataclass


@dataclass
class AppConfig:
    """
    应用配置类

    Attributes:
        host: 服务监听地址
        port: 服务监听端口
        debug: 是否开启调试模式
    """

    host: str
    port: int
    debug: bool


def get_config() -> AppConfig:
    """
    从环境变量加载配置

    Returns:
        AppConfig: 应用配置实例
    """
    return AppConfig(
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", "8888")),
        debug=os.getenv("DEBUG", "true").lower() == "true",
    )
