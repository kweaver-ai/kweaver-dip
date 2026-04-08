"""
User Management 端口接口

定义用户管理操作的抽象接口（端口）。
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Dict, Optional


@dataclass
class UserInfo:
    """用户信息"""
    id: str
    account: str
    vision_name: str
    csf_level: int = 0  # 密级
    frozen: bool = False  # 冻结状态
    roles: Optional[Dict[str, bool]] = None  # 角色
    email: Optional[str] = None  # 邮箱地址
    telephone: Optional[str] = None  # 电话号码
    third_attr: Optional[str] = None  # 第三方应用属性
    third_id: Optional[str] = None  # 第三方应用id
    user_type: Optional[int] = None  # 用户类型
    groups: Optional[list] = None  # 用户及其所属部门所在的用户组
    parent_deps: Optional[list] = None  # 组织结构


class UserManagementPort(ABC):
    """
    User Management 端口接口。

    这是一个输出端口（被驱动端口），定义了应用程序与用户管理服务的交互方式。
    """

    @abstractmethod
    async def batch_get_user_info_by_id(self, user_ids: list[str]) -> Dict[str, UserInfo]:
        """
        批量获取用户信息。

        参数:
            user_ids: 用户 ID 列表

        返回:
            Dict[str, UserInfo]: 用户信息字典，key 为用户 ID

        异常:
            Exception: 当获取失败时抛出
        """
        pass

