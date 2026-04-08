"""
OAuth2 端口接口

定义 OAuth2 操作的抽象接口（端口）。
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional


@dataclass
class Code2TokenResponse:
    """OAuth2 Code 转 Token 响应"""
    access_token: str
    refresh_token: Optional[str] = None
    id_token: Optional[str] = None
    token_type: str = "Bearer"
    expires_in: Optional[int] = None


@dataclass
class RefreshTokenResponse:
    """OAuth2 Refresh Token 响应"""
    access_token: str
    refresh_token: Optional[str] = None
    id_token: Optional[str] = None
    token_type: str = "Bearer"
    expires_in: Optional[int] = None


class OAuth2Port(ABC):
    """
    OAuth2 端口接口。

    这是一个输出端口（被驱动端口），定义了应用程序与 OAuth2 服务的交互方式。
    """

    @abstractmethod
    async def code2token(self, code: str, redirect_uri: str) -> Code2TokenResponse:
        """
        将授权码转换为访问令牌。

        参数:
            code: 授权码
            redirect_uri: 重定向 URI

        返回:
            Code2TokenResponse: Token 响应

        异常:
            Exception: 当转换失败时抛出
        """
        pass

    @abstractmethod
    async def refresh_token(self, refresh_token: str) -> RefreshTokenResponse:
        """
        刷新访问令牌。

        参数:
            refresh_token: 刷新令牌

        返回:
            RefreshTokenResponse: Token 响应

        异常:
            Exception: 当刷新失败时抛出
        """
        pass

    @abstractmethod
    async def revoke_token(self, token: str) -> None:
        """
        撤销令牌。

        参数:
            token: 要撤销的令牌（可以是 access_token 或 refresh_token）

        异常:
            Exception: 当撤销失败时抛出
        """
        pass

