"""
Health Check Tests

Unit tests and integration tests for health check functionality.
"""
import pytest
from fastapi.testclient import TestClient

from src.main import create_app
from src.infrastructure.config.settings import Settings


@pytest.fixture
def test_settings() -> Settings:
    """
    创建测试配置。

    返回:
        Settings: 测试用的应用配置。
    """
    return Settings(
        app_name="DIP Hub Test",
        app_version="1.0.0-test",
        debug=True,
        host="127.0.0.1",
        port=8080,
    )


@pytest.fixture
def test_client(test_settings: Settings) -> TestClient:
    """
    创建测试客户端。

    参数:
        test_settings: 测试配置。

    返回:
        TestClient: FastAPI 测试客户端。
    """
    app = create_app(test_settings)
    return TestClient(app)


class TestHealthEndpoint:
    """健康检查接口测试。"""

    def test_healthz_returns_200_when_healthy(self, test_client: TestClient, test_settings: Settings):
        """测试健康检查在服务健康时返回 200 状态码。"""
        response = test_client.get(f"{test_settings.api_prefix}/healthz")

        assert response.status_code == 200

    def test_healthz_returns_empty_response(self, test_client: TestClient, test_settings: Settings):
        """测试健康检查返回空响应体。"""
        response = test_client.get(f"{test_settings.api_prefix}/healthz")

        # 响应体应该为空
        assert response.text == ""


class TestReadyEndpoint:
    """就绪检查接口测试。"""

    def test_readyz_returns_503_when_not_ready(self, test_client: TestClient, test_settings: Settings):
        """测试就绪检查在服务未就绪时返回 503 状态码。"""
        # 由于 TestClient 不会触发 lifespan 事件，服务默认是 not ready 状态
        response = test_client.get(f"{test_settings.api_prefix}/readyz")

        # TestClient 不触发 lifespan，所以服务不会设置为 ready
        assert response.status_code == 503

    def test_readyz_returns_empty_response(self, test_client: TestClient, test_settings: Settings):
        """测试就绪检查返回空响应体。"""
        response = test_client.get(f"{test_settings.api_prefix}/readyz")

        # 响应体应该为空
        assert response.text == ""

