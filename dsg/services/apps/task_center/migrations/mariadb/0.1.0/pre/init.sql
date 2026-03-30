USE af_tasks;

CREATE TABLE IF NOT EXISTS `operation_log` (
    `id` char(36) NOT NULL COMMENT '主键，uuid',
    `obj` varchar(255) NOT NULL COMMENT '操作对象的模',
    `obj_id` char(36) NOT NULL COMMENT '操作对象ID',
    `name` varchar(255) DEFAULT NULL COMMENT '操作',
    `success` tinyint(2) DEFAULT 1 COMMENT '是否成功，默认是成功',
    `result` varchar(1024) DEFAULT NULL COMMENT '操作结果, 成功显示操作结果，失败显示失败的原因',
    `created_by_uid` varchar(36) NOT NULL COMMENT '操作者的ID',
    `deleted_at` bigint(20) NOT NULL DEFAULT 0 COMMENT '删除时间(逻辑删除)',
    `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) COMMENT '创建时间',
    PRIMARY KEY (`id`) USING BTREE,
    KEY `idx_business_id` (`obj`,`obj_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='操作日志';

CREATE TABLE IF NOT EXISTS `task_relation_data` (
    `id` char(36) NOT NULL COMMENT '主键,uuid',
    `mid` bigint(20) NOT NULL COMMENT '雪花id',
    `task_id` char(36) NOT NULL COMMENT '任务ID',
    `project_id` char(36) NOT NULL COMMENT '项目ID',
    `business_model_id` char(36) DEFAULT NULL COMMENT '主干业务的业务模型ID，可',
    `data` longtext   NULL COMMENT 'json类型字段, 关联数据详情',
    `updated_by_uid` varchar(36) DEFAULT NULL COMMENT '更新人id',
    `updated_at` datetime(3) DEFAULT current_timestamp(3)  COMMENT '更新时间',
    `deleted_at` bigint(20)  NOT NULL DEFAULT 0 COMMENT '删除时间(逻辑删除)',
    PRIMARY KEY (`id`) USING BTREE,
    UNIQUE KEY `task_id_idx` (`task_id`,`deleted_at`) USING BTREE,
    KEY `project_id_idx` (`project_id`,`deleted_at`) USING BTREE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='任务数据关联';

CREATE TABLE IF NOT EXISTS `tc_flow_info` (
    `id` char(36) NOT NULL COMMENT '主键，uuid',
    `flow_id` char(36) NOT NULL COMMENT '流水线id',
    `flow_version` varchar(36) NOT NULL COMMENT '流水线版',
    `flow_name` varchar(128) NOT NULL COMMENT '流水线名',
    `node_completion_mode` varchar(128) NOT NULL COMMENT '节点完成方式',
    `node_start_mode` varchar(128) NOT NULL COMMENT '节点启动方式',
    `node_id` char(36) NOT NULL COMMENT '节点后端ID',
    `node_name` varchar(128) NOT NULL COMMENT '节点名称',
    `node_unit_id` char(36) NOT NULL COMMENT '节点前端ID',
    `prev_node_ids` varchar(2048) DEFAULT NULL COMMENT '前序节点后端ID数组，逗号分割的数',
    `prev_node_unit_ids` varchar(2048) DEFAULT NULL COMMENT '前序节点前端ID数组，逗号分割的数',
    `task_completion_mode` varchar(128) NOT NULL COMMENT '任务完成方式',
    `stage_id` char(36) DEFAULT NULL COMMENT '阶段的后端ID',
    `stage_name` varchar(128) DEFAULT NULL COMMENT '阶段名称',
    `stage_order` int(11) DEFAULT 0 COMMENT '阶段顺序',
    `stage_unit_id` char(36) DEFAULT NULL COMMENT '阶段的前端ID',
    `task_type` int(11) NOT NULL DEFAULT 1 COMMENT '任务类型数组，取值范围',
    `work_order_type` VARCHAR(10) DEFAULT NULL COMMENT '任务类型数组',
    PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='任务中心流水线配置表';

CREATE TABLE IF NOT EXISTS `tc_flow_view` (
    `mid` char(36) NOT NULL COMMENT '主键，uuid',
    `id` char(36) NOT NULL COMMENT '流水线ID，uuid',
    `name` varchar(128) NOT NULL DEFAULT '' COMMENT '流水线视图名',
    `version` char(36) NOT NULL COMMENT '流水线版',
    `content` text NULL COMMENT '视图信息：包含位置、形状、大小等',
    `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) COMMENT '创建时间',
    `created_by_uid` char(36) NOT NULL DEFAULT '' COMMENT '创建用户ID',
    `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3)  COMMENT '更新时间',
    `updated_by_uid` char(36) NOT NULL DEFAULT '' COMMENT '更新用户ID',
    PRIMARY KEY (`mid`) USING BTREE,
    UNIQUE KEY `uk_id_version` (`id`,`version`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='项目流水线视图信';

CREATE TABLE IF NOT EXISTS `tc_member` (
    `id` char(36) NOT NULL COMMENT '主键，uuid',
    `obj` tinyint(3)  NOT NULL COMMENT '成员对象(0，项目1，任务)',
    `obj_id` char(36) NOT NULL COMMENT '对象ID',
    `role_id` VARCHAR(36)  NULL COMMENT '用户角色ID',
    `user_id` char(36) NOT NULL COMMENT '成员ID',
    `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) COMMENT '创建时间',
    `deleted_at` bigint(20) NOT NULL DEFAULT 0 COMMENT '删除时间(逻辑删除)',
    PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='任务中心项目成员';

CREATE TABLE IF NOT EXISTS `tc_oss` (
    `id` char(36) NOT NULL COMMENT '主键，uuid',
    `appendix` varchar(128) NOT NULL COMMENT '对象类型',
    `size` bigint(20)  NOT NULL DEFAULT 0 COMMENT '对象尺寸',
    `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) COMMENT '创建时间',
    `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3)  COMMENT '更新时间',
    `deleted_at` bigint(20) NOT NULL DEFAULT 0 COMMENT '删除时间(逻辑删除)',
    `file_uuid` varchar(128) NOT NULL COMMENT '文件UUID',
    PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='任务中心对象存储';

CREATE TABLE IF NOT EXISTS `tc_project` (
    `id` varchar(36) NOT NULL COMMENT '主键，uuid',
    `name` varchar(128) NOT NULL COMMENT '项目名称',
    `description` varchar(255) DEFAULT NULL COMMENT '项目描述',
    `image` varchar(2048) DEFAULT NULL COMMENT '项目图片',
    `flow_id` varchar(36) NOT NULL COMMENT '流水线id',
    `flow_version` varchar(36) NOT NULL COMMENT '流水线版',
    `status` tinyint(3)  DEFAULT 1 COMMENT '项目状态（未开始1、进行中2、已完成3)',
    `priority` tinyint(3)  DEFAULT 1 COMMENT '项目优先级（普通、紧急、非常紧急)',
    `owner_id` varchar(36) NOT NULL COMMENT '项目负责人id',
    `deadline` bigint(20)  DEFAULT NULL COMMENT '项目截止时间',
    `complete_time` bigint(20)  DEFAULT NULL COMMENT '项目完成时间',
    `project_type` int(11) NOT NULL DEFAULT 1 COMMENT '任务类型，取值范围1 本地创建2 来自第三方',
    `created_by_uid` varchar(36) NOT NULL COMMENT '创建人id',
    `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) COMMENT '创建时间',
    `updated_by_uid` varchar(36) DEFAULT NULL COMMENT '更新人id',
    `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3)  COMMENT '更新时间',
    `deleted_at` bigint(20) NOT NULL DEFAULT 0 COMMENT '删除时间(逻辑删除)',
    `third_project_id`  varchar(36)  NULL  COMMENT '第三方项目ID',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_name` (`name`,`deleted_at`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='任务中心项目';

CREATE TABLE IF NOT EXISTS `tc_task` (
    `id` varchar(36) NOT NULL COMMENT '主键，uuid',
    `name` varchar(128) NOT NULL COMMENT '任务名称，可以重',
    `description` varchar(255) DEFAULT NULL COMMENT '任务描述',
    `project_id` varchar(36) NOT NULL COMMENT '项目id',
    `work_order_id` varchar(36) NOT NULL COMMENT '工单id',
    `parent_task_id` char(36) DEFAULT NULL COMMENT '父任务的ID',
    `flow_id` varchar(36) DEFAULT NULL COMMENT '流水线id',
    `flow_version` varchar(36) DEFAULT NULL,
    `stage_id` varchar(36) DEFAULT NULL COMMENT '阶段id',
    `node_id` varchar(36) NOT NULL COMMENT '节点id',
    `status` tinyint(3)  DEFAULT 1 COMMENT '任务状态（未开始1、进行中2、已完成3)',
    `config_status` tinyint(4) NOT NULL DEFAULT 1 COMMENT '任务状态，默认1正常 2 缺失业务域ID, 3缺失主干业务ID',
    `priority` tinyint(3)  DEFAULT 1 COMMENT '任务优先级（普通、紧急、非常紧急)',
    `executor_id` varchar(36) NOT NULL COMMENT '任务执行人id',
    `deadline` bigint(20)  DEFAULT NULL COMMENT '任务截止时间',
    `complete_time` bigint(20)  NOT NULL DEFAULT 0 COMMENT '任务完成时间',
    `created_by_uid` varchar(36) NOT NULL COMMENT '创建人id',
    `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) COMMENT '创建时间',
    `updated_by_uid` varchar(36) DEFAULT NULL COMMENT '更新人id',
    `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3)  COMMENT '更新时间',
    `deleted_at` bigint(20) NOT NULL DEFAULT 0 COMMENT '删除时间(逻辑删除)',
    `task_type` int(11) NOT NULL DEFAULT 1 COMMENT '任务类型，取值范围1 普通任务2 默认 3新建模型类任务，4 标准化任务',
    `model_child_task_types`  varchar(20)  null  comment '子任务类',
    `business_model_id` char(36) DEFAULT NULL COMMENT '主干业务ID',
    `executable_status` tinyint(3)  NOT NULL DEFAULT 2 COMMENT '业务指标状态（未开启任务、已开启任务，失效任务， 4已完成任务',
    `org_type` int(11) DEFAULT NULL COMMENT '标准分类',
    `subject_domain_id` char(36) NOT NULL COMMENT '主题域id',
    `data_comprehension_catalog_id` text  COMMENT '数据目录理解任务关联数据资源目录id',
    `data_comprehension_template_id` char(36)  COMMENT '数据目录理解任务关联数据理解模板id',
    PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='任务中心任务';


CREATE TABLE IF NOT EXISTS `user` (
    `id` varchar(36) NOT NULL COMMENT '主键，uuid',
    `name` varchar(255) DEFAULT NULL,
    `status` int  NOT NULL DEFAULT 1 COMMENT '用户状1正常,2删除',
    `user_type` tinyint(4) NOT NULL DEFAULT 1 COMMENT '用户分类 (1 普通用户， 2 AF应用)',
    PRIMARY KEY (`id`),
    UNIQUE KEY `t_user_id` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='冗余用户';

CREATE TABLE IF NOT EXISTS `data_comprehension_plan` (
   `data_comprehension_plan_id` bigint(20)  NOT NULL COMMENT '雪花id',
   `id` char(36) NOT NULL COMMENT '对象id，uuid',
   `name` varchar(128) NOT NULL COMMENT '名称',
   `responsible_uid` char(36) NOT NULL COMMENT '责任人id',
   `started_at` bigint(20)  NOT NULL COMMENT '开始日',
   `finished_at` bigint(20)  DEFAULT NULL COMMENT '结束日期',
   `task_id` char(36) DEFAULT NULL COMMENT '关联任务id',
   `attachment_id` char(36) DEFAULT NULL COMMENT '附件ID',
   `attachment_name` VARCHAR(255) DEFAULT NULL COMMENT '附件名称',
   `content` text   COMMENT '计划内容',
   `opinion` varchar(300) DEFAULT '' COMMENT '申报意见',
   `audit_status` tinyint(2) DEFAULT NULL COMMENT '审核状1:审核中2: 已撤销 3：已驳回 4: 通过',
   `audit_id` bigint(20) DEFAULT NULL COMMENT '审核记录ID',
   `audit_proc_inst_id` VARCHAR(64) DEFAULT NULL COMMENT '审核实例ID',
   `audit_result` VARCHAR(64) DEFAULT NULL COMMENT '审核结果 agree 通过 reject 拒绝 undone 撤销',
   `reject_reason` VARCHAR(300) DEFAULT NULL COMMENT '驳回原因',
   `cancel_reason` VARCHAR(300) DEFAULT NULL COMMENT '需求撤销原因',
   `status` tinyint(2) DEFAULT NULL COMMENT '申报状态:未开 2: 进行 3: 已完成',
   `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) COMMENT '创建时间',
   `created_by_uid` char(36) NOT NULL COMMENT '创建用户ID',
   `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3)  COMMENT '更新时间',
   `updated_by_uid` char(36) NOT NULL COMMENT '更新用户ID',
   `deleted_at` bigint(20) DEFAULT 0 COMMENT '删除时间(逻辑删除)',
  PRIMARY KEY (`data_comprehension_plan_id`),
  UNIQUE KEY `data_comprehension_plan_name` (`name`,`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='数据理解计划';

CREATE TABLE IF NOT EXISTS `data_aggregation_plan` (
   `data_aggregation_plan_id` bigint(20)  NOT NULL COMMENT '雪花id',
   `id` char(36) NOT NULL COMMENT '对象id，uuid',
   `name` varchar(128) NOT NULL COMMENT '名称',
   `responsible_uid` char(36) NOT NULL COMMENT '责任人id',
   `priority` varchar(64) NOT NULL COMMENT '优先',
   `started_at` bigint(20)  NOT NULL COMMENT '开始日',
   `finished_at` bigint(20)  DEFAULT NULL COMMENT '结束日期',
   `auto_start` tinyint(4) NOT NULL COMMENT '是否自动启动，枚举：0：不自动启动1：自动启',
   `content` text  COMMENT '计划内容',
   `opinion` varchar(300) DEFAULT '' COMMENT '申报意见',
   `audit_status` tinyint(2) DEFAULT NULL COMMENT '审核状:1审核中 2: 已撤销 3：已驳回 4: 通过',
   `audit_id` bigint(20) DEFAULT NULL COMMENT '审核记录ID',
   `audit_proc_inst_id` VARCHAR(64) DEFAULT NULL COMMENT '审核实例ID',
   `audit_result` VARCHAR(64) DEFAULT NULL COMMENT '审核结果 agree 通过 reject 拒绝 undone 撤销',
   `reject_reason` VARCHAR(300) DEFAULT NULL COMMENT '驳回原因',
   `cancel_reason` VARCHAR(300) DEFAULT NULL COMMENT '需求撤销原因',
   `status` tinyint(2) DEFAULT NULL COMMENT '申报状态未开始 2: 进行中 3: 已完成',
   `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) COMMENT '创建时间',
   `created_by_uid` char(36) NOT NULL COMMENT '创建用户ID',
   `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3)  COMMENT '更新时间',
   `updated_by_uid` char(36) NOT NULL COMMENT '更新用户ID',
   `deleted_at` bigint(20) DEFAULT 0 COMMENT '删除时间(逻辑删除)',
  PRIMARY KEY (`data_aggregation_plan_id`),
  UNIQUE KEY `data_aggregation_plan_name` (`name`,`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='数据归集计划';

CREATE TABLE IF NOT EXISTS `data_processing_plan` (
   `data_processing_plan_id` bigint(20)  NOT NULL COMMENT '雪花id',
   `id` char(36) NOT NULL COMMENT '对象id，uuid',
   `name` varchar(128) NOT NULL COMMENT '名称',
   `responsible_uid` char(36) NOT NULL COMMENT '责任人id',
   `priority` varchar(64) NOT NULL COMMENT '优先',
   `started_at` bigint(20)  NOT NULL COMMENT '开始日',
   `finished_at` bigint(20)  DEFAULT NULL COMMENT '结束日期',
   `content` text  COMMENT '计划内容',
   `opinion` varchar(800) DEFAULT '' COMMENT '申报意见',
   `audit_status` tinyint(2) DEFAULT NULL COMMENT '审核状态1:审核中 2: 已撤销 3：已驳回 4: 通过',
   `audit_id` bigint(20) DEFAULT NULL COMMENT '审核记录ID',
   `audit_proc_inst_id` VARCHAR(64) DEFAULT NULL COMMENT '审核实例ID',
   `audit_result` VARCHAR(64) DEFAULT NULL COMMENT '审核结果 agree 通过 reject 拒绝 undone 撤销',
   `reject_reason` VARCHAR(300) DEFAULT NULL COMMENT '驳回原因',
   `cancel_reason` VARCHAR(300) DEFAULT NULL COMMENT '需求撤销原因',
   `status` tinyint(2) DEFAULT NULL COMMENT '申报状态:1待申报2：已申报',
   `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) COMMENT '创建时间',
   `created_by_uid` char(36) NOT NULL COMMENT '创建用户ID',
   `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3)  COMMENT '更新时间',
   `updated_by_uid` char(36) NOT NULL COMMENT '更新用户ID',
   `deleted_at` bigint(20) DEFAULT 0 COMMENT '删除时间(逻辑删除)',
  PRIMARY KEY (`data_processing_plan_id`),
  UNIQUE KEY `data_processing_plan_name` (`name`,`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='数据处理计划';

CREATE TABLE IF NOT EXISTS `work_order` (
    `id` BIGINT(20) NOT NULL COMMENT '雪花id',
    `work_order_id` CHAR(36) NOT NULL COMMENT '工单id',
    `name` VARCHAR(128) NOT NULL COMMENT '工单名称',
    `department_id` char(36) NULL COMMENT '所属部门id',
    `data_source_department_id` char(36) NULL COMMENT '数源部门id(质量整改工单使用)',
    `code` VARCHAR(255) NOT NULL DEFAULT '' COMMENT '工单编号',
    `type` tinyint(4) NOT NULL COMMENT '工单类型',
    `status` tinyint(4) NOT NULL COMMENT '工单状',
    `draft` int NOT NULL COMMENT '是否为草',
    `responsible_uid` CHAR(36) DEFAULT '' COMMENT '责任',
    `priority` tinyint(4) DEFAULT NULL COMMENT '优先',
    `finished_at` DATE DEFAULT NULL COMMENT '截止日期',
    `catalog_ids` TEXT DEFAULT NULL COMMENT '关联数据资源目录',
    `data_aggregation_inventory_id` CHAR(36) NOT NULL COMMENT '关联的数据归集清ID，工单类型是数据归集时有值',
    `business_forms` BLOB DEFAULT NULL COMMENT '归集工单关联的业务表',
    `description` VARCHAR(800) DEFAULT '' COMMENT '工单说明',
    `remark` LONGTEXT DEFAULT NULL COMMENT '备注',
    `processing_instructions` VARCHAR(300) DEFAULT '' COMMENT '处理说明',
    `audit_id` BIGINT(20) DEFAULT NULL COMMENT '审核id',
    `audit_status` tinyint(4) DEFAULT NULL COMMENT '审核状',
    `audit_description` VARCHAR(255) DEFAULT '' COMMENT '审核描述',
    `source_type` tinyint(4) DEFAULT NULL COMMENT '来源类型',
    `source_id` CHAR(36) DEFAULT '' COMMENT '来源id',
    `source_ids` text   COMMENT '来源id列表',
    `created_by_uid` CHAR(36) NOT NULL COMMENT '创建',
    `created_at` DATETIME(3) NOT NULL COMMENT '创建时间',
    `updated_by_uid` CHAR(36) DEFAULT NULL COMMENT '更新',
    `updated_at` DATETIME(3) DEFAULT NULL COMMENT '更新时间',
    `acceptance_at` DATETIME(3) DEFAULT NULL COMMENT '签收时间',
    `process_at` DATETIME(3) DEFAULT NULL COMMENT '处理时间(质量整改单使用)',
    `deleted_at` BIGINT(20) NOT NULL COMMENT '删除时间',
    `report_id` varchar(64) DEFAULT NULL COMMENT '报告id',
    `report_version` tinyint(4) DEFAULT NULL COMMENT '报告版本',
    `report_at` datetime(3) DEFAULT NULL COMMENT '报告生成时间',
    `reject_reason` varchar(300) DEFAULT NULL COMMENT '驳回理由',
    `remind` tinyint(4) DEFAULT NULL COMMENT '催办',
    `score` tinyint(4) DEFAULT NULL COMMENT '得分',
    `feedback_content` varchar(300) DEFAULT NULL COMMENT '反馈内容',
    `feedback_at` datetime(3) DEFAULT NULL COMMENT '反馈时间',
    `feedback_by` char(36) DEFAULT NULL COMMENT '反馈',
    `synced` BOOLEAN NOT NULL DEFAULT '0' COMMENT '工单是否已经同步到第三方，例如华',
    `node_id` CHAR(36) DEFAULT NULL COMMENT '工单所属项目的运营流程节点 ID，仅当来源是项目时有',
    `stage_id` CHAR(36) DEFAULT NULL COMMENT '工单所属项目的运营流程阶段 ID，仅当来源是项目时有',
    PRIMARY KEY (`id`),
    KEY `idx_work_order_id` (`work_order_id`)
) ENGINE=INNODB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='工单';

-- 工单任务
CREATE TABLE IF NOT EXISTS `work_order_tasks` (
    `id`            CHAR(36)        NOT NULL COMMENT 'ID',
    `name`          VARCHAR(128)    NOT NULL COMMENT '任务名称',
    `created_at`    DATETIME(3)     NOT NULL COMMENT '创建时间',
    `updated_at`    DATETIME(3)     NOT NULL COMMENT '更新时间',

    `third_party_id`    CHAR(36)        NOT NULL COMMENT '第三方平台的 ID',
    `work_order_id`     CHAR(36)        NOT NULL COMMENT '所属工单ID',
    `status`            VARCHAR(64)     NOT NULL COMMENT '工单任务状',
    `reason`            VARCHAR(512)    NOT NULL COMMENT '任务处于当前状态的原因，比如失败原',
    `link`              VARCHAR(512)    NOT NULL COMMENT '任务失败处理 URL',
    PRIMARY KEY (`id`),
    INDEX `idx_work_order_id` (`work_order_id`)
) ENGINE=INNODB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='工单任务';

-- 归集工单的任务详'
CREATE TABLE IF NOT EXISTS `work_order_data_aggregation_details` (
    `id`         CHAR(36)        NOT NULL COMMENT '工单任务 ID',

    `department_id`         CHAR(36)        NOT NULL    COMMENT '部门 ID',
    `source_datasource_id`  VARCHAR(256)    NOT NULL    COMMENT '源表所属第三方数据源ID',
    `source_table_name`     VARCHAR(256)    NOT NULL    COMMENT '源表名称',
    `target_datasource_id`  VARCHAR(256)    NOT NULL    COMMENT '目标表所属第三方数据源ID',
    `target_table_name`     VARCHAR(256)    NOT NULL    COMMENT '目标表名',
    `count`                 INTEGER         NOT NULL    COMMENT '归集数量，代表这个任务中归集的数据的数量',

    PRIMARY KEY (`id`, `source_datasource_id`, `source_table_name`)
) ENGINE=INNODB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='归集工单的任务详';

-- 融合工单的任务详'
CREATE TABLE IF NOT EXISTS `work_order_data_fusion_details` (
    `id`         CHAR(36)        NOT NULL COMMENT '工单任务 ID',

    `datasource_id`     CHAR(36)        COMMENT '数据源ID',
    `datasource_name`   VARCHAR (128)   COMMENT '数据源名',
    `data_table`        VARCHAR (128)   COMMENT '数据表名',

    PRIMARY KEY (`id`)
    ) ENGINE=INNODB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='融合工单的任务详';

-- 质量稽核工单的任务详'
CREATE TABLE IF NOT EXISTS `work_order_data_quality_audit_details` (
    `id`         CHAR(36)        NOT NULL COMMENT '工单任务 ID',

    `work_order_id`     CHAR(36)        NOT NULL COMMENT '工单任务 ID',
    `datasource_id`     CHAR(36)        COMMENT '数据源ID',
    `datasource_name`   VARCHAR (128)   COMMENT '数据源名',
    `data_table`        VARCHAR (128)   COMMENT '数据表名',
    `detection_scheme`  VARCHAR (128)   COMMENT '检测方',
    `status`            VARCHAR(64)     NOT NULL COMMENT '任务状',
    `reason`            VARCHAR(512)    NOT NULL COMMENT '任务处于当前状态的原因，比如失败原',
    `link`              VARCHAR(512)    NOT NULL COMMENT '任务失败处理 URL',
    PRIMARY KEY (`id`)
    ) ENGINE=INNODB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='质量稽核工单的任务详';

-- 标准化工单关联的逻辑视图的字'
CREATE TABLE IF NOT EXISTS `work_order_form_view_fields` (
   `work_order_id` CHAR(36) NOT NULL COMMENT '工单 ID',
   `form_view_id` CHAR(36) NOT NULL COMMENT '逻辑视图 ID',  -- 如果允许跨库查询，不需要这个字'
   `form_view_field_id` CHAR(36) NOT NULL COMMENT '字段 ID',
   `standard_required` BOOLEAN NOT NULL COMMENT '是否需要标准化',
   `data_element_id` BIGINT NOT NULL COMMENT '标准化后，字段关联的数据源ID',
   PRIMARY KEY (`work_order_id`, `form_view_id`, `form_view_field_id`)
) ENGINE=INNODB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='标准化工单关联的逻辑视图的字';

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
    `creator_id`        CHAR(36)        NOT NULL                    COMMENT '创建ID',
    `requested_at`      DATETIME(3)                 DEFAULT NULL    COMMENT '申请时间',
    `requester_id`        CHAR(36)        NOT NULL                  COMMENT '申请ID',
    `deleted_at`        BIGINT(20)      NOT NULL                    COMMENT '删除时间',
    PRIMARY KEY (`id`, `code`),
    INDEX `list` (`name`, `apply_id`, `department_id`, `status`, `requested_at`, `deleted_at`)
) ENGINE=INNODB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='数据归集清单';

-- 数据归集资源
CREATE TABLE IF NOT EXISTS `data_aggregation_resources` (
    `id`                            CHAR(36)      NOT NULL    COMMENT 'id',
    `data_view_id`                  CHAR(36)      NOT NULL    COMMENT '逻辑视图 ID',
    `data_aggregation_inventory_id` CHAR(36)      NOT NULL    COMMENT '所属数据归集清单的 ID work_order_id 互斥',
    `work_order_id`                 CHAR(36)      NOT NULL    COMMENT '所属数据归集工单的 ID data_aggregation_inventory_id 互斥',
    `collection_method`             INTEGER       NOT NULL    COMMENT '采集方式',
    `sync_frequency`                INTEGER       NOT NULL    COMMENT '同步频率',
    -- Deprecated: 数据归集清单与业务表无关
    `business_form_id`              CHAR(36)      NOT NULL    COMMENT '关联业务表ID',
    `data_table_name`               VARCHAR(128)  DEFAULT  '' COMMENT '业务标准表物化的数据表，由华傲加工平台返',
    `target_datasource_id`          CHAR(36)      NOT NULL    COMMENT '目标数据源ID',
    `updated_at`                    BIGINT(20)    NOT NULL    COMMENT '更新时间',
    `deleted_at`                    BIGINT(20)    NOT NULL    COMMENT '删除时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY (`data_view_id`, `data_aggregation_inventory_id`, `work_order_id`, `deleted_at`)
) ENGINE=INNODB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='数据归集资源';



CREATE TABLE IF NOT EXISTS `data_research_report` (
   `data_research_report_id` bigint(20)  NOT NULL COMMENT '雪花id',
   `id` char(36) NOT NULL COMMENT '对象id，uuid',
   `name` varchar(128) NOT NULL COMMENT '名称',
   `work_order_id` char(36) NOT NULL COMMENT '关联数据归集计划ID',
   `research_purpose` varchar(300) NOT NULL DEFAULT '' COMMENT '调研目的',
   `research_object` varchar(300) NOT NULL DEFAULT '' COMMENT '调研对象',
   `research_method` varchar(300) NOT NULL DEFAULT '' COMMENT '调研方法',
   `research_content` text NULL COMMENT '调研内容',
   `research_conclusion` varchar(800) NOT NULL DEFAULT '' COMMENT '调研结论',
   `remark` varchar(800) NOT NULL DEFAULT '' COMMENT '申报意见',
   `audit_status` tinyint(2) DEFAULT NULL COMMENT '审核状：1审核中  2: 撤回  3: 拒绝 4: 通过 5:变更审核中6:变更审核拒绝',
   `audit_id` bigint(20) DEFAULT NULL COMMENT '审核记录ID',
   `audit_proc_inst_id` VARCHAR(64) DEFAULT NULL COMMENT '审核实例ID',
   `audit_result` VARCHAR(64) DEFAULT NULL COMMENT '审核结果 agree 通过 reject 拒绝 undone 撤销',
   `reject_reason` VARCHAR(300) DEFAULT NULL COMMENT '驳回原因',
   `cancel_reason` VARCHAR(300) DEFAULT NULL COMMENT '需求撤销原因',
   `declaration_status` tinyint(2) NOT NULL COMMENT '申报状态:1待申报 2：已申报',
   `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) COMMENT '创建时间',
   `created_by_uid` char(36) NOT NULL COMMENT '创建用户ID',
   `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3)  COMMENT '更新时间',
   `updated_by_uid` char(36) NOT NULL DEFAULT '' COMMENT '更新用户ID',
   `deleted_at` bigint(20) DEFAULT 0 COMMENT '删除时间(逻辑删除)',
  PRIMARY KEY (`data_research_report_id`),
  UNIQUE KEY `data_research_report_name` (`name`,`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='数据调研报告';

CREATE TABLE IF NOT EXISTS `data_research_report_change_audit` (
   `data_research_report_id` bigint(20)  NOT NULL COMMENT '雪花id',
   `id` char(36) NOT NULL COMMENT '对象id，uuid',
   `work_order_id` char(36) NOT NULL COMMENT '关联数据归集计划ID',
   `research_purpose` varchar(300) NOT NULL DEFAULT '' COMMENT '调研目的',
   `research_object` varchar(300) NOT NULL DEFAULT '' COMMENT '调研对象',
   `research_method` varchar(300) NOT NULL DEFAULT '' COMMENT '调研方法',
   `research_content` text NULL COMMENT '调研内容',
   `research_conclusion` varchar(800) NOT NULL DEFAULT '' COMMENT '调研结论',
   `remark` varchar(800) NOT NULL DEFAULT '' COMMENT '申报意见',
   `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) COMMENT '创建时间',
   `created_by_uid` char(36) NOT NULL COMMENT '创建用户ID',
   `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3)  COMMENT '更新时间',
   `updated_by_uid` char(36) NOT NULL DEFAULT '' COMMENT '更新用户ID',
   `deleted_at` bigint(20) DEFAULT 0 COMMENT '删除时间(逻辑删除)',
  PRIMARY KEY (`data_research_report_id`),
  KEY `idx_deleted_at` (`deleted_at`),
  KEY `idx_id` (`id`,`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='数据调研报告变更审核内容';

CREATE TABLE IF NOT EXISTS `points_rule_config` (
   `point_rule_config_id` bigint(20)  NOT NULL COMMENT '雪花id',
   `id` char(36) NOT NULL COMMENT '对象id，uuid',
   `code` varchar(128) NOT NULL COMMENT '名称',
   `rule_type` varchar(36) NOT NULL COMMENT '策略类型',
   `config` text NULL COMMENT '积分规则配置',
   `period` text NULL COMMENT '积分规则配置有效',
   `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) COMMENT '创建时间',
   `created_by_uid` char(36) NOT NULL COMMENT '创建用户ID',
   `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3)  COMMENT '更新时间',
   `updated_by_uid` char(36) NOT NULL COMMENT '更新用户ID',
   `deleted_at` bigint(20) DEFAULT 0 COMMENT '删除时间(逻辑删除)',
  PRIMARY KEY (`point_rule_config_id`),
  UNIQUE KEY `point_rule_config_code` (`code`,`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='积分规则配置';

CREATE TABLE IF NOT EXISTS `points_event` (
   `point_event_id` bigint(20)  NOT NULL COMMENT '雪花id',
   `id` char(36) NOT NULL COMMENT '对象id，uuid',
   `code` varchar(128) NOT NULL COMMENT '名称',
   `business_module` varchar(128) NOT NULL COMMENT '所属业务模',
   `points_object_type` varchar(10) NOT NULL COMMENT '积分对象类型',
   `points_object_id` char(36) NOT NULL COMMENT '积分对象ID',
   `points_object_name` varchar(1024) NOT NULL COMMENT '积分对象名称',
   `points_value` tinyint(3) NOT NULL COMMENT '积分',
   `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) COMMENT '创建时间',
  PRIMARY KEY (`point_event_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='积分规则配置';

CREATE TABLE IF NOT EXISTS `points_event_top_department` (
   `point_event_top_department_id` bigint(20)  NOT NULL COMMENT '雪花id',
   `id` char(36) NOT NULL COMMENT '对象id，uuid',
   `department_id` char(36) NOT NULL COMMENT '部门ID',
   `department_name` varchar(1024) NOT NULL COMMENT '部门名称',
   `department_path` varchar(1024) NOT NULL COMMENT '部门路径',
   `points_event_id` bigint(20)  NOT NULL COMMENT '积分事件ID',
   `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) COMMENT '创建时间',
  PRIMARY KEY (`point_event_top_department_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='积分事件和部门关联表';



CREATE TABLE IF NOT EXISTS `t_work_order_extend` (
    `id` BIGINT(20) NOT NULL COMMENT '雪花ID',
    `work_order_id` CHAR(36) NOT NULL COMMENT '工单ID',
    `extend_key` varchar(255)  NOT NULL COMMENT '扩展字段',
    `extend_value` varchar(255)  NOT NULL COMMENT '扩展内容',
    `fusion_type` tinyint(3)  NOT NULL  DEFAULT 1  COMMENT '融合类型:1常规方式，2场景分析方式',
    `exec_sql` longtext   NULL COMMENT '执行sql',
    `scene_sql` longtext   NULL COMMENT '画布sql',
    `scene_analysis_id`  varchar(36)  NULL COMMENT '场景分析画布id',
    `run_cron_strategy`  varchar(36)  NULL COMMENT '运行执行策略',
    `datasource_id`  varchar(36)  NULL COMMENT '目标数据源id',
    `run_start_at`  datetime(3) DEFAULT NULL COMMENT '运行开始时',
    `run_end_at` datetime(3) DEFAULT NULL COMMENT '运行结束时间',
    `deleted_at` DATETIME(3) DEFAULT NULL COMMENT '删除时间',
    PRIMARY KEY (`id`),
    KEY `idx_extend_work_order_id` (`work_order_id`)
) ENGINE=INNODB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='工单扩展';

CREATE TABLE IF NOT EXISTS  `t_fusion_field` (
    `id` BIGINT(20) NOT NULL COMMENT '列雪花id',
    `c_name` varchar(255)  NOT NULL COMMENT '列中文名',
    `e_name` varchar(255)  NOT NULL COMMENT '列英文名',
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
    `catalog_id` varchar(36)  DEFAULT NULL COMMENT '数据资源目录ID',
    `info_item_id` varchar(36) DEFAULT NULL COMMENT '信息项ID',
    `index` int NOT NULL COMMENT '字段顺序',
    `created_by_uid` CHAR(36) NOT NULL COMMENT '创建',
    `created_at` DATETIME(3) NOT NULL COMMENT '创建时间',
    `updated_by_uid` CHAR(36) DEFAULT NULL COMMENT '更新',
    `updated_at` DATETIME(3) DEFAULT NULL COMMENT '更新时间',
    `deleted_by_uid` CHAR(36) DEFAULT NULL COMMENT '删除',
    `deleted_at` DATETIME(3) DEFAULT NULL COMMENT '删除时间',
    PRIMARY KEY (`id`),
    KEY `idx_t_fusion_field_work_order_id` (`work_order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='融合字段';
CREATE TABLE IF NOT EXISTS `data_quality_improvement` (
    `id` char(36) NOT NULL COMMENT '整改项id',
    `work_order_id` char(36) NOT NULL COMMENT '工单id',
    `field_id` char(36) NOT NULL COMMENT '字段id',
    `rule_id` char(36) NOT NULL COMMENT '规则id',
    `rule_name` varchar(255) NOT NULL COMMENT '规则名称',
    `dimension` varchar(255) NOT NULL COMMENT '规则维度',
    `inspected_count` int(11) NOT NULL COMMENT '检测数据量',
    `issue_count` int(11) NOT NULL COMMENT '问题数据',
    `score` float(10,4) NOT NULL COMMENT '评分',
    `deleted_at` bigint(20) NOT NULL COMMENT '删除时间',
    PRIMARY KEY (`id`),
    KEY `idx_work_order_id` (`work_order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='数据质量工单整改内容';


CREATE TABLE IF NOT EXISTS  `t_quality_audit_form_view_relation` (
    `id` BIGINT(20) NOT NULL COMMENT '雪花id',
    `work_order_id` CHAR(36) NOT NULL COMMENT '工单ID',
    `form_view_id` CHAR(36) NOT NULL COMMENT '逻辑视图ID',
    `datasource_id` char(36) DEFAULT NULL COMMENT '数据源ID',
    `status` tinyint(4) DEFAULT NULL COMMENT '视图探查状',
    `created_by_uid` CHAR(36) NOT NULL COMMENT '创建',
    `created_at` DATETIME(3) NOT NULL COMMENT '创建时间',
    `updated_by_uid` CHAR(36) DEFAULT NULL COMMENT '更新',
    `updated_at` DATETIME(3) DEFAULT NULL COMMENT '更新时间',
    `deleted_by_uid` CHAR(36) DEFAULT NULL COMMENT '删除',
    `deleted_at` DATETIME(3) DEFAULT NULL COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_quality_audit_work_order_id` (`work_order_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='质量稽核工单和逻辑视图关联';


CREATE TABLE IF NOT EXISTS `tc_tenant_app` (
     `tenant_application_id` bigint(20) NOT NULL COMMENT '租户申请id, 雪花id',
     `id` varchar(100) DEFAULT NULL COMMENT 'id，uuid',
     `application_name` varchar(150) DEFAULT NULL COMMENT '租户申请名称',
     `application_code` varchar(100) DEFAULT NULL COMMENT '申请单编',
     `tenant_name` varchar(150) DEFAULT NULL COMMENT '租户名称',
     `tenant_admin_id` varchar(150) DEFAULT NULL COMMENT '租户管理',
     `business_unit_id` varchar(100) DEFAULT NULL COMMENT '业务单位id',
     `business_unit_contactor_id` varchar(100) DEFAULT NULL COMMENT '业务单位联系',
     `business_unit_phone` varchar(150) DEFAULT NULL COMMENT '业务单位联系电话',
     `business_unit_email` varchar(150) DEFAULT NULL COMMENT '业务单位邮箱',
     `business_unit_fax` varchar(150) DEFAULT NULL COMMENT '业务单位传真',
     `maintenance_unit_id` varchar(100) DEFAULT NULL COMMENT '维护单位id',
     `maintenance_unit_name` varchar(150) DEFAULT NULL COMMENT '维护单位名称',
     `maintenance_unit_contactor_id` varchar(100) DEFAULT NULL COMMENT '维护单位联系人id',
     `maintenance_unit_contactor_name` varchar(150) DEFAULT NULL COMMENT '维护单位名称',
     `maintenance_unit_phone` varchar(150) DEFAULT NULL COMMENT '维护单位联系电话',
     `maintenance_unit_email` varchar(150) DEFAULT NULL COMMENT '维护单位邮箱',
     `status` tinyint(4) DEFAULT NULL COMMENT '状态，1 未申报， 2 待激活， 3 已激活， 4 已禁',
     `audit_id` bigint(20) DEFAULT NULL COMMENT '审核记录ID',
     `audit_proc_inst_id` varchar(64) DEFAULT NULL COMMENT '审核实例ID',
     `audit_result` varchar(64) DEFAULT NULL COMMENT '审核结果 agree 通过 reject 拒绝 undone 撤销',
     `reject_reason` varchar(300) DEFAULT NULL COMMENT '驳回原因',
     `cancel_reason` varchar(300) DEFAULT NULL COMMENT '需求撤销原因',
     `declaration_status` tinyint(2) DEFAULT NULL COMMENT '申报状态:1待申报 2：已申报',
     `audit_status` tinyint(4) DEFAULT NULL COMMENT '审核状',
     `created_by_uid` varchar(36) DEFAULT NULL COMMENT '创建者id',
     `created_at` datetime DEFAULT NULL COMMENT '创建时间',
     `updated_by_uid` varchar(100) DEFAULT NULL COMMENT '更新者id',
     `updated_at` datetime DEFAULT NULL COMMENT '更新时间',
     `deleted_at` int(11) DEFAULT 0 COMMENT '删除时间',
     PRIMARY KEY (`tenant_application_id`),
     KEY `tc_tenant_app_id_IDX` (`id`) USING BTREE,
     KEY `tc_tenant_app_tenant_application_id_IDX` (`tenant_application_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS `tc_tenant_app_db_account` (
    `database_account_id` bigint(20) NOT NULL COMMENT '数据库账号id',
    `id` varchar(100) DEFAULT NULL COMMENT 'id，uuid',
    `tenant_application_id` varchar(100) DEFAULT NULL COMMENT '租户申请id',
    `database_type` varchar(100) DEFAULT NULL COMMENT '数据库类',
    `database_name` varchar(150) DEFAULT NULL COMMENT '数据库名',
    `tenant_account` varchar(150) DEFAULT NULL COMMENT '租户账号',
    `tenant_passwd` varchar(150) DEFAULT NULL COMMENT '租户密码',
    `project_name` varchar(150) DEFAULT NULL COMMENT '项目名称',
    `actual_allocated_resources` text NULL COMMENT '实际分配资源',
    `user_authentication_hadoop` text NULL COMMENT '用户认证信息 hadoop',
    `user_authentication_hbase` text NULL COMMENT '用户授权信息 hbase',
    `user_authentication_hive` text NULL COMMENT '用户授权信息 hive',
    `created_by_uid` varchar(100) DEFAULT NULL COMMENT '创建',
    `created_at` datetime DEFAULT NULL COMMENT '创建时间',
    `updated_by_uid` varchar(100) DEFAULT NULL COMMENT '更新',
    `updated_at` varchar(100) DEFAULT NULL COMMENT '更新时间',
    `deleted_at` int(11) DEFAULT NULL COMMENT '删除时间',
    PRIMARY KEY (`database_account_id`),
    KEY `tc_tenant_app_db_account_id_IDX` (`id`) USING BTREE,
    KEY `tc_tenant_app_db_account_tenant_application_id_IDX` (`tenant_application_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='租户申请数据库账';


CREATE TABLE IF NOT EXISTS `tc_tenant_app_db_data_resource` (
      `data_resource_id` bigint(20) NOT NULL COMMENT '数据资源id, 雪花id',
      `id` varchar(100) DEFAULT NULL COMMENT 'id, uuid',
      `tenant_application_id` varchar(100) DEFAULT NULL COMMENT '申请id',
      `database_account_id` varchar(100) DEFAULT NULL COMMENT '数据库账号id',
      `data_catalog_id` varchar(100) DEFAULT NULL COMMENT '数据目录id',
      `data_catalog_name` varchar(150) DEFAULT NULL COMMENT '数据目录名称',
      `data_catalog_code` varchar(100) DEFAULT NULL COMMENT '数据目录编码',
      `mount_resource_id` varchar(100) DEFAULT NULL COMMENT '挂载资源id',
      `mount_resource_name` varchar(300) DEFAULT NULL COMMENT '挂载资源名字',
      `mount_resource_code` varchar(100) DEFAULT NULL COMMENT '挂载资源编码',
      `data_source_id` varchar(100) DEFAULT NULL COMMENT '数据源id',
      `data_source_name` varchar(150) DEFAULT NULL COMMENT '数据',
      `apply_permission` varchar(100) DEFAULT NULL COMMENT '申请权限 read write',
      `apply_purpose` text NULL COMMENT '申请用',
      `created_by_uid` varchar(100) DEFAULT NULL COMMENT '创建',
      `created_at` datetime DEFAULT NULL COMMENT '创建时间',
      `updated_by_uid` varchar(100) DEFAULT NULL COMMENT '更新',
      `updated_at` datetime DEFAULT NULL COMMENT '更新时间',
      `deleted_at` int(11) DEFAULT NULL COMMENT '删除时间',
    PRIMARY KEY (`data_resource_id`),
    KEY `tc_tenant_app_db_data_resource_id_IDX` (`id`) USING BTREE,
      KEY `tc_tenant_app_db_data_resource_tenant_application_id_IDX` (`tenant_application_id`) USING BTREE,
      UNIQUE KEY `data_resource_id_idx` (`data_resource_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='租户申请数据库账号数据资';



create table if not EXISTS `db_sandbox`(
    `sid`    bigint(20)  NOT NULL COMMENT '主键雪花ID',
    `id`   char(36)  NOT NULL COMMENT '主键雪UUID',
    `department_id` char(36)  NOT NULL COMMENT '所属部门ID',
    `department_name` varchar(128)  default '' COMMENT '所属部门名',
    `status` tinyint(4) NOT NULL default 0 COMMENT '状态，0不可用，1可用',
    `project_id` varchar(128) NOT NULL COMMENT '项目ID',
    -- 沙箱信息
    `total_space` int(11) NULL default 0  COMMENT '总的沙箱空间，单位GB',
    `valid_start` bigint(20)  DEFAULT 0 COMMENT '有效期开始时间，单位毫秒',
    `valid_end`   bigint(20)  DEFAULT 0 COMMENT '有效期结束时间，单位毫秒',
    `applicant_id`  varchar(36) DEFAULT NULL COMMENT '申请人ID',
    `applicant_name` varchar(255) DEFAULT NULL COMMENT '申请人名',
    `applicant_phone` varchar(255) DEFAULT NULL COMMENT '申请人手机号',
    `executed_time`  datetime(3) DEFAULT NULL  COMMENT '第一次实施完成时' ,
    -- 沙箱空间信息
    `datasource_id` char(36) NOT NULL COMMENT '数据源UUID',
    `datasource_name` varchar(128) NOT NULL COMMENT '数据源名',
    `datasource_type_name` varchar(128) NOT NULL COMMENT '数据库类型名',
    `database_name` varchar(128) NOT NULL COMMENT '数据库名',
    `username` varchar(128) NOT NULL COMMENT '用户',
    `password` varchar(1024) NOT NULL COMMENT '密码',
    `recent_data_set`  varchar(128) default '' COMMENT '用户',
    -- 基础字段
    `updated_at` datetime NOT NULL DEFAULT current_timestamp()  COMMENT '更新时间',
    `updater_uid` varchar(36) DEFAULT NULL COMMENT '更新用户ID',
    `deleted_at`  bigint(20)   DEFAULT NULL COMMENT '删除时间(逻辑删除)' ,
    PRIMARY KEY (`id`) USING BTREE
    )ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='数据沙箱空间';

CREATE TABLE IF NOT EXISTS `db_sandbox_apply` (
    `sid`  bigint(20)  NOT NULL COMMENT '主键雪花ID',
    `id` char(36) NOT NULL COMMENT '主键，uuid',
    `sandbox_id`  varchar(36) NOT NULL COMMENT '沙箱ID',
    -- 申请信息
    `applicant_id`  varchar(36) DEFAULT NULL COMMENT '申请人ID',
    `applicant_name` varchar(255) DEFAULT NULL COMMENT '申请人名',
    `applicant_phone` varchar(255) DEFAULT NULL COMMENT '申请人手机号',
    `request_space` int(11) NULL default 0  COMMENT '申请容量，单位GB',
    `status`  tinyint(4) NOT NULL default 0 COMMENT '状态1申请中，2待实施，3已完成',
    `operation` tinyint(4) NOT NULL  default 0 COMMENT '操作,1创建申请2扩容申请',
    -- 审核字段
    `audit_state` tinyint(4) NOT NULL default 0 COMMENT '审核状1审核中，2审核通过3未通过',
    `audit_id`    varchar(64) DEFAULT '' COMMENT '审核流程ID',
    `audit_advice` text NULL COMMENT '审核意见，仅驳回时有',
    `proc_def_key` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '审核流程key',
    -- 操作结果
    `result` tinyint(4) NOT NULL default 0 COMMENT '申请结果,1通过2拒绝3撤回',
    `reason` varchar(1024) DEFAULT NULL COMMENT '申请原因',
    `apply_time` datetime(3) NOT NULL DEFAULT current_timestamp(3) COMMENT '操作时间',
    -- 基础字段
    `updated_at` datetime NOT NULL DEFAULT current_timestamp()  COMMENT '更新时间',
    `updater_uid` varchar(36) DEFAULT NULL COMMENT '更新用户ID',
    `deleted_at`  bigint(20)   DEFAULT NULL COMMENT '删除时间(逻辑删除)' ,
    PRIMARY KEY (`id`) USING BTREE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='沙箱空间申请';

create table if not EXISTS `db_sandbox_execution`(
    `sid` bigint(20)  NOT NULL COMMENT '主键雪花ID',
    `id`  char(36) NOT NULL COMMENT '主键，uuid',
    `sandbox_id`   varchar(36) NOT NULL COMMENT '沙箱ID',
    `apply_id`   varchar(36)  NOT NULL COMMENT '申请ID',
    `description` varchar(1024) NOT NULL COMMENT '实施说明',
    -- 实施信息
    `execute_type`  tinyint(4) NOT NULL default 0 COMMENT '实施方式,1线下0线上',
    `execute_status`  tinyint(4) NOT NULL default 0 COMMENT '实施阶段,1待实施，2实施中，3已实',
    `executor_id`  varchar(36) DEFAULT NULL COMMENT '实施人ID',
    `executor_name` varchar(255) DEFAULT NULL COMMENT '实施人名',
    `executor_phone` varchar(255) DEFAULT NULL COMMENT '实施人手机号',
    `executed_time`  datetime(3) DEFAULT NULL  COMMENT '实施完成时间' ,
    -- 基础字段
    `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) COMMENT '创建时间' ,
    `creator_uid` varchar(36) DEFAULT NULL COMMENT '创建用户ID',
    `updated_at` datetime NOT NULL DEFAULT current_timestamp()  COMMENT '更新时间',
    `updater_uid` varchar(36) DEFAULT NULL COMMENT '更新用户ID',
    `deleted_at`  bigint(20)   DEFAULT NULL COMMENT '删除时间(逻辑删除)' ,
    PRIMARY KEY (`id`) USING BTREE
    )ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='数据沙箱实施';

create table if not EXISTS `db_sandbox_log`(
    `sid` bigint(20)  NOT NULL COMMENT '主键雪花ID',
    `id`  char(36) NOT NULL COMMENT '主键，uuid',
    `apply_id`   varchar(36) NOT NULL COMMENT '申请ID',
    `execute_step`  tinyint(4) NOT NULL default 0 COMMENT '操作步骤,1申请中2扩容中3审核中4实施中5完成',
    `executor_id`  varchar(36) DEFAULT NULL COMMENT '实施人ID',
    `executor_name` varchar(255) DEFAULT NULL COMMENT '实施人名',
    `execute_time`  datetime(0) NOT NULL DEFAULT current_timestamp() COMMENT '操作时间' ,
    PRIMARY KEY (`id`) USING BTREE
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='数据实施操作日志';


-- 工单模板'
CREATE TABLE IF NOT EXISTS `work_order_template` (
    `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `ticket_type` varchar(50) NOT NULL COMMENT '工单类型',
    `template_name` varchar(128) NOT NULL COMMENT '工单模板名称',
    `description` varchar(500) DEFAULT NULL COMMENT '工单描述',
    `created_by_uid` varchar(50) NOT NULL COMMENT '创建',
    `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
    `updated_time` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)  COMMENT '更新时间',
    `updated_by_uid` varchar(50) NOT NULL COMMENT '更新',
    `is_builtin` tinyint(2) NOT NULL DEFAULT '0' COMMENT '是否内置模板 0，1',
    `status` tinyint(2) NOT NULL DEFAULT '1' COMMENT '状态0-禁用 1-启用',
    `is_deleted` tinyint(2) NOT NULL DEFAULT '0' COMMENT '是否删除 0-否，1-是',
    PRIMARY KEY (`id`),
    KEY `idx_ticket_type` (`ticket_type`),
    KEY `idx_status` (`status`),
    KEY `idx_is_deleted` (`is_deleted`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='工单模板';

-- 插入默认的四种工单类型模'
INSERT INTO `work_order_template` (`ticket_type`, `template_name`, `description`, `created_by_uid`, `updated_by_uid`, `is_builtin`, `status`, `is_deleted`) VALUES
('data_aggregation', '数据归集工单模板', '', '', '', 1, 1, 0),
('data_standardization', '标准化工单模', '', '', '', 1, 1, 0),
('data_quality_audit', '质量检测工单模', '', '', '', 1, 1, 0),
('data_fusion', '数据融合工单模板', '', '', '', 1, 1, 0);


-- 部门质量概览'
CREATE TABLE IF NOT EXISTS `work_order_quality_overview` (
    `department_id` char(36) NOT NULL COMMENT '所属部门id',
    `table_count`  bigint(20) NOT NULL  COMMENT '应检测表数量',
    `qualitied_table_count`  bigint(20) NOT NULL  COMMENT '已检测表数量',
    `processed_table_count`  bigint(20) NOT NULL  COMMENT '已整改表数量',
    `question_table_count`  bigint(20) NOT NULL  COMMENT '问题表数',
    `start_process_table_count`  bigint(20) NOT NULL  COMMENT '已响应表数量',
    `processing_table_count`  bigint(20) NOT NULL  COMMENT '整改中表数量',
    `not_process_table_count`  bigint(20) NOT NULL  COMMENT '未整改表数量',
    `quality_rate`  char(10) NOT NULL  COMMENT '整改',
    `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) COMMENT '创建时间',
    PRIMARY KEY (`department_id`),
    KEY `idx_department_id` (`department_id`)
    ) ENGINE=INNODB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='部门质量概览';



-- 工单模板管理'
CREATE TABLE IF NOT EXISTS `t_work_order_manage_template` (
    `id` bigint(20) NOT NULL COMMENT '主键ID，雪花算',
    `template_name` varchar(128) NOT NULL COMMENT '工单模板名称',
    `template_type` varchar(50) NOT NULL COMMENT '工单模板类型',
    `description` varchar(500) DEFAULT NULL COMMENT '模板描述',
    `content` json DEFAULT NULL COMMENT '模板内容（JSON格式',
    `version` int NOT NULL DEFAULT '1' COMMENT '当前版本',
    `is_active` tinyint(2) NOT NULL DEFAULT '1' COMMENT '是否启用0-禁用1-启用',
    `reference_count` bigint(20) NOT NULL DEFAULT '0' COMMENT '引用计数',
    `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
    `created_by` varchar(50) NOT NULL COMMENT '创建人UID',
    `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)  COMMENT '更新时间',
    `updated_by` varchar(50) NOT NULL COMMENT '更新人UID',
    `is_deleted` tinyint(2) NOT NULL DEFAULT '0' COMMENT '是否删除0-否，1-是',
    PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='工单模板管理';

-- 工单模板历史版本'
CREATE TABLE IF NOT EXISTS `t_work_order_manage_template_version` (
    `id` bigint(20) NOT NULL COMMENT '主键ID，雪花算',
    `template_id` bigint(20) NOT NULL COMMENT '模板ID',
    `version` int NOT NULL COMMENT '版本',
    `template_name` varchar(128) NOT NULL COMMENT '工单模板名称',
    `template_type` varchar(50) NOT NULL COMMENT '工单模板类型',
    `description` varchar(500) DEFAULT NULL COMMENT '模板描述',
    `content` json DEFAULT NULL COMMENT '模板内容（JSON格式',
    `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
    `created_by` varchar(50) NOT NULL COMMENT '创建人UID',
    PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='工单模板历史版本';

INSERT INTO `t_work_order_manage_template` (`id`, `template_name`, `template_type`, `description`, `content`, `version`, `is_active`, `reference_count`, `created_by`, `updated_by`, `is_deleted`) VALUES
    (1000000000000000001, '调研工单模板', 'research', '用于调研任务的工单模板', '{"research_unit": "调研单位", "research_content": "调研内容", "research_purpose": "调研目的", "research_time": "2025-12-12"}', 1, 1, 0, '', '', 0);

INSERT INTO `t_work_order_manage_template_version` (`id`, `template_id`, `version`, `template_name`, `template_type`, `description`, `content`, `created_by`) VALUES
    (1000000000000000101, 1000000000000000001, 1, '调研工单模板', 'research', '用于调研任务的工单模板', '{"research_unit": "调研单位", "research_content": "调研内容", "research_purpose": "调研目的", "research_time": "2025-12-12"}', '');

-- 前置机工单模板 (frontend-machine)
INSERT INTO `t_work_order_manage_template` (`id`, `template_name`, `template_type`, `description`, `content`, `version`, `is_active`, `reference_count`, `created_by`, `updated_by`, `is_deleted`) VALUES
    (1000000000000000002, '前置机工单模板', 'frontend-machine', '用于前置机申请的工单模板', '{"apply_department": "申请部门", "frontend_machine_address": "前置机地址", "apply_requirement": "申请要求"}', 1, 1, 0, '', '', 0);

INSERT INTO `t_work_order_manage_template_version` (`id`, `template_id`, `version`, `template_name`, `template_type`, `description`, `content`, `created_by`) VALUES
    (1000000000000000102, 1000000000000000002, 1, '前置机工单模板', 'frontend-machine', '用于前置机申请的工单模板', '{"apply_department": "申请部门", "frontend_machine_address": "前置机地址", "apply_requirement": "申请要求"}', '');

-- 数据归集工单模板 (data-collection)
INSERT INTO `t_work_order_manage_template` (`id`, `template_name`, `template_type`, `description`, `content`, `version`, `is_active`, `reference_count`, `created_by`, `updated_by`, `is_deleted`) VALUES
    (1000000000000000003, '数据归集工单模板', 'data-collection', '用于数据归集任务的工单模板', '{"data_source": "数据来源", "collection_time": "2025-12-10,2025-12-12", "department": "所属部门", "description": "工单描述", "sync_frequency": "数据同步频率", "collection_method": "采集方式"}', 1, 1, 0, '', '', 0);

INSERT INTO `t_work_order_manage_template_version` (`id`, `template_id`, `version`, `template_name`, `template_type`, `description`, `content`, `created_by`) VALUES
    (1000000000000000103, 1000000000000000003, 1, '数据归集工单模板', 'data-collection', '用于数据归集任务的工单模板', '{"data_source": "数据来源", "collection_time": "2025-12-10,2025-12-12", "department": "所属部门", "description": "工单描述", "sync_frequency": "数据同步频率", "collection_method": "采集方式"}', '');

-- 数据标准化工单模板 (data-standardization)
INSERT INTO `t_work_order_manage_template` (`id`, `template_name`, `template_type`, `description`, `content`, `version`, `is_active`, `reference_count`, `created_by`, `updated_by`, `is_deleted`) VALUES
    (1000000000000000004, '数据标准化工单模板', 'data-standardization', '用于数据标准化任务的工单模板', '{"data_source": "数据源", "data_table": "数据表", "table_fields": ["字段1", "字段2"], "standard_data_elements": "标准数据元", "business_table_fields": "业务表字段", "business_table_standard": "业务表标准", "remark": "备注信息", "description": "工单描述"}', 1, 1, 0, '', '', 0);

INSERT INTO `t_work_order_manage_template_version` (`id`, `template_id`, `version`, `template_name`, `template_type`, `description`, `content`, `created_by`) VALUES
    (1000000000000000104, 1000000000000000004, 1, '数据标准化工单模板', 'data-standardization', '用于数据标准化任务的工单模板', '{"data_source": "数据源", "data_table": "数据表", "table_fields": ["字段1", "字段2"], "standard_data_elements": "标准数据元", "business_table_fields": "业务表字段", "business_table_standard": "业务表标准", "remark": "备注信息", "description": "工单描述"}', '');

-- 数据质量稽核工单模板 (data-quality-audit)
INSERT INTO `t_work_order_manage_template` (`id`, `template_name`, `template_type`, `description`, `content`, `version`, `is_active`, `reference_count`, `created_by`, `updated_by`, `is_deleted`) VALUES
    (1000000000000000005, '数据质量稽核工单模板', 'data-quality-audit', '用于数据质量稽核任务的工单模板', '{"data_source": "数据源", "data_table": "数据表", "table_fields": ["字段1", "字段2"], "related_business_rules": "关联业务规则"}', 1, 1, 0, '', '', 0);

INSERT INTO `t_work_order_manage_template_version` (`id`, `template_id`, `version`, `template_name`, `template_type`, `description`, `content`, `created_by`) VALUES
    (1000000000000000105, 1000000000000000005, 1, '数据质量稽核工单模板', 'data-quality-audit', '用于数据质量稽核任务的工单模板', '{"data_source": "数据源", "data_table": "数据表", "table_fields": ["字段1", "字段2"], "related_business_rules": "关联业务规则"}', '');

-- 数据融合加工工单模板 (data-fusion)
INSERT INTO `t_work_order_manage_template` (`id`, `template_name`, `template_type`, `description`, `content`, `version`, `is_active`, `reference_count`, `created_by`, `updated_by`, `is_deleted`) VALUES
    (1000000000000000006, '数据融合加工工单模板', 'data-fusion', '用于数据融合加工任务的工单模板', '{"source_data_source": "源数据源", "source_table": "源表", "target_table": "目标表", "field_fusion_canvas": "字段融合画布", "field_fusion_rules": "字段融合规则"}', 1, 1, 0, '', '', 0);

INSERT INTO `t_work_order_manage_template_version` (`id`, `template_id`, `version`, `template_name`, `template_type`, `description`, `content`, `created_by`) VALUES
    (1000000000000000106, 1000000000000000006, 1, '数据融合加工工单模板', 'data-fusion', '用于数据融合加工任务的工单模板', '{"source_data_source": "源数据源", "source_table": "源表", "target_table": "目标表", "field_fusion_canvas": "字段融合画布", "field_fusion_rules": "字段融合规则"}', '');

-- 数据理解工单模板 (data-understanding)
INSERT INTO `t_work_order_manage_template` (`id`, `template_name`, `template_type`, `description`, `content`, `version`, `is_active`, `reference_count`, `created_by`, `updated_by`, `is_deleted`) VALUES
    (1000000000000000007, '数据理解工单模板', 'data-understanding', '用于数据理解任务的工单模板', '{"work_order_name": "工单名称", "task_name": "任务名称", "task_executor": "任务执行人", "manage_resource_catalog": "管理资源目录"}', 1, 1, 0, '', '', 0);

INSERT INTO `t_work_order_manage_template_version` (`id`, `template_id`, `version`, `template_name`, `template_type`, `description`, `content`, `created_by`) VALUES
    (1000000000000000107, 1000000000000000007, 1, '数据理解工单模板', 'data-understanding', '用于数据理解任务的工单模板', '{"work_order_name": "工单名称", "task_name": "任务名称", "task_executor": "任务执行人", "manage_resource_catalog": "管理资源目录"}', '');

-- 数据资源编目工单模板 (data-resource-catalog)
INSERT INTO `t_work_order_manage_template` (`id`, `template_name`, `template_type`, `description`, `content`, `version`, `is_active`, `reference_count`, `created_by`, `updated_by`, `is_deleted`) VALUES
    (1000000000000000008, '数据资源编目工单模板', 'data-resource-catalog', '用于数据资源编目任务的工单模板', '{"basic_info": "基本信息", "info_items": "信息项", "share_attributes": "共享属性"}', 1, 1, 0, '', '', 0);

INSERT INTO `t_work_order_manage_template_version` (`id`, `template_id`, `version`, `template_name`, `template_type`, `description`, `content`, `created_by`) VALUES
    (1000000000000000108, 1000000000000000008, 1, '数据资源编目工单模板', 'data-resource-catalog', '用于数据资源编目任务的工单模板', '{"basic_info": "基本信息", "info_items": "信息项", "share_attributes": "共享属性"}', '');

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

-- 工单告警
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
