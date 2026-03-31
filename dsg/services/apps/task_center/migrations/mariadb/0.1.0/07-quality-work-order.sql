USE af_tasks;

CREATE TABLE IF NOT EXISTS `data_quality_improvement` (
    `id` char(36) NOT NULL COMMENT '整改项id',
    `work_order_id` char(36) NOT NULL COMMENT '工单id',
    `field_id` char(36) NOT NULL COMMENT '字段id',
    `rule_id` char(36) NOT NULL COMMENT '规则id',
    `rule_name` varchar(255) NOT NULL COMMENT '规则名称',
    `dimension` varchar(255) NOT NULL COMMENT '规则维度',
    `inspected_count` int(11) NOT NULL COMMENT '检测数据量',
    `issue_count` int(11) NOT NULL COMMENT '问题数据量',
    `score` float(10,4) NOT NULL COMMENT '评分',
    `deleted_at` bigint(20) NOT NULL COMMENT '删除时间',
    PRIMARY KEY (`id`),
    KEY `idx_work_order_id` (`work_order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='数据质量工单整改内容';

-- ALTER TABLE `work_order` ADD COLUMN IF NOT EXISTS `report_id` varchar(64) DEFAULT NULL COMMENT '报告id';
-- ALTER TABLE `work_order` ADD COLUMN IF NOT EXISTS `report_version` tinyint(4) DEFAULT NULL COMMENT '报告版本';
-- ALTER TABLE `work_order` ADD COLUMN IF NOT EXISTS `report_at` datetime(3) DEFAULT NULL COMMENT '报告生成时间';
-- ALTER TABLE `work_order` ADD COLUMN IF NOT EXISTS `reject_reason` varchar(300) DEFAULT NULL COMMENT '驳回理由';
-- ALTER TABLE `work_order` ADD COLUMN IF NOT EXISTS `remind` tinyint(4) DEFAULT NULL COMMENT '催办';
-- ALTER TABLE `work_order` ADD COLUMN IF NOT EXISTS `score` tinyint(4) DEFAULT NULL COMMENT '得分';
-- ALTER TABLE `work_order` ADD COLUMN IF NOT EXISTS `feedback_content` varchar(300) DEFAULT NULL COMMENT '反馈内容';
-- ALTER TABLE `work_order` ADD COLUMN IF NOT EXISTS `feedback_at` datetime(3) DEFAULT NULL COMMENT '反馈时间';
-- ALTER TABLE `work_order` ADD COLUMN IF NOT EXISTS `feedback_by` char(36) DEFAULT NULL COMMENT '反馈人';
-- alter table af_tasks.`tc_task` add column if not exists `model_child_task_types`  varchar(20)  null  comment '子任务类型';

