USE af_main;
-- ALTER TABLE `form_view` MODIFY COLUMN `comment` text NULL COMMENT '逻辑视图注释';
-- ALTER TABLE `form_view_field` MODIFY COLUMN `comment` text NULL COMMENT '列注释';


-- ALTER TABLE `form_view`  ADD COLUMN if not exists authed_users text DEFAULT NULL COMMENT '授权用户';
-- ALTER TABLE `sub_views`  ADD COLUMN if not exists auth_scope_id char(36) DEFAULT NULL COMMENT '行列规则限定范围，可以能是行列规则ID，可能是视图ID';