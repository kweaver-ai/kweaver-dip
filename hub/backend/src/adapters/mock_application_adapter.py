"""
Mock 应用适配器

用于本地开发和测试时模拟数据库操作。
"""
import logging
from typing import List, Optional
from datetime import datetime
from copy import deepcopy

from src.domains.application import Application, MicroAppInfo, OntologyConfigItem, AgentConfigItem, ReleaseConfigItem
from src.ports.application_port import ApplicationPort

logger = logging.getLogger(__name__)


class MockApplicationAdapter(ApplicationPort):
    """
    Mock 应用适配器。

    使用内存存储模拟数据库操作。
    """

    def __init__(self):
        """初始化 Mock 适配器。"""
        self._applications = {}
        self._next_id = 1
        
        # 预置一些模拟数据
        self._add_sample_data()
        
        logger.info("Mock 应用适配器已初始化")

    def _add_sample_data(self):
        """添加示例数据。"""
        sample_apps = [
            Application(
                id=1,
                key="itops-analysis",
                name="智能故障分析",
                description="DIP for ITOps 运维大脑应用，提供智能故障诊断和根因分析能力",
                icon=None,
                version="1.0.0",
                category="DIP for ITOps",
                micro_app=MicroAppInfo(
                    name="intelligent_fault_analysis",
                    entry="/intelligent_fault_analysis",
                    headless=False,
                ),
                release_config=[ReleaseConfigItem(name="itops-analysis-release", namespace="default")],
                ontology_config=[
                    OntologyConfigItem(id="1", is_config=True),
                    OntologyConfigItem(id="2", is_config=True),
                ],
                agent_config=[
                    AgentConfigItem(id="1", is_config=True),
                ],
                is_config=True,
                pinned=False,
                updated_by="system",
                updated_at=datetime.now(),
            ),
            Application(
                id=2,
                key="security-monitor",
                name="安全监控助手",
                description="实时安全事件监控和威胁分析应用",
                icon=None,
                version="2.1.0",
                category="安全运营",
                micro_app=None,
                release_config=[ReleaseConfigItem(name="security-monitor-release", namespace="default")],
                ontology_config=[],
                agent_config=[],
                is_config=False,
                pinned=False,
                updated_by="system",
                updated_at=datetime.now(),
            ),
        ]
        
        for app in sample_apps:
            self._applications[app.key] = app
        
        self._next_id = len(sample_apps) + 1

    async def get_all_applications(self, pinned: Optional[bool] = None) -> List[Application]:
        """
        获取所有已安装的应用列表，可按被钉状态过滤。
        """
        apps = list(self._applications.values())
        if pinned is not None:
            apps = [a for a in apps if getattr(a, 'pinned', False) == pinned]
        apps.sort(key=lambda x: x.updated_at or datetime.min, reverse=True)
        logger.info(f"[Mock] 获取应用列表: {len(apps)} 个应用")
        return apps

    async def set_application_pinned(self, key: str, pinned: bool) -> Application:
        """设置应用是否被钉状态。"""
        if key not in self._applications:
            raise ValueError(f"应用不存在: {key}")
        app = self._applications[key]
        app.pinned = pinned
        app.updated_at = datetime.now()
        logger.info(f"[Mock] 设置应用被钉状态: key={key}, pinned={pinned}")
        return deepcopy(app)

    async def get_application_by_key(self, key: str) -> Application:
        """
        根据应用唯一标识获取应用信息。

        参数:
            key: 应用包唯一标识

        返回:
            Application: 应用实体

        异常:
            ValueError: 当应用不存在时抛出
        """
        if key in self._applications:
            logger.info(f"[Mock] 获取应用: {key}")
            return deepcopy(self._applications[key])
        
        logger.warning(f"[Mock] 应用不存在: {key}")
        raise ValueError(f"应用不存在: {key}")

    async def get_application_by_key_optional(self, key: str) -> Optional[Application]:
        """
        根据应用唯一标识获取应用信息（可选）。

        参数:
            key: 应用包唯一标识

        返回:
            Optional[Application]: 应用实体，不存在时返回 None
        """
        if key in self._applications:
            return deepcopy(self._applications[key])
        return None

    async def create_application(self, application: Application) -> Application:
        """
        创建新应用。

        参数:
            application: 应用实体

        返回:
            Application: 创建后的应用实体（包含生成的 ID）

        异常:
            ValueError: 当应用 key 已存在时抛出
        """
        if application.key in self._applications:
            raise ValueError(f"应用已存在: {application.key}")
        
        application.id = self._next_id
        self._next_id += 1
        application.updated_at = application.updated_at or datetime.now()
        
        self._applications[application.key] = deepcopy(application)
        logger.info(f"[Mock] 创建应用: {application.key} (ID: {application.id})")
        
        return application

    async def update_application(self, application: Application) -> Application:
        """
        更新应用信息。

        参数:
            application: 应用实体

        返回:
            Application: 更新后的应用实体

        异常:
            ValueError: 当应用不存在时抛出
        """
        if application.key not in self._applications:
            raise ValueError(f"应用不存在: {application.key}")
        
        application.updated_at = application.updated_at or datetime.now()
        self._applications[application.key] = deepcopy(application)
        logger.info(f"[Mock] 更新应用: {application.key}")
        
        return application

    async def update_application_config(
        self,
        key: str,
        ontology_config: List[OntologyConfigItem],
        agent_config: List[AgentConfigItem],
        updated_by: str,
        updated_by_id: str = ""
    ) -> Application:
        """
        更新应用配置（业务知识网络和智能体）。

        参数:
            key: 应用唯一标识
            ontology_config: 业务知识网络配置列表
            agent_config: 智能体配置列表
            updated_by: 更新者用户显示名称
            updated_by_id: 更新者用户ID

        返回:
            Application: 更新后的应用实体

        异常:
            ValueError: 当应用不存在时抛出
        """
        if key not in self._applications:
            raise ValueError(f"应用不存在: {key}")
        
        app = self._applications[key]
        app.ontology_config = ontology_config
        app.agent_config = agent_config
        app.is_config = True
        app.updated_by = updated_by
        app.updated_by_id = updated_by_id
        app.updated_at = datetime.now()
        
        logger.info(f"[Mock] 更新应用配置: {key}, ontologies={[item.id for item in ontology_config]}, agents={[item.id for item in agent_config]}")
        
        return deepcopy(app)

    async def delete_application(self, key: str) -> bool:
        """
        删除应用。

        参数:
            key: 应用包唯一标识

        返回:
            bool: 是否删除成功

        异常:
            ValueError: 当应用不存在时抛出
        """
        if key not in self._applications:
            raise ValueError(f"应用不存在: {key}")
        
        del self._applications[key]
        logger.info(f"[Mock] 删除应用: {key}")
        
        return True

    async def close(self):
        """关闭适配器（Mock 不需要实际关闭操作）。"""
        logger.info("[Mock] 应用适配器已关闭")

