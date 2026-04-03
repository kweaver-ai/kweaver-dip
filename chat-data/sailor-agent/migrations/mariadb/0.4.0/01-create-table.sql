USE af_cognitive_assistant;
CREATE TABLE  if not exists `t_memory_chunks` (
    `id`                 varchar(64)  not null  COMMENT '主键id',
    `document_id`        varchar(64)  not null  COMMENT '文档id',
    `user_id`            varchar(128) not null  COMMENT '用户id',
    `datasource_id`      varchar(128) null  COMMENT '数据试图id',
    `text`               text         not null  COMMENT '存摘要文本',
    `keyword_score_hint` float        null  COMMENT '预留关键词评分',
    `embedding_json`     text         null  COMMENT '存向量 JSON',
    `start_line`         int          null  COMMENT '起始行号',
    `end_line`           int          null  COMMENT '结束行号',
    `metadata`           text         null  COMMENT '存元数据 JSON',
    `created_at`         datetime     not null  COMMENT '创建时间',
    PRIMARY KEY (`id`),
    KEY `idx_memory_chunks_datasource_id` (`datasource_id`),
    KEY `idx_memory_chunks_document_id` (`document_id`),
    KEY `idx_memory_chunks_user_id` (`user_id`)
    ) ENGINE=InnoDB  comment '记忆向量分块表';

create table  if not exists `t_memory_documents`(
    `id`             varchar(64)  not null  COMMENT '主键id',
    `user_id`        varchar(128) not null  COMMENT '用户id',
    `source_type`    varchar(32)  not null  COMMENT '区分画像/业务规则等类型',
    `datasource_id`  varchar(128) null  COMMENT '数据试图id',
    `title`          varchar(200) null  COMMENT '标题',
    `text`           text         not null  COMMENT '存摘要文本',
    `location`       varchar(255) null  COMMENT '路径地址',
    `metadata`       text         null  COMMENT '存元数据 JSON',
    `segmented_text` text         null  COMMENT '存分词结果供关键词检索',
    `created_at`     datetime     not null  COMMENT '创建时间',
    `updated_at`     datetime     not null  COMMENT '修改时间',
    PRIMARY KEY (`id`),
    KEY `idx_memory_documents_datasource_id` (`datasource_id`),
    KEY `idx_memory_documents_source_type` (`source_type`),
    KEY `idx_memory_documents_user_id` (`user_id`)
    ) ENGINE=InnoDB  comment '长期记忆文档表';
