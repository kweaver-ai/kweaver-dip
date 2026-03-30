SET SCHEMA data_application_service;

CREATE TABLE IF NOT EXISTS "app"
(
    "id"          BIGINT  NOT NULL,
    "uid"         VARCHAR(50 char)         NOT NULL DEFAULT '',
    "app_id"      VARCHAR(255 char)        NOT NULL DEFAULT '',
    "app_secret"  VARCHAR(255 char)        NOT NULL DEFAULT '',
    "create_time" datetime(0) NOT NULL DEFAULT current_timestamp(),
    "update_time" datetime(0) NOT NULL DEFAULT current_timestamp(),
    CLUSTER PRIMARY KEY ("id")
    );

CREATE INDEX IF NOT EXISTS app_uid ON app("uid");

CREATE TABLE IF NOT EXISTS "audit_process_bind"
(
    "id"           BIGINT  NOT NULL,
    "bind_id"      VARCHAR(255 char)        NOT NULL DEFAULT '',
    "audit_type"   VARCHAR(50 char)         NOT NULL DEFAULT '',
    "proc_def_key" VARCHAR(128 char)        NOT NULL DEFAULT '',
    "create_time"  datetime(0) NOT NULL DEFAULT current_timestamp(),
    "update_time"  datetime(0) NOT NULL DEFAULT current_timestamp(),
    CLUSTER PRIMARY KEY ("id")
    );

CREATE UNIQUE INDEX IF NOT EXISTS audit_process_bind_audit_type ON audit_process_bind("audit_type");

CREATE INDEX IF NOT EXISTS audit_process_bind_bind_id ON audit_process_bind("bind_id");

CREATE TABLE IF NOT EXISTS "developer"
(
    "id"             BIGINT  NOT NULL,
    "developer_id"   VARCHAR(255 char)        NOT NULL DEFAULT '',
    "developer_name" VARCHAR(255 char)        NOT NULL DEFAULT '',
    "contact_person" VARCHAR(255 char)        NOT NULL DEFAULT '',
    "contact_info"   VARCHAR(255 char)        NOT NULL DEFAULT '',
    "create_time"    datetime(0) NOT NULL DEFAULT current_timestamp(),
    "update_time"    datetime(0) NOT NULL DEFAULT current_timestamp(),
    "delete_time"    BIGINT  NOT NULL DEFAULT 0,
    CLUSTER PRIMARY KEY ("id")
    );

CREATE INDEX IF NOT EXISTS developer_developer_id ON developer("developer_id");

CREATE TABLE IF NOT EXISTS "file"
(
    "id"          BIGINT  NOT NULL,
    "file_id"     VARCHAR(255 char)        NOT NULL DEFAULT '',
    "file_name"   VARCHAR(255 char)        NOT NULL DEFAULT '',
    "file_type"   VARCHAR(255 char)        NOT NULL DEFAULT '',
    "file_path"   VARCHAR(255 char)        NOT NULL DEFAULT '',
    "file_size"   BIGINT  NOT NULL DEFAULT 0,
    "file_hash"   VARCHAR(255 char)        NOT NULL DEFAULT '',
    "create_time" datetime(0) NOT NULL DEFAULT current_timestamp(),
    "update_time" datetime(0) NOT NULL DEFAULT current_timestamp(),
    "delete_time" BIGINT  NOT NULL DEFAULT 0,
    CLUSTER PRIMARY KEY ("id")
    );

CREATE INDEX IF NOT EXISTS file_file_id ON file("file_id");

CREATE INDEX IF NOT EXISTS file_file_hash ON file("file_hash");

CREATE TABLE IF NOT EXISTS "service"
(
    "id"                   BIGINT  NOT NULL,
    "service_name"         VARCHAR(255 char)        NOT NULL DEFAULT '',
    "service_id"           VARCHAR(255 char)        NOT NULL DEFAULT '',
    "service_code"         VARCHAR(255 char)        NOT NULL DEFAULT '',
    "service_path"         VARCHAR(255 char)        NOT NULL DEFAULT '',
    "status"               VARCHAR(20 char)         NOT NULL DEFAULT 'notline',
    "publish_status"       VARCHAR(20 char)         NOT NULL DEFAULT 'unpublished',
    "audit_type"           VARCHAR(50 char)         NOT NULL DEFAULT 'unpublished',
    "audit_status"         VARCHAR(20 char)         NOT NULL DEFAULT 'unpublished',
    "apply_id"             VARCHAR(255 char)        NOT NULL DEFAULT '',
    "proc_def_key"         VARCHAR(128 char)        NOT NULL DEFAULT '',
    "audit_advice"         text,
    "online_audit_advice"  text                DEFAULT NULL,
    "backend_service_host" VARCHAR(255 char)        NOT NULL DEFAULT '',
    "backend_service_path" VARCHAR(255 char)        NOT NULL DEFAULT '',
    "department_id"        VARCHAR(255 char)        NOT NULL DEFAULT '',
    "department_name"      text,
    "owner_id"             text      ,
    "owner_name"           text      ,
    "subject_domain_id"    VARCHAR(255 char)        NOT NULL DEFAULT '',

    "subject_domain_name"  VARCHAR(255 char)        NOT NULL DEFAULT '',
    "create_model"         VARCHAR(10 char)         NOT NULL DEFAULT '',
    "http_method"          VARCHAR(10 char)         NOT NULL DEFAULT '',
    "return_type"          VARCHAR(10 char)         NOT NULL DEFAULT '',
    "protocol"             VARCHAR(10 char)         NOT NULL DEFAULT '',
    "file_id"              VARCHAR(255 char)        NOT NULL DEFAULT '',
    "description"         text  ,
    "developer_id"         VARCHAR(255 char)        NOT NULL DEFAULT '',
    "developer_name"       VARCHAR(255 char)        NOT NULL DEFAULT '',
    "rate_limiting"        INT     NOT NULL DEFAULT 0,
    "timeout"              INT     NOT NULL DEFAULT 0,
    "service_type"         VARCHAR(20 char)         NOT NULL DEFAULT '',
    "flow_id"              VARCHAR(50 char)         NOT NULL DEFAULT '',
    "flow_name"            VARCHAR(200 char)        NOT NULL DEFAULT '',
    "flow_node_id"         VARCHAR(50 char)         NOT NULL DEFAULT '',
    "flow_node_name"       VARCHAR(200 char)        NOT NULL DEFAULT '',
    "changed_service_id"   VARCHAR(36 char)                     DEFAULT NULL,
    "is_changed"           VARCHAR(1 char)          NOT NULL DEFAULT '0',
    "online_time"          datetime(0) DEFAULT NULL,
    "publish_time"         datetime(0) DEFAULT NULL,
    "create_time"          datetime(0) NOT NULL DEFAULT current_timestamp(),
    "created_by"           VARCHAR(50 char)         NOT NULL DEFAULT '',
    "update_time"          datetime(0) NOT NULL DEFAULT current_timestamp(),
    "update_by"            VARCHAR(50 char)                  DEFAULT NULL,
    "delete_time"          BIGINT  NOT NULL DEFAULT 0,
    "info_system_id"       VARCHAR(36 char)                     DEFAULT NULL ,
    "apps_id"              VARCHAR(36 char)                     DEFAULT NULL ,
    "sync_flag"            varchar(64 char)                  DEFAULT NULL ,
    "sync_msg"             text            ,
    "update_flag"          varchar(64 char)                  DEFAULT NULL,
    "update_msg"           text            ,
    "paas_id"              varchar(255 char)                  DEFAULT NULL,
    "pre_path"             varchar(255 char)                  DEFAULT NULL,
    "source_type"          int             NOT NULL DEFAULT 0,
    CLUSTER PRIMARY KEY ("id")
    );


CREATE UNIQUE INDEX IF NOT EXISTS service_service_id ON service("service_id", "delete_time");

CREATE UNIQUE INDEX IF NOT EXISTS service_service_code ON service("service_code", "delete_time");

CREATE INDEX IF NOT EXISTS service_service_name ON service("service_name");

CREATE INDEX IF NOT EXISTS service_status ON service("status");

CREATE INDEX IF NOT EXISTS service_department_id ON service("department_id");

CREATE INDEX IF NOT EXISTS service_subject_domain_id ON service("subject_domain_id");

CREATE INDEX IF NOT EXISTS service_create_time ON service("create_time");

CREATE INDEX IF NOT EXISTS service_audit_type ON service("audit_type");

CREATE INDEX IF NOT EXISTS service_audit_status ON service("audit_status");

CREATE INDEX IF NOT EXISTS service_apply_id ON service("apply_id");

CREATE TABLE IF NOT EXISTS "service_apply"
(
    "id"           BIGINT  NOT NULL,
    "uid"          VARCHAR(50 char)         NOT NULL DEFAULT '',
    "service_id"   VARCHAR(255 char)        NOT NULL DEFAULT '',
    "apply_days"   INT     NOT NULL DEFAULT 0,
    "apply_reason" VARCHAR(800 char)        NOT NULL DEFAULT '',
    "apply_id"     VARCHAR(255 char)        NOT NULL DEFAULT '',
    "audit_type"   VARCHAR(100 char)        NOT NULL DEFAULT '',
    "audit_status" VARCHAR(20 char)         NOT NULL DEFAULT '',
    "flow_id"      VARCHAR(50 char)         NOT NULL DEFAULT '',
    "proc_def_key" VARCHAR(128 char)        NOT NULL DEFAULT '',
    "auth_time"    datetime(0) DEFAULT NULL,
    "expired_time" datetime(0) DEFAULT NULL,
    "create_time"  datetime(0) NOT NULL DEFAULT current_timestamp(),
    "update_time"  datetime(0) NOT NULL DEFAULT current_timestamp(),
    CLUSTER PRIMARY KEY ("id")
    );

CREATE UNIQUE INDEX IF NOT EXISTS service_apply_apply ON service_apply("uid", "service_id", "apply_id");

CREATE INDEX IF NOT EXISTS service_apply_audit_status ON service_apply("audit_status");

CREATE INDEX IF NOT EXISTS service_apply_create_time ON service_apply("create_time");

CREATE TABLE IF NOT EXISTS "service_data_source"
(
    "id"               BIGINT  NOT NULL,
    "service_id"       VARCHAR(255 char)        NOT NULL DEFAULT '',
    "data_view_id"     VARCHAR(255 char)        NOT NULL DEFAULT '',
    "data_view_name"   VARCHAR(255 char)        NOT NULL DEFAULT '',
    "catalog_name"     VARCHAR(255 char)        NOT NULL DEFAULT '',
    "data_source_id"   VARCHAR(255 char)        NOT NULL DEFAULT '',
    "data_source_name" VARCHAR(255 char)        NOT NULL DEFAULT '',
    "data_schema_id"   VARCHAR(255 char)        NOT NULL DEFAULT '',
    "data_schema_name" VARCHAR(255 char)        NOT NULL DEFAULT '',
    "data_table_id"    VARCHAR(255 char)        NOT NULL DEFAULT '',
    "data_table_name"  VARCHAR(255 char)        NOT NULL DEFAULT '',
    "create_time"      datetime(0) NOT NULL DEFAULT current_timestamp(),
    "update_time"      datetime(0) NOT NULL DEFAULT current_timestamp(),
    "delete_time"      BIGINT  NOT NULL DEFAULT 0,
    CLUSTER PRIMARY KEY ("id")
    );

CREATE INDEX IF NOT EXISTS service_data_source_service_id ON service_data_source("service_id");

CREATE INDEX IF NOT EXISTS service_data_source_data_view_id ON service_data_source("data_view_id");

CREATE TABLE IF NOT EXISTS "service_gateway"
(
    "id"          BIGINT  NOT NULL,
    "gateway_url" VARCHAR(255 char)        NOT NULL DEFAULT '',
    "create_time" datetime(0) NOT NULL DEFAULT current_timestamp(),
    "update_time" datetime(0) NOT NULL DEFAULT current_timestamp(),
    CLUSTER PRIMARY KEY ("id")
    );

CREATE TABLE IF NOT EXISTS "service_param"
(
    "id"            BIGINT  NOT NULL,
    "service_id"    VARCHAR(255 char)        NOT NULL DEFAULT '',
    "param_type"    VARCHAR(10 char)         NOT NULL DEFAULT '',
    "cn_name"       VARCHAR(255 char)        NOT NULL DEFAULT '',
    "en_name"       VARCHAR(255 char)        NOT NULL DEFAULT '',
    "alias_name"    VARCHAR(255 char)        NOT NULL DEFAULT '',
    "description"   VARCHAR(255 char)        NOT NULL DEFAULT '',
    "data_type"     VARCHAR(255 char)        NOT NULL DEFAULT '',
    "required"      VARCHAR(10 char)         NOT NULL DEFAULT '',
    "operator"      VARCHAR(10 char)         NOT NULL DEFAULT '',
    "default_value" VARCHAR(255 char)        NOT NULL DEFAULT '',
    "sequence"      INT     NOT NULL DEFAULT 0,
    "sort"          VARCHAR(10 char)         NOT NULL DEFAULT '',
    "masking"       VARCHAR(10 char)         NOT NULL DEFAULT '',
    "create_time"   datetime(0) NOT NULL DEFAULT current_timestamp(),
    "update_time"   datetime(0) NOT NULL DEFAULT current_timestamp(),
    "delete_time"   BIGINT  NOT NULL DEFAULT 0,
    CLUSTER PRIMARY KEY ("id")
    );

CREATE INDEX IF NOT EXISTS service_param_service_id ON service_param("service_id");

CREATE TABLE IF NOT EXISTS "service_response_filter"
(
    "id"          BIGINT  NOT NULL,
    "service_id"  VARCHAR(255 char)        NOT NULL DEFAULT '',
    "param"       VARCHAR(255 char)        NOT NULL DEFAULT '',
    "operator"    VARCHAR(10 char)         NOT NULL DEFAULT '',
    "value"       VARCHAR(255 char)        NOT NULL DEFAULT '',
    "create_time" datetime(0) NOT NULL DEFAULT current_timestamp(),
    "update_time" datetime(0) NOT NULL DEFAULT current_timestamp(),
    "delete_time" BIGINT  NOT NULL DEFAULT 0,
    CLUSTER PRIMARY KEY ("id")
    );

CREATE INDEX IF NOT EXISTS service_response_filter_service_id ON service_response_filter("service_id");

CREATE TABLE IF NOT EXISTS "service_script_model"
(
    "id"               BIGINT  NOT NULL,
    "service_id"       VARCHAR(255 char)        NOT NULL DEFAULT '',
    "script"          text  ,
    "page"             VARCHAR(10 char)         NOT NULL DEFAULT '',
    "page_size"        INT     NOT NULL DEFAULT 0,
    "request_example" text  ,
    "response_example"text  ,
    "create_time"      datetime(0) NOT NULL DEFAULT current_timestamp(),
    "update_time"      datetime(0) NOT NULL DEFAULT current_timestamp(),
    "delete_time"      BIGINT  NOT NULL DEFAULT 0,
    CLUSTER PRIMARY KEY ("id")
    );

CREATE UNIQUE INDEX IF NOT EXISTS service_script_model_service_id ON service_script_model("delete_time","service_id");

CREATE TABLE IF NOT EXISTS "service_stats_info"
(
    "id"          BIGINT  NOT NULL,
    "service_id"  VARCHAR(255 char)        NOT NULL DEFAULT '',
    "apply_num"   BIGINT  NOT NULL DEFAULT 0,
    "preview_num" BIGINT  NOT NULL DEFAULT 0,
    "create_time" datetime(0) NOT NULL DEFAULT current_timestamp(),
    "update_time" datetime(0) NOT NULL DEFAULT current_timestamp(),
    CLUSTER PRIMARY KEY ("id")
    );

CREATE UNIQUE INDEX IF NOT EXISTS service_stats_info_service_id ON service_stats_info("service_id");

CREATE TABLE IF NOT EXISTS  "cdc_task" (
    "database" VARCHAR(255 char) NOT NULL,
    "table" VARCHAR(255 char) NOT NULL,
    "columns" VARCHAR(255 char) NOT NULL,
    "topic" VARCHAR(255 char) NOT NULL,
    "group_id" VARCHAR(255 char) NOT NULL,
    "id" VARCHAR(255 char) NOT NULL,
    "updated_at" datetime(3) NOT NULL,
    CLUSTER PRIMARY KEY ("id")
    );


CREATE TABLE IF NOT EXISTS  "service_daily_record" (
    "f_id" BIGINT NOT NULL,
    "service_id" VARCHAR(255 char) NOT NULL,
    "service_name" VARCHAR(255 char) DEFAULT NULL,
    "service_department_id" VARCHAR(255 char) DEFAULT NULL,
    "service_department_name" VARCHAR(255 char) DEFAULT NULL,
    "service_type" VARCHAR(20 char) DEFAULT NULL,
    "record_date" DATE NOT NULL,
    "success_count" INT DEFAULT 0,
    "fail_count" INT DEFAULT 0,
    "online_count" INT DEFAULT 0,
    "apply_count" INT DEFAULT 0,
    CLUSTER PRIMARY KEY ("f_id")
    );

CREATE UNIQUE INDEX IF NOT EXISTS service_daily_record_uniq_service_date ON service_daily_record("service_id", "record_date");



CREATE TABLE IF NOT EXISTS "service_category_relation" (
    "id" BIGINT NOT NULL,
    "category_id" VARCHAR(36 char) NOT NULL,
    "category_node_id" VARCHAR(36 char)  DEFAULT NULL ,
    "service_id" VARCHAR(255 char) NOT NULL,
    "deleted_at" BIGINT NOT NULL DEFAULT 0,
    CLUSTER PRIMARY KEY ("id")
    );


-- 子接口，接口限定规则
CREATE TABLE IF NOT EXISTS "sub_service" (
                                             "snowflake_id"  BIGINT        NOT NULL ,
                                             "id"            VARCHAR(36 char)      NOT NULL ,
    "name"          VARCHAR(255 char)  NOT NULL,
    "service_id"    VARCHAR(36 char)      NOT NULL ,
    "auth_scope_id" VARCHAR(36 char)      NOT NULL  ,

    "row_filter_clause" TEXT          NOT NULL  ,
    "detail"        BLOB          NOT NULL  ,
    "created_at"    DATETIME(3)   NOT NULL  DEFAULT CURRENT_TIMESTAMP(3),
    "updated_at"    DATETIME(3)   NOT NULL  DEFAULT CURRENT_TIMESTAMP(3),
    "deleted_at"    BIGINT        NOT NULL  DEFAULT 0,
    CLUSTER PRIMARY KEY    ("snowflake_id")
    );
CREATE UNIQUE INDEX IF NOT EXISTS sub_service_idx ON sub_service("id");
CREATE INDEX IF NOT EXISTS sub_service_idx_sub_service_deleted_at ON sub_service("service_id", "deleted_at");


CREATE TABLE if not exists "service_authed_users" (
    "id" VARCHAR(36 char) NOT NULL,
    "service_id" VARCHAR(36 char) NOT NULL,
    "user_id" VARCHAR(36 char) NOT NULL ,
    CLUSTER PRIMARY KEY ("id")
    );

CREATE  INDEX IF NOT EXISTS service_authed_users_user_id_IDX ON service_authed_users("user_id","service_id");
CREATE INDEX IF NOT EXISTS service_authed_users_service_id_IDX ON service_authed_users("service_id","user_id");

CREATE TABLE IF NOT EXISTS "service_call_record" (
    "id" BIGINT NOT NULL,
    "service_id" VARCHAR(36 char) NOT NULL,
    "service_department_id" VARCHAR(36 char) NULL DEFAULT NULL,
    "service_system_id" VARCHAR(36 char) NULL DEFAULT NULL,
    "service_app_id" VARCHAR(36 char) NULL DEFAULT NULL,
    "remote_address" VARCHAR(255 char) NULL DEFAULT NULL,
    "forward_for" VARCHAR(255 char) NULL DEFAULT NULL,
    "user_identification" VARCHAR(255 char) NULL DEFAULT NULL,
    "call_department_id" VARCHAR(36 char) NULL DEFAULT NULL,
    "call_info_system_id" VARCHAR(36 char) NULL DEFAULT NULL,
    "call_app_id" VARCHAR(36 char) NULL DEFAULT NULL,
    "call_start_time" DATETIME NOT NULL,
    "call_end_time" DATETIME NULL DEFAULT NULL,
    "call_http_code" INT NULL DEFAULT NULL,
    "call_status" INT NULL DEFAULT 0,
    "error_message" TEXT NULL,
    "call_other_message" TEXT NULL,
    "record_time" DATETIME NULL DEFAULT NULL,
    CLUSTER PRIMARY KEY ("id")
    ) ;
CREATE INDEX IF NOT EXISTS service_call_record_service_id_IDX ON service_call_record("service_id");

CREATE TABLE IF NOT EXISTS gateway_collection_log (
    "id" INT  NOT NULl IDENTITY(1, 1),
    "collect_time" DATETIME,
    "svc_id" VARCHAR(50 char) NOT NULL,
    "svc_name" VARCHAR(50 char) NOT NULL,
    "svc_belong_dept_id" VARCHAR(50 char),
    "svc_belong_dept_name" VARCHAR(100 char),
    "invoke_svc_dept_id" VARCHAR(50 char),
    "invoke_svc_dept_name" VARCHAR(100 char),
    "invoke_system_id" VARCHAR(50 char),
    "invoke_app_id" VARCHAR(50 char),
    "invoke_ip_port" VARCHAR(50 char),
    "invoke_num" INT,
    "invoke_average_call_duration" INT,
    CLUSTER PRIMARY KEY ("id")
    ) ;