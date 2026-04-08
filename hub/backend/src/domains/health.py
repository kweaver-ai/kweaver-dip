"""
健康检查领域模型

定义健康检查和就绪检查的领域模型。
"""
from dataclasses import dataclass
from enum import Enum
from typing import Optional


class HealthStatus(str, Enum):
    """健康状态枚举。"""
    HEALTHY = "healthy"
    UNHEALTHY = "unhealthy"
    DEGRADED = "degraded"


class ReadyStatus(str, Enum):
    """就绪状态枚举。"""
    READY = "ready"
    NOT_READY = "not_ready"


@dataclass
class HealthCheckResult:
    """健康检查结果领域模型。"""
    status: HealthStatus
    message: str
    version: Optional[str] = None
    
    def is_healthy(self) -> bool:
        """检查服务是否健康。"""
        return self.status == HealthStatus.HEALTHY


@dataclass
class ReadyCheckResult:
    """就绪检查结果领域模型。"""
    status: ReadyStatus
    message: str
    checks: Optional[dict] = None
    
    def is_ready(self) -> bool:
        """检查服务是否就绪。"""
        return self.status == ReadyStatus.READY
