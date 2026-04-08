"""
用户信息路由

用户信息端点的 FastAPI 路由。
这是处理 HTTP 请求并委托给应用层的接口适配器。
"""
import logging
from fastapi import APIRouter, Request, status
from src.infrastructure.exceptions import ValidationError, InternalError
from fastapi.responses import JSONResponse

from src.application.user_info_service import UserInfoService

logger = logging.getLogger(__name__)


def create_userinfo_router(user_info_service: UserInfoService) -> APIRouter:
    """
    创建用户信息路由。

    参数:
        user_info_service: 用户信息服务实例

    返回:
        APIRouter: 配置完成的路由
    """
    router = APIRouter(tags=["UserInfo"])

    @router.get(
        "/userinfo",
        summary="用户信息接口",
        description="用户信息接口，根据 Token 获取用户信息",
    )
    async def userinfo(request: Request):
        """
        用户信息接口。

        流程：
        1. 从 Authorization Header 获取 Token
        2. 获取用户信息
        3. 返回响应
        """
        try:
            # 获取 Token
            auth_header = request.headers.get("Authorization")
            if not auth_header or not auth_header.startswith("Bearer "):
                raise ValidationError(
                    code="INVALID_AUTH_HEADER",
                    description="Authorization Header 格式错误",
                    solution="请确保 Authorization Header 格式为 'Bearer <token>'",
                )
            
            token = auth_header[7:]  # 去除 "Bearer " 前缀

            # 获取用户信息
            user_info = await user_info_service.get_user_info(token)

            # 返回完整的 UserInfo 对象（与 session 项目一致）
            response_data = {
                "id": user_info.id,
                "account": user_info.account,
                "vision_name": user_info.vision_name,
                "csf_level": user_info.csf_level,
                "frozen": user_info.frozen,
                "email": user_info.email,
                "telephone": user_info.telephone,
                "third_attr": user_info.third_attr,
                "third_id": user_info.third_id,
                "user_type": user_info.user_type,
            }
            
            # 添加 roles（如果存在）
            if user_info.roles:
                response_data["roles"] = user_info.roles
            
            # 添加 groups（如果存在）
            if user_info.groups:
                response_data["groups"] = user_info.groups
            
            # 添加 parent_deps（如果存在）
            if user_info.parent_deps:
                response_data["parent_deps"] = user_info.parent_deps
            
            return JSONResponse(
                content=response_data,
                status_code=status.HTTP_200_OK,
            )

        except ValueError as e:
            logger.error(f"获取用户信息失败: {e}")
            raise ValidationError(
                code="GET_USER_INFO_ERROR",
                description=f"获取用户信息失败: {str(e)}",
            )
        except Exception as e:
            logger.exception(f"获取用户信息异常: {e}")
            raise InternalError(
                code="GET_USER_INFO_ERROR",
                description=f"获取用户信息失败: {str(e)}",
            )

    return router

