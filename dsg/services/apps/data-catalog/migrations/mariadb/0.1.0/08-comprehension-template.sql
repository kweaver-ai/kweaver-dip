USE af_data_catalog;

CREATE TABLE if NOT EXISTS  `t_data_comprehension_template`
(
    `id`                         char(36)     NOT NULL,
    `name`                       varchar(255) NOT NULL COMMENT '理解模板名称',
    `description`                text     DEFAULT NULL COMMENT '理解模板描述',
    `business_object`            tinyint(2) DEFAULT NULL COMMENT '业务对象',
    `time_range`                 tinyint(2) DEFAULT NULL COMMENT '时间范围',
    `time_field_comprehension`   tinyint(2) DEFAULT NULL COMMENT '时间字段理解',
    `spatial_range`              tinyint(2) DEFAULT NULL COMMENT '空间范围',
    `spatial_field_comprehension`  tinyint(2) DEFAULT NULL COMMENT '空间字段理解',
    `business_special_dimension` tinyint(2) DEFAULT NULL COMMENT '业务特殊维度',
    `compound_expression`        tinyint(2) DEFAULT NULL COMMENT '复合表达',
    `service_range`              tinyint(2) DEFAULT NULL COMMENT '服务范围',
    `service_areas`              tinyint(2) DEFAULT NULL COMMENT '服务领域',
    `front_support`              tinyint(2) DEFAULT NULL COMMENT '正面支撑',
    `negative_support`           tinyint(2) DEFAULT NULL COMMENT '负面支撑',
    `protect_control`            tinyint(2) DEFAULT NULL COMMENT '保护/控制什么',
    `promote_push`               tinyint(2) DEFAULT NULL COMMENT '促进/推动什么',
    `created_at`                 datetime(3) NOT NULL COMMENT '创建时间',
    `created_uid`                char(36)     NOT NULL COMMENT '创建人',
    `updated_at`                 datetime(3) DEFAULT NULL COMMENT '更新时间',
    `updated_uid`                char(36) DEFAULT NULL COMMENT '更新人',
    `deleted_at`                 bigint(20) DEFAULT NULL COMMENT '删除时间',
    `deleted_uid`                char(36) DEFAULT NULL COMMENT '删除人',
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci  COMMENT='数据理解模板表';

-- ALTER TABLE `t_data_comprehension_details`
--     ADD COLUMN IF NOT EXISTS `template_id` char(36) NOT NULL COMMENT '数据理解模板id',
--     ADD COLUMN IF NOT EXISTS `task_id` char(36) NOT NULL COMMENT '任务id',
--     ADD COLUMN IF NOT EXISTS `apply_id` bigint NOT NULL COMMENT '审核申请id',
--     ADD COLUMN IF NOT EXISTS `proc_def_key` varchar(128) NOT NULL DEFAULT '' COMMENT '审核流程key',
--     ADD COLUMN IF NOT EXISTS `audit_advice` TEXT COMMENT '审核意见，仅驳回时有用';

