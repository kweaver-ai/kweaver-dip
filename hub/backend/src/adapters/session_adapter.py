"""
Session 适配器

实现 SessionPort 接口的 Redis 适配器。
负责与 Redis 交互，完成 Session 数据的存储操作。
使用 Redis Sentinel 模式进行连接。
"""
import json
import logging
from typing import Optional

from redis.asyncio.sentinel import Sentinel

from src.domains.session import SessionInfo
from src.ports.session_port import SessionPort
from src.infrastructure.config.settings import Settings

logger = logging.getLogger(__name__)


class SessionAdapter(SessionPort):
    """
    Session Redis 适配器实现（Sentinel 模式）。

    该适配器实现了 SessionPort 接口，提供 Session 数据的 Redis 访问操作。
    通过 Redis Sentinel 发现 Master 节点并进行异步操作。
    """

    def __init__(self, settings: Settings):
        self._settings = settings
        self._sentinel: Optional[Sentinel] = None
        self._redis_client = None

    def _build_sentinel(self) -> Sentinel:
        sentinel_kwargs = {}
        if self._settings.redis_sentinel_password:
            sentinel_kwargs["password"] = self._settings.redis_sentinel_password
        if self._settings.redis_sentinel_username:
            sentinel_kwargs["username"] = self._settings.redis_sentinel_username

        connection_kwargs = {
            "db": self._settings.redis_db,
            "decode_responses": True,
        }
        if self._settings.redis_password:
            connection_kwargs["password"] = self._settings.redis_password
        if self._settings.redis_username:
            connection_kwargs["username"] = self._settings.redis_username
        if self._settings.redis_enable_ssl:
            connection_kwargs["ssl"] = True

        sentinels = [(self._settings.redis_sentinel_host, self._settings.redis_sentinel_port)]

        sentinel = Sentinel(
            sentinels,
            sentinel_kwargs=sentinel_kwargs,
            **connection_kwargs,
        )
        logger.info(
            "Redis Sentinel 已初始化: sentinels=%s, master_group=%s, db=%s",
            sentinels,
            self._settings.redis_master_group_name,
            self._settings.redis_db,
        )
        return sentinel

    async def _get_client(self):
        """
        通过 Sentinel 获取 Master 节点的 Redis 客户端。
        """
        if self._sentinel is None:
            self._sentinel = self._build_sentinel()
        if self._redis_client is None:
            self._redis_client = self._sentinel.master_for(self._settings.redis_master_group_name)
            logger.info("已通过 Sentinel 获取 Redis Master 客户端: group=%s", self._settings.redis_master_group_name)
        return self._redis_client

    async def get_session(self, session_id: str) -> Optional[SessionInfo]:
        """
        获取 Session 信息。

        参数:
            session_id: Session ID

        返回:
            Optional[SessionInfo]: Session 信息，如果不存在则返回 None
        """
        try:
            client = await self._get_client()
            data = await client.get(f"session:{session_id}")
            if data is None:
                return None
            
            session_dict = json.loads(data)
            return SessionInfo(
                state=session_dict.get("state", ""),
                platform=session_dict.get("platform", 1),
                as_redirect=session_dict.get("as_redirect"),
                token=session_dict.get("token"),
                refresh_token=session_dict.get("refresh_token"),
                id_token=session_dict.get("id_token"),
                userid=session_dict.get("userid"),
                username=session_dict.get("username"),
                vision_name=session_dict.get("vision_name"),
                visitor_typ=session_dict.get("visitor_typ"),
                sso=session_dict.get("sso"),
            )
        except Exception as e:
            logger.error(f"获取 Session 失败: {e}", exc_info=True)
            raise

    async def save_session(self, session_id: str, session_info: SessionInfo) -> None:
        """
        保存 Session 信息。

        参数:
            session_id: Session ID
            session_info: Session 信息
        """
        try:
            client = await self._get_client()
            session_dict = {
                "state": session_info.state,
                "platform": session_info.platform,
                "as_redirect": session_info.as_redirect,
                "token": session_info.token,
                "refresh_token": session_info.refresh_token,
                "id_token": session_info.id_token,
                "userid": session_info.userid,
                "username": session_info.username,
                "vision_name": session_info.vision_name,
                "visitor_typ": session_info.visitor_typ,
                "sso": session_info.sso,
            }
            session_dict = {k: v for k, v in session_dict.items() if v is not None}
            
            data = json.dumps(session_dict)
            await client.setex(
                f"session:{session_id}",
                self._settings.cookie_timeout,
                data
            )
            logger.debug(f"Session 已保存: {session_id}")
        except Exception as e:
            logger.error(f"保存 Session 失败: {e}", exc_info=True)
            raise

    async def delete_session(self, session_id: str) -> None:
        """
        删除 Session 信息。

        参数:
            session_id: Session ID
        """
        try:
            client = await self._get_client()
            await client.delete(f"session:{session_id}")
            logger.debug(f"Session 已删除: {session_id}")
        except Exception as e:
            logger.error(f"删除 Session 失败: {e}", exc_info=True)
            raise

    async def close(self):
        """关闭 Redis 客户端连接。"""
        if self._redis_client is not None:
            await self._redis_client.aclose()
            self._redis_client = None
        self._sentinel = None
        logger.info("Redis Sentinel 连接已关闭")
