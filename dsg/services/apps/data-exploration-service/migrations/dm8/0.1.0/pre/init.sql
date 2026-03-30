SET SCHEMA af_data_exploration;

CREATE TABLE if not exists "t_task_config" (
                                               "f_id" BIGINT  NOT NULL,
                                               "f_task_id" BIGINT  NOT NULL,
                                               "f_task_name" VARCHAR(256 char) DEFAULT NULL,
    "f_task_desc" VARCHAR(256 char) DEFAULT NULL,
    "f_version" INT DEFAULT 0,
    "f_version_state" TINYINT DEFAULT 0,
    "f_query_params" text DEFAULT NULL,
    "f_explore_type" TINYINT DEFAULT 0,
    "f_table" VARCHAR(256 char) DEFAULT NULL,
    "f_table_id" VARCHAR(256 char) DEFAULT NULL,
    "f_schema" VARCHAR(256 char) DEFAULT NULL,
    "f_ve_catalog" VARCHAR(256 char)  DEFAULT NULL,
    "f_total_sample" INT DEFAULT 0,
    "f_exec_status" INT DEFAULT 0,
    "f_exec_at" datetime(0) DEFAULT NULL,
    "f_enabled" TINYINT DEFAULT 0,
    "f_created_at" datetime(0) DEFAULT NULL,
    "f_created_by_uid" VARCHAR(64 char) DEFAULT NULL,
    "f_created_by_uname" VARCHAR(256 char) DEFAULT NULL,
    "f_updated_at" datetime(0) DEFAULT NULL,
    "f_updated_by_uid" VARCHAR(64 char) DEFAULT NULL,
    "f_updated_by_uname" VARCHAR(256 char) DEFAULT NULL,
    "f_deleted_at" datetime(0) DEFAULT NULL,
    "f_deleted_by_uid" VARCHAR(64 char) DEFAULT NULL,
    "f_deleted_by_uname" VARCHAR(256 char) DEFAULT NULL,
    "f_dv_task_id" VARCHAR(36 char) DEFAULT NULL,
    CLUSTER PRIMARY KEY ("f_id")
    );

CREATE INDEX IF NOT EXISTS t_task_config_idx_task_id ON t_task_config("f_task_id");



CREATE TABLE if not exists "t_report" (
                                          "f_id" BIGINT  NOT NULL,
                                          "f_code"  VARCHAR(256 char) DEFAULT NULL,
    "f_task_id" BIGINT  NOT NULL,
    "f_task_version" INT DEFAULT 0,
    "f_query_params" text DEFAULT NULL,
    "f_explore_type" TINYINT DEFAULT 0,
    "f_table" VARCHAR(256 char) DEFAULT NULL,
    "f_table_id" VARCHAR(256 char) DEFAULT NULL,
    "f_schema" VARCHAR(256 char) DEFAULT NULL,
    "f_ve_catalog" VARCHAR(256 char)  DEFAULT NULL,
    "f_total_sample" INT DEFAULT 0,
    "f_total_num" INT DEFAULT 0,
    "f_total_score" FLOAT DEFAULT NULL,
    "f_result" text DEFAULT NULL,
    "f_status" TINYINT DEFAULT 0,
    "f_latest" TINYINT NOT NULL DEFAULT 0,
    "f_created_at" datetime(0) DEFAULT NULL,
    "f_created_by_uid" VARCHAR(64 char) DEFAULT NULL,
    "f_created_by_uname" VARCHAR(256 char) DEFAULT NULL,
    "f_finished_at" datetime(0) DEFAULT NULL,
    "f_reason" text DEFAULT NULL,
    "f_dv_task_id" VARCHAR(36 char) DEFAULT NULL,
    "f_total_completeness" FLOAT DEFAULT NULL,
    "f_total_standardization" FLOAT DEFAULT NULL,
    "f_total_uniqueness" FLOAT DEFAULT NULL,
    "f_total_accuracy" FLOAT DEFAULT NULL,
    "f_total_consistency" FLOAT DEFAULT NULL,
    "f_deleted_at" datetime(3) DEFAULT NULL,
    CLUSTER PRIMARY KEY ("f_id")
    );

CREATE INDEX IF NOT EXISTS t_report_idx_task_id ON t_report("f_task_id");
CREATE INDEX IF NOT EXISTS t_report_idx_code ON t_report("f_code");

CREATE TABLE if not exists "t_report_item" (
                                               "f_id" BIGINT  NOT NULL,
                                               "f_code"  VARCHAR(256 char) DEFAULT NULL,
    "f_column" VARCHAR(256 char) DEFAULT NULL,
    "f_rule_id" VARCHAR(36 char) DEFAULT NULL ,
    "f_project"  VARCHAR(256 char) DEFAULT NULL,
    "f_params"  text DEFAULT NULL,
    "f_result" text DEFAULT NULL,
    "f_status" TINYINT DEFAULT 0,
    "f_created_at" datetime(0) DEFAULT NULL,
    "f_started_at" datetime(0) DEFAULT NULL,
    "f_finished_at" datetime(0) DEFAULT NULL,
    "f_sql" text DEFAULT NULL,
    "f_dimension_type" VARCHAR(20 char) DEFAULT NULL COMMENT '维度类型',
    CLUSTER PRIMARY KEY ("f_id")
    );

CREATE INDEX IF NOT EXISTS t_report_item_idx_code ON t_report_item("f_code");



CREATE TABLE IF NOT EXISTS "t_client_info" (
                                               "id" BIGINT  NOT NULL,
                                               "client_id" VARCHAR(36 char) NOT NULL,
    "client_secret" VARCHAR(128 char) NOT NULL,
    CLUSTER PRIMARY KEY ("id")
    );



CREATE TABLE if not exists "t_third_party_report" (
                                                      "f_id" BIGINT  NOT NULL,
                                                      "f_code" VARCHAR(256 char) DEFAULT NULL,
    "f_task_id" BIGINT  NOT NULL,
    "f_task_version" INT DEFAULT 0,
    "f_query_params" TEXT DEFAULT NULL,
    "f_explore_type" TINYINT DEFAULT 0,
    "f_table" VARCHAR(256 char) DEFAULT NULL,
    "f_table_id" VARCHAR(256 char) DEFAULT NULL,
    "f_schema" VARCHAR(256 char) DEFAULT NULL,
    "f_ve_catalog" VARCHAR(256 char) DEFAULT NULL,
    "f_total_sample" INT DEFAULT 0,
    "f_total_num" INT DEFAULT 0,
    "f_total_score" FLOAT DEFAULT NULL,
    "f_result" TEXT DEFAULT NULL,
    "f_status" TINYINT DEFAULT 0,
    "f_latest" TINYINT NOT NULL DEFAULT 0,
    "f_created_at" datetime(0) DEFAULT NULL,
    "f_created_by_uid" VARCHAR(64 char) DEFAULT NULL,
    "f_created_by_uname" VARCHAR(256 char) DEFAULT NULL,
    "f_finished_at" datetime(0) DEFAULT NULL,
    "f_reason" TEXT DEFAULT NULL,
    "f_work_order_id" VARCHAR(36 char) DEFAULT NULL,
    "f_total_completeness" FLOAT DEFAULT NULL,
    "f_total_standardization" FLOAT DEFAULT NULL,
    "f_total_uniqueness" FLOAT DEFAULT NULL,
    "f_total_accuracy" FLOAT DEFAULT NULL,
    "f_total_consistency" FLOAT DEFAULT NULL,
    CLUSTER PRIMARY KEY ("f_id")
    );

CREATE INDEX IF NOT EXISTS t_third_party_report_f_table_id ON t_third_party_report("f_table_id");
CREATE INDEX IF NOT EXISTS t_third_party_report_f_work_order_id ON t_third_party_report("f_work_order_id");
