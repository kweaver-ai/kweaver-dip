"""
登出路由

登出端点的 FastAPI 路由。
这是处理 HTTP 请求并委托给应用层的接口适配器。
"""
import logging
from urllib.parse import urlencode, quote
from fastapi import APIRouter, Query, Request, Response, status
from src.infrastructure.exceptions import ValidationError
from fastapi.responses import HTMLResponse, RedirectResponse

from src.application.logout_service import LogoutService, SSO_LOGIN
from src.infrastructure.config.settings import Settings, get_settings

logger = logging.getLogger(__name__)


def create_logout_router(logout_service: LogoutService, settings: Settings = None) -> APIRouter:
    """
    创建登出路由。

    参数:
        logout_service: 登出服务实例
        settings: 应用配置

    返回:
        APIRouter: 配置完成的路由
    """
    if settings is None:
        settings = get_settings()
    
    router = APIRouter(tags=["Logout"])

    def _get_frontend_path(path: str = "") -> str:
        """获取前端路径，处理路径拼接"""
        base = settings.frontend_base_path.rstrip("/")
        if path:
            path = path.lstrip("/")
            return f"{base}/{path}" if base else f"/{path}"
        return base if base else "/"

    def _get_cookie_value(request: Request, name: str) -> str | None:
        """获取 Cookie 值"""
        return request.cookies.get(name)

    def _get_header_value(request: Request, name: str) -> str | None:
        """获取 Header 值"""
        return request.headers.get(name)

    def _clear_cookies(response: Response):
        """清除所有相关 Cookie"""
        for cookie_name in ["dip.session_id", "dip.oauth2_token", "dip.refresh_token", "dip.userid"]:
            response.delete_cookie(
                key=cookie_name,
                path="/",
                domain=settings.cookie_domain if settings.cookie_domain else None,
            )

    @router.get(
        "/logout",
        summary="登出接口",
        description="登出接口，重定向到 OAuth2 登出端点",
        response_class=HTMLResponse,
    )
    async def logout(request: Request):
        """
        登出接口。

        流程：
        1. 从 Cookie 获取 session_id
        2. 获取 Session 信息
        3. SSO 登录特殊处理
        4. 获取主机信息
        5. 构建 OAuth2 登出 URL 并重定向
        """
        try:
            # 获取 Session ID
            session_id = _get_cookie_value(request, "dip.session_id")
            if not session_id:
                # Session ID 不存在，清除 Cookie，返回登出页面
                response = HTMLResponse(
                    content=f'<html><body><script>window.location.href="{_get_frontend_path()}";</script></body></html>',
                    status_code=status.HTTP_200_OK,
                )
                _clear_cookies(response)
                return response

            # 获取 Session 信息
            session_info = await logout_service.get_session(session_id)
            if not session_info:
                # Session 不存在，清除 Cookie，返回登出页面
                response = HTMLResponse(
                    content=f'<html><body><script>window.location.href="{_get_frontend_path()}";</script></body></html>',
                    status_code=status.HTTP_200_OK,
                )
                _clear_cookies(response)
                return response

            # SSO 登录特殊处理
            if session_info.sso == SSO_LOGIN:
                # SSO 登录，直接撤销 Token 和删除 Session，不调用 OAuth2 登出端点
                await logout_service.revoke_and_delete_session(session_info, session_id)
                response = HTMLResponse(
                    content=f'<html><body><script>window.location.href="{_get_frontend_path()}";</script></body></html>',
                    status_code=status.HTTP_200_OK,
                )
                _clear_cookies(response)
                return response

            # 获取主机信息
            base_url = await logout_service.get_host_url()

            # 构建 OAuth2 登出 URL
            redirect_uri = f"{base_url}/api/dip-hub/v1/logout/callback"
            logout_params = {
                "post_logout_redirect_uri": redirect_uri,
                "id_token_hint": session_info.id_token or "",
                "state": session_info.state,
            }
            logout_url = f"{base_url}/oauth2/sessions/logout?{urlencode(logout_params)}"

            # 重定向到 OAuth2 登出端点
            return RedirectResponse(url=logout_url, status_code=status.HTTP_302_FOUND)

        except Exception as e:
            logger.exception(f"登出失败: {e}")
            response = HTMLResponse(
                content=f'<html><body><script>window.location.href="{_get_frontend_path()}";</script></body></html>',
                status_code=status.HTTP_200_OK,
            )
            _clear_cookies(response)
            return response

    @router.get(
        "/logout/callback",
        summary="登出回调接口",
        description="登出回调接口，接收 OAuth2 登出回调",
        response_class=HTMLResponse,
    )
    async def logout_callback(
        request: Request,
        state: str = Query(..., description="状态字符串"),
        error: str | None = Query(default=None, description="错误码"),
        error_description: str | None = Query(default=None, description="错误描述"),
        error_hint: str | None = Query(default=None, description="错误提示"),
    ):
        """
        登出回调接口。

        流程：
        1. 从 Cookie 获取 session_id
        2. 验证参数
        3. 执行登出回调
        4. 清除 Cookie
        5. 返回登出页面
        """
        try:
            # 获取 Session ID
            session_id = _get_cookie_value(request, "dip.session_id")
            if not session_id:
                # Session ID 不存在，清除 Cookie，返回登出页面
                response = HTMLResponse(
                    content=f'<html><body><script>window.location.href="{_get_frontend_path()}";</script></body></html>',
                    status_code=status.HTTP_200_OK,
                )
                _clear_cookies(response)
                return response

            # 参数验证（与 session 项目一致：error 存在时返回 400 错误）
            if error:
                logger.error(f"登出回调错误: {error} - {error_description}")
                raise ValidationError(
                    code="DO_LOGOUT_CALLBACK_FAILED",
                    description=f"登出回调失败: {error}",
                )

            # 执行登出回调
            session_info = await logout_service.do_logout_callback(session_id, state)

            # 创建响应
            response = HTMLResponse(
                content=f'<html><body><script>window.location.href="{_get_frontend_path()}";</script></body></html>',
                status_code=status.HTTP_200_OK,
            )

            # 清除 Cookies
            _clear_cookies(response)

            logger.info("登出回调成功")
            return response

        except ValueError as e:
            logger.error(f"登出回调失败: {e}")
            response = HTMLResponse(
                content=f'<html><body><script>window.location.href="{_get_frontend_path()}";</script></body></html>',
                status_code=status.HTTP_400_BAD_REQUEST,
            )
            _clear_cookies(response)
            return response
        except Exception as e:
            logger.exception(f"登出回调异常: {e}")
            response = HTMLResponse(
                content=f'<html><body><script>window.location.href="{_get_frontend_path()}";</script></body></html>',
                status_code=status.HTTP_200_OK,
            )
            _clear_cookies(response)
            return response

    return router

