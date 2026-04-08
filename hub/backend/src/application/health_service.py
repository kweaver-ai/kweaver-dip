"""
健康检查应用服务

应用层服务，负责编排健康检查操作。
该服务使用端口（接口），不依赖任何基础设施细节。
"""
from src.domains.health import HealthCheckResult, ReadyCheckResult
from src.ports.health_port import HealthCheckPort


class HealthService:
    """
    健康检查应用服务。
    
    该服务属于应用层，通过端口编排健康检查的业务逻辑。
    """
    
    def __init__(self, health_port: HealthCheckPort):
        """
        初始化健康服务。
        
        参数:
            health_port: 健康检查端口实现（注入的适配器）。
        """
        self._health_port = health_port
    
    def get_health(self) -> HealthCheckResult:
        """
        获取服务的健康状态。
        
        返回:
            HealthCheckResult: 健康检查结果。
        """
        return self._health_port.check_health()
    
    def get_ready(self) -> ReadyCheckResult:
        """
        获取服务的就绪状态。
        
        返回:
            ReadyCheckResult: 就绪检查结果。
        """
        return self._health_port.check_ready()
    
    def get_service_info(self) -> dict:
        """
        获取服务信息。
        
        返回:
            dict: 服务信息。
        """
        return self._health_port.get_service_info()
