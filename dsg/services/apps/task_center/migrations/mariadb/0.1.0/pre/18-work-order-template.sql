USE af_tasks;

-- 工单模板表
CREATE TABLE IF NOT EXISTS `work_order_template` (
    `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `ticket_type` varchar(50) NOT NULL COMMENT '工单类型',
    `template_name` varchar(128) NOT NULL COMMENT '工单模板名称',
    `description` varchar(500) DEFAULT NULL COMMENT '工单描述',
    `created_by_uid` varchar(50) NOT NULL COMMENT '创建人',
    `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
    `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)  COMMENT '更新时间',
    `updated_by_uid` varchar(50) NOT NULL COMMENT '更新人',
    `is_builtin` tinyint(2) NOT NULL DEFAULT '0' COMMENT '是否内置模板 0-否 1-是',
    `status` tinyint(2) NOT NULL DEFAULT '1' COMMENT '状态 0-禁用 1-启用',
    `is_deleted` tinyint(2) NOT NULL DEFAULT '0' COMMENT '是否删除 0-否 1-是',
    PRIMARY KEY (`id`),
    KEY `idx_ticket_type` (`ticket_type`),
    KEY `idx_status` (`status`),
    KEY `idx_is_deleted` (`is_deleted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='工单模板表';

-- 插入默认的四种工单类型模板
INSERT INTO `work_order_template` (`ticket_type`, `template_name`, `description`, `created_by_uid`, `updated_by_uid`, `is_builtin`, `status`, `is_deleted`) VALUES
('data_aggregation', '数据归集工单模板', '', '', '', 1, 1, 0),
('data_standardization', '标准化工单模板', '', '', '', 1, 1, 0),
('data_quality_audit', '质量检测工单模板', '', '', '', 1, 1, 0),
('data_fusion', '数据融合工单模板', '', '', '', 1, 1, 0);

