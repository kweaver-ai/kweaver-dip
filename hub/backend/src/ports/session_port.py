"""
Session 端口接口

定义 Session 操作的抽象接口（端口）。
遵循六边形架构模式，这些端口定义了领域层与基础设施层之间的契约。
"""
from abc import ABC, abstractmethod
from typing import Optional

from src.domains.session import SessionInfo


class SessionPort(ABC):
    """
    Session 端口接口。

    这是一个输出端口（被驱动端口），定义了应用程序与外部 Session 存储的交互方式。
    """

    @abstractmethod
    async def get_session(self, session_id: str) -> Optional[SessionInfo]:
        """
        获取 Session 信息。

        参数:
            session_id: Session ID

        返回:
            Optional[SessionInfo]: Session 信息，如果不存在则返回 None
        """
        pass

    @abstractmethod
    async def save_session(self, session_id: str, session_info: SessionInfo) -> None:
        """
        保存 Session 信息。

        参数:
            session_id: Session ID
            session_info: Session 信息
        """
        pass

    @abstractmethod
    async def delete_session(self, session_id: str) -> None:
        """
        删除 Session 信息。

        参数:
            session_id: Session ID
        """
        pass

