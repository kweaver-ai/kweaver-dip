USE af_configuration;

CREATE TABLE IF NOT EXISTS  `business_matters` (
    `id` bigint(20) unsigned NOT NULL COMMENT '雪花id',
    `business_matters_id` CHAR(36) NOT NULL    COMMENT '对象ID, uuid',
    `name` varchar(128) NOT NULL COMMENT '业务事项名称',
    `type_key` varchar(64) NOT NULL COMMENT '业务事项类型key',
    `department_id` char(36)  NOT NULL COMMENT '所属部门',
    `materials_number` int(10) unsigned NOT NULL DEFAULT 0 COMMENT '材料数',
    `created_at` datetime(3) NOT NULL  DEFAULT current_timestamp(3) COMMENT '创建时间',
    `creator_uid` varchar(36) NOT NULL COMMENT '创建用户ID',
    `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) COMMENT '更新时间',
    `updater_uid` varchar(36) NOT NULL COMMENT '更新用户ID',
    `deleted_at`  bigint(20) NOT NULL DEFAULT 0 COMMENT '删除时间（逻辑删除）',
    PRIMARY KEY (`id`),
    UNIQUE KEY `business_matters_name` (`name`,`deleted_at`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='业务事项表';
