"""
健康检查路由

健康检查端点的 FastAPI 路由。
这是处理 HTTP 请求并委托给应用层的接口适配器。
"""
from fastapi import APIRouter, Response, status

from src.application.health_service import HealthService


def create_health_router(health_service: HealthService) -> APIRouter:
    """
    创建健康检查路由。

    参数:
        health_service: 健康服务实例。

    返回:
        APIRouter: 配置完成的路由。
    """
    router = APIRouter(tags=["Health"])

    @router.get(
        "/healthz",
        summary="通用健康检查",
        response_class=Response,
        responses={
            200: {"description": "服务健康"},
        }
    )
    async def health_check() -> Response:
        """
        健康检查端点。

        检查服务是否健康。
        """
        result = health_service.get_health()

        if not result.is_healthy():
            return Response(status_code=status.HTTP_503_SERVICE_UNAVAILABLE)

        return Response(status_code=status.HTTP_200_OK)

    @router.get(
        "/readyz",
        summary="就绪检查 (Readiness)",
        response_class=Response,
        responses={
            200: {"description": "就绪正常"},
        }
    )
    async def ready_check() -> Response:
        """
        就绪检查端点。

        检查服务是否准备好接受请求。
        表示服务是否已完成初始化并准备好接受流量。
        """
        result = health_service.get_ready()

        if not result.is_ready():
            return Response(status_code=status.HTTP_503_SERVICE_UNAVAILABLE)

        return Response(status_code=status.HTTP_200_OK)

    return router
