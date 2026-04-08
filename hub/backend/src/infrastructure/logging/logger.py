"""
日志配置

为应用程序提供集中的日志配置。
"""
import logging
import sys
from typing import Optional

from src.infrastructure.config.settings import Settings


def setup_logging(settings: Optional[Settings] = None) -> logging.Logger:
    """
    设置应用日志。
    
    参数:
        settings: 应用配置。如果为 None，则使用默认配置。
    
    返回:
        logging.Logger: 配置完成的日志记录器。
    """
    if settings is None:
        from src.infrastructure.config.settings import get_settings
        settings = get_settings()
    
    # 获取日志级别
    log_level = getattr(logging, settings.log_level.upper(), logging.INFO)
    
    # 配置根日志记录器
    logging.basicConfig(
        level=log_level,
        format=settings.log_format,
        handlers=[
            logging.StreamHandler(sys.stdout),
        ]
    )
    
    # 获取应用日志记录器
    logger = logging.getLogger(settings.app_name)
    logger.setLevel(log_level)
    
    return logger


def get_logger(name: str) -> logging.Logger:
    """
    获取指定名称的日志记录器。
    
    参数:
        name: 日志记录器名称。
    
    返回:
        logging.Logger: 日志记录器。
    """
    return logging.getLogger(name)
