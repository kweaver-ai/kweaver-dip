USE af_main;

-- ALTER TABLE `grade_rule` ADD COLUMN if not exists `group_id` char(36) DEFAULT '' COMMENT '所属规则组ID' AFTER `type`;

CREATE TABLE if not exists `grade_rule_group` (
    `id` char(36) NOT NULL DEFAULT '' COMMENT '规则组uuid',
    `name` varchar(255) NOT NULL DEFAULT '' COMMENT '规则组名称',
    `description` varchar(1024) DEFAULT '' COMMENT '规则组描述',
    `business_object_id` char(36) NOT NULL COMMENT '分级规则雪花id',
    `created_at` datetime DEFAULT current_timestamp() COMMENT '创建时间',
    `updated_at` datetime NOT NULL DEFAULT current_timestamp()  COMMENT '更新时间',
    `deleted_at` bigint(20) NOT NULL DEFAULT 0 COMMENT '删除时间',
PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='分级规则组表';


create table if not EXISTS `t_model_label_rec_rel`(
    `id` bigint(20) NOT NULL COMMENT '主键ID',
    `name` varchar(50) DEFAULT NULL  COMMENT '标签名称',
    `description` varchar(300) DEFAULT NULL COMMENT '描述',
    `related_model_ids` varchar(500) NOT NULL  COMMENT '关联模型id集合,多个逗号分隔',
    `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) COMMENT '创建时间' ,
    `creator_uid` varchar(36) DEFAULT NULL COMMENT '创建用户ID',
    `created_name` varchar(50) DEFAULT NULL COMMENT '创建用户名称',
    `updated_at` datetime DEFAULT NULL  COMMENT '更新时间',
    `updater_uid` varchar(36) DEFAULT NULL COMMENT '更新用户ID',
    `updater_name` varchar(50) DEFAULT NULL COMMENT '更新用户名称',
    `deleted_at`  bigint(20)   DEFAULT NULL COMMENT '删除时间（逻辑删除）' ,
    PRIMARY KEY (`id`)
    )ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='标签关联模型推荐配置';

UPDATE `recognition_algorithm` SET `name` = '内置模版', `description` = '内置模版不可删除', `algorithm` = '通过识别字段名称和属性名称的相似度' WHERE `recognition_algorithm_id` = 1;