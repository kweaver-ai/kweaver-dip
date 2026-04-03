USE af_main;

CREATE TABLE IF NOT EXISTS  `form_view` (
  `form_view_id` bigint NOT NULL COMMENT '数据表视图雪花id',
  `id` char(36)   NOT NULL COMMENT '数据表视图uuid',
  `uniform_catalog_code` varchar(255) COMMENT '统一编目的编码',
  `technical_name` varchar(255) NOT NULL COMMENT '技术名称',
  `business_name` varchar(255) DEFAULT NULL COMMENT '业务名称',
  `original_name` varchar(255)  DEFAULT NULL COMMENT '原始表名称',
  `type` int NOT NULL COMMENT '视图来源 1：元数据视图、2：自定义视图、3：逻辑实体视图',
  `datasource_id` char(36) NULL COMMENT '数据源id',
  `status` int NOT NULL COMMENT '视图状态\\扫描结果 0：无变化、1：新增、2：删除、3：变更',
  `publish_at` datetime(3) COMMENT '发布时间',
  `edit_status` int NOT NULL COMMENT '内容状态 1：草稿（新增）、2：最新（完善字段业务名称）',
  `owner_id` varchar(512) NULL COMMENT '数据Ownerid',
  `subject_id` char(36) NULL COMMENT '主题域id',
  `department_id` char(36) NULL COMMENT '所属部门id',
  `info_system_id` char(36) NOT NULL DEFAULT '' COMMENT '关联信息系统ID',
  `scene_analysis_id` char(36) NULL COMMENT '场景分析画布id',
  `description` varchar(300) NULL COMMENT '逻辑视图描述',
  `comment` text NULL COMMENT '逻辑视图注释',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP (3) COMMENT '创建时间',
  `created_by_uid` char(36) NOT NULL COMMENT '创建人id',
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP (3) COMMENT '编辑时间',
  `updated_by_uid` char(36) NOT NULL COMMENT '编辑人id',
  `deleted_at` bigint(20) NOT NULL DEFAULT 0 COMMENT '删除时间（逻辑删除）',
  `explore_job_id` VARCHAR(64) DEFAULT NULL COMMENT '探查作业ID',
  `explore_job_version` INT(11) DEFAULT NULL COMMENT '探查作业版本',
  `explore_timestamp_id` varchar(64) DEFAULT NULL COMMENT '探查业务时间戳作业ID',
  `explore_timestamp_version` int(11) DEFAULT NULL COMMENT '探查业务时间戳作业版本',
  `flow_id` varchar(50) NOT NULL DEFAULT '' COMMENT '审核流程实例id',
  `flow_name` varchar(200) NOT NULL DEFAULT '' COMMENT '审核流程名称',
  `flow_node_id` varchar(50) NOT NULL DEFAULT '' COMMENT '当前所处审核流程结点id',
  `flow_node_name` varchar(200) NOT NULL DEFAULT '' COMMENT '当前所处审核流程结点名称',
  `online_status` varchar(20) NOT NULL DEFAULT 'notline' COMMENT '接口状态 未上线 notline、已上线 online、已下线offline、上线审核中up-auditing、下线审核中down-auditing、上线审核未通过up-reject、下线审核未通过down-reject',
  `audit_type` varchar(50) NOT NULL DEFAULT 'unpublished' COMMENT '审核类型 unpublished 未发布 af-data-view-online上线审核 af-data-view-offline 下线审核',
  `audit_status` varchar(20) NOT NULL DEFAULT 'unpublished' COMMENT '审核状态 unpublished 未发布 auditing 审核中 pass 通过 reject 驳回',
  `apply_id` bigint NOT NULL COMMENT '审核申请id',
  `proc_def_key` varchar(128) NOT NULL DEFAULT '' COMMENT '审核流程key',
  `audit_advice` text  DEFAULT NULL COMMENT '审核意见，仅驳回时有用',
  `online_time` datetime DEFAULT NULL COMMENT '上线时间',
  `filter_rule` text DEFAULT NULL COMMENT '数据过滤规则sql',
  `excel_file_name` varchar(128) DEFAULT NULL COMMENT 'excel文件名',
  `excel_sheet` varchar(512) DEFAULT NULL COMMENT 'sheet页,逗号分隔',
  `start_cell` varchar(50) DEFAULT NULL COMMENT '起始单元格',
  `end_cell` varchar(50) DEFAULT NULL COMMENT '结束单元格',
  `has_headers` int DEFAULT NULL COMMENT '是否首行作为列名',
  `sheet_as_new_column` int DEFAULT NULL COMMENT '是否将sheet作为新列',
  `source_sign` int DEFAULT NULL COMMENT '来源标识',
  `mdl_id` VARCHAR(36) NULL DEFAULT NULL COMMENT '统一视图id',
  `update_cycle` INT(11) DEFAULT 0 COMMENT '更新周期',
  `shared_type` INT(11) DEFAULT 0 COMMENT '共享属性',
  `open_type` INT(11) DEFAULT 0 COMMENT '开放属性',
  `understand_status` int NOT NULL DEFAULT 0 COMMENT '理解状态：0-未理解,1-理解中,2-待确认,3-已完成,4-已发布',
  PRIMARY KEY (`form_view_id`),
  UNIQUE KEY (`uniform_catalog_code`),
  KEY `id_btr` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='逻辑视图表';


CREATE TABLE IF NOT EXISTS  `form_view_field` (
  `form_view_field_id` bigint NOT NULL COMMENT '列雪花id',
  `id` char(36)  NOT NULL COMMENT '列uuid',
  `form_view_id` char(36)  NOT NULL COMMENT '数据表视图uuid',
  `technical_name` varchar(255)  NOT NULL COMMENT '列技术名称',
  `business_name` varchar(255)  DEFAULT NULL COMMENT '列业务名称',
  `original_name` varchar(255)  DEFAULT NULL COMMENT '原始字段名称',
  `field_role` tinyint DEFAULT NULL COMMENT '字段角色：1-业务主键, 2-关联标识, 3-业务状态, 4-时间字段, 5-业务指标, 6-业务特征, 7-审计字段, 8-技术字段',
  `field_description` varchar(300) DEFAULT NULL COMMENT '字段描述',
  `comment` text  NULL COMMENT '列注释',
  `status` int NOT NULL COMMENT '列视图状态（扫描结果） 0：无变化、1：新增、2：删除',
  `primary_key` int(1)  COMMENT '是否主键',
  `data_type` varchar(255)  NOT NULL COMMENT '数据类型',
  `data_length` int  NOT NULL COMMENT '数据长度',
  `data_accuracy` int NOT NULL COMMENT '数据精度（仅DECIMAL类型）',
  `original_data_type` varchar(255)  NOT NULL COMMENT '原始数据类型',
  `is_nullable` varchar(30)  NOT NULL COMMENT '是否为空',
  `deleted_at` bigint(20) NOT NULL DEFAULT 0 COMMENT '删除时间（逻辑删除）',
  `standard_code` varchar(30) NULL COMMENT '数据标准code',
  `standard` varchar(255) NULL COMMENT '数据标准名称',
  `code_table_id` varchar(30) NULL COMMENT '码表ID',
  `business_timestamp` int(1) DEFAULT NULL COMMENT '是否业务时间字段',
  `reset_before_data_type` varchar(255)   COMMENT '重置数据类型',
  `reset_convert_rules` varchar(255)   COMMENT '重置转换规则 （仅日期类型）',
  `reset_data_length` int   COMMENT '重置数据长度（仅DECIMAL类型）',
  `reset_data_accuracy` int  COMMENT '重置数据精度（仅DECIMAL类型）',
  `index` int NOT NULL COMMENT '字段顺序',
  `subject_id` CHAR(36) NULL DEFAULT NULL COMMENT '关联逻辑实体属性ID（L5）',
  `classify_type` int(1) NULL DEFAULT NULL COMMENT '数据分类方式 1：auto（自动分类） 2：manual（人工分类）',
  `match_score` VARCHAR(10) NULL DEFAULT NULL COMMENT '关联逻辑实体属性匹配度评分（满分100分），加%可直接作为匹配度百分比展示',
  `grade_id` bigint(20) NULL DEFAULT NULL COMMENT '分级标签id',
  `grade_type` int(1) NULL DEFAULT NULL COMMENT '数据分级标签获得方式 1：auto（自动匹配分级） 2：manual（人工选择分级）',
  `shared_type` INT(11) DEFAULT 0 COMMENT '共享属性',
  `open_type` INT(11) DEFAULT 0 COMMENT '开放属性',
  `sensitive_type` INT(11) DEFAULT 0 COMMENT '敏感属性',
  `secret_type` INT(11) DEFAULT 0 COMMENT '涉密属性',
  PRIMARY KEY (`form_view_field_id`),
  KEY `form_view_id_btr` (`form_view_id`),
  KEY `id_btr` (`id`)
) COMMENT='逻辑视图字段表';

CREATE TABLE  IF NOT EXISTS  `datasource` (
  `data_source_id` bigint(20) NOT NULL COMMENT '数据源雪花id',
  `id` char(36) NOT NULL COMMENT '数据源业务id',
  `info_system_id` char(36) DEFAULT NULL COMMENT '信息系统id',
  `name` varchar(128) NOT NULL COMMENT '数据源名称',
  `catalog_name` varchar(255) NOT NULL DEFAULT '' COMMENT '数据源catalog名称',
  `type_name` varchar(128) NOT NULL COMMENT '数据库类型名称',
  `host` varchar(256) NOT NULL COMMENT '连接地址',
  `port` int(11) NOT NULL COMMENT '端口',
  `username` varchar(128) NOT NULL COMMENT '用户名',
  `password` varchar(1024) NOT NULL COMMENT '密码',
  `database_name` varchar(128) NOT NULL COMMENT '数据库名称',
  `schema` varchar(128) NOT NULL COMMENT '数据库模式',
  `source_type` int NOT NULL DEFAULT 1 COMMENT '数据源类型 1:记录型、2:分析型',
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) COMMENT '创建时间',
  `created_by_uid` char(36) DEFAULT NULL,
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) COMMENT '更新时间',
  `updated_by_uid` char(36) DEFAULT NULL,
  `data_view_source` varchar(128) DEFAULT NULL COMMENT '数据视图源',
  `status` int NOT NULL DEFAULT 1 COMMENT '数据源状态',
  `metadata_task_id` varchar(128) COMMENT '元数据采集平台任务id',
  `hua_ao_id` varchar(128) DEFAULT NULL COMMENT '华傲（第三方）ID',
  `department_id` char(36) DEFAULT NULL COMMENT '部门id',
  PRIMARY KEY (`data_source_id`),
  UNIQUE KEY `uk_datasource` (`info_system_id`,`name`),
  KEY `id_btr` (`id`),
  KEY `idx_datasource_hua_ao_id` (`hua_ao_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='逻辑视图数据源表';


-- CREATE TABLE IF NOT EXISTS `scan_record` (
--     `id` bigint(20) NOT NULL,
--     `datasource_id` char(36) NOT NULL,
--     `scanner` char(36) NOT NULL,
--     `scan_time` datetime(3) NOT NULL DEFAULT current_timestamp(3)   ,
--     PRIMARY KEY (`id`),
--     UNIQUE KEY `uk_scan_record` (`datasource_id`,`scanner`)
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='逻辑视图数据源表扫描记录表';

CREATE TABLE IF NOT EXISTS  `form_view_sql` (
    `id` bigint NOT NULL COMMENT '雪花id',
    `form_view_id` char(36)  NOT NULL COMMENT '视图id（逻辑实体视图及自定义视图）',
    `sql` LONGTEXT  NOT NULL COMMENT '生成视图sql',
    UNIQUE KEY `uk_form_view_id` (`form_view_id`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='逻辑视图创建sql表';

CREATE TABLE IF NOT EXISTS  `t_data_download_task` (
  `id` bigint NOT NULL COMMENT '任务ID，雪花ID',
  `form_view_id` char(36) NOT NULL COMMENT '逻辑视图uuid',
  `name` varchar(255) DEFAULT NULL COMMENT '逻辑视图业务名称',
  `name_en` varchar(255) NOT NULL COMMENT '逻辑视图技术名称',
  `detail` text  NOT NULL COMMENT '任务详情，聚合json字符串（包含需要下载的列、行过滤条件信息及最大导出数据量信息）',
  `status` int NOT NULL COMMENT '任务状态 1 排队中 2 执行中（数据准备中） 3 已完成（可下载） 4 执行失败（异常）',
  `remark` text  DEFAULT NULL COMMENT '执行失败说明',
  `file_uuid` varchar(36) DEFAULT NULL COMMENT '导出数据文件UUID',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP (3) COMMENT '创建时间',
  `created_by` varchar(36) NOT NULL COMMENT '创建人id',
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP (3) COMMENT '编辑时间',
  PRIMARY KEY (`id`),
  KEY `idx_data_download_task_status_created_by` (`status`, `created_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='数据下载任务表';



CREATE TABLE IF NOT EXISTS `tmp_explore_sub_task` (
    `id` bigint(20) NOT NULL COMMENT '探查子任务id',
    `parent_task_id` char(36) NOT NULL COMMENT '父级数据源探查任务id',
    `form_view_id` char(36) NOT NULL COMMENT '视图id',
    `status` int(1) NOT NULL COMMENT '任务状态，1：queuing（等待中）；2：running（进行中）；3：finished（已完成）；4：canceled（已取消）；5：failed（异常）；',
    `remark` text DEFAULT NULL COMMENT '执行失败说明',
    `created_at` datetime(3) NOT NULL COMMENT '创建时间',
    `finished_at` datetime(3) DEFAULT NULL COMMENT '结束时间',
    PRIMARY KEY (`id`),
    KEY `idx_tmp_explore_sub_task` (`parent_task_id`,`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='探查子任务临时表';

CREATE TABLE IF NOT EXISTS `data_classify_attribute_blacklist` (
    `id` bigint(20) NOT NULL COMMENT '探查子任务id',
    `form_view_id` char(36) NOT NULL COMMENT '视图id',
    `field_id` char(36) NOT NULL COMMENT '字段id',
    `subject_id` char(36) NOT NULL COMMENT '关联逻辑实体属性ID（L5）',
    `created_at` datetime(3) NOT NULL COMMENT '创建时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uni_data_classify_attribute_blacklist` (`form_view_id`,`field_id`,`subject_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='数据分类属性黑名单';

-- 子视图，用于对逻辑视图的行列鉴权
CREATE TABLE IF NOT EXISTS `sub_views` (
  `snowflake_id`  BIGINT        NOT NULL  COMMENT '雪花 ID，无业务意义',
  `id`            CHAR(36)      NOT NULL  COMMENT 'ID',
  `name`          VARCHAR(255)  NOT NULL  COMMENT '名称',

  `logic_view_id` CHAR(36)  NOT NULL COMMENT '所属逻辑视图的 ID',
  `auth_scope_id` char(36) DEFAULT NULL COMMENT '行列规则限定范围，可以能是行列规则ID，可能是视图ID',
  `detail`        BLOB      NOT NULL COMMENT '行列规则，格式同下载任务的过滤条件',

  `created_at` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3)  ,
  `deleted_at` BIGINT       NOT NULL DEFAULT 0,

  PRIMARY KEY                                               (`snowflake_id`),
  UNIQUE KEY                                                (`id`),
  KEY         `idx_sub_views_deleted_at`                    (`deleted_at`)
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='子视图';

CREATE TABLE IF NOT EXISTS `explore_task` (
    `id` bigint(20) NOT NULL,
    `task_id` char(36) NOT NULL COMMENT '探查任务id',
    `type` int NOT NULL COMMENT '探查任务类型，1：explore_data（探查数据）；2：explore_timestamp（探查业务更新时间）；3：explore_classification（探查数据分类）',
    `datasource_id` char(36) DEFAULT '' COMMENT '数据源id',
    `subject_ids` VARCHAR(2000) NULL DEFAULT NULL COMMENT '分类id组',
    `form_view_id` char(36) DEFAULT '' COMMENT '视图id',
    `form_view_type` int DEFAULT NULL COMMENT '视图来源, 1：元数据视图；2：自定义视图；3：逻辑实体视图；',
    `status` int NOT NULL COMMENT '任务状态，1：queuing（等待中）；2：running（进行中）；3：finished（已完成）；4：canceled（已取消）；5：failed（异常）；',
    `config` longtext DEFAULT NULL COMMENT '探查配置',
    `remark` longtext DEFAULT NULL COMMENT '执行失败说明',
    `created_at` datetime(3) NOT NULL COMMENT '创建时间',
    `created_by_uid` char(36) NOT NULL COMMENT '创建人',
    `finished_at` datetime(3) DEFAULT NULL COMMENT '结束时间',
    `deleted_at` bigint(20) DEFAULT NULL COMMENT '删除时间',
    `work_order_id` char(36) DEFAULT NULL COMMENT '工单id',
    PRIMARY KEY (`id`),
    KEY `idx_task_id` (`task_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='探查任务表';

CREATE TABLE IF NOT EXISTS `tmp_completion` (
    `form_view_id` CHAR(36) NOT NULL COMMENT '视图id',
    `completion_id` CHAR(36) NOT NULL COMMENT '补全结果id',
    `result` LONGTEXT DEFAULT NULL COMMENT '补全结果',
    `status` int NOT NULL COMMENT '补全状态',
    `reason` VARCHAR(300) DEFAULT NULL COMMENT '补全失败原因',
    `created_at` datetime(3) NOT NULL COMMENT '创建时间',
    PRIMARY KEY (`form_view_id`)
) ENGINE=INNODB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='逻辑视图补全临时表';

CREATE TABLE IF NOT EXISTS `explore_rule_config` (
   `id` bigint(20) NOT NULL COMMENT '主键',
   `rule_id` char(36) DEFAULT NULL COMMENT '规则id',
   `rule_name` varchar(128) NOT NULL COMMENT '规则名称',
   `rule_description` varchar(300) DEFAULT NULL COMMENT '规则描述',
   `rule_level` int NOT NULL COMMENT '规则级别',
   `form_view_id` char(36) DEFAULT NULL COMMENT '视图id',
   `field_id` char(36) DEFAULT NULL COMMENT '字段id',
   `dimension` int NOT NULL COMMENT '维度',
   `dimension_type` int DEFAULT NULL COMMENT '维度类型',
   `rule_config` text DEFAULT NULL COMMENT '规则配置',
   `enable` int NOT NULL COMMENT '是否启用',
   `template_id` char(36) DEFAULT NULL COMMENT '模板id',
   `draft` int DEFAULT NULL COMMENT '是否草稿',
   `created_at` datetime(3) NOT NULL COMMENT '创建时间',
   `created_by_uid` char(36) DEFAULT NULL COMMENT '创建人',
   `updated_at` datetime(3) NOT NULL COMMENT '修改时间',
   `updated_by_uid` char(36) DEFAULT NULL COMMENT '修改人',
   `deleted_at` bigint(20) NOT NULL COMMENT '删除时间',
   PRIMARY KEY (`id`),
   KEY `idx_rule_id` (`rule_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='探查规则配置表';

INSERT INTO `explore_rule_config`
SELECT '529106505304113153', NULL, '表注释检查', '检查是否包含表注释', '1', NULL, NULL, '1', NULL, NULL, '0', '4662a178-140f-4869-88eb-57f789baf1d3', NULL, '2024-08-29 11:32:46.000', NULL, '2024-08-29 11:32:46.000', NULL, '0'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `explore_rule_config` WHERE `id` = '529106505304113153');

INSERT INTO `explore_rule_config`
SELECT '529108382372593665', NULL, '字段注释检查', '检查字段注释是否完整', '1', NULL, NULL, '1', NULL, NULL, '0', '931bf4e4-914e-4bff-af0c-ca57b63d1619', NULL, '2024-08-29 11:32:46.000', NULL, '2024-08-29 11:32:46.000', NULL, '0'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `explore_rule_config` WHERE `id` = '529108382372593665');

INSERT INTO `explore_rule_config`
SELECT '529108545782677505', NULL, '数据类型检查', '检查字段的数据类型、长度、精度和字段关联的数据标准是否相同', '1', NULL, NULL, '2', NULL, NULL, '0', 'c2c65844-5573-4306-92d7-d3f9ac2edbf6', NULL, '2024-08-29 11:32:46.000', NULL, '2024-08-29 11:32:46.000', NULL, '0'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `explore_rule_config` WHERE `id` = '529108545782677505');

INSERT INTO `explore_rule_config`
SELECT '529108986570473473', NULL, '空值项检查', '检查字段对应的值是否包含NULL或用户定义的空值项', '2', NULL, NULL, '1', NULL, NULL, '0', 'cf0b5b51-79f1-4cb3-8f0c-be0c3ad25e55', NULL, '2024-08-29 11:32:46.000', NULL, '2024-08-29 11:32:46.000', NULL, '0'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `explore_rule_config` WHERE `id` = '529108986570473473');

INSERT INTO `explore_rule_config`
SELECT '529109059517808641', NULL, '码值检查', '检查字段对应的值是否包含所有的码值', '2', NULL, NULL, '1', NULL, NULL, '0', 'fcbad175-862e-4d24-882c-c6dd96d9f4f2', NULL, '2024-08-29 11:32:46.000', NULL, '2024-08-29 11:32:46.000', NULL, '0'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `explore_rule_config` WHERE `id` = '529109059517808641');

INSERT INTO `explore_rule_config`
SELECT '529118144111837185', NULL, '重复值检查', '检查字段对应的值是否存在重复记录 ', '2', NULL, NULL, '3', NULL, NULL, '0', '6d8d7fdc-8cc4-4e89-a5dd-9b8d07a685dc', NULL, '2024-08-29 11:32:46.000', NULL, '2024-08-29 11:32:46.000', NULL, '0'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `explore_rule_config` WHERE `id` = '529118144111837185');

INSERT INTO `explore_rule_config`
SELECT '529118352753295361', NULL, '格式检查', '检查字段对应的值和定义的格式是否匹配', '2', NULL, NULL, '2', NULL, NULL, '0', '0e75ad19-a39b-4e41-b8f1-e3cee8880182', NULL, '2024-08-29 11:32:46.000', NULL, '2024-08-29 11:32:46.000', NULL, '0'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `explore_rule_config` WHERE `id` = '529118352753295361');

INSERT INTO `explore_rule_config`
SELECT '529118621473964033', NULL, '行数据空值项检查', '检查每一行数据否存在空值项', '3', NULL, NULL, '1', NULL, NULL, '0', '442f627c-b9bd-43f6-a3b1-b048525276a2', NULL, '2024-08-29 11:32:46.000', NULL, '2024-08-29 11:32:46.000', NULL, '0'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `explore_rule_config` WHERE `id` = '529118621473964033');

INSERT INTO `explore_rule_config`
SELECT '529118668617940993', NULL, '行数据重复值检查', '检查每一行数据是否存在重复记录', '3', NULL, NULL, '3', NULL, NULL, '0', '401f8069-21e5-4dd0-bfa8-432f2635f46c', NULL, '2024-08-29 11:32:46.000', NULL, '2024-08-29 11:32:46.000', NULL, '0'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `explore_rule_config` WHERE `id` = '529118668617940993');

INSERT INTO `explore_rule_config`
SELECT '529119079022198785', NULL, '数据及时性检查', '通过业务数据更新时间和更新周期比较', '4', NULL, NULL, '6', NULL, '{\"update_period\": \"month\"}', '0', 'f7447b7a-13a6-4190-9d0d-623af08bedea', NULL, '2024-08-29 11:32:46.000', NULL, '2024-08-29 11:32:46.000', NULL, '0'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `explore_rule_config` WHERE `id` = '529119079022198785');

INSERT INTO `explore_rule_config`
SELECT '529247613954818049', NULL, '最大值', '计算数据表中指定字段数值最大值', '2', NULL, NULL, '7', NULL, NULL, '0', '0c790158-9721-41ce-b8b3-b90341575485', NULL, '2024-08-29 11:32:46.000', NULL, '2024-08-29 11:32:46.000', NULL, '0'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `explore_rule_config` WHERE `id` = '529247613954818049');

INSERT INTO `explore_rule_config`
SELECT '529247613971595265', NULL, '最小值', '计算数据表中指定字段数值最小值', '2', NULL, NULL, '7', NULL, NULL, '0', '73271129-2ae3-47aa-83c5-6c0bf002140c', NULL, '2024-08-29 11:32:46.000', NULL, '2024-08-29 11:32:46.000', NULL, '0'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `explore_rule_config` WHERE `id` = '529247613971595265');

INSERT INTO `explore_rule_config`
SELECT '529247613971660801', NULL, '分位数', '计算数据表中指定字段分位数数值情况', '2', NULL, NULL, '7', NULL, NULL, '0', '91920b32-b884-4d23-a649-0518b038bf3b', NULL, '2024-08-29 11:32:46.000', NULL, '2024-08-29 11:32:46.000', NULL, '0'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `explore_rule_config` WHERE `id` = '529247613971660801');

INSERT INTO `explore_rule_config`
SELECT '529247613971726337', NULL, '平均值统计', '计算数据表中指定字段（限整数型、高精度型、小数型）数值平均值', '2', NULL, NULL, '7', NULL, NULL, '0', 'fd9fa13a-40db-4283-9c04-bf0ff3edcb32', NULL, '2024-08-29 11:32:46.000', NULL, '2024-08-29 11:32:46.000', NULL, '0'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `explore_rule_config` WHERE `id` = '529247613971726337');

INSERT INTO `explore_rule_config`
SELECT '529247613971791873', NULL, '标准差统计', '计算数据表中指定字段（限整数型、高精度型、小数型）数值标准差', '2', NULL, NULL, '7', NULL, NULL, '0', '06ad1362-9545-415d-9278-265e3abe7c10', NULL, '2024-08-29 11:32:46.000', NULL, '2024-08-29 11:32:46.000', NULL, '0'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `explore_rule_config` WHERE `id` = '529247613971791873');

INSERT INTO `explore_rule_config`
SELECT '529247613971857409', NULL, '枚举值分布', '计算数据表中指定字段（限整数型、高精度型、小数型、字符型）值分布情况', '2', NULL, NULL, '7', NULL, NULL, '0', '96ac5dc0-2e5c-4397-87a7-8414dddf8179', NULL, '2024-08-29 11:32:46.000', NULL, '2024-08-29 11:32:46.000', NULL, '0'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `explore_rule_config` WHERE `id` = '529247613971857409');

INSERT INTO `explore_rule_config`
SELECT '529247613971922945', NULL, '天分布', '计算数据表中指定字段（限日期型、日期时间型）数值按天分布情况', '2', NULL, NULL, '7', NULL, NULL, '0', '95e5b917-6313-4bd0-8812-bf0d4aa68d73', NULL, '2024-08-29 11:32:46.000', NULL, '2024-08-29 11:32:46.000', NULL, '0'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `explore_rule_config` WHERE `id` = '529247613971922945');

INSERT INTO `explore_rule_config`
SELECT '529247613971988481', NULL, '月分布', '计算数据表中指定字段（限日期型、日期时间型）数值按月分布情况', '2', NULL, NULL, '7', NULL, NULL, '0', '69c3d959-1c72-422b-959d-7135f52e4f9c', NULL, '2024-08-29 11:32:46.000', NULL, '2024-08-29 11:32:46.000', NULL, '0'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `explore_rule_config` WHERE `id` = '529247613971988481');

INSERT INTO `explore_rule_config`
SELECT '529247613972054017', NULL, '年分布', '计算数据表中指定字段（限日期型、日期时间型）数值按年分布情况', '2', NULL, NULL, '7', NULL, NULL, '0', '709fca1a-4640-4cd7-94ed-50b1b16e0aa5', NULL, '2024-08-29 11:32:46.000', NULL, '2024-08-29 11:32:46.000', NULL, '0'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `explore_rule_config` WHERE `id` = '529247613972054017');

INSERT INTO `explore_rule_config`
SELECT '529247613972119553', NULL, 'TRUE值数', '计算数据表中指定字段（限布尔型）TRUE值行数', '2', NULL, NULL, '7', NULL, NULL, '0', 'ae0f6573-b3e0-4be2-8330-a643261f8a18', NULL, '2024-08-29 11:32:46.000', NULL, '2024-08-29 11:32:46.000', NULL, '0'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `explore_rule_config` WHERE `id` = '529247613972119553');

INSERT INTO `explore_rule_config`
SELECT '529247613972185089', NULL, 'FALSE值数', '计算数据表中指定字段（限布尔型）FALSE值行数', '2', NULL, NULL, '7', NULL, NULL, '0', '45a4b3cb-b93c-469d-b3b4-631a3b8db5fe', NULL, '2024-08-29 11:32:46.000', NULL, '2024-08-29 11:32:46.000', NULL, '0'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `explore_rule_config` WHERE `id` = '529247613972185089');

CREATE TABLE IF NOT EXISTS `data_preview_config` (
   `id` bigint(20) NOT NULL COMMENT '雪花id',
   `form_view_id` char(36) NOT NULL COMMENT '逻辑视图id',
   `creator_uid` char(36) NOT NULL COMMENT '用户ID',
   `config` text DEFAULT NULL COMMENT '数据预览配置',
   PRIMARY KEY (`id`),
   KEY `idx_form_view_id` (`form_view_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='数据预览配置表';


CREATE TABLE IF NOT EXISTS `white_list_policy` (
    `white_policy_id` bigint(20) NOT NULL COMMENT '白名单策略id 雪花id',
    `id` char(255) DEFAULT '' COMMENT '白名单策略uuid',
    `form_view_id` char(255) DEFAULT '' COMMENT '逻辑视图id',
    `description` varchar(500) DEFAULT NULL COMMENT '描述信息',
    `config` text DEFAULT NULL COMMENT '配置信息',
    `created_at` datetime DEFAULT NULL COMMENT '创建时间',
    `created_by_uid` char(255) DEFAULT '' COMMENT '创建人id',
    `updated_at` datetime DEFAULT NULL COMMENT '更新时间',
    `updated_by_uid` char(255) DEFAULT '' COMMENT '更新者id',
    `deleted_at` int(11) DEFAULT 0 COMMENT '删除时间',
    PRIMARY KEY (`white_policy_id`),
    KEY `id` (`id`),
    KEY `form_view_id` (`form_view_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `desensitization_rule` (
    `desensitization_rule_id` bigint(20) NOT NULL COMMENT '脱敏规则id, 雪花id',
    `id` varchar(255) NOT NULL DEFAULT '' COMMENT '脱敏规则id, uuid',
    `name` varchar(255) DEFAULT NULL,
    `description` varchar(300) DEFAULT '' COMMENT '描述信息',
    `type` varchar(255) DEFAULT '' COMMENT '算法类型，自定义；内置',
    `inner_type` varchar(255) DEFAULT '' COMMENT '内置类型：身份证、手机、邮箱',
    `algorithm` varchar(255) DEFAULT '' COMMENT '脱敏规则算法内容，正则',
    `method` varchar(255) DEFAULT '' COMMENT '脱敏方式，首尾、中间、全部',
    `middle_bit` int(11) DEFAULT 0 COMMENT '中间脱敏位数',
    `head_bit` int(11) DEFAULT NULL COMMENT '头部位数',
    `tail_bit` int(11) DEFAULT NULL COMMENT '尾部位数',
    `created_at` datetime DEFAULT NULL COMMENT '创建时间',
    `created_by_uid` varchar(255) DEFAULT '' COMMENT '创建者id',
    `updated_at` datetime DEFAULT NULL COMMENT '更新时间',
    `updated_by_uid` varchar(255) DEFAULT '' COMMENT '更新者id',
    `deleted_at` int(11) DEFAULT 0 COMMENT '删除时间',
    PRIMARY KEY (`desensitization_rule_id`),
    KEY `id` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `data_privacy_policy` (
	data_privacy_policy_id BIGINT(20) NOT NULL COMMENT '数据隐私策略雪花id',
	id VARCHAR(255) NOT NULL COMMENT '数据隐私策略uuid',
	form_view_id VARCHAR(255) NOT NULL COMMENT '待脱敏数据视图uuid' ,
	policy_description VARCHAR(1000) NULL DEFAULT NULL COMMENT '隐私策略描述' ,
	created_at datetime(0) NOT NULL DEFAULT current_timestamp() COMMENT '创建时间',
	created_by_uid VARCHAR(255) NULL DEFAULT NULL COMMENT '创建用户id' ,
	updated_at datetime(0) NOT NULL DEFAULT current_timestamp() COMMENT '修改时间',
	updated_by_uid VARCHAR(255) NULL DEFAULT NULL COMMENT '修改用户id' ,
	deleted_at BIGINT(20) NOT NULL DEFAULT 0 COMMENT '删除时间',
	KEY id (id),
    KEY form_view_id (form_view_id),
    PRIMARY KEY (`data_privacy_policy_id`)
) COMMENT='数据隐私策略表';


CREATE TABLE IF NOT EXISTS `data_privacy_policy_field` (
	data_privacy_policy_field_id BIGINT(20) NOT NULL COMMENT '隐私策略字段雪花id',
	id VARCHAR(255) NOT NULL COMMENT '隐私策略字段uuid',
	data_privacy_policy_id VARCHAR(255) NOT NULL COMMENT '隐私策略uuid',
	form_view_field_id VARCHAR(255) NOT NULL  COMMENT '视图字段uuid' ,
	desensitization_rule_id VARCHAR(255) NOT NULL COMMENT '脱敏规则uuid' ,
	deleted_at BIGINT(20) NOT NULL DEFAULT '0' COMMENT '删除时间',
	KEY id (id),
    KEY form_view_field_id (form_view_field_id),
	KEY data_privacy_policy_id (data_privacy_policy_id),
	KEY desensitization_rule_id (desensitization_rule_id),
    PRIMARY KEY (`data_privacy_policy_field_id`)
) COMMENT='数据隐私策略字段表';

CREATE TABLE IF NOT EXISTS `t_form_view_extend` (
    `id` char(36) NOT NULL COMMENT '逻辑视图uuid',
    `is_audited` int(1) NOT NULL  COMMENT '是否已稽核',
    PRIMARY KEY (`id`)
) COMMENT='逻辑视图扩展表';

CREATE TABLE IF NOT EXISTS recognition_algorithm (
	recognition_algorithm_id BIGINT(20) NOT NULL,
	id VARCHAR(255) NOT NULL DEFAULT '' COMMENT '识别算法uuid',
	name VARCHAR(255) NULL DEFAULT NULL COMMENT '识别算法名称',
	description VARCHAR(1024) NULL DEFAULT NULL COMMENT '识别算法描述',
	type VARCHAR(255) NULL DEFAULT NULL COMMENT '算法类型，自定义;内置',
	inner_type VARCHAR(255) NULL DEFAULT NULL COMMENT '内置类型',
	algorithm VARCHAR(1024) NULL DEFAULT NULL COMMENT '算法表达式',
	status INT(11) NOT NULL DEFAULT '0' COMMENT '0停用1启用',
	created_at DATETIME(0) NULL DEFAULT current_timestamp() COMMENT '创建时间',
	created_by_uid VARCHAR(255) NULL DEFAULT NULL COMMENT '创建用户id',
	updated_at DATETIME(0) NULL DEFAULT current_timestamp() COMMENT '修改时间',
	updated_by_uid VARCHAR(255) NULL DEFAULT NULL COMMENT '修改用户id',
	deleted_at BIGINT(20) NOT NULL DEFAULT '0' COMMENT '删除时间',
	INDEX id (id),
    PRIMARY KEY (`recognition_algorithm_id`)
)COMMENT='识别算法表';


CREATE TABLE IF NOT EXISTS classification_rule (
	classification_rule_id BIGINT(20) NOT NULL COMMENT '分类规则雪花id',
	id VARCHAR(255) NOT NULL DEFAULT '' COMMENT '分类规则uuid',
	name VARCHAR(255) NULL DEFAULT NULL COMMENT '分类规则名称',
	description VARCHAR(1024) NULL DEFAULT NULL COMMENT '分类规则描述',
	type VARCHAR(255) NULL DEFAULT NULL COMMENT '规则类型，custom;inner',
	subject_id VARCHAR(255) NOT NULL DEFAULT '' COMMENT '分类属性uuid',
	status INT(11) NOT NULL DEFAULT '0' COMMENT '0停用1启用',
	created_at DATETIME(0) NULL DEFAULT current_timestamp() COMMENT '创建时间',
	created_by_uid VARCHAR(255) NULL DEFAULT NULL COMMENT '创建用户id',
	updated_at DATETIME(0) NULL DEFAULT current_timestamp() COMMENT '修改时间',
	updated_by_uid VARCHAR(255) NULL DEFAULT NULL COMMENT '修改用户id',
	deleted_at BIGINT(20) NOT NULL DEFAULT '0' COMMENT '删除时间',
	INDEX id (id),
    PRIMARY KEY (`classification_rule_id`)
)COMMENT='分类规则表';


CREATE TABLE IF NOT EXISTS classification_rule_algorithm_relation (
	classification_rule_algorithm_relation_id BIGINT(20) NOT NULL COMMENT '分类规则算法关系雪花id',
	id VARCHAR(255) NOT NULL DEFAULT '' COMMENT '分类规则算法关系uuid',
	classification_rule_id VARCHAR(255) NOT NULL DEFAULT '' COMMENT '分类规则uuid',
	recognition_algorithm_id VARCHAR(255) NOT NULL DEFAULT '' COMMENT '识别算法uuid',
	status INT(11) NOT NULL DEFAULT '0' COMMENT '0停用1启用',
	deleted_at BIGINT(20) NOT NULL DEFAULT '0' COMMENT '删除时间',
	INDEX id (id),
	INDEX classification_rule_id (classification_rule_id),
	INDEX recognition_algorithm_id (recognition_algorithm_id),
    PRIMARY KEY (`classification_rule_algorithm_relation_id`)
)COMMENT='分类规则算法关系';


CREATE TABLE IF NOT EXISTS grade_rule (
	grade_rule_id BIGINT(20) NOT NULL COMMENT '分级规则雪花id',
	id VARCHAR(255) NOT NULL DEFAULT '' COMMENT '分级规则uuid',
	name VARCHAR(255) NULL DEFAULT NULL COMMENT '分级规则名称',
	description VARCHAR(1024) NULL DEFAULT NULL COMMENT '分级规则描述',
	subject_id VARCHAR(255) NOT NULL DEFAULT '' COMMENT '分级属性uuid',
	label_id BIGINT(20) NOT NULL DEFAULT '0' COMMENT '分级标签uuid',
	logical_expression TEXT  DEFAULT NULL COMMENT '逻辑表达式',
	type VARCHAR(255) NULL DEFAULT NULL COMMENT '算法类型，custom;inner',
    group_id char(36) DEFAULT '' COMMENT '所属规则组ID',
	status INT(11) NOT NULL DEFAULT '0' COMMENT '0停用1启用',
	created_at DATETIME(0) NULL DEFAULT current_timestamp() COMMENT '创建时间',
	created_by_uid VARCHAR(255) NULL DEFAULT NULL COMMENT '创建用户id',
	updated_at DATETIME(0) NULL DEFAULT current_timestamp() COMMENT '修改时间',
	updated_by_uid VARCHAR(255) NULL DEFAULT NULL COMMENT '修改用户id',
	deleted_at BIGINT(20) NOT NULL DEFAULT '0' COMMENT '删除时间',
	INDEX id (id) USING BTREE,
    PRIMARY KEY (grade_rule_id) USING BTREE
)COMMENT='分级规则表';



INSERT INTO grade_rule (grade_rule_id, id, name, description, subject_id, label_id, logical_expression, type, status,  created_by_uid,  updated_by_uid, deleted_at)
SELECT 1, '1', '默认规则', NULL, '', 0, '', 'inner', 1, NULL, NULL, 0
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM grade_rule WHERE id = '1');

INSERT INTO classification_rule (classification_rule_id, id, name, description, type, subject_id, status,  created_by_uid,  updated_by_uid, deleted_at)
SELECT 1, '1', '默认规则', NULL, 'inner', 'ef12001d-d650-4620-a0e1-7a11a930d40b', 1, null, null, 0
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM classification_rule WHERE id = '1');


INSERT INTO recognition_algorithm (recognition_algorithm_id, id, name, description, type, inner_type, algorithm, status,  created_by_uid, updated_by_uid, deleted_at)
SELECT 1, '92efd8f2-2709-432e-b88d-317a4fbd5a01', '内置模版', '内置模版不可删除', 'inner', '默认', '-', 1, null, null, 0
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM recognition_algorithm WHERE id = '92efd8f2-2709-432e-b88d-317a4fbd5a01');

INSERT INTO recognition_algorithm (recognition_algorithm_id, id, name, description, type, inner_type, algorithm, status,  created_by_uid, updated_by_uid, deleted_at)
SELECT 2, 'a1b2c3d4-e5f6-4321-b987-654321fedcba', '身份证', '支持18位和15位身份证号码验证', 'inner', '身份证', '^[1-9]\\d{5}(?:18|19|20)\\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[1-2]\\d|3[0-1])\\d{3}[\\dXx]$|^[1-9]\\d{5}\\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[1-2]\\d|3[0-1])\\d{3}$', 1, null, null, 0
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM recognition_algorithm WHERE id = 'a1b2c3d4-e5f6-4321-b987-654321fedcba');

INSERT INTO recognition_algorithm (recognition_algorithm_id, id, name, description, type, inner_type, algorithm, status,  created_by_uid, updated_by_uid, deleted_at)
SELECT 3, 'b2c3d4e5-f6a7-5432-c098-765432fedcba', '手机号', '支持13、14、15、16、17、18、19开头的手机号码验证', 'inner', '手机号', '^1[3-9]\\d{9}$', 1, null, null, 0
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM recognition_algorithm WHERE id = 'b2c3d4e5-f6a7-5432-c098-765432fedcba');

INSERT INTO recognition_algorithm (recognition_algorithm_id, id, name, description, type, inner_type, algorithm, status,  created_by_uid, updated_by_uid, deleted_at)
SELECT 4, 'c3d4e5f6-a7b8-6543-d109-876543fedcba', '邮箱', '标准邮箱地址格式验证', 'inner', '邮箱', '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$', 1, null, null, 0
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM recognition_algorithm WHERE id = 'c3d4e5f6-a7b8-6543-d109-876543fedcba');

INSERT INTO recognition_algorithm (recognition_algorithm_id, id, name, description, type, inner_type, algorithm, status,  created_by_uid, updated_by_uid, deleted_at)
SELECT 5, 'd4e5f6a7-b8c9-7654-e210-987654fedcba', '银行卡号', '支持13-19位数字的银行卡号验证', 'inner', '银行卡号', '^[1-9]\\d{12,18}$', 1, null, null, 0
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM recognition_algorithm WHERE id = 'd4e5f6a7-b8c9-7654-e210-987654fedcba');

create table if not EXISTS `t_graph_model`(
    `model_id`   bigint(20) unsigned NOT NULL COMMENT '自增雪花ID',
    `id`  char(36) NOT NULL COMMENT '主键ID，uuid',
    `business_name` varchar(255) DEFAULT NULL  COMMENT '模型名称，业务名称',
    `model_type` int NOT NULL  default 1 COMMENT '模型类型，1元模型，2专题模型，3主题模型',
    `description` varchar(255) DEFAULT NULL COMMENT '描述',
    `subject_id`  char(36)  NOT NULL COMMENT '业务对象ID',
    `technical_name` varchar(255) NOT NULL  COMMENT '模型技术名称',
    `catalog_id`  bigint(20) unsigned NOT NULL COMMENT '目录的主键ID',
    `graph_id`  bigint(20) unsigned NOT NULL COMMENT '图谱ID',
    `data_view_id`  char(36) NOT NULL COMMENT '目录带的元数据视图ID',
    `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) COMMENT '创建时间' ,
    `creator_uid` char(36) DEFAULT NULL COMMENT '创建用户ID',
    `updated_at` datetime(0) NOT NULL DEFAULT current_timestamp()  COMMENT '更新时间',
    `updater_uid` varchar(36) DEFAULT NULL COMMENT '更新用户ID',
    `updater_name` varchar(255) DEFAULT NULL COMMENT '更新用户名称',
    `deleted_at`  bigint(20)   DEFAULT NULL COMMENT '删除时间（逻辑删除）' ,
    `grade_label_id` varchar(36) DEFAULT NULL COMMENT '模型密级ID',
    PRIMARY KEY (`model_id`) USING BTREE,
    KEY   `idx_id` (`id`)
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='图模型';

create table if not EXISTS `t_model_single_node`(
    `id`   bigint(20) unsigned NOT NULL COMMENT '自增雪花ID',
    `model_id` char(36) NOT NULL COMMENT '主题模型/专题模型ID',
    `meta_model_id` char(36) NOT NULL COMMENT '元模型ID',
    `display_field_id` char(36) NOT NULL COMMENT '显示字段ID',
    PRIMARY KEY (`id`) USING BTREE,
    KEY   `idx_model_id` (`model_id`)
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='复合模型的孤立模型的ID';

create table if not EXISTS `t_model_relation`(
    `relation_id`   bigint(20) unsigned NOT NULL COMMENT '自增雪花ID',
    `id`  char(36) NOT NULL COMMENT '主键ID，uuid',
    `business_name` varchar(255) DEFAULT NULL  COMMENT '业务名称',
    `technical_name` varchar(255) NOT NULL  COMMENT '模型技术名称',
    `model_id` char(36) NOT NULL COMMENT '主题模型/专题模型ID',
    `description` varchar(255) DEFAULT NULL COMMENT '描述',
    `start_display_field_id` char(36) NOT NULL COMMENT '起点显示字段ID',
    `end_display_field_id` char(36) NOT NULL COMMENT '终点显示字段ID',
    -- 基础字段
    `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) COMMENT '创建时间' ,
    `updated_at` datetime NOT NULL DEFAULT current_timestamp()  COMMENT '更新时间',
    `updater_uid` char(36) DEFAULT NULL COMMENT '更新用户ID',
    `updater_name` varchar(255) DEFAULT NULL COMMENT '更新用户名称',
    PRIMARY KEY (`relation_id`) USING BTREE,
    KEY   `idx_id` (`id`)
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='复合模型的关系';

create table if not EXISTS `t_model_relation_link`(
    `id`   bigint(20) unsigned NOT NULL COMMENT '主键ID',
    `model_id` char(36) NOT NULL COMMENT '主题模型/专题模型ID',
    `unique_id`  char(36) NOT NULL COMMENT '关系信息几个字段拼接的MD5值',
    `relation_id`  char(36) NOT NULL COMMENT '模型关系ID',
    -- 关系信息
    `start_model_id`  char(36) NOT NULL COMMENT '起点元模型ID',
    `start_field_id`  char(36) NOT NULL COMMENT '起点字段ID',
    `end_model_id`   char(36) NOT NULL COMMENT '终点元模型ID',
    `end_field_id`  char(36) NOT NULL COMMENT '起点字段ID',
    PRIMARY KEY (`id`) USING BTREE,
    KEY   `idx_relation_id` (`relation_id`)
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='复合模型的关系';


create table if not EXISTS `t_model_field`(
     `id`    bigint(20) unsigned NOT NULL COMMENT '主键ID',
    `field_id`  char(36) NOT NULL COMMENT '视图字段ID',
    `model_id`  char(36) NOT NULL COMMENT '元模型ID',
    `technical_name` varchar(255) NOT NULL  COMMENT '列技术名称',
    `business_name` varchar(255) DEFAULT NULL  COMMENT '列业务名称',
    `data_type` varchar(255) NOT NULL COMMENT '数据类型',
    `data_length` int(11) NOT NULL COMMENT '数据长度',
    `data_accuracy` int(11) NOT NULL COMMENT '数据精度',
    `primary_key` int(1) default 0 COMMENT '是否是主键,0不是，1是',
    `is_nullable` varchar(30) NOT NULL COMMENT '是否为空',
    `comment` text DEFAULT NULL COMMENT '字段注释',
    PRIMARY KEY (`id`) USING BTREE,
    KEY   `idx_model_id` (`model_id`)
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='元模型字段表';


CREATE TABLE  if not EXISTS  `t_model_canvas` (
     `id` char(36) NOT NULL COMMENT '模型id',
     `canvas` mediumtext DEFAULT NULL COMMENT '画布信息',
     PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='模型画布';

CREATE TABLE IF NOT EXISTS `data_set` (
    data_set_id BIGINT(20) NOT NULL COMMENT '数据集雪花id',
    id VARCHAR(255) NOT NULL COMMENT '数据集uuid',
    data_set_name VARCHAR(1000) NULL DEFAULT NULL COMMENT '数据集名称' ,
    data_set_description VARCHAR(1000) NULL DEFAULT NULL COMMENT '数据集描述' ,
    created_at datetime NOT NULL DEFAULT current_timestamp() COMMENT '创建时间',
    created_by_uid VARCHAR(255) NULL DEFAULT NULL COMMENT '创建用户id' ,
    updated_at datetime NOT NULL DEFAULT current_timestamp() COMMENT '修改时间',
    updated_by_uid VARCHAR(255) NULL DEFAULT NULL COMMENT '修改用户id' ,
    deleted_at BIGINT(20) NOT NULL DEFAULT 0 COMMENT '删除时间',
    PRIMARY KEY (data_set_id),
    KEY id (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='数据集表';

CREATE TABLE IF NOT EXISTS `data_set_view_relation` (
    id VARCHAR(255) NOT NULL COMMENT '数据集uuid',
    form_view_id VARCHAR(36) NOT NULL COMMENT '数据视图uuid',
    updated_at datetime NOT NULL DEFAULT current_timestamp() COMMENT '修改时间',
    PRIMARY KEY (id, form_view_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='数据集视图关系表';


CREATE TABLE IF NOT EXISTS `template_rule` (
    `id` bigint(20) NOT NULL COMMENT '主键',
    `rule_id` char(36) DEFAULT NULL COMMENT '规则id',
    `rule_name` varchar(128) NOT NULL COMMENT '规则名称',
    `rule_description` varchar(300) DEFAULT NULL COMMENT '规则描述',
    `rule_level` int NOT NULL COMMENT '规则级别',
    `dimension` int NOT NULL COMMENT '维度',
    `dimension_type` int DEFAULT NULL COMMENT '维度类型',
    `source` int NOT NULL COMMENT '来源',
    `rule_config` text DEFAULT NULL COMMENT '规则配置',
    `enable` int NOT NULL COMMENT '默认检测是否启用',
    `created_at` datetime(3) DEFAULT NULL COMMENT '创建时间',
    `created_by_uid` char(36) DEFAULT NULL COMMENT '创建人',
    `updated_at` datetime(3) DEFAULT NULL COMMENT '修改时间',
    `updated_by_uid` char(36) DEFAULT NULL COMMENT '修改人',
    `deleted_at` bigint(20) NOT NULL COMMENT '删除时间',
    PRIMARY KEY (`id`),
    KEY `idx_rule_id` (`rule_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='模板规则表';

INSERT IGNORE INTO `template_rule` (`id`, `rule_id`, `rule_name`, `rule_description`, `rule_level`, `dimension`, `dimension_type`, `source`, `rule_config`, `enable`, `created_at`, `created_by_uid`, `updated_at`, `updated_by_uid`, `deleted_at`) values('529106505304113153','4662a178-140f-4869-88eb-57f789baf1d3','表注释检查','检查是否包含表注释','1','1',NULL,'1',NULL,'0',NULL,NULL,NULL,NULL,'0');
INSERT IGNORE INTO `template_rule` (`id`, `rule_id`, `rule_name`, `rule_description`, `rule_level`, `dimension`, `dimension_type`, `source`, `rule_config`, `enable`, `created_at`, `created_by_uid`, `updated_at`, `updated_by_uid`, `deleted_at`) values('529108382372593665','931bf4e4-914e-4bff-af0c-ca57b63d1619','字段注释检查','检查字段注释是否完整','1','1',NULL,'1',NULL,'0',NULL,NULL,NULL,NULL,'0');
INSERT IGNORE INTO `template_rule` (`id`, `rule_id`, `rule_name`, `rule_description`, `rule_level`, `dimension`, `dimension_type`, `source`, `rule_config`, `enable`, `created_at`, `created_by_uid`, `updated_at`, `updated_by_uid`, `deleted_at`) values('529108545782677505','c2c65844-5573-4306-92d7-d3f9ac2edbf6','数据类型检查','检查字段的数据类型、长度、精度和字段关联的数据标准是否相同','1','2',NULL,'1',NULL,'0',NULL,NULL,NULL,NULL,'0');
INSERT IGNORE INTO `template_rule` (`id`, `rule_id`, `rule_name`, `rule_description`, `rule_level`, `dimension`, `dimension_type`, `source`, `rule_config`, `enable`, `created_at`, `created_by_uid`, `updated_at`, `updated_by_uid`, `deleted_at`) values('529118144111837185','6d8d7fdc-8cc4-4e89-a5dd-9b8d07a685dc','重复值检查','检查字段对应的值是否存在重复记录','2','3','5','1',NULL,'0',NULL,NULL,NULL,NULL,'0');
INSERT IGNORE INTO `template_rule` (`id`, `rule_id`, `rule_name`, `rule_description`, `rule_level`, `dimension`, `dimension_type`, `source`, `rule_config`, `enable`, `created_at`, `created_by_uid`, `updated_at`, `updated_by_uid`, `deleted_at`) values('529247613954818049','0c790158-9721-41ce-b8b3-b90341575485','最大值','计算数据表中指定字段数值最大值','2','7',NULL,'1',NULL,'0',NULL,NULL,NULL,NULL,'0');
INSERT IGNORE INTO `template_rule` (`id`, `rule_id`, `rule_name`, `rule_description`, `rule_level`, `dimension`, `dimension_type`, `source`, `rule_config`, `enable`, `created_at`, `created_by_uid`, `updated_at`, `updated_by_uid`, `deleted_at`) values('529247613971595265','73271129-2ae3-47aa-83c5-6c0bf002140c','最小值','计算数据表中指定字段数值最小值','2','7',NULL,'1',NULL,'0',NULL,NULL,NULL,NULL,'0');
INSERT IGNORE INTO `template_rule` (`id`, `rule_id`, `rule_name`, `rule_description`, `rule_level`, `dimension`, `dimension_type`, `source`, `rule_config`, `enable`, `created_at`, `created_by_uid`, `updated_at`, `updated_by_uid`, `deleted_at`) values('529247613971660801','91920b32-b884-4d23-a649-0518b038bf3b','分位数','计算数据表中指定字段分位数数值情况','2','7',NULL,'1',NULL,'0',NULL,NULL,NULL,NULL,'0');
INSERT IGNORE INTO `template_rule` (`id`, `rule_id`, `rule_name`, `rule_description`, `rule_level`, `dimension`, `dimension_type`, `source`, `rule_config`, `enable`, `created_at`, `created_by_uid`, `updated_at`, `updated_by_uid`, `deleted_at`) values('529247613971726337','fd9fa13a-40db-4283-9c04-bf0ff3edcb32','平均值统计','计算数据表中指定字段（限整数型、高精度型、小数型）数值平均值','2','7',NULL,'1',NULL,'0',NULL,NULL,NULL,NULL,'0');
INSERT IGNORE INTO `template_rule` (`id`, `rule_id`, `rule_name`, `rule_description`, `rule_level`, `dimension`, `dimension_type`, `source`, `rule_config`, `enable`, `created_at`, `created_by_uid`, `updated_at`, `updated_by_uid`, `deleted_at`) values('529247613971791873','06ad1362-9545-415d-9278-265e3abe7c10','标准差统计','计算数据表中指定字段（限整数型、高精度型、小数型）数值标准差','2','7',NULL,'1',NULL,'0',NULL,NULL,NULL,NULL,'0');
INSERT IGNORE INTO `template_rule` (`id`, `rule_id`, `rule_name`, `rule_description`, `rule_level`, `dimension`, `dimension_type`, `source`, `rule_config`, `enable`, `created_at`, `created_by_uid`, `updated_at`, `updated_by_uid`, `deleted_at`) values('529247613971857409','96ac5dc0-2e5c-4397-87a7-8414dddf8179','枚举值分布','计算数据表中指定字段（限整数型、高精度型、小数型、字符型）值分布情况','2','7',NULL,'1',NULL,'0',NULL,NULL,NULL,NULL,'0');
INSERT IGNORE INTO `template_rule` (`id`, `rule_id`, `rule_name`, `rule_description`, `rule_level`, `dimension`, `dimension_type`, `source`, `rule_config`, `enable`, `created_at`, `created_by_uid`, `updated_at`, `updated_by_uid`, `deleted_at`) values('529247613971922945','95e5b917-6313-4bd0-8812-bf0d4aa68d73','天分布','计算数据表中指定字段（限日期型、日期时间型）数值按天分布情况','2','7',NULL,'1',NULL,'0',NULL,NULL,NULL,NULL,'0');
INSERT IGNORE INTO `template_rule` (`id`, `rule_id`, `rule_name`, `rule_description`, `rule_level`, `dimension`, `dimension_type`, `source`, `rule_config`, `enable`, `created_at`, `created_by_uid`, `updated_at`, `updated_by_uid`, `deleted_at`) values('529247613971988481','69c3d959-1c72-422b-959d-7135f52e4f9c','月分布','计算数据表中指定字段（限日期型、日期时间型）数值按月分布情况','2','7',NULL,'1',NULL,'0',NULL,NULL,NULL,NULL,'0');
INSERT IGNORE INTO `template_rule` (`id`, `rule_id`, `rule_name`, `rule_description`, `rule_level`, `dimension`, `dimension_type`, `source`, `rule_config`, `enable`, `created_at`, `created_by_uid`, `updated_at`, `updated_by_uid`, `deleted_at`) values('529247613972054017','709fca1a-4640-4cd7-94ed-50b1b16e0aa5','年分布','计算数据表中指定字段（限日期型、日期时间型）数值按年分布情况','2','7',NULL,'1',NULL,'0',NULL,NULL,NULL,NULL,'0');
INSERT IGNORE INTO `template_rule` (`id`, `rule_id`, `rule_name`, `rule_description`, `rule_level`, `dimension`, `dimension_type`, `source`, `rule_config`, `enable`, `created_at`, `created_by_uid`, `updated_at`, `updated_by_uid`, `deleted_at`) values('529247613972119553','ae0f6573-b3e0-4be2-8330-a643261f8a18','TRUE值数','计算数据表中指定字段（限布尔型）TRUE值行数','2','7',NULL,'1',NULL,'0',NULL,NULL,NULL,NULL,'0');
INSERT IGNORE INTO `template_rule` (`id`, `rule_id`, `rule_name`, `rule_description`, `rule_level`, `dimension`, `dimension_type`, `source`, `rule_config`, `enable`, `created_at`, `created_by_uid`, `updated_at`, `updated_by_uid`, `deleted_at`) values('529247613972185089','45a4b3cb-b93c-469d-b3b4-631a3b8db5fe','FALSE值数','计算数据表中指定字段（限布尔型）FALSE值行数','2','7',NULL,'1',NULL,'0',NULL,NULL,NULL,NULL,'0');

CREATE TABLE if not exists `grade_rule_group` (
    `id` char(36) NOT NULL DEFAULT '' COMMENT '规则组uuid',
    `name` varchar(255) NOT NULL DEFAULT '' COMMENT '规则组名称',
    `description` varchar(1024) DEFAULT '' COMMENT '规则组描述',
    `business_object_id` char(36) NOT NULL COMMENT '分级规则雪花id',
    `created_at` datetime DEFAULT current_timestamp() COMMENT '创建时间',
    `updated_at` datetime NOT NULL DEFAULT current_timestamp()  COMMENT '更新时间',
    `deleted_at` bigint(20) NOT NULL DEFAULT 0 COMMENT '删除时间',
    PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='分级规则组表';

create table if not EXISTS `t_model_label_rec_rel`(
    `id` bigint(20) NOT NULL COMMENT '主键ID',
    `name` varchar(50) DEFAULT NULL  COMMENT '标签名称',
    `description` varchar(300) DEFAULT NULL COMMENT '描述',
    `related_model_ids` varchar(500) NOT NULL  COMMENT '关联模型id集合,多个逗号分隔',
    `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) COMMENT '创建时间' ,
    `creator_uid` varchar(36) DEFAULT NULL COMMENT '创建用户ID',
    `created_name` varchar(50) DEFAULT NULL COMMENT '创建用户名称',
    `updated_at` datetime DEFAULT NULL  COMMENT '更新时间',
    `updater_uid` varchar(36) DEFAULT NULL COMMENT '更新用户ID',
    `updater_name` varchar(50) DEFAULT NULL COMMENT '更新用户名称',
    `deleted_at`  bigint(20)   DEFAULT NULL COMMENT '删除时间（逻辑删除）' ,
    PRIMARY KEY (`id`)
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='标签关联模型推荐配置';

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

create table if not EXISTS `user`(
    `id`        char(36)          not null comment '用户ID',
    `name`      varchar(255)      null,
    `status`    tinyint default 1 not null comment '用户状态,1正常,2删除',
    `user_type` tinyint default 1 not null comment '用户分类 (1 普通用户， 2 AF应用)',
    primary key  (`id`)
    )ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';