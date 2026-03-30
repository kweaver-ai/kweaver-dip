USE `af_tasks`;


CREATE TABLE IF NOT EXISTS `tc_tenant_app_db_data_resource` (
    `data_resource_id` bigint(20) NOT NULL COMMENT '数据资源id, 雪花id',
    `id` varchar(100) DEFAULT NULL COMMENT 'id, uuid',
    `tenant_application_id` varchar(100) DEFAULT NULL COMMENT '申请id',
    `database_account_id` varchar(100) DEFAULT NULL COMMENT '数据库账号id',
    `data_catalog_id` varchar(100) DEFAULT NULL COMMENT '数据目录id',
    `data_catalog_name` varchar(150) DEFAULT NULL COMMENT '数据目录名称',
    `data_catalog_code` varchar(100) DEFAULT NULL COMMENT '数据目录编码',
    `mount_resource_id` varchar(100) DEFAULT NULL COMMENT '挂载资源id',
    `mount_resource_name` varchar(300) DEFAULT NULL COMMENT '挂载资源名字',
    `mount_resource_code` varchar(100) DEFAULT NULL COMMENT '挂载资源编码',
    `data_source_id` varchar(100) DEFAULT NULL COMMENT '数据源id',
    `data_source_name` varchar(150) DEFAULT NULL COMMENT '数据源名称',
    `apply_permission` varchar(100) DEFAULT NULL COMMENT '申请权限 read write',
    `apply_purpose` text NULL COMMENT '申请用途',
    `created_by_uid` varchar(100) DEFAULT NULL COMMENT '创建人',
    `created_at` datetime DEFAULT NULL COMMENT '创建时间',
    `updated_by_uid` varchar(100) DEFAULT NULL COMMENT '更新人',
    `updated_at` datetime DEFAULT NULL COMMENT '更新时间',
    `deleted_at` int(11) DEFAULT NULL COMMENT '删除时间',
    PRIMARY KEY (`data_resource_id`),
    KEY `tc_tenant_app_db_data_resource_id_IDX` (`id`) USING BTREE,
    KEY `tc_tenant_app_db_data_resource_tenant_application_id_IDX` (`tenant_application_id`) USING BTREE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='租户申请数据库账号数据资源';
