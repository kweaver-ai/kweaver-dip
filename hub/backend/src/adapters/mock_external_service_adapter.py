"""
Mock 外部服务适配器

用于本地开发和测试时模拟外部服务响应。
"""
import logging
from typing import List, BinaryIO, Optional

from src.ports.external_service_port import (
    DeployInstallerPort,
    OntologyManagerPort,
    AgentFactoryPort,
    ImageUploadResult,
    ChartInfo,
    ChartUploadResult,
    ReleaseResult,
    KnowledgeNetworkInfo,
    AgentFactoryResult,
)

logger = logging.getLogger(__name__)


class MockDeployInstallerAdapter(DeployInstallerPort):
    """
    Mock Deploy Installer 服务适配器。

    模拟镜像上传、Chart 上传和 Release 管理操作。
    """

    def __init__(self):
        """初始化 Mock 适配器。"""
        self._releases = {}  # 存储模拟的 release
        self._images = []  # 存储上传的镜像记录
        self._charts = []  # 存储上传的 chart 记录
        logger.info("Mock Deploy Installer 适配器已初始化")

    async def upload_image(
        self,
        image_data: BinaryIO,
        auth_token: Optional[str] = None,
    ) -> List[ImageUploadResult]:
        """
        模拟上传镜像。

        参数:
            image_data: 镜像数据

        返回:
            List[ImageUploadResult]: 模拟的上传结果
        """
        # 读取一些数据来模拟处理
        data = image_data.read()
        size_kb = len(data) / 1024
        
        # 生成模拟的镜像名称
        image_name = f"mock-image-{len(self._images) + 1}"
        result = ImageUploadResult(
            from_name=f"{image_name}:latest",
            to_name=f"registry.local/{image_name}:latest",
        )
        
        self._images.append(result)
        logger.info(f"[Mock] 镜像上传成功: {result.from_name} -> {result.to_name} ({size_kb:.2f} KB)")
        
        return [result]

    async def upload_chart(
        self,
        chart_data: BinaryIO,
        auth_token: Optional[str] = None,
    ) -> ChartUploadResult:
        """
        模拟上传 Chart。

        参数:
            chart_data: Chart 数据

        返回:
            ChartUploadResult: 模拟的上传结果
        """
        data = chart_data.read()
        size_kb = len(data) / 1024
        
        chart_name = f"mock-chart-{len(self._charts) + 1}"
        result = ChartUploadResult(
            chart=ChartInfo(
                name=chart_name,
                version="1.0.0",
            ),
            values={
                "replicaCount": 1,
                "image": {
                    "repository": f"registry.local/{chart_name}",
                    "tag": "latest",
                },
            },
        )
        
        self._charts.append(result)
        logger.info(f"[Mock] Chart 上传成功: {chart_name} v1.0.0 ({size_kb:.2f} KB)")
        
        return result

    async def install_release(
        self,
        release_name: str,
        namespace: str,
        chart_name: str,
        chart_version: str,
        values: dict,
        set_registry: bool = True,
        auth_token: Optional[str] = None,
    ) -> ReleaseResult:
        """
        模拟安装/更新 Release。

        参数:
            release_name: 实例名
            namespace: 命名空间
            chart_name: Chart 名称
            chart_version: Chart 版本
            values: 配置值
            set_registry: 是否配置镜像仓库地址

        返回:
            ReleaseResult: 模拟的安装结果
        """
        key = f"{namespace}/{release_name}"
        self._releases[key] = {
            "chart_name": chart_name,
            "chart_version": chart_version,
            "values": values,
            "status": "deployed",
        }
        
        logger.info(f"[Mock] Release 安装成功: {key} ({chart_name}:{chart_version})")
        
        return ReleaseResult(values=values)

    async def delete_release(
        self,
        release_name: str,
        namespace: str,
        auth_token: Optional[str] = None,
    ) -> ReleaseResult:
        """
        模拟删除 Release。

        参数:
            release_name: 实例名
            namespace: 命名空间

        返回:
            ReleaseResult: 模拟的删除结果
        """
        key = f"{namespace}/{release_name}"
        values = {}
        
        if key in self._releases:
            values = self._releases[key].get("values", {})
            del self._releases[key]
            logger.info(f"[Mock] Release 删除成功: {key}")
        else:
            logger.warning(f"[Mock] Release 不存在: {key}")
        
        return ReleaseResult(values=values)


class MockOntologyManagerAdapter(OntologyManagerPort):
    """
    Mock Ontology Manager 服务适配器。

    模拟业务知识网络的创建和查询操作。
    """

    def __init__(self):
        """初始化 Mock 适配器。"""
        self._knowledge_networks = {}
        self._next_id = 1
        
        # 预置一些模拟数据
        self._knowledge_networks["1"] = KnowledgeNetworkInfo(
            id="1",
            name="IT 运维知识网络",
            comment="包含 IT 运维相关的对象类型和关系",
        )
        self._knowledge_networks["2"] = KnowledgeNetworkInfo(
            id="2",
            name="故障分析知识网络",
            comment="用于故障根因分析的业务知识",
        )
        self._next_id = 3
        
        logger.info("Mock Ontology Manager 适配器已初始化")

    async def get_knowledge_network(
        self,
        kn_id: str,
        auth_token: Optional[str] = None,
        business_domain: Optional[str] = None,
    ) -> dict:
        """
        模拟获取业务知识网络详情。

        参数:
            kn_id: 业务知识网络 ID
            auth_token: 认证令牌
            business_domain: 业务域

        返回:
            dict: 业务知识网络信息（原始数据）

        异常:
            ValueError: 当业务知识网络不存在时抛出
        """
        if kn_id in self._knowledge_networks:
            logger.info(f"[Mock] 获取业务知识网络: {kn_id}")
            kn_info = self._knowledge_networks[kn_id]
            # 返回原始数据格式
            return {
                "id": kn_info.id,
                "name": kn_info.name,
                "comment": kn_info.comment,
            }
        
        logger.warning(f"[Mock] 业务知识网络不存在: {kn_id}")
        raise ValueError(f"业务知识网络不存在: {kn_id}")

    async def create_knowledge_network(
        self,
        data: dict,
        auth_token: Optional[str] = None,
        business_domain: Optional[str] = None,
    ) -> str:
        """
        模拟创建业务知识网络。

        参数:
            data: 创建请求数据
            auth_token: 认证令牌
            business_domain: 业务域

        返回:
            str: 创建的业务知识网络 ID
        """
        kn_id = str(self._next_id)
        self._next_id += 1
        
        name = data.get("name", f"知识网络-{kn_id}")
        comment = data.get("comment", "")
        
        self._knowledge_networks[kn_id] = KnowledgeNetworkInfo(
            id=kn_id,
            name=name,
            comment=comment,
        )
        
        logger.info(f"[Mock] 创建业务知识网络: {kn_id} - {name}")
        
        return kn_id


class MockAgentFactoryAdapter(AgentFactoryPort):
    """
    Mock Agent Factory 服务适配器。

    模拟智能体的创建操作。
    """

    def __init__(self):
        """初始化 Mock 适配器。"""
        self._agents = {}
        self._next_id = 1
        
        # 预置一些模拟数据
        self._agents["1"] = {
            "id": "1",
            "name": "故障诊断智能体",
            "version": "v1",
        }
        self._next_id = 2
        
        logger.info("Mock Agent Factory 适配器已初始化")

    async def get_agent(
        self,
        agent_id: str,
        auth_token: Optional[str] = None,
        business_domain: Optional[str] = None,
    ) -> dict:
        """
        模拟获取智能体详情。

        参数:
            agent_id: 智能体 ID
            auth_token: 认证令牌
            business_domain: 业务域

        返回:
            dict: 智能体信息（原始数据）

        异常:
            ValueError: 当智能体不存在时抛出
        """
        if agent_id not in self._agents:
            raise ValueError(f"智能体不存在: {agent_id}")
        
        agent_data = self._agents[agent_id]
        
        # 返回原始数据格式
        return {
            "id": agent_data["id"],
            "name": agent_data.get("name"),
            "profile": agent_data.get("description", f"智能体 {agent_data['id']} 的描述"),
        }

    async def create_agent(
        self,
        data: dict,
        auth_token: Optional[str] = None,
        business_domain: Optional[str] = None,
    ) -> AgentFactoryResult:
        """
        模拟创建智能体。

        参数:
            data: 创建请求数据
            auth_token: 认证令牌
            business_domain: 业务域

        返回:
            AgentFactoryResult: 创建结果
        """
        agent_id = str(self._next_id)
        self._next_id += 1
        
        name = data.get("name", f"智能体-{agent_id}")
        
        self._agents[agent_id] = {
            "id": agent_id,
            "name": name,
            "version": "v0",
        }
        
        logger.info(f"[Mock] 创建智能体: {agent_id} - {name}")
        
        return AgentFactoryResult(
            id=agent_id,
            version="v0",
        )

