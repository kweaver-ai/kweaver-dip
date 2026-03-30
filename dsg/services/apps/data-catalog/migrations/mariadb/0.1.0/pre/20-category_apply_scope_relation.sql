USE af_data_catalog;

CREATE TABLE IF NOT EXISTS `t_category_apply_scope_relation` (
    `id` BIGINT(20) NOT NULL COMMENT '唯一id，雪花算法',
    `category_id` CHAR(36) NOT NULL COMMENT '类目uuid',
    `apply_scope_id` CHAR(36) NOT NULL COMMENT '应用范围uuid',
    `deleted_at` BIGINT(20) DEFAULT 0 COMMENT '逻辑删除时间戳',
    PRIMARY KEY (`id`),
    KEY `idx_category_id` (`category_id`),
    KEY `idx_apply_scope_id` (`apply_scope_id`)
) COMMENT = '类目应用范围关系表';
