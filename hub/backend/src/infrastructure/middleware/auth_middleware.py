"""
认证中间件

统一从请求头提取认证token并存储到request.state和TokenContext中，供后续处理使用。
同时进行token内省，获取用户信息并存储到上下文中。
对于需要认证的路径（如 /applications），如果没有token则拒绝访问。
"""
import logging
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from src.infrastructure.context.token_context import TokenContext, UserContext
from src.infrastructure.container import get_container
from src.infrastructure.exceptions import UnauthorizedError

logger = logging.getLogger(__name__)

# 不需要认证的路径前缀列表
PUBLIC_PATHS = [
    "/healthz",
    "/readyz",
    "/login",
    "/login/callback",
    "/logout",
    "/logout/callback",
    "/refresh-token",
    "/docs",
    "/redoc",
    "/openapi.json",
]


class AuthMiddleware(BaseHTTPMiddleware):
    """
    认证中间件。
    
    从请求头中提取Authorization token，进行内省验证，并存储到：
    1. request.state.auth_token - 供路由层使用
    2. TokenContext - 供适配器层统一获取
    3. UserContext - 供应用层统一获取用户信息
    
    对于需要认证的路径（如 /applications），如果没有token或token无效，则拒绝访问。
    """
    
    def _is_public_path(self, path: str) -> bool:
        """
        判断路径是否为公开路径（不需要认证）。
        
        参数:
            path: 请求路径
        
        返回:
            bool: 如果是公开路径返回True，否则返回False
        """
        # 检查路径是否以公开路径前缀开头
        # 支持两种情况：
        # 1. 直接路径：/healthz, /docs 等
        # 2. 带API前缀的路径：/api/dip-hub/v1/healthz 等
        for public_path in PUBLIC_PATHS:
            # 直接匹配（如 /healthz）
            if path == public_path:
                return True
            # 匹配以公开路径结尾的路径（如 /api/dip-hub/v1/healthz）
            if path.endswith(public_path) or path.endswith(public_path + "/"):
                return True
            # 匹配以公开路径开头的路径（如 /docs, /redoc）
            if path.startswith(public_path + "/") or path.startswith(public_path + "?"):
                return True
        return False
    
    async def dispatch(self, request: Request, call_next):
        """
        处理请求，提取认证token，进行内省并获取用户信息。
        
        参数:
            request: 请求对象
            call_next: 下一个中间件或路由处理函数
        
        返回:
            Response: HTTP响应
        """
        # 获取请求路径（去除API前缀）
        path = request.url.path
        
        # 如果是公开路径，直接放行
        if self._is_public_path(path):
            try:
                response = await call_next(request)
                return response
            finally:
                # 清除上下文
                TokenContext.clear_token()
                UserContext.clear_user_info()
        
        # 从请求头提取Authorization token
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            logger.warning(f"请求路径 {path} 需要认证，但未提供token")
            error = UnauthorizedError(
                description="访问此资源需要认证",
                solution="请在请求头中提供有效的Authorization token",
            )
            return error.to_response()
        
        # 提取纯token（去除 "Bearer " 前缀）
        if auth_header.startswith("Bearer "):
            auth_token = auth_header[7:]  # 去除 "Bearer " 前缀
        else:
            # 兼容直接传递token的情况
            auth_token = auth_header
        
        if not auth_token:
            logger.warning(f"请求路径 {path} 需要认证，但token为空")
            error = UnauthorizedError(
                description="访问此资源需要认证",
                solution="请在请求头中提供有效的Authorization token",
            )
            return error.to_response()
        
        # 存储完整的Authorization header到request.state中，供路由层使用
        request.state.auth_token = auth_header
        
        # 存储纯token到TokenContext中，供适配器层统一获取
        TokenContext.set_token(auth_token)
        
        # 进行内省并获取用户信息
        user_info = None
        try:
            # 获取容器以访问适配器
            container = get_container()
            
            # 内省token获取用户ID（使用纯token）
            introspect = await container.hydra_adapter.introspect(auth_token)
            if introspect.active and introspect.visitor_id:
                # 获取用户详细信息
                user_infos = await container.user_management_adapter.batch_get_user_info_by_id(
                    [introspect.visitor_id]
                )
                if introspect.visitor_id in user_infos:
                    user_info = user_infos[introspect.visitor_id]
                    logger.debug(f"用户信息已获取: {user_info.id} ({user_info.vision_name})")
                else:
                    logger.warning(f"无法获取用户信息: {introspect.visitor_id}")
                    # 对于需要认证的路径，如果无法获取用户信息则拒绝访问
                    error = UnauthorizedError(
                        description="无法获取用户信息",
                        solution="请使用有效的token重新登录",
                    )
                    return error.to_response()
            else:
                logger.warning("Token 内省结果：token 无效或无法获取用户ID")
                # 对于需要认证的路径，如果token无效则拒绝访问
                error = UnauthorizedError(
                    description="Token无效或已过期",
                    solution="请使用有效的token重新登录",
                )
                return error.to_response()
        except Exception as e:
            # 内省失败，对于需要认证的路径则拒绝访问
            logger.error(f"Token 内省失败: {e}", exc_info=True)
            error = UnauthorizedError(
                description="Token验证失败",
                solution="请使用有效的token重新登录",
            )
            return error.to_response()
        
        # 存储用户信息到UserContext中，供应用层统一获取
        UserContext.set_user_info(user_info)
        
        try:
            # 继续处理请求
            response = await call_next(request)
            return response
        finally:
            # 请求处理完成后清除上下文，避免上下文污染
            TokenContext.clear_token()
            UserContext.clear_user_info()

