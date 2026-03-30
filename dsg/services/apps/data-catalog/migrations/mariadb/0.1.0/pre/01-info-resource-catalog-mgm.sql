USE af_data_catalog;

-- [信息资源目录]
CREATE TABLE IF NOT EXISTS `t_info_resource_catalog` (
    -- [基本信息]
    f_id BIGINT NOT NULL COMMENT '主键ID',
    f_name VARCHAR(128) NOT NULL COMMENT '信息资源目录名称',
    f_code VARCHAR(255) NOT NULL COMMENT '信息资源目录编码',
    f_data_range TINYINT NOT NULL COMMENT '数据范围',
    f_update_cycle TINYINT NOT NULL COMMENT '更新周期',
    f_office_business_responsibility VARCHAR(255) NOT NULL COMMENT '处室业务职责',
    f_description VARCHAR(255) NOT NULL COMMENT '信息资源目录描述', -- [/]
    -- [共享信息]
    f_shared_type TINYINT NOT NULL COMMENT '共享属性',
    f_shared_message VARCHAR(128) NOT NULL COMMENT '共享信息：共享属性为不予共享时是不予共享依据，共享属性为有条件共享时是共享条件',
    f_shared_mode TINYINT NOT NULL COMMENT '共享方式', -- [/]
    -- [开放信息]
    f_open_type TINYINT NOT NULL COMMENT '开放属性',
    f_open_condition VARCHAR(128) NOT NULL COMMENT '开放条件', -- [/]
    -- [状态信息]
    f_publish_status TINYINT NOT NULL COMMENT '发布状态',
    f_publish_at BIGINT NOT NULL COMMENT '发布时间',
    f_online_status TINYINT NOT NULL COMMENT '上线状态',
    f_online_at BIGINT NOT NULL COMMENT '上线时间',
    f_update_at BIGINT NOT NULL COMMENT '更新时间',
    f_delete_at BIGINT NOT NULL COMMENT '删除时间',
    f_audit_id BIGINT NOT NULL COMMENT '审核ID',
    f_audit_msg VARCHAR(2400) NOT NULL COMMENT '最后一次审核意见', -- [/]
    -- [变更新增字段]
    f_current_version TINYINT(2) NOT NULL DEFAULT '1' COMMENT '是否现行版本 0 否 1 是',
    f_alter_uid VARCHAR(36) NOT NULL DEFAULT '' COMMENT '变更创建人ID',
    f_alter_name VARCHAR(255) NOT NULL DEFAULT '' COMMENT '变更创建人名称',
    f_alter_at BIGINT NOT NULL DEFAULT '0' COMMENT '变更创建时间',
    f_pre_id BIGINT NOT NULL DEFAULT '0' COMMENT '前一版本ID',
    f_next_id BIGINT NOT NULL DEFAULT '0' COMMENT '后一版本ID',
    f_alter_audit_msg TEXT COMMENT '最后一次变更审核意见', -- [/]
    PRIMARY KEY (f_id),
    UNIQUE KEY uk_code (f_code)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '信息资源目录';
-- [/]

-- [信息资源目录来源信息（来源业务表/来源部门）]
CREATE TABLE IF NOT EXISTS `t_info_resource_catalog_source_info` (
    f_id BIGINT NOT NULL COMMENT '信息资源目录ID',
    -- [来源业务表]
    f_business_form_id CHAR(36) NOT NULL COMMENT '来源业务表ID',
    f_business_form_name VARCHAR(128) NOT NULL COMMENT '来源业务表名称', -- [/]
    -- [来源部门]
    f_department_id CHAR(36) NOT NULL COMMENT '来源部门ID',
    f_department_name VARCHAR(128) NOT NULL COMMENT '来源部门名称', -- [/]
    PRIMARY KEY (f_id),
    UNIQUE KEY uk_business_form_id (f_business_form_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '信息资源目录来源信息';
-- [/]

-- [信息资源目录关联项（所属部门/所属处室/业务流程/信息系统/数据资源目录/信息类/信息项）]
CREATE TABLE IF NOT EXISTS `t_info_resource_catalog_related_item` (
    f_id BIGINT NOT NULL AUTO_INCREMENT COMMENT '自增主键',
    f_info_resource_catalog_id BIGINT NOT NULL COMMENT '信息资源目录ID',
    -- [关联项信息]
    f_related_item_id VARCHAR(50) NOT NULL COMMENT '关联项ID',
    f_related_item_name VARCHAR(128) NOT NULL COMMENT '关联项名称',
    f_relation_type TINYINT NOT NULL COMMENT '关联类型', -- [/]
    PRIMARY KEY (f_id),
    UNIQUE KEY uk_info_resource_catalog_related_item ( f_info_resource_catalog_id, f_related_item_id, f_relation_type )
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '信息资源目录关联项';
-- [/]

-- [信息资源关联类目节点]
CREATE TABLE IF NOT EXISTS `t_info_resource_catalog_category_node` (
    f_id BIGINT NOT NULL AUTO_INCREMENT COMMENT '自增主键',
    f_category_node_id VARCHAR(50) NOT NULL COMMENT '类目节点ID',
    f_category_cate_id CHAR(36) NOT NULL COMMENT '类目分类ID',
    f_info_resource_catalog_id BIGINT NOT NULL COMMENT '信息资源目录ID',
    PRIMARY KEY (f_id),
    UNIQUE KEY uk_category_info_resource_catalog (  f_category_node_id, f_category_cate_id, f_info_resource_catalog_id  )
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '信息资源目录关联类目';
-- [/]

-- [业务场景]
CREATE TABLE IF NOT EXISTS `t_business_scene` (
    f_id BIGINT NOT NULL AUTO_INCREMENT COMMENT '自增主键',
    f_type TINYINT NOT NULL COMMENT '业务类型',
    f_value VARCHAR(128) NOT NULL COMMENT '业务场景',
    f_info_resource_catalog_id BIGINT NOT NULL COMMENT '所属信息资源目录ID',
    f_related_type TINYINT NOT NULL COMMENT '关联类型',
    PRIMARY KEY (f_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '业务场景';
-- [/]

-- [信息资源目录下属信息项]
CREATE TABLE IF NOT EXISTS `t_info_resource_catalog_column` (
    f_id BIGINT NOT NULL COMMENT '主键ID',
    f_name VARCHAR(128) NOT NULL COMMENT '信息项名称',
    -- [变更新增字段]
    f_field_name_en VARCHAR(128) NOT NULL DEFAULT '' COMMENT '对应业务表字段英文名称',
    f_field_name_cn VARCHAR(255) NOT NULL DEFAULT '' COMMENT '对应业务表字段中文名称', -- [/]
    -- [字段元数据]
    f_data_type TINYINT NOT NULL COMMENT '数据类型',
    f_data_length BIGINT NOT NULL COMMENT '数据长度',
    f_data_range VARCHAR(128) NOT NULL COMMENT '数据值域', -- [/]
    -- [字段属性]
    f_is_sensitive TINYINT NOT NULL COMMENT '是否敏感属性：0-否；1-是',
    f_is_secret TINYINT NOT NULL COMMENT '是否涉密属性：0-否；1-是',
    f_is_incremental TINYINT NOT NULL COMMENT '是否增量属性：0-否；1-是',
    f_is_primary_key TINYINT NOT NULL COMMENT '是否主键属性：0-否；1-是',
    f_is_local_generated TINYINT NOT NULL COMMENT '是否本部门产生：0-否；1-是',
    f_is_standardized TINYINT NOT NULL COMMENT '是否标准化属性：0-否；1-是', -- [/]
    f_info_resource_catalog_id BIGINT NOT NULL COMMENT '所属信息资源目录ID',
    f_order SMALLINT NOT NULL COMMENT '排序索引',
    PRIMARY KEY (f_id),
    UNIQUE KEY uk_info_resource_catalog_column ( f_name, f_info_resource_catalog_id )
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '信息资源目录下属信息项';
-- [/]

-- [信息项关联信息]
CREATE TABLE IF NOT EXISTS `t_info_resource_catalog_column_related_info` (
    f_id BIGINT NOT NULL COMMENT '信息项ID',
    -- [关联代码集]
    f_code_set_id BIGINT NOT NULL COMMENT '关联代码集ID',
    f_code_set_name VARCHAR(128) NOT NULL COMMENT '关联代码集名称', -- [/]
    -- [关联数据元]
    f_data_refer_id BIGINT NOT NULL COMMENT '关联数据元ID',
    f_data_refer_name VARCHAR(128) NOT NULL COMMENT '关联数据元名称', -- [/]
    PRIMARY KEY (f_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '信息资源目录下属信息项关联信息';
-- [/]

-- [未编目业务表]
CREATE TABLE IF NOT EXISTS `t_business_form_not_cataloged` (
    f_id CHAR(36) NOT NULL COMMENT '业务表ID',
    f_name VARCHAR(128) NOT NULL COMMENT '业务表名称',
    f_description  VARCHAR(255) DEFAULT '' COMMENT '业务表描述',
    f_info_system_id text null COMMENT '信息系统ID数组',
    f_department_id CHAR(36) DEFAULT NULL COMMENT '所属部门ID',
    f_business_domain_id  CHAR(36)  DEFAULT '' COMMENT '主干业务ID',
    f_business_model_id  CHAR(36)  DEFAULT '' COMMENT '业务模型ID',
    f_update_at BIGINT NOT NULL COMMENT '更新时间',
    PRIMARY KEY (f_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '未编目业务表';
-- [/]

-- ALTER TABLE t_business_form_not_cataloged DROP COLUMN IF  EXISTS  f_info_system;
-- ALTER TABLE t_business_form_not_cataloged ADD  COLUMN IF  NOT EXISTS  f_description  VARCHAR(255) NOT NULL DEFAULT '' COMMENT '业务表描述';
-- ALTER TABLE t_business_form_not_cataloged ADD  COLUMN IF  NOT EXISTS  f_info_system_id text null COMMENT '信息系统ID数组';
-- ALTER TABLE t_business_form_not_cataloged ADD  COLUMN IF  NOT EXISTS  f_business_domain_id  CHAR(36)  COMMENT '主干业务ID';
-- ALTER TABLE t_business_form_not_cataloged ADD  COLUMN IF  NOT EXISTS  f_business_model_id  CHAR(36)  COMMENT '业务模型ID';

-- [信息资源目录变更表结构变更]
-- [信息资源目录表变更]
-- ALTER TABLE t_info_resource_catalog ADD COLUMN IF NOT EXISTS f_current_version TINYINT(2) NOT NULL DEFAULT '1' COMMENT '是否现行版本 0 否 1 是';
-- ALTER TABLE t_info_resource_catalog ADD COLUMN IF NOT EXISTS f_alter_uid VARCHAR(36) NOT NULL DEFAULT '' COMMENT '变更创建人ID';
-- ALTER TABLE t_info_resource_catalog ADD COLUMN IF NOT EXISTS f_alter_name VARCHAR(255) NOT NULL DEFAULT '' COMMENT '变更创建人名称';
-- ALTER TABLE t_info_resource_catalog ADD COLUMN IF NOT EXISTS f_alter_at BIGINT NOT NULL DEFAULT '0' COMMENT '变更创建时间';
-- ALTER TABLE t_info_resource_catalog ADD COLUMN IF NOT EXISTS f_pre_id BIGINT NOT NULL DEFAULT '0' COMMENT '前一版本ID';
-- ALTER TABLE t_info_resource_catalog ADD COLUMN IF NOT EXISTS f_next_id BIGINT NOT NULL DEFAULT '0' COMMENT '后一版本ID';
-- ALTER TABLE t_info_resource_catalog ADD COLUMN IF NOT EXISTS f_alter_audit_msg TEXT COMMENT '最后一次变更审核意见';
-- ALTER TABLE t_info_resource_catalog DROP KEY IF EXISTS uk_code; -- [/]
-- -- [信息资源目录下属信息项表变更]
-- ALTER TABLE t_info_resource_catalog_column MODIFY COLUMN IF EXISTS f_name VARCHAR(255) NOT NULL COMMENT '信息项名称';
-- ALTER TABLE t_info_resource_catalog_column ADD COLUMN IF NOT EXISTS f_field_name_en VARCHAR(128) NOT NULL DEFAULT '' COMMENT '对应业务表字段英文名称';
-- ALTER TABLE t_info_resource_catalog_column ADD COLUMN IF NOT EXISTS f_field_name_cn VARCHAR(255) NOT NULL DEFAULT '' COMMENT '对应业务表字段中文名称'; -- [/]
-- -- [/]
-- -- [信息资源目录关联项表变更]
-- ALTER TABLE t_info_resource_catalog_related_item MODIFY COLUMN IF EXISTS f_related_item_name VARCHAR(255) NOT NULL COMMENT '关联项名称';
-- -- [/]
-- ALTER TABLE t_info_resource_catalog MODIFY COLUMN IF EXISTS f_office_business_responsibility VARCHAR(300) NOT NULL COMMENT '处室业务职责';