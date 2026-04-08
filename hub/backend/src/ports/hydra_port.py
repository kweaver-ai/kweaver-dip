"""
Hydra 端口接口

定义 Hydra OAuth2/OIDC 操作的抽象接口（端口）。
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional


@dataclass
class IntrospectResponse:
    """Token 内省响应"""
    active: bool
    visitor_id: Optional[str] = None
    visitor_typ: Optional[str] = None


class HydraPort(ABC):
    """
    Hydra 端口接口。

    这是一个输出端口（被驱动端口），定义了应用程序与 Hydra OAuth2/OIDC 服务的交互方式。
    """

    @abstractmethod
    async def introspect(self, token: str) -> IntrospectResponse:
        """
        内省 Token，验证 Token 是否有效并获取相关信息。

        参数:
            token: 访问令牌

        返回:
            IntrospectResponse: 内省响应

        异常:
            Exception: 当内省失败时抛出
        """
        pass

