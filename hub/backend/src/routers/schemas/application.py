"""
应用 API Schema

定义应用相关的 API 请求和响应模型。
"""
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


# ============ 微应用信息响应 ============

class MicroAppResponse(BaseModel):
    """
    微应用信息响应模型。

    对应 manifest.yaml 中的 micro-app 配置。
    """
    name: str = Field(..., description="微应用包名")
    entry: str = Field(..., description="微应用入口路径")
    headless: bool = Field(False, description="是否不显示导航头（false: 显示导航头，true: 不显示导航头）")


# ============ 配置项响应 ============

class OntologyConfigItemResponse(BaseModel):
    """
    业务知识网络配置项响应模型。
    """
    id: str = Field(..., description="业务知识网络 ID")
    is_config: bool = Field(False, description="是否已配置")


class AgentConfigItemResponse(BaseModel):
    """
    智能体配置项响应模型。
    """
    id: str = Field(..., description="智能体 ID")
    is_config: bool = Field(False, description="是否已配置")


class ReleaseConfigItemResponse(BaseModel):
    """
    Release 配置项响应模型。
    """
    name: str = Field(..., description="Release 名称")
    namespace: str = Field(..., description="Release 所在命名空间")


# ============ 应用信息响应 ============

class ApplicationResponse(BaseModel):
    """
    应用响应模型。

    对应 OpenAPI 中的 Application schema。
    """
    key: str = Field(..., description="应用包唯一标识", max_length=32)
    name: str = Field(..., description="应用名称", max_length=128)
    description: Optional[str] = Field(None, description="应用描述", max_length=800)
    icon: Optional[str] = Field(None, description="应用图标，Base64 编码")
    category: Optional[str] = Field(None, description="应用所属分组", max_length=128)
    version: Optional[str] = Field(None, description="应用版本号", max_length=128)
    micro_app: Optional[MicroAppResponse] = Field(None, description="微应用配置")
    release_config: List[ReleaseConfigItemResponse] = Field(default_factory=list, description="应用安装配置（helm release 配置列表，包含 name 和 namespace）")
    ontology_config: List[OntologyConfigItemResponse] = Field(default_factory=list, description="业务知识网络配置列表")
    agent_config: List[AgentConfigItemResponse] = Field(default_factory=list, description="智能体配置列表")
    is_config: bool = Field(False, description="是否完成配置")
    pinned: bool = Field(False, description="是否被钉（置顶）")
    updated_by: str = Field(..., description="更新者用户显示名称", max_length=128)
    updated_by_id: str = Field(..., description="更新者用户ID", max_length=36)
    updated_at: datetime = Field(..., description="更新时间")

    model_config = ConfigDict(from_attributes=True)


# ============ 应用基础信息响应 ============

class ApplicationBasicInfoResponse(BaseModel):
    """
    应用基础信息响应模型。

    对应 OpenAPI 中的 ApplicationBasicInfo schema。
    """
    key: str = Field(..., description="应用唯一标识")
    name: str = Field(..., description="应用名称")
    description: Optional[str] = Field(None, description="应用描述")
    version: Optional[str] = Field(None, description="应用版本号")
    icon: Optional[str] = Field(None, description="应用图标")
    category: Optional[str] = Field(None, description="应用所属分组")
    micro_app: Optional[MicroAppResponse] = Field(None, description="微应用配置")
    is_config: bool = Field(..., description="是否完成配置")
    pinned: bool = Field(False, description="是否被钉（置顶）")
    updated_by: str = Field(..., description="更新者用户显示名称")
    updated_by_id: str = Field(..., description="更新者用户ID")
    updated_at: datetime = Field(..., description="更新时间")

    model_config = ConfigDict(from_attributes=True)


# ============ 设置被钉状态请求 ============

class SetPinnedRequest(BaseModel):
    """设置应用是否被钉的请求体。"""
    pinned: bool = Field(..., description="是否被钉")


# ============ 业务知识网络配置响应 ============

class OntologyInfoResponse(BaseModel):
    """
    业务知识网络信息响应模型。

    对应 OpenAPI 中的 OntologyInfo schema。
    """
    id: int = Field(..., description="业务知识网络 ID")
    name: Optional[str] = Field(None, description="业务知识网络名称")
    description: Optional[str] = Field(None, description="业务知识网络描述")


class OntologyListResponse(BaseModel):
    """
    业务知识网络列表响应模型。

    对应 OpenAPI 中的 OntologyList schema。
    """
    ontologies: List[OntologyInfoResponse] = Field(default_factory=list, description="业务知识网络列表")


# ============ 智能体配置响应 ============

class AgentInfoResponse(BaseModel):
    """
    智能体信息响应模型。

    对应 OpenAPI 中的 AgentInfo schema。
    """
    id: int = Field(..., description="Data Agent 智能体 ID")
    name: Optional[str] = Field(None, description="智能体名称")
    description: Optional[str] = Field(None, description="智能体描述")


class AgentListResponse(BaseModel):
    """
    智能体列表响应模型。

    对应 OpenAPI 中的 AgentList schema。
    """
    agents: List[AgentInfoResponse] = Field(default_factory=list, description="智能体列表")


# ============ 应用配置请求 ============

class ApplicationConfigRequest(BaseModel):
    """
    应用配置请求模型。

    对应 OpenAPI 中的 ApplicationConfigRequest schema。
    """
    ontology_config: Optional[List[OntologyConfigItemResponse]] = Field(None, description="业务知识网络配置列表")
    agent_config: Optional[List[AgentConfigItemResponse]] = Field(None, description="智能体配置列表")


# ============ 错误响应 ============

class ErrorResponse(BaseModel):
    """
    错误响应模型。

    对应 OpenAPI 中的 ErrorResponse schema。
    """
    code: str = Field(..., description="业务错误码")
    description: str = Field(..., description="错误描述")
    solution: Optional[str] = Field(None, description="错误处理建议")
    detail: Optional[dict] = Field(None, description="错误详细信息")
    link: Optional[str] = Field(None, description="错误帮助地址")
