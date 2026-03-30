USE af_tasks;
-- 用户通知
CREATE TABLE  IF NOT EXISTS  `notifications` (
    `id`                        CHAR(36)    NOT NULL,
    `created_at`                DATETIME(3) NOT NULL,
    `updated_at`                DATETIME(3) NOT NULL,
    `deleted_at`                DATETIME(3) NULL,
    `recipient_id`              CHAR(36)    NOT NULL    COMMENT '收到这条通知的用户的 ID',
    `reason`                    VARCHAR(63) NOT NULL    COMMENT '用户收到这条通知的原因',
    `message`                   TEXT        NOT NULL    COMMENT '通知内容',
    `work_order_id`             CHAR(36)    NOT NULL    COMMENT '通知关联的工单的 ID',
    -- 用于避免重复发送。0 代表临期告警，1 代表剩余 1 天的提前告警，n 代表剩余 n 天的提前告警
    `work_order_alarm_index`    TINYINT     NULL        COMMENT '同一个工单所发出的通知的索引',
    `read`                      TINYINT(4)  NOT NULL    COMMENT '是否已读',
    PRIMARY KEY (`id`) USING BTREE,
    UNIQUE INDEX `idx_work_order` (`work_order_id`, `work_order_alarm_index`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET='utf8mb4' COLLATE='utf8mb4_unicode_ci' COMMENT='用户通知';