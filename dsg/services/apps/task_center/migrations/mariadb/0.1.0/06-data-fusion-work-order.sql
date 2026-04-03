USE af_tasks;

CREATE TABLE IF NOT EXISTS `t_work_order_extend` (
    `id` BIGINT(20) NOT NULL COMMENT '雪花ID',
    `work_order_id` CHAR(36) NOT NULL COMMENT '工单ID',
    `extend_key` varchar(255)  NOT NULL COMMENT '扩展字段',
    `extend_value` varchar(255)  NOT NULL COMMENT '扩展内容',
    `deleted_at` DATETIME(3) DEFAULT NULL COMMENT '删除时间',
    PRIMARY KEY (`id`),
    KEY `idx_extend_work_order_id` (`work_order_id`)
) ENGINE=INNODB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='工单扩展表';

CREATE TABLE IF NOT EXISTS  `t_fusion_field` (
    `id` BIGINT(20) NOT NULL COMMENT '列雪花id',
    `c_name` varchar(255)  NOT NULL COMMENT '列中文名称',
    `e_name` varchar(255)  NOT NULL COMMENT '列英文名称',
    `work_order_id` CHAR(36) NOT NULL COMMENT '工单ID',
    `standard_id` BIGINT(20) DEFAULT NULL COMMENT '标准ID',
    `code_table_id` BIGINT(20) DEFAULT NULL COMMENT '码表ID',
    `code_rule_id` BIGINT(20) DEFAULT NULL COMMENT '编码规则ID',
    `data_range` TEXT DEFAULT NULL COMMENT '值域',
    `data_type` int  NOT NULL COMMENT '数据类型',
    `data_length` int  DEFAULT NULL COMMENT '数据长度',
    `data_accuracy` int DEFAULT NULL COMMENT '数据精度',
    `primary_key` tinyint(2) DEFAULT NULL COMMENT '是否主键',
    `is_required` tinyint(2) DEFAULT NULL COMMENT '是否必填',
    `is_increment` tinyint(2) DEFAULT NULL COMMENT '是否增量',
    `is_standard` tinyint(2) DEFAULT NULL COMMENT '是否标准',
    `field_relationship` varchar(128) NOT NULL DEFAULT '' COMMENT '字段关系',
    `catalog_id` BIGINT(20)  DEFAULT NULL COMMENT '数据资源目录ID',
    `info_item_id` BIGINT(20) DEFAULT NULL COMMENT '信息项ID',
    `index` int NOT NULL COMMENT '字段顺序',
    `created_by_uid` CHAR(36) NOT NULL COMMENT '创建人',
    `created_at` DATETIME(3) NOT NULL  DEFAULT current_timestamp(3)  COMMENT '创建时间',
    `updated_by_uid` CHAR(36) DEFAULT NULL COMMENT '更新人',
    `updated_at` DATETIME(3) DEFAULT NULL COMMENT '更新时间',
    `deleted_by_uid` CHAR(36) DEFAULT NULL COMMENT '删除人',
    `deleted_at` DATETIME(3) DEFAULT NULL COMMENT '删除时间',
    PRIMARY KEY (`id`),
    KEY `idx_t_fusion_field_work_order_id` (`work_order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='融合字段表';


-- alter table af_tasks.`t_work_order_extend` add column if not exists `fusion_type` tinyint(3)  NOT NULL  DEFAULT 1  COMMENT '融合类型�?常规方式�?场景分析方式';
-- alter table af_tasks.`t_work_order_extend` add column if not exists `exec_sql` longtext   NULL   COMMENT '执行sql';
-- alter table af_tasks.`t_work_order_extend` add column if not exists `scene_analysis_id` varchar(36) NULL  DEFAULT 1  COMMENT '场景分析画布id';
-- alter table af_tasks.`t_work_order_extend` add column if not exists `run_cron_strategy` varchar(36) NULL    COMMENT '运行执行策略';
-- alter table af_tasks.`t_work_order_extend` add column if not exists `datasource_id` varchar(36) NULL   COMMENT '目标数据源id';
-- alter table af_tasks.`t_work_order_extend` add column if not exists `run_start_at`  datetime(3) DEFAULT NULL COMMENT '运行开始时�?;
-- alter table af_tasks.`t_work_order_extend` add column if not exists `run_end_at`  datetime(3) DEFAULT NULL COMMENT '运行结束时间';
-- alter table af_tasks.`t_work_order_extend` add column if not exists `scene_sql` longtext   NULL   COMMENT '画布sql';


CREATE TABLE IF NOT EXISTS `points_rule_config` (
    `point_rule_config_id` bigint(20) unsigned NOT NULL COMMENT '雪花id',
    `id` char(36) NOT NULL COMMENT '对象id，uuid',
    `code` varchar(128) NOT NULL COMMENT '名称',
    `rule_type` varchar(36) NOT NULL COMMENT '策略类型',
    `config` text NULL COMMENT '积分规则配置',
    `period` text NULL COMMENT '积分规则配置有效期',
    `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) COMMENT '创建时间',
    `created_by_uid` char(36) NOT NULL COMMENT '创建用户ID',
    `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3)  COMMENT '更新时间',
    `updated_by_uid` char(36) NOT NULL COMMENT '更新用户ID',
    `deleted_at` bigint(20) DEFAULT 0 COMMENT '删除时间(逻辑删除)',
    PRIMARY KEY (`point_rule_config_id`),
    UNIQUE KEY `point_rule_config_code` (`code`,`deleted_at`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='积分规则配置';

CREATE TABLE IF NOT EXISTS `points_event` (
    `point_event_id` bigint(20) unsigned NOT NULL COMMENT '雪花id',
    `id` char(36) NOT NULL COMMENT '对象id，uuid',
    `code` varchar(128) NOT NULL COMMENT '名称',
    `business_module` varchar(128) NOT NULL COMMENT '所属业务模块',
    `points_object_type` varchar(10) NOT NULL COMMENT '积分对象类型',
    `points_object_id` char(36) NOT NULL COMMENT '积分对象ID',
    `points_object_name` varchar(1024) NOT NULL COMMENT '积分对象名称',
    `points_value` tinyint(3) NOT NULL COMMENT '积分值',
    `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) COMMENT '创建时间',
    PRIMARY KEY (`point_event_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='积分规则配置';


CREATE TABLE IF NOT EXISTS `points_event_top_department` (
    `point_event_top_department_id` bigint(20) unsigned NOT NULL COMMENT '雪花id',
    `id` char(36) NOT NULL COMMENT '对象id，uuid',
    `department_id` char(36) NOT NULL COMMENT '部门ID',
    `department_name` varchar(1024) NOT NULL COMMENT '部门名称',
    `department_path` varchar(1024) NOT NULL COMMENT '部门路径',
    `points_event_id` bigint(20) unsigned NOT NULL COMMENT '积分事件ID',
    `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) COMMENT '创建时间',
    PRIMARY KEY (`point_event_top_department_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='积分事件和部门关联表';





