USE af_data_catalog;

CREATE TABLE IF NOT EXISTS `t_system_operation_detail` (
     `id` char(36) NOT NULL COMMENT 'id,uuid',
     `catalog_id` bigint(20) NOT NULL COMMENT '数据资源目录id',
     `department_id` char(36) DEFAULT NULL COMMENT '部门id',
     `info_system_id` char(36) DEFAULT NULL COMMENT '信息系统id',
     `form_view_id` char(36) NOT NULL COMMENT '视图id',
     `technical_name` varchar(255) NOT NULL COMMENT '技术名称',
     `business_name` varchar(255) NOT NULL COMMENT '业务名称',
     `acceptance_time` datetime DEFAULT NULL COMMENT '验收时间',
     `first_aggregation_time` datetime DEFAULT NULL COMMENT '首次归集时间',
     `update_cycle` tinyint(4) DEFAULT NULL COMMENT '更新频率 参考数据字典：GXZQ，1不定时 2实时 3每日 4每周 5每月 6每季度 7每半年 8每年 9其他',
     `field_count` int(11) DEFAULT NULL COMMENT '字段数',
     `latest_data_count` int(11) DEFAULT NULL COMMENT '最新数据量',
     `has_quality_issue` tinyint(4) DEFAULT NULL COMMENT '是否存在质量问题',
     `issue_remark` text null COMMENT '问题备注',
     `quality_check` tinyint(4) DEFAULT NULL COMMENT '质量检测',
     `data_update` tinyint(4) DEFAULT NULL COMMENT '数据更新',
     `created_at` datetime(3) NOT NULL COMMENT '创建时间',
     `updated_at` datetime(3) NOT NULL COMMENT '更新时间',
     PRIMARY KEY (`id`),
     KEY `idx_form_view_id` (`form_view_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT = '系统运行明细表';

CREATE TABLE IF NOT EXISTS `t_form_data_count` (
     `id` char(36) NOT NULL COMMENT 'id,uuid',
     `form_view_id` char(36) NOT NULL COMMENT '视图id',
     `data_count` int(11) NOT NULL COMMENT '数据量',
     `created_at` datetime(3) NOT NULL COMMENT '创建时间',
     PRIMARY KEY (`id`),
     KEY `idx_form_view_id` (`form_view_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT = '视图数据量表';

CREATE TABLE IF NOT EXISTS `t_rule_config` (
     `id` char(36) NOT NULL COMMENT 'id,uuid',
     `rule_name` varchar(128) NOT NULL COMMENT '规则名称',
     `update_timeliness_condition` varchar(10) DEFAULT NULL COMMENT '更新及时率条件（≥,<）',
     `update_timeliness_value` float DEFAULT NULL COMMENT '更新及时率值（%）',
     `quality_pass_condition` varchar(10) DEFAULT NULL COMMENT '质量合格率条件（≥,<）',
     `quality_pass_value` float DEFAULT NULL COMMENT '质量合格率值（%）',
     `logical_operator` varchar(3) DEFAULT NULL COMMENT '逻辑运算符（AND/OR）',
     PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT = '给牌规则表';

INSERT IGNORE INTO `t_rule_config` (`id`, `rule_name`, `update_timeliness_condition`, `update_timeliness_value`, `quality_pass_condition`, `quality_pass_value`, `logical_operator`) VALUES('7013eef3-89b1-421d-bf29-09440c89139c','normal_update',NULL,'80',NULL,'0',NULL);
INSERT IGNORE INTO `t_rule_config` (`id`, `rule_name`, `update_timeliness_condition`, `update_timeliness_value`, `quality_pass_condition`, `quality_pass_value`, `logical_operator`) VALUES('7a063091-1690-442c-a555-c96179c01218','yellow_card','≥','50','≥','50','OR');
INSERT IGNORE INTO `t_rule_config` (`id`, `rule_name`, `update_timeliness_condition`, `update_timeliness_value`, `quality_pass_condition`, `quality_pass_value`, `logical_operator`) VALUES('7bff8f7a-447e-4baa-bb8e-2b27076659ff','red_card','<','50','<','50','OR');
INSERT IGNORE INTO `t_rule_config` (`id`, `rule_name`, `update_timeliness_condition`, `update_timeliness_value`, `quality_pass_condition`, `quality_pass_value`, `logical_operator`) VALUES('7f84f2c7-ac2c-446d-845f-7a73d62958ba','green_card','≥','80','≥','80','AND');
