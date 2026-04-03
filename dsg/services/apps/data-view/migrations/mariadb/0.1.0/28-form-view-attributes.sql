USE af_main;


-- ALTER TABLE `form_view` ADD COLUMN IF NOT EXISTS `update_cycle` INT(11) DEFAULT 0 COMMENT '更新周期' AFTER `mdl_id`;
-- ALTER TABLE `form_view` ADD COLUMN IF NOT EXISTS `shared_type` INT(11) DEFAULT 0 COMMENT '共享属性' AFTER `update_cycle`;
-- ALTER TABLE `form_view` ADD COLUMN IF NOT EXISTS `open_type` INT(11) DEFAULT 0 COMMENT '开放属性' AFTER `shared_type`;


-- ALTER TABLE `form_view_field` ADD COLUMN IF NOT EXISTS `shared_type` INT(11) DEFAULT 0 COMMENT '共享属性' AFTER `grade_type`;
-- ALTER TABLE `form_view_field` ADD COLUMN IF NOT EXISTS `open_type` INT(11) DEFAULT 0 COMMENT '开放属性' AFTER `shared_type`;
-- ALTER TABLE `form_view_field` ADD COLUMN IF NOT EXISTS `sensitive_type` INT(11) DEFAULT 0 COMMENT '敏感属性' AFTER `open_type`;
-- ALTER TABLE `form_view_field` ADD COLUMN IF NOT EXISTS `secret_type` INT(11) DEFAULT 0 COMMENT '涉密属性' AFTER `sensitive_type`;
