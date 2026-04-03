use af_data_catalog;

CREATE TABLE IF NOT EXISTS `t_open_catalog` (
    `id` bigint(20) NOT NULL COMMENT '唯一id，雪花算法',
    `catalog_id` bigint(20) NOT NULL COMMENT '数据资源目录ID',
    `open_type` tinyint(2) NOT NULL COMMENT '开放方式 1 无条件开放 2 有条件开放',
    `open_level` tinyint(2) DEFAULT NULL COMMENT '开放级别 1 实名认证开放 2 审核开放',
    `open_status` varchar(20) NOT NULL DEFAULT 'notOpen' COMMENT '开放状态 未开放 notOpen、已开放 opened',
    `open_at` datetime(3) DEFAULT NULL COMMENT '开放时间',
    `audit_apply_sn` bigint(20) NOT NULL DEFAULT 0 COMMENT '发起审核申请序号',
    `audit_advice` text null COMMENT '审核意见，仅驳回时有用',
    `proc_def_key` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '审核流程key',
    `flow_apply_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '审核流程ID',
    `flow_node_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '目录当前所处审核流程结点ID',
    `flow_node_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '目录当前所处审核流程结点名称',
    `flow_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '审批流程实例ID',
    `flow_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '审批流程名称',
    `flow_version` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '审批流程版本',
    `audit_state` tinyint(2) DEFAULT NULL COMMENT '审核状态，1 审核中  2 通过  3 驳回 4 未完成',
    `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) COMMENT '创建时间',
    `creator_uid` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '创建用户ID',
    `updated_at` datetime(3) DEFAULT NULL COMMENT '更新时间',
    `updater_uid` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '更新用户ID',
    `deleted_at` datetime(3) DEFAULT NULL COMMENT '删除时间',
    `delete_uid` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '删除用户ID',
    PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='开放目录表';

CREATE TABLE IF NOT EXISTS `t_data_catalog_score` (
    `id` bigint(20) NOT NULL COMMENT '唯一id，雪花算法',
    `catalog_id` bigint(20) NOT NULL COMMENT '数据资源目录ID',
    `score` tinyint(2) NOT NULL COMMENT '评分',
    `scored_uid` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '评分用户ID',
    `scored_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) COMMENT '评分时间',
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='目录评分记录表';

CREATE TABLE IF NOT EXISTS `t_file_resource` (
    `id` bigint(20) NOT NULL COMMENT '唯一id，雪花算法',
    `name` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '文件资源名称',
    `code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '文件资源编码',
    `department_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '所属部门ID',
    `description` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '文件资源描述',
    `publish_status` varchar(20) NOT NULL DEFAULT 'unpublished' COMMENT '发布状态 未发布unpublished 、发布审核中pub-auditing、已发布published、发布审核未通过pub-reject',
    `published_at` datetime(3) DEFAULT NULL COMMENT '发布时间',
    `audit_apply_sn` bigint(20) NOT NULL DEFAULT 0 COMMENT '发起审核申请序号',
    `audit_advice` text null COMMENT '审核意见，仅驳回时有用',
    `proc_def_key` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '审核流程key',
    `flow_apply_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '审核流程ID',
    `flow_node_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '目录当前所处审核流程结点ID',
    `flow_node_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '目录当前所处审核流程结点名称',
    `flow_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '审批流程实例ID',
    `flow_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '审批流程名称',
    `flow_version` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '审批流程版本',
    `audit_state` tinyint(2) DEFAULT NULL COMMENT '审核状态， 1 审核中  2 通过  3 驳回 4 未完成',
    `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) COMMENT '创建时间',
    `creator_uid` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '创建用户ID',
    `updated_at` datetime(3) DEFAULT NULL COMMENT '更新时间',
    `updater_uid` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '更新用户ID',
    `deleted_at` datetime(3) DEFAULT NULL COMMENT '删除时间',
    `deleter_uid` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '删除用户ID',
    PRIMARY KEY (`id`),
    UNIQUE KEY `t_file_resource_code_uk` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文件资源表';