-- ============================================================
-- Data Understanding 数据库初始化脚本
-- 数据库: af_main
-- ============================================================
USE af_main;

-- ------------------------------------------------------------
-- 1. Kafka 消息处理记录表
-- 用于记录 AI 服务响应的处理状态，防止重复消费
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS t_kafka_message_log (
    id CHAR(36) NOT NULL COMMENT '主键UUID',
    message_id CHAR(36) NOT NULL COMMENT 'Kafka消息ID',
    form_view_id CHAR(36) NOT NULL COMMENT '关联数据视图UUID',
    processed_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) COMMENT '处理时间',
    status TINYINT DEFAULT 1 COMMENT '状态：1-处理成功，2-处理失败',
    error_msg TEXT COMMENT '错误信息',
    PRIMARY KEY (id),
    UNIQUE KEY uk_message_id (message_id),
    KEY idx_form_view_id (form_view_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Kafka消息处理记录表';

-- ------------------------------------------------------------
-- 2. 业务对象表
-- 用于存储已发布的业务对象
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS t_business_object (
    id             CHAR(36)     NOT NULL                       COMMENT '业务对象UUID（主键）',
    object_name    VARCHAR(100) NOT NULL                       COMMENT '业务对象名称',
    object_type    TINYINT      NOT NULL DEFAULT 0             COMMENT '对象类型：0-候选业务对象,1-已发布业务对象',
    form_view_id   CHAR(36)     NOT NULL                       COMMENT '关联数据视图UUID',
    mdl_id         VARCHAR(36)  NOT NULL DEFAULT ''            COMMENT '统一视图ID',
    status         TINYINT      NOT NULL DEFAULT 1             COMMENT '状态：0-禁用,1-启用',
    created_at     DATETIME(3)          DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
    updated_at     DATETIME(3)          DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT '更新时间',
    deleted_at     DATETIME(3)          DEFAULT NULL           COMMENT '删除时间(逻辑删除)',
    PRIMARY KEY (`id`),
    KEY idx_form_view_id (form_view_id, deleted_at),
    UNIQUE KEY uk_form_view_object_name (form_view_id, object_name, deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='业务对象表';

-- ------------------------------------------------------------
-- 3. 业务对象属性表
-- 用于存储已发布的业务对象的属性
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS t_business_object_attributes (
    id                   CHAR(36)     NOT NULL                       COMMENT '属性UUID（主键）',
    form_view_id         CHAR(36)     NOT NULL                       COMMENT '关联数据视图UUID',
    business_object_id   CHAR(36)     NOT NULL                       COMMENT '关联业务对象UUID',
    form_view_field_id   CHAR(36)     NOT NULL                       COMMENT '关联字段UUID',
    attr_name            VARCHAR(100) NOT NULL                       COMMENT '属性名称',
    created_at           DATETIME(3)          DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
    updated_at           DATETIME(3)          DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT '更新时间',
    deleted_at           DATETIME(3)          DEFAULT NULL           COMMENT '删除时间(逻辑删除)',
    PRIMARY KEY (`id`),
    KEY idx_form_view_id (form_view_id, deleted_at),
    KEY idx_business_object_id (business_object_id, deleted_at),
    UNIQUE KEY uk_business_object_field (business_object_id, attr_name, form_view_field_id, deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='业务对象属性表';

-- ------------------------------------------------------------
-- 4. 业务对象临时表
-- 用于版本控制和编辑中的业务对象
-- ------------------------------------------------------------
CREATE TABLE `t_business_object_temp` (
  `id` char(36) NOT NULL COMMENT '业务对象UUID（主键）',
  `form_view_id` char(36) NOT NULL COMMENT '关联数据视图UUID',
  `user_id` char(36) DEFAULT NULL COMMENT '为空代表模型操作，不为空代表某用户操作',
  `version` int(11) NOT NULL DEFAULT 10 COMMENT '版本号（存储格式：10=1.0，11=1.1，每次递增1表示0.1版本）',
  `object_name` varchar(100) NOT NULL COMMENT '业务对象名称',
  `in_use` tinyint(4) NOT NULL DEFAULT 0 COMMENT '当前使用标识：0=历史版本, 1=当前使用',
  `created_at` datetime(3) DEFAULT current_timestamp(3) COMMENT '创建时间',
  `updated_at` datetime(3) DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3) COMMENT '更新时间',
  `deleted_at` datetime(3) DEFAULT NULL COMMENT '删除时间(逻辑删除)',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_form_view_object_version` (`form_view_id`,`object_name`,`version`),
  KEY `idx_form_view_version` (`form_view_id`,`version`,`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='业务对象临时表';

-- ------------------------------------------------------------
-- 5. 业务对象属性临时表
-- 用于版本控制和编辑中的业务对象属性
-- ------------------------------------------------------------
CREATE TABLE `t_business_object_attributes_temp` (
  `id` char(36) NOT NULL COMMENT '属性UUID（主键）',
  `form_view_id` char(36) NOT NULL COMMENT '关联数据视图UUID',
  `business_object_id` char(36) NOT NULL COMMENT '关联业务对象UUID',
  `user_id` char(36) DEFAULT NULL COMMENT '为空代表模型操作，不为空代表某用户操作',
  `version` int(11) NOT NULL DEFAULT 10 COMMENT '版本号（存储格式：10=1.0，11=1.1，每次递增1表示0.1版本）',
  `form_view_field_id` char(36) NOT NULL COMMENT '关联字段UUID',
  `attr_name` varchar(100) NOT NULL COMMENT '属性名称',
  `in_use` tinyint(4) NOT NULL DEFAULT 0 COMMENT '当前使用标识：0=历史版本, 1=当前使用',
  `created_at` datetime(3) DEFAULT current_timestamp(3) COMMENT '创建时间',
  `updated_at` datetime(3) DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3) COMMENT '更新时间',
  `deleted_at` datetime(3) DEFAULT NULL COMMENT '删除时间(逻辑删除)',
  PRIMARY KEY (`id`),
  KEY `idx_form_view_object` (`form_view_id`,`business_object_id`,`deleted_at`),
  KEY `idx_form_view_version` (`form_view_id`,`version`,`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='业务对象属性临时表';

-- ------------------------------------------------------------
-- 6. 库表信息临时表
-- 用于版本控制和编辑中的库表语义信息
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS t_form_view_info_temp (
    id                   CHAR(36)     NOT NULL                       COMMENT '记录UUID（主键）',
    form_view_id         CHAR(36)     NOT NULL                       COMMENT '关联数据视图UUID',
    user_id              CHAR(36)                                         COMMENT '为空代表模型操作，不为空代表某用户操作',
    version              INT          NOT NULL DEFAULT 10            COMMENT '版本号（存储格式：10=1.0，11=1.1，每次递增1表示0.1版本）',
    table_business_name  VARCHAR(255)        DEFAULT NULL            COMMENT '库表业务名称',
    table_description    VARCHAR(300)        DEFAULT NULL            COMMENT '库表描述',
    created_at           DATETIME(3)          DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
    updated_at           DATETIME(3)          DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT '更新时间',
    deleted_at           DATETIME(3)          DEFAULT NULL           COMMENT '删除时间(逻辑删除)',
    PRIMARY KEY (id),
    KEY idx_form_view_version (form_view_id, version, deleted_at),
    UNIQUE KEY uk_form_view_version (form_view_id, version)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='库表信息临时表';

-- ------------------------------------------------------------
-- 7. 库表字段信息临时表
-- 用于版本控制和编辑中的字段语义信息
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS t_form_view_field_info_temp (
    id                   CHAR(36)     NOT NULL                       COMMENT '记录UUID（主键）',
    form_view_id         CHAR(36)     NOT NULL                       COMMENT '关联数据视图UUID',
    form_view_field_id   CHAR(36)     NOT NULL                       COMMENT '关联字段UUID',
    user_id              CHAR(36)                                         COMMENT '为空代表模型操作，不为空代表某用户操作',
    version              INT          NOT NULL DEFAULT 10            COMMENT '版本号（存储格式：10=1.0，11=1.1，每次递增1表示0.1版本）',
    field_business_name  VARCHAR(255)        DEFAULT NULL            COMMENT '字段业务名称',
    field_role           TINYINT             DEFAULT NULL            COMMENT '字段角色：1-业务主键, 2-关联标识, 3-业务状态, 4-时间字段, 5-业务指标, 6-业务特征, 7-审计字段, 8-技术字段',
    field_description    VARCHAR(300)        DEFAULT NULL            COMMENT '字段描述',
    created_at           DATETIME(3)          DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
    updated_at           DATETIME(3)          DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT '更新时间',
    deleted_at           DATETIME(3)          DEFAULT NULL           COMMENT '删除时间(逻辑删除)',
    PRIMARY KEY (id),
    KEY idx_form_view_version (form_view_id, version, deleted_at),
    KEY idx_form_view_field (form_view_field_id, deleted_at),
    UNIQUE KEY uk_form_view_field_version (form_view_field_id, version)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='库表字段信息临时表';
