"""
处理器模块

实现各个 API 端点的业务逻辑。
"""

import logging
from typing import Any, Dict, List
from .storage import storage


logger = logging.getLogger(__name__)


def upload_image(image_data: bytes) -> Dict[str, Any]:
    """
    上传镜像

    模拟镜像上传过程，返回模拟的镜像列表。

    Args:
        image_data: 镜像二进制数据

    Returns:
        包含镜像列表的响应数据
    """
    # 模拟解析镜像数据，生成镜像列表
    # 在真实场景中，这里会解析 OCI archive 格式的 tar 文件
    images = [
        {
            "from": "docker.io/library/nginx:1.25.0",
            "to": "harbor.example.com/library/nginx:1.25.0"
        },
        {
            "from": "docker.io/library/redis:7.0.0",
            "to": "harbor.example.com/library/redis:7.0.0"
        }
    ]

    # 保存镜像信息到存储
    for image in images:
        storage.add_image(image["to"])

    logger.debug(f"模拟上传了 {len(images)} 个镜像，数据大小: {len(image_data)} bytes")

    return {"images": images}


def upload_chart(chart_data: bytes) -> Dict[str, Any]:
    """
    上传 Chart

    模拟 Helm Chart 上传过程，返回模拟的 Chart 信息和默认值。

    Args:
        chart_data: Chart 二进制数据

    Returns:
        包含 Chart 信息和默认值的响应数据
    """
    # 模拟解析 Chart 数据
    # 在真实场景中，这里会解析 Helm Chart (v2) tar 文件
    chart_info = {
        "name": "example-app",
        "version": "1.0.0",
        "description": "An example application",
        "apiVersion": "v2",
        "appVersion": "1.0.0"
    }

    default_values = {
        "replicaCount": 1,
        "image": {
            "registry": "docker.io",
            "repository": "library/nginx",
            "tag": "1.25.0",
            "pullPolicy": "IfNotPresent"
        },
        "service": {
            "type": "ClusterIP",
            "port": 80
        },
        "resources": {
            "limits": {
                "cpu": "100m",
                "memory": "128Mi"
            },
            "requests": {
                "cpu": "100m",
                "memory": "128Mi"
            }
        }
    }

    # 保存 Chart 信息到存储
    storage.add_chart(chart_info["name"], chart_info["version"], chart_info, default_values)

    logger.debug(f"模拟上传了 Chart: {chart_info['name']}:{chart_info['version']}, 数据大小: {len(chart_data)} bytes")

    return {
        "chart": chart_info,
        "values": default_values
    }


def install_or_update_release(
    release_name: str,
    namespace: str,
    chart_name: str,
    chart_version: str,
    values: Dict[str, Any],
    set_registry: bool = True,
) -> Dict[str, Any]:
    """
    安装或更新应用实例

    模拟 Helm release 的安装或更新过程。

    Args:
        release_name: 实例名
        namespace: 命名空间
        chart_name: Chart 名称
        chart_version: Chart 版本
        values: 配置值
        set_registry: 是否设置镜像仓库地址

    Returns:
        包含当前配置的响应数据

    Raises:
        ValueError: 当参数无效时
    """
    if not release_name:
        raise ValueError("实例名不能为空")

    if not namespace:
        raise ValueError("命名空间不能为空")

    if not chart_name:
        raise ValueError("Chart 名称不能为空")

    if not chart_version:
        raise ValueError("Chart 版本不能为空")

    # 如果设置了 set_registry，则自动配置镜像仓库地址
    final_values = values.copy()
    if set_registry:
        if "image" not in final_values:
            final_values["image"] = {}
        final_values["image"]["registry"] = "harbor.example.com"

    # 保存 release 信息到存储
    storage.add_or_update_release(
        release_name=release_name,
        namespace=namespace,
        chart_name=chart_name,
        chart_version=chart_version,
        values=final_values,
    )

    logger.debug(
        f"模拟安装/更新实例: {release_name} (namespace: {namespace}, "
        f"chart: {chart_name}:{chart_version}, set_registry: {set_registry})"
    )

    return {"values": final_values}


def delete_release(release_name: str, namespace: str) -> Dict[str, Any]:
    """
    删除应用实例

    模拟 Helm release 的删除过程。

    Args:
        release_name: 实例名
        namespace: 命名空间

    Returns:
        包含实例最终配置的响应数据

    Raises:
        ValueError: 当参数无效或实例不存在时
    """
    if not release_name:
        raise ValueError("实例名不能为空")

    if not namespace:
        raise ValueError("命名空间不能为空")

    # 从存储中获取 release 信息
    release = storage.get_release(release_name, namespace)

    if not release:
        raise ValueError(f"实例 {release_name} (namespace: {namespace}) 不存在")

    # 删除 release
    storage.delete_release(release_name, namespace)

    logger.debug(f"模拟删除实例: {release_name} (namespace: {namespace})")

    return {"values": release["values"]}
