USE `af_tasks`;

CREATE TABLE IF NOT EXISTS `tc_tenant_app_db_account` (
    `database_account_id` bigint(20) NOT NULL COMMENT '数据库账号id',
    `id` varchar(100) DEFAULT NULL COMMENT 'id，uuid',
    `tenant_application_id` varchar(100) DEFAULT NULL COMMENT '租户申请id',
    `database_type` varchar(100) DEFAULT NULL COMMENT '数据库类型',
    `database_name` varchar(150) DEFAULT NULL COMMENT '数据库名称',
    `tenant_account` varchar(150) DEFAULT NULL COMMENT '租户账号',
    `tenant_passwd` varchar(150) DEFAULT NULL COMMENT '租户密码',
    `project_name` varchar(150) DEFAULT NULL COMMENT '项目名称',
    `actual_allocated_resources` text NULL COMMENT '实际分配资源',
    `user_authentication_hadoop` text NULL COMMENT '用户认证信息 hadoop',
    `user_authentication_hbase` text NULL COMMENT '用户授权信息 hbase',
    `user_authentication_hive` text NULL COMMENT '用户授权信息 hive',
    `created_by_uid` varchar(100) DEFAULT NULL COMMENT '创建人',
    `created_at` datetime DEFAULT NULL COMMENT '创建时间',
    `updated_by_uid` varchar(100) DEFAULT NULL COMMENT '更新人',
    `updated_at` varchar(100) DEFAULT NULL COMMENT '更新时间',
    `deleted_at` int(11) DEFAULT NULL COMMENT '删除时间',
    PRIMARY KEY (`database_account_id`),
    KEY `tc_tenant_app_db_account_id_IDX` (`id`) USING BTREE,
    KEY `tc_tenant_app_db_account_tenant_application_id_IDX` (`tenant_application_id`) USING BTREE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='租户申请数据库账号';
