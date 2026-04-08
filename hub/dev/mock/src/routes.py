"""
路由模块

定义所有 API 路由。
"""

import logging
from flask import Flask, request, jsonify
from typing import Any, Dict

from .handlers import (
    upload_image,
    upload_chart,
    install_or_update_release,
    delete_release,
)


logger = logging.getLogger(__name__)


def register_routes(app: Flask) -> None:
    """
    注册所有路由

    Args:
        app: Flask 应用实例
    """

    @app.route("/internal/api/deploy-installer/v1/agents/image", methods=["PUT"])
    def handle_upload_image() -> tuple[Dict[str, Any], int]:
        """
        处理上传镜像请求

        Returns:
            响应数据和状态码
        """
        try:
            logger.info("接收到上传镜像请求")
            # 获取二进制数据
            image_data = request.get_data()

            if not image_data:
                logger.warning("上传的镜像数据为空")
                return jsonify({
                    "status": 400,
                    "code": 400,
                    "message": "镜像数据不能为空"
                }), 400

            response = upload_image(image_data)
            logger.info(f"镜像上传成功，返回 {len(response.get('images', []))} 个镜像")
            return jsonify(response), 200

        except Exception as e:
            logger.error(f"上传镜像失败: {str(e)}", exc_info=True)
            return jsonify({
                "status": 500,
                "code": 500,
                "message": f"上传镜像失败: {str(e)}"
            }), 500

    @app.route("/internal/api/deploy-installer/v1/agents/chart", methods=["PUT"])
    def handle_upload_chart() -> tuple[Dict[str, Any], int]:
        """
        处理上传 Chart 请求

        Returns:
            响应数据和状态码
        """
        try:
            logger.info("接收到上传 Chart 请求")
            # 获取二进制数据
            chart_data = request.get_data()

            if not chart_data:
                logger.warning("上传的 Chart 数据为空")
                return jsonify({
                    "status": 400,
                    "code": 400,
                    "message": "Chart 数据不能为空"
                }), 400

            response = upload_chart(chart_data)
            logger.info(f"Chart 上传成功: {response.get('chart', {}).get('name', 'unknown')}")
            return jsonify(response), 200

        except Exception as e:
            logger.error(f"上传 Chart 失败: {str(e)}", exc_info=True)
            return jsonify({
                "status": 500,
                "code": 500,
                "message": f"上传 Chart 失败: {str(e)}"
            }), 500

    @app.route("/internal/api/deploy-installer/v1/agents/release/<release_name>", methods=["POST"])
    def handle_install_or_update_release(release_name: str) -> tuple[Dict[str, Any], int]:
        """
        处理安装或更新应用实例请求

        Args:
            release_name: 实例名

        Returns:
            响应数据和状态码
        """
        try:
            logger.info(f"接收到安装/更新实例请求: {release_name}")

            # 获取查询参数
            namespace = request.args.get("namespace")
            set_registry = request.args.get("set-registry", "true").lower() == "true"

            if not namespace:
                logger.warning("命名空间参数缺失")
                return jsonify({
                    "status": 400,
                    "code": 400,
                    "message": "命名空间参数 (namespace) 是必需的"
                }), 400

            # 获取请求体
            body = request.get_json(silent=True)
            if not body:
                logger.warning("请求体为空")
                return jsonify({
                    "status": 400,
                    "code": 400,
                    "message": "请求体不能为空"
                }), 400

            # 验证必需字段
            required_fields = ["name", "version", "values"]
            missing_fields = [field for field in required_fields if field not in body]
            if missing_fields:
                logger.warning(f"请求体缺少必需字段: {missing_fields}")
                return jsonify({
                    "status": 400,
                    "code": 400,
                    "message": f"请求体缺少必需字段: {', '.join(missing_fields)}"
                }), 400

            response = install_or_update_release(
                release_name=release_name,
                namespace=namespace,
                chart_name=body["name"],
                chart_version=body["version"],
                values=body["values"],
                set_registry=set_registry,
            )
            logger.info(f"实例 {release_name} 安装/更新成功")
            return jsonify(response), 200

        except ValueError as e:
            logger.warning(f"参数错误: {str(e)}")
            return jsonify({
                "status": 400,
                "code": 400,
                "message": str(e)
            }), 400
        except Exception as e:
            logger.error(f"安装/更新实例失败: {str(e)}", exc_info=True)
            return jsonify({
                "status": 500,
                "code": 500,
                "message": f"安装/更新实例失败: {str(e)}"
            }), 500

    @app.route("/internal/api/deploy-installer/v1/agents/release/<release_name>", methods=["DELETE"])
    def handle_delete_release(release_name: str) -> tuple[Dict[str, Any], int]:
        """
        处理删除应用实例请求

        Args:
            release_name: 实例名

        Returns:
            响应数据和状态码
        """
        try:
            logger.info(f"接收到删除实例请求: {release_name}")

            # 获取查询参数
            namespace = request.args.get("namespace")

            if not namespace:
                logger.warning("命名空间参数缺失")
                return jsonify({
                    "status": 400,
                    "code": 400,
                    "message": "命名空间参数 (namespace) 是必需的"
                }), 400

            response = delete_release(
                release_name=release_name,
                namespace=namespace,
            )
            logger.info(f"实例 {release_name} 删除成功")
            return jsonify(response), 200

        except ValueError as e:
            logger.warning(f"参数错误: {str(e)}")
            return jsonify({
                "status": 400,
                "code": 400,
                "message": str(e)
            }), 400
        except Exception as e:
            logger.error(f"删除实例失败: {str(e)}", exc_info=True)
            return jsonify({
                "status": 500,
                "code": 500,
                "message": f"删除实例失败: {str(e)}"
            }), 500

    @app.route("/health", methods=["GET"])
    def health_check() -> tuple[Dict[str, str], int]:
        """
        健康检查接口

        Returns:
            响应数据和状态码
        """
        return jsonify({"status": "ok"}), 200

    logger.info("所有路由注册完成")
