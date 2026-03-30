USE af_data_catalog;

-- ALTER TABLE `t_data_catalog_resource` ADD COLUMN IF NOT EXISTS `request_format` varchar(100) COMMENT '请求报文格式';
-- ALTER TABLE `t_data_catalog_resource` ADD COLUMN IF NOT EXISTS `response_format` varchar(100) COMMENT '响应报文格式';
-- ALTER TABLE `t_data_catalog_resource` ADD COLUMN IF NOT EXISTS `scheduling_plan` tinyint(2) COMMENT '调度计划';
-- ALTER TABLE `t_data_catalog_resource` ADD COLUMN IF NOT EXISTS `interval` tinyint(2) COMMENT '间隔';
-- ALTER TABLE `t_data_catalog_resource` ADD COLUMN IF NOT EXISTS `time` varchar(100) COMMENT '时间';
-- ALTER TABLE `t_data_catalog_column` MODIFY COLUMN IF EXISTS `source_system` varchar(255) NULL COMMENT '来源系统';
-- ALTER TABLE `t_data_catalog_column_history` MODIFY COLUMN IF EXISTS `source_system` varchar(255) NULL COMMENT '来源系统';