"""
健康检查适配器

实现 HealthCheckPort 接口的基础设施适配器。
这是应用程序用于健康检查的具体实现。
"""
import time
from typing import Dict, Any

from src.domains.health import (
    HealthCheckResult,
    HealthStatus,
    ReadyCheckResult,
    ReadyStatus,
)
from src.ports.health_port import HealthCheckPort
from src.infrastructure.config.settings import Settings


class HealthAdapter(HealthCheckPort):
    """
    健康检查适配器实现。
    
    该适配器实现了 HealthCheckPort 接口，提供健康检查操作的具体实现。
    """
    
    def __init__(self, settings: Settings):
        """
        初始化健康适配器。
        
        参数:
            settings: 应用配置。
        """
        self._settings = settings
        self._start_time = time.time()
        self._is_ready = False
    
    def set_ready(self, ready: bool = True) -> None:
        """
        设置就绪状态。
        
        参数:
            ready: 服务是否就绪。
        """
        self._is_ready = ready
    
    def check_health(self) -> HealthCheckResult:
        """
        执行健康检查。
        
        返回:
            HealthCheckResult: 健康检查结果。
        """
        return HealthCheckResult(
            status=HealthStatus.HEALTHY,
            message="服务运行正常",
            version=self._settings.app_version,
        )
    
    def check_ready(self) -> ReadyCheckResult:
        """
        执行就绪检查。
        
        返回:
            ReadyCheckResult: 就绪检查结果。
        """
        uptime = time.time() - self._start_time
        
        if self._is_ready:
            return ReadyCheckResult(
                status=ReadyStatus.READY,
                message="服务已准备好接受请求",
                checks={
                    "uptime_seconds": round(uptime, 2),
                    "dependencies": "ok",
                }
            )
        else:
            return ReadyCheckResult(
                status=ReadyStatus.NOT_READY,
                message="服务尚未就绪",
                checks={
                    "uptime_seconds": round(uptime, 2),
                    "dependencies": "initializing",
                }
            )
    
    def get_service_info(self) -> Dict[str, Any]:
        """
        获取服务信息。
        
        返回:
            Dict[str, Any]: 服务信息。
        """
        return {
            "name": self._settings.app_name,
            "version": self._settings.app_version,
            "uptime_seconds": round(time.time() - self._start_time, 2),
        }
