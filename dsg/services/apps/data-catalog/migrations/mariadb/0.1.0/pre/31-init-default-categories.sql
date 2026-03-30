USE af_data_catalog;
-- ALTER TABLE `t_category_apply_scope_relation`
--     ADD COLUMN if not exists `required` tinyint(4) NOT NULL DEFAULT 0 COMMENT '是否必填，0否 1是' AFTER `apply_scope_id`;
--
-- ALTER TABLE `category_node`
--     ADD COLUMN if not exists `required` tinyint(4) NOT NULL DEFAULT 0 COMMENT '是否必填，0否 1是' AFTER `owner_uid`,
--   ADD COLUMN if not exists `selected` tinyint(4) NOT NULL DEFAULT 0 COMMENT '是否选中，0否 1是' AFTER `required`;


CREATE TABLE IF NOT EXISTS `category_node_ext` (
    `id` bigint(20) NOT NULL COMMENT '唯一id，雪花算法',
    `category_node_id` char(36) NOT NULL COMMENT '类目树节点ID',
    `category_id` char(36) NOT NULL  COMMENT '所属类目ID',
    `parent_id` char(36) NOT NULL  COMMENT '父类别节点id，为0表示没有父id',
    `name` varchar(128) NOT NULL COMMENT '类目节点名称',
    `owner` varchar(128) NOT NULL DEFAULT '' COMMENT '类目节点所有者的名称',
    `owner_uid` varchar(36) DEFAULT NULL COMMENT '类目节点所有者的ID',
    `required` tinyint(4) NOT NULL DEFAULT 0 COMMENT '是否必填，0否 1是',
    `selected` tinyint(4) NOT NULL DEFAULT 0 COMMENT '是否选中，0否 1是',
    `sort_weight` bigint(20) NOT NULL COMMENT '排序权重',
    `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) COMMENT '创建时间',
    `creator_uid` varchar(36) DEFAULT NULL COMMENT '创建用户ID',
    `creator_name` varchar(255) DEFAULT NULL COMMENT '创建用户名称',
    `updated_at` datetime NOT NULL DEFAULT current_timestamp() COMMENT '更新时间',
    `updater_uid` varchar(36) DEFAULT NULL COMMENT '更新用户ID',
    `updater_name` varchar(255) DEFAULT NULL COMMENT '更新用户名称',
    `deleted_at` bigint(20) DEFAULT 0 COMMENT '删除时间（逻辑删除）',
    `deleter_uid` varchar(36) DEFAULT NULL COMMENT '删除用户ID',
    `deleter_name` varchar(255) DEFAULT NULL COMMENT '删除用户名称',
    PRIMARY KEY (`id`) USING BTREE,
    UNIQUE KEY `ux_category_node_ext_node_id` (`category_node_id`),
    UNIQUE KEY `ux_category_node_ext_sort` (`category_id`,`parent_id`,`sort_weight`,`deleted_at`),
    UNIQUE KEY `ux_category_node_ext_name` (`category_id`,`parent_id`,`name`,`deleted_at`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='类目树节点信息扩展表';