USE `af_tasks`;

-- ALTER TABLE `work_order` ADD COLUMN IF NOT EXISTS  `department_id` char(36) NULL COMMENT '所属部门id' after name;
-- ALTER TABLE `work_order` ADD COLUMN IF NOT EXISTS  `data_source_department_id` char(36) NULL COMMENT '数源部门id(质量整改工单使用)' after department_id;
-- ALTER TABLE `work_order` ADD COLUMN IF NOT EXISTS  `process_at` DATETIME(3) DEFAULT NULL COMMENT '处理时间(质量整改单使用)' after acceptance_at;

-- 部门质量概览表
CREATE TABLE IF NOT EXISTS `work_order_quality_overview` (
    `department_id` char(36) NOT NULL COMMENT '所属部门id',
    `table_count`  bigint(20) NOT NULL  COMMENT '应检测表数量',
    `qualitied_table_count`  bigint(20) NOT NULL  COMMENT '已检测表数量',
    `processed_table_count`  bigint(20) NOT NULL  COMMENT '已整改表数量',
    `question_table_count`  bigint(20) NOT NULL  COMMENT '问题表数量',
    `start_process_table_count`  bigint(20) NOT NULL  COMMENT '已响应表数量',
    `processing_table_count`  bigint(20) NOT NULL  COMMENT '整改中表数量',
    `not_process_table_count`  bigint(20) NOT NULL  COMMENT '未整改表数量',
    `quality_rate`  char(10) NOT NULL  COMMENT '整改率',
     `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) COMMENT '创建时间',
    PRIMARY KEY (`department_id`),
    KEY `idx_department_id` (`department_id`)
) ENGINE=INNODB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='部门质量概览表';




