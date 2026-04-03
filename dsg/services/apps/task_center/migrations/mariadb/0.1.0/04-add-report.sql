USE af_tasks;

CREATE TABLE IF NOT EXISTS `data_research_report` (
   `data_research_report_id` bigint(20)  NOT NULL COMMENT '雪花id',
   `id` char(36) NOT NULL COMMENT '对象id，uuid',
   `name` varchar(128) NOT NULL COMMENT '名称',
   `work_order_id` char(36) NOT NULL COMMENT '关联工单ID',
   `research_purpose` varchar(300) NOT NULL DEFAULT '' COMMENT '调研目的',
   `research_object` varchar(300) NOT NULL DEFAULT '' COMMENT '调研对象',
   `research_method` varchar(300) NOT NULL DEFAULT '' COMMENT '调研方法',
   `research_content` text NULL COMMENT '调研内容',
   `research_conclusion` varchar(800) NOT NULL DEFAULT '' COMMENT '调研结论',
   `remark` varchar(800) NOT NULL DEFAULT '' COMMENT '申报意见',
   `audit_status` tinyint(2) DEFAULT NULL COMMENT '审核状态1：审核中  2: 撤回  3: 拒绝 4: 通过 5:变更审核6:变更审核拒绝',
   `audit_id` bigint(20) DEFAULT NULL COMMENT '审核记录ID',
   `audit_proc_inst_id` VARCHAR(64) DEFAULT NULL COMMENT '审核实例ID',
   `audit_result` VARCHAR(64) DEFAULT NULL COMMENT '审核结果 agree 通过 reject 拒绝 undone 撤销',
   `reject_reason` VARCHAR(300) DEFAULT NULL COMMENT '驳回原因',
   `cancel_reason` VARCHAR(300) DEFAULT NULL COMMENT '需求撤销原因',
   `declaration_status` tinyint(2) NOT NULL COMMENT '申报状态1:待申报 2：已申报',
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
   `work_order_id` char(36) NOT NULL COMMENT '关联工单ID',
   `research_purpose` varchar(300) NOT NULL DEFAULT '' COMMENT '调研目的',
   `research_object` varchar(300) NOT NULL DEFAULT '' COMMENT '调研对象',
   `research_method` varchar(300) NOT NULL DEFAULT '' COMMENT '调研方法',
   `research_content` text  COMMENT '调研内容',
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

-- 标准化工单关联的逻辑视图的字段
CREATE TABLE IF NOT EXISTS `work_order_form_view_fields` (
   `work_order_id` CHAR(36) NOT NULL COMMENT '工单 ID',
   `form_view_id` CHAR(36) NOT NULL COMMENT '逻辑视图 ID',  -- 如果允许跨库查询，不需要这个字段
   `form_view_field_id` CHAR(36) NOT NULL COMMENT '字段 ID',
   `standard_required` BOOLEAN NOT NULL COMMENT '是否需要标准化',
   `data_element_id` BIGINT NOT NULL COMMENT '标准化后，字段关联的数据ID',
   PRIMARY KEY (`work_order_id`, `form_view_id`, `form_view_field_id`)
   ) ENGINE=INNODB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='标准化工单关联的逻辑视图的字段';

