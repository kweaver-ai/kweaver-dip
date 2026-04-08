"""
OAuth2 客户端自注册

在应用启动时向 Hydra Admin API 注册 OAuth2 客户端，
替代原有的通过挂载 Secret 文件读取 client_id/client_secret 的方式。
"""
import logging

import httpx

from src.infrastructure.config.settings import Settings

logger = logging.getLogger(__name__)


async def register_oauth_client(
    settings: Settings,
) -> tuple[str, str]:
    """
    向 Hydra Admin API 自注册 OAuth2 客户端。

    流程：
    1. 使用 settings 中的外部访问地址构造回调 URL
    2. 查询是否已存在同名客户端并删除
    3. 创建新的 OAuth2 客户端
    4. 返回 (client_id, client_secret)
    """
    base_url = f"{settings.access_address_scheme}://{settings.access_address_host}:{settings.access_address_port}"

    client_name = settings.oauth_client_name
    hydra_admin_url = settings.hydra_host.rstrip("/")

    params = {
        "redirect_uris": [
            f"{base_url}/api/dip-hub/v1/login/callback",
        ],
        "grant_types": [
            "authorization_code",
            "implicit",
            "refresh_token",
        ],
        "response_types": [
            "token id_token",
            "code",
            "token",
        ],
        "scope": "offline openid all",
        "post_logout_redirect_uris": [
            f"{base_url}/api/dip-hub/v1/logout/callback",
        ],
        "metadata": {
            "device": {
                "client_type": "web",
            },
            "login_form": {
                "third_party_login_visible": False,
                "remember_password_visible": False,
                "reset_password_visible": False,
                "sms_login_visible": False,
            },
        },
        "client_name": client_name,
    }

    async with httpx.AsyncClient(verify=False, timeout=30) as client:
        resp = await client.get(
            f"{hydra_admin_url}/admin/clients",
            params={"client_name": client_name},
        )
        resp.raise_for_status()
        existing_clients: list = resp.json()

        for c in existing_clients:
            cid = c["client_id"]
            logger.info("删除已有 OAuth2 客户端: %s", cid)
            del_resp = await client.delete(f"{hydra_admin_url}/admin/clients/{cid}")
            del_resp.raise_for_status()

        resp = await client.post(
            f"{hydra_admin_url}/admin/clients",
            json=params,
        )
        resp.raise_for_status()
        result = resp.json()

    new_client_id = result["client_id"]
    new_client_secret = result["client_secret"]
    logger.info(
        "OAuth2 客户端自注册成功: client_name=%s, client_id=%s",
        client_name,
        new_client_id,
    )
    return new_client_id, new_client_secret
