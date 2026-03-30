USE af_data_catalog;
-- ALTER TABLE `t_target` MODIFY COLUMN IF EXISTS `target_name` varchar(128) NULL COMMENT '目标名称';
-- ALTER TABLE `t_target_plan` MODIFY COLUMN IF EXISTS `plan_name` varchar(128) NULL COMMENT '计划名称';
-- ALTER TABLE `t_target` MODIFY COLUMN IF EXISTS `employee_id` text NULL COMMENT '协助成员ID,多个用逗号分隔';
-- ALTER TABLE `t_target_plan` MODIFY COLUMN IF EXISTS plan_quantity BIGINT NULL COMMENT '计划数量';

-- ALTER TABLE `t_target_plan` MODIFY COLUMN IF EXISTS `plan_quantity` bigint(20) NULL COMMENT '计划数量';

-- ALTER TABLE `t_target_plan` MODIFY COLUMN IF EXISTS `business_model_quantity` bigint(20) NULL COMMENT '业务模型数量';
-- ALTER TABLE `t_target_plan` MODIFY COLUMN IF EXISTS `business_process_quantity` bigint(20) NULL COMMENT '业务过程数量';
-- ALTER TABLE `t_target_plan` MODIFY COLUMN IF EXISTS `business_table_quantity` bigint(20) NULL COMMENT '业务表数量';

-- ALTER TABLE `t_target_plan` MODIFY COLUMN IF EXISTS `data_collection_quantity` bigint(20) NULL COMMENT '数据采集数量';
-- ALTER TABLE `t_target_plan` MODIFY COLUMN IF EXISTS `data_process_explore_quantity` bigint(20) NULL COMMENT '数据探索数量';
-- ALTER TABLE `t_target_plan` MODIFY COLUMN IF EXISTS `data_process_fusion_quantity` bigint(20) NULL COMMENT '数据融合数量';
-- ALTER TABLE `t_target_plan` MODIFY COLUMN IF EXISTS `data_understanding_quantity` bigint(20) NULL COMMENT '数据理解数量';