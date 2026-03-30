use af_configuration;

INSERT  INTO `configuration`(`key`,`value`,`type`)
SELECT 'sample_data_count', '5', '0'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'sample_data_count' );
INSERT  INTO `configuration`(`key`,`value`,`type`)
SELECT 'sample_data_type', 'synthetic', '0'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'sample_data_type' );

-- ALTER TABLE user ADD COLUMN IF NOT EXISTS is_registered int(11) default 1 COMMENT '是否注册：1-未注册，2-已注册';
-- ALTER TABLE user ADD COLUMN IF NOT EXISTS register_at DATETIME(3)  NULL COMMENT '注册时间';
-- ALTER TABLE user ADD COLUMN IF NOT EXISTS third_service_id varchar(36)  NULL COMMENT '第三方服务ID';
--
--
-- ALTER TABLE object ADD COLUMN IF NOT EXISTS is_register int(11) default 1 COMMENT '是否注册：1-未注册，2-已注册';
-- ALTER TABLE object ADD COLUMN IF NOT EXISTS register_at DATETIME(3) NULL COMMENT '注册时间';
-- ALTER TABLE object ADD COLUMN IF NOT EXISTS dept_tag VARCHAR(255) COMMENT '机构标识';

CREATE TABLE IF NOT EXISTS `liyue_registrations` (
    `id` varchar(36) NOT NULL COMMENT '机构注册ID',
    `liyue_id` varchar(38) NOT NULL COMMENT '对应到里约网关注册的机构、系统、应用',
    `user_id` varchar(500) NOT NULL COMMENT '负责人ID,逗号分割，默认第一个为负责人',
    `type` tinyint(4) DEFAULT NULL COMMENT '1 机构注册 2 信息系统注册  3 应用注册',
    PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='机构注册信息表';
