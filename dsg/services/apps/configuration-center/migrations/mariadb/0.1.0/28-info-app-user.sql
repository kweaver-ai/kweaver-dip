USE af_configuration;

-- ALTER TABLE `info_system` add COLUMN IF NOT EXISTS `js_department_id` varchar(36)  NULL COMMENT '建设部门ID';
-- ALTER TABLE `info_system` add COLUMN IF NOT EXISTS  `status` tinyint(2) NULL DEFAULT 0 COMMENT '状态1已建、2拟建、3在建';
-- ALTER TABLE `user` add COLUMN IF NOT EXISTS  `sex` varchar(1) NULL  COMMENT '性别：男、女';
-- alter table `object` add COLUMN IF NOT EXISTS `f_priority` int(11) null  comment '部门优先级';