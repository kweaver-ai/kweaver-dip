use af_data_catalog;


create table if not EXISTS `t_data_push_model`(
    `id`    bigint(20) NOT NULL COMMENT '主键ID',
    `name` varchar(128) NOT NULL COMMENT '模型名',
    `description` varchar(300) DEFAULT NULL COMMENT '描述',
    `responsible_person_id` char(36) NOT NULL COMMENT '责任人',
    `channel` tinyint(4)  NOT NULL default 1 COMMENT '数据来源渠道,1web 2share_apply 3catalog_report  不填默认是web',
    `push_error`    text null COMMENT '推送错误信息，为空代表推送模型正确',
    `push_status`  tinyint(4) NOT NULL default 0 COMMENT '推送状态,1待发布，2未开始，3进行中，4已结束，5已停用',
    `operation` tinyint(4) NOT NULL  default 0 COMMENT '操作,1发布审核，2变更审核，3停用审核，4启用审核',
    -- 推送策略
    `transmit_mode` tinyint(2) NOT NULL  default 0   COMMENT '传输模式（1 增量 ; 2 全量）',
    `increment_field` char(36)  default ''  COMMENT '增量字段，传输模式是增量时候填写',
    `increment_timestamp` bigint(20)  DEFAULT 0 COMMENT '增量时间，传输模式是增量时候填写',
    `primary_key` varchar(128)  default ''  COMMENT '主键，技术名称，传输模式是增量时候填写',
    -- 调度策略
    `schedule_type` varchar(32) NOT NULL  COMMENT '调度计划:ONCE一次性,PERIOD增量',
    `schedule_time`  varchar(64) NOT NULL DEFAULT 0  COMMENT '调度时间，格式 2006-01-02 15:04:05; 空:立即执行;非空:定时执行',
    `schedule_start` varchar(64) DEFAULT NULL COMMENT '计划开始日期，格式 2006-01-02',
    `schedule_end`   varchar(64) DEFAULT NULL COMMENT '计划结束日期，格式 2006-01-02',
    `draft_schedule`  text    NULL COMMENT '调度草稿',
    `crontab_expr`   varchar(64) DEFAULT '' COMMENT 'linux crontab表达式, 6级',
    -- 推送内容
    `source_catalog_id`   bigint(20) NOT NULL COMMENT '目录主键ID',
    `source_department_id` char(36)  NOT NULL COMMENT '来源表目录所在的部门ID',
    `source_datasource_id` bigint(20)  NOT NULL COMMENT '来源表所在的数据源雪花ID',
    `source_datasource_uuid` char(36)  NOT NULL COMMENT '来源表所在的数据源UUID',
    `source_table_id` char(36) NOT NULL COMMENT '来源表ID，视图的uuid',
    `source_table_name` varchar(128)  NOT NULL default '' COMMENT '来源表技术名称',
    `target_datasource_id` bigint(20) NOT NULL COMMENT '目标表所在的数据源雪花ID',
    `target_sandbox_id` char(36)  NOT NULL default '' COMMENT '目标表数据源所在沙箱ID',
    `target_department_id` char(36)  NOT NULL default '' COMMENT '目标表数据源所在的部门ID',
    `target_datasource_uuid` char(36) NOT NULL COMMENT '目标表所在的数据源UUID',
    `target_table_exists` tinyint(4) NOT NULL  default 0 COMMENT '目标表在本次推送是否存在，0不存在，1存在',
    `target_table_name` varchar(128)  NOT NULL default '' COMMENT '目标表名称',
    `filter_condition`  text null COMMENT '过滤表达式，SQL后面的where条件',
    -- dolphin 相关
    `create_sql`    text null  COMMENT ' 加工模型的建表语句',
    `insert_sql`    text null  COMMENT '加工模型的插入语句',
    `dolphin_workflow_id` char(36) NOT NULL  default '' COMMENT 'dolphin的工作流ID',
    -- 审核字段
    `audit_state` tinyint(4) NOT NULL default 0 COMMENT '审核状态,1审核中，2审核通过，3未通过',
    `apply_id`    varchar(64) DEFAULT '' COMMENT '审核流程ID',
    `audit_advice` text null COMMENT '审核意见，仅驳回时有用',
    `proc_def_key` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '审核流程key',
    -- 基础字段
    `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) COMMENT '创建时间' ,
    `creator_uid` varchar(36) DEFAULT NULL COMMENT '创建用户ID',
    `creator_name` varchar(255) DEFAULT NULL COMMENT '创建用户名称',
    `updated_at` datetime NOT NULL DEFAULT current_timestamp() COMMENT '更新时间',
    `updater_uid` varchar(36) DEFAULT NULL COMMENT '更新用户ID',
    `updater_name` varchar(255) DEFAULT NULL COMMENT '更新用户名称',
    `deleted_at`  bigint(20)   DEFAULT NULL COMMENT '删除时间（逻辑删除）' ,
    PRIMARY KEY (`id`) USING BTREE
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='数据推送表';

-- ALTER TABLE t_data_push_model ADD COLUMN IF NOT EXISTS `target_department_id` char(36)  NOT NULL default '' COMMENT '目标表数据源所在的部门ID';
-- ALTER TABLE t_data_push_model ADD COLUMN IF NOT EXISTS `target_sandbox_id` char(36)  NOT NULL default '' COMMENT '目标表数据源所在沙箱ID';
-- ALTER TABLE t_data_push_model ADD COLUMN IF NOT EXISTS `update_sql`    text null  COMMENT '加工模型的更新语句' AFTER `insert_sql`;
-- ALTER TABLE t_data_push_model ADD COLUMN IF NOT EXISTS `update_existing_data_flag`   tinyint(4) NOT NULL default 0 COMMENT '是否更新已存在的数据，0不更新，1更新' AFTER `update_sql`;
-- ALTER TABLE t_data_push_model ADD COLUMN IF NOT EXISTS `is_desensitization` tinyint(4) NOT NULL default 0 COMMENT '是否脱敏，0为否，1为是' AFTER `filter_condition`;
-- ALTER TABLE t_data_push_model ADD COLUMN IF NOT EXISTS `source_hua_ao_id` varchar(255) default NULL COMMENT '来源数据的华傲ID' AFTER `source_datasource_uuid`;
-- ALTER TABLE t_data_push_model ADD COLUMN IF NOT EXISTS `target_hua_ao_id` varchar(255) default NULL COMMENT '目标数据的华傲ID' AFTER `target_datasource_uuid`;


create table if not EXISTS `t_data_push_fields`(
    `id`    bigint(20) NOT NULL COMMENT '主键ID',
    `model_id`   bigint(20) NOT NULL COMMENT '推送模型ID',
    `source_tech_name`  varchar(255) NOT NULL  COMMENT '来源列技术名称',
    `technical_name` varchar(255) NOT NULL  COMMENT '列技术名称',
    `business_name` varchar(255) DEFAULT NULL  COMMENT '列业务名称',
    `data_type` varchar(255) NOT NULL COMMENT '数据类型',
    `data_length` int(11) NOT NULL COMMENT '数据长度',
    `data_accuracy` int(11) default NULL COMMENT '数据精度（仅DECIMAL类型）',
    `primary_key` tinyint(2) default 0 COMMENT '是否是主键,0不是，1是',
    `is_nullable` varchar(30) NOT NULL COMMENT '是否为空',
    `comment` varchar(128) DEFAULT '' COMMENT '字段注释',
    PRIMARY KEY (`id`) USING BTREE,
    KEY   `idx_model_id` (`model_id`)
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='数据推送目的字段表';

-- ALTER TABLE t_data_push_fields modify `data_accuracy` int(11) default NULL COMMENT '数据精度（仅DECIMAL类型）';

