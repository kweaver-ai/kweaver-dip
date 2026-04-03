USE `af_tasks`;

-- 数据归集清单
CREATE TABLE IF NOT EXISTS `data_aggregation_inventories` (
    `id`                CHAR(36)        NOT NULL                    COMMENT 'id',
    `code`              VARCHAR(21)     NOT NULL                    COMMENT '编码',
    `name`              VARCHAR(128)    NOT NULL                    COMMENT '名称',
    `creation_method`   INTEGER         NOT NULL                    COMMENT '创建方式',
    `department_id`     CHAR(36)        NOT NULL                    COMMENT '数源单位ID',
    `apply_id`          CHAR(36)        NOT NULL                    COMMENT 'Workflow 审核ApplyID',
    `status`            INTEGER         NOT NULL                    COMMENT '状态',
    `created_at`        DATETIME(3)     NOT NULL                    COMMENT '创建时间',
    `creator_id`        CHAR(36)        NOT NULL                    COMMENT '创建人ID',
    `requested_at`      DATETIME(3)                 DEFAULT NULL    COMMENT '申请时间',
    `requester_id`        CHAR(36)        NOT NULL                  COMMENT '申请人ID',
    `deleted_at`        BIGINT(20)      NOT NULL                    COMMENT '删除时间',
    PRIMARY KEY (`id`, `code`),
    INDEX `list` (`name`, `apply_id`, `department_id`, `status`, `requested_at`, `deleted_at`)
) ENGINE=INNODB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='数据归集清单';

-- 数据归集资源
--
-- 1. 记录数据归集清单关联的逻辑视图
-- 2. 记录数据归集工单关联的逻辑视图
CREATE TABLE IF NOT EXISTS `data_aggregation_resources` (
    `id`                            CHAR(36)      NOT NULL    COMMENT 'id',
    `data_view_id`                  CHAR(36)      NOT NULL    COMMENT '逻辑视图 ID',
    `data_aggregation_inventory_id` CHAR(36)      NOT NULL    COMMENT '所属数据归集清单的 ID 与 work_order_id 互斥',
    `work_order_id`                 CHAR(36)      NOT NULL    COMMENT '所属数据归集工单的 ID 与 data_aggregation_inventory_id 互斥',
    `collection_method`             INTEGER       NOT NULL    COMMENT '采集方式',
    `sync_frequency`                INTEGER       NOT NULL    COMMENT '同步频率',
    -- Deprecated: 数据归集清单与业务表无关
    `business_form_id`              CHAR(36)      NOT NULL    COMMENT '关联业务表ID',
    `data_table_name`               VARCHAR(128)  DEFAULT  '' COMMENT '业务标准表物化的数据表，由华傲加工平台返回',
    `target_datasource_id`          CHAR(36)      NOT NULL    COMMENT '目标数据源ID',
    `updated_at`                    BIGINT(20)    NOT NULL    COMMENT '更新时间',
    `deleted_at`                    BIGINT(20)    NOT NULL    COMMENT '删除时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY (`data_view_id`, `data_aggregation_inventory_id`, `work_order_id`, `deleted_at`)
) ENGINE=INNODB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='数据归集资源';

