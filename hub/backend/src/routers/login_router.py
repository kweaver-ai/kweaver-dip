"""
登录路由

登录端点的 FastAPI 路由。
严格按照 session 服务的实现逻辑（不区分 platform）。
"""
import logging
import asyncio
from urllib.parse import quote
from fastapi import APIRouter, Query, Request, Response, status
from src.infrastructure.exceptions import ValidationError
from fastapi.responses import HTMLResponse, RedirectResponse
from starlette.responses import Response as StarletteResponse

from src.application.login_service import LoginService
from src.domains.session import SessionInfo
from src.infrastructure.config.settings import Settings, get_settings

logger = logging.getLogger(__name__)


def _redirect_html(url: str) -> str:
    """
    生成带加载动画的重定向 HTML（与 session 服务 index.html 完全一致）。
    
    使用 top.location.href 确保在 iframe 嵌套情况下也能正确跳转到顶层窗口。
    """
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
    <title></title>
    <meta charset="utf-8" />
    <meta http-equiv="Content-Type" content="text/html;charset=UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="format-detection" content="telephone=no" />
    <style type="text/css">
        html, body {{ margin: 0; padding: 0; height: 100%; }}
        .login {{ height: 100%; display: flex; align-items: center; justify-content: center; position:relative; overflow:hidden; }}
        .loading {{ position: relative; width: 18px; height: 18px; border: 2px solid rgba(255, 255, 255, 0.25); border-radius: 999px; }}
        .loading span {{ position: absolute; width: 18px; height: 18px; border: 2px solid transparent; border-top: 2px solid rgb(146, 163, 208); border-radius: 999px; top: -4px; left: -4px; animation: rotate 1s infinite linear; }}
        @keyframes rotate {{ 0% {{ transform: rotate(0deg); }} 100% {{ transform: rotate(360deg); }} }}
    </style>
</head>
<body>
<div class="login"><div class="loading"><span></span></div></div>
<script>top.location.href = "{url}";</script>
</body>
</html>'''


def create_login_router(login_service: LoginService, settings: Settings = None) -> APIRouter:
    """
    创建登录路由。

    参数:
        login_service: 登录服务实例
        settings: 应用配置

    返回:
        APIRouter: 配置完成的路由
    """
    if settings is None:
        settings = get_settings()
    
    router = APIRouter(tags=["Login"])

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
        """设置 Cookie（与 session 服务 http.SetCookie 一致）"""
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

    def _clear_cookie(response: Response, name: str):
        """清除单个 Cookie（与 session 服务一致：MaxAge=-1）"""
        response.set_cookie(
            key=name,
            value=quote("", safe=""),
            max_age=-1,
            path="/",
            domain=settings.cookie_domain if settings.cookie_domain else None,
            secure=True,
            httponly=False,
            samesite="None",
        )

    def _clear_all_cookies(response: Response):
        """
        清除所有认证相关 Cookie（与 session 服务 clearCookie 函数一致）。
        
        清除：session_id, oauth2_token, refresh_token, userid
        """
        _clear_cookie(response, "dip.session_id")
        _clear_cookie(response, "dip.oauth2_token")
        _clear_cookie(response, "dip.refresh_token")
        _clear_cookie(response, "dip.userid")

    @router.get(
        "/login",
        summary="登录接口",
        description="登录接口，重定向到请求授权接口（严格按照 session 服务逻辑）",
        response_class=HTMLResponse,
    )
    async def login(
        request: Request,
        asredirect: str | None = Query(default=None, alias="asredirect", description="dip 重定向地址"),
    ):
        """
        登录接口（严格按照 session 服务 Login 函数逻辑）。

        流程：
        1. 参数验证（失败返回 index.html）
        2. 检查是否有有效的 token cookie
        3. 生成 state 和 nonce
        4. 创建或获取 session
        5. 保存 session 信息
        6. 重定向到 OAuth2 授权端点
        """
        frontend_path = _get_frontend_path()
        
        # 注意：session 服务有参数验证 form_validator.BindQueryAndValid
        # Python 版本参数都是可选的，不需要验证
        
        # 检查是否有有效的 token（与 session 服务一致）
        token = _get_cookie_value(request, "dip.oauth2_token")
        if token:
            try:
                token_effect = await login_service.check_token_effect(token)
                if token_effect:
                    # Token 有效，直接返回成功页面或重定向（与 session 服务一致：301）
                    if asredirect:
                        success_path = _get_frontend_path(asredirect)
                        return HTMLResponse(
                            content=_redirect_html(success_path),
                            status_code=status.HTTP_200_OK,
                        )
                    else:
                        # 不区分平台，统一返回 login-success（与 session 服务 LogSuccessHTML 对应）
                        success_path = _get_frontend_path("login-success")
                        return HTMLResponse(
                            content=_redirect_html(success_path),
                            status_code=status.HTTP_200_OK,
                        )
            except Exception:
                pass  # Token 验证失败，继续登录流程

        # 生成 state 和 nonce（与 session 服务一致：10-50 随机长度）
        state = login_service.generate_state()
        nonce = login_service.generate_nonce()

        # 获取或创建 session（与 session 服务逻辑一致）
        existing_session_id = _get_cookie_value(request, "dip.session_id")
        session_id = None
        session_info = None
        
        if not existing_session_id:
            # 没有 session_id，创建新的 session（与 session 服务一致）
            try:
                session_id, session_info = await login_service.get_or_create_session(
                    None, state, asredirect
                )
                logger.info(f"sessionId create :{session_id}")
                logger.info(f"New Session:[{session_id}]")
            except Exception as e:
                logger.error(f"SaveSession error: {e}")
                # 与 session 服务一致：WriteHeader(400) + sleep 1 秒后返回 index.html
                await asyncio.sleep(1)
                return HTMLResponse(
                    content=_redirect_html(frontend_path),
                    status_code=status.HTTP_200_OK,  # 注意：Go 版本先写 400 但最后返回 200 的 HTML
                )
        else:
            # 有 session_id，获取现有 session（与 session 服务一致）
            try:
                session_id, session_info = await login_service.get_or_create_session(
                    existing_session_id, state, asredirect
                )
                # 使用 session 中的 state（与 session 服务一致：state = session.State）
                state = session_info.state
                logger.info(f"Session login :[{session_id}]")
            except Exception as e:
                logger.error(f"Login GetSession error: {e}")
                # 与 session 服务一致：清除 session_id cookie，sleep 1 秒后返回 index.html
                response = HTMLResponse(
                    content=_redirect_html(frontend_path),
                    status_code=status.HTTP_200_OK,
                )
                _clear_cookie(response, "dip.session_id")
                await asyncio.sleep(1)
                return response

        # 获取主机 URL（与 session 服务 deployMgm.GetHost 一致）
        try:
            base_url = await login_service.get_host_url()
        except Exception as e:
            logger.error(f"deployMgm GetHost error: {e}")
            # 与 session 服务一致：WriteHeader(400) + sleep 1 秒后返回 index.html
            await asyncio.sleep(1)
            return HTMLResponse(
                content=_redirect_html(frontend_path),
                status_code=status.HTTP_200_OK,
            )

        # 构建 OAuth2 授权 URL（与 session 服务格式完全一致）
        # session 服务：/af/api/session/v1/login/callback
        # 当前服务：/api/dip-hub/v1/login/callback
        redirect_uri = f"{base_url}/api/dip-hub/v1/login/callback"
        auth_url = (
            f"/oauth2/auth"
            f"?redirect_uri={redirect_uri}"
            f"&client_id={settings.oauth_client_id}"
            f"&scope=openid+offline+all"
            f"&response_type=code"
            f"&state={state}"
            f"&nonce={nonce}"
            f"&lang=zh-cn"
            f"&product=dip"
        )

        # 使用 302 临时重定向，避免浏览器缓存导致后续登录跳过此端点
        response = RedirectResponse(url=auth_url, status_code=status.HTTP_302_FOUND)
        
        # 设置 session_id cookie（与 session 服务一致）
        # 注意：Go 版本在没有 session_id 时先设置 cookie 再保存 session
        # 这里统一在重定向前设置 cookie
        _set_cookie(
            response,
            "dip.session_id",
            session_id,
            max_age=settings.cookie_timeout,
            domain=settings.cookie_domain if settings.cookie_domain else None,
        )

        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"

        logger.info("【Login Redirect success】")
        return response

    @router.get(
        "/login/callback",
        summary="登录回调接口",
        description="登录回调接口，接收回调请求（严格按照 session 服务逻辑）",
        response_class=HTMLResponse,
    )
    async def login_callback(
        request: Request,
        code: str | None = Query(default=None, description="授权码"),
        state: str | None = Query(default=None, description="状态字符串"),
        error: str | None = Query(default=None, description="错误码"),
        error_description: str | None = Query(default=None, description="错误描述"),
        error_hint: str | None = Query(default=None, description="错误提示"),
    ):
        """
        登录回调接口（严格按照 session 服务 LoginCallback 函数逻辑）。

        流程：
        1. 从 cookie 获取 session_id
        2. 验证参数
        3. 调用登录服务处理登录
        4. 设置 token 和 userid cookie
        5. 重定向或返回成功页面
        """
        frontend_path = _get_frontend_path()

        # 获取 session_id（与 session 服务一致）
        session_id = _get_cookie_value(request, "dip.session_id")
        if not session_id:
            # 与 session 服务一致：cookie_util.SetCookieDomain(c) 然后返回 index.html
            # Python 版本不需要动态设置 cookie domain，直接返回 index.html
            return HTMLResponse(
                content=_redirect_html(frontend_path),
                status_code=status.HTTP_200_OK,
            )

        logger.info(f"Session login callback :[{session_id}]")

        # 参数验证（与 session 服务 form_validator.BindQueryAndValid 一致）
        # 如果验证失败，返回 400 + JSON 错误
        # Python 版本所有参数都是可选的，这里只检查关键参数

        # 错误检查（与 session 服务一致）
        if error or not code:
            if error and ("request_unauthorized" in error or "request_forbidden" in error):
                logger.warning("request_unauthorized")
                return HTMLResponse(
                    content=_redirect_html(frontend_path),
                    status_code=status.HTTP_200_OK,
                )
            logger.error(f"LoginCallback req error or code empty  err: {error} ,code: {code}")
            raise ValidationError(
                code="GET_CODE_FAILED",
                description="获取授权码失败",
                solution="请重新登录",
            )

        logger.info(f"login callback Code:[{code}]")

        # 执行登录（与 session 服务 DoLogin 一致）
        try:
            session_info = await login_service.do_login(code, state, session_id)
        except ValueError as e:
            error_msg = str(e)
            logger.error(f"LoginCallback DoLogin  err: {error_msg}")
            
            # 与 session 服务一致：UserHasNoPermissionError → LogFailedHTML
            if "无权限" in error_msg or "permission" in error_msg.lower() or "no permission" in error_msg.lower():
                # 不区分平台，统一返回 login-failed
                failed_path = _get_frontend_path("login-failed")
                return HTMLResponse(
                    content=_redirect_html(failed_path),
                    status_code=status.HTTP_200_OK,
                )
            
            # 其他错误：与 session 服务 LogOutHTML 一致（清除 cookie 后返回首页）
            response = HTMLResponse(
                content=_redirect_html(frontend_path),
                status_code=status.HTTP_200_OK,
            )
            _clear_all_cookies(response)
            return response
            
        except Exception as e:
            logger.exception(f"LoginCallback DoLogin  err: {e}")
            # 与 session 服务一致：LogOutHTML（清除 cookie 后返回首页）
            response = HTMLResponse(
                content=_redirect_html(frontend_path),
                status_code=status.HTTP_200_OK,
            )
            _clear_all_cookies(response)
            return response

        # 设置 Cookie 并返回（与 session 服务一致）
        if session_info.as_redirect:
            # 与 session 服务一致：301 重定向
            success_path = _get_frontend_path(session_info.as_redirect)
            response = HTMLResponse(
                content=_redirect_html(success_path),
                status_code=status.HTTP_200_OK,
            )
        else:
            # 不区分平台，统一返回 login-success（与 session 服务 LogSuccessHTML 对应）
            success_path = _get_frontend_path("login-success")
            response = HTMLResponse(
                content=_redirect_html(success_path),
                status_code=status.HTTP_200_OK,
            )

        # 设置 token、refresh_token 和 userid Cookie（与 session 服务 http.SetCookie 一致）
        if session_info.token:
            _set_cookie(
                response,
                "dip.oauth2_token",
                session_info.token,
                max_age=settings.cookie_timeout,
                domain=settings.cookie_domain if settings.cookie_domain else None,
            )
        refresh_token_val = getattr(session_info, "refresh_token", None)
        if refresh_token_val:
            _set_cookie(
                response,
                "dip.refresh_token",
                session_info.refresh_token,
                max_age=settings.cookie_timeout,
                domain=settings.cookie_domain if settings.cookie_domain else None,
                httponly=False,  # 允许前端访问 refresh_token
            )
        else:
            logger.debug(
                "登录回调: OAuth2 未返回 refresh_token，跳过设置 dip.refresh_token Cookie"
            )
        if session_info.userid:
            _set_cookie(
                response,
                "dip.userid",
                session_info.userid,
                max_age=settings.cookie_timeout,
                domain=settings.cookie_domain if settings.cookie_domain else None,
            )

        logger.info("LoginCallback success")
        return response

    return router
