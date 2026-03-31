USE af_tasks;

CREATE TABLE IF NOT EXISTS  `t_quality_audit_form_view_relation` (
    `id` BIGINT(20) NOT NULL COMMENT '雪花id',
    `work_order_id` CHAR(36) NOT NULL COMMENT '工单ID',
    `form_view_id` CHAR(36) NOT NULL COMMENT '逻辑视图ID',
    `created_by_uid` CHAR(36) NOT NULL COMMENT '创建人',
    `created_at` DATETIME(3) NOT NULL  DEFAULT current_timestamp(3)  COMMENT '创建时间',
    `updated_by_uid` CHAR(36) DEFAULT NULL COMMENT '更新人',
    `updated_at` DATETIME(3) DEFAULT NULL COMMENT '更新时间',
    `deleted_by_uid` CHAR(36) DEFAULT NULL COMMENT '删除人',
    `deleted_at` DATETIME(3) DEFAULT NULL COMMENT '删除时间',
    PRIMARY KEY (`id`),
    KEY `idx_quality_audit_work_order_id` (`work_order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='质量稽核工单和逻辑视图关联表';
