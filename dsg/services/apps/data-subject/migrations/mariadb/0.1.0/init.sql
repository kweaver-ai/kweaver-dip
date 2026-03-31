USE af_main;
CREATE TABLE IF NOT EXISTS `subject_domain` (
    `domain_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '雪花id',
    `id` char(36) NOT NULL COMMENT '对象id，uuid',
    `name` varchar(300) NOT NULL COMMENT '名称',
    `description` varchar(255) NOT NULL DEFAULT '' COMMENT '描述',
    `type` tinyint(4) NOT NULL COMMENT '类型：1：业务对象分组，2：业务对象，3：业务对象，4：业务活动，5：逻辑实体，6：属性',
    `path_id` text NOT NULL COMMENT '路径ID',
    `path` text NOT NULL COMMENT '路径',
    `owners` text DEFAULT NULL COMMENT '拥有者',
    `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) COMMENT '创建时间',
    `created_by_uid` char(36) NOT NULL COMMENT '创建用户ID',
    `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) COMMENT '更新时间',
    `updated_by_uid` char(36) NOT NULL DEFAULT '' COMMENT '更新用户ID',
    `deleted_at` bigint(20) DEFAULT 0 COMMENT '删除时间(逻辑删除)',
    `ref_id` text DEFAULT NULL COMMENT '引用业务对象/业务活动id',
    `unique` tinyint(4) NOT NULL COMMENT '唯一识别属性，枚举：0：不唯一，1：唯一',
    `standard_id` bigint(20) DEFAULT NULL COMMENT '数据标准id',
    `label_id` bigint(20) unsigned DEFAULT NULL COMMENT '标签id',
    `form_field_id` char(36) DEFAULT NULL COMMENT '业务表字段id',
    `form_id` char(36) DEFAULT NULL COMMENT '业务表id',
    PRIMARY KEY (`domain_id`),
    KEY `idx_path_id` (`path_id`(500)),
    KEY `id` (`id`)
    ) ENGINE=InnoDB AUTO_INCREMENT=476956120066307289 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='业务对象定义';

CREATE TABLE IF NOT EXISTS `standard_info` (
    `id` bigint(20) NOT NULL COMMENT '标准ID',
    `name` varchar(255) NOT NULL COMMENT '字段名',
    `name_en` varchar(128) NOT NULL COMMENT '字段英文名',
    `data_type` varchar(128) NOT NULL COMMENT '数据类型',
    `data_length` int(11) DEFAULT NULL COMMENT '数据长度',
    `data_accuracy` tinyint(3) unsigned DEFAULT NULL COMMENT '数据精度',
    `value_range` text NOT NULL COMMENT '值域',
    `formulate_basis` tinyint(4) NOT NULL COMMENT '制定依据',
    `code_table` text NOT NULL COMMENT '码表',
    PRIMARY KEY (`id`) USING BTREE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='标准信息表';

CREATE TABLE  IF NOT EXISTS `form_business_object_relation`  (
    `relation_id` bigint(20) NOT NULL COMMENT '关联雪花id',
    `form_id` char(36) NOT NULL COMMENT '表单id',
    `business_object_id` char(36) NOT NULL COMMENT '业务对象、业务活动id',
    `logical_entity_id` char(36)  NOT NULL COMMENT '逻辑实体ID',
    `attribute_id` char(36)  NOT NULL COMMENT '属性ID',
    `field_id` char(36) NOT NULL COMMENT '字段ID',
    PRIMARY KEY (`relation_id`) USING BTREE,
    KEY `attribute_id` (`attribute_id`)
) ENGINE = InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='业务表和业务对象关系表';


CREATE TABLE IF NOT EXISTS  `cdc_task` (
    `database` varchar(255) NOT NULL COMMENT '同步库名',
    `table` varchar(255) NOT NULL COMMENT '同步表名',
    `columns` varchar(255) NOT NULL COMMENT '同步的列，多个列写在一起，用 , 隔开',
    `topic` varchar(255) NOT NULL COMMENT '数据变动投递消息的topic',
    `group_id` varchar(255) NOT NULL COMMENT '当前记录对应的group id',
    `id` varchar(255) NOT NULL COMMENT '当前同步记录id',
    `updated_at` datetime(3) NOT NULL COMMENT '当前同步记录时间',
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
