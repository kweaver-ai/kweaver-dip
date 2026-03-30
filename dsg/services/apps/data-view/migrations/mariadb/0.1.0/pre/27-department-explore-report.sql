USE af_main;

CREATE TABLE IF NOT EXISTS `department_explore_report` (
    `id` BIGINT(20) NOT NULL COMMENT 'id,uuid',
    `department_id` CHAR(36) NOT NULL COMMENT '部门id',
    `total_views` INT(11) NOT NULL COMMENT '视图总量',
    `explored_views` INT(11) NOT NULL COMMENT '已探查成功视图数',
    `f_total_score` FLOAT(10,4) DEFAULT NULL COMMENT '总分',
    `f_total_completeness` FLOAT(10,4) DEFAULT NULL COMMENT '完整性总分',
    `f_total_standardization` FLOAT(10,4) DEFAULT NULL COMMENT '规范性总分',
    `f_total_uniqueness` FLOAT(10,4) DEFAULT NULL COMMENT '唯一性总分',
    `f_total_accuracy` FLOAT(10,4) DEFAULT NULL COMMENT '准确性总分',
    `f_total_consistency` FLOAT(10,4) DEFAULT NULL COMMENT '一致性总分',
    PRIMARY KEY (`id`),
    KEY `department_id` (`department_id`)
) ENGINE=INNODB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='部门探查报告表';