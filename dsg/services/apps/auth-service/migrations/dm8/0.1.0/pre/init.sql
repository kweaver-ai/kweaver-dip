SET SCHEMA af_main;

CREATE TABLE IF NOT EXISTS "auth_service_casbin_rule" (
  "id" BIGINT  NOT NULL IDENTITY(1, 1),
  "ptype" VARCHAR(100 char) DEFAULT NULL,
  "v0" VARCHAR(100 char) DEFAULT NULL,
  "v1" VARCHAR(100 char) DEFAULT NULL,
  "v2" VARCHAR(100 char) DEFAULT NULL,
  "v3" VARCHAR(100 char) DEFAULT NULL,
  "v4" VARCHAR(100 char) DEFAULT NULL,
  "v5" VARCHAR(100 char) DEFAULT NULL,
  CLUSTER PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_auth_service_casbin_rule ON auth_service_casbin_rule("ptype","v0","v1","v2","v3","v4","v5");


CREATE TABLE IF NOT EXISTS "auth_sub_views" (
                                              "snowflake_id"  BIGINT        NOT NULL,
                                              "id"            VARCHAR(36 char)      NOT NULL,
  "name"          VARCHAR(255 char)  NOT NULL,
  "logic_view_id"     VARCHAR(36 char)      NOT NULL,
  "logic_view_name"   VARCHAR(255 char)  NOT NULL,
  "columns"           TEXT          NOT NULL,
  "row_filter_clause" TEXT          NOT NULL,
  "created_at" DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  "updated_at" DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  "deleted_at" BIGINT       NOT NULL DEFAULT 0,
  CLUSTER PRIMARY KEY                                                     ("snowflake_id")
  );

CREATE UNIQUE INDEX IF NOT EXISTS auth_sub_views_id ON auth_sub_views("id");
CREATE INDEX IF NOT EXISTS auth_sub_views_idx_auth_sub_views_logic_view_name ON auth_sub_views("logic_view_name");
CREATE INDEX IF NOT EXISTS auth_sub_views_idx_auth_sub_views_deleted_at ON auth_sub_views("deleted_at");




CREATE TABLE IF NOT EXISTS "logic_view_authorizing_requests" (
                                                               "snowflake_id"  BIGINT        NOT NULL,
                                                               "id"            VARCHAR(36 char)      NOT NULL,
  "spec"          BLOB      NOT NULL,
  "phase"         VARCHAR(64 char)  NOT NULL,
  "message"       TEXT      NOT NULL,
  "apply_id"      VARCHAR(36 char)  NOT NULL,
  "proc_def_key"  VARCHAR(36 char)  NOT NULL,
  "snapshots"     BLOB      NOT NULL,
  "created_at" DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  "updated_at" DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ,
  "deleted_at" BIGINT       NOT NULL DEFAULT 0,
  CLUSTER PRIMARY KEY                                                     ("id")
  );

CREATE UNIQUE INDEX IF NOT EXISTS logic_view_authorizing_requests_snowflake_id ON logic_view_authorizing_requests("snowflake_id");
CREATE UNIQUE INDEX IF NOT EXISTS logic_view_authorizing_requests_idx_logic_view_authorizing_requests_id_deleted_at ON logic_view_authorizing_requests("id", "deleted_at");
CREATE INDEX IF NOT EXISTS logic_view_authorizing_requests_idx_logic_view_authorizing_requests_deleted_at ON logic_view_authorizing_requests("deleted_at");




CREATE TABLE IF NOT EXISTS "indicator_authorizing_requests" (
                                                              "snowflake_id"  BIGINT        NOT NULL,
                                                              "id"            VARCHAR(36 char)      NOT NULL,
  "spec"          BLOB      NOT NULL,
  "phase"         VARCHAR(64 char)  NOT NULL,
  "message"       TEXT      NOT NULL,
  "created_at" DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  "updated_at" DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  "deleted_at" BIGINT       NOT NULL DEFAULT 0,
  CLUSTER PRIMARY KEY                                                     ("id")
  );

CREATE UNIQUE INDEX IF NOT EXISTS indicator_authorizing_requests_snowflake_id ON indicator_authorizing_requests("snowflake_id");
CREATE UNIQUE INDEX IF NOT EXISTS indicator_authorizing_requests_idx_indicator_authorizing_requests_id_deleted_at ON indicator_authorizing_requests("id", "deleted_at");
CREATE INDEX IF NOT EXISTS indicator_authorizing_requests_idx_indicator_authorizing_requests_deleted_at ON indicator_authorizing_requests("deleted_at");




CREATE TABLE IF NOT EXISTS "api_authorizing_requests" (
                                                        "sonyflake_id"  BIGINT        NOT NULL,
                                                        "id"            VARCHAR(36 char)      NOT NULL,
  "spec"          BLOB      NOT NULL,
  "phase"         VARCHAR(64 char)  NOT NULL,
  "message"       TEXT      NOT NULL,
  "created_at" DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  "updated_at" DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ,
  "deleted_at" BIGINT       NOT NULL DEFAULT 0,
  CLUSTER PRIMARY KEY                                           ("id")
  );

CREATE UNIQUE INDEX IF NOT EXISTS api_authorizing_requests_sonyflake_id ON api_authorizing_requests("sonyflake_id");
CREATE INDEX IF NOT EXISTS api_authorizing_requests_idx_api_authorizing_requests_deleted_at ON api_authorizing_requests("deleted_at");




CREATE TABLE IF NOT EXISTS "indicator_dimensional_rules" (
  "id"            VARCHAR(36 char)      NOT NULL,
  "created_at"    DATETIME(3)   NOT NULL  DEFAULT CURRENT_TIMESTAMP(3),
  "updated_at"    DATETIME(3)    NULL  DEFAULT CURRENT_TIMESTAMP(3),
  "deleted_at"    DATETIME(3)   NULL,
  "name"          VARCHAR(255 char)  NOT NULL,
  "indicator_id"  BIGINT        NOT NULL,
  "row_filters"   BLOB          NOT NULL,
  "auth_scope_id" BIGINT DEFAULT NUll,
  "scope_fields" TEXT  DEFAULT NUll,
  "fixed_row_filters" TEXT  DEFAULT NUll,
  CLUSTER PRIMARY KEY ("id")
  );




CREATE TABLE IF NOT EXISTS "indicator_dimensional_rule_fields" (
  "id"            VARCHAR(36 char)      NOT NULL,
  "created_at"    DATETIME(3)   NOT NULL  DEFAULT CURRENT_TIMESTAMP(3),
  "updated_at"    DATETIME(3)    NULL  DEFAULT CURRENT_TIMESTAMP(3),
  "deleted_at"    DATETIME(3)   NULL,
  "rule_id"   VARCHAR(36 char)      NOT NULL,
  "field_id"  VARCHAR(36 char)      NOT NULL,
  "name"      VARCHAR(255 char)  NOT NULL,
  "name_en"   VARCHAR(255 char)  NOT NULL,
  "data_type" VARCHAR(255 char)  NOT NULL,
  CLUSTER PRIMARY KEY ("id")
  );



-- 数仓数据申请单
CREATE TABLE IF NOT EXISTS "t_dwh_auth_request_form" (
  "sid" BIGINT  NOT NULL,
  "id"  VARCHAR(36 char)  NOT NULL,
  "name" VARCHAR(255 char) NOT NULL,
  "applicant" VARCHAR(36 char) NOT NULL,
  "apply_time" BIGINT  ,
  "data_id"   VARCHAR(36 char)  NOT NULL,
  "data_tech_name" VARCHAR(255 char) NOT NULL,
  "data_business_name" VARCHAR(255 char) NOT NULL,
  "apply_id" varchar(64 char) DEFAULT NULL,
  "proc_def_key" varchar(128 char)  DEFAULT NULL,
  "phase"  varchar(64 char) NOT NULL,
  "message" text NOT NULL,
  "created_at" datetime(3) NOT NULL DEFAULT current_timestamp(3) ,
  "updated_at" datetime NOT NULL DEFAULT current_timestamp(3),
  "deleted_at"  BIGINT   DEFAULT NULL,
  CLUSTER PRIMARY KEY ("sid")
  );

CREATE UNIQUE INDEX IF NOT EXISTS uidx_dwh_auth_request_form_id ON t_dwh_auth_request_form("id");


-- 数仓数据申请单的具体内容
CREATE TABLE IF NOT EXISTS "t_dwh_auth_request_spec" (
  "sid" BIGINT NOT NULL,
  "id"  VARCHAR(36 char) NOT NULL,
  "name"  varchar(255 char) NOT NULL,
  "request_form_id"  varchar(36 char) NOT NULL,
  "spec" text ,
  "expired_at"  BIGINT default 0,
  "request_type" varchar(32 char) NOT NULL DEFAULT 'query',
  "draft_spec" text ,
  "draft_expired_at" BIGINT default 0,
  "draft_request_type" varchar(32 char)  DEFAULT NULL,
  CLUSTER PRIMARY KEY ("sid")
  );
CREATE UNIQUE INDEX IF NOT EXISTS uidx_dwh_auth_request_spec_request_form_id ON t_dwh_auth_request_spec("request_form_id");
