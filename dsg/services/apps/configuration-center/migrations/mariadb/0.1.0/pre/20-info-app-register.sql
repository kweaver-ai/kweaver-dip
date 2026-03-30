USE af_configuration;

-- ALTER TABLE `info_system` modify `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) COMMENT '创建时间',
-- modify `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3)  COMMENT '更新时间';
-- ALTER TABLE `info_system` add COLUMN IF NOT EXISTS `acceptance_at` bigint(20) unsigned NOT NULL DEFAULT 0 COMMENT '验收时间' after department_id;
-- ALTER TABLE `info_system` add COLUMN IF NOT EXISTS  `is_register_gateway` tinyint(4) DEFAULT 0 COMMENT '是否注册到网关（长沙使用），bool：0：不是；1：是' after acceptance_at;
-- ALTER TABLE `info_system` add COLUMN IF NOT EXISTS `system_identifier` char(36) DEFAULT NULL COMMENT '系统标识' after is_register_gateway;
-- ALTER TABLE `info_system` add COLUMN IF NOT EXISTS `register_at` datetime(3) DEFAULT NULL COMMENT '注册时间' after system_identifier;
--
-- ALTER TABLE `app` add COLUMN IF NOT EXISTS `mark` CHAR(10) NOT NULL DEFAULT "common"  COMMENT '应用标识' after report_editing_version_id;
--
-- ALTER TABLE `app_history` add COLUMN IF NOT EXISTS `pass_id` char(128)  DEFAULT NULL COMMENT 'PassID' after application_developer_id;
-- ALTER TABLE `app_history` add COLUMN IF NOT EXISTS `token` char(36)  DEFAULT NULL COMMENT 'token' after pass_id;
-- ALTER TABLE `app_history` add COLUMN IF NOT EXISTS `app_type` char(36)  DEFAULT NULL COMMENT '应用类型' after token;
-- ALTER TABLE `app_history` add COLUMN IF NOT EXISTS `ip_addr` longtext   DEFAULT NULL COMMENT 'json类型字段, 关联ip和port' after app_type;
-- ALTER TABLE `app_history` add COLUMN IF NOT EXISTS `is_register_gateway` tinyint(4) DEFAULT 0 COMMENT '是否注册到网关（长沙使用），bool：0：不是；1：是' after ip_addr;
-- ALTER TABLE `app_history` add COLUMN IF NOT EXISTS `register_at` datetime(3) DEFAULT NULL COMMENT '注册时间' after is_register_gateway;


-- 去除开关字段
-- ALTER TABLE t_platform_zone DROP COLUMN IF EXISTS is_enabled;


INSERT  INTO `configuration`(`key`,`value`,`type`)
SELECT 'platform_zone_display', 'list', '0'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'platform_zone_display' );
