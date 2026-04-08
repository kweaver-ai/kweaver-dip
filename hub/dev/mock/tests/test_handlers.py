"""
处理器模块的单元测试
"""

import pytest
from src.handlers import upload_image, upload_chart, install_or_update_release, delete_release
from src.storage import storage


class TestUploadImage:
    """上传镜像处理器的测试用例"""

    def test_upload_image_success(self):
        """测试成功上传镜像"""
        image_data = b"fake image data"

        result = upload_image(image_data)

        # 验证返回结果
        assert "images" in result
        assert isinstance(result["images"], list)
        assert len(result["images"]) > 0

        # 验证镜像格式
        for image in result["images"]:
            assert "from" in image
            assert "to" in image
            assert isinstance(image["from"], str)
            assert isinstance(image["to"], str)

        # 验证镜像已保存到存储
        stored_images = storage.get_images()
        assert len(stored_images) > 0

    def test_upload_image_with_empty_data(self):
        """测试上传空镜像数据"""
        image_data = b""

        result = upload_image(image_data)

        # 即使是空数据，也应该返回镜像列表（模拟场景）
        assert "images" in result

    def test_upload_image_with_large_data(self):
        """测试上传大镜像数据"""
        # 模拟 1MB 数据
        image_data = b"x" * (1024 * 1024)

        result = upload_image(image_data)

        # 验证返回结果
        assert "images" in result
        assert len(result["images"]) > 0


class TestUploadChart:
    """上传 Chart 处理器的测试用例"""

    def test_upload_chart_success(self):
        """测试成功上传 Chart"""
        chart_data = b"fake chart data"

        result = upload_chart(chart_data)

        # 验证返回结果
        assert "chart" in result
        assert "values" in result

        # 验证 Chart 信息
        chart = result["chart"]
        assert "name" in chart
        assert "version" in chart
        assert isinstance(chart["name"], str)
        assert isinstance(chart["version"], str)

        # 验证默认值
        values = result["values"]
        assert isinstance(values, dict)

        # 验证 Chart 已保存到存储
        stored_chart = storage.get_chart(chart["name"], chart["version"])
        assert stored_chart is not None

    def test_upload_chart_with_empty_data(self):
        """测试上传空 Chart 数据"""
        chart_data = b""

        result = upload_chart(chart_data)

        # 即使是空数据，也应该返回 Chart 信息（模拟场景）
        assert "chart" in result
        assert "values" in result

    def test_upload_chart_with_large_data(self):
        """测试上传大 Chart 数据"""
        # 模拟 10MB 数据
        chart_data = b"x" * (10 * 1024 * 1024)

        result = upload_chart(chart_data)

        # 验证返回结果
        assert "chart" in result
        assert "values" in result


class TestInstallOrUpdateRelease:
    """安装或更新 Release 处理器的测试用例"""

    def test_install_release_success(self):
        """测试成功安装 Release"""
        result = install_or_update_release(
            release_name="demo",
            namespace="default",
            chart_name="app",
            chart_version="1.0.0",
            values={"replicas": 1},
            set_registry=True,
        )

        # 验证返回结果
        assert "values" in result
        assert isinstance(result["values"], dict)

        # 验证镜像仓库已设置
        assert "image" in result["values"]
        assert result["values"]["image"]["registry"] == "harbor.example.com"

        # 验证 Release 已保存到存储
        stored_release = storage.get_release("demo", "default")
        assert stored_release is not None
        assert stored_release["chart_name"] == "app"
        assert stored_release["chart_version"] == "1.0.0"

    def test_install_release_without_set_registry(self):
        """测试不设置镜像仓库地址"""
        values = {"replicas": 1}

        result = install_or_update_release(
            release_name="demo",
            namespace="default",
            chart_name="app",
            chart_version="1.0.0",
            values=values,
            set_registry=False,
        )

        # 验证返回结果
        assert "values" in result

        # 验证镜像仓库未设置
        # 原始 values 中没有 image 字段，不设置仓库时应该保持不变
        assert result["values"]["replicas"] == 1

    def test_update_existing_release(self):
        """测试更新已存在的 Release"""
        # 先安装
        install_or_update_release(
            release_name="demo",
            namespace="default",
            chart_name="app",
            chart_version="1.0.0",
            values={"replicas": 1},
        )

        # 再更新
        result = install_or_update_release(
            release_name="demo",
            namespace="default",
            chart_name="app",
            chart_version="2.0.0",
            values={"replicas": 3},
        )

        # 验证返回结果
        assert "values" in result
        assert result["values"]["replicas"] == 3

        # 验证存储中的 Release 已更新
        stored_release = storage.get_release("demo", "default")
        assert stored_release is not None
        assert stored_release["chart_version"] == "2.0.0"
        assert stored_release["values"]["replicas"] == 3

    def test_install_release_with_empty_release_name(self):
        """测试空的 Release 名称"""
        with pytest.raises(ValueError, match="实例名不能为空"):
            install_or_update_release(
                release_name="",
                namespace="default",
                chart_name="app",
                chart_version="1.0.0",
                values={},
            )

    def test_install_release_with_empty_namespace(self):
        """测试空的命名空间"""
        with pytest.raises(ValueError, match="命名空间不能为空"):
            install_or_update_release(
                release_name="demo",
                namespace="",
                chart_name="app",
                chart_version="1.0.0",
                values={},
            )

    def test_install_release_with_empty_chart_name(self):
        """测试空的 Chart 名称"""
        with pytest.raises(ValueError, match="Chart 名称不能为空"):
            install_or_update_release(
                release_name="demo",
                namespace="default",
                chart_name="",
                chart_version="1.0.0",
                values={},
            )

    def test_install_release_with_empty_chart_version(self):
        """测试空的 Chart 版本"""
        with pytest.raises(ValueError, match="Chart 版本不能为空"):
            install_or_update_release(
                release_name="demo",
                namespace="default",
                chart_name="app",
                chart_version="",
                values={},
            )

    def test_install_release_preserves_existing_image_config(self):
        """测试设置镜像仓库时保留原有的镜像配置"""
        values = {
            "replicas": 1,
            "image": {
                "repository": "my-app",
                "tag": "1.0.0",
            },
        }

        result = install_or_update_release(
            release_name="demo",
            namespace="default",
            chart_name="app",
            chart_version="1.0.0",
            values=values,
            set_registry=True,
        )

        # 验证原有配置被保留，同时添加了 registry
        assert result["values"]["image"]["registry"] == "harbor.example.com"
        assert result["values"]["image"]["repository"] == "my-app"
        assert result["values"]["image"]["tag"] == "1.0.0"


class TestDeleteRelease:
    """删除 Release 处理器的测试用例"""

    def test_delete_release_success(self):
        """测试成功删除 Release"""
        # 先安装
        values = {"replicas": 1}
        install_or_update_release(
            release_name="demo",
            namespace="default",
            chart_name="app",
            chart_version="1.0.0",
            values=values,
        )

        # 删除
        result = delete_release(
            release_name="demo",
            namespace="default",
        )

        # 验证返回结果包含最终配置
        assert "values" in result
        assert isinstance(result["values"], dict)

        # 验证 Release 已从存储中删除
        stored_release = storage.get_release("demo", "default")
        assert stored_release is None

    def test_delete_nonexistent_release(self):
        """测试删除不存在的 Release"""
        with pytest.raises(ValueError, match="实例.*不存在"):
            delete_release(
                release_name="nonexistent",
                namespace="default",
            )

    def test_delete_release_with_empty_release_name(self):
        """测试空的 Release 名称"""
        with pytest.raises(ValueError, match="实例名不能为空"):
            delete_release(
                release_name="",
                namespace="default",
            )

    def test_delete_release_with_empty_namespace(self):
        """测试空的命名空间"""
        with pytest.raises(ValueError, match="命名空间不能为空"):
            delete_release(
                release_name="demo",
                namespace="",
            )

    def test_delete_release_returns_final_values(self):
        """测试删除 Release 时返回最终配置值"""
        # 先安装
        values = {"replicas": 3, "env": "prod"}
        install_or_update_release(
            release_name="demo",
            namespace="default",
            chart_name="app",
            chart_version="1.0.0",
            values=values,
            set_registry=True,
        )

        # 删除
        result = delete_release(
            release_name="demo",
            namespace="default",
        )

        # 验证返回的是最终配置值（包含设置的 registry）
        assert "values" in result
        assert result["values"]["replicas"] == 3
        assert result["values"]["env"] == "prod"
        assert "image" in result["values"]
        assert result["values"]["image"]["registry"] == "harbor.example.com"
