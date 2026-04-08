"""
统一异常处理模块

定义业务异常和统一错误响应格式。
"""
from typing import Optional, Any
from fastapi import HTTPException, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel


class ErrorResponse(BaseModel):
    """
    统一错误响应模型。

    对应 OpenAPI 规范中的错误响应格式。
    """
    code: str
    description: str
    solution: Optional[str] = None
    detail: Optional[dict] = None
    link: Optional[str] = None


class BusinessException(Exception):
    """
    业务异常基类。

    所有业务相关的异常都应该继承此类。
    """
    def __init__(
        self,
        code: str,
        description: str,
        status_code: int = status.HTTP_400_BAD_REQUEST,
        solution: Optional[str] = None,
        detail: Optional[dict] = None,
        link: Optional[str] = None,
    ):
        self.code = code
        self.description = description
        self.status_code = status_code
        self.solution = solution
        self.detail = detail
        self.link = link
        super().__init__(description)

    def to_response(self) -> JSONResponse:
        """转换为 JSONResponse。"""
        content = {
            "code": self.code,
            "description": self.description,
        }
        if self.solution:
            content["solution"] = self.solution
        if self.detail:
            content["detail"] = self.detail
        if self.link:
            content["link"] = self.link
        
        return JSONResponse(
            status_code=self.status_code,
            content=content,
        )


# ============ 预定义业务异常 ============

class NotFoundError(BusinessException):
    """资源未找到异常。"""
    def __init__(
        self,
        description: str = "资源未找到",
        code: str = "NOT_FOUND",
        solution: Optional[str] = None,
        detail: Optional[dict] = None,
    ):
        super().__init__(
            code=code,
            description=description,
            status_code=status.HTTP_404_NOT_FOUND,
            solution=solution,
            detail=detail,
        )


class ValidationError(BusinessException):
    """请求参数验证异常。"""
    def __init__(
        self,
        description: str = "请求参数无效",
        code: str = "INVALID_REQUEST",
        solution: Optional[str] = None,
        detail: Optional[dict] = None,
    ):
        super().__init__(
            code=code,
            description=description,
            status_code=status.HTTP_400_BAD_REQUEST,
            solution=solution,
            detail=detail,
        )


class ConflictError(BusinessException):
    """资源冲突异常。"""
    def __init__(
        self,
        description: str = "资源冲突",
        code: str = "CONFLICT",
        solution: Optional[str] = None,
        detail: Optional[dict] = None,
    ):
        super().__init__(
            code=code,
            description=description,
            status_code=status.HTTP_409_CONFLICT,
            solution=solution,
            detail=detail,
        )


class UnauthorizedError(BusinessException):
    """未授权异常。"""
    def __init__(
        self,
        description: str = "未授权访问",
        code: str = "UNAUTHORIZED",
        solution: Optional[str] = "请先登录",
        detail: Optional[dict] = None,
    ):
        super().__init__(
            code=code,
            description=description,
            status_code=status.HTTP_401_UNAUTHORIZED,
            solution=solution,
            detail=detail,
        )


class ForbiddenError(BusinessException):
    """禁止访问异常。"""
    def __init__(
        self,
        description: str = "禁止访问",
        code: str = "FORBIDDEN",
        solution: Optional[str] = None,
        detail: Optional[dict] = None,
    ):
        super().__init__(
            code=code,
            description=description,
            status_code=status.HTTP_403_FORBIDDEN,
            solution=solution,
            detail=detail,
        )


class InternalError(BusinessException):
    """内部服务器错误异常。"""
    def __init__(
        self,
        description: str = "服务器内部错误",
        code: str = "INTERNAL_ERROR",
        solution: Optional[str] = "请稍后重试或联系管理员",
        detail: Optional[dict] = None,
    ):
        super().__init__(
            code=code,
            description=description,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            solution=solution,
            detail=detail,
        )


class ExternalServiceError(BusinessException):
    """外部服务调用异常。"""
    def __init__(
        self,
        description: str = "外部服务调用失败",
        code: str = "EXTERNAL_SERVICE_ERROR",
        solution: Optional[str] = "请检查外部服务状态或稍后重试",
        detail: Optional[dict] = None,
    ):
        super().__init__(
            code=code,
            description=description,
            status_code=status.HTTP_502_BAD_GATEWAY,
            solution=solution,
            detail=detail,
        )


def create_error_response(
    status_code: int,
    code: str,
    description: str,
    solution: Optional[str] = None,
    detail: Optional[dict] = None,
    link: Optional[str] = None,
) -> JSONResponse:
    """
    创建统一格式的错误响应。

    参数:
        status_code: HTTP 状态码
        code: 业务错误码
        description: 错误描述
        solution: 错误处理建议
        detail: 错误详细信息
        link: 错误帮助地址

    返回:
        JSONResponse: 格式化的错误响应
    """
    content = {
        "code": code,
        "description": description,
    }
    if solution:
        content["solution"] = solution
    if detail:
        content["detail"] = detail
    if link:
        content["link"] = link
    
    return JSONResponse(
        status_code=status_code,
        content=content,
    )

