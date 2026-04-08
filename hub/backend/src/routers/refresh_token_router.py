"""
刷新令牌路由

刷新令牌端点的 FastAPI 路由。
这是处理 HTTP 请求并委托给应用层的接口适配器。
"""
import logging
from urllib.parse import quote
from fastapi import APIRouter, Request, Response, status
from src.infrastructure.exceptions import ValidationError
from fastapi.responses import JSONResponse

from src.application.refresh_token_service import RefreshTokenService
from src.infrastructure.config.settings import Settings, get_settings

logger = logging.getLogger(__name__)


def create_refresh_token_router(
    refresh_token_service: RefreshTokenService, settings: Settings = None
) -> APIRouter:
    """
    创建刷新令牌路由。

    参数:
        refresh_token_service: 刷新令牌服务实例
        settings: 应用配置

    返回:
        APIRouter: 配置完成的路由
    """
    if settings is None:
        settings = get_settings()
    
    router = APIRouter(tags=["RefreshToken"])

    def _get_cookie_value(request: Request, name: str) -> str | None:
        """获取 Cookie 值"""
        return request.cookies.get(name)

    def _get_header_value(request: Request, name: str) -> str | None:
        """获取 Header 值"""
        return request.headers.get(name)

    def _set_cookie(
        response: Response,
        name: str,
        value: str,
        max_age: int = 3600,
        domain: str = "",
        path: str = "/",
        secure: bool = True,
        httponly: bool = False,
        samesite: str = "None",
    ):
        """设置 Cookie"""
        cookie_value = quote(value, safe="")
        response.set_cookie(
            key=name,
            value=cookie_value,
            max_age=max_age,
            domain=domain if domain else None,
            path=path,
            secure=secure,
            httponly=httponly,
            samesite=samesite,
        )

    @router.get(
        "/refresh-token",
        summary="刷新令牌接口",
        description="刷新令牌接口，使用 Refresh Token 获取新的 Access Token",
    )
    async def refresh_token(request: Request):
        """
        刷新令牌接口。

        流程：
        1. 从 Cookie 获取 session_id 和 token
        2. 执行刷新
        3. 更新 Cookie
        4. 返回响应
        """
        try:
            # 获取 Cookie 值
            session_id = _get_cookie_value(request, "dip.session_id")
            token = _get_cookie_value(request, "dip.oauth2_token")
            
            if not session_id or not token:
                raise ValidationError(
                    code="GET_COOKIE_VALUE_NOT_EXIST",
                    description="Session ID 或 Token 不存在",
                    solution="请先登录",
                )

            # 执行刷新
            refresh_result = await refresh_token_service.do_refresh(session_id, token)

            # 创建响应
            response = JSONResponse(
                content={
                    "session_id": session_id,
                    "access_token": refresh_result.token,
                },
                status_code=status.HTTP_200_OK,
            )

            # 更新 Access Token Cookie
            _set_cookie(
                response,
                "dip.oauth2_token",
                refresh_result.token,
                max_age=settings.cookie_timeout,
                domain=settings.cookie_domain if settings.cookie_domain else None,
            )

            # 将 Refresh Token 设置到前端 Cookie（若本次刷新返回了新的 refresh_token）
            if refresh_result.refresh_token:
                _set_cookie(
                    response,
                    "dip.refresh_token",
                    refresh_result.refresh_token,
                    max_age=settings.cookie_timeout,
                    domain=settings.cookie_domain if settings.cookie_domain else None,
                    httponly=False,  # 允许前端访问 refresh_token
                )

            logger.info(f"Token 刷新成功: {session_id}")
            return response

        except ValueError as e:
            logger.error(f"刷新 Token 失败: {e}")
            raise ValidationError(
                code="REFRESH_TOKEN_ERROR",
                description=f"刷新 Token 失败: {str(e)}",
                solution="请重新登录",
            )
        except Exception as e:
            logger.exception(f"刷新 Token 异常: {e}")
            raise ValidationError(
                code="REFRESH_TOKEN_ERROR",
                description=f"刷新 Token 失败: {str(e)}",
                solution="请重新登录",
            )

    return router

