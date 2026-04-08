"""
应用适配器

实现 ApplicationPort 接口的数据库适配器。
负责与 MariaDB 数据库交互，完成应用数据的持久化操作。
使用 proton-rds-sdk-py 提供的 PooledDB 进行数据库操作。
"""
import asyncio
import base64
import json
import logging
from typing import List, Optional
from datetime import datetime

import pymysql
from dbutilsx.pooled_db import PooledDB, PooledDBInfo

from src.domains.application import Application, MicroAppInfo, OntologyConfigItem, AgentConfigItem, ReleaseConfigItem
from src.ports.application_port import ApplicationPort
from src.infrastructure.config.settings import Settings

logger = logging.getLogger(__name__)

_SELECT_COLUMNS = """SELECT id, `key`, name, description, icon, version, category, micro_app,
                            release_config, ontology_ids, agent_ids, is_config,
                            COALESCE(pinned, 0) as pinned,
                            updated_by, updated_by_id, updated_at,
                            COALESCE(business_domain, 'db_public') as business_domain
                     FROM t_application"""


class ApplicationAdapter(ApplicationPort):
    """
    应用数据库适配器实现。

    使用 pymysql + PooledDB 进行同步数据库操作，
    通过 asyncio.to_thread() 在线程池中执行以兼容 FastAPI 异步模型。
    """

    def __init__(self, settings: Settings):
        self._settings = settings
        self._pool: Optional[PooledDB] = None

    def _get_pool(self) -> PooledDB:
        if self._pool is None:
            info = PooledDBInfo(
                creator=pymysql,
                host=self._settings.db_host,
                port=self._settings.db_port,
                user=self._settings.db_user,
                password=self._settings.db_password,
                database=self._settings.db_name,
                autocommit=True,
                mincached=1,
                maxcached=5,
                maxconnections=10,
                blocking=True,
            )
            self._pool = PooledDB(master=info, backup=info)
            logger.info(
                "数据库连接池已创建: %s:%s/%s",
                self._settings.db_host, self._settings.db_port, self._settings.db_name,
            )
        return self._pool

    async def close(self):
        """释放数据库连接池。"""
        self._pool = None
        logger.info("数据库连接池已释放")

    # ── JSON 解析工具方法 ──

    def _parse_json_list(self, json_str: Optional[str], default: list = None) -> list:
        if default is None:
            default = []
        if not json_str:
            return default
        try:
            result = json.loads(json_str)
            return result if isinstance(result, list) else default
        except json.JSONDecodeError:
            logger.warning(f"JSON 解析失败: {json_str}")
            return default

    def _parse_micro_app(self, json_str: Optional[str]) -> Optional[MicroAppInfo]:
        if not json_str:
            return None
        try:
            data = json.loads(json_str)
            if isinstance(data, dict):
                return MicroAppInfo(
                    name=data.get("name", ""),
                    entry=data.get("entry", ""),
                    headless=data.get("headless", False),
                )
            return None
        except (json.JSONDecodeError, TypeError) as e:
            logger.warning(f"微应用配置 JSON 解析失败: {json_str}, 错误: {e}")
            return None

    def _parse_release_config_list(self, json_str: Optional[str]) -> List[ReleaseConfigItem]:
        if not json_str:
            return []
        try:
            data = json.loads(json_str)
            if not isinstance(data, list):
                return []
            result = []
            for item in data:
                if isinstance(item, dict):
                    result.append(ReleaseConfigItem(
                        name=item.get("name", ""),
                        namespace=item.get("namespace", "default"),
                    ))
                elif isinstance(item, str):
                    result.append(ReleaseConfigItem(name=item, namespace="default"))
            return result
        except (json.JSONDecodeError, TypeError) as e:
            logger.warning(f"release_config JSON 解析失败: {json_str}, 错误: {e}")
            return []

    def _parse_config_list(self, json_str: Optional[str], config_type: str) -> list:
        if not json_str:
            return []
        try:
            data = json.loads(json_str)
            if not isinstance(data, list):
                return []
            result = []
            for item in data:
                if isinstance(item, dict):
                    if config_type == 'ontology':
                        result.append(OntologyConfigItem(id=str(item.get("id", "")), is_config=item.get("is_config", False)))
                    elif config_type == 'agent':
                        result.append(AgentConfigItem(id=str(item.get("id", "")), is_config=item.get("is_config", False)))
                elif isinstance(item, (int, str)):
                    if config_type == 'ontology':
                        result.append(OntologyConfigItem(id=str(item), is_config=False))
                    elif config_type == 'agent':
                        result.append(AgentConfigItem(id=str(item), is_config=False))
            return result
        except (json.JSONDecodeError, TypeError) as e:
            logger.warning(f"配置列表 JSON 解析失败: {json_str}, 错误: {e}")
            return []

    # ── 行映射 ──

    def _row_to_application(self, row: tuple) -> Application:
        icon_base64 = None
        if row[4]:
            try:
                icon_base64 = base64.b64encode(row[4]).decode('utf-8')
            except Exception as e:
                logger.warning(f"应用图标 Base64 编码失败: {e}")

        micro_app = self._parse_micro_app(row[7])
        release_config = self._parse_release_config_list(row[8])
        ontology_config = self._parse_config_list(row[9], 'ontology')
        agent_config = self._parse_config_list(row[10], 'agent')

        if len(row) > 16:
            pinned = bool(row[12]) if row[12] is not None else False
            updated_by = row[13] or ""
            updated_by_id = (row[14] or "") if len(row) > 14 else ""
            updated_at = row[15] if len(row) > 15 else None
            business_domain = row[16] if row[16] is not None else "db_public"
        else:
            pinned = False
            updated_by = row[12] or "" if len(row) > 12 else ""
            updated_by_id = (row[13] or "") if len(row) > 13 else ""
            updated_at = row[14] if len(row) > 14 else (row[13] if len(row) > 13 else None)
            business_domain = row[15] if len(row) > 15 and row[15] is not None else "db_public"

        return Application(
            id=row[0],
            key=row[1],
            name=row[2],
            description=row[3],
            icon=icon_base64,
            version=row[5],
            category=row[6],
            business_domain=business_domain,
            micro_app=micro_app,
            release_config=release_config,
            ontology_config=ontology_config,
            agent_config=agent_config,
            is_config=bool(row[11]) if row[11] is not None else False,
            pinned=pinned,
            updated_by=updated_by,
            updated_by_id=updated_by_id,
            updated_at=updated_at,
        )

    # ── 序列化工具 ──

    @staticmethod
    def _serialize_application_json(application: Application):
        """返回 (icon_binary, micro_app_json, release_json, ontology_json, agent_json)"""
        icon_binary = None
        if application.icon:
            try:
                icon_binary = base64.b64decode(application.icon)
            except Exception as e:
                logger.warning(f"应用图标 Base64 解码失败: {e}")

        micro_app_json = None
        if application.micro_app:
            micro_app_json = json.dumps({
                "name": application.micro_app.name,
                "entry": application.micro_app.entry,
                "headless": application.micro_app.headless,
            })

        release_json = json.dumps([
            {"name": item.name, "namespace": item.namespace}
            for item in (application.release_config or [])
        ])
        ontology_json = json.dumps([
            {"id": item.id, "is_config": item.is_config}
            for item in (application.ontology_config or [])
        ])
        agent_json = json.dumps([
            {"id": item.id, "is_config": item.is_config}
            for item in (application.agent_config or [])
        ])
        return icon_binary, micro_app_json, release_json, ontology_json, agent_json

    # ── 同步 DB 操作 ──

    def _sync_get_all_applications(self, pinned: Optional[bool] = None) -> list:
        pool = self._get_pool()
        with pool.connection() as conn:
            with conn.cursor() as cursor:
                sql = _SELECT_COLUMNS
                params = ()
                if pinned is not None:
                    sql += " WHERE pinned = %s"
                    params = (pinned,)
                sql += " ORDER BY updated_at DESC"
                cursor.execute(sql, params)
                return cursor.fetchall()

    def _sync_get_by_key(self, key: str):
        pool = self._get_pool()
        with pool.connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(_SELECT_COLUMNS + " WHERE `key` = %s", (key,))
                return cursor.fetchone()

    def _sync_set_pinned(self, key: str, pinned: bool) -> int:
        pool = self._get_pool()
        with pool.connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("UPDATE t_application SET pinned = %s WHERE `key` = %s", (pinned, key))
                return cursor.rowcount

    def _sync_create(self, application: Application) -> int:
        pool = self._get_pool()
        with pool.connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT COUNT(*) FROM t_application WHERE `key` = %s", (application.key,))
                count = cursor.fetchone()[0]
                if count > 0:
                    raise ValueError(f"应用已存在: {application.key}")

                icon_binary, micro_app_json, release_json, ontology_json, agent_json = self._serialize_application_json(application)

                cursor.execute(
                    """INSERT INTO t_application
                       (`key`, name, description, icon, version, category, micro_app,
                        release_config, ontology_ids, agent_ids, is_config, pinned,
                        updated_by, updated_by_id, updated_at, business_domain)
                       VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                    (
                        application.key, application.name, application.description,
                        icon_binary, application.version, application.category,
                        micro_app_json, release_json, ontology_json, agent_json,
                        application.is_config, getattr(application, 'pinned', False),
                        application.updated_by, application.updated_by_id,
                        application.updated_at or datetime.now(), application.business_domain,
                    )
                )
                return cursor.lastrowid

    def _sync_update(self, application: Application) -> int:
        pool = self._get_pool()
        with pool.connection() as conn:
            with conn.cursor() as cursor:
                icon_binary, micro_app_json, release_json, ontology_json, agent_json = self._serialize_application_json(application)

                cursor.execute(
                    """UPDATE t_application
                       SET name = %s, description = %s, icon = %s, version = %s, category = %s, micro_app = %s,
                           release_config = %s, ontology_ids = %s, agent_ids = %s, is_config = %s, pinned = %s,
                           updated_by = %s, updated_by_id = %s, updated_at = %s, business_domain = %s
                       WHERE `key` = %s""",
                    (
                        application.name, application.description, icon_binary,
                        application.version, application.category, micro_app_json,
                        release_json, ontology_json, agent_json,
                        application.is_config, getattr(application, 'pinned', False),
                        application.updated_by, application.updated_by_id,
                        application.updated_at or datetime.now(), application.business_domain,
                        application.key,
                    )
                )
                return cursor.rowcount

    def _sync_update_config(self, key, ontology_json, agent_json, updated_by, updated_by_id) -> int:
        pool = self._get_pool()
        with pool.connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    """UPDATE t_application
                       SET ontology_ids = %s, agent_ids = %s, is_config = %s,
                           updated_by = %s, updated_by_id = %s, updated_at = %s
                       WHERE `key` = %s""",
                    (ontology_json, agent_json, True, updated_by, updated_by_id, datetime.now(), key)
                )
                return cursor.rowcount

    def _sync_delete(self, key: str) -> int:
        pool = self._get_pool()
        with pool.connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("DELETE FROM t_application WHERE `key` = %s", (key,))
                return cursor.rowcount

    # ── 异步公开接口 ──

    async def get_all_applications(self, pinned: Optional[bool] = None) -> List[Application]:
        rows = await asyncio.to_thread(self._sync_get_all_applications, pinned)
        return [self._row_to_application(row) for row in rows]

    async def get_application_by_key(self, key: str) -> Application:
        row = await asyncio.to_thread(self._sync_get_by_key, key)
        if row is None:
            raise ValueError(f"应用不存在: {key}")
        return self._row_to_application(row)

    async def get_application_by_key_optional(self, key: str) -> Optional[Application]:
        row = await asyncio.to_thread(self._sync_get_by_key, key)
        if row is None:
            return None
        return self._row_to_application(row)

    async def set_application_pinned(self, key: str, pinned: bool) -> Application:
        rowcount = await asyncio.to_thread(self._sync_set_pinned, key, pinned)
        if rowcount == 0:
            raise ValueError(f"应用不存在: {key}")
        return await self.get_application_by_key(key)

    async def create_application(self, application: Application) -> Application:
        last_id = await asyncio.to_thread(self._sync_create, application)
        application.id = last_id
        return application

    async def update_application(self, application: Application) -> Application:
        rowcount = await asyncio.to_thread(self._sync_update, application)
        if rowcount == 0:
            raise ValueError(f"应用不存在: {application.key}")
        return application

    async def update_application_config(
        self,
        key: str,
        ontology_config: List[OntologyConfigItem],
        agent_config: List[AgentConfigItem],
        updated_by: str,
        updated_by_id: str = ""
    ) -> Application:
        ontology_json = json.dumps([{"id": item.id, "is_config": item.is_config} for item in ontology_config])
        agent_json = json.dumps([{"id": item.id, "is_config": item.is_config} for item in agent_config])

        rowcount = await asyncio.to_thread(
            self._sync_update_config, key, ontology_json, agent_json, updated_by, updated_by_id
        )
        if rowcount == 0:
            raise ValueError(f"应用不存在: {key}")
        return await self.get_application_by_key(key)

    async def delete_application(self, key: str) -> bool:
        rowcount = await asyncio.to_thread(self._sync_delete, key)
        if rowcount == 0:
            raise ValueError(f"应用不存在: {key}")
        return True
