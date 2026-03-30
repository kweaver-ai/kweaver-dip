SET SCHEMA data_application_service;
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
    CLUSTER PRIMARY KEY                                               ("snowflake_id")
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
