"""
应用配置管理

使用 pydantic-settings 进行配置管理。
配置可以通过环境变量或 .env 文件进行设置。
"""
from functools import lru_cache
from typing import Optional

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    应用配置。
    
    所有配置都可以通过环境变量进行设置。
    环境变量需要以 'DIP_HUB_' 为前缀。
    """
    
    model_config = SettingsConfigDict(
        env_prefix="DIP_HUB_",
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )
    
    # 应用配置
    app_name: str = Field(default="DIP Hub", description="应用名称")
    app_version: str = Field(default="1.0.0", description="应用版本")
    debug: bool = Field(default=False, description="调试模式")
    
    # 服务器配置
    host: str = Field(default="0.0.0.0", description="服务器监听地址")
    port: int = Field(default=8000, description="服务器监听端口")
    workers: int = Field(default=1, description="工作进程数")
    
    # API 配置
    api_prefix: str = Field(default="/api/dip-hub/v1", description="API 前缀")
    
    # 日志配置
    log_level: str = Field(default="INFO", description="日志级别")
    log_format: str = Field(
        default="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        description="日志格式"
    )
    
    # 健康检查配置
    health_check_timeout: int = Field(default=5, description="健康检查超时时间（秒）")

    # 临时文件配置
    temp_dir: str = Field(default="/tmp/dip-hub", description="临时文件目录")

    # 数据库配置
    db_host: str = Field(default="localhost", description="数据库主机")
    db_port: int = Field(default=3306, description="数据库端口")
    db_name: str = Field(default="dip", description="数据库名称")
    db_user: str = Field(default="root", description="数据库用户名")
    db_password: str = Field(default="", description="数据库密码")

    # Proton 部署服务配置
    proton_url: str = Field(default="http://localhost", description="Proton 服务地址")
    proton_timeout: int = Field(default=300, description="Proton 请求超时时间（秒）")

    # Ontology Manager 服务配置
    ontology_manager_url: str = Field(
        default="http://ontology-manager", 
        description="Ontology Manager 服务地址"
    )
    ontology_manager_timeout: int = Field(
        default=60, 
        description="Ontology Manager 请求超时时间（秒）"
    )

    # Agent Factory 服务配置
    agent_factory_url: str = Field(
        default="http://agent-factory", 
        description="Agent Factory 服务地址"
    )
    agent_factory_timeout: int = Field(
        default=60, 
        description="Agent Factory 请求超时时间（秒）"
    )

    # Mock 模式配置
    use_mock_services: bool = Field(
        default=False, 
        description="是否使用 Mock 外部服务（用于本地开发调试）"
    )

    # Redis Sentinel 配置
    redis_sentinel_host: str = Field(default="localhost", description="Redis Sentinel 主机地址")
    redis_sentinel_port: int = Field(default=26379, description="Redis Sentinel 端口")
    redis_sentinel_password: Optional[str] = Field(default=None, description="Redis Sentinel 密码")
    redis_sentinel_username: Optional[str] = Field(default=None, description="Redis Sentinel 用户名")
    redis_master_group_name: str = Field(default="mymaster", description="Redis Sentinel Master 组名")
    redis_password: Optional[str] = Field(default=None, description="Redis 密码")
    redis_username: Optional[str] = Field(default=None, description="Redis 用户名")
    redis_db: int = Field(default=1, description="Redis 数据库编号")
    redis_enable_ssl: bool = Field(default=False, description="Redis 是否启用 SSL")

    # OAuth2 配置（通过启动时自注册获取 client_id 和 client_secret）
    oauth_client_name: str = Field(default="dip-hub", description="OAuth2 客户端名称（用于自注册）")
    oauth_client_id: str = Field(default="", description="OAuth2 客户端 ID（启动时自动注册获取）")
    oauth_client_secret: str = Field(default="", description="OAuth2 客户端 Secret（启动时自动注册获取）")

    # Hydra 配置
    hydra_host: str = Field(
        default="http://lhydra-admin:4445",
        description="Hydra 管理服务地址（Admin API）"
    )
    hydra_public_url: str = Field(
        default="http://hydra-public:4444",
        description="Hydra 公开服务地址（Public API）"
    )
    hydra_timeout: int = Field(default=30, description="Hydra 请求超时时间（秒）")

    # User Management 服务配置
    user_management_url: str = Field(
        default="http://user-management",
        description="User Management 服务地址"
    )
    user_management_timeout: int = Field(
        default=60,
        description="User Management 请求超时时间（秒）"
    )

    # 外部访问地址配置（替代从 deploy-management 服务动态获取）
    access_address_host: str = Field(
        default="127.0.0.1",
        description="外部访问主机地址"
    )
    access_address_port: str = Field(
        default="443",
        description="外部访问端口"
    )
    access_address_scheme: str = Field(
        default="https",
        description="外部访问协议（http/https）"
    )

    # Session Cookie 配置
    cookie_domain: str = Field(default="", description="Cookie 域名")
    cookie_timeout: int = Field(default=3600, description="Cookie 超时时间（秒）")

    # 前端路由配置
    frontend_base_path: str = Field(
        default="/",
        description="前端应用基础路径（用于登录成功/失败后的重定向）"
    )


@lru_cache
def get_settings() -> Settings:
    """
    获取缓存的配置实例。
    
    返回:
        Settings: 应用配置。
    """
    return Settings()
