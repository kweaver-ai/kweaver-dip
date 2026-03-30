USE af_configuration;

CREATE TABLE IF NOT EXISTS `audit_policy` (
  `sid` bigint(20) unsigned NOT NULL COMMENT '雪花id',
  `id` char(36) NOT NULL COMMENT '对象id，uuid',
  `name` varchar(128) NOT NULL COMMENT '名称',
  `description` varchar(300) NOT NULL DEFAULT '' COMMENT '描述',
  `type` char(36) NOT NULL COMMENT '类型：customize（自定义的）, built-in-interface-svc（内置接口）， built-in-data-view（内置视图）， built-in-indicator（内置指标））',
  `status` char(36) NOT NULL COMMENT '审核策略状态: not-enabled（未启用）, enabled（已启用）, disabled（已停止）',
  `resources_count` int(11) NOT NULL DEFAULT 0 COMMENT '资源数量',
  `audit_type` varchar(50) NOT NULL COMMENT '审核类型 af-data-view-publish 发布审核 af-data-view-online 上线审核  af-data-view-offline 上线审核',
  `proc_def_key` varchar(128) NOT NULL COMMENT '审核流程key',
  `service_type` varchar(128) DEFAULT NULL COMMENT '所属业务模块，如逻辑视图业务为data-view',
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) COMMENT '创建时间',
  `created_by_uid` char(36) NOT NULL COMMENT '创建用户ID',
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) COMMENT '更新时间',
  `updated_by_uid` char(36) NOT NULL DEFAULT '' COMMENT '更新用户ID',
  `deleted_at` bigint(20) DEFAULT 0 COMMENT '删除时间（逻辑删除）',
  PRIMARY KEY (`id`),
  UNIQUE KEY `audit_policy_name` (`name`,`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='审核策略定义';

CREATE TABLE IF NOT EXISTS `audit_policy_resources` (
  `sid` bigint(20) unsigned NOT NULL COMMENT '雪花id',
  `id` char(36) NOT NULL COMMENT '资源id，uuid',
  `audit_policy_id` char(36) NOT NULL COMMENT '审核策略id，uuid',
  `type` char(36) NOT NULL COMMENT '资源类型 interface-svc（接口）， data-view（视图）， indicator（内置指标）',
  `deleted_at` bigint(20) DEFAULT 0 COMMENT '删除时间（逻辑删除）',
  PRIMARY KEY (`sid`),
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='审核策略资源定义';

INSERT INTO `audit_policy` (`sid`,`id`,`name`,`description`,`type`,`status`,`resources_count`,`audit_type`,`proc_def_key`,`service_type`,`created_by_uid`,`updated_by_uid`,`deleted_at`)
SELECT 000000000000000001,uuid(),'逻辑视图审核策略','作用于全部逻辑视图的权限申请','built-in-data-view','not-enabled',0,'af-data-permission-request','','auth-service','266c6a42-6131-4d62-8f39-853e7093701c','266c6a42-6131-4d62-8f39-853e7093701c',0
FROM DUAL WHERE NOT EXISTS(SELECT `sid` FROM `audit_policy` WHERE `sid` = 000000000000000001 );

INSERT INTO `audit_policy` (`sid`,`id`,`name`,`description`,`type`,`status`,`resources_count`,`audit_type`,`proc_def_key`,`service_type`,`created_by_uid`,`updated_by_uid`,`deleted_at`)
SELECT 000000000000000002,uuid(),'指标审核策略','作用于全部指标的权限申请','built-in-indicator','not-enabled',0,'af-data-permission-request','','auth-service','266c6a42-6131-4d62-8f39-853e7093701c','266c6a42-6131-4d62-8f39-853e7093701c',0
FROM DUAL WHERE NOT EXISTS(SELECT `sid` FROM `audit_policy` WHERE `sid` = 000000000000000002 );

INSERT INTO `audit_policy` (`sid`,`id`,`name`,`description`,`type`,`status`,`resources_count`,`audit_type`,`proc_def_key`,`service_type`,`created_by_uid`,`updated_by_uid`,`deleted_at`)
SELECT 000000000000000003,uuid(),'接口服务审核策略','作用于全部接口服务的权限申请','built-in-interface-svc','not-enabled',0,'af-data-permission-request','','auth-service','266c6a42-6131-4d62-8f39-853e7093701c','266c6a42-6131-4d62-8f39-853e7093701c',0
FROM DUAL WHERE NOT EXISTS(SELECT `sid` FROM `audit_policy` WHERE `sid` = 000000000000000003 );

update `audit_policy` a inner join audit_process_bind b on a.audit_type = b.audit_type
set a.proc_def_key = b.proc_def_key, a.status = "enabled", a.created_by_uid = b.created_by_uid, a.created_at = b.create_time, a.updated_by_uid = b.updated_by_uid, a.updated_at = b.update_time
where a.type != 'customize' and a.proc_def_key = '';

-- ALTER TABLE t_carousel_case ADD COLUMN IF NOT EXISTS sort_order int(11) COMMENT '排序号';







