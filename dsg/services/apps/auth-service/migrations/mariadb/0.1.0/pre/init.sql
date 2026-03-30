USE af_main;

CREATE TABLE IF NOT EXISTS `auth_service_casbin_rule` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `ptype` varchar(100) DEFAULT NULL,
  `v0` varchar(100) DEFAULT NULL,
  `v1` varchar(100) DEFAULT NULL,
  `v2` varchar(100) DEFAULT NULL,
  `v3` varchar(100) DEFAULT NULL,
  `v4` varchar(100) DEFAULT NULL,
  `v5` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_auth_service_casbin_rule` (`ptype`,`v0`,`v1`,`v2`,`v3`,`v4`,`v5`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 子视图用于获取有权限的子视图，而不依赖服务 data-view
CREATE TABLE IF NOT EXISTS `auth_sub_views` (
  `snowflake_id`  BIGINT        NOT NULL  COMMENT '雪花 ID，无业务意义',
  `id`            CHAR(36)      NOT NULL  COMMENT 'ID',
  `name`          VARCHAR(255)  NOT NULL  COMMENT '名称',

  `logic_view_id`     CHAR(36)      NOT NULL COMMENT '所属逻辑视图的 ID',
  `logic_view_name`   VARCHAR(255)  NOT NULL COMMENT '所属逻辑视图的名称',
  `columns`           TEXT          NOT NULL COMMENT '子视图的列的名称列表，逗号分隔',
  `row_filter_clause` TEXT          NOT NULL COMMENT '子视图的行过滤器子句',

  `created_at` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `deleted_at` BIGINT       NOT NULL DEFAULT 0,

  PRIMARY KEY                                                     (`snowflake_id`),
  UNIQUE KEY                                                      (`id`),
  KEY         `idx_auth_sub_views_logic_view_name`                (`logic_view_name`),
  KEY         `idx_auth_sub_views_deleted_at`                     (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 逻辑视图授权申请
CREATE TABLE IF NOT EXISTS `logic_view_authorizing_requests` (
  `snowflake_id`  BIGINT        NOT NULL  COMMENT '雪花 ID，无业务意义',
  `id`            CHAR(36)      NOT NULL  COMMENT 'ID',

  `spec`          BLOB      NOT NULL COMMENT '授权申请的定义，以 JSON 序列化',
  `phase`         CHAR(64)  NOT NULL COMMENT '权申请当前所处的阶段',
  `message`       TEXT      NOT NULL COMMENT '策略请求处于当前阶段的原因',
  `apply_id`      CHAR(36)  NOT NULL COMMENT '审核流程的 ID',
  `proc_def_key`  CHAR(36)  NOT NULL COMMENT '审核流程的 key',
  `snapshots`     BLOB      NOT NULL COMMENT '逻辑视图授权申请被创建时，申请所引用的行列规则（子视图）的快照，以 JSON 序列化',

  `created_at` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `deleted_at` BIGINT       NOT NULL DEFAULT 0,

  UNIQUE KEY                                                      (`snowflake_id`),
  PRIMARY KEY                                                     (`id`),
  UNIQUE KEY  `idx_logic_view_authorizing_requests_id_deleted_at` (`id`, `deleted_at`),
  KEY         `idx_logic_view_authorizing_requests_deleted_at`    (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 指标授权申请
CREATE TABLE IF NOT EXISTS `indicator_authorizing_requests` (
  `snowflake_id`  BIGINT        NOT NULL  COMMENT '雪花 ID，无业务意义',
  `id`            CHAR(36)      NOT NULL  COMMENT 'ID',

  `spec`          BLOB      NOT NULL COMMENT '授权申请的定义，以 JSON 序列化',
  `phase`         CHAR(64)  NOT NULL COMMENT '权申请当前所处的阶段',
  `message`       TEXT      NOT NULL COMMENT '策略请求处于当前阶段的原因',

  `created_at` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `deleted_at` BIGINT       NOT NULL DEFAULT 0,

  UNIQUE KEY                                                      (`snowflake_id`),
  PRIMARY KEY                                                     (`id`),
  UNIQUE KEY  `idx_indicator_authorizing_requests_id_deleted_at`  (`id`, `deleted_at`),
  KEY         `idx_indicator_authorizing_requests_deleted_at`     (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 接口授权申请
CREATE TABLE IF NOT EXISTS `api_authorizing_requests` (
  `sonyflake_id`  BIGINT        NOT NULL  COMMENT 'Sonyflake ID',
  `id`            CHAR(36)      NOT NULL  COMMENT 'ID',

  `spec`          BLOB      NOT NULL COMMENT '授权申请的定义，以 JSON 序列化',
  `phase`         CHAR(64)  NOT NULL COMMENT '授权申请当前所处的阶段',
  `message`       TEXT      NOT NULL COMMENT '授权申请处于当前阶段的原因',

  `created_at` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `deleted_at` BIGINT       NOT NULL DEFAULT 0,

  UNIQUE  KEY                                           (`sonyflake_id`),
  PRIMARY KEY                                           (`id`),
  KEY         `idx_api_authorizing_requests_deleted_at` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 指标维度规则
CREATE TABLE IF NOT EXISTS `indicator_dimensional_rules` (
  `id`            CHAR(36)      NOT NULL                                                                COMMENT 'ID',
  `created_at`    DATETIME(3)   NOT NULL  DEFAULT CURRENT_TIMESTAMP(3)                                  COMMENT '创建时间',
  `updated_at`    DATETIME(3)   NOT NULL  DEFAULT CURRENT_TIMESTAMP(3)  COMMENT '更新时间',
  `deleted_at`    DATETIME(3)   NULL                                                                    COMMENT '删除时间',

  `auth_scope_id` bigint(20) default NULL COMMENT '所属维度授权范围ID',
  `scope_fields`        text default null COMMENT '列规则可以选定的字段范围ID，英文半角逗号分割的字符串',
  `fixed_row_filters`   text default null COMMENT '行规则过滤的固定条件',

  `name`          VARCHAR(255)  NOT NULL  COMMENT '名称',
  `indicator_id`  BIGINT        NOT NULL  COMMENT '所属指标的 ID',
  `row_filters`   BLOB          NOT NULL  COMMENT '行过滤规则',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='指标维度规则';

-- 指标维度规则的字段
CREATE TABLE IF NOT EXISTS `indicator_dimensional_rule_fields` (
  `id`            CHAR(36)      NOT NULL                                                                COMMENT 'ID',
  `created_at`    DATETIME(3)   NOT NULL  DEFAULT CURRENT_TIMESTAMP(3)                                  COMMENT '创建时间',
  `updated_at`    DATETIME(3)   NOT NULL  DEFAULT CURRENT_TIMESTAMP(3)  COMMENT '更新时间',
  `deleted_at`    DATETIME(3)   NULL                                                                    COMMENT '删除时间',

  `rule_id`   CHAR(36)      NOT NULL  COMMENT '所属指标维度规则的 ID',
  `field_id`  CHAR(36)      NOT NULL  COMMENT '字段 ID',
  `name`      VARCHAR(255)  NOT NULL  COMMENT '字段名称，不确定如何根据字段 ID 查询名称，所以冗余记录',
  `name_en`   VARCHAR(255)  NOT NULL  COMMENT '字段英文名称，同 name。',
  `data_type` VARCHAR(255)  NOT NULL  COMMENT '字段数据类型，同 name',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='指标维度规则的字段';



-- 数仓数据申请单
CREATE TABLE IF NOT EXISTS `t_dwh_auth_request_form` (
    sid bigint(20) NOT NULL COMMENT '雪花ID',
    id  char(36) NOT NULL COMMENT '申请单ID',
    name VARCHAR(255) NOT NULL COMMENT '申请单名称',
    applicant char(36) NOT NULL COMMENT '申请人（创建人）',
    apply_time bigint(20)  COMMENT '申请时间',
    data_id   char(36)  NOT NULL COMMENT '数据ID，当前是库表的ID',
    data_tech_name VARCHAR(255) NOT NULL COMMENT '数据名称，当前是库表的技术名称',
    data_business_name VARCHAR(255) NOT NULL COMMENT '数据名称，当前是库表的业务名称',
    apply_id varchar(64) DEFAULT NULL COMMENT '审核流程ID',
    proc_def_key varchar(128)  DEFAULT NULL COMMENT '审核流程key',
    phase  varchar(64) NOT NULL COMMENT '权申请当前所处的阶段',
    message text NOT NULL COMMENT '策略请求处于当前阶段的原因',
    created_at datetime(3) NOT NULL DEFAULT current_timestamp(3) COMMENT '创建时间, 申请时间' ,
    updated_at datetime NOT NULL DEFAULT current_timestamp(3) COMMENT '更新时间',
    deleted_at  bigint(20)   DEFAULT NULL COMMENT '删除时间(逻辑删除)',
    PRIMARY KEY (`sid`) USING BTREE,
    UNIQUE KEY   `idx_id` (`id`)
)  COMMENT='申请单表';



-- 数仓数据申请单的具体内容
CREATE TABLE IF NOT EXISTS `t_dwh_auth_request_spec` (
    sid bigint(20) NOT NULL COMMENT '雪花ID',
    id  char(36) NOT NULL COMMENT '子视图的ID',
    name  varchar(255) NOT NULL COMMENT '子视图的名称',
    request_form_id  char(36) NOT NULL COMMENT '申请单ID',
    spec text default  NULL COMMENT '申请行列的申请的定义，以 JSON 序列化',
    expired_at  bigint(20) default 0 COMMENT '子视图的草稿的过期时间',
    request_type varchar(32) NOT NULL DEFAULT 'query' COMMENT '申请类型，check数据核验，query数据查询',
    draft_spec text default  NULL COMMENT '申请行列的申请定义的草稿，以 JSON 序列化',
    draft_expired_at bigint(20) default 0 COMMENT '子视图的草稿的过期时间',
    draft_request_type varchar(32)  DEFAULT NULL COMMENT '草稿申请类型，check数据核验，query数据查询',
    PRIMARY KEY (`sid`) USING BTREE,
    KEY  `idx_apply_id` (`request_form_id`)
)  COMMENT='数仓数据申请单的子视图的内容';