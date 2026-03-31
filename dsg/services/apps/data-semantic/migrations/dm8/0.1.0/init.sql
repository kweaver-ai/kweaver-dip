-- ============================================================
-- Data Understanding 数据库初始化脚本
-- 数据库: af_main
-- ============================================================
SET SCHEMA af_main;

-- ------------------------------------------------------------
-- 1. Kafka 消息处理记录表
-- 用于记录 AI 服务响应的处理状态，防止重复消费
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS t_kafka_message_log (
    id CHAR(36) NOT NULL,
    message_id CHAR(36) NOT NULL,
    form_view_id CHAR(36) NOT NULL,
    processed_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3),
    status SMALLINT DEFAULT 1,
    error_msg CLOB,
    PRIMARY KEY (id),
    UNIQUE KEY uk_message_id (message_id),
    KEY idx_form_view_id (form_view_id)
);

COMMENT ON TABLE t_kafka_message_log IS 'Kafka消息处理记录表';
COMMENT ON COLUMN t_kafka_message_log.id IS '主键UUID';
COMMENT ON COLUMN t_kafka_message_log.message_id IS 'Kafka消息ID';
COMMENT ON COLUMN t_kafka_message_log.form_view_id IS '关联数据视图UUID';
COMMENT ON COLUMN t_kafka_message_log.processed_at IS '处理时间';
COMMENT ON COLUMN t_kafka_message_log.status IS '状态：1-处理成功，2-处理失败';
COMMENT ON COLUMN t_kafka_message_log.error_msg IS '错误信息';

-- ------------------------------------------------------------
-- 2. 业务对象表
-- 用于存储已发布的业务对象
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS t_business_object (
    id CHAR(36) NOT NULL,
    object_name VARCHAR(100) NOT NULL,
    object_type SMALLINT NOT NULL DEFAULT 0,
    form_view_id CHAR(36) NOT NULL,
    mdl_id VARCHAR(36) NOT NULL DEFAULT '',
    status SMALLINT NOT NULL DEFAULT 1,
    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3),
    updated_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3),
    deleted_at TIMESTAMP(3) DEFAULT NULL,
    PRIMARY KEY (id),
    KEY idx_form_view_id (form_view_id, deleted_at),
    UNIQUE KEY uk_form_view_object_name (form_view_id, object_name, deleted_at)
);

COMMENT ON TABLE t_business_object IS '业务对象表';
COMMENT ON COLUMN t_business_object.id IS '业务对象UUID（主键）';
COMMENT ON COLUMN t_business_object.object_name IS '业务对象名称';
COMMENT ON COLUMN t_business_object.object_type IS '对象类型：0-候选业务对象,1-已发布业务对象';
COMMENT ON COLUMN t_business_object.form_view_id IS '关联数据视图UUID';
COMMENT ON COLUMN t_business_object.mdl_id IS '统一视图ID';
COMMENT ON COLUMN t_business_object.status IS '状态：0-禁用,1-启用';
COMMENT ON COLUMN t_business_object.created_at IS '创建时间';
COMMENT ON COLUMN t_business_object.updated_at IS '更新时间';
COMMENT ON COLUMN t_business_object.deleted_at IS '删除时间(逻辑删除)';

-- ------------------------------------------------------------
-- 3. 业务对象属性表
-- 用于存储已发布的业务对象的属性
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS t_business_object_attributes (
    id CHAR(36) NOT NULL,
    form_view_id CHAR(36) NOT NULL,
    business_object_id CHAR(36) NOT NULL,
    form_view_field_id CHAR(36) NOT NULL,
    attr_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3),
    updated_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3),
    deleted_at TIMESTAMP(3) DEFAULT NULL,
    PRIMARY KEY (id),
    KEY idx_form_view_id (form_view_id, deleted_at),
    KEY idx_business_object_id (business_object_id, deleted_at),
    UNIQUE KEY uk_business_object_field (business_object_id, attr_name, form_view_field_id, deleted_at)
);

COMMENT ON TABLE t_business_object_attributes IS '业务对象属性表';
COMMENT ON COLUMN t_business_object_attributes.id IS '属性UUID（主键）';
COMMENT ON COLUMN t_business_object_attributes.form_view_id IS '关联数据视图UUID';
COMMENT ON COLUMN t_business_object_attributes.business_object_id IS '关联业务对象UUID';
COMMENT ON COLUMN t_business_object_attributes.form_view_field_id IS '关联字段UUID';
COMMENT ON COLUMN t_business_object_attributes.attr_name IS '属性名称';
COMMENT ON COLUMN t_business_object_attributes.created_at IS '创建时间';
COMMENT ON COLUMN t_business_object_attributes.updated_at IS '更新时间';
COMMENT ON COLUMN t_business_object_attributes.deleted_at IS '删除时间(逻辑删除)';

-- ------------------------------------------------------------
-- 4. 业务对象临时表
-- 用于版本控制和编辑中的业务对象
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS t_business_object_temp (
    id CHAR(36) NOT NULL,
    form_view_id CHAR(36) NOT NULL,
    user_id CHAR(36),
    version INT NOT NULL DEFAULT 10,
    object_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3),
    updated_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3),
    deleted_at TIMESTAMP(3) DEFAULT NULL,
    PRIMARY KEY (id),
    KEY idx_form_view_version (form_view_id, version, deleted_at),
    UNIQUE KEY uk_form_view_object_version (form_view_id, object_name, version)
);

COMMENT ON TABLE t_business_object_temp IS '业务对象临时表';
COMMENT ON COLUMN t_business_object_temp.id IS '业务对象UUID（主键）';
COMMENT ON COLUMN t_business_object_temp.form_view_id IS '关联数据视图UUID';
COMMENT ON COLUMN t_business_object_temp.user_id IS '为空代表模型操作，不为空代表某用户操作';
COMMENT ON COLUMN t_business_object_temp.version IS '版本号（存储格式：10=1.0，11=1.1，每次递增1表示0.1版本）';
COMMENT ON COLUMN t_business_object_temp.object_name IS '业务对象名称';
COMMENT ON COLUMN t_business_object_temp.created_at IS '创建时间';
COMMENT ON COLUMN t_business_object_temp.updated_at IS '更新时间';
COMMENT ON COLUMN t_business_object_temp.deleted_at IS '删除时间(逻辑删除)';

-- ------------------------------------------------------------
-- 5. 业务对象属性临时表
-- 用于版本控制和编辑中的业务对象属性
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS t_business_object_attributes_temp (
    id CHAR(36) NOT NULL,
    form_view_id CHAR(36) NOT NULL,
    business_object_id CHAR(36) NOT NULL,
    user_id CHAR(36),
    version INT NOT NULL DEFAULT 10,
    form_view_field_id CHAR(36) NOT NULL,
    attr_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3),
    updated_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3),
    deleted_at TIMESTAMP(3) DEFAULT NULL,
    PRIMARY KEY (id),
    KEY idx_form_view_object (form_view_id, business_object_id, deleted_at),
    KEY idx_form_view_version (form_view_id, version, deleted_at),
    UNIQUE KEY uk_object_attr_version (business_object_id, attr_name, form_view_field_id, version)
);

COMMENT ON TABLE t_business_object_attributes_temp IS '业务对象属性临时表';
COMMENT ON COLUMN t_business_object_attributes_temp.id IS '属性UUID（主键）';
COMMENT ON COLUMN t_business_object_attributes_temp.form_view_id IS '关联数据视图UUID';
COMMENT ON COLUMN t_business_object_attributes_temp.business_object_id IS '关联业务对象UUID';
COMMENT ON COLUMN t_business_object_attributes_temp.user_id IS '为空代表模型操作，不为空代表某用户操作';
COMMENT ON COLUMN t_business_object_attributes_temp.version IS '版本号（存储格式：10=1.0，11=1.1，每次递增1表示0.1版本）';
COMMENT ON COLUMN t_business_object_attributes_temp.form_view_field_id IS '关联字段UUID';
COMMENT ON COLUMN t_business_object_attributes_temp.attr_name IS '属性名称';
COMMENT ON COLUMN t_business_object_attributes_temp.created_at IS '创建时间';
COMMENT ON COLUMN t_business_object_attributes_temp.updated_at IS '更新时间';
COMMENT ON COLUMN t_business_object_attributes_temp.deleted_at IS '删除时间(逻辑删除)';

-- ------------------------------------------------------------
-- 6. 库表信息临时表
-- 用于版本控制和编辑中的库表语义信息
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS t_form_view_info_temp (
    id CHAR(36) NOT NULL,
    form_view_id CHAR(36) NOT NULL,
    user_id CHAR(36),
    version INT NOT NULL DEFAULT 10,
    table_business_name VARCHAR(255) DEFAULT NULL,
    table_description VARCHAR(300) DEFAULT NULL,
    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3),
    updated_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3),
    deleted_at TIMESTAMP(3) DEFAULT NULL,
    PRIMARY KEY (id),
    KEY idx_form_view_version (form_view_id, version, deleted_at),
    UNIQUE KEY uk_form_view_version (form_view_id, version)
);

COMMENT ON TABLE t_form_view_info_temp IS '库表信息临时表';
COMMENT ON COLUMN t_form_view_info_temp.id IS '记录UUID（主键）';
COMMENT ON COLUMN t_form_view_info_temp.form_view_id IS '关联数据视图UUID';
COMMENT ON COLUMN t_form_view_info_temp.user_id IS '为空代表模型操作，不为空代表某用户操作';
COMMENT ON COLUMN t_form_view_info_temp.version IS '版本号（存储格式：10=1.0，11=1.1，每次递增1表示0.1版本）';
COMMENT ON COLUMN t_form_view_info_temp.table_business_name IS '库表业务名称';
COMMENT ON COLUMN t_form_view_info_temp.table_description IS '库表描述';
COMMENT ON COLUMN t_form_view_info_temp.created_at IS '创建时间';
COMMENT ON COLUMN t_form_view_info_temp.updated_at IS '更新时间';
COMMENT ON COLUMN t_form_view_info_temp.deleted_at IS '删除时间(逻辑删除)';

-- ------------------------------------------------------------
-- 7. 库表字段信息临时表
-- 用于版本控制和编辑中的字段语义信息
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS t_form_view_field_info_temp (
    id CHAR(36) NOT NULL,
    form_view_id CHAR(36) NOT NULL,
    form_view_field_id CHAR(36) NOT NULL,
    user_id CHAR(36),
    version INT NOT NULL DEFAULT 10,
    field_business_name VARCHAR(255) DEFAULT NULL,
    field_role SMALLINT DEFAULT NULL,
    field_description VARCHAR(300) DEFAULT NULL,
    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3),
    updated_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3),
    deleted_at TIMESTAMP(3) DEFAULT NULL,
    PRIMARY KEY (id),
    KEY idx_form_view_version (form_view_id, version, deleted_at),
    KEY idx_form_view_field (form_view_field_id, deleted_at),
    UNIQUE KEY uk_form_view_field_version (form_view_field_id, version)
);

COMMENT ON TABLE t_form_view_field_info_temp IS '库表字段信息临时表';
COMMENT ON COLUMN t_form_view_field_info_temp.id IS '记录UUID（主键）';
COMMENT ON COLUMN t_form_view_field_info_temp.form_view_id IS '关联数据视图UUID';
COMMENT ON COLUMN t_form_view_field_info_temp.form_view_field_id IS '关联字段UUID';
COMMENT ON COLUMN t_form_view_field_info_temp.user_id IS '为空代表模型操作，不为空代表某用户操作';
COMMENT ON COLUMN t_form_view_field_info_temp.version IS '版本号（存储格式：10=1.0，11=1.1，每次递增1表示0.1版本）';
COMMENT ON COLUMN t_form_view_field_info_temp.field_business_name IS '字段业务名称';
COMMENT ON COLUMN t_form_view_field_info_temp.field_role IS '字段角色：1-业务主键, 2-关联标识, 3-业务状态, 4-时间字段, 5-业务指标, 6-业务特征, 7-审计字段, 8-技术字段';
COMMENT ON COLUMN t_form_view_field_info_temp.field_description IS '字段描述';
COMMENT ON COLUMN t_form_view_field_info_temp.created_at IS '创建时间';
COMMENT ON COLUMN t_form_view_field_info_temp.updated_at IS '更新时间';
COMMENT ON COLUMN t_form_view_field_info_temp.deleted_at IS '删除时间(逻辑删除)';

-- ------------------------------------------------------------
-- 8. 扩展 form_view 表
-- 添加库表理解状态字段
-- ------------------------------------------------------------
ALTER TABLE form_view ADD COLUMN understand_status SMALLINT NOT NULL DEFAULT 0;

COMMENT ON COLUMN form_view.understand_status IS '理解状态：0-未理解,1-理解中,2-待确认,3-已完成,4-已发布';

-- ------------------------------------------------------------
-- 9. 扩展 form_view_field 表
-- 添加字段语义角色和描述字段
-- ------------------------------------------------------------
ALTER TABLE form_view_field ADD COLUMN field_role SMALLINT DEFAULT NULL;

COMMENT ON COLUMN form_view_field.field_role IS '字段角色：1-业务主键, 2-关联标识, 3-业务状态, 4-时间字段, 5-业务指标, 6-业务特征, 7-审计字段, 8-技术字段';

ALTER TABLE form_view_field ADD COLUMN field_description VARCHAR(300) DEFAULT NULL;

COMMENT ON COLUMN form_view_field.field_description IS '字段描述';
