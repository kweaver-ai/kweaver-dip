"""
User Management 适配器

实现 UserManagementPort 接口的 HTTP 客户端适配器。
负责与用户管理服务交互。
"""
import logging
from typing import Dict

import httpx

from src.ports.user_management_port import UserManagementPort, UserInfo
from src.infrastructure.config.settings import Settings

logger = logging.getLogger(__name__)


class UserManagementAdapter(UserManagementPort):
    """
    User Management 服务适配器。

    使用 HTTP 客户端与用户管理服务交互。
    """

    def __init__(self, settings: Settings):
        """
        初始化适配器。

        参数:
            settings: 应用配置
        """
        self._settings = settings
        # 按照 session 项目的实现方式，baseURL 包含 /api/user-management 前缀
        base_url = settings.user_management_url.rstrip("/")
        self._base_url = f"{base_url}/api/user-management"
        self._timeout = settings.user_management_timeout

    async def batch_get_user_info_by_id(self, user_ids: list[str]) -> Dict[str, UserInfo]:
        """
        批量获取用户信息。

        参数:
            user_ids: 用户 ID 列表

        返回:
            Dict[str, UserInfo]: 用户信息字典，key 为用户 ID

        异常:
            Exception: 当获取失败时抛出
        """
        if not user_ids:
            return {}
        
        # 按照 session 项目的实现方式：GET /v1/users/{userIDsStr}/{fields}
        user_ids_str = ",".join(user_ids)
        fields = "account,name,csf_level,frozen,roles,email,telephone,third_attr,third_id,parent_deps"
        url = f"{self._base_url}/v1/users/{user_ids_str}/{fields}"
        
        async with httpx.AsyncClient(timeout=self._timeout) as client:
            response = await client.get(url)
            response.raise_for_status()
            
            # 响应是一个数组，每个元素是一个用户信息对象
            infos = response.json()
            if not isinstance(infos, list):
                infos = [infos]
            
            user_info_dict = {}
            for info in infos:
                user_id = info.get("id", "")
                if not user_id:
                    continue
                
                # 解析 roles（从数组转换为字典）
                roles = {}
                roles_list = info.get("roles", [])
                if isinstance(roles_list, list):
                    for role in roles_list:
                        if isinstance(role, str):
                            roles[role] = True
                
                # 解析 parent_deps
                parent_deps = info.get("parent_deps", [])
                if not isinstance(parent_deps, list):
                    parent_deps = []
                
                user_info_dict[user_id] = UserInfo(
                    id=user_id,
                    account=info.get("account", ""),
                    vision_name=info.get("name", ""),  # API 返回的是 "name" 字段
                    csf_level=int(info.get("csf_level", 0)),
                    frozen=bool(info.get("frozen", False)),
                    roles=roles if roles else None,
                    email=info.get("email"),
                    telephone=info.get("telephone"),
                    third_attr=info.get("third_attr"),
                    third_id=info.get("third_id"),
                    user_type=1,  # AccessorUser = 1
                    groups=None,  # 当前 API 不返回 groups
                    parent_deps=parent_deps if parent_deps else None,
                )
            
            return user_info_dict

