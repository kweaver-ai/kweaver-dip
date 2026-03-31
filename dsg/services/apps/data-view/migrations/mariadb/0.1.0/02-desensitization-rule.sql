use af_main;

CREATE TABLE IF NOT EXISTS `desensitization_rule` (
    `desensitization_rule_id` bigint(20) NOT NULL COMMENT '脱敏规则id, 雪花id',
    `id` varchar(255) NOT NULL DEFAULT '' COMMENT '脱敏规则id, uuid',
    `name` varchar(255) DEFAULT NULL,
    `description` varchar(300) DEFAULT '' COMMENT '描述信息',
    `type` varchar(255) DEFAULT '' COMMENT '算法类型，自定义；内置',
    `inner_type` varchar(255) DEFAULT '' COMMENT '内置类型：身份证、手机、邮箱',
    `algorithm` varchar(255) DEFAULT '' COMMENT '脱敏规则算法内容，正则',
    `method` varchar(255) DEFAULT '' COMMENT '脱敏方式，首尾、中间、全部',
    `middle_bit` int(11) DEFAULT 0 COMMENT '中间脱敏位数',
    `head_bit` int(11) DEFAULT NULL COMMENT '头部位数',
    `tail_bit` int(11) DEFAULT NULL COMMENT '尾部位数',
    `created_at` datetime DEFAULT NULL COMMENT '创建时间',
    `created_by_uid` varchar(255) DEFAULT '' COMMENT '创建者id',
    `updated_at` datetime DEFAULT NULL COMMENT '更新时间',
    `updated_by_uid` varchar(255) DEFAULT '' COMMENT '更新者id',
    `deleted_at` int(11) DEFAULT 0 COMMENT '删除时间',
    PRIMARY KEY (`desensitization_rule_id`),
    KEY `id` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;