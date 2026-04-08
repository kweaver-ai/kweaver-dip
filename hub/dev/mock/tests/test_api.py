"""
API 路由的集成测试
"""

import json
import pytest


class TestImageUploadAPI:
    """镜像上传 API 的测试用例"""

    def test_upload_image_success(self, client):
        """测试成功上传镜像"""
        response = client.put(
            "/internal/api/deploy-installer/v1/agents/image",
            data=b"fake image data",
            content_type="application/octet-stream",
        )

        # 验证响应
        assert response.status_code == 200
        data = response.get_json()
        assert "images" in data
        assert isinstance(data["images"], list)
        assert len(data["images"]) > 0

        # 验证镜像格式
        for image in data["images"]:
            assert "from" in image
            assert "to" in image

    def test_upload_image_with_empty_data(self, client):
        """测试上传空镜像数据"""
        response = client.put(
            "/internal/api/deploy-installer/v1/agents/image",
            data=b"",
            content_type="application/octet-stream",
        )

        # 验证响应
        assert response.status_code == 400
        data = response.get_json()
        assert data["status"] == 400
        assert data["code"] == 400
        assert "镜像数据不能为空" in data["message"]

    def test_upload_image_with_large_data(self, client):
        """测试上传大镜像文件"""
        # 模拟 10MB 数据
        large_data = b"x" * (10 * 1024 * 1024)

        response = client.put(
            "/internal/api/deploy-installer/v1/agents/image",
            data=large_data,
            content_type="application/octet-stream",
        )

        # 验证响应
        assert response.status_code == 200

    def test_upload_image_handler_exception(self, client, mocker):
        """测试处理器抛出异常时的错误处理"""
        # Mock upload_image 函数抛出异常
        mocker.patch(
            "src.routes.upload_image",
            side_effect=Exception("Simulated error"),
        )

        response = client.put(
            "/internal/api/deploy-installer/v1/agents/image",
            data=b"fake image data",
            content_type="application/octet-stream",
        )

        # 验证响应
        assert response.status_code == 500
        data = response.get_json()
        assert data["status"] == 500
        assert data["code"] == 500
        assert "上传镜像失败" in data["message"]


class TestChartUploadAPI:
    """Chart 上传 API 的测试用例"""

    def test_upload_chart_success(self, client):
        """测试成功上传 Chart"""
        response = client.put(
            "/internal/api/deploy-installer/v1/agents/chart",
            data=b"fake chart data",
            content_type="application/octet-stream",
        )

        # 验证响应
        assert response.status_code == 200
        data = response.get_json()
        assert "chart" in data
        assert "values" in data

        # 验证 Chart 信息
        assert "name" in data["chart"]
        assert "version" in data["chart"]

        # 验证默认值
        assert isinstance(data["values"], dict)

    def test_upload_chart_with_empty_data(self, client):
        """测试上传空 Chart 数据"""
        response = client.put(
            "/internal/api/deploy-installer/v1/agents/chart",
            data=b"",
            content_type="application/octet-stream",
        )

        # 验证响应
        assert response.status_code == 400
        data = response.get_json()
        assert data["status"] == 400
        assert data["code"] == 400
        assert "Chart 数据不能为空" in data["message"]

    def test_upload_chart_with_large_data(self, client):
        """测试上传大 Chart 文件"""
        # 模拟 50MB 数据
        large_data = b"x" * (50 * 1024 * 1024)

        response = client.put(
            "/internal/api/deploy-installer/v1/agents/chart",
            data=large_data,
            content_type="application/octet-stream",
        )

        # 验证响应
        assert response.status_code == 200

    def test_upload_chart_handler_exception(self, client, mocker):
        """测试处理器抛出异常时的错误处理"""
        # Mock upload_chart 函数抛出异常
        mocker.patch(
            "src.routes.upload_chart",
            side_effect=Exception("Simulated error"),
        )

        response = client.put(
            "/internal/api/deploy-installer/v1/agents/chart",
            data=b"fake chart data",
            content_type="application/octet-stream",
        )

        # 验证响应
        assert response.status_code == 500
        data = response.get_json()
        assert data["status"] == 500
        assert data["code"] == 500
        assert "上传 Chart 失败" in data["message"]


class TestReleaseInstallAPI:
    """Release 安装/更新 API 的测试用例"""

    def test_install_release_success(self, client):
        """测试成功安装 Release"""
        request_body = {
            "name": "example-app",
            "version": "1.0.0",
            "values": {
                "replicas": 1,
            },
        }

        response = client.post(
            "/internal/api/deploy-installer/v1/agents/release/demo?namespace=default",
            data=json.dumps(request_body),
            content_type="application/json",
        )

        # 验证响应
        assert response.status_code == 200
        data = response.get_json()
        assert "values" in data
        assert isinstance(data["values"], dict)

        # 验证镜像仓库已设置（默认 set-registry=true）
        assert "image" in data["values"]
        assert data["values"]["image"]["registry"] == "harbor.example.com"

    def test_install_release_without_set_registry(self, client):
        """测试不设置镜像仓库"""
        request_body = {
            "name": "example-app",
            "version": "1.0.0",
            "values": {
                "replicas": 1,
            },
        }

        response = client.post(
            "/internal/api/deploy-installer/v1/agents/release/demo?namespace=default&set-registry=false",
            data=json.dumps(request_body),
            content_type="application/json",
        )

        # 验证响应
        assert response.status_code == 200
        data = response.get_json()
        assert "values" in data

        # 验证镜像仓库未设置
        assert data["values"]["replicas"] == 1

    def test_install_release_with_set_registry_true(self, client):
        """测试明确设置 set-registry=true"""
        request_body = {
            "name": "example-app",
            "version": "1.0.0",
            "values": {
                "replicas": 1,
            },
        }

        response = client.post(
            "/internal/api/deploy-installer/v1/agents/release/demo?namespace=default&set-registry=true",
            data=json.dumps(request_body),
            content_type="application/json",
        )

        # 验证响应
        assert response.status_code == 200
        data = response.get_json()
        assert "image" in data["values"]
        assert data["values"]["image"]["registry"] == "harbor.example.com"

    def test_install_release_without_namespace(self, client):
        """测试缺少命名空间参数"""
        request_body = {
            "name": "example-app",
            "version": "1.0.0",
            "values": {},
        }

        response = client.post(
            "/internal/api/deploy-installer/v1/agents/release/demo",
            data=json.dumps(request_body),
            content_type="application/json",
        )

        # 验证响应
        assert response.status_code == 400
        data = response.get_json()
        assert data["status"] == 400
        assert data["code"] == 400
        assert "命名空间参数" in data["message"]

    def test_install_release_without_body(self, client):
        """测试缺少请求体"""
        response = client.post(
            "/internal/api/deploy-installer/v1/agents/release/demo?namespace=default",
            content_type="application/json",
        )

        # 验证响应
        assert response.status_code == 400
        data = response.get_json()
        assert data["status"] == 400
        assert "请求体不能为空" in data["message"]

    def test_install_release_missing_required_field_name(self, client):
        """测试缺少必需字段 name"""
        request_body = {
            "version": "1.0.0",
            "values": {},
        }

        response = client.post(
            "/internal/api/deploy-installer/v1/agents/release/demo?namespace=default",
            data=json.dumps(request_body),
            content_type="application/json",
        )

        # 验证响应
        assert response.status_code == 400
        data = response.get_json()
        assert "缺少必需字段" in data["message"]
        assert "name" in data["message"]

    def test_install_release_missing_required_field_version(self, client):
        """测试缺少必需字段 version"""
        request_body = {
            "name": "example-app",
            "values": {},
        }

        response = client.post(
            "/internal/api/deploy-installer/v1/agents/release/demo?namespace=default",
            data=json.dumps(request_body),
            content_type="application/json",
        )

        # 验证响应
        assert response.status_code == 400
        data = response.get_json()
        assert "缺少必需字段" in data["message"]
        assert "version" in data["message"]

    def test_install_release_missing_required_field_values(self, client):
        """测试缺少必需字段 values"""
        request_body = {
            "name": "example-app",
            "version": "1.0.0",
        }

        response = client.post(
            "/internal/api/deploy-installer/v1/agents/release/demo?namespace=default",
            data=json.dumps(request_body),
            content_type="application/json",
        )

        # 验证响应
        assert response.status_code == 400
        data = response.get_json()
        assert "缺少必需字段" in data["message"]
        assert "values" in data["message"]

    def test_update_existing_release(self, client):
        """测试更新已存在的 Release"""
        # 先安装
        request_body1 = {
            "name": "example-app",
            "version": "1.0.0",
            "values": {"replicas": 1},
        }

        client.post(
            "/internal/api/deploy-installer/v1/agents/release/demo?namespace=default",
            data=json.dumps(request_body1),
            content_type="application/json",
        )

        # 再更新
        request_body2 = {
            "name": "example-app",
            "version": "2.0.0",
            "values": {"replicas": 3},
        }

        response = client.post(
            "/internal/api/deploy-installer/v1/agents/release/demo?namespace=default",
            data=json.dumps(request_body2),
            content_type="application/json",
        )

        # 验证响应
        assert response.status_code == 200
        data = response.get_json()
        assert data["values"]["replicas"] == 3

    def test_install_release_handler_value_error(self, client, mocker):
        """测试处理器抛出 ValueError 时的错误处理"""
        # Mock install_or_update_release 函数抛出 ValueError
        mocker.patch(
            "src.routes.install_or_update_release",
            side_effect=ValueError("Invalid parameter"),
        )

        request_body = {
            "name": "example-app",
            "version": "1.0.0",
            "values": {"replicas": 1},
        }

        response = client.post(
            "/internal/api/deploy-installer/v1/agents/release/demo?namespace=default",
            data=json.dumps(request_body),
            content_type="application/json",
        )

        # 验证响应
        assert response.status_code == 400
        data = response.get_json()
        assert data["status"] == 400
        assert data["code"] == 400
        assert "Invalid parameter" in data["message"]

    def test_install_release_handler_exception(self, client, mocker):
        """测试处理器抛出异常时的错误处理"""
        # Mock install_or_update_release 函数抛出异常
        mocker.patch(
            "src.routes.install_or_update_release",
            side_effect=Exception("Simulated error"),
        )

        request_body = {
            "name": "example-app",
            "version": "1.0.0",
            "values": {"replicas": 1},
        }

        response = client.post(
            "/internal/api/deploy-installer/v1/agents/release/demo?namespace=default",
            data=json.dumps(request_body),
            content_type="application/json",
        )

        # 验证响应
        assert response.status_code == 500
        data = response.get_json()
        assert data["status"] == 500
        assert data["code"] == 500
        assert "安装/更新实例失败" in data["message"]


class TestReleaseDeleteAPI:
    """Release 删除 API 的测试用例"""

    def test_delete_release_success(self, client):
        """测试成功删除 Release"""
        # 先安装
        request_body = {
            "name": "example-app",
            "version": "1.0.0",
            "values": {"replicas": 1},
        }

        client.post(
            "/internal/api/deploy-installer/v1/agents/release/demo?namespace=default",
            data=json.dumps(request_body),
            content_type="application/json",
        )

        # 删除
        response = client.delete(
            "/internal/api/deploy-installer/v1/agents/release/demo?namespace=default",
        )

        # 验证响应
        assert response.status_code == 200
        data = response.get_json()
        assert "values" in data
        assert isinstance(data["values"], dict)

    def test_delete_nonexistent_release(self, client):
        """测试删除不存在的 Release"""
        response = client.delete(
            "/internal/api/deploy-installer/v1/agents/release/nonexistent?namespace=default",
        )

        # 验证响应
        assert response.status_code == 400
        data = response.get_json()
        assert data["status"] == 400
        assert "不存在" in data["message"]

    def test_delete_release_without_namespace(self, client):
        """测试缺少命名空间参数"""
        response = client.delete(
            "/internal/api/deploy-installer/v1/agents/release/demo",
        )

        # 验证响应
        assert response.status_code == 400
        data = response.get_json()
        assert data["status"] == 400
        assert "命名空间参数" in data["message"]

    def test_delete_release_returns_final_values(self, client):
        """测试删除 Release 时返回最终配置值"""
        # 先安装
        request_body = {
            "name": "example-app",
            "version": "1.0.0",
            "values": {"replicas": 3, "env": "prod"},
        }

        client.post(
            "/internal/api/deploy-installer/v1/agents/release/demo?namespace=default",
            data=json.dumps(request_body),
            content_type="application/json",
        )

        # 删除
        response = client.delete(
            "/internal/api/deploy-installer/v1/agents/release/demo?namespace=default",
        )

        # 验证返回的是最终配置值
        assert response.status_code == 200
        data = response.get_json()
        assert data["values"]["replicas"] == 3
        assert data["values"]["env"] == "prod"

    def test_delete_release_handler_exception(self, client, mocker):
        """测试处理器抛出异常时的错误处理"""
        # 先安装一个 Release
        request_body = {
            "name": "example-app",
            "version": "1.0.0",
            "values": {"replicas": 1},
        }

        client.post(
            "/internal/api/deploy-installer/v1/agents/release/demo?namespace=default",
            data=json.dumps(request_body),
            content_type="application/json",
        )

        # Mock delete_release 函数抛出异常
        mocker.patch(
            "src.routes.delete_release",
            side_effect=Exception("Simulated error"),
        )

        response = client.delete(
            "/internal/api/deploy-installer/v1/agents/release/demo?namespace=default",
        )

        # 验证响应
        assert response.status_code == 500
        data = response.get_json()
        assert data["status"] == 500
        assert data["code"] == 500
        assert "删除实例失败" in data["message"]


class TestHealthCheckAPI:
    """健康检查 API 的测试用例"""

    def test_health_check(self, client):
        """测试健康检查"""
        response = client.get("/health")

        # 验证响应
        assert response.status_code == 200
        data = response.get_json()
        assert data["status"] == "ok"
