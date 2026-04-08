"""
存储模块

提供内存存储功能，用于保存模拟数据。
"""

import logging
from typing import Any, Dict, List, Optional


logger = logging.getLogger(__name__)


class Storage:
    """
    内存存储类

    用于在内存中保存镜像、Chart 和 Release 信息。

    Attributes:
        _images: 镜像列表
        _charts: Chart 字典，key 为 "name:version"
        _releases: Release 字典，key 为 "release_name:namespace"
    """

    def __init__(self) -> None:
        """初始化存储"""
        self._images: List[str] = []
        self._charts: Dict[str, Dict[str, Any]] = {}
        self._releases: Dict[str, Dict[str, Any]] = {}

    def add_image(self, image_name: str) -> None:
        """
        添加镜像

        Args:
            image_name: 镜像名称
        """
        if image_name not in self._images:
            self._images.append(image_name)
            logger.debug(f"添加镜像: {image_name}")

    def get_images(self) -> List[str]:
        """
        获取所有镜像

        Returns:
            镜像名称列表
        """
        return self._images.copy()

    def add_chart(
        self,
        name: str,
        version: str,
        chart_info: Dict[str, Any],
        default_values: Dict[str, Any],
    ) -> None:
        """
        添加 Chart

        Args:
            name: Chart 名称
            version: Chart 版本
            chart_info: Chart 信息
            default_values: Chart 默认值
        """
        key = f"{name}:{version}"
        self._charts[key] = {
            "name": name,
            "version": version,
            "chart_info": chart_info,
            "default_values": default_values,
        }
        logger.debug(f"添加 Chart: {key}")

    def get_chart(self, name: str, version: str) -> Optional[Dict[str, Any]]:
        """
        获取 Chart

        Args:
            name: Chart 名称
            version: Chart 版本

        Returns:
            Chart 信息，如果不存在则返回 None
        """
        key = f"{name}:{version}"
        return self._charts.get(key)

    def get_all_charts(self) -> List[Dict[str, Any]]:
        """
        获取所有 Chart

        Returns:
            Chart 列表
        """
        return list(self._charts.values())

    def add_or_update_release(
        self,
        release_name: str,
        namespace: str,
        chart_name: str,
        chart_version: str,
        values: Dict[str, Any],
    ) -> None:
        """
        添加或更新 Release

        Args:
            release_name: Release 名称
            namespace: 命名空间
            chart_name: Chart 名称
            chart_version: Chart 版本
            values: 配置值
        """
        key = f"{release_name}:{namespace}"
        self._releases[key] = {
            "release_name": release_name,
            "namespace": namespace,
            "chart_name": chart_name,
            "chart_version": chart_version,
            "values": values,
        }
        logger.debug(f"添加/更新 Release: {key}")

    def get_release(self, release_name: str, namespace: str) -> Optional[Dict[str, Any]]:
        """
        获取 Release

        Args:
            release_name: Release 名称
            namespace: 命名空间

        Returns:
            Release 信息，如果不存在则返回 None
        """
        key = f"{release_name}:{namespace}"
        return self._releases.get(key)

    def delete_release(self, release_name: str, namespace: str) -> bool:
        """
        删除 Release

        Args:
            release_name: Release 名称
            namespace: 命名空间

        Returns:
            是否删除成功
        """
        key = f"{release_name}:{namespace}"
        if key in self._releases:
            del self._releases[key]
            logger.debug(f"删除 Release: {key}")
            return True
        return False

    def get_all_releases(self) -> List[Dict[str, Any]]:
        """
        获取所有 Release

        Returns:
            Release 列表
        """
        return list(self._releases.values())

    def clear(self) -> None:
        """清空所有数据"""
        self._images.clear()
        self._charts.clear()
        self._releases.clear()
        logger.debug("清空所有存储数据")


# 全局存储实例
storage = Storage()
