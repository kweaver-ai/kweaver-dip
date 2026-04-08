"""
登录领域模型

定义登录相关的领域模型。
"""
from dataclasses import dataclass
from typing import Optional


@dataclass
class LoginRequest:
    """登录请求"""
    platform: int = 1  # 平台类型，默认值为 1
    as_redirect: Optional[str] = None  # AnyShare 重定向地址

