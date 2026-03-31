use af_data_catalog;

CREATE TABLE IF NOT EXISTS `t_data_catalog_search_template` (
      `catalog_search_template_id` bigint(20) NOT NULL COMMENT '单目录搜索模板id 雪花id',
      `id` varchar(255) DEFAULT '' COMMENT '单目录搜索模板id uuid',
      `data_catalog_id` bigint(255) NOT NULL DEFAULT 0,
      `name` varchar(255) DEFAULT '' COMMENT '单目录搜索模板名称',
      `description` varchar(255) DEFAULT '' COMMENT '单目录搜索模板描述',
      `type` varchar(255) DEFAULT '' COMMENT '左侧数据目录来源类型：department、authorization',
      `department_path` varchar(255) DEFAULT '' COMMENT '部门路径，帮助前端找到目标目录',
      `fields` text null COMMENT '字段id',
      `fields_details` text null COMMENT '字段详细信息',
      `configs` text null COMMENT '配置信息',
      `created_at` datetime DEFAULT NULL COMMENT '创建时间',
      `created_by_uid` varchar(255) DEFAULT '' COMMENT '创建者id',
      `updated_at` datetime DEFAULT NULL COMMENT '更新时间',
      `updated_by_uid` varchar(255) DEFAULT '' COMMENT '更新者',
      `deleted_at` int(11) DEFAULT 0 COMMENT '删除时间',
      PRIMARY KEY (`catalog_search_template_id`),
      KEY `idx` (`id`),
      KEY `namex` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;