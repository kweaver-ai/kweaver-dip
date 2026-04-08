"""
健康检查端口接口

定义健康检查操作的抽象接口（端口）。
遵循六边形架构模式，这些端口定义了领域层与基础设施层之间的契约。
"""
from abc import ABC, abstractmethod
from typing import Dict, Any

from src.domains.health import HealthCheckResult, ReadyCheckResult


class HealthCheckPort(ABC):
    """
    健康检查端口接口。
    
    这是一个输出端口（被驱动端口），定义了应用程序与外部健康检查机制的交互方式。
    """
    
    @abstractmethod
    def check_health(self) -> HealthCheckResult:
        """
        执行健康检查。
        
        返回:
            HealthCheckResult: 健康检查结果。
        """
        pass
    
    @abstractmethod
    def check_ready(self) -> ReadyCheckResult:
        """
        执行就绪检查。
        
        返回:
            ReadyCheckResult: 就绪检查结果。
        """
        pass
    
    @abstractmethod
    def get_service_info(self) -> Dict[str, Any]:
        """
        获取服务信息。
        
        返回:
            Dict[str, Any]: 服务信息，包括版本、名称等。
        """
        pass
