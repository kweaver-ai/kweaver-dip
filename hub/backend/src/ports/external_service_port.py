"""
外部服务端口接口

定义与外部服务交互的抽象接口（端口）。
遵循六边形架构模式，这些端口定义了应用层与外部服务之间的契约。
"""
from abc import ABC, abstractmethod
from typing import List, Optional, BinaryIO
from dataclasses import dataclass


@dataclass
class ImageUploadResult:
    """镜像上传结果。"""
    from_name: str
    to_name: str


@dataclass
class ChartInfo:
    """Chart 信息。"""
    name: str
    version: str


@dataclass
class ChartUploadResult:
    """Chart 上传结果。"""
    chart: ChartInfo
    values: dict


@dataclass
class ReleaseResult:
    """Release 安装/更新结果。"""
    values: dict


@dataclass
class KnowledgeNetworkInfo:
    """业务知识网络信息。"""
    id: str
    name: str
    comment: Optional[str] = None


@dataclass
class AgentFactoryResult:
    """Agent Factory 创建结果。"""
    id: str
    version: str


@dataclass
class AgentInfo:
    """Agent 信息。"""
    id: str
    name: Optional[str] = None
    description: Optional[str] = None


class DeployInstallerPort(ABC):
    """
    Deploy Installer 服务端口接口。

    负责与 Deploy Installer 服务交互，处理镜像上传、Chart 上传和 Release 管理。
    """

    @abstractmethod
    async def upload_image(
        self,
        image_data: BinaryIO,
        auth_token: Optional[str] = None,
    ) -> List[ImageUploadResult]:
        """
        上传镜像。

        参数:
            image_data: 镜像数据（OCI archive 格式的 tar 文件）

        返回:
            List[ImageUploadResult]: 上传的镜像列表
        """
        pass

    @abstractmethod
    async def upload_chart(
        self,
        chart_data: BinaryIO,
        auth_token: Optional[str] = None,
    ) -> ChartUploadResult:
        """
        上传 Chart。

        参数:
            chart_data: Chart 数据（标准 helm chart v2 文件）

        返回:
            ChartUploadResult: Chart 上传结果
        """
        pass

    @abstractmethod
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
        安装/更新 Release。

        参数:
            release_name: 实例名
            namespace: 命名空间
            chart_name: Chart 名称
            chart_version: Chart 版本
            values: 配置值
            set_registry: 是否配置镜像仓库地址

        返回:
            ReleaseResult: Release 结果
        """
        pass

    @abstractmethod
    async def delete_release(
        self,
        release_name: str,
        namespace: str,
        auth_token: Optional[str] = None,
    ) -> ReleaseResult:
        """
        删除 Release。

        参数:
            release_name: 实例名
            namespace: 命名空间

        返回:
            ReleaseResult: Release 删除结果
        """
        pass


class OntologyManagerPort(ABC):
    """
    Ontology Manager 服务端口接口。

    负责与 Ontology Manager 服务交互，处理业务知识网络的创建和查询。
    """

    @abstractmethod
    async def get_knowledge_network(
        self,
        kn_id: str,
        auth_token: Optional[str] = None,
        business_domain: Optional[str] = None,
    ) -> dict:
        """
        获取业务知识网络详情。

        参数:
            kn_id: 业务知识网络 ID
            auth_token: 认证令牌
            business_domain: 业务域，默认为 None

        返回:
            dict: 业务知识网络信息（原始数据）

        异常:
            ValueError: 当业务知识网络不存在时抛出
        """
        pass

    @abstractmethod
    async def create_knowledge_network(
        self,
        data: dict,
        auth_token: Optional[str] = None,
        business_domain: Optional[str] = None,
    ) -> str:
        """
        创建业务知识网络。

        参数:
            data: 创建请求数据
            auth_token: 认证令牌
            business_domain: 业务域，默认为 None

        返回:
            str: 创建的业务知识网络 ID
        """
        pass


class AgentFactoryPort(ABC):
    """
    Agent Factory 服务端口接口。

    负责与 Agent Factory 服务交互，处理智能体的创建和查询。
    """

    @abstractmethod
    async def get_agent(
        self,
        agent_id: str,
        auth_token: Optional[str] = None,
        business_domain: Optional[str] = None,
    ) -> dict:
        """
        获取智能体详情。

        参数:
            agent_id: 智能体 ID
            auth_token: 认证令牌
            business_domain: 业务域，默认为 None

        返回:
            dict: 智能体信息（原始数据）

        异常:
            ValueError: 当智能体不存在时抛出
        """
        pass

    @abstractmethod
    async def create_agent(
        self,
        data: dict,
        auth_token: Optional[str] = None,
        business_domain: Optional[str] = None,
    ) -> AgentFactoryResult:
        """
        创建智能体。

        参数:
            data: 创建请求数据
            auth_token: 认证令牌
            business_domain: 业务域，默认为 None

        返回:
            AgentFactoryResult: 创建结果
        """
        pass

