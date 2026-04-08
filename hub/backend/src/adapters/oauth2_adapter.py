"""
OAuth2 适配器

实现 OAuth2Port 接口的 HTTP 客户端适配器。
负责与 OAuth2 服务交互。
"""
import base64
import logging
from urllib.parse import quote

import httpx

from src.ports.oauth2_port import OAuth2Port, Code2TokenResponse, RefreshTokenResponse
from src.infrastructure.config.settings import Settings

logger = logging.getLogger(__name__)


class OAuth2Adapter(OAuth2Port):
    """
    OAuth2 服务适配器。

    使用 HTTP 客户端与 OAuth2 服务交互。
    """

    def __init__(self, settings: Settings):
        """
        初始化适配器。

        参数:
            settings: 应用配置
        """
        self._settings = settings
        self._timeout = 30

    def _encode_authorization(self) -> str:
        """
        生成 Basic Authentication 头部值。
        
        返回:
            str: Basic Authorization 头部值
        """
        client_id = quote(self._settings.oauth_client_id, safe="")
        client_secret = quote(self._settings.oauth_client_secret, safe="")
        credentials = f"{client_id}:{client_secret}"
        encoded = base64.b64encode(credentials.encode()).decode()
        return f"Basic {encoded}"

    def _get_headers(self) -> dict:
        """
        获取 OAuth2 请求的通用头部（与 Go 版本保持一致）。
        
        返回:
            dict: 请求头部
        """
        return {
            "Content-Type": "application/x-www-form-urlencoded",
            "cache-control": "no-cache",
            "Authorization": self._encode_authorization(),
        }

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
        # 使用 Hydra Public URL 作为 token 端点
        token_url = f"{self._settings.hydra_public_url.rstrip('/')}/oauth2/token"
        
        # 准备请求数据（与 Go 版本一致）
        data = {
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": f"{redirect_uri.rstrip('/')}/api/dip-hub/v1/login/callback",
        }
        
        headers = self._get_headers()
        
        # 打印 curl 命令（与真实请求一致）
        from urllib.parse import urlencode
        form_data = urlencode(data)
        curl_cmd = (
            f"curl -X POST '{token_url}' "
            f"-H 'Content-Type: application/x-www-form-urlencoded' "
            f"-H 'cache-control: no-cache' "
            f"-H 'Authorization: {headers['Authorization']}' "
            f"-d '{form_data}' "
            f"--insecure"
        )
        logger.info("[code2token] cURL request: %s", curl_cmd)
        
        # 禁用 SSL 证书验证以避免 certificate_verify_failed
        try:
            async with httpx.AsyncClient(timeout=self._timeout, verify=False) as client:
                response = await client.post(
                    token_url,
                    data=data,
                    headers=headers,
                )
                response.raise_for_status()
                
                token_data = response.json()
                has_refresh = "refresh_token" in token_data and token_data.get("refresh_token")
                logger.info(
                    "[code2token] token 响应: 含 access_token=%s, 含 refresh_token=%s",
                    bool(token_data.get("access_token")),
                    has_refresh,
                )
                
                return Code2TokenResponse(
                    access_token=token_data.get("access_token", ""),
                    refresh_token=token_data.get("refresh_token"),
                    id_token=token_data.get("id_token"),
                    token_type=token_data.get("token_type", "Bearer"),
                    expires_in=token_data.get("expires_in"),
                )
        except httpx.HTTPStatusError as exc:
            logger.error(
                "[code2token] HTTPStatusError: %s\nResponse content: %s",
                exc,
                exc.response.text if exc.response is not None else "<no response>"
            )
            raise
        except Exception as exc:
            logger.exception("[code2token] Unexpected Error: %s", exc)
            raise

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
        # 使用 Hydra Public URL 作为 token 端点
        token_url = f"{self._settings.hydra_public_url.rstrip('/')}/oauth2/token"
        
        # 准备请求数据（与 Go 版本一致）
        data = {
            "grant_type": "refresh_token",
            "refresh_token": refresh_token,
        }
        
        logger.info(f"refresh_token request to {token_url}")
        
        async with httpx.AsyncClient(timeout=self._timeout, verify=False) as client:
            response = await client.post(
                token_url,
                data=data,
                headers=self._get_headers(),
            )
            response.raise_for_status()
            
            token_data = response.json()
            
            return RefreshTokenResponse(
                access_token=token_data.get("access_token", ""),
                refresh_token=token_data.get("refresh_token"),
                id_token=token_data.get("id_token"),
                token_type=token_data.get("token_type", "Bearer"),
                expires_in=token_data.get("expires_in"),
            )

    async def revoke_token(self, token: str) -> None:
        """
        撤销令牌。

        参数:
            token: 要撤销的令牌（可以是 access_token 或 refresh_token）

        异常:
            Exception: 当撤销失败时抛出
        """
        # 使用 Hydra Public URL 作为 revoke 端点
        revoke_url = f"{self._settings.hydra_public_url.rstrip('/')}/oauth2/revoke"
        
        # 准备请求数据
        data = {
            "token": token,
        }
        
        async with httpx.AsyncClient(timeout=self._timeout, verify=False) as client:
            response = await client.post(
                revoke_url,
                data=data,
                headers=self._get_headers(),
            )
            response.raise_for_status()

