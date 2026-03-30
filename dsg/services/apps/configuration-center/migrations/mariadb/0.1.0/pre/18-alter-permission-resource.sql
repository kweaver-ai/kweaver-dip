use af_configuration;

-- ALTER TABLE permission_resources DROP COLUMN IF EXISTS `name`;
-- ALTER TABLE permission_resources DROP COLUMN IF EXISTS `table`;
-- ALTER TABLE permission_resources DROP COLUMN IF EXISTS `field`;
--
--
-- ALTER TABLE permission_resources add COLUMN IF NOT EXISTS  `service_name` varchar(128) NOT NULL COMMENT '服务名称';
-- ALTER TABLE permission_resources add COLUMN IF NOT EXISTS  `path` varchar(255) NOT NULL COMMENT '接口路径';
-- ALTER TABLE permission_resources add COLUMN IF NOT EXISTS  `method` varchar(32) NOT NULL COMMENT '接口方法';
-- ALTER TABLE permission_resources add COLUMN IF NOT EXISTS  `action` varchar(32) NOT NULL COMMENT '动作';
-- ALTER TABLE permission_resources add COLUMN IF NOT EXISTS  `scope` varchar(32) NOT NULL COMMENT  '范围';
-- ALTER TABLE permission_resources add COLUMN IF NOT EXISTS  `permission_id` char(36) NOT NULL default '' COMMENT '权限ID';
-- ALTER TABLE permission_resources add COLUMN IF NOT EXISTS  `permission_name` varchar(128) NOT NULL  default ''  COMMENT '权限名称';
-- ALTER TABLE permission_resources add COLUMN IF NOT EXISTS  `action_id` char(36) NOT NULL  default ''  COMMENT 'path.method.action 的md5值';


CREATE TABLE IF NOT EXISTS  `auth_service_casbin_rule` (
    `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
    `ptype` varchar(100) DEFAULT NULL,
    `v0` varchar(100) DEFAULT NULL,
    `v1` varchar(100) DEFAULT NULL,
    `v2` varchar(100) DEFAULT NULL,
    `v3` varchar(100) DEFAULT NULL,
    `v4` varchar(100) DEFAULT NULL,
    `v5` varchar(100) DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_auth_service_casbin_rule` (`ptype`,`v0`,`v1`,`v2`,`v3`,`v4`,`v5`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;