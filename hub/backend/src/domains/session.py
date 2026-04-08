"""
Session 领域模型

定义 Session 相关的领域模型。
"""
from dataclasses import dataclass
from typing import Optional


@dataclass
class SessionInfo:
    """Session 信息"""
    state: str
    platform: int = 1  # 平台类型，默认值为 1
    as_redirect: Optional[str] = None  # AnyShare 重定向地址
    token: Optional[str] = None  # OAuth2 Access Token
    refresh_token: Optional[str] = None  # OAuth2 Refresh Token
    id_token: Optional[str] = None  # OAuth2 ID Token
    userid: Optional[str] = None  # 用户 ID
    username: Optional[str] = None  # 用户名
    vision_name: Optional[str] = None  # 显示名称
    visitor_typ: Optional[str] = None  # 访问者类型
    sso: Optional[int] = None  # SSO 登录标识

