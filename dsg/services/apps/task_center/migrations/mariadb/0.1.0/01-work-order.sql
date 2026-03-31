USE af_tasks;

CREATE TABLE IF NOT EXISTS `work_order` (
    `id` BIGINT(20) NOT NULL COMMENT '雪花id',
    `work_order_id` CHAR(36) NOT NULL COMMENT '工单id',
    `name` VARCHAR(128) NOT NULL COMMENT '工单名称',
    `code` VARCHAR(255) NOT NULL DEFAULT '' COMMENT '工单编号',
    `type` tinyint(4) NOT NULL COMMENT '工单类型',
    `status` tinyint(4) NOT NULL COMMENT '工单状态',
    `draft` int NOT NULL COMMENT '是否为草稿',
    `responsible_uid` CHAR(36) DEFAULT '' COMMENT '责任人',
    `priority` tinyint(4) DEFAULT NULL COMMENT '优先级',
    `finished_at` DATE DEFAULT NULL COMMENT '截止日期',
    `catalog_ids` TEXT DEFAULT NULL COMMENT '关联数据资源目录',
    `data_aggregation_inventory_id` CHAR(36) NOT NULL COMMENT '关联的数据归集清单ID，工单类型是数据归集时有值',
    `business_forms` text COMMENT '归集工单关联的业务表',
    `description` VARCHAR(800) DEFAULT '' COMMENT '工单说明',
    `remark` VARCHAR(300) DEFAULT '' COMMENT '备注',
    `processing_instructions` VARCHAR(255) DEFAULT '' COMMENT '处理说明',
    `audit_id` BIGINT(20) DEFAULT NULL COMMENT '审核id',
    `audit_status` tinyint(4) DEFAULT NULL COMMENT '审核状态',
    `audit_description` VARCHAR(255) DEFAULT '' COMMENT '审核描述',
    `source_type` tinyint(4) DEFAULT NULL COMMENT '来源类型',
    `source_id` CHAR(36) DEFAULT '' COMMENT '来源id',
    `source_ids` text  COMMENT '来源id列表',
    `created_by_uid` CHAR(36) NOT NULL COMMENT '创建人',
    `created_at` DATETIME(3) NOT NULL  DEFAULT current_timestamp(3)  COMMENT '创建时间',
    `updated_by_uid` CHAR(36) DEFAULT NULL COMMENT '更新人',
    `updated_at` DATETIME(3) DEFAULT NULL COMMENT '更新时间',
    `acceptance_at` DATETIME(3) DEFAULT NULL COMMENT '签收时间',
    `deleted_at` BIGINT(20) NOT NULL COMMENT '删除时间',
    PRIMARY KEY (`id`),
    KEY `idx_work_order_id` (`work_order_id`)
) ENGINE=INNODB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='工单';

-- ALTER TABLE `tc_task`
--     ADD COLUMN IF NOT EXISTS `work_order_id` varchar(36) NOT NULL COMMENT '工单id';

