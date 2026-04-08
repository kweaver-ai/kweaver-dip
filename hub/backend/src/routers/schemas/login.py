"""
登录相关的请求和响应模型
"""
from typing import Optional
from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    """登录请求"""
    platform: int = Field(default=1, description="平台类型", ge=1, le=8)
    asredirect: Optional[str] = Field(default=None, description="AnyShare 重定向地址")


class LoginCallbackRequest(BaseModel):
    """登录回调请求"""
    code: str = Field(..., description="授权码")
    state: str = Field(..., description="状态字符串")
    error: Optional[str] = Field(default=None, description="错误码")
    error_description: Optional[str] = Field(default=None, description="错误描述")
    error_hint: Optional[str] = Field(default=None, description="错误提示")

