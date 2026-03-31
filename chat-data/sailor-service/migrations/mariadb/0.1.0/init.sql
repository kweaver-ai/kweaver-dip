USE af_cognitive_assistant;

create table if not exists `t_knowledge_network_info` (
    `m_id` bigint NOT NULL auto_increment comment '主键',
    `f_id` char(36) not null default '' comment '逻辑主键',
    `f_name` varchar(128) not null default '' comment '资源名称',
    `f_version` int not null default 0 comment '资源版本',
    `f_type` tinyint not null default 0 comment '资源类型；1:知识网络；2:数据源；3:图谱；4:图分析服务',
    `f_config_id` varchar(64) not null default '' comment '资源对应的配置ID，配置文件中定义',
    `f_real_id` varchar(36) not null default '' comment '资源在所属平台的ID，eg：知识网络在AD平台上的id',
    `f_created_at` datetime(3) not null default current_timestamp(3) comment '创建时间',
    `f_updated_at` datetime(3) not null default current_timestamp(3) comment '更新时间',
    `f_deleted_at` bigint not null default 0 comment '删除时间戳',
    unique KEY `ux_id_deleted_at`(`f_id`,`f_deleted_at`),
    PRIMARY KEY (`m_id`)
) comment 'ad相关资源信息表';

create table if not exists `t_knowledge_network_info_detail` (
    `m_id` bigint NOT NULL auto_increment comment '主键',
    `f_id` char(36) not null default '' comment '逻辑主键，与t_knowledge_network_info的f_id字段一致',
    `f_detail` text null  comment '详细信息',
    key `ix_id`(`f_id`),
    PRIMARY KEY (`m_id`)
) comment 'ad相关资源信息详情表';

CREATE TABLE if not exists `t_qa_word_history` (
     `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '自增id',
     `user_id` varchar(255) NOT NULL COMMENT '用户id',
     `qword_list` text NOT NULL COMMENT '问答历史词',
     `updated_at` datetime NOT NULL COMMENT '更新时间',
     `created_at` datetime NOT NULL COMMENT '创建时间',
     PRIMARY KEY (`id`),
     UNIQUE KEY `user_idk` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='问答历史记录';

CREATE TABLE if not exists `t_chat_history` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `user_id` varchar(255) DEFAULT '' COMMENT '用户id',
    `session_id` varchar(200) DEFAULT NULL COMMENT '问答中统一id',
    `title` varchar(200) DEFAULT '' COMMENT '问答名字',
    `status` varchar(255) DEFAULT '' COMMENT '对话状态ready chat delete',
    `favorite_id` varchar(255) DEFAULT '' COMMENT '收藏id',
    `favorite_at` datetime DEFAULT NULL COMMENT '收藏时间/更新收藏时间',
    `chat_at` datetime DEFAULT NULL COMMENT '问答时间',
    `created_at` datetime DEFAULT NULL,
    `updated_at` datetime DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `session_id` (`session_id`),
    KEY `user_id` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE if not exists `t_chat_history_detail` (
     `id` int(11) NOT NULL AUTO_INCREMENT,
     `session_id` varchar(255) DEFAULT NULL COMMENT '多轮问答id',
     `qa_id` varchar(255) DEFAULT '' COMMENT '单个答案id',
     `query` varchar(255) DEFAULT '' COMMENT '搜索问题',
     `answer`  MEDIUMTEXT  DEFAULT NULL  COMMENT '答案',
     `status` varchar(255) DEFAULT '' COMMENT '保留字段，单个问答的状态',
     `favorite_id` varchar(255) DEFAULT NULL COMMENT '收藏id',
     `like_status` varchar(255) DEFAULT '' COMMENT '点赞、点踩，like unlike neutrality',
     `resource_required` text DEFAULT NULL COMMENT '问答需要的资源',
     `created_at` datetime DEFAULT NULL,
     `updated_at` datetime DEFAULT NULL,
     PRIMARY KEY (`id`),
     KEY `session_id` (`session_id`),
     KEY `qa_id` (`qa_id`),
     KEY `favorite_id` (`favorite_id`)
) ENGINE=InnoDB AUTO_INCREMENT=279 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE if not exists `t_assistant_config` (
    `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '自增id',
    `user_id` varchar(100) NOT NULL COMMENT '用户id',
    `type` varchar(100) DEFAULT '' COMMENT '配置类型，data-assets 数据服务超市',
    `config` text DEFAULT NULL COMMENT '配置信息',
    `created_at` date DEFAULT NULL COMMENT '创建日期',
    `updated_at` date DEFAULT NULL COMMENT '更新日期',
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
