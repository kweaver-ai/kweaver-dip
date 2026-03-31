use af_main;

create table if not EXISTS `t_graph_model`(
    `model_id`   bigint(20) unsigned NOT NULL COMMENT '自增雪花ID',
    `id`  char(36) NOT NULL COMMENT '主键ID，uuid',
    `business_name` varchar(255) DEFAULT NULL  COMMENT '模型名称，业务名称',
    `model_type` int NOT NULL  default 1 COMMENT '模型类型，1元模型，2专题模型，3主题模型',
    `description` varchar(255) DEFAULT NULL COMMENT '描述',
    `subject_id`  char(36)  NOT NULL COMMENT '业务对象ID',
    `technical_name` varchar(255) NOT NULL  COMMENT '模型技术名称',
    `catalog_id`  bigint(20) unsigned NOT NULL COMMENT '目录的主键ID',
    `graph_id`  bigint(20) unsigned NOT NULL COMMENT '图谱ID',
    `data_view_id`  char(36) NOT NULL COMMENT '目录带的元数据视图ID',
    `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) COMMENT '创建时间' ,
    `creator_uid` char(36) DEFAULT NULL COMMENT '创建用户ID',
    `updated_at` datetime NOT NULL DEFAULT current_timestamp()  COMMENT '更新时间',
    `updater_uid` char(36) DEFAULT NULL COMMENT '更新用户ID',
    `updater_name` varchar(255) DEFAULT NULL COMMENT '更新用户名称',
    `deleted_at`  bigint(20)   DEFAULT NULL COMMENT '删除时间（逻辑删除）' ,
    `grade_label_id` varchar(36) DEFAULT NULL COMMENT '模型密级ID',
    PRIMARY KEY (`model_id`) USING BTREE,
    KEY   `idx_id` (`id`)
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='图模型';



create table if not EXISTS `t_model_single_node`(
    `id`   bigint(20) unsigned NOT NULL COMMENT '自增雪花ID',
    `model_id` char(36) NOT NULL COMMENT '主题模型/专题模型ID',
    `meta_model_id` char(36) NOT NULL COMMENT '元模型ID',
    `display_field_id` char(36) NOT NULL COMMENT '显示字段ID',
    PRIMARY KEY (`id`) USING BTREE,
    KEY   `idx_model_id` (`model_id`)
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='复合模型的孤立模型的ID';


create table if not EXISTS `t_model_relation`(
    `relation_id`   bigint(20) unsigned NOT NULL COMMENT '自增雪花ID',
    `id`  char(36) NOT NULL COMMENT '主键ID，uuid',
    `business_name` varchar(255) DEFAULT NULL  COMMENT '业务名称',
    `technical_name` varchar(255) NOT NULL  COMMENT '模型技术名称',
    `model_id` char(36) NOT NULL COMMENT '主题模型/专题模型ID',
    `description` varchar(255) DEFAULT NULL COMMENT '描述',
    `start_display_field_id` char(36) NOT NULL COMMENT '起点显示字段ID',
    `end_display_field_id` char(36) NOT NULL COMMENT '终点显示字段ID',
    -- 基础字段
    `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) COMMENT '创建时间' ,
    `updated_at` datetime NOT NULL DEFAULT current_timestamp()  COMMENT '更新时间',
    `updater_uid` char(36) DEFAULT NULL COMMENT '更新用户ID',
    `updater_name` varchar(255) DEFAULT NULL COMMENT '更新用户名称',
    PRIMARY KEY (`relation_id`) USING BTREE,
    KEY   `idx_id` (`id`)
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='复合模型的关系';

create table if not EXISTS `t_model_relation_link`(
    `id`   bigint(20) unsigned NOT NULL COMMENT '主键ID',
    `model_id` char(36) NOT NULL COMMENT '主题模型/专题模型ID',
    `unique_id`  char(36) NOT NULL COMMENT '关系信息几个字段拼接的MD5值',
    `relation_id`  char(36) NOT NULL COMMENT '模型关系ID',
    -- 关系信息
    `start_model_id`  char(36) NOT NULL COMMENT '起点元模型ID',
    `start_field_id`  char(36) NOT NULL COMMENT '起点字段ID',
    `end_model_id`   char(36) NOT NULL COMMENT '终点元模型ID',
    `end_field_id`  char(36) NOT NULL COMMENT '起点字段ID',
    PRIMARY KEY (`id`) USING BTREE,
    KEY   `idx_relation_id` (`relation_id`)
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='复合模型的关系';


create table if not EXISTS `t_model_field`(
    `id`    bigint(20) unsigned NOT NULL COMMENT '主键ID',
    `field_id`  char(36) NOT NULL COMMENT '视图字段ID',
    `model_id`  char(36) NOT NULL COMMENT '元模型ID',
    `technical_name` varchar(255) NOT NULL  COMMENT '列技术名称',
    `business_name` varchar(255) DEFAULT NULL  COMMENT '列业务名称',
    `data_type` varchar(255) NOT NULL COMMENT '数据类型',
    `data_length` int(11) NOT NULL COMMENT '数据长度',
    `data_accuracy` int(11) NOT NULL COMMENT '数据精度',
    `primary_key` int(1) default 0 COMMENT '是否是主键,0不是，1是',
    `is_nullable` varchar(30) NOT NULL COMMENT '是否为空',
    `comment` varchar(128) DEFAULT '' COMMENT '字段注释',
    PRIMARY KEY (`id`) USING BTREE,
    KEY   `idx_model_id` (`model_id`)
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='元模型字段表';


CREATE TABLE  if not EXISTS  `t_model_canvas` (
    `id` char(36) NOT NULL COMMENT '模型id',
    `canvas` mediumtext DEFAULT NULL COMMENT '画布信息',
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='模型画布';