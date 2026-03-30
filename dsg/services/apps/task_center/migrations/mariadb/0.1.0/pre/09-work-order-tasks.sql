USE `af_tasks`;

-- 工单任务
CREATE TABLE IF NOT EXISTS `work_order_tasks` (
    `id`            CHAR(36)        NOT NULL COMMENT 'ID',
    `name`          VARCHAR(128)    NOT NULL COMMENT '任务名称',
    `created_at`    DATETIME(3)     NOT NULL COMMENT '创建时间',
    `updated_at`    DATETIME(3)     NOT NULL COMMENT '更新时间',

    `third_party_id`    CHAR(36)        NOT NULL COMMENT '第三方平台的 ID',
    `work_order_id`     CHAR(36)        NOT NULL COMMENT '所属工单ID',
    `status`            VARCHAR(64)     NOT NULL COMMENT '工单任务状态',
    `reason`            VARCHAR(512)    NOT NULL COMMENT '任务处于当前状态的原因，比如失败原因',
    `link`              VARCHAR(512)    NOT NULL COMMENT '任务失败处理 URL',
    PRIMARY KEY (`id`),
    INDEX `idx_work_order_id` (`work_order_id`)
) ENGINE=INNODB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='工单任务';

-- 归集工单的任务详�?
CREATE TABLE IF NOT EXISTS `work_order_data_aggregation_details` (
    `id`         CHAR(36)        NOT NULL COMMENT '工单任务 ID',

    `department_id`         CHAR(36)        NOT NULL    COMMENT '部门 ID',
    `source_datasource_id`  VARCHAR(256)    NOT NULL    COMMENT '源表所属第三方数据源ID',
    `source_table_name`     VARCHAR(256)    NOT NULL    COMMENT '源表名称',
    `target_datasource_id`  VARCHAR(256)    NOT NULL    COMMENT '目标表所属第三方数据源ID',
    `target_table_name`     VARCHAR(256)    NOT NULL    COMMENT '目标表名称',
    `count`                 INTEGER         NOT NULL    COMMENT '归集数量，代表这个任务中归集的数据的数量',

    PRIMARY KEY (`id`, `source_datasource_id`, `source_table_name`)
) ENGINE=INNODB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='归集工单的任务详情';

-- 融合工单的任务详�?
CREATE TABLE IF NOT EXISTS `work_order_data_fusion_details` (
    `id`         CHAR(36)        NOT NULL COMMENT '工单任务 ID',

    `datasource_id`     CHAR(36)        COMMENT '数据源ID',
    `datasource_name`   VARCHAR (128)   COMMENT '数据源名称',
    `data_table`        VARCHAR (128)   COMMENT '数据表名称',

   PRIMARY KEY (`id`)
) ENGINE=INNODB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='融合工单的任务详情';

-- 质量稽核工单的任务详�?
CREATE TABLE IF NOT EXISTS `work_order_data_quality_audit_details` (
    `id`         CHAR(36)        NOT NULL COMMENT 'ID',

    `work_order_id`     CHAR(36)        NOT NULL COMMENT '工单任务 ID',
    `datasource_id`     CHAR(36)        COMMENT '数据源ID',
    `datasource_name`   VARCHAR (128)   COMMENT '数据源名称',
    `data_table`        VARCHAR (128)   COMMENT '数据表名称',
    `detection_scheme`  VARCHAR (128)   COMMENT '检测方案',
    `status`            VARCHAR(64)     NOT NULL COMMENT '任务状态',
    `reason`            VARCHAR(512)    NOT NULL COMMENT '任务处于当前状态的原因，比如失败原因',
    `link`              VARCHAR(512)    NOT NULL COMMENT '任务失败处理 URL',
    PRIMARY KEY (`id`)
) ENGINE=INNODB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='质量稽核工单的任务详情';

