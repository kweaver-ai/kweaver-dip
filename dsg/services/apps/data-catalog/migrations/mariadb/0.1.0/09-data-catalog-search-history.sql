use af_data_catalog;

CREATE TABLE IF NOT EXISTS `t_data_catalog_search_history` (
     `catalog_search_history_id` bigint(20) NOT NULL COMMENT '雪花id, 单目录搜索记录',
     `id` varchar(255) DEFAULT '' COMMENT '单目录搜索id uuid',
     `data_catalog_id` bigint(255) NOT NULL DEFAULT 0 COMMENT '数据资源目录id',
     `fields` text null COMMENT '字段id',
     `fields_details` text null COMMENT '字段详情',
     `configs` text null COMMENT '配置信息',
     `type` varchar(255) DEFAULT NULL COMMENT '左侧目录类型，department\\authorization',
     `department_path` text null COMMENT '部门路径',
     `total_count` int(11) DEFAULT 0 COMMENT '搜索结果',
     `created_at` datetime DEFAULT NULL COMMENT '创建时间',
     `created_by_uid` varchar(255) DEFAULT '' COMMENT '创建者id',
     `updated_at` datetime DEFAULT NULL COMMENT '更新时间',
     `updated_by_uid` varchar(255) DEFAULT '' COMMENT '更新者',
     `deleted_at` int(11) DEFAULT 0 COMMENT '删除时间',
     PRIMARY KEY (`catalog_search_history_id`),
     KEY `idx` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;