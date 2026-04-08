"""
应用领域模型

定义应用相关的领域模型和实体。
"""
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional, List


@dataclass
class MicroAppInfo:
    """
    微应用信息。

    属性:
        name: 微应用包名
        entry: 微应用入口路径
        headless: 是否不显示导航头（false: 显示导航头，true: 不显示导航头）
    """
    name: str
    entry: str
    headless: bool = False


@dataclass
class OntologyConfigItem:
    """
    业务知识网络配置项。

    属性:
        id: 业务知识网络 ID
        is_config: 是否已配置
    """
    id: str
    is_config: bool = False


@dataclass
class AgentConfigItem:
    """
    智能体配置项。

    属性:
        id: 智能体 ID
        is_config: 是否已配置
    """
    id: str
    is_config: bool = False


@dataclass
class ReleaseConfigItem:
    """
    Release 配置项。

    属性:
        name: Release 名称
        namespace: Release 所在命名空间
    """
    name: str
    namespace: str


@dataclass
class Application:
    """
    应用领域模型。

    属性:
        id: 应用主键 ID
        key: 应用包唯一标识
        name: 应用名称
        description: 应用描述
        icon: 应用图标（Base64编码字符串）
        version: 当前版本号
        category: 应用所属分类
        business_domain: 业务域，默认为 db_public
        micro_app: 微应用配置信息
        release_config: 应用安装配置（helm release 配置列表，包含 name 和 namespace）
        ontology_config: 业务知识网络配置列表（每个配置项包含 id 和 is_config）
        agent_config: 智能体配置列表（每个配置项包含 id 和 is_config）
        is_config: 是否完成配置
        pinned: 是否被钉（置顶）
        updated_by: 更新者用户显示名称
        updated_by_id: 更新者用户ID
        updated_at: 更新时间
    """
    id: int
    key: str
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None
    version: Optional[str] = None
    category: Optional[str] = None
    business_domain: str = "db_public"
    micro_app: Optional[MicroAppInfo] = None
    release_config: List[ReleaseConfigItem] = field(default_factory=list)
    ontology_config: List[OntologyConfigItem] = field(default_factory=list)
    agent_config: List[AgentConfigItem] = field(default_factory=list)
    is_config: bool = False
    pinned: bool = False
    updated_by: str = ""
    updated_by_id: str = ""
    updated_at: Optional[datetime] = None

    def has_icon(self) -> bool:
        """
        检查应用是否有图标。

        返回:
            bool: 是否有图标
        """
        return self.icon is not None and len(self.icon) > 0

    def is_configured(self) -> bool:
        """
        检查应用是否已完成配置。

        返回:
            bool: 是否完成配置
        """
        return self.is_config

    def has_ontologies(self) -> bool:
        """
        检查应用是否配置了业务知识网络。

        返回:
            bool: 是否有业务知识网络配置
        """
        return len(self.ontology_config) > 0

    def has_agents(self) -> bool:
        """
        检查应用是否配置了智能体。

        返回:
            bool: 是否有智能体配置
        """
        return len(self.agent_config) > 0


@dataclass
class OntologyInfo:
    """
    业务知识网络信息。

    属性:
        id: 业务知识网络 ID
        name: 业务知识网络名称
        description: 业务知识网络描述
    """
    id: int
    name: Optional[str] = None
    description: Optional[str] = None


@dataclass
class AgentInfo:
    """
    智能体信息。

    属性:
        id: 智能体 ID
        name: 智能体名称
        description: 智能体描述
    """
    id: int
    name: Optional[str] = None
    description: Optional[str] = None


@dataclass
class ManifestInfo:
    """
    应用安装包 manifest 信息。

    严格遵循 manifest.yaml 结构：
        manifest_version: manifest 版本号
        name: 应用名称
        micro-app: 微应用配置 (name, entry, headless)
        version: 应用版本号
        category: 应用分类
        description: 应用描述
        business-domain: 业务域，默认为 db_public
        release-config: release 配置 (namespace)

    属性:
        key: 应用唯一标识（从 application.key 文件读取）
        name: 应用名称
        version: 应用版本号
        manifest_version: manifest 版本号
        description: 应用描述
        category: 应用分类
        business_domain: 业务域，默认为 db_public
        micro_app: 微应用配置
        release_config: release 配置（包含 namespace）
    """
    key: str
    name: str
    version: str
    manifest_version: str = "1.0.0"
    description: Optional[str] = None
    category: Optional[str] = None
    business_domain: str = "db_public"
    micro_app: Optional[MicroAppInfo] = None
    release_config: dict = field(default_factory=dict)
