USE af_main;

-- ALTER TABLE `form_view` ADD COLUMN if not exists `mdl_id` VARCHAR(36) NULL DEFAULT NULL COMMENT '统一视图id';

-- ALTER TABLE `explore_task` ADD COLUMN if not exists `work_order_id` char(36) DEFAULT NULL COMMENT '工单id';

-- ALTER TABLE `form_view` ADD COLUMN if not exists `info_system_id` char(36) DEFAULT '' COMMENT '关联信息系统ID' AFTER `department_id`;