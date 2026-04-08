"""
Deploy Manager 适配器

实现 DeployManagerPort 接口，从环境变量（Settings）读取外部访问地址。
"""
import logging

from src.ports.deploy_manager_port import DeployManagerPort, GetHostResponse
from src.infrastructure.config.settings import Settings

logger = logging.getLogger(__name__)


class DeployManagerAdapter(DeployManagerPort):
    """
    Deploy Manager 适配器。

    从 Settings 中的 access_address_* 配置读取外部访问地址，
    不再依赖 deploy-management 远程服务。
    """

    def __init__(self, settings: Settings):
        """
        初始化适配器。

        参数:
            settings: 应用配置
        """
        self._settings = settings

    async def get_host(self) -> GetHostResponse:
        """
        从环境变量配置中获取主机信息。

        返回:
            GetHostResponse: 主机信息
        """
        return GetHostResponse(
            host=self._settings.access_address_host,
            port=self._settings.access_address_port,
            scheme=self._settings.access_address_scheme,
        )

