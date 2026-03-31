USE `af_tasks`;

-- ALTER TABLE `work_order` MODIFY COLUMN IF EXISTS `remark` TEXT DEFAULT '' COMMENT '备注';
--
-- ALTER TABLE `t_quality_audit_form_view_relation` ADD COLUMN IF NOT EXISTS  `datasource_id` char(36) DEFAULT NULL COMMENT '数据源ID' after form_view_id;
-- ALTER TABLE `t_quality_audit_form_view_relation` ADD COLUMN IF NOT EXISTS  `status` tinyint(4) DEFAULT NULL COMMENT '视图探查状态' after datasource_id;
