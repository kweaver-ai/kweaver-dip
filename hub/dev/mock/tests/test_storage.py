"""
存储模块的单元测试
"""

import pytest
from src.storage import Storage


class TestStorage:
    """存储类的测试用例"""

    def test_add_and_get_image(self):
        """测试添加和获取镜像"""
        storage = Storage()

        # 添加镜像
        storage.add_image("nginx:1.25.0")
        storage.add_image("redis:7.0.0")

        # 获取镜像列表
        images = storage.get_images()
        assert len(images) == 2
        assert "nginx:1.25.0" in images
        assert "redis:7.0.0" in images

    def test_add_duplicate_image(self):
        """测试添加重复镜像"""
        storage = Storage()

        # 添加相同的镜像两次
        storage.add_image("nginx:1.25.0")
        storage.add_image("nginx:1.25.0")

        # 应该只保存一个
        images = storage.get_images()
        assert len(images) == 1
        assert images[0] == "nginx:1.25.0"

    def test_add_and_get_chart(self):
        """测试添加和获取 Chart"""
        storage = Storage()

        chart_info = {"name": "app", "version": "1.0.0"}
        default_values = {"replicas": 1}

        # 添加 Chart
        storage.add_chart("app", "1.0.0", chart_info, default_values)

        # 获取 Chart
        chart = storage.get_chart("app", "1.0.0")
        assert chart is not None
        assert chart["name"] == "app"
        assert chart["version"] == "1.0.0"
        assert chart["chart_info"] == chart_info
        assert chart["default_values"] == default_values

    def test_get_nonexistent_chart(self):
        """测试获取不存在的 Chart"""
        storage = Storage()

        # 获取不存在的 Chart
        chart = storage.get_chart("nonexistent", "1.0.0")
        assert chart is None

    def test_get_all_charts(self):
        """测试获取所有 Chart"""
        storage = Storage()

        # 添加多个 Chart
        storage.add_chart("app1", "1.0.0", {}, {})
        storage.add_chart("app2", "2.0.0", {}, {})

        # 获取所有 Chart
        charts = storage.get_all_charts()
        assert len(charts) == 2

    def test_add_or_update_release(self):
        """测试添加或更新 Release"""
        storage = Storage()

        values = {"replicas": 1}

        # 添加 Release
        storage.add_or_update_release(
            release_name="demo",
            namespace="default",
            chart_name="app",
            chart_version="1.0.0",
            values=values,
        )

        # 获取 Release
        release = storage.get_release("demo", "default")
        assert release is not None
        assert release["release_name"] == "demo"
        assert release["namespace"] == "default"
        assert release["chart_name"] == "app"
        assert release["chart_version"] == "1.0.0"
        assert release["values"] == values

    def test_update_existing_release(self):
        """测试更新已存在的 Release"""
        storage = Storage()

        # 添加 Release
        storage.add_or_update_release(
            release_name="demo",
            namespace="default",
            chart_name="app",
            chart_version="1.0.0",
            values={"replicas": 1},
        )

        # 更新 Release
        storage.add_or_update_release(
            release_name="demo",
            namespace="default",
            chart_name="app",
            chart_version="2.0.0",
            values={"replicas": 3},
        )

        # 验证更新
        release = storage.get_release("demo", "default")
        assert release is not None
        assert release["chart_version"] == "2.0.0"
        assert release["values"]["replicas"] == 3

    def test_get_nonexistent_release(self):
        """测试获取不存在的 Release"""
        storage = Storage()

        # 获取不存在的 Release
        release = storage.get_release("nonexistent", "default")
        assert release is None

    def test_delete_release(self):
        """测试删除 Release"""
        storage = Storage()

        # 添加 Release
        storage.add_or_update_release(
            release_name="demo",
            namespace="default",
            chart_name="app",
            chart_version="1.0.0",
            values={},
        )

        # 删除 Release
        result = storage.delete_release("demo", "default")
        assert result is True

        # 验证已删除
        release = storage.get_release("demo", "default")
        assert release is None

    def test_delete_nonexistent_release(self):
        """测试删除不存在的 Release"""
        storage = Storage()

        # 删除不存在的 Release
        result = storage.delete_release("nonexistent", "default")
        assert result is False

    def test_get_all_releases(self):
        """测试获取所有 Release"""
        storage = Storage()

        # 添加多个 Release
        storage.add_or_update_release("app1", "ns1", "chart1", "1.0.0", {})
        storage.add_or_update_release("app2", "ns2", "chart2", "2.0.0", {})

        # 获取所有 Release
        releases = storage.get_all_releases()
        assert len(releases) == 2

    def test_clear_storage(self):
        """测试清空存储"""
        storage = Storage()

        # 添加数据
        storage.add_image("nginx:1.25.0")
        storage.add_chart("app", "1.0.0", {}, {})
        storage.add_or_update_release("demo", "default", "app", "1.0.0", {})

        # 验证数据已添加
        assert len(storage.get_images()) == 1
        assert len(storage.get_all_charts()) == 1
        assert len(storage.get_all_releases()) == 1

        # 清空存储
        storage.clear()

        # 验证数据已清空
        assert len(storage.get_images()) == 0
        assert len(storage.get_all_charts()) == 0
        assert len(storage.get_all_releases()) == 0

    def test_releases_isolated_by_namespace(self):
        """测试不同命名空间的 Release 相互隔离"""
        storage = Storage()

        # 在不同命名空间添加同名 Release
        storage.add_or_update_release("demo", "ns1", "app", "1.0.0", {"env": "ns1"})
        storage.add_or_update_release("demo", "ns2", "app", "1.0.0", {"env": "ns2"})

        # 获取 Release
        release1 = storage.get_release("demo", "ns1")
        release2 = storage.get_release("demo", "ns2")

        # 验证相互隔离
        assert release1 is not None
        assert release2 is not None
        assert release1["values"]["env"] == "ns1"
        assert release2["values"]["env"] == "ns2"

        # 验证总数
        releases = storage.get_all_releases()
        assert len(releases) == 2
