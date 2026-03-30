USE af_configuration;

CREATE TABLE IF NOT EXISTS `t_cms_content` (
    `id` char(38) NOT NULL COMMENT '主键ID',
    `title` varchar(255) NOT NULL COMMENT '标题',
    `summary` varchar(500) DEFAULT NULL COMMENT '摘要',
    `content` longtext NOT NULL COMMENT '正文内容',
    `type` char(10) NOT NULL DEFAULT '0' COMMENT '类型：0-新闻动态，1-政策动态',
    `status` char(10) NOT NULL DEFAULT '0' COMMENT '状态：0-已发布，1-未发布',
    `home_show` char(10) NOT NULL DEFAULT '0' COMMENT '封面图标记：0-否，1-是',
    `image_id` char(38)  NULL  DEFAULT null COMMENT '图片编号',
    `save_path` varchar(200)  NULL  DEFAULT null COMMENT '保存路径',
    `size` bigint(20)  NULL  DEFAULT null COMMENT '图片大小',
    `publish_time` datetime DEFAULT NULL COMMENT '发布时间',
    `creator_id` char(38) DEFAULT NULL COMMENT '创建人ID（关联用户表）',
    `updater_id` char(38) DEFAULT NULL COMMENT '更新人ID（关联用户表）',
    `create_time` char(38) NOT NULL COMMENT '创建时间',
    `update_time` char(38) NOT NULL  COMMENT '更新时间',
    `is_deleted` char(11) NOT NULL DEFAULT '0' COMMENT '逻辑删除：0-未删除，1-已删除',
    PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='内容信息表';


CREATE TABLE IF NOT EXISTS `t_help_document` (
     `id` char(38) NOT NULL  COMMENT '主键ID',
    `title` varchar(255) NOT NULL COMMENT '文档标题',
    `type` char(10) NOT NULL COMMENT '类型：0-使用手册，1-常见问题',
    `status` char(10) NOT NULL DEFAULT '0' COMMENT '状态：0-未发布，1-已发布',
    `image_id` char(38)  NULL  DEFAULT null COMMENT '图片编号',
    `save_path` varchar(200)  NULL  DEFAULT null COMMENT '保存路径',
    `size` bigint(20)  NULL  DEFAULT null COMMENT '图片大小',
    `is_deleted` char(10) NOT NULL DEFAULT '0' COMMENT '逻辑删除标记',
    `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP  COMMENT '更新时间',
    `published_at` varchar(38) DEFAULT NULL COMMENT '发布时间',
    `created_by` varchar(64) DEFAULT NULL COMMENT '创建用户ID',
    `updated_by` varchar(64) DEFAULT NULL COMMENT '更新用户ID',
    PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='帮助文档主表';



-- 插入 t_dict 记录前检查是否已存在该记录
INSERT INTO af_configuration.t_dict
(id, f_type, name, f_description, f_version, created_at, creator_uid, creator_name, updated_at, updater_uid, updater_name, deleted_at, sszd_flag)
SELECT 44, 'help-document', '使用手册', '帮助文档', 'V1.0.0', '2025-05-17 13:18:55', NULL, NULL, '2025-05-17 13:18:55', NULL, NULL, 0, 1
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM af_configuration.t_dict WHERE id = 44
);

-- 插入 t_dict_item 第一条记录前检查是否已存在该记录
INSERT INTO af_configuration.t_dict_item
(id, dict_id, f_type, f_key, f_value, f_description, f_sort, created_at, creator_uid, creator_name)
SELECT 452, 44, 'help-document', '1', '使用手册', NULL, 1, '2025-05-17 13:24:55', NULL, NULL
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM af_configuration.t_dict_item WHERE id = 452
);

-- 插入 t_dict_item 第二条记录前检查是否已存在该记录
INSERT INTO af_configuration.t_dict_item
(id, dict_id, f_type, f_key, f_value, f_description, f_sort, created_at, creator_uid, creator_name)
SELECT 453, 44, 'help-document', '2', '常见问题', NULL, 2, '2025-05-17 13:24:55', NULL, NULL
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM af_configuration.t_dict_item WHERE id = 453
);

-- 插入 t_dict_item 第三条记录前检查是否已存在该记录
INSERT INTO af_configuration.t_dict_item
(id, dict_id, f_type, f_key, f_value, f_description, f_sort, created_at, creator_uid, creator_name)
SELECT 454, 44, 'help-document', '3', '技术支持', NULL, 3, '2025-05-17 13:24:55', NULL, NULL
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM af_configuration.t_dict_item WHERE id = 454
);
