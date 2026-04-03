USE `af_tasks`;

CREATE TABLE  IF NOT EXISTS `work_order_alarms` (
    `id`                    CHAR(36)    NOT NULL,
    `created_at`            DATETIME(3) NOT NULL,
    `updated_at`            DATETIME(3) NOT NULL,
    `deleted_at`            DATETIME(3) NULL,
    `work_order_id`         CHAR(36)    NOT NULL,
    `deadline`              DATETIME(3) NOT NULL,
    `last_notified_at`      DATETIME(3) NULL        DEFAULT NULL    COMMENT '上一次发送用户通知的时间',
    PRIMARY KEY (`id`) USING BTREE,
    UNIQUE INDEX `idx_work_order_id` (`work_order_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET='utf8mb4' COLLATE='utf8mb4_unicode_ci' COMMENT='工单告警';