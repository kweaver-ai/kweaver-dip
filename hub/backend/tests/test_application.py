"""
Application Tests

Unit tests and integration tests for application management functionality.
"""
import io
import pytest
import zipfile
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.testclient import TestClient

from src.main import create_app
from src.infrastructure.config.settings import Settings
from src.domains.application import (
    Application, OntologyInfo, AgentInfo, ManifestInfo, MicroAppInfo,
    OntologyConfigItem, AgentConfigItem, ReleaseConfigItem,
)
from src.application.application_service import ApplicationService
from src.adapters.application_adapter import ApplicationAdapter


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
        db_host="localhost",
        db_port=3306,
        db_name="dip_test",
        db_user="root",
        db_password="123456",
        temp_dir="/tmp/dip-hub-test",
    )


@pytest.fixture
def sample_application() -> Application:
    """
    创建示例应用实体。

    返回:
        Application: 示例应用
    """
    return Application(
        id=1,
        key="test-app-001",
        name="测试应用",
        description="这是一个测试应用",
        icon="dGVzdC1pY29uLWRhdGE=",  # Base64 编码的 "test-icon-data"
        version="1.0.0",
        category="测试分类",
        micro_app=MicroAppInfo(
            name="test_app",
            entry="/test_app",
            headless=False,
        ),
        release_config=[ReleaseConfigItem(name="test-release-1", namespace="default")],
        ontology_config=[
            OntologyConfigItem(id="1", is_config=True),
            OntologyConfigItem(id="2", is_config=True),
        ],
        agent_config=[
            AgentConfigItem(id="1", is_config=True),
        ],
        is_config=True,
        updated_by="user-001",
        updated_at=datetime(2024, 1, 1, 12, 0, 0),
    )


@pytest.fixture
def sample_application_no_config() -> Application:
    """
    创建没有配置的示例应用实体。

    返回:
        Application: 示例应用
    """
    return Application(
        id=2,
        key="test-app-002",
        name="测试应用2",
        description="没有配置的应用",
        icon=None,
        version="1.0.0",
        category=None,
        release_config=[],
        ontology_config=[],
        agent_config=[],
        is_config=False,
        updated_by="user-001",
        updated_at=datetime(2024, 1, 1, 12, 0, 0),
    )


def create_test_zip() -> bytes:
    """
    创建测试用的 ZIP 安装包。

    返回:
        bytes: ZIP 文件内容
    """
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
        manifest_content = """
key: test-app-001
name: 测试应用
version: 1.0.0
description: 这是一个测试应用
category: 测试分类
"""
        zf.writestr('manifest.yaml', manifest_content)
    buffer.seek(0)
    return buffer.getvalue()


class TestApplicationDomain:
    """应用领域模型测试。"""

    def test_has_icon_returns_true_when_icon_exists(self, sample_application: Application):
        """测试当图标存在时 has_icon 返回 True。"""
        assert sample_application.has_icon() is True

    def test_has_icon_returns_false_when_icon_is_none(self, sample_application_no_config: Application):
        """测试当图标为 None 时 has_icon 返回 False。"""
        assert sample_application_no_config.has_icon() is False

    def test_has_icon_returns_false_when_icon_is_empty(self):
        """测试当图标为空时 has_icon 返回 False。"""
        app = Application(
            id=1,
            key="test",
            name="test",
            icon="",
            updated_by="user-001",
        )
        assert app.has_icon() is False

    def test_is_configured_returns_true_when_configured(self, sample_application: Application):
        """测试当已配置时 is_configured 返回 True。"""
        assert sample_application.is_configured() is True

    def test_is_configured_returns_false_when_not_configured(self, sample_application_no_config: Application):
        """测试当未配置时 is_configured 返回 False。"""
        assert sample_application_no_config.is_configured() is False

    def test_has_ontologies_returns_true_when_has_ontology_config(self, sample_application: Application):
        """测试当有业务知识网络配置时 has_ontologies 返回 True。"""
        assert sample_application.has_ontologies() is True

    def test_has_ontologies_returns_false_when_no_ontology_config(self, sample_application_no_config: Application):
        """测试当没有业务知识网络配置时 has_ontologies 返回 False。"""
        assert sample_application_no_config.has_ontologies() is False

    def test_has_agents_returns_true_when_has_agent_config(self, sample_application: Application):
        """测试当有智能体配置时 has_agents 返回 True。"""
        assert sample_application.has_agents() is True

    def test_has_agents_returns_false_when_no_agent_config(self, sample_application_no_config: Application):
        """测试当没有智能体配置时 has_agents 返回 False。"""
        assert sample_application_no_config.has_agents() is False


class TestApplicationService:
    """应用服务测试。"""

    @pytest.mark.asyncio
    async def test_get_all_applications_calls_port(self, sample_application: Application):
        """测试 get_all_applications 调用端口的方法。"""
        # 创建 mock 端口
        mock_port = AsyncMock()
        mock_port.get_all_applications.return_value = [sample_application]

        # 创建服务
        service = ApplicationService(mock_port)

        # 调用方法
        result = await service.get_all_applications()

        # 验证
        mock_port.get_all_applications.assert_called_once()
        assert result == [sample_application]

    @pytest.mark.asyncio
    async def test_get_application_by_key_calls_port(self, sample_application: Application):
        """测试 get_application_by_key 调用端口的方法。"""
        # 创建 mock 端口
        mock_port = AsyncMock()
        mock_port.get_application_by_key.return_value = sample_application

        # 创建服务
        service = ApplicationService(mock_port)

        # 调用方法
        result = await service.get_application_by_key("test-app-001")

        # 验证
        mock_port.get_application_by_key.assert_called_once_with("test-app-001")
        assert result == sample_application

    @pytest.mark.asyncio
    async def test_get_application_basic_info_calls_port(self, sample_application: Application):
        """测试 get_application_basic_info 调用端口的方法。"""
        mock_port = AsyncMock()
        mock_port.get_application_by_key.return_value = sample_application

        service = ApplicationService(mock_port)

        result = await service.get_application_basic_info("test-app-001")

        mock_port.get_application_by_key.assert_called_once_with("test-app-001")
        assert result == sample_application

    @pytest.mark.asyncio
    async def test_get_application_ontologies_returns_list(self, sample_application: Application):
        """测试 get_application_ontologies 返回业务知识网络列表。"""
        mock_port = AsyncMock()
        mock_port.get_application_by_key.return_value = sample_application

        service = ApplicationService(mock_port)

        result = await service.get_application_ontologies("test-app-001")

        assert len(result) == 2
        assert result[0]["id"] == "1"
        assert result[1]["id"] == "2"

    @pytest.mark.asyncio
    async def test_get_application_agents_returns_list(self, sample_application: Application):
        """测试 get_application_agents 返回智能体列表。"""
        mock_port = AsyncMock()
        mock_port.get_application_by_key.return_value = sample_application

        service = ApplicationService(mock_port)

        result = await service.get_application_agents("test-app-001")

        assert len(result) == 1
        assert result[0]["id"] == "1"

    @pytest.mark.asyncio
    async def test_configure_application_updates_config(self, sample_application: Application):
        """测试 configure_application 更新配置。"""
        mock_port = AsyncMock()
        mock_port.get_application_by_key.return_value = sample_application
        mock_port.update_application_config.return_value = sample_application

        service = ApplicationService(mock_port)

        result = await service.configure_application(
            key="test-app-001",
            updated_by="user-002",
        )

        # 验证端口被正确调用，并且所有配置项的 is_config 都被置为 True
        mock_port.update_application_config.assert_called_once()
        _, kwargs = mock_port.update_application_config.call_args
        assert kwargs["key"] == "test-app-001"
        assert kwargs["updated_by"] == "user-002"

        for item in kwargs["ontology_config"]:
            assert item.is_config is True
        for item in kwargs["agent_config"]:
            assert item.is_config is True

    @pytest.mark.asyncio
    async def test_delete_application_calls_port(self):
        """测试 delete_application 调用端口的方法。"""
        # 创建 mock 端口
        mock_port = AsyncMock()
        mock_port.delete_application.return_value = True

        # 创建服务
        service = ApplicationService(mock_port)

        # 调用方法
        result = await service.delete_application("test-app-001")

        # 验证
        mock_port.delete_application.assert_called_once_with("test-app-001")
        assert result is True

    @pytest.mark.asyncio
    async def test_delete_application_raises_value_error_when_not_found(self):
        """测试当应用不存在时 delete_application 抛出 ValueError。"""
        # 创建 mock 端口
        mock_port = AsyncMock()
        mock_port.delete_application.side_effect = ValueError("应用不存在: nonexistent-key")

        # 创建服务
        service = ApplicationService(mock_port)

        # 调用方法并验证异常
        with pytest.raises(ValueError, match="应用不存在: nonexistent-key"):
            await service.delete_application("nonexistent-key")

    @pytest.mark.asyncio
    async def test_uninstall_application_deletes_releases(self, sample_application: Application):
        """测试 uninstall_application 删除 Release 和数据库记录。"""
        mock_app_port = AsyncMock()
        mock_app_port.get_application_by_key.return_value = sample_application
        mock_app_port.delete_application.return_value = True

        mock_deploy_port = AsyncMock()
        mock_deploy_port.delete_release.return_value = MagicMock()

        service = ApplicationService(
            application_port=mock_app_port,
            deploy_installer_port=mock_deploy_port,
        )

        result = await service.uninstall_application("test-app-001")

        assert result is True
        mock_deploy_port.delete_release.assert_called_once_with(
            release_name="test-release-1",
            namespace="default",
            auth_token=None,
        )
        mock_app_port.delete_application.assert_called_once_with("test-app-001")

    def test_parse_manifest_returns_manifest_info(self, test_settings: Settings):
        """测试 _parse_manifest 返回 ManifestInfo。"""
        service = ApplicationService(AsyncMock(), settings=test_settings)

        data = {
            "key": "test-app",
            "name": "Test App",
            "version": "1.0.0",
            "description": "Test description",
            "category": "Test category",
        }

        result = service._parse_manifest(data)

        assert result.key == "test-app"
        assert result.name == "Test App"
        assert result.version == "1.0.0"
        assert result.description == "Test description"
        assert result.category == "Test category"

    def test_parse_manifest_raises_error_when_missing_key(self, test_settings: Settings):
        """测试 _parse_manifest 当缺少 key 时抛出错误。"""
        service = ApplicationService(AsyncMock(), settings=test_settings)

        data = {
            "name": "Test App",
            "version": "1.0.0",
        }

        with pytest.raises(ValueError, match="缺少 key 字段"):
            service._parse_manifest(data)

    def test_is_version_greater_returns_true_for_higher_version(self, test_settings: Settings):
        """测试 _is_version_greater 对于更高版本返回 True。"""
        service = ApplicationService(AsyncMock(), settings=test_settings)

        assert service._is_version_greater("2.0.0", "1.0.0") is True
        assert service._is_version_greater("1.1.0", "1.0.0") is True
        assert service._is_version_greater("1.0.1", "1.0.0") is True

    def test_is_version_greater_returns_false_for_lower_version(self, test_settings: Settings):
        """测试 _is_version_greater 对于更低版本返回 False。"""
        service = ApplicationService(AsyncMock(), settings=test_settings)

        assert service._is_version_greater("1.0.0", "2.0.0") is False
        assert service._is_version_greater("1.0.0", "1.1.0") is False
        assert service._is_version_greater("1.0.0", "1.0.1") is False

    def test_is_version_greater_returns_true_when_no_old_version(self, test_settings: Settings):
        """测试 _is_version_greater 当没有旧版本时返回 True。"""
        service = ApplicationService(AsyncMock(), settings=test_settings)

        assert service._is_version_greater("1.0.0", None) is True
        assert service._is_version_greater("1.0.0", "") is True


class TestApplicationAdapter:
    """应用适配器测试。"""

    @pytest.mark.asyncio
    async def test_row_to_application_converts_correctly(self, test_settings: Settings):
        """测试数据库行转换为应用模型。"""
        adapter = ApplicationAdapter(test_settings)

        row = (
            1,                              # id
            "test-app-001",                 # key
            "测试应用",                     # name
            "这是一个测试应用",             # description
            b"test-icon",                   # icon (binary)
            "1.0.0",                        # version
            "测试分类",                     # category
            '{"name": "test_app", "entry": "/test_app", "headless": false}',  # micro_app (JSON)
            '["release-1"]',                # release_config (JSON)
            '[{"id": 1, "is_config": true}, {"id": 2, "is_config": false}]',  # ontology_config (JSON)
            '[{"id": 1, "is_config": true}]',  # agent_config (JSON)
            True,                           # is_config
            "user-001",                     # updated_by
            datetime(2024, 1, 1, 12, 0, 0), # updated_at
        )

        app = adapter._row_to_application(row)

        assert app.id == 1
        assert app.key == "test-app-001"
        assert app.name == "测试应用"
        assert app.description == "这是一个测试应用"
        assert app.icon == "dGVzdC1pY29u"  # Base64 编码后的 "test-icon"
        assert app.version == "1.0.0"
        assert app.category == "测试分类"
        assert app.micro_app is not None
        assert app.micro_app.name == "test_app"
        assert app.micro_app.entry == "/test_app"
        assert app.micro_app.headless is False
        assert app.release_config == ["release-1"]
        assert len(app.ontology_config) == 2
        assert app.ontology_config[0].id == 1
        assert app.ontology_config[0].is_config is True
        assert app.ontology_config[1].id == 2
        assert app.ontology_config[1].is_config is False
        assert len(app.agent_config) == 1
        assert app.agent_config[0].id == 1
        assert app.agent_config[0].is_config is True
        assert app.is_config is True
        assert app.updated_by == "user-001"
        assert app.updated_at == datetime(2024, 1, 1, 12, 0, 0)

    @pytest.mark.asyncio
    async def test_row_to_application_handles_null_values(self, test_settings: Settings):
        """测试处理 NULL 值。"""
        adapter = ApplicationAdapter(test_settings)

        row = (
            1,
            "test-app-001",
            "测试应用",
            None,  # description
            None,  # icon
            None,  # version
            None,  # category
            None,  # micro_app
            None,  # release_config
            None,  # ontology_ids
            None,  # agent_ids
            False, # is_config
            "user-001",
            datetime(2024, 1, 1, 12, 0, 0),
        )

        app = adapter._row_to_application(row)

        assert app.description is None
        assert app.icon is None
        assert app.version is None
        assert app.category is None
        assert app.release_config == []
        assert app.ontology_config == []
        assert app.agent_config == []
        assert app.is_config is False

    @pytest.mark.asyncio
    async def test_row_to_application_handles_invalid_json(self, test_settings: Settings):
        """测试处理无效 JSON。"""
        adapter = ApplicationAdapter(test_settings)

        row = (
            1,
            "test-app-001",
            "测试应用",
            None,
            None,
            None,
            None,
            None,  # micro_app
            "{invalid-json}",  # Invalid JSON
            "{invalid}",
            "{invalid}",
            False,
            "user-001",
            datetime(2024, 1, 1, 12, 0, 0),
        )

        with patch('src.adapters.application_adapter.logger') as mock_logger:
            app = adapter._row_to_application(row)
            assert app.release_config == []
            assert app.ontology_config == []
            assert app.agent_config == []

    def test_parse_json_list_returns_list_for_valid_json(self, test_settings: Settings):
        """测试 _parse_json_list 对有效 JSON 返回列表。"""
        adapter = ApplicationAdapter(test_settings)

        assert adapter._parse_json_list('[1, 2, 3]') == [1, 2, 3]
        assert adapter._parse_json_list('["a", "b"]') == ["a", "b"]

    def test_parse_json_list_returns_default_for_invalid_json(self, test_settings: Settings):
        """测试 _parse_json_list 对无效 JSON 返回默认值。"""
        adapter = ApplicationAdapter(test_settings)

        assert adapter._parse_json_list('{invalid}') == []
        assert adapter._parse_json_list(None) == []
        assert adapter._parse_json_list('') == []


class TestApplicationRouter:
    """应用路由测试。"""

    def test_get_applications_endpoint_returns_200(self, test_settings: Settings):
        """测试获取应用列表接口返回 200 状态码。"""
        with patch('src.adapters.application_adapter.ApplicationAdapter.get_all_applications') as mock_get_all:
            mock_get_all.return_value = []

            app = create_app(test_settings)
            client = TestClient(app)

            response = client.get(f"{test_settings.api_prefix}/applications")

            assert response.status_code == 200

    def test_get_applications_endpoint_returns_array(self, test_settings: Settings):
        """测试获取应用列表接口返回数组格式。"""
        with patch('src.adapters.application_adapter.ApplicationAdapter.get_all_applications') as mock_get_all:
            mock_get_all.return_value = []

            app = create_app(test_settings)
            client = TestClient(app)

            response = client.get(f"{test_settings.api_prefix}/applications")

            assert response.status_code == 200
            data = response.json()
            assert isinstance(data, list)
            assert len(data) == 0

    def test_get_application_basic_info_endpoint_returns_404_when_not_found(self, test_settings: Settings):
        """测试当应用不存在时获取基础信息接口返回 404 状态码。"""
        with patch('src.adapters.application_adapter.ApplicationAdapter.get_application_by_key') as mock_get_by_key:
            mock_get_by_key.side_effect = ValueError("应用不存在: nonexistent-key")

            app = create_app(test_settings)
            client = TestClient(app)

            response = client.get(
                f"{test_settings.api_prefix}/applications/basic-info",
                params={"key": "nonexistent-key"}
            )

            assert response.status_code == 404

    def test_get_application_ontologies_endpoint_returns_404_when_not_found(self, test_settings: Settings):
        """测试当应用不存在时获取业务知识网络配置接口返回 404 状态码。"""
        with patch('src.adapters.application_adapter.ApplicationAdapter.get_application_by_key') as mock_get_by_key:
            mock_get_by_key.side_effect = ValueError("应用不存在: nonexistent-key")

            app = create_app(test_settings)
            client = TestClient(app)

            response = client.get(
                f"{test_settings.api_prefix}/applications/ontologies",
                params={"key": "nonexistent-key"}
            )

            assert response.status_code == 404

    def test_get_application_agents_endpoint_returns_404_when_not_found(self, test_settings: Settings):
        """测试当应用不存在时获取智能体配置接口返回 404 状态码。"""
        with patch('src.adapters.application_adapter.ApplicationAdapter.get_application_by_key') as mock_get_by_key:
            mock_get_by_key.side_effect = ValueError("应用不存在: nonexistent-key")

            app = create_app(test_settings)
            client = TestClient(app)

            response = client.get(
                f"{test_settings.api_prefix}/applications/agents",
                params={"key": "nonexistent-key"}
            )

            assert response.status_code == 404

    def test_delete_application_endpoint_returns_204_when_successful(self, test_settings: Settings):
        """测试删除应用成功时接口返回 204 状态码。"""
        with patch('src.adapters.application_adapter.ApplicationAdapter.get_application_by_key') as mock_get:
            with patch('src.adapters.application_adapter.ApplicationAdapter.delete_application') as mock_delete:
                mock_get.return_value = Application(
                    id=1,
                    key="test-app-001",
                    name="Test",
                    release_config=[],
                    updated_by="user",
                )
                mock_delete.return_value = True

                app = create_app(test_settings)
                client = TestClient(app)

                response = client.delete(f"{test_settings.api_prefix}/applications/test-app-001")

                assert response.status_code == 204

    def test_delete_application_endpoint_returns_404_when_not_found(self, test_settings: Settings):
        """测试当应用不存在时删除应用接口返回 404 状态码。"""
        with patch('src.adapters.application_adapter.ApplicationAdapter.get_application_by_key') as mock_get:
            mock_get.side_effect = ValueError("应用不存在: nonexistent-key")

            app = create_app(test_settings)
            client = TestClient(app)

            response = client.delete(f"{test_settings.api_prefix}/applications/nonexistent-key")

            assert response.status_code == 404
            assert "应用不存在" in str(response.json())

    def test_install_application_endpoint_returns_400_when_empty_body(self, test_settings: Settings):
        """测试安装应用接口当请求体为空时返回 400 状态码。"""
        app = create_app(test_settings)
        client = TestClient(app)

        response = client.post(
            f"{test_settings.api_prefix}/applications",
            content=b"",
            headers={"Content-Type": "application/octet-stream"}
        )

        assert response.status_code == 400

    def test_configure_application_endpoint_returns_404_when_not_found(self, test_settings: Settings):
        """测试配置应用接口当应用不存在时返回 404 状态码。"""
        with patch('src.adapters.application_adapter.ApplicationAdapter.get_application_by_key') as mock_get:
            mock_get.side_effect = ValueError("应用不存在: nonexistent-key")

            app = create_app(test_settings)
            client = TestClient(app)

            response = client.put(
                f"{test_settings.api_prefix}/applications/config",
                params={"key": "nonexistent-key"},
                json={
                    "ontology_config": [
                        {"id": 1, "is_config": True},
                        {"id": 2, "is_config": False}
                    ],
                    "agent_config": [
                        {"id": 1, "is_config": True}
                    ]
                }
            )

            assert response.status_code == 404


class TestExternalServiceMocks:
    """外部服务 Mock 测试。"""

    @pytest.mark.asyncio
    async def test_ontology_manager_mock_get_knowledge_network(self):
        """测试 Ontology Manager Mock 获取业务知识网络。"""
        from src.ports.external_service_port import KnowledgeNetworkInfo

        mock_port = AsyncMock()
        mock_port.get_knowledge_network.return_value = KnowledgeNetworkInfo(
            id="1",
            name="测试业务知识网络",
            comment="这是一个测试",
        )

        result = await mock_port.get_knowledge_network("1")

        assert result.id == "1"
        assert result.name == "测试业务知识网络"
        assert result.comment == "这是一个测试"

    @pytest.mark.asyncio
    async def test_deploy_installer_mock_upload_image(self):
        """测试 Deploy Installer Mock 上传镜像。"""
        from src.ports.external_service_port import ImageUploadResult

        mock_port = AsyncMock()
        mock_port.upload_image.return_value = [
            ImageUploadResult(from_name="image:v1", to_name="registry/image:v1"),
        ]

        result = await mock_port.upload_image(io.BytesIO(b"image-data"))

        assert len(result) == 1
        assert result[0].from_name == "image:v1"
        assert result[0].to_name == "registry/image:v1"

    @pytest.mark.asyncio
    async def test_agent_factory_mock_create_agent(self):
        """测试 Agent Factory Mock 创建智能体。"""
        from src.ports.external_service_port import AgentFactoryResult

        mock_port = AsyncMock()
        mock_port.create_agent.return_value = AgentFactoryResult(
            id="123",
            version="v0",
        )

        result = await mock_port.create_agent({"name": "test-agent"})

        assert result.id == "123"
        assert result.version == "v0"
