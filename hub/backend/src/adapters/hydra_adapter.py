"""
Hydra 适配器

实现 HydraPort 接口的 HTTP 客户端适配器。
负责与 Hydra OAuth2/OIDC 服务交互。
"""
import logging

import httpx

from src.ports.hydra_port import HydraPort, IntrospectResponse
from src.infrastructure.config.settings import Settings

logger = logging.getLogger(__name__)


class HydraAdapter(HydraPort):
    """
    Hydra 服务适配器。

    使用 HTTP 客户端与 Hydra OAuth2/OIDC 服务交互。
    """

    def __init__(self, settings: Settings):
        """
        初始化适配器。

        参数:
            settings: 应用配置
        """
        self._settings = settings
        self._base_url = settings.hydra_host
        self._timeout = settings.hydra_timeout

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
        url = f"{self._base_url}/admin/oauth2/introspect"
        
        data = {
            "token": token,
        }
        
        async with httpx.AsyncClient(timeout=self._timeout) as client:
            response = await client.post(
                url,
                data=data,
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
            response.raise_for_status()
            
            introspect_data = response.json()
            
            return IntrospectResponse(
                active=introspect_data.get("active", False),
                visitor_id=introspect_data.get("sub") or introspect_data.get("visitor_id"),
                visitor_typ=introspect_data.get("visitor_typ"),
            )

