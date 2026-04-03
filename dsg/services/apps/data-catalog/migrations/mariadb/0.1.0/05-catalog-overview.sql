USE af_data_catalog;


CREATE TABLE IF NOT EXISTS `audit_log`
(
    `id`                  bigint(20) NOT NULL,
    `catalog_id`          bigint(20) NOT NULL COMMENT '目录id',
    `audit_type`          varchar(255) NOT NULL COMMENT '审核类型',
    `audit_state`         int(11) NOT NULL COMMENT '审核状态',
    `audit_time`          datetime(3) NOT NULL COMMENT '审核时间',
    `audit_resource_type` int(11) NOT NULL COMMENT '审核的资源类型',
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='审核日志表';