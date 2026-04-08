"""
外部服务适配器

实现外部服务端口接口的 HTTP 客户端适配器。
负责与 Deploy Installer、Ontology Manager、Agent Factory 服务交互。
"""
import logging
import asyncio
from typing import List, BinaryIO, Optional
import aiohttp
from aiohttp import ClientError, ClientTimeout

from src.ports.external_service_port import (
    DeployInstallerPort,
    OntologyManagerPort,
    AgentFactoryPort,
    ImageUploadResult,
    ChartInfo,
    ChartUploadResult,
    ReleaseResult,
    AgentFactoryResult,
)
from src.infrastructure.config.settings import Settings
from src.infrastructure.context.token_context import get_auth_token

logger = logging.getLogger(__name__)


def _build_headers(
    auth_token: Optional[str] = None,
    business_domain: Optional[str] = None,
) -> dict:
    """
    构建 HTTP 请求头。
    
    参数:
        auth_token: 认证令牌
        business_domain: 业务域，如果提供则添加到 X-Business-Domain header
        
    返回:
        dict: 请求头字典
    """
    headers = {}
    token = get_auth_token() or auth_token
    if token:
        headers["Authorization"] = token
    if business_domain:
        headers["X-Business-Domain"] = business_domain
    return headers


def _handle_http_error(
    operation: str,
    url: str,
    e: Exception,
    service_url: str = "",
    timeout: int = 0,
) -> None:
    """
    处理 HTTP 请求错误。
    
    参数:
        operation: 操作名称
        url: 请求 URL
        e: 异常对象
        service_url: 服务地址
        timeout: 超时时间
    """
    if isinstance(e, (aiohttp.ClientConnectorError, aiohttp.ClientConnectionError)):
        logger.error(
            f"[{operation}] 连接失败: 无法连接到 {url}\n"
            f"  错误详情: {e}\n"
            f"  服务地址: {service_url}\n"
            f"  完整URL: {url}\n"
            f"  超时设置: {timeout}s"
        )
        raise ConnectionError(
            f"无法连接到服务: {url}。"
            f"请检查服务地址配置是否正确: {service_url}"
        ) from e
    elif isinstance(e, (aiohttp.ServerTimeoutError, asyncio.TimeoutError)):
        logger.error(f"[{operation}] 请求超时: {url}, timeout={timeout}s")
        raise TimeoutError(f"请求超时: {url} (超时时间: {timeout}s)") from e
    elif isinstance(e, aiohttp.ClientResponseError):
        logger.error(
            f"[{operation}] HTTP 错误: {e.status}\n"
            f"  响应内容: {e.message if hasattr(e, 'message') else '<no message>'}"
        )
        raise
    else:
        logger.exception(f"[{operation}] 发生未知错误: {e}")
        raise


class DeployInstallerAdapter(DeployInstallerPort):
    """
    Deploy Installer 服务适配器。

    使用 HTTP 客户端与 Deploy Installer 服务交互。
    """

    def __init__(self, settings: Settings):
        """
        初始化适配器。

        参数:
            settings: 应用配置
        """
        self._settings = settings
        self._base_url = f"{settings.proton_url}/internal/api/deploy-installer/v1"
        self._timeout = settings.proton_timeout

    async def upload_image(
        self,
        image_data: BinaryIO,
        auth_token: Optional[str] = None,
    ) -> List[ImageUploadResult]:
        """
        上传镜像。

        参数:
            image_data: 镜像数据

        返回:
            List[ImageUploadResult]: 上传的镜像列表
        """
        url = f"{self._base_url}/agents/image"
        headers = _build_headers(auth_token)
        headers["Content-Type"] = "application/octet-stream"

        try:
            # 确保文件指针在开头
            image_data.seek(0)
            # 读取文件内容
            content = image_data.read()
            file_size = len(content)
            logger.info(f"[upload_image] 开始上传镜像到: {url}, 大小: {file_size} bytes ({file_size / 1024 / 1024:.2f} MB), timeout={self._timeout}s")
            
            # 对于大文件，动态调整超时时间
            calculated_timeout = max(self._timeout, 120 + (file_size // (1024 * 1024)) * 3)
            timeout = ClientTimeout(total=calculated_timeout, connect=30.0)
            
            async with aiohttp.ClientSession(timeout=timeout) as session:
                async with session.put(
                    url,
                    data=content,
                    headers=headers,
                ) as response:
                    response.raise_for_status()
                    data = await response.json()
        except Exception as e:
            _handle_http_error(
                "upload_image",
                url,
                e,
                self._settings.proton_url,
                self._timeout,
            )
            raise  # 如果 _handle_http_error 没有抛出异常，这里确保抛出
        images = data.get("images", [])
        
        return [
            ImageUploadResult(
                from_name=img.get("from", ""),
                to_name=img.get("to", ""),
            )
            for img in images
        ]

    async def upload_chart(
        self,
        chart_data: BinaryIO,
        auth_token: Optional[str] = None,
    ) -> ChartUploadResult:
        """
        上传 Chart。

        参数:
            chart_data: Chart 数据

        返回:
            ChartUploadResult: Chart 上传结果
        """
        url = f"{self._base_url}/agents/chart"
        headers = _build_headers(auth_token)
        headers["Content-Type"] = "application/octet-stream"

        try:
            # 确保文件指针在开头
            chart_data.seek(0)
            # 读取文件内容
            content = chart_data.read()
            file_size = len(content)
            logger.info(f"[upload_chart] 开始上传 Chart 到: {url}, 大小: {file_size} bytes ({file_size / 1024 / 1024:.2f} MB), timeout={self._timeout}s")
            
            # 对于大文件，动态调整超时时间
            calculated_timeout = max(self._timeout, 120 + (file_size // (1024 * 1024)) * 3)
            timeout = ClientTimeout(total=calculated_timeout, connect=30.0)
            
            async with aiohttp.ClientSession(timeout=timeout) as session:
                async with session.put(
                    url,
                    data=content,
                    headers=headers,
                ) as response:
                    response.raise_for_status()
                    data = await response.json()
        except Exception as e:
            _handle_http_error(
                "upload_chart",
                url,
                e,
                self._settings.proton_url,
                self._timeout,
            )
            raise
        chart_data = data.get("chart", {})
        
        return ChartUploadResult(
            chart=ChartInfo(
                name=chart_data.get("name", ""),
                version=chart_data.get("version", ""),
            ),
            values=data.get("values", {}),
        )

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
        url = f"{self._base_url}/agents/release/{release_name}"
        params = {
            "namespace": namespace,
            "set-registry": str(set_registry).lower(),
        }
        body = {
            "name": chart_name,
            "version": chart_version,
            "values": values,
        }
        
        headers = _build_headers(auth_token)

        try:
            logger.info(f"[install_release] 安装 Release: {url}, release_name={release_name}")
            timeout = ClientTimeout(total=self._timeout, connect=30.0)
            async with aiohttp.ClientSession(timeout=timeout) as session:
                async with session.post(
                    url,
                    params=params,
                    json=body,
                    headers=headers or None,
                ) as response:
                    response.raise_for_status()
                    data = await response.json()
        except Exception as e:
            _handle_http_error(
                "install_release",
                url,
                e,
                self._settings.proton_url,
                self._timeout,
            )
            raise
        
        return ReleaseResult(values=data.get("values", {}))

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
        url = f"{self._base_url}/agents/release/{release_name}"
        params = {"namespace": namespace}
        
        headers = _build_headers(auth_token)

        try:
            logger.info(f"[delete_release] 删除 Release: {url}, release_name={release_name}")
            timeout = ClientTimeout(total=self._timeout, connect=30.0)
            async with aiohttp.ClientSession(timeout=timeout) as session:
                async with session.delete(url, params=params, headers=headers or None) as response:
                    response.raise_for_status()
                    data = await response.json()
        except Exception as e:
            _handle_http_error(
                "delete_release",
                url,
                e,
                self._settings.proton_url,
                self._timeout,
            )
            raise
        
        return ReleaseResult(values=data.get("values", {}))


class OntologyManagerAdapter(OntologyManagerPort):
    """
    Ontology Manager 服务适配器。

    使用 HTTP 客户端与 Ontology Manager 服务交互。
    """

    def __init__(self, settings: Settings):
        """
        初始化适配器。

        参数:
            settings: 应用配置
        """
        self._settings = settings
        self._base_url = f"{settings.ontology_manager_url}/api/ontology-manager/v1"
        self._timeout = settings.ontology_manager_timeout

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
            business_domain: 业务域

        返回:
            dict: 业务知识网络信息（原始数据）

        异常:
            ValueError: 当业务知识网络不存在时抛出
        """
        url = f"{self._base_url}/knowledge-networks/{kn_id}?include_details=true&include_statistics=true"
        
        headers = _build_headers(auth_token, business_domain)

        try:
            timeout = ClientTimeout(total=self._timeout, connect=30.0)
            async with aiohttp.ClientSession(timeout=timeout) as session:
                async with session.get(url, headers=headers or None) as response:
                    if response.status == 404:
                        raise ValueError(f"业务知识网络不存在: {kn_id}")
                    
                    response.raise_for_status()
                    data = await response.json()
        except ValueError:
            raise
        except Exception as e:
            _handle_http_error(
                "get_knowledge_network",
                url,
                e,
                self._settings.ontology_manager_url,
                self._timeout,
            )
            raise
        
        return data

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
            business_domain: 业务域

        返回:
            str: 创建的业务知识网络 ID
        """
        url = f"{self._base_url}/knowledge-networks?import_networks=overwrite"
        
        headers = _build_headers(auth_token, business_domain)

        try:
            timeout = ClientTimeout(total=self._timeout, connect=30.0)
            async with aiohttp.ClientSession(timeout=timeout) as session:
                async with session.post(url, json=data, headers=headers or None) as response:
                    response.raise_for_status()
                    result = await response.json()
        except Exception as e:
            _handle_http_error(
                "create_knowledge_network",
                url,
                e,
                self._settings.ontology_manager_url,
                self._timeout,
            )
            raise
        
        # 返回的是 ID 数组
        if isinstance(result, list) and len(result) > 0:
            return result[0].get("id", "")
        return ""


class AgentFactoryAdapter(AgentFactoryPort):
    """
    Agent Factory 服务适配器。

    使用 HTTP 客户端与 Agent Factory 服务交互。
    """

    def __init__(self, settings: Settings):
        """
        初始化适配器。

        参数:
            settings: 应用配置
        """
        self._settings = settings
        self._base_url = f"{settings.agent_factory_url}/api/agent-factory/v3"
        self._timeout = settings.agent_factory_timeout

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
            business_domain: 业务域

        返回:
            dict: 智能体信息（原始数据）

        异常:
            ValueError: 当智能体不存在时抛出
        """
        url = f"{self._base_url}/agent/{agent_id}"
        
        headers = _build_headers(auth_token, business_domain)

        try:
            timeout = ClientTimeout(total=self._timeout, connect=30.0)
            async with aiohttp.ClientSession(timeout=timeout) as session:
                async with session.get(url, headers=headers or None) as response:
                    if response.status == 404:
                        raise ValueError(f"智能体不存在: {agent_id}")
                    
                    response.raise_for_status()
                    data = await response.json()
        except ValueError:
            raise
        except Exception as e:
            _handle_http_error(
                "get_agent",
                url,
                e,
                self._settings.agent_factory_url,
                self._timeout,
            )
            raise
        
        return data

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
            business_domain: 业务域

        返回:
            AgentFactoryResult: 创建结果
        """
        url = f"{self._base_url}/agent"
        
        headers = _build_headers(auth_token, business_domain)

        try:
            timeout = ClientTimeout(total=self._timeout, connect=30.0)
            async with aiohttp.ClientSession(timeout=timeout) as session:
                async with session.post(url, json=data, headers=headers or None) as response:
                    response.raise_for_status()
                    result = await response.json()
        except Exception as e:
            _handle_http_error(
                "create_agent",
                url,
                e,
                self._settings.agent_factory_url,
                self._timeout,
            )
            raise
        
        return AgentFactoryResult(
            id=result.get("id", ""),
            version=result.get("version", "v0"),
        )

