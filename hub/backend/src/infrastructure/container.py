"""
依赖注入容器

按照六边形架构组装和连接所有依赖。
在这里实例化适配器并注入到应用服务中。
"""
import logging

from src.application.health_service import HealthService
from src.application.application_service import ApplicationService
from src.application.login_service import LoginService
from src.application.logout_service import LogoutService
from src.application.refresh_token_service import RefreshTokenService
from src.application.user_info_service import UserInfoService
from src.adapters.health_adapter import HealthAdapter
from src.adapters.application_adapter import ApplicationAdapter
from src.adapters.session_adapter import SessionAdapter
from src.adapters.oauth2_adapter import OAuth2Adapter
from src.adapters.hydra_adapter import HydraAdapter
from src.adapters.user_management_adapter import UserManagementAdapter
from src.adapters.deploy_manager_adapter import DeployManagerAdapter
from src.adapters.external_service_adapter import (
    DeployInstallerAdapter,
    OntologyManagerAdapter,
    AgentFactoryAdapter,
)
from src.adapters.mock_external_service_adapter import (
    MockDeployInstallerAdapter,
    MockOntologyManagerAdapter,
    MockAgentFactoryAdapter,
)
from src.adapters.mock_application_adapter import MockApplicationAdapter
from src.infrastructure.config.settings import Settings, get_settings

logger = logging.getLogger(__name__)


class Container:
    """
    依赖注入容器。
    
    该容器负责组装所有依赖，并提供工厂方法来创建带有适配器的应用服务。
    """
    
    def __init__(self, settings: Settings = None):
        """
        初始化容器。

        参数:
            settings: 应用配置。如果为 None，则使用默认配置。
        """
        self._settings = settings or get_settings()
        self._health_adapter = None
        self._health_service = None
        self._application_adapter = None
        self._application_service = None
        self._deploy_installer_adapter = None
        self._ontology_manager_adapter = None
        self._agent_factory_adapter = None
        self._session_adapter = None
        self._oauth2_adapter = None
        self._hydra_adapter = None
        self._user_management_adapter = None
        self._deploy_manager_adapter = None
        self._login_service = None
        self._logout_service = None
        self._refresh_token_service = None
        self._user_info_service = None
    
    @property
    def settings(self) -> Settings:
        """获取应用配置。"""
        return self._settings
    
    @property
    def health_adapter(self) -> HealthAdapter:
        """获取健康适配器实例（单例）。"""
        if self._health_adapter is None:
            self._health_adapter = HealthAdapter(self._settings)
        return self._health_adapter
    
    @property
    def health_service(self) -> HealthService:
        """获取健康服务实例（单例）。"""
        if self._health_service is None:
            self._health_service = HealthService(self.health_adapter)
        return self._health_service

    @property
    def application_adapter(self):
        """获取应用适配器实例（单例）。"""
        if self._application_adapter is None:
            if self._settings.use_mock_services:
                logger.info("使用 Mock 应用适配器（内存存储）")
                self._application_adapter = MockApplicationAdapter()
            else:
                self._application_adapter = ApplicationAdapter(self._settings)
        return self._application_adapter

    @property
    def deploy_installer_adapter(self):
        """获取 Deploy Installer 适配器实例（单例）。"""
        if self._deploy_installer_adapter is None:
            if self._settings.use_mock_services:
                logger.info("使用 Mock Deploy Installer 适配器")
                self._deploy_installer_adapter = MockDeployInstallerAdapter()
            else:
                self._deploy_installer_adapter = DeployInstallerAdapter(self._settings)
        return self._deploy_installer_adapter

    @property
    def ontology_manager_adapter(self):
        """获取 Ontology Manager 适配器实例（单例）。"""
        if self._ontology_manager_adapter is None:
            if self._settings.use_mock_services:
                logger.info("使用 Mock Ontology Manager 适配器")
                self._ontology_manager_adapter = MockOntologyManagerAdapter()
            else:
                self._ontology_manager_adapter = OntologyManagerAdapter(self._settings)
        return self._ontology_manager_adapter

    @property
    def agent_factory_adapter(self):
        """获取 Agent Factory 适配器实例（单例）。"""
        if self._agent_factory_adapter is None:
            if self._settings.use_mock_services:
                logger.info("使用 Mock Agent Factory 适配器")
                self._agent_factory_adapter = MockAgentFactoryAdapter()
            else:
                self._agent_factory_adapter = AgentFactoryAdapter(self._settings)
        return self._agent_factory_adapter

    @property
    def session_adapter(self):
        """获取 Session 适配器实例（单例）。"""
        if self._session_adapter is None:
            self._session_adapter = SessionAdapter(self._settings)
        return self._session_adapter

    @property
    def oauth2_adapter(self):
        """获取 OAuth2 适配器实例（单例）。"""
        if self._oauth2_adapter is None:
            self._oauth2_adapter = OAuth2Adapter(self._settings)
        return self._oauth2_adapter

    @property
    def hydra_adapter(self):
        """获取 Hydra 适配器实例（单例）。"""
        if self._hydra_adapter is None:
            self._hydra_adapter = HydraAdapter(self._settings)
        return self._hydra_adapter

    @property
    def user_management_adapter(self):
        """获取 User Management 适配器实例（单例）。"""
        if self._user_management_adapter is None:
            self._user_management_adapter = UserManagementAdapter(self._settings)
        return self._user_management_adapter

    @property
    def deploy_manager_adapter(self):
        """获取 Deploy Manager 适配器实例（单例）。"""
        if self._deploy_manager_adapter is None:
            self._deploy_manager_adapter = DeployManagerAdapter(self._settings)
        return self._deploy_manager_adapter

    @property
    def login_service(self) -> LoginService:
        """获取登录服务实例（单例）。"""
        if self._login_service is None:
            self._login_service = LoginService(
                session_port=self.session_adapter,
                oauth2_port=self.oauth2_adapter,
                hydra_port=self.hydra_adapter,
                user_management_port=self.user_management_adapter,
                deploy_manager_port=self.deploy_manager_adapter,
            )
        return self._login_service

    @property
    def logout_service(self) -> LogoutService:
        """获取登出服务实例（单例）。"""
        if self._logout_service is None:
            self._logout_service = LogoutService(
                session_port=self.session_adapter,
                oauth2_port=self.oauth2_adapter,
                deploy_manager_port=self.deploy_manager_adapter,
            )
        return self._logout_service

    @property
    def refresh_token_service(self) -> RefreshTokenService:
        """获取刷新令牌服务实例（单例）。"""
        if self._refresh_token_service is None:
            self._refresh_token_service = RefreshTokenService(
                session_port=self.session_adapter,
                oauth2_port=self.oauth2_adapter,
            )
        return self._refresh_token_service

    @property
    def user_info_service(self) -> UserInfoService:
        """获取用户信息服务实例（单例）。"""
        if self._user_info_service is None:
            self._user_info_service = UserInfoService(
                hydra_port=self.hydra_adapter,
                user_management_port=self.user_management_adapter,
            )
        return self._user_info_service

    @property
    def application_service(self) -> ApplicationService:
        """获取应用服务实例（单例）。"""
        if self._application_service is None:
            self._application_service = ApplicationService(
                application_port=self.application_adapter,
                deploy_installer_port=self.deploy_installer_adapter,
                ontology_manager_port=self.ontology_manager_adapter,
                agent_factory_port=self.agent_factory_adapter,
                settings=self._settings,
            )
        return self._application_service

    def set_ready(self, ready: bool = True) -> None:
        """
        设置服务就绪状态。

        参数:
            ready: 服务是否就绪。
        """
        self.health_adapter.set_ready(ready)

    async def close(self) -> None:
        """
        关闭容器，释放资源。

        关闭数据库连接池等资源。
        """
        if self._application_adapter is not None:
            await self._application_adapter.close()
        if self._session_adapter is not None:
            await self._session_adapter.close()


# 全局容器实例
_container: Container = None


def get_container() -> Container:
    """
    获取全局容器实例。
    
    返回:
        Container: 容器实例。
    """
    global _container
    if _container is None:
        _container = Container()
    return _container


def init_container(settings: Settings = None) -> Container:
    """
    初始化全局容器。
    
    参数:
        settings: 应用配置。
    
    返回:
        Container: 初始化后的容器。
    """
    global _container
    _container = Container(settings)
    return _container
