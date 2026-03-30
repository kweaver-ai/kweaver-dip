USE af_tasks;

-- 工单模板管理表
CREATE TABLE IF NOT EXISTS `t_work_order_manage_template` (
                                                              `id` bigint(20) NOT NULL COMMENT '主键ID，雪花算法',
                                                              `template_name` varchar(128) NOT NULL COMMENT '工单模板名称',
                                                              `template_type` varchar(50) NOT NULL COMMENT '工单模板类型',
                                                              `description` varchar(500) DEFAULT NULL COMMENT '模板描述',
                                                              `content` json DEFAULT NULL COMMENT '模板内容（JSON格式）',
                                                              `version` int NOT NULL DEFAULT '1' COMMENT '当前版本号',
                                                              `is_active` tinyint(2) NOT NULL DEFAULT '1' COMMENT '是否启用 0-禁用 1-启用',
                                                              `reference_count` bigint(20) NOT NULL DEFAULT '0' COMMENT '引用计数',
                                                              `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
                                                              `created_by` varchar(50) NOT NULL COMMENT '创建人UID',
                                                              `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)  COMMENT '更新时间',
                                                              `updated_by` varchar(50) NOT NULL COMMENT '更新人UID',
                                                              `is_deleted` tinyint(2) NOT NULL DEFAULT '0' COMMENT '是否删除 0-否，1-是',
                                                              PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='工单模板管理表';

-- 工单模板历史版本表
CREATE TABLE IF NOT EXISTS `t_work_order_manage_template_version` (
                                                                      `id` bigint(20) NOT NULL COMMENT '主键ID，雪花算法',
                                                                      `template_id` bigint(20) NOT NULL COMMENT '模板ID',
                                                                      `version` int NOT NULL COMMENT '版本号',
                                                                      `template_name` varchar(128) NOT NULL COMMENT '工单模板名称',
                                                                      `template_type` varchar(50) NOT NULL COMMENT '工单模板类型',
                                                                      `description` varchar(500) DEFAULT NULL COMMENT '模板描述',
                                                                      `content` json DEFAULT NULL COMMENT '模板内容（JSON格式）',
                                                                      `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
                                                                      `created_by` varchar(50) NOT NULL COMMENT '创建人UID',
                                                                      PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='工单模板历史版本表';

-- 插入初始化工单模板数据（8种类型）
-- 调研工单模板 (research)

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
