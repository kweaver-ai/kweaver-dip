"""
应用路由

应用管理端点的 FastAPI 路由。
这是处理 HTTP 请求并委托给应用层的接口适配器。
"""
import io
import logging
from fastapi import APIRouter, Query, Path, Request, status
from fastapi.responses import Response
from typing import List, Optional

from src.application.application_service import ApplicationService
from src.infrastructure.context.token_context import get_user_info
from src.infrastructure.exceptions import (
    ValidationError, NotFoundError, ConflictError, InternalError, UnauthorizedError
)
from src.routers.schemas.application import (
    ApplicationResponse,
    ApplicationBasicInfoResponse,
    MicroAppResponse,
    OntologyConfigItemResponse,
    AgentConfigItemResponse,
    ReleaseConfigItemResponse,
    SetPinnedRequest,
    ErrorResponse,
)

logger = logging.getLogger(__name__)


def create_application_router(application_service: ApplicationService) -> APIRouter:
    """
    创建应用路由。

    参数:
        application_service: 应用服务实例

    返回:
        APIRouter: 配置完成的路由
    """
    router = APIRouter(tags=["Application"])

    def _micro_app_to_response(micro_app) -> MicroAppResponse:
        """将微应用领域模型转换为响应模型。"""
        if micro_app is None:
            return None
        return MicroAppResponse(
            name=micro_app.name,
            entry=micro_app.entry,
            headless=micro_app.headless,
        )

    def _application_to_response(app) -> ApplicationResponse:
        """将应用领域模型转换为响应模型。"""
        return ApplicationResponse(
            key=app.key,
            name=app.name,
            description=app.description,
            icon=app.icon,
            category=app.category,
            version=app.version,
            micro_app=_micro_app_to_response(app.micro_app),
            release_config=[
                ReleaseConfigItemResponse(name=item.name, namespace=item.namespace)
                for item in (app.release_config or [])
            ],
            ontology_config=[
                OntologyConfigItemResponse(id=item.id, is_config=item.is_config)
                for item in (app.ontology_config or [])
            ],
            agent_config=[
                AgentConfigItemResponse(id=item.id, is_config=item.is_config)
                for item in (app.agent_config or [])
            ],
            is_config=app.is_config,
            pinned=getattr(app, 'pinned', False),
            updated_by=app.updated_by,
            updated_by_id=app.updated_by_id,
            updated_at=app.updated_at,
        )

    # ============ 1、安装应用 ============
    @router.post(
        "/applications",
        summary="安装应用",
        description="上传 zip 格式安装包进行安装（流式上传）",
        response_model=ApplicationResponse,
        responses={
            200: {"description": "安装成功"},
            400: {"description": "请求参数错误", "model": ErrorResponse},
            409: {"description": "版本冲突", "model": ErrorResponse},
            500: {"description": "服务器内部错误", "model": ErrorResponse},
        }
    )
    async def install_application(request: Request) -> ApplicationResponse:
        """
        安装应用。

        接收 zip 格式安装包（流式上传），解析并安装应用。

        流程：
        1. 上传 zip 格式安装包（流式上传）
        2. 校验应用安装包结构和 manifest.yaml
        3. 解析 application.key，校验 version
        4. 如果应用已存在，版本号必须大于已上传版本
        5. 解压安装包，上传镜像和 Chart
        6. 导入业务知识网络和 DataAgent 智能体
        7. 更新应用信息

        返回:
            ApplicationResponse: 安装后的应用信息
        """
        try:
            logger.info("[install_application] 收到应用安装请求")
            # 读取请求体（流式上传的 zip 数据）
            body = await request.body()
            logger.info(f"[install_application] 请求体大小: {len(body)} bytes")
            
            if not body:
                logger.error("[install_application] 请求体为空")
                raise ValidationError(
                    code="INVALID_REQUEST",
                    description="请求体不能为空",
                    solution="请上传有效的应用安装包（ZIP格式）",
                )
            
            # 从上下文获取用户信息（由中间件通过token内省获取）
            user_info = get_user_info()
            if not user_info:
                logger.error("[install_application] 无法获取用户信息")
                raise UnauthorizedError(
                    description="无法获取用户信息",
                    solution="请使用有效的token重新登录",
                )
            updated_by = user_info.vision_name
            updated_by_id = user_info.id
            logger.info(f"[install_application] 更新者: {updated_by} (ID: {updated_by_id})")
            # 认证 Token 已由中间件统一提取并存储到 request.state 和 TokenContext
            # 适配器层会从 TokenContext 统一获取，这里可以不再传递
            auth_token = getattr(request.state, "auth_token", None)
            logger.debug(f"[install_application] 认证 Token: {'已提供' if auth_token else '未提供'}")
            
            # 调用服务安装应用
            logger.info("[install_application] 开始调用应用服务安装应用")
            zip_data = io.BytesIO(body)
            application = await application_service.install_application(
                zip_data=zip_data,
                updated_by=updated_by,
                updated_by_id=updated_by_id,
                auth_token=auth_token,  # 保留参数以保持兼容性
            )
            
            logger.info(f"[install_application] 应用安装成功: key={application.key}")
            return _application_to_response(application)
        
        except (ValidationError, ConflictError, InternalError):
            # 重新抛出业务异常
            raise
        except ValueError as e:
            error_msg = str(e)
            logger.error(f"[install_application] 应用安装失败 (ValueError): {error_msg}", exc_info=True)
            if "版本" in error_msg:
                raise ConflictError(
                    code="VERSION_CONFLICT",
                    description=error_msg,
                    solution="请使用更高版本的应用包或先卸载现有应用",
                )
            raise ValidationError(
                code="INVALID_PACKAGE",
                description=error_msg,
                solution="请检查应用安装包格式是否正确",
            )
        except Exception as e:
            logger.error(f"[install_application] 应用安装失败 (未预期错误): {e}", exc_info=True)
            raise InternalError(
                description=f"应用安装失败: {str(e)}",
                solution="请稍后重试或联系管理员",
            )

    # ============ 2、获取应用列表 ============
    @router.get(
        "/applications",
        summary="获取已安装应用列表",
        response_model=List[ApplicationResponse],
        responses={
            200: {"description": "成功获取应用列表"},
            500: {"description": "服务器内部错误", "model": ErrorResponse},
        }
    )
    async def get_applications(
        pinned: Optional[bool] = Query(None, description="按被钉状态过滤：true=仅被钉，false=仅未被钉，不传=不过滤"),
    ) -> List[ApplicationResponse]:
        """
        获取已安装应用列表。

        返回所有已安装的应用信息，按更新时间倒序排列。可通过 pinned 参数过滤被钉状态。

        返回:
            List[ApplicationResponse]: 应用列表
        """
        try:
            applications = await application_service.get_all_applications(pinned=pinned)
            return [_application_to_response(app) for app in applications]

        except Exception as e:
            logger.exception(f"获取应用列表失败: {e}")
            raise InternalError(
                description=f"获取应用列表失败: {str(e)}",
            )

    # ============ 3、应用配置 ============
    @router.put(
        "/applications/config",
        summary="配置应用",
        description="配置应用的业务知识网络和智能体（基于数据库中已有配置，将配置项标记为已配置）。",
        response_model=ApplicationResponse,
        responses={
            200: {"description": "配置成功"},
            400: {"description": "请求参数错误", "model": ErrorResponse},
            404: {"description": "应用不存在", "model": ErrorResponse},
            500: {"description": "服务器内部错误", "model": ErrorResponse},
        }
    )
    async def configure_application(
        request: Request,
        key: str = Query(..., description="应用包唯一标识", min_length=1, max_length=32),
    ) -> ApplicationResponse:
        """
        配置应用。

        配置应用的业务知识网络和智能体。

        参数:
            key: 应用包唯一标识

        返回:
            ApplicationResponse: 更新后的应用信息
        """
        try:
            # 从上下文获取用户信息（由中间件通过token内省获取）
            user_info = get_user_info()
            if not user_info:
                logger.error("[configure_application] 无法获取用户信息")
                raise UnauthorizedError(
                    description="无法获取用户信息",
                    solution="请使用有效的token重新登录",
                )
            updated_by = user_info.vision_name
            updated_by_id = user_info.id

            # 应用配置不再从请求体中传入，而是直接基于数据库中已有的配置，
            # 将业务知识网络配置和智能体配置的 is_config 统一设置为 True。
            application = await application_service.configure_application(
                key=key,
                updated_by=updated_by,
                updated_by_id=updated_by_id,
            )
            
            return _application_to_response(application)
        
        except ValueError as e:
            raise NotFoundError(description=str(e))
        except Exception as e:
            logger.exception(f"配置应用失败: {e}")
            raise InternalError(description=f"配置应用失败: {str(e)}")

    # ============ 4.1、查看基础信息 ============
    @router.get(
        "/applications/basic-info",
        summary="查看应用基础信息",
        description="查看应用的基本信息，包括名称、描述、版本、是否配置视图",
        response_model=ApplicationBasicInfoResponse,
        responses={
            200: {"description": "获取基础信息成功"},
            400: {"description": "请求参数错误", "model": ErrorResponse},
            404: {"description": "应用不存在", "model": ErrorResponse},
            500: {"description": "服务器内部错误", "model": ErrorResponse},
        }
    )
    async def get_application_basic_info(
        key: str = Query(..., description="应用包唯一标识", min_length=1, max_length=32),
    ) -> ApplicationBasicInfoResponse:
        """
        查看应用基础信息。

        参数:
            key: 应用包唯一标识

        返回:
            ApplicationBasicInfoResponse: 应用基础信息
        """
        try:
            application = await application_service.get_application_basic_info(key)
            
            return ApplicationBasicInfoResponse(
                key=application.key,
                name=application.name,
                description=application.description,
                version=application.version,
                icon=application.icon,
                category=application.category,
                micro_app=_micro_app_to_response(application.micro_app),
                is_config=application.is_config,
                pinned=getattr(application, 'pinned', False),
                updated_by=application.updated_by,
                updated_by_id=application.updated_by_id,
                updated_at=application.updated_at,
            )
        
        except ValueError as e:
            raise NotFoundError(description=str(e))
        except Exception as e:
            logger.exception(f"获取应用基础信息失败: {e}")
            raise InternalError(description=f"获取应用基础信息失败: {str(e)}")

    # ============ 设置应用被钉状态 ============
    @router.put(
        "/applications/{key}/pinned",
        summary="设置应用被钉状态",
        description="设置指定应用是否被钉（置顶）",
        response_model=ApplicationResponse,
        responses={
            200: {"description": "设置成功"},
            400: {"description": "请求参数错误", "model": ErrorResponse},
            404: {"description": "应用不存在", "model": ErrorResponse},
            500: {"description": "服务器内部错误", "model": ErrorResponse},
        }
    )
    async def set_application_pinned(
        key: str = Path(..., description="应用包唯一标识", min_length=1, max_length=32),
        body: SetPinnedRequest = ...,
    ) -> ApplicationResponse:
        """
        设置应用是否被钉状态。

        参数:
            key: 应用包唯一标识
            body.pinned: 是否被钉

        返回:
            ApplicationResponse: 更新后的应用信息
        """
        try:
            application = await application_service.set_application_pinned(key=key, pinned=body.pinned)
            return _application_to_response(application)
        except ValueError as e:
            raise NotFoundError(description=str(e))
        except Exception as e:
            logger.exception(f"设置应用被钉状态失败: {e}")
            raise InternalError(description=f"设置应用被钉状态失败: {str(e)}")

    # ============ 4.2、查看业务知识网络配置 ============
    @router.get(
        "/applications/ontologies",
        summary="查看业务知识网络配置",
        description="查看应用的业务知识网络配置情况",
        responses={
            200: {"description": "获取业务知识网络配置成功"},
            400: {"description": "请求参数错误", "model": ErrorResponse},
            404: {"description": "应用不存在", "model": ErrorResponse},
            500: {"description": "服务器内部错误", "model": ErrorResponse},
        }
    )
    async def get_application_ontologies(
        request: Request,
        key: str = Query(..., description="应用包唯一标识", min_length=1, max_length=32),
    ):
        """
        查看业务知识网络配置。

        流程：
        1. 通过 key 获取应用的业务知识网络配置项（ontology_config）
        2. 遍历配置项，通过 id 调用外部接口查询业务知识网络详情
        3. 返回业务知识网络详情列表（原始数据）

        参数:
            key: 应用包唯一标识

        返回:
            List[dict]: 业务知识网络详情列表（原始数据）
        """
        try:
            # 认证 Token 已由中间件统一提取并存储到 request.state 和 TokenContext
            # 适配器层会从 TokenContext 统一获取，这里可以不再传递
            auth_token = getattr(request.state, "auth_token", None)

            ontologies = await application_service.get_application_ontologies(
                key=key,
                auth_token=auth_token,
            )
            
            return ontologies
        
        except ValueError as e:
            raise NotFoundError(description=str(e))
        except Exception as e:
            logger.exception(f"获取业务知识网络配置失败: {e}")
            raise InternalError(description=f"获取业务知识网络配置失败: {str(e)}")

    # ============ 4.3、查看智能体配置 ============
    @router.get(
        "/applications/agents",
        summary="查看智能体配置",
        description="查看应用的 Data Agent 智能体配置情况",
        responses={
            200: {"description": "获取智能体配置成功"},
            400: {"description": "请求参数错误", "model": ErrorResponse},
            404: {"description": "应用不存在", "model": ErrorResponse},
            500: {"description": "服务器内部错误", "model": ErrorResponse},
        }
    )
    async def get_application_agents(
        request: Request,
        key: str = Query(..., description="应用包唯一标识", min_length=1, max_length=32),
    ):
        """
        查看智能体配置。

        流程：
        1. 通过 key 获取应用的智能体配置项（agent_config）
        2. 遍历配置项，通过 id 调用外部接口查询智能体详情
        3. 返回智能体详情列表（原始数据）

        参数:
            key: 应用包唯一标识

        返回:
            List[dict]: 智能体详情列表（原始数据）
        """
        try:
            # 认证 Token 已由中间件统一提取并存储到 request.state 和 TokenContext
            # 适配器层会从 TokenContext 统一获取，这里可以不再传递
            auth_token = getattr(request.state, "auth_token", None)

            agents = await application_service.get_application_agents(
                key=key,
                auth_token=auth_token,
            )
            
            return agents
        
        except ValueError as e:
            raise NotFoundError(description=str(e))
        except Exception as e:
            logger.exception(f"获取智能体配置失败: {e}")
            raise InternalError(description=f"获取智能体配置失败: {str(e)}")

    # ============ 5、卸载应用 ============
    @router.delete(
        "/applications/{key}",
        summary="卸载应用",
        description="卸载指定的应用",
        status_code=status.HTTP_204_NO_CONTENT,
        responses={
            204: {"description": "卸载应用成功"},
            400: {"description": "请求参数错误", "model": ErrorResponse},
            404: {"description": "应用不存在", "model": ErrorResponse},
            500: {"description": "服务器内部错误", "model": ErrorResponse},
        }
    )
    async def uninstall_application(
        request: Request,
        key: str = Path(..., description="应用包唯一标识", min_length=1, max_length=32),
    ) -> Response:
        """
        卸载应用。

        流程：
        1. 调用卸载应用接口（删除 helm release）
        2. 删除数据库中应用记录

        参数:
            key: 应用包唯一标识

        返回:
            None: 成功时返回 204 No Content
        """
        try:
            # 认证 Token 已由中间件统一提取并存储到 request.state 和 TokenContext
            # 适配器层会从 TokenContext 统一获取，这里可以不再传递
            auth_token = getattr(request.state, "auth_token", None)

            await application_service.uninstall_application(
                key=key,
                auth_token=auth_token,  # 保留参数以保持兼容性
            )
            return Response(status_code=status.HTTP_204_NO_CONTENT)

        except ValueError as e:
            raise NotFoundError(description=str(e))
        except Exception as e:
            logger.exception(f"卸载应用失败: {e}")
            raise InternalError(description=f"卸载应用失败: {str(e)}")

    return router
