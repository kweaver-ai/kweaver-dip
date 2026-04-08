"""
Deploy Installer Mock 服务入口模块

模拟 deploy-installer 服务的 API 接口。
"""

import logging
import sys
from flask import Flask

from src.routes import register_routes
from src.config import get_config


def create_app() -> Flask:
    """
    创建 Flask 应用

    Returns:
        Flask: 配置好的 Flask 应用实例
    """
    app = Flask(__name__)

    # 加载配置
    config = get_config()
    app.config["DEBUG"] = config.debug
    app.config["MAX_CONTENT_LENGTH"] = 2 * 1024 * 1024 * 1024  # 2GB

    # 配置日志
    configure_logging(config.debug)

    # 注册路由
    register_routes(app)

    # 添加 CORS 支持
    configure_cors(app)

    logging.info("Deploy Installer Mock 服务初始化完成")
    return app


def configure_logging(debug: bool) -> None:
    """
    配置日志

    Args:
        debug: 是否开启调试模式
    """
    log_level = logging.DEBUG if debug else logging.INFO
    log_format = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

    logging.basicConfig(
        level=log_level,
        format=log_format,
        handlers=[
            logging.StreamHandler(sys.stdout),
        ],
    )

    # 设置第三方库的日志级别
    logging.getLogger("werkzeug").setLevel(logging.WARNING)


def configure_cors(app: Flask) -> None:
    """
    配置 CORS（跨域资源共享）

    Args:
        app: Flask 应用实例
    """

    @app.after_request
    def add_cors_headers(response):  # type: ignore
        """添加 CORS 响应头"""
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type"
        return response


def main() -> None:
    """
    应用入口函数

    启动 Flask 开发服务器。
    """
    config = get_config()
    app = create_app()

    logging.info("启动 Deploy Installer Mock 服务: http://%s:%d", config.host, config.port)
    app.run(
        host=config.host,
        port=config.port,
        debug=config.debug,
    )


if __name__ == "__main__":
    main()
