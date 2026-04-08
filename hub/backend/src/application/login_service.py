"""
登录服务

实现登录相关的业务逻辑（与 session 服务逻辑严格一致）。
"""
import logging
from typing import Optional, Tuple

from src.common.units import rand_len_rand_string, parse_host
from src.domains.session import SessionInfo
from src.domains.login import LoginRequest
from src.ports.session_port import SessionPort
from src.ports.oauth2_port import OAuth2Port
from src.ports.hydra_port import HydraPort
from src.ports.user_management_port import UserManagementPort
from src.ports.deploy_manager_port import DeployManagerPort

logger = logging.getLogger(__name__)


class LoginService:
    """
    登录服务。

    负责处理登录相关的业务逻辑。
    """

    def __init__(
        self,
        session_port: SessionPort,
        oauth2_port: OAuth2Port,
        hydra_port: HydraPort,
        user_management_port: UserManagementPort,
        deploy_manager_port: DeployManagerPort,
    ):
        """
        初始化登录服务。

        参数:
            session_port: Session 端口
            oauth2_port: OAuth2 端口
            hydra_port: Hydra 端口
            user_management_port: 用户管理端口
            deploy_manager_port: 部署管理端口
        """
        self._session_port = session_port
        self._oauth2_port = oauth2_port
        self._hydra_port = hydra_port
        self._user_management_port = user_management_port
        self._deploy_manager_port = deploy_manager_port

    def generate_state(self) -> str:
        """
        生成随机 state 字符串（与 session 服务一致：10-50 随机长度）。

        返回:
            str: 随机字符串
        """
        return rand_len_rand_string(10, 50)

    def generate_nonce(self) -> str:
        """
        生成随机 nonce 字符串（与 session 服务一致：10-50 随机长度）。

        返回:
            str: 随机字符串
        """
        return rand_len_rand_string(10, 50)

    async def check_token_effect(self, token: str) -> bool:
        """
        检查 Token 是否有效。

        参数:
            token: 访问令牌

        返回:
            bool: Token 是否有效
        """
        try:
            introspect = await self._hydra_port.introspect(token)
            return introspect.active
        except Exception as e:
            logger.error(f"检查 Token 有效性失败: {e}", exc_info=True)
            return False

    async def get_or_create_session(
        self,
        session_id: str | None,
        state: str,
        as_redirect: str | None = None,
    ) -> Tuple[str, SessionInfo]:
        """
        获取或创建 Session。

        参数:
            session_id: 现有的 Session ID，如果为 None 则创建新的
            state: 状态字符串
            as_redirect: AnyShare 重定向地址

        返回:
            tuple[str, SessionInfo]: (Session ID, Session 信息)
        """
        # 平台类型固定为 1（不区分平台）
        platform = 1
        
        if session_id:
            session_info = await self._session_port.get_session(session_id)
            if session_info:
                # 更新 Session 信息
                if session_info.as_redirect != as_redirect:
                    session_info.as_redirect = as_redirect
                    await self._session_port.save_session(session_id, session_info)
                return session_id, session_info

        # 创建新的 Session
        import uuid
        new_session_id = str(uuid.uuid4())
        session_info = SessionInfo(
            state=state,
            platform=platform,
            as_redirect=as_redirect,
        )
        await self._session_port.save_session(new_session_id, session_info)
        return new_session_id, session_info

    async def get_host_url(self) -> str:
        """
        获取主机 URL（scheme://host:port）。
        
        使用 parse_host 处理 IPv6 地址。

        返回:
            str: 主机 URL
        """
        host_res = await self._deploy_manager_port.get_host()
        return f"{host_res.scheme}://{parse_host(host_res.host)}:{host_res.port}"

    async def do_login(self, code: str, state: str, session_id: str) -> SessionInfo:
        """
        执行登录流程。

        参数:
            code: 授权码
            state: 状态字符串
            session_id: Session ID

        返回:
            SessionInfo: 登录后的 Session 信息

        异常:
            ValueError: 当登录失败时抛出
        """
        # 获取 Session 信息
        session_info = await self._session_port.get_session(session_id)
        if session_info is None:
            raise ValueError("Session 不存在")
        
        if session_info.state != state:
            raise ValueError("State 不匹配")

        # 获取主机信息
        host_res = await self._deploy_manager_port.get_host()
        access_url = f"{host_res.scheme}://{parse_host(host_res.host)}:{host_res.port}"

        # 将授权码转换为 Token（与 session 服务一致：传入 access_url 而不是 redirect_uri）
        code2token_res = await self._oauth2_port.code2token(code, access_url)

        # 内省 Token 获取用户信息
        introspect = await self._hydra_port.introspect(code2token_res.access_token)
        if not introspect.active:
            raise ValueError("Token 无效")

        userid = introspect.visitor_id
        if not userid:
            raise ValueError("无法获取用户 ID")

        # 获取用户详细信息
        user_infos = await self._user_management_port.batch_get_user_info_by_id([userid])
        if userid not in user_infos:
            raise ValueError("用户信息不存在")

        userinfo = user_infos[userid]

        # 更新 Session 信息
        session_info.token = code2token_res.access_token
        session_info.refresh_token = code2token_res.refresh_token
        session_info.id_token = code2token_res.id_token
        session_info.userid = userid
        session_info.username = userinfo.vision_name
        session_info.vision_name = userinfo.vision_name
        session_info.visitor_typ = introspect.visitor_typ

        # 保存 Session
        await self._session_port.save_session(session_id, session_info)

        logger.info(f"用户登录成功: {userid}")
        return session_info

