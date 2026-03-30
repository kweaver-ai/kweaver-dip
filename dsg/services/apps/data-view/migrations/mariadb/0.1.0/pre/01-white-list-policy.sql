use af_main;

CREATE TABLE IF NOT EXISTS `white_list_policy` (
    `white_policy_id` bigint(20) NOT NULL COMMENT '白名单策略id 雪花id',
    `id` char(255) DEFAULT '' COMMENT '白名单策略uuid',
    `form_view_id` char(255) DEFAULT '' COMMENT '逻辑视图id',
    `description` varchar(300) DEFAULT '' COMMENT '描述信息',
    `config` text DEFAULT NULL COMMENT '配置信息',
    `created_at` datetime DEFAULT NULL COMMENT '创建时间',
    `created_by_uid` char(255) DEFAULT '' COMMENT '创建人id',
    `updated_at` datetime DEFAULT NULL COMMENT '更新时间',
    `updated_by_uid` char(255) DEFAULT '' COMMENT '更新者id',
    `deleted_at` int(11) DEFAULT 0 COMMENT '删除时间',
    PRIMARY KEY (`white_policy_id`),
    KEY `id` (`id`),
    KEY `form_view_id` (`form_view_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;