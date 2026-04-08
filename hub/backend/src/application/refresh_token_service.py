"""
刷新令牌服务

实现刷新令牌相关的业务逻辑。
"""
import logging
from dataclasses import dataclass
from typing import Optional

from src.domains.session import SessionInfo
from src.ports.session_port import SessionPort
from src.ports.oauth2_port import OAuth2Port

logger = logging.getLogger(__name__)


@dataclass
class RefreshResult:
    """刷新结果"""
    token: str  # 新的 Access Token
    refresh_token: Optional[str] = None  # 新的或当前的 Refresh Token（供设置到前端 Cookie）


class RefreshTokenService:
    """
    刷新令牌服务。

    负责处理刷新令牌相关的业务逻辑。
    """

    def __init__(
        self,
        session_port: SessionPort,
        oauth2_port: OAuth2Port,
    ):
        """
        初始化刷新令牌服务。

        参数:
            session_port: Session 端口
            oauth2_port: OAuth2 端口
        """
        self._session_port = session_port
        self._oauth2_port = oauth2_port

    async def do_refresh(self, session_id: str, token: str) -> RefreshResult:
        """
        执行刷新令牌流程。

        参数:
            session_id: Session ID
            token: 当前的 Access Token

        返回:
            RefreshResult: 刷新结果

        异常:
            ValueError: 当刷新失败时抛出
        """
        # 获取 Session 信息
        session_info = await self._session_port.get_session(session_id)
        if session_info is None:
            raise ValueError("Session 不存在")

        # 验证 Token 一致性
        if session_info.token != token:
            raise ValueError("Token 不一致")

        # 刷新 Token
        if not session_info.refresh_token:
            raise ValueError("Refresh Token 不存在")

        token_info = await self._oauth2_port.refresh_token(session_info.refresh_token)

        # 更新 Session 信息
        session_info.token = token_info.access_token
        if token_info.refresh_token:
            session_info.refresh_token = token_info.refresh_token
        if token_info.id_token:
            session_info.id_token = token_info.id_token

        # 保存 Session
        await self._session_port.save_session(session_id, session_info)

        logger.info(f"Token 刷新成功: {session_id}")
        return RefreshResult(
            token=token_info.access_token,
            refresh_token=session_info.refresh_token,
        )

