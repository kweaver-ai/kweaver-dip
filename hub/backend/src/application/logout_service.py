"""
登出服务

实现登出相关的业务逻辑。
"""
import logging
from typing import Optional

from src.domains.session import SessionInfo
from src.ports.session_port import SessionPort
from src.ports.oauth2_port import OAuth2Port
from src.ports.deploy_manager_port import DeployManagerPort

logger = logging.getLogger(__name__)

# SSO 登录标识常量
SSO_LOGIN = 1


class LogoutService:
    """
    登出服务。

    负责处理登出相关的业务逻辑。
    """

    def __init__(
        self,
        session_port: SessionPort,
        oauth2_port: OAuth2Port,
        deploy_manager_port: DeployManagerPort,
    ):
        """
        初始化登出服务。

        参数:
            session_port: Session 端口
            oauth2_port: OAuth2 端口
            deploy_manager_port: 部署管理端口
        """
        self._session_port = session_port
        self._oauth2_port = oauth2_port
        self._deploy_manager_port = deploy_manager_port

    async def get_session(self, session_id: str) -> Optional[SessionInfo]:
        """
        获取 Session 信息。

        参数:
            session_id: Session ID

        返回:
            Optional[SessionInfo]: Session 信息，如果不存在则返回 None
        """
        return await self._session_port.get_session(session_id)

    async def revoke_and_delete_session(
        self, session_info: SessionInfo, session_id: str
    ) -> None:
        """
        撤销 Token 并删除 Session。

        参数:
            session_info: Session 信息
            session_id: Session ID
        """
        try:
            # 撤销 Refresh Token
            if session_info.refresh_token:
                await self._oauth2_port.revoke_token(session_info.refresh_token)
        except Exception as e:
            logger.warning(f"撤销 Token 失败: {e}")

        # 删除 Session
        try:
            await self._session_port.delete_session(session_id)
        except Exception as e:
            logger.warning(f"删除 Session 失败: {e}")

    async def do_logout_callback(self, session_id: str, state: str) -> SessionInfo:
        """
        执行登出回调流程。

        参数:
            session_id: Session ID
            state: 状态字符串

        返回:
            SessionInfo: Session 信息

        异常:
            ValueError: 当登出失败时抛出
        """
        # 获取 Session 信息
        session_info = await self._session_port.get_session(session_id)
        if session_info is None:
            raise ValueError("Session 不存在")

        # 验证 State
        if state != session_info.state:
            raise ValueError("State 不匹配")

        # 撤销 Token 和删除 Session
        await self.revoke_and_delete_session(session_info, session_id)

        logger.info(f"用户登出成功: {session_info.userid}")
        return session_info

    async def get_host_url(self) -> str:
        """
        获取主机 URL。

        返回:
            str: 主机 URL
        """
        host_res = await self._deploy_manager_port.get_host()
        return f"{host_res.scheme}://{host_res.host}:{host_res.port}"

