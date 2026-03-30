USE af_data_catalog;

CREATE TABLE IF NOT EXISTS `t_apply_scope` (
     `id` CHAR(36) NOT NULL COMMENT '应用范围uuid',
     `apply_scope_id` BIGINT(20) NOT NULL COMMENT '唯一id，雪花算法',
     `name` VARCHAR(255) DEFAULT NULL COMMENT '应用范围名称',
     `deleted_at` BIGINT(20) DEFAULT 0 COMMENT '逻辑删除时间戳',
     PRIMARY KEY (`apply_scope_id`),
     KEY `idx_apply_scope_id` (`id`)
) COMMENT = '应用范围表';

INSERT INTO `t_apply_scope` (`id`, `apply_scope_id`, `name`, `deleted_at`)
SELECT '0b3326bf-5e2a-8c9e-1c7a-95ef5d7366da', 567701209553568061, '接口服务', 0
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM `t_apply_scope` WHERE `apply_scope_id` = 567701209553568061
);
