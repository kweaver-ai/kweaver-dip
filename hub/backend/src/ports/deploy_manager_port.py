"""
Deploy Manager 端口接口

定义部署管理操作的抽象接口（端口）。
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class GetHostResponse:
    """获取主机信息响应"""
    host: str
    port: str
    scheme: str = "https"


class DeployManagerPort(ABC):
    """
    Deploy Manager 端口接口。

    这是一个输出端口（被驱动端口），定义了应用程序与部署管理服务的交互方式。
    """

    @abstractmethod
    async def get_host(self) -> GetHostResponse:
        """
        获取主机信息。

        返回:
            GetHostResponse: 主机信息

        异常:
            Exception: 当获取失败时抛出
        """
        pass

