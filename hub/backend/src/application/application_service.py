"""
应用服务

应用层服务，负责编排应用管理操作。
该服务使用端口（接口），不依赖任何基础设施细节。
"""
import base64
import io
import json
import logging
import os
import shutil
import tempfile
import zipfile
from typing import List, Optional, BinaryIO
from datetime import datetime
from packaging import version as pkg_version

import yaml

from src.domains.application import (
    Application, ManifestInfo, MicroAppInfo,
    OntologyConfigItem, AgentConfigItem, ReleaseConfigItem
)
from src.ports.application_port import ApplicationPort
from src.ports.external_service_port import (
    DeployInstallerPort,
    OntologyManagerPort,
    AgentFactoryPort,
)
from src.infrastructure.config.settings import Settings

logger = logging.getLogger(__name__)


class ApplicationService:
    """
    应用服务。

    该服务属于应用层，通过端口编排应用管理的业务逻辑。
    """

    def __init__(
        self,
        application_port: ApplicationPort,
        deploy_installer_port: Optional[DeployInstallerPort] = None,
        ontology_manager_port: Optional[OntologyManagerPort] = None,
        agent_factory_port: Optional[AgentFactoryPort] = None,
        settings: Optional[Settings] = None,
    ):
        """
        初始化应用服务。

        参数:
            application_port: 应用端口实现（注入的适配器）
            deploy_installer_port: Deploy Installer 端口（可选）
            ontology_manager_port: Ontology Manager 端口（可选）
            agent_factory_port: Agent Factory 端口（可选）
            settings: 应用配置（可选）
        """
        self._application_port = application_port
        self._deploy_installer_port = deploy_installer_port
        self._ontology_manager_port = ontology_manager_port
        self._agent_factory_port = agent_factory_port
        self._settings = settings

    async def get_all_applications(self, pinned: Optional[bool] = None) -> List[Application]:
        """
        获取所有已安装的应用列表，可按被钉状态过滤。

        参数:
            pinned: 可选，按被钉状态过滤（True=仅被钉，False=仅未被钉，None=不过滤）

        返回:
            List[Application]: 应用列表
        """
        return await self._application_port.get_all_applications(pinned=pinned)

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
        return await self._application_port.get_application_by_key(key)

    async def get_application_basic_info(self, key: str) -> Application:
        """
        获取应用基础信息。

        参数:
            key: 应用包唯一标识

        返回:
            Application: 应用基础信息

        异常:
            ValueError: 当应用不存在时抛出
        """
        return await self._application_port.get_application_by_key(key)

    async def set_application_pinned(self, key: str, pinned: bool) -> Application:
        """
        设置应用是否被钉状态。

        参数:
            key: 应用包唯一标识
            pinned: 是否被钉

        返回:
            Application: 更新后的应用实体

        异常:
            ValueError: 当应用不存在时抛出
        """
        return await self._application_port.set_application_pinned(key=key, pinned=pinned)

    async def get_application_ontologies(
        self,
        key: str,
        auth_token: Optional[str] = None,
    ) -> List[dict]:
        """
        获取应用的业务知识网络详情列表。

        流程：
        1. 通过 key 获取应用的业务知识网络配置项（ontology_config）
        2. 遍历配置项，通过 id 调用外部接口查询业务知识网络详情
        3. 返回业务知识网络详情列表（原始数据）

        参数:
            key: 应用包唯一标识
            auth_token: 认证 Token

        返回:
            List[dict]: 业务知识网络详情列表（原始数据）

        异常:
            ValueError: 当应用不存在时抛出
        """
        application = await self._application_port.get_application_by_key(key)
        
        # 2. 遍历配置项，通过 id 调用外部接口查询详情
        ontologies = []
        for config_item in application.ontology_config:
            try:
                if self._ontology_manager_port:
                    # 调用外部接口查询业务知识网络详情（返回原始数据）
                    kn_data = await self._ontology_manager_port.get_knowledge_network(
                        config_item.id,
                        auth_token=auth_token,
                        business_domain=application.business_domain,
                    )
                    ontologies.append(kn_data)
                else:
                    # 如果没有外部服务端口，返回基本信息
                    ontologies.append({"id": config_item.id})
            except Exception as e:
                logger.warning(f"获取业务知识网络详情失败 (ID: {config_item.id}): {e}")
                # 即使查询失败，也返回基本信息
                ontologies.append({"id": config_item.id})
        
        return ontologies

    async def get_application_agents(
        self,
        key: str,
        auth_token: Optional[str] = None,
    ) -> List[dict]:
        """
        获取应用的智能体详情列表。

        流程：
        1. 通过 key 获取应用的智能体配置项（agent_config）
        2. 遍历配置项，通过 id 调用外部接口查询智能体详情
        3. 返回智能体详情列表（原始数据）

        参数:
            key: 应用包唯一标识
            auth_token: 认证 Token

        返回:
            List[dict]: 智能体详情列表（原始数据）

        异常:
            ValueError: 当应用不存在时抛出
        """
        application = await self._application_port.get_application_by_key(key)
        
        # 2. 遍历配置项，通过 id 调用外部接口查询详情
        agents = []
        for config_item in application.agent_config:
            try:
                if self._agent_factory_port:
                    # 调用外部接口查询智能体详情（返回原始数据）
                    agent_data = await self._agent_factory_port.get_agent(
                        config_item.id,
                        auth_token=auth_token,
                        business_domain=application.business_domain,
                    )
                    agents.append(agent_data)
                else:
                    # 如果没有外部服务端口，返回基本信息
                    agents.append({"id": config_item.id})
            except Exception as e:
                logger.warning(f"获取智能体详情失败 (ID: {config_item.id}): {e}")
                # 即使查询失败，也返回基本信息
                agents.append({"id": config_item.id})
        
        return agents

    async def configure_application(
        self,
        key: str,
        updated_by: str = "",
        updated_by_id: str = "",
    ) -> Application:
        """
        配置应用的业务知识网络和智能体。

        根据应用当前在数据库中的业务知识网络配置 (ontology_config)
        和智能体配置 (agent_config)，将每一项的 is_config 设置为 True。

        参数:
            key: 应用包唯一标识
            updated_by: 更新者用户显示名称
            updated_by_id: 更新者用户ID

        返回:
            Application: 更新后的应用

        异常:
            ValueError: 当应用不存在时抛出
        """
        application = await self._application_port.get_application_by_key(key)

        # 基于现有配置，将 is_config 统一置为 True
        new_ontology_config = [
            OntologyConfigItem(id=item.id, is_config=True)
            for item in application.ontology_config
        ]
        new_agent_config = [
            AgentConfigItem(id=item.id, is_config=True)
            for item in application.agent_config
        ]

        # 更新配置
        return await self._application_port.update_application_config(
            key=application.key,
            ontology_config=new_ontology_config,
            agent_config=new_agent_config,
            updated_by=updated_by,
            updated_by_id=updated_by_id,
        )

    async def install_application(
        self,
        zip_data: BinaryIO,
        updated_by: str = "",
        updated_by_id: str = "",
        auth_token: Optional[str] = None,
    ) -> Application:
        """
        安装应用。

        流程：
        1. 将 zip 数据写入临时文件
        2. 解压并校验安装包结构和 manifest.yaml
        3. 解析 application.key，校验 version
        4. 如果应用已存在，版本号必须大于已上传版本
        5. 解压安装包，上传镜像和 Chart
        6. 导入业务知识网络和 DataAgent 智能体
        7. 更新应用信息

        参数:
            zip_data: ZIP 格式应用安装包数据
            updated_by: 更新者用户显示名称
            updated_by_id: 更新者用户ID

        返回:
            Application: 安装后的应用

        异常:
            ValueError: 当安装包格式错误或版本冲突时抛出
        """
        logger.info(f"[install_application] 开始安装应用，updated_by: {updated_by}")
        temp_dir = None
        try:
            # 创建临时目录
            temp_base = self._settings.temp_dir if self._settings else "/tmp/dip-hub"
            os.makedirs(temp_base, exist_ok=True)
            temp_dir = tempfile.mkdtemp(dir=temp_base)
            logger.info(f"[install_application] 创建临时目录: {temp_dir}")
            
            # 保存 zip 文件
            zip_path = os.path.join(temp_dir, "package.zip")
            with open(zip_path, "wb") as f:
                shutil.copyfileobj(zip_data, f)
            zip_size = os.path.getsize(zip_path)
            logger.info(f"[install_application] ZIP 文件已保存: {zip_path}, 大小: {zip_size} bytes")
            
            # 解压 zip 文件
            extract_dir = os.path.join(temp_dir, "extracted")
            logger.info(f"[install_application] 开始解压 ZIP 文件到: {extract_dir}")
            try:
                with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                    file_list = zip_ref.namelist()
                    logger.info(f"[install_application] ZIP 文件包含 {len(file_list)} 个文件/目录")
                    logger.debug(f"[install_application] ZIP 文件列表: {file_list[:10]}..." if len(file_list) > 10 else f"[install_application] ZIP 文件列表: {file_list}")
                    zip_ref.extractall(extract_dir)
                logger.info(f"[install_application] ZIP 文件解压完成")
            except zipfile.BadZipFile as e:
                logger.error(f"[install_application] ZIP 文件格式错误: {e}", exc_info=True)
                raise ValueError(f"无效的 ZIP 文件格式: {str(e)}")
            except Exception as e:
                logger.error(f"[install_application] 解压 ZIP 文件失败: {e}", exc_info=True)
                raise ValueError(f"解压 ZIP 文件失败: {str(e)}")
            
            # 查找 manifest.yaml（从解压目录逐层查找）
            # 应用包结构：manifest.yaml 同层有 application.key、packages/、ontologies/、agents/
            logger.info(f"[install_application] 开始逐层查找 manifest.yaml 文件")
            manifest_path = self._find_file_bfs(extract_dir, ["manifest.yaml", "manifest.yml"])
            
            if not manifest_path:
                logger.error(f"[install_application] 未找到 manifest.yaml 文件，解压目录内容: {os.listdir(extract_dir) if os.path.exists(extract_dir) else '目录不存在'}")
                raise ValueError("安装包缺少 manifest.yaml 文件")
            
            logger.info(f"[install_application] 找到 manifest.yaml: {manifest_path}")
            
            # manifest.yaml 所在目录即为应用包根目录，同层包含 application.key、packages/、ontologies/、agents/
            manifest_dir = os.path.dirname(manifest_path)
            logger.info(f"[install_application] 应用包根目录: {manifest_dir}")
            
            # application.key 与 manifest.yaml 同层
            app_key_path = os.path.join(manifest_dir, "application.key")
            if not os.path.exists(app_key_path):
                logger.error(f"[install_application] 未找到 application.key 文件，应在 manifest.yaml 同层目录: {manifest_dir}")
                raise ValueError("安装包缺少 application.key 文件（应与 manifest.yaml 同层）")
            
            logger.info(f"[install_application] 找到 application.key: {app_key_path}")
            try:
                with open(app_key_path, "r", encoding="utf-8") as f:
                    app_key = f.read().strip()
                    if not app_key:
                        raise ValueError("application.key 文件为空")
                    logger.info(f"[install_application] 读取 application.key 成功: {app_key}")
            except Exception as e:
                logger.error(f"[install_application] 读取 application.key 失败: {e}", exc_info=True)
                raise ValueError(f"读取 application.key 失败: {str(e)}")
            
            # 读取并解析 manifest.yaml
            logger.info(f"[install_application] 开始读取 manifest.yaml")
            try:
                with open(manifest_path, "r", encoding="utf-8") as f:
                    manifest_content = f.read()
                    logger.debug(f"[install_application] manifest.yaml 内容:\n{manifest_content}")
                    manifest_data = yaml.safe_load(manifest_content)
                    if not manifest_data:
                        raise ValueError("manifest.yaml 文件为空或格式错误")
            except yaml.YAMLError as e:
                logger.error(f"[install_application] manifest.yaml 解析失败: {e}", exc_info=True)
                raise ValueError(f"manifest.yaml 解析失败: {str(e)}")
            except Exception as e:
                logger.error(f"[install_application] 读取 manifest.yaml 失败: {e}", exc_info=True)
                raise ValueError(f"读取 manifest.yaml 失败: {str(e)}")
            
            logger.info(f"[install_application] manifest.yaml 解析成功，开始解析 manifest 数据")
            try:
                manifest = self._parse_manifest(manifest_data, app_key=app_key)
                logger.info(f"[install_application] manifest 解析成功: key={manifest.key}, name={manifest.name}, version={manifest.version}")
            except Exception as e:
                logger.error(f"[install_application] manifest 解析失败: {e}", exc_info=True)
                raise
            
            # 校验版本
            logger.info(f"[install_application] 开始校验版本，key: {manifest.key}, version: {manifest.version}")
            existing_app = await self._application_port.get_application_by_key_optional(manifest.key)
            if existing_app:
                logger.info(f"[install_application] 应用已存在: key={manifest.key}, 当前版本={existing_app.version}, 新版本={manifest.version}")
                if manifest.version == existing_app.version:
                    error_msg = f"版本号冲突: 新版本 {manifest.version} 与已安装版本相同。请更新版本号或先卸载现有应用 (key: {manifest.key})"
                    logger.error(f"[install_application] {error_msg}")
                    raise ValueError(error_msg)
                if not self._is_version_greater(manifest.version, existing_app.version):
                    error_msg = f"版本号冲突: 新版本 {manifest.version} 必须大于已安装版本 {existing_app.version}。当前已安装版本: {existing_app.version} (key: {manifest.key})"
                    logger.error(f"[install_application] {error_msg}")
                    raise ValueError(error_msg)
                logger.info(
                    f"[install_application] 版本校验通过: 新版本 {manifest.version} > 已安装版本 {existing_app.version} (key: {manifest.key})"
                )
            else:
                logger.info(f"[install_application] 应用不存在，将创建新应用: key={manifest.key}")
            
            # 读取图标（从 assets/icons/ 目录自动发现）
            logger.info(f"[install_application] 开始读取图标")
            icon_base64 = None
            icon_path = None
            
            # 查找 assets/icons/ 目录下的图标文件
            icons_dir = os.path.join(manifest_dir, "assets", "icons")
            if os.path.exists(icons_dir) and os.path.isdir(icons_dir):
                icon_files = [f for f in os.listdir(icons_dir) 
                             if f.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico'))]
                if icon_files:
                    # 使用第一个找到的图标文件
                    icon_path = os.path.join("assets", "icons", icon_files[0])
                    logger.info(f"[install_application] 自动找到图标: {icon_path}")
            
            if icon_path:
                icon_full_path = os.path.join(manifest_dir, icon_path)
                logger.info(f"[install_application] 图标路径: {icon_path}")
                logger.debug(f"[install_application] 图标完整路径: {icon_full_path}")
                if os.path.exists(icon_full_path):
                    try:
                        with open(icon_full_path, "rb") as f:
                            icon_data = f.read()
                            icon_base64 = base64.b64encode(icon_data).decode("utf-8")
                            logger.info(f"[install_application] 图标读取成功，大小: {len(icon_data)} bytes")
                    except Exception as e:
                        logger.warning(f"[install_application] 读取图标失败: {e}", exc_info=True)
                else:
                    logger.warning(f"[install_application] 图标文件不存在: {icon_full_path}")
            else:
                logger.info(f"[install_application] 未找到图标文件，跳过图标读取")
            
            # 上传镜像（从 packages/images/ 目录自动发现）
            release_configs = []
            if self._deploy_installer_port:
                # 自动查找 packages/images/ 目录下的镜像文件
                image_paths = []
                images_dir = os.path.join(manifest_dir, "packages", "images")
                if os.path.exists(images_dir) and os.path.isdir(images_dir):
                    image_files = [f for f in os.listdir(images_dir) 
                                  if f.lower().endswith(('.tar', '.tar.gz', '.tgz', '.tar.bz2', '.tar.xz'))]
                    # 构建相对路径
                    image_paths = [os.path.join("packages", "images", f) for f in image_files]
                    logger.info(f"[install_application] 自动找到 {len(image_paths)} 个镜像文件: {image_paths}")
                
                logger.info(f"[install_application] 开始处理镜像，镜像数量: {len(image_paths)}")
                for idx, image_path in enumerate(image_paths, 1):
                    image_full_path = os.path.join(manifest_dir, image_path)
                    logger.info(f"[install_application] 处理镜像 [{idx}/{len(image_paths)}]: {image_path}")
                    logger.debug(f"[install_application] 镜像完整路径: {image_full_path}")
                    if os.path.exists(image_full_path):
                        try:
                            file_size = os.path.getsize(image_full_path)
                            logger.info(f"[install_application] 开始上传镜像: {image_path}, 大小: {file_size} bytes")
                            with open(image_full_path, "rb") as f:
                                await self._deploy_installer_port.upload_image(f, auth_token=auth_token)
                            logger.info(f"[install_application] 镜像上传成功: {image_path}")
                        except Exception as e:
                            logger.error(f"[install_application] 镜像上传失败 ({image_path}): {e}", exc_info=True)
                            raise ValueError(f"镜像上传失败 ({image_path}): {str(e)}")
                    else:
                        logger.error(f"[install_application] 镜像文件不存在: {image_full_path}")
                        raise ValueError(f"镜像文件不存在: {image_path}")
                
                # 上传 Chart 并安装（从 packages/charts/ 目录自动发现）
                # 自动查找 packages/charts/ 目录下的 Chart 文件
                chart_configs = []
                charts_dir = os.path.join(manifest_dir, "packages", "charts")
                if os.path.exists(charts_dir) and os.path.isdir(charts_dir):
                    chart_files = [f for f in os.listdir(charts_dir) 
                                  if f.lower().endswith(('.tgz', '.tar.gz'))]
                    # 为每个 Chart 创建配置对象
                    chart_configs = [{"path": os.path.join("packages", "charts", f)} for f in chart_files]
                    logger.info(f"[install_application] 自动找到 {len(chart_configs)} 个 Chart 文件: {[c['path'] for c in chart_configs]}")
                
                logger.info(f"[install_application] 开始处理 Chart，Chart 数量: {len(chart_configs)}")
                for idx, chart_config in enumerate(chart_configs, 1):
                    chart_path = chart_config.get("path", "")
                    if not chart_path:
                        logger.warning(f"[install_application] Chart 配置缺少 path 字段，跳过: {chart_config}")
                        continue
                    
                    logger.info(f"[install_application] 处理 Chart [{idx}/{len(chart_configs)}]: {chart_path}")
                    chart_full_path = os.path.join(manifest_dir, chart_path)
                    logger.debug(f"[install_application] Chart 完整路径: {chart_full_path}")
                    if os.path.exists(chart_full_path):
                        try:
                            file_size = os.path.getsize(chart_full_path)
                            logger.info(f"[install_application] 开始上传 Chart: {chart_path}, 大小: {file_size} bytes")
                            with open(chart_full_path, "rb") as f:
                                chart_result = await self._deploy_installer_port.upload_chart(f, auth_token=auth_token)
                            logger.info(f"[install_application] Chart 上传成功: {chart_result.chart.name} v{chart_result.chart.version}")
                            
                            # 安装 release
                            release_name = chart_config.get("release_name", chart_result.chart.name)
                            # namespace 优先级：chart 配置 > manifest.release-config.namespace > 默认值
                            namespace = chart_config.get("namespace") or manifest.release_config.get("namespace")
                            values = chart_result.values
                            values["namespace"] = namespace
                            logger.info(f"[install_application] 开始安装 Release: name={release_name}, namespace={namespace}, chart={chart_result.chart.name} v{chart_result.chart.version}")
                            
                            await self._deploy_installer_port.install_release(
                                release_name=release_name,
                                namespace=namespace,
                                chart_name=chart_result.chart.name,
                                chart_version=chart_result.chart.version,
                                values=values,
                                auth_token=auth_token,
                            )
                            release_configs.append(ReleaseConfigItem(name=release_name, namespace=namespace))
                            logger.info(f"[install_application] Release 安装成功: {release_name}, namespace: {namespace}")
                        except Exception as e:
                            logger.error(f"[install_application] Chart 处理失败 ({chart_path}): {e}", exc_info=True)
                            raise ValueError(f"Chart 处理失败 ({chart_path}): {str(e)}")
                    else:
                        logger.error(f"[install_application] Chart 文件不存在: {chart_full_path}")
                        raise ValueError(f"Chart 文件不存在: {chart_path}")
            else:
                logger.warning(f"[install_application] Deploy Installer 端口未配置，跳过镜像和 Chart 上传")
            
            # 导入业务知识网络（从 ontologies 目录读取 JSON 文件）
            logger.info(f"[install_application] 开始导入业务知识网络，business_domain: {manifest.business_domain}")
            ontology_config = []
            if self._ontology_manager_port:
                ontologies_dir = os.path.join(manifest_dir, "ontologies")
                logger.debug(f"[install_application] 业务知识网络目录: {ontologies_dir}")
                if os.path.exists(ontologies_dir) and os.path.isdir(ontologies_dir):
                    files = os.listdir(ontologies_dir)
                    logger.info(f"[install_application] ontologies 目录包含 {len(files)} 个文件: {files}")
                    for filename in files:
                        if filename.endswith(('.json', '.yaml', '.yml')):
                            ontology_file_path = os.path.join(ontologies_dir, filename)
                            logger.info(f"[install_application] 处理业务知识网络文件: {filename}")
                            try:
                                with open(ontology_file_path, "r", encoding="utf-8") as f:
                                    if filename.endswith('.json'):
                                        onto_config = json.load(f)
                                    else:
                                        onto_config = yaml.safe_load(f)
                                
                                logger.debug(f"[install_application] 业务知识网络配置内容: {onto_config}")
                                logger.info(f"[install_application] 开始创建业务知识网络: {filename}")
                                onto_id = await self._ontology_manager_port.create_knowledge_network(
                                    onto_config,
                                    auth_token=auth_token,
                                    business_domain=manifest.business_domain,
                                )
                                if onto_id:
                                    ontology_config.append(OntologyConfigItem(
                                        id=str(onto_id),
                                        is_config=False,  # 安装时默认为未配置
                                    ))
                                    logger.info(f"[install_application] 成功导入业务知识网络: {filename} -> ID: {onto_id}")
                                else:
                                    logger.warning(f"[install_application] 业务知识网络创建返回空 ID: {filename}")
                            except json.JSONDecodeError as e:
                                logger.error(f"[install_application] 业务知识网络 JSON 解析失败 ({filename}): {e}", exc_info=True)
                                raise ValueError(f"业务知识网络配置文件格式错误 ({filename}): {str(e)}")
                            except yaml.YAMLError as e:
                                logger.error(f"[install_application] 业务知识网络 YAML 解析失败 ({filename}): {e}", exc_info=True)
                                raise ValueError(f"业务知识网络配置文件格式错误 ({filename}): {str(e)}")
                            except Exception as e:
                                logger.error(f"[install_application] 导入业务知识网络失败 ({filename}): {e}", exc_info=True)
                                raise ValueError(f"导入业务知识网络失败 ({filename}): {str(e)}")
                else:
                    logger.info(f"[install_application] ontologies 目录不存在或不是目录，跳过业务知识网络导入")
            else:
                logger.warning(f"[install_application] Ontology Manager 端口未配置，跳过业务知识网络导入")
            
            # 导入智能体（从 agents 目录读取 JSON 文件）
            logger.info(f"[install_application] 开始导入智能体，business_domain: {manifest.business_domain}")
            agent_config = []
            if self._agent_factory_port:
                agents_dir = os.path.join(manifest_dir, "agents")
                logger.debug(f"[install_application] 智能体目录: {agents_dir}")
                if os.path.exists(agents_dir) and os.path.isdir(agents_dir):
                    files = os.listdir(agents_dir)
                    logger.info(f"[install_application] agents 目录包含 {len(files)} 个文件: {files}")
                    for filename in files:
                        if filename.endswith(('.json', '.yaml', '.yml')):
                            agent_file_path = os.path.join(agents_dir, filename)
                            logger.info(f"[install_application] 处理智能体文件: {filename}")
                            try:
                                with open(agent_file_path, "r", encoding="utf-8") as f:
                                    if filename.endswith('.json'):
                                        agent_config_data = json.load(f)
                                    else:
                                        agent_config_data = yaml.safe_load(f)
                                
                                logger.debug(f"[install_application] 智能体配置内容: {agent_config_data}")
                                logger.info(f"[install_application] 开始创建智能体: {filename}")
                                agent_result = await self._agent_factory_port.create_agent(
                                    agent_config_data,
                                    auth_token=auth_token,
                                    business_domain=manifest.business_domain,
                                )
                                if agent_result.id:
                                    agent_config.append(AgentConfigItem(
                                        id=str(agent_result.id),
                                        is_config=False,  # 安装时默认为未配置
                                    ))
                                    logger.info(f"[install_application] 成功导入智能体: {filename} -> ID: {agent_result.id}, version: {agent_result.version}")
                                else:
                                    logger.warning(f"[install_application] 智能体创建返回空 ID: {filename}")
                            except json.JSONDecodeError as e:
                                logger.error(f"[install_application] 智能体 JSON 解析失败 ({filename}): {e}", exc_info=True)
                                raise ValueError(f"智能体配置文件格式错误 ({filename}): {str(e)}")
                            except yaml.YAMLError as e:
                                logger.error(f"[install_application] 智能体 YAML 解析失败 ({filename}): {e}", exc_info=True)
                                raise ValueError(f"智能体配置文件格式错误 ({filename}): {str(e)}")
                            except Exception as e:
                                logger.error(f"[install_application] 导入智能体失败 ({filename}): {e}", exc_info=True)
                                raise ValueError(f"导入智能体失败 ({filename}): {str(e)}")
                else:
                    logger.info(f"[install_application] agents 目录不存在或不是目录，跳过智能体导入")
            else:
                logger.warning(f"[install_application] Agent Factory 端口未配置，跳过智能体导入")
            
            # 创建或更新应用
            logger.info(f"[install_application] 开始创建/更新应用记录")
            logger.info(f"[install_application] 应用信息: key={manifest.key}, name={manifest.name}, version={manifest.version}")
            logger.info(f"[install_application] 配置统计: releases={len(release_configs)}, ontologies={len(ontology_config)}, agents={len(agent_config)}")
            
            application = Application(
                id=existing_app.id if existing_app else 0,
                key=manifest.key,
                name=manifest.name,
                description=manifest.description,
                icon=icon_base64,
                version=manifest.version,
                category=manifest.category,
                business_domain=manifest.business_domain,
                micro_app=manifest.micro_app,
                release_config=release_configs,
                ontology_config=ontology_config,
                agent_config=agent_config,
                is_config=False,  # 安装后需要手动配置
                pinned=existing_app.pinned if existing_app else False,
                updated_by=updated_by,
                updated_by_id=updated_by_id,
                updated_at=datetime.now(),
            )
            
            try:
                if existing_app:
                    # 更新现有应用
                    logger.info(f"[install_application] 更新现有应用: key={manifest.key}")
                    result = await self._application_port.update_application(application)
                    logger.info(f"[install_application] 应用更新成功: id={result.id}, key={result.key}")
                else:
                    # 创建新应用
                    logger.info(f"[install_application] 创建新应用: key={manifest.key}")
                    result = await self._application_port.create_application(application)
                    logger.info(f"[install_application] 应用创建成功: id={result.id}, key={result.key}")
                
                logger.info(f"[install_application] 应用安装完成: key={manifest.key}, name={manifest.name}")
                return result
            except Exception as e:
                logger.error(f"[install_application] 保存应用记录失败: {e}", exc_info=True)
                raise ValueError(f"保存应用记录失败: {str(e)}")
        
        except ValueError as e:
            # ValueError 是预期的业务异常，记录错误但不记录堆栈
            logger.error(f"[install_application] 应用安装失败 (业务错误): {str(e)}")
            raise
        except Exception as e:
            # 其他未预期的异常，记录详细堆栈
            logger.error(f"[install_application] 应用安装失败 (未预期错误): {e}", exc_info=True)
            raise ValueError(f"应用安装失败: {str(e)}")
        finally:
            # 清理临时目录
            if temp_dir and os.path.exists(temp_dir):
                logger.debug(f"[install_application] 清理临时目录: {temp_dir}")
                try:
                    shutil.rmtree(temp_dir, ignore_errors=True)
                    logger.debug(f"[install_application] 临时目录清理完成")
                except Exception as e:
                    logger.warning(f"[install_application] 清理临时目录失败: {e}")

    async def uninstall_application(
        self,
        key: str,
        auth_token: Optional[str] = None,
    ) -> bool:
        """
        卸载应用。

        流程：
        1. 获取应用信息
        2. 调用 Deploy Installer 删除 Release
        3. 删除数据库中的应用记录

        参数:
            key: 应用包唯一标识

        返回:
            bool: 是否卸载成功

        异常:
            ValueError: 当应用不存在时抛出
        """
        application = await self._application_port.get_application_by_key(key)

        # 删除 Release
        if self._deploy_installer_port and application.release_config:
            for release_item in application.release_config:
                try:
                    logger.info(f"[uninstall_application] 删除 Release: name={release_item.name}, namespace={release_item.namespace}")
                    await self._deploy_installer_port.delete_release(
                        release_name=release_item.name,
                        namespace=release_item.namespace,
                        auth_token=auth_token,
                    )
                    logger.info(f"[uninstall_application] Release 删除成功: {release_item.name}")
                except Exception as e:
                    logger.warning(f"[uninstall_application] 删除 Release 失败 ({release_item.name}): {e}")

        return await self._application_port.delete_application(key)

    async def create_application(self, application: Application) -> Application:
        """
        创建新应用。

        参数:
            application: 应用实体

        返回:
            Application: 创建后的应用实体

        异常:
            ValueError: 当应用 key 已存在时抛出
        """
        return await self._application_port.create_application(application)

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
        return await self._application_port.update_application(application)

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
        return await self._application_port.delete_application(key)

    def _find_file_bfs(self, root_dir: str, filenames: list) -> Optional[str]:
        """
        从指定目录逐层（广度优先）查找文件。

        参数:
            root_dir: 搜索起始目录
            filenames: 要查找的文件名列表（按优先级排序）

        返回:
            Optional[str]: 找到的文件完整路径，未找到返回 None
        """
        from collections import deque
        
        logger.info(f"[_find_file_bfs] 开始查找文件: {filenames}, 起始目录: {root_dir}")
        
        if not os.path.exists(root_dir):
            logger.error(f"[_find_file_bfs] 起始目录不存在: {root_dir}")
            return None
        
        if not os.path.isdir(root_dir):
            logger.error(f"[_find_file_bfs] 起始路径不是目录: {root_dir}")
            return None
        
        queue = deque([root_dir])
        searched_dirs = []
        
        while queue:
            current_dir = queue.popleft()
            searched_dirs.append(current_dir)
            
            try:
                entries = os.listdir(current_dir)
                logger.debug(f"[_find_file_bfs] 搜索目录: {current_dir}, 内容: {entries}")
            except (PermissionError, OSError) as e:
                logger.warning(f"[_find_file_bfs] 无法读取目录 {current_dir}: {e}")
                continue
            
            # 在当前目录查找目标文件
            for filename in filenames:
                if filename in entries:
                    file_path = os.path.join(current_dir, filename)
                    if os.path.isfile(file_path):
                        logger.info(f"[_find_file_bfs] 找到文件: {file_path}")
                        return file_path
                    else:
                        logger.debug(f"[_find_file_bfs] {filename} 存在但不是文件: {file_path}")
            
            # 将子目录加入队列（排序以保证一致性）
            subdirs = sorted([e for e in entries if os.path.isdir(os.path.join(current_dir, e))])
            for entry in subdirs:
                entry_path = os.path.join(current_dir, entry)
                queue.append(entry_path)
        
        logger.warning(f"[_find_file_bfs] 未找到文件 {filenames}，已搜索 {len(searched_dirs)} 个目录")
        return None

    def _parse_manifest(self, data: dict, app_key: str) -> ManifestInfo:
        """
        解析 manifest 数据。

        参数:
            data: manifest 字典数据
            app_key: 从 application.key 文件读取的应用唯一标识

        返回:
            ManifestInfo: 解析后的 manifest 信息

        异常:
            ValueError: 当必填字段缺失时抛出
        """
        if not app_key:
            raise ValueError("application.key 不能为空")
        
        name = data.get("name")
        version = data.get("version")
        manifest_version = data.get("manifest_version", 1)
        
        if not name:
            raise ValueError("manifest.yaml 缺少 name 字段")
        if not version:
            raise ValueError("manifest.yaml 缺少 version 字段")
        
        # 解析 micro-app 配置
        micro_app = None
        micro_app_data = data.get("micro-app")
        if micro_app_data:
            micro_app_name = micro_app_data.get("name")
            micro_app_entry = micro_app_data.get("entry")
            if not micro_app_name:
                raise ValueError("manifest.yaml 中 micro-app.name 字段缺失")
            if not micro_app_entry:
                raise ValueError("manifest.yaml 中 micro-app.entry 字段缺失")
            micro_app = MicroAppInfo(
                name=micro_app_name,
                entry=micro_app_entry,
                headless=micro_app_data.get("headless", False),
            )
        
        # 解析 release-config 配置（namespace 为必填字段）
        release_config = data.get("release-config") or {}
        if not release_config.get("namespace"):
            raise ValueError("manifest.yaml 缺少 release-config.namespace 字段")
        
        return ManifestInfo(
            key=app_key,  # 使用从 application.key 文件读取的值
            name=name,
            version=version,
            manifest_version=manifest_version,
            description=data.get("description"),
            category=data.get("category"),
            business_domain=data.get("business-domain", "db_public"),
            micro_app=micro_app,
            release_config=release_config,
        )

    def _is_version_greater(self, new_version: str, old_version: Optional[str]) -> bool:
        """
        检查新版本是否大于旧版本。

        参数:
            new_version: 新版本号
            old_version: 旧版本号

        返回:
            bool: 新版本是否大于旧版本
        """
        if not old_version:
            return True
        
        try:
            return pkg_version.parse(new_version) > pkg_version.parse(old_version)
        except Exception:
            # 无法解析版本号时，使用字符串比较
            return new_version > old_version
