"""
Token上下文管理器

提供统一的token和用户信息获取方式，供适配器层使用。
通过contextvars实现请求级别的上下文管理。
"""
import contextvars
from typing import Optional

from src.ports.user_management_port import UserInfo

# 创建上下文变量，用于存储当前请求的token
_auth_token_context: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar(
    'auth_token', default=None
)

# 创建上下文变量，用于存储当前请求的用户信息
_user_info_context: contextvars.ContextVar[Optional[UserInfo]] = contextvars.ContextVar(
    'user_info', default=None
)


class TokenContext:
    """
    Token上下文管理器。
    
    用于在请求处理过程中设置和获取认证token。
    适配器层可以通过此类统一获取token，而不需要从参数传递。
    """
    
    @staticmethod
    def set_token(token: Optional[str]) -> None:
        """
        设置当前上下文的认证token。
        
        参数:
            token: 认证token，如果为None则清除token
        """
        _auth_token_context.set(token)
    
    @staticmethod
    def get_token() -> Optional[str]:
        """
        获取当前上下文的认证token。
        
        返回:
            Optional[str]: 认证token，如果未设置则返回None
        """
        return _auth_token_context.get(None)
    
    @staticmethod
    def clear_token() -> None:
        """
        清除当前上下文的认证token。
        """
        _auth_token_context.set(None)


class UserContext:
    """
    用户上下文管理器。
    
    用于在请求处理过程中设置和获取用户信息。
    适配器层和应用层可以通过此类统一获取用户信息，而不需要从参数传递。
    """
    
    @staticmethod
    def set_user_info(user_info: Optional[UserInfo]) -> None:
        """
        设置当前上下文的用户信息。
        
        参数:
            user_info: 用户信息，如果为None则清除用户信息
        """
        _user_info_context.set(user_info)
    
    @staticmethod
    def get_user_info() -> Optional[UserInfo]:
        """
        获取当前上下文的用户信息。
        
        返回:
            Optional[UserInfo]: 用户信息，如果未设置则返回None
        """
        return _user_info_context.get(None)
    
    @staticmethod
    def clear_user_info() -> None:
        """
        清除当前上下文的用户信息。
        """
        _user_info_context.set(None)


def get_auth_token() -> Optional[str]:
    """
    便捷函数：获取当前上下文的认证token。
    
    返回:
        Optional[str]: 认证token，如果未设置则返回None
    """
    return TokenContext.get_token()


def get_user_info() -> Optional[UserInfo]:
    """
    便捷函数：获取当前上下文的用户信息。
    
    返回:
        Optional[UserInfo]: 用户信息，如果未设置则返回None
    """
    return UserContext.get_user_info()

