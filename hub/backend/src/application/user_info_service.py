"""
用户信息服务

实现用户信息查询相关的业务逻辑。
"""
import logging

from src.ports.hydra_port import HydraPort
from src.ports.user_management_port import UserManagementPort, UserInfo

logger = logging.getLogger(__name__)


class UserInfoService:
    """
    用户信息服务。

    负责处理用户信息查询相关的业务逻辑。
    """

    def __init__(
        self,
        hydra_port: HydraPort,
        user_management_port: UserManagementPort,
    ):
        """
        初始化用户信息服务。

        参数:
            hydra_port: Hydra 端口
            user_management_port: 用户管理端口
        """
        self._hydra_port = hydra_port
        self._user_management_port = user_management_port

    async def get_user_info(self, token: str) -> UserInfo:
        """
        获取用户信息。

        参数:
            token: 访问令牌

        返回:
            UserInfo: 用户信息

        异常:
            ValueError: 当获取失败时抛出
        """
        # Token 内省
        introspect = await self._hydra_port.introspect(token)
        if not introspect.active:
            raise ValueError("Token 无效")

        userid = introspect.visitor_id
        if not userid:
            raise ValueError("无法获取用户 ID")

        # 获取用户详细信息
        user_infos = await self._user_management_port.batch_get_user_info_by_id([userid])
        if userid not in user_infos:
            raise ValueError("用户信息不存在")

        user_info = user_infos[userid]
        logger.info(f"获取用户信息成功: {userid}")
        return user_info

