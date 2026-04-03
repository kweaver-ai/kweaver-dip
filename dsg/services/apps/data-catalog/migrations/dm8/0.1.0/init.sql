SET SCHEMA af_data_catalog;

CREATE TABLE IF NOT EXISTS "t_business_logic_entity_by_business_domain" (
     "id" BIGINT  NOT NULL IDENTITY(1,1),
     "business_domain_id" VARCHAR(36 char) NOT NULL,
     "business_domain_name" VARCHAR(128 char) NOT NULL,
     "business_logic_entity_count" INT NOT NULL,
     CLUSTER PRIMARY KEY ("id")
    );


CREATE TABLE IF NOT EXISTS "t_business_logic_entity_by_department" (
    "id" BIGINT  NOT NULL IDENTITY(1,1),
    "department_id" VARCHAR(36 char) NOT NULL,
    "department_name" VARCHAR(255 char) NOT NULL,
    "business_logic_entity_count" INT NOT NULL,
    CLUSTER PRIMARY KEY ("id")
);


CREATE TABLE IF NOT EXISTS "t_catalog_code_sequence" (
    "id" BIGINT  NOT NULL  IDENTITY(1,1),
    "code_prefix" VARCHAR(40 char) NOT NULL,
    "order_code" int NOT NULL,
    "created_at" datetime(3) NOT NULL DEFAULT current_timestamp(3),
    "updated_at" datetime(3) DEFAULT NULL,
    CLUSTER PRIMARY KEY ("id")
   );

CREATE UNIQUE INDEX IF NOT EXISTS t_catalog_code_sequence_t_catalog_code_sequence_un ON t_catalog_code_sequence("code_prefix");



CREATE TABLE IF NOT EXISTS "t_catalog_code_title" (
    "id" BIGINT  NOT NULL  IDENTITY(1,1),
    "code" VARCHAR(50 char) NOT NULL,
    "title" VARCHAR(500 char) NOT NULL,
    CLUSTER PRIMARY KEY ("id")
    );

CREATE UNIQUE INDEX IF NOT EXISTS t_catalog_code_title_t_catalog_code_title_un ON t_catalog_code_title("title");
CREATE INDEX IF NOT EXISTS t_catalog_code_title_idx_catalog_code_title_code ON t_catalog_code_title("code");





CREATE TABLE IF NOT EXISTS "t_client_info" (
    "id" BIGINT  NOT NULL  IDENTITY(1,1),
    "client_id" VARCHAR(36 char) NOT NULL,
    "client_secret" VARCHAR(128 char) NOT NULL,
    CLUSTER PRIMARY KEY ("id")
    );





CREATE TABLE IF NOT EXISTS "t_data_assets_info" (
     "id" BIGINT  NOT NULL  IDENTITY(1,1),
     "business_domain_count" INT NOT NULL,
     "subject_domain_count" INT NOT NULL,
     "business_object_count" INT NOT NULL,
     "business_logic_entity_count" INT NOT NULL,
     "business_attributes_count" INT NOT NULL,
     CLUSTER PRIMARY KEY ("id")
    );





CREATE TABLE IF NOT EXISTS "t_data_catalog" (
    "id" BIGINT  NOT NULL  IDENTITY(1,1),
    "code" VARCHAR(50 char) NOT NULL,
    "title" VARCHAR(500 char) NOT NULL,
    "group_id" BIGINT  NOT NULL DEFAULT 0,
    "group_name" VARCHAR(128 char) NOT NULL DEFAULT '',
    "theme_id" BIGINT  DEFAULT NULL,
    "theme_name" VARCHAR(100 char) DEFAULT NULL,
    "forward_version_id" BIGINT  DEFAULT NULL,
    "description" VARCHAR(1000 char) DEFAULT NULL,
    "data_range" TINYINT DEFAULT NULL,
    "update_cycle" TINYINT DEFAULT NULL,
    "data_kind" TINYINT NOT NULL,
    "shared_type" TINYINT NOT NULL,
    "shared_condition" VARCHAR(255 char) DEFAULT NULL,
    "column_unshared" TINYINT NOT NULL,
    "open_type" TINYINT NOT NULL,
    "open_condition" VARCHAR(255 char) DEFAULT NULL,
    "shared_mode" TINYINT NOT NULL,
    "physical_deletion" TINYINT DEFAULT NULL,
    "sync_mechanism" TINYINT DEFAULT NULL,
    "sync_frequency" VARCHAR(128 char) DEFAULT NULL,
    "view_count" SMALLINT NOT NULL DEFAULT 0,
    "api_count" SMALLINT NOT NULL DEFAULT 0,
    "file_count" SMALLINT NOT NULL DEFAULT 0,
    "flow_node_id" VARCHAR(50 char) DEFAULT NULL,
    "flow_node_name" VARCHAR(200 char) DEFAULT NULL,
    "flow_id" VARCHAR(50 char) DEFAULT NULL,
    "flow_name" VARCHAR(200 char) DEFAULT NULL,
    "flow_version" VARCHAR(10 char) DEFAULT NULL,
    "department_id" VARCHAR(36 char) NOT NULL,
    "created_at" datetime(3) NOT NULL DEFAULT current_timestamp(3),
    "creator_uid" VARCHAR(50 char) NOT NULL DEFAULT '',
    "updated_at" datetime(3) DEFAULT NULL,
    "updater_uid" VARCHAR(50 char) DEFAULT NULL,
    "source" TINYINT NOT NULL DEFAULT 1,
    "table_type" TINYINT DEFAULT NULL,
    "current_version" TINYINT NOT NULL DEFAULT 1,
    "publish_flag" TINYINT NOT NULL DEFAULT 0,
    "data_kind_flag" TINYINT NOT NULL DEFAULT 0,
    "label_flag" TINYINT NOT NULL DEFAULT 0,
    "src_event_flag" TINYINT NOT NULL DEFAULT 0,
    "rel_event_flag" TINYINT NOT NULL DEFAULT 0,
    "system_flag" TINYINT NOT NULL DEFAULT 0,
    "rel_catalog_flag" TINYINT NOT NULL DEFAULT 0,
    "published_at" datetime(3) DEFAULT NULL,
    "is_indexed" TINYINT DEFAULT NULL,
    "audit_apply_sn" BIGINT  NOT NULL DEFAULT 0,
    "audit_advice" text null,
    "owner_id" VARCHAR(50 char) NOT NULL DEFAULT '',
    "owner_name" VARCHAR(128 char) NOT NULL DEFAULT '',
    "is_canceled" TINYINT DEFAULT NULL,
    "proc_def_key" VARCHAR(128 char) NOT NULL DEFAULT '',
    "flow_apply_id" VARCHAR(50 char) DEFAULT '',
    "online_status" VARCHAR(20 char) NOT NULL DEFAULT 'notline',
    "online_time" datetime(0) DEFAULT NULL,
    "audit_type" VARCHAR(50 char) NOT NULL DEFAULT 'unpublished',
    "audit_state" TINYINT DEFAULT NULL,
    "publish_status" VARCHAR(20 char) NOT NULL DEFAULT 'unpublished',
    "app_scene_classify" TINYINT DEFAULT NULL,
    "source_department_id" VARCHAR(36 char) NOT NULL,
    "data_related_matters" VARCHAR(255 char) NOT NULL,
    "business_matters" text NOT NULL,
    "data_classify" VARCHAR(50 char) NOT NULL,
    "data_domain" TINYINT,
    "data_level" TINYINT,
    "time_range" VARCHAR(100 char),
    "provider_channel" TINYINT,
    "administrative_code" TINYINT,
    "central_department_code" TINYINT,
    "processing_level" VARCHAR(100 char),
    "catalog_tag" TINYINT,
    "is_electronic_proof" TINYINT,
    "other_app_scene_classify" VARCHAR(100 char),
    "other_update_cycle" VARCHAR(100 char),
    "draft_id" BIGINT  NOT NULL DEFAULT 0,
    "apply_num" INT NOT NULL,
    "explore_job_id" VARCHAR(64 char) DEFAULT NULL ,
    "explore_job_version" INT DEFAULT NULL,
    "operation_authorized" TINYINT,
    "is_import" TINYINT DEFAULT 0 ,
    CLUSTER PRIMARY KEY ("id")
    );



CREATE TABLE IF NOT EXISTS "t_data_catalog_audit_flow_bind" (
    "id" BIGINT  NOT NULL  IDENTITY(1,1),
    "audit_type" VARCHAR(128 char) NOT NULL,
    "proc_def_key" VARCHAR(128 char) NOT NULL,
    "created_at" datetime(3) NOT NULL DEFAULT current_timestamp(3),
    "creator_uid" VARCHAR(50 char) NOT NULL DEFAULT '',
    "updated_at" datetime(3) DEFAULT NULL,
    "updater_uid" VARCHAR(50 char) DEFAULT NULL,
    CLUSTER PRIMARY KEY ("id")
    );

CREATE UNIQUE INDEX IF NOT EXISTS t_data_catalog_audit_flow_bind_t_data_catalog_audit_flow_bind_un ON t_data_catalog_audit_flow_bind("audit_type");



CREATE TABLE IF NOT EXISTS "t_data_catalog_column" (
    "primary_id" INT  NOT NULL IDENTITY(1, 1),
    "id" BIGINT  NOT NULL,
    "catalog_id" BIGINT  NOT NULL,
    "technical_name" VARCHAR(255 char) NOT NULL,
    "business_name" VARCHAR(255 char) DEFAULT NULL,
    "source_id" VARCHAR(36 char) NOT NULL,
    "data_format" TINYINT DEFAULT NULL,
    "data_length" TINYINT DEFAULT NULL,
    "data_precision" TINYINT DEFAULT NULL,
    "ranges" VARCHAR(200 char) DEFAULT NULL,
    "shared_type" TINYINT DEFAULT NULL,
    "open_type" TINYINT DEFAULT NULL,
    "timestamp_flag" TINYINT DEFAULT NULL,
    "primary_flag" TINYINT DEFAULT NULL,
    "null_flag" TINYINT DEFAULT NULL,
    "classified_flag" TINYINT DEFAULT NULL,
    "sensitive_flag" TINYINT DEFAULT NULL,
    "description" VARCHAR(2048 char) NOT NULL DEFAULT '',
    "shared_condition" VARCHAR(255 char) DEFAULT NULL,
    "open_condition" VARCHAR(255 char) DEFAULT NULL,
    "ai_description" VARCHAR(2048 char) DEFAULT '',
    "standard_code" VARCHAR(30 char) NULL,
    "code_table_id" VARCHAR(30 char) NULL,
    "source_system" VARCHAR(255 char) NULL,
    "source_system_level" TINYINT NULL,
    "info_item_level" TINYINT NULL,
    "index" INT NOT NULL,
    CLUSTER PRIMARY KEY ("primary_id")
    );


CREATE INDEX IF NOT EXISTS t_data_catalog_column_id_key ON t_data_catalog_column("id");
CREATE UNIQUE INDEX IF NOT EXISTS t_data_catalog_column_t_data_catalog_column_un ON t_data_catalog_column("catalog_id","technical_name");



CREATE TABLE IF NOT EXISTS "t_data_catalog_column_history" (
    "primary_id" INT  NOT NULL ,
    "id" BIGINT  NOT NULL,
    "catalog_id" BIGINT  NOT NULL,
    "technical_name" VARCHAR(255 char) NOT NULL,
    "business_name" VARCHAR(255 char) DEFAULT NULL,
    "source_id" VARCHAR(36 char) NOT NULL,
    "data_format" TINYINT DEFAULT NULL,
    "data_length" TINYINT DEFAULT NULL,
    "data_precision" TINYINT DEFAULT NULL,
    "ranges" VARCHAR(200 char) DEFAULT NULL,
    "shared_type" TINYINT DEFAULT NULL,
    "open_type" TINYINT DEFAULT NULL,
    "timestamp_flag" TINYINT DEFAULT NULL,
    "primary_flag" TINYINT DEFAULT NULL,
    "null_flag" TINYINT DEFAULT NULL,
    "classified_flag" TINYINT DEFAULT NULL,
    "sensitive_flag" TINYINT DEFAULT NULL,
    "description" VARCHAR(2048 char) NOT NULL DEFAULT '',
    "shared_condition" VARCHAR(255 char) DEFAULT NULL,
    "open_condition" VARCHAR(255 char) DEFAULT NULL,
    "ai_description" VARCHAR(2048 char) DEFAULT '',
    "standard_code" VARCHAR(30 char) NULL,
    "code_table_id" VARCHAR(30 char) NULL,
    "source_system" VARCHAR(255 char) NULL,
    "source_system_level" TINYINT NULL,
    "info_item_level" TINYINT NULL,
    "index" INT NOT NULL,
    CLUSTER PRIMARY KEY ("primary_id")
);



CREATE TABLE IF NOT EXISTS "t_data_catalog_download_apply" (
    "id" BIGINT  NOT NULL IDENTITY(1, 1),
    "uid" VARCHAR(50 char) NOT NULL,
    "code" VARCHAR(50 char) NOT NULL,
    "apply_days" TINYINT NOT NULL,
    "apply_reason" VARCHAR(800 char) NOT NULL,
    "audit_apply_sn" BIGINT  NOT NULL DEFAULT 0,
    "audit_type" VARCHAR(100 char) NOT NULL DEFAULT 'af-data-catalog-download',
    "state" TINYINT NOT NULL DEFAULT 1,
    "created_at" datetime(0) NOT NULL DEFAULT current_timestamp(),
    "updated_at" datetime(0) NOT NULL DEFAULT current_timestamp(),
    "flow_id" VARCHAR(50 char) DEFAULT NULL,
    "proc_def_key" VARCHAR(128 char) NOT NULL DEFAULT '',
    "flow_apply_id" VARCHAR(50 char) DEFAULT '',
    CLUSTER PRIMARY KEY ("id")
    );

CREATE UNIQUE INDEX IF NOT EXISTS t_data_catalog_download_apply_t_data_catalog_download_apply_un
    ON t_data_catalog_download_apply(  "code","uid","audit_apply_sn");





CREATE TABLE IF NOT EXISTS "t_data_catalog_history" (
    "id" BIGINT  NOT NULL  IDENTITY(1, 1),
    "code" VARCHAR(50 char) NOT NULL,
    "title" VARCHAR(500 char) NOT NULL,
    "group_id" BIGINT  NOT NULL DEFAULT 0,
    "group_name" VARCHAR(128 char) NOT NULL DEFAULT '',
    "theme_id" BIGINT  DEFAULT NULL,
    "theme_name" VARCHAR(100 char) DEFAULT NULL,
    "forward_version_id" BIGINT  DEFAULT NULL,
    "description" VARCHAR(1000 char) DEFAULT NULL,
    "data_range" TINYINT DEFAULT NULL,
    "update_cycle" TINYINT DEFAULT NULL,
    "data_kind" TINYINT NOT NULL,
    "shared_type" TINYINT NOT NULL,
    "shared_condition" VARCHAR(255 char) DEFAULT NULL,
    "column_unshared" TINYINT NOT NULL,
    "open_type" TINYINT NOT NULL,
    "open_condition" VARCHAR(255 char) DEFAULT NULL,
    "shared_mode" TINYINT NOT NULL,
    "physical_deletion" TINYINT DEFAULT NULL,
    "sync_mechanism" TINYINT DEFAULT NULL,
    "sync_frequency" VARCHAR(128 char) DEFAULT NULL ,
    "view_count" SMALLINT NOT NULL DEFAULT 0,
    "api_count" SMALLINT NOT NULL DEFAULT 0,
    "file_count" SMALLINT NOT NULL DEFAULT 0,
    "flow_node_id" VARCHAR(50 char) DEFAULT NULL,
    "flow_node_name" VARCHAR(200 char) DEFAULT NULL,
    "flow_id" VARCHAR(50 char) DEFAULT NULL,
    "flow_name" VARCHAR(200 char) DEFAULT NULL,
    "flow_version" VARCHAR(10 char) DEFAULT NULL,
    "department_id" VARCHAR(36 char) NOT NULL,
    "created_at" datetime(3) NOT NULL DEFAULT current_timestamp(3),
    "creator_uid" VARCHAR(50 char) NOT NULL DEFAULT '',
    "updated_at" datetime(3) DEFAULT NULL,
    "updater_uid" VARCHAR(50 char) DEFAULT NULL,
    "source" TINYINT NOT NULL DEFAULT 1,
    "table_type" TINYINT DEFAULT NULL,
    "current_version" TINYINT NOT NULL DEFAULT 1,
    "publish_flag" TINYINT NOT NULL DEFAULT 0,
    "data_kind_flag" TINYINT NOT NULL DEFAULT 0,
    "label_flag" TINYINT NOT NULL DEFAULT 0,
    "src_event_flag" TINYINT NOT NULL DEFAULT 0,
    "rel_event_flag" TINYINT NOT NULL DEFAULT 0,
    "system_flag" TINYINT NOT NULL DEFAULT 0,
    "rel_catalog_flag" TINYINT NOT NULL DEFAULT 0,
    "published_at" datetime(3) DEFAULT NULL,
    "is_indexed" TINYINT DEFAULT NULL,
    "audit_apply_sn" BIGINT  NOT NULL DEFAULT 0,
    "audit_advice" text null,
    "owner_id" VARCHAR(50 char) NOT NULL DEFAULT '',
    "owner_name" VARCHAR(128 char) NOT NULL DEFAULT '',
    "is_canceled" TINYINT DEFAULT NULL,
    "proc_def_key" VARCHAR(128 char) NOT NULL DEFAULT '',
    "flow_apply_id" VARCHAR(50 char) DEFAULT '',
    "online_status" VARCHAR(20 char) NOT NULL DEFAULT 'notline',
    "online_time" datetime(0) DEFAULT NULL,
    "audit_type" VARCHAR(50 char) NOT NULL DEFAULT 'unpublished',
    "audit_state" TINYINT DEFAULT NULL,
    "publish_status" VARCHAR(20 char) NOT NULL DEFAULT 'unpublished',
    "app_scene_classify" TINYINT DEFAULT NULL,
    "source_department_id" VARCHAR(36 char) NOT NULL,
    "data_related_matters" VARCHAR(255 char) NOT NULL,
    "business_matters" text NOT NULL,
    "data_classify" VARCHAR(50 char) NOT NULL,
    "data_domain" TINYINT,
    "data_level" TINYINT,
    "time_range" VARCHAR(100 char),
    "provider_channel" TINYINT,
    "administrative_code" TINYINT,
    "central_department_code" TINYINT,
    "processing_level" VARCHAR(100 char),
    "catalog_tag" TINYINT,
    "is_electronic_proof" TINYINT,
    "other_app_scene_classify" VARCHAR(100 char),
    "other_update_cycle" VARCHAR(100 char),
    "draft_id" BIGINT  NOT NULL DEFAULT 0,
    "apply_num" INT NOT NULL,
    "explore_job_id" VARCHAR(64 char) DEFAULT NULL ,
    "explore_job_version" INT DEFAULT NULL,
    "operation_authorized" TINYINT,
    "is_import" TINYINT DEFAULT 0 ,
    CLUSTER PRIMARY KEY ("id")
    );


CREATE TABLE IF NOT EXISTS "t_data_catalog_info" (
    "id" BIGINT  NOT NULL  IDENTITY(1, 1),
    "catalog_id" BIGINT  NOT NULL,
    "info_type" TINYINT NOT NULL,
    "info_key" VARCHAR(50 char) NOT NULL,
    "info_value" VARCHAR(1000 char) NOT NULL,
    CLUSTER PRIMARY KEY ("id")
    );

CREATE UNIQUE INDEX IF NOT EXISTS t_data_catalog_info_t_data_catalog_info_un
    ON t_data_catalog_info("catalog_id","info_type","info_key");


CREATE TABLE IF NOT EXISTS "t_data_catalog_info_history" (
        "id" BIGINT  NOT NULL,
        "catalog_id" BIGINT  NOT NULL,
        "info_type" TINYINT NOT NULL,
        "info_key" VARCHAR(50 char) NOT NULL,
        "info_value" VARCHAR(1000 char) NOT NULL,
    CLUSTER PRIMARY KEY ("id")
    );



CREATE TABLE IF NOT EXISTS "t_data_catalog_stats_info" (
    "id" BIGINT  NOT NULL IDENTITY(1,1),
    "code" VARCHAR(50 char) NOT NULL,
    "apply_num" INT  NOT NULL DEFAULT 0,
    "preview_num" INT  NOT NULL DEFAULT 0,
    "created_at" datetime(0) NOT NULL DEFAULT current_timestamp(),
    "updated_at" datetime(0) NOT NULL DEFAULT current_timestamp(),
    CLUSTER PRIMARY KEY ("id")
    );

CREATE UNIQUE INDEX IF NOT EXISTS t_data_catalog_stats_info_t_data_catalog_stats_info_un ON t_data_catalog_stats_info("code");





CREATE TABLE IF NOT EXISTS "t_data_comprehension_details" (
    "catalog_id" BIGINT  NOT NULL IDENTITY(1,1),
    "template_id" VARCHAR(36 char) NOT NULL,
    "task_id" VARCHAR(36 char) NOT NULL,
    "code" VARCHAR(50 char) NOT NULL,
    "status" TINYINT DEFAULT 1,
    "details" text null,
    "mark" TINYINT DEFAULT 1,
    "created_at" datetime(3) NOT NULL DEFAULT current_timestamp(3),
    "creator_uid" VARCHAR(50 char) NOT NULL DEFAULT '',
    "creator_name" VARCHAR(128 char) NOT NULL DEFAULT '',
    "updated_at" datetime(3) DEFAULT NULL,
    "updater_uid" VARCHAR(50 char) DEFAULT NULL,
    "apply_id" BIGINT NOT NULL,
    "proc_def_key" VARCHAR(128 char) NOT NULL DEFAULT '',
    "audit_advice" TEXT,
    "updater_name" VARCHAR(128 char) DEFAULT NULL,
    "deleted_at" BIGINT NOT NULL DEFAULT 0,
    CLUSTER PRIMARY KEY ("catalog_id")
    );


CREATE TABLE IF NOT EXISTS "t_standardization_info" (
    "id" BIGINT  NOT NULL  IDENTITY(1,1),
    "business_domain_id" VARCHAR(36 char) NOT NULL,
    "business_domain_name" VARCHAR(128 char) NOT NULL,
    "standardized_fields" INT NOT NULL,
    "total_fields" INT NOT NULL,
    CLUSTER PRIMARY KEY ("id")
    );





CREATE TABLE IF NOT EXISTS "t_user_data_catalog_rel" (
    "id" BIGINT  NOT NULL  IDENTITY(1,1),
    "uid" VARCHAR(50 char) NOT NULL,
    "code" VARCHAR(50 char) NOT NULL,
    "apply_id" BIGINT  NOT NULL,
    "created_at" datetime(0) NOT NULL DEFAULT current_timestamp(),
    "updated_at" datetime(0) NOT NULL DEFAULT current_timestamp(),
    "expired_at" datetime(0) DEFAULT NULL,
    "expired_flag" TINYINT NOT NULL,
    CLUSTER PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS t_user_data_catalog_rel_t_user_data_catalog_rel_un ON t_user_data_catalog_rel("code", "uid", "apply_id");





CREATE TABLE IF NOT EXISTS "t_user_data_catalog_stats_info" (
    "id" BIGINT  NOT NULL  IDENTITY(1,1),
    "code" VARCHAR(50 char) NOT NULL,
    "user_id" VARCHAR(50 char) NOT NULL,
    "preview_num" INT NOT NULL DEFAULT 0,
    "created_at" datetime(0) NOT NULL DEFAULT current_timestamp(),
    "updated_at" datetime(0) NOT NULL DEFAULT current_timestamp(),
    CLUSTER PRIMARY KEY ("id")
    );

CREATE UNIQUE INDEX IF NOT EXISTS t_user_data_catalog_stats_info_uk_code_userid ON t_user_data_catalog_stats_info("code", "user_id");



CREATE TABLE IF NOT EXISTS "tree_info" (
    "id" BIGINT  NOT NULL  IDENTITY(1,1),
    "name" VARCHAR(128 char) NOT NULL DEFAULT '',
    "root_node_id" BIGINT  NOT NULL,
    "created_at" datetime(0) NOT NULL DEFAULT current_timestamp(),
    "created_by_uid" VARCHAR(36 char) NOT NULL DEFAULT '',
    "updated_at" datetime(0) NOT NULL DEFAULT current_timestamp(),
    "updated_by_uid" VARCHAR(36 char) NOT NULL DEFAULT '',
    "deleted_at" BIGINT NOT NULL DEFAULT 0,
    CLUSTER PRIMARY KEY ("id")
    );

CREATE UNIQUE INDEX IF NOT EXISTS tree_info_ux_deleted_at_name ON tree_info("deleted_at", "name");
CREATE INDEX IF NOT EXISTS tree_info_ix_created_at ON tree_info("created_at");





CREATE TABLE IF NOT EXISTS "tree_node" (
    "id" BIGINT  NOT NULL  IDENTITY(1,1),
    "tree_id" BIGINT  NOT NULL,
    "parent_id" BIGINT  NOT NULL DEFAULT 0,
    "name" VARCHAR(128 char) NOT NULL DEFAULT '',
    "describe" VARCHAR(512 char) NOT NULL DEFAULT '',
    "category_num" VARCHAR(36 char) NOT NULL DEFAULT '',
    "mgm_dep_id" VARCHAR(36 char) NOT NULL DEFAULT '',
    "mgm_dep_name" VARCHAR(128 char) NOT NULL DEFAULT '',
    "sort_weight" BIGINT  NOT NULL,
    "created_at" datetime(0) NOT NULL DEFAULT current_timestamp(),
    "created_by_uid" VARCHAR(36 char) NOT NULL DEFAULT '',
    "updated_at" datetime(0) NOT NULL DEFAULT current_timestamp(),
    "updated_by_uid" VARCHAR(36 char) NOT NULL DEFAULT '',
    "deleted_at" BIGINT NOT NULL DEFAULT 0,
    CLUSTER PRIMARY KEY ("id")
    );

CREATE UNIQUE INDEX IF NOT EXISTS tree_node_ux_deleted_at_tree_id_parent_id_sort_weight
    ON tree_node("deleted_at","tree_id","parent_id","sort_weight");

CREATE UNIQUE INDEX IF NOT EXISTS tree_node_ux_deleted_at_tree_id_parent_id_name
    ON tree_node("deleted_at","tree_id","parent_id","name");

set IDENTITY_INSERT "tree_info" ON;
INSERT INTO
    "tree_info" ("id","name","root_node_id","created_by_uid","updated_by_uid")
    SELECT 1, '资源分类', 1, 'admin', 'admin' FROM DUAL
    WHERE NOT EXISTS ( SELECT "id" FROM "tree_info" WHERE "id" = 1);

set IDENTITY_INSERT "tree_node" ON;
INSERT INTO
    "tree_node"( "id","tree_id","parent_id","name","sort_weight","created_by_uid","updated_by_uid")
    SELECT 1, 1, 0, '资源分类', 0, 'admin', 'admin' FROM DUAL
    WHERE NOT EXISTS ( SELECT "id" FROM "tree_node" WHERE "id" = 1);



CREATE TABLE IF NOT EXISTS "category" (
    "id" BIGINT  NOT NULL,
    "category_id" VARCHAR(36 char) NOT NULL DEFAULT SYS_GUID(),
    "name" VARCHAR(32 char) NOT NULL,
    "using" TINYINT NOT NULL,
    "type" VARCHAR(36 char) NOT NULL,
    "required" TINYINT NOT NULL,
    "description" VARCHAR(512 char) DEFAULT '',
    "sort_weight" BIGINT  NOT NULL,
    "created_at" datetime(3) NOT NULL DEFAULT current_timestamp(3),
    "creator_uid" VARCHAR(36 char) DEFAULT NULL,
    "creator_name" VARCHAR(255 char) DEFAULT NULL,
    "updated_at" datetime(0) NOT NULL DEFAULT current_timestamp(),
    "updater_uid" VARCHAR(36 char) DEFAULT NULL,
    "updater_name" VARCHAR(255 char) DEFAULT NULL,
    "deleted_at" BIGINT DEFAULT NULL,
    "deleter_uid" VARCHAR(36 char) DEFAULT NULL,
    "deleter_name" VARCHAR(255 char) DEFAULT NULL,
    CLUSTER PRIMARY KEY ("category_id")
    );

CREATE UNIQUE INDEX IF NOT EXISTS category_unique_index_name_code_delete_at ON category("name", "deleted_at");



CREATE TABLE IF NOT EXISTS "category_node" (
    "id" BIGINT  NOT NULL IDENTITY(1, 1),
    "category_node_id" VARCHAR(36 char) NOT NULL DEFAULT SYS_GUID(),
    "category_id" VARCHAR(36 char) NOT NULL DEFAULT SYS_GUID(),
    "parent_id" VARCHAR(36 char) NOT NULL DEFAULT SYS_GUID(),
    "name" VARCHAR(128 char) NOT NULL,
    "owner" VARCHAR(128 char) NOT NULL,
    "owner_uid" VARCHAR(36 char) DEFAULT NULL,
    "sort_weight" BIGINT  NOT NULL,
    `required` TINYINT NOT NULL DEFAULT 0,
    `selected`TINYINT NOT NULL DEFAULT 0,
    "created_at" datetime(3) NOT NULL DEFAULT current_timestamp(3),
    "creator_uid" VARCHAR(36 char) DEFAULT NULL,
    "creator_name" VARCHAR(255 char) DEFAULT NULL,
    "updated_at" datetime(0) NOT NULL DEFAULT current_timestamp(),
    "updater_uid" VARCHAR(36 char) DEFAULT NULL,
    "updater_name" VARCHAR(255 char) DEFAULT NULL,
    "deleted_at" BIGINT DEFAULT NULL,
    "deleter_uid" VARCHAR(36 char) DEFAULT NULL,
    "deleter_name" VARCHAR(255 char) DEFAULT NULL,
    CLUSTER PRIMARY KEY ("category_node_id")
    );

CREATE UNIQUE INDEX IF NOT EXISTS category_node_ux_category_id_parent_id_name_deleted_at  ON category_node( "category_id","parent_id","name","deleted_at");
CREATE UNIQUE INDEX IF NOT EXISTS category_node_ux_category_id_parent_id_sort_weight_deleted_at  ON category_node("category_id","parent_id","sort_weight","deleted_at");

INSERT INTO
    "category" ("name", "using", "type", "required", "description", "sort_weight", "creator_uid", "creator_name", "updater_uid",
                "updater_name", "deleted_at", "deleter_uid", "deleter_name", "category_id", "id")
    SELECT '组织架构', 1, 'system', 0, '', 2147483648, '', '', '',
                '', '0', '', '', '00000000-0000-0000-0000-000000000001', 000000000000000001 FROM DUAL
    WHERE NOT EXISTS ( SELECT "category_id" FROM "category" WHERE  "category_id" = '00000000-0000-0000-0000-000000000001');


INSERT INTO
    "category" ("name", "using", "type", "required", "description", "sort_weight", "creator_uid", "creator_name", "updater_uid",
                "updater_name", "deleted_at", "deleter_uid", "deleter_name", "category_id", "id")
    SELECT '信息系统', 0, 'system', 0, '', 2147483648, '', '', '',
                '', '0', '', '', '00000000-0000-0000-0000-000000000002', 000000000000000002 FROM DUAL
    WHERE NOT EXISTS ( SELECT "category_id" FROM "category" WHERE  "category_id" = '00000000-0000-0000-0000-000000000002');




CREATE TABLE IF NOT EXISTS "t_data_resource" (
    "id" BIGINT NOT NULL IDENTITY(1, 1),
    "resource_id" VARCHAR(125 char) NOT NULL,
    "name" VARCHAR(255 char) NOT NULL,
    "code" VARCHAR(255 char) NOT NULL,
    "type" TINYINT NOT NULL,
    "view_id" VARCHAR(36 char),
    "interface_count" INT,
    "department_id" VARCHAR(36 char) NOT NULL DEFAULT '',
    "subject_id" VARCHAR(36 char) NOT NULL DEFAULT '',
    "request_format" VARCHAR(100 char),
    "response_format" VARCHAR(100 char),
    "scheduling_plan" TINYINT,
    "interval" TINYINT,
    "time" VARCHAR(100 char),
    "catalog_id" BIGINT NOT NULL,
    "publish_at" datetime(3) NOT NULL,
    "status" TINYINT NOT NULL DEFAULT 1,
    CLUSTER PRIMARY KEY ("id")
    );

CREATE UNIQUE INDEX IF NOT EXISTS t_data_resource_t_data_resource_code_uk ON t_data_resource("code");



CREATE TABLE IF NOT EXISTS "t_data_catalog_category" (
    "id" BIGINT NOT NULL  IDENTITY(1, 1),
    "category_id" VARCHAR(36 char) NOT NULL,
    "category_type" TINYINT NOT NULL,
    "catalog_id" BIGINT NOT NULL,
    CLUSTER PRIMARY KEY ("id")
    );


CREATE TABLE IF NOT EXISTS "t_data_resource_history" (
    "id" BIGINT NOT NULL IDENTITY(1, 1),
    "resource_id" VARCHAR(125 char)  NOT NULL,
    "name" VARCHAR(255 char) NOT NULL,
    "code" VARCHAR(255 char) NOT NULL,
    "type" TINYINT NOT NULL,
    "view_id" VARCHAR(36 char),
    "interface_count" INT,
    "department_id" VARCHAR(36 char) NOT NULL DEFAULT '',
    "subject_id" VARCHAR(36 char) NOT NULL DEFAULT '',
    "request_format" VARCHAR(100 char),
    "response_format" VARCHAR(100 char),
    "scheduling_plan" TINYINT,
    "interval" TINYINT,
    "time" VARCHAR(100 char),
    "catalog_id" BIGINT NOT NULL,
    "publish_at" datetime(3) NOT NULL,
    "status" TINYINT NOT NULL DEFAULT 1,
    CLUSTER PRIMARY KEY ("id")
);



CREATE TABLE IF NOT EXISTS "t_data_catalog_category_history" (
    "id" BIGINT NOT NULL,
    "category_id" VARCHAR(36 char) NOT NULL,
    "category_type" TINYINT NOT NULL,
    "catalog_id" BIGINT NOT NULL,
    CLUSTER PRIMARY KEY ("id")
);



CREATE TABLE IF NOT EXISTS "t_api" (
    "id" VARCHAR(36 char) NOT NULL,
    "catalog_id" BIGINT NOT NULL,
    "body_type" TINYINT NOT NULL,
    "param_type" VARCHAR(255 char) NOT NULL,
    "name" VARCHAR(255 char) NOT NULL,
    "is_array" TINYINT NOT NULL,
    "has_content" TINYINT DEFAULT NULL,
    CLUSTER PRIMARY KEY ("id")
);



CREATE TABLE IF NOT EXISTS "t_api_history" (
    "id" VARCHAR(36 char) NOT NULL,
    "catalog_id" BIGINT NOT NULL,
    "body_type" TINYINT NOT NULL,
    "param_type" VARCHAR(255 char) NOT NULL,
    "name" VARCHAR(255 char) NOT NULL,
    "is_array" TINYINT NOT NULL,
    "has_content" TINYINT DEFAULT NULL,
    CLUSTER PRIMARY KEY ("id")
);




CREATE TABLE IF NOT EXISTS "t_info_resource_catalog" (
    f_id BIGINT NOT NULL,
    f_name VARCHAR(128 char) NOT NULL,
    f_code VARCHAR(255 char) NOT NULL,
    f_data_range TINYINT NOT NULL,
    f_update_cycle TINYINT NOT NULL,
    f_office_business_responsibility VARCHAR(300 char) NOT NULL,
    f_description VARCHAR(255 char) NOT NULL,
    f_shared_type TINYINT NOT NULL,
    f_shared_message VARCHAR(128 char) NOT NULL,
    f_shared_mode TINYINT NOT NULL,
    f_open_type TINYINT NOT NULL,
    f_open_condition VARCHAR(128 char) NOT NULL,
    f_publish_status TINYINT NOT NULL,
    f_publish_at BIGINT NOT NULL,
    f_online_status TINYINT NOT NULL,
    f_online_at BIGINT NOT NULL,
    f_update_at BIGINT NOT NULL,
    f_delete_at BIGINT NOT NULL,
    f_audit_id BIGINT NOT NULL,
    f_audit_msg VARCHAR(2400 char) NOT NULL,
    f_current_version TINYINT NOT NULL DEFAULT '1',
    f_alter_uid VARCHAR(36 char) NOT NULL DEFAULT '',
    f_alter_name VARCHAR(255 char) NOT NULL DEFAULT '',
    f_alter_at BIGINT NOT NULL DEFAULT '0',
    f_pre_id BIGINT NOT NULL DEFAULT '0',
    f_next_id BIGINT NOT NULL DEFAULT '0',
    label_ids VARCHAR(150 char)  NULL,
    f_alter_audit_msg TEXT,
    CLUSTER PRIMARY KEY (f_id)
);



CREATE TABLE IF NOT EXISTS "t_info_resource_catalog_source_info" (
    f_id BIGINT NOT NULL,
    f_business_form_id VARCHAR(36 char) NOT NULL,
    f_business_form_name VARCHAR(128 char) NOT NULL,
    f_department_id VARCHAR(36 char) NOT NULL,
    f_department_name VARCHAR(128 char) NOT NULL,
    CLUSTER PRIMARY KEY (f_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS t_info_resource_catalog_source_info_uk_business_form_id ON t_info_resource_catalog_source_info(f_business_form_id);





CREATE TABLE IF NOT EXISTS "t_info_resource_catalog_related_item" (
    f_id BIGINT NOT NULL IDENTITY(1, 1),
    f_info_resource_catalog_id BIGINT NOT NULL,
    f_related_item_id VARCHAR(50 char) NOT NULL,
    f_related_item_name VARCHAR(255 char) NOT NULL,
    f_relation_type TINYINT NOT NULL,
    "f_related_item_data_type" VARCHAR(128 char) not null default '',
    CLUSTER PRIMARY KEY (f_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS t_info_resource_catalog_related_item_uk_info_resource_catalog_related_item
     ON t_info_resource_catalog_related_item(f_info_resource_catalog_id,f_related_item_id,f_relation_type);


CREATE TABLE IF NOT EXISTS "t_info_resource_catalog_category_node" (
    f_id BIGINT NOT NULL IDENTITY(1, 1),
    f_category_node_id VARCHAR(50 char) NOT NULL,
    f_category_cate_id VARCHAR(36 char) NOT NULL,
    f_info_resource_catalog_id BIGINT NOT NULL,
    CLUSTER PRIMARY KEY (f_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS t_info_resource_catalog_category_node_uk_category_info_resource_catalog
    ON t_info_resource_catalog_category_node( f_category_node_id,f_category_cate_id,f_info_resource_catalog_id);



CREATE TABLE IF NOT EXISTS "t_business_scene" (
    f_id BIGINT NOT NULL IDENTITY(1, 1),
    f_type TINYINT NOT NULL,
    f_value VARCHAR(128 char) NOT NULL,
    f_info_resource_catalog_id BIGINT NOT NULL,
    f_related_type TINYINT NOT NULL,
    CLUSTER PRIMARY KEY (f_id)
);



CREATE TABLE IF NOT EXISTS "t_info_resource_catalog_column" (
    f_id BIGINT NOT NULL,
    f_name VARCHAR(255 char) NOT NULL,
    f_field_name_en VARCHAR(128 char) NOT NULL DEFAULT '',
    f_field_name_cn VARCHAR(255 char) NOT NULL DEFAULT '',
    f_data_type TINYINT NOT NULL,
    f_data_length BIGINT NOT NULL,
    f_data_range VARCHAR(128 char) NOT NULL,
    f_is_sensitive TINYINT NOT NULL,
    f_is_secret TINYINT NOT NULL,
    f_is_incremental TINYINT NOT NULL,
    f_is_primary_key TINYINT NOT NULL,
    f_is_local_generated TINYINT NOT NULL,
    f_is_standardized TINYINT NOT NULL,
    f_info_resource_catalog_id BIGINT NOT NULL,
    f_order SMALLINT NOT NULL,
    CLUSTER PRIMARY KEY (f_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS t_info_resource_catalog_column_uk_info_resource_catalog_column
    ON t_info_resource_catalog_column( f_name,f_info_resource_catalog_id);


CREATE TABLE IF NOT EXISTS "t_info_resource_catalog_column_related_info" (
    f_id BIGINT NOT NULL,
    f_code_set_id BIGINT NOT NULL,
    f_code_set_name VARCHAR(128 char) NOT NULL,
    f_data_refer_id BIGINT NOT NULL,
    f_data_refer_name VARCHAR(128 char) NOT NULL,
    CLUSTER PRIMARY KEY (f_id)
);





CREATE TABLE IF NOT EXISTS "t_business_form_not_cataloged" (
    f_id VARCHAR(36 char) NOT NULL,
    f_name VARCHAR(128 char) NOT NULL,
    f_description  VARCHAR(255 char) DEFAULT '',
    f_info_system_id text null,
    f_department_id VARCHAR(36 char) DEFAULT NULL,
    f_business_domain_id  VARCHAR(36 char)  DEFAULT '',
    f_business_model_id  VARCHAR(36 char)  DEFAULT '',
    f_update_at BIGINT NOT NULL,
    CLUSTER PRIMARY KEY (f_id)
);



CREATE TABLE IF NOT EXISTS "t_catalog_feedback" (
    "id" BIGINT  NOT NULL IDENTITY(1, 1),
    "catalog_id" BIGINT NOT NULL,
    "feedback_type" VARCHAR(10 char) NOT NULL,
    "feedback_desc" VARCHAR(300 char) NOT NULL,
    "status" TINYINT NOT NULL,
    "created_at" DATETIME(3) NOT NULL DEFAULT current_timestamp(3),
    "created_by" VARCHAR(36 char) NOT NULL,
    "updated_at" DATETIME(3) NOT NULL DEFAULT current_timestamp(3),
    "replied_at" DATETIME(3) DEFAULT NULL,
    CLUSTER PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS t_catalog_feedback_idx_feedback_type ON t_catalog_feedback("feedback_type");
CREATE INDEX IF NOT EXISTS t_catalog_feedback_idx_feedback_status ON t_catalog_feedback("status");
CREATE INDEX IF NOT EXISTS t_catalog_feedback_idx_feedback_created_by ON t_catalog_feedback("created_by");



CREATE TABLE IF NOT EXISTS "t_catalog_feedback_op_log" (
    "id" BIGINT  NOT NULL  IDENTITY(1, 1),
    "feedback_id" BIGINT NOT NULL,
    "uid" VARCHAR(36 char) NOT NULL,
    "op_type" TINYINT NOT NULL,
    "extend_info" TEXT NOT NULL,
    "created_at" DATETIME(3) NOT NULL DEFAULT current_timestamp(3),
    CLUSTER PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS t_catalog_feedback_op_log_idx_log_feedback_id ON t_catalog_feedback_op_log("feedback_id");
CREATE INDEX IF NOT EXISTS t_catalog_feedback_op_log_idx_log_op_type ON t_catalog_feedback_op_log("op_type");


CREATE TABLE IF NOT EXISTS "t_open_catalog" (
    "id" BIGINT  NOT NULL  IDENTITY(1, 1),
    "catalog_id" BIGINT NOT NULL,
    "open_type" TINYINT NOT NULL,
    "open_level" TINYINT DEFAULT NULL,
    "open_status" VARCHAR(20 char) NOT NULL DEFAULT 'notOpen',
    "open_at" datetime(3) DEFAULT NULL,
    "audit_apply_sn" BIGINT  NOT NULL DEFAULT 0,
    "audit_advice" text null,
    "proc_def_key" VARCHAR(128 char) NOT NULL DEFAULT '',
    "flow_apply_id" VARCHAR(50 char) DEFAULT '',
    "flow_node_id" VARCHAR(50 char) DEFAULT NULL,
    "flow_node_name" VARCHAR(200 char) DEFAULT NULL,
    "flow_id" VARCHAR(50 char) DEFAULT NULL,
    "flow_name" VARCHAR(200 char) DEFAULT NULL,
    "flow_version" VARCHAR(10 char) DEFAULT NULL,
    "audit_state" TINYINT DEFAULT NULL,
    "created_at" datetime(3) NOT NULL DEFAULT current_timestamp(3),
    "creator_uid" VARCHAR(50 char) NOT NULL DEFAULT '',
    "updated_at" datetime(3) DEFAULT NULL,
    "updater_uid" VARCHAR(50 char) DEFAULT NULL,
    "deleted_at" datetime(3) DEFAULT NULL,
    "delete_uid" VARCHAR(50 char) DEFAULT NULL,
    CLUSTER PRIMARY KEY ("id")
);



CREATE TABLE IF NOT EXISTS "t_data_catalog_score" (
    "id" BIGINT  NOT NULL  IDENTITY(1, 1),
    "catalog_id" BIGINT NOT NULL,
    "score" TINYINT NOT NULL,
    "scored_uid" VARCHAR(50 char) NOT NULL DEFAULT '',
    "scored_at" datetime(3) NOT NULL DEFAULT current_timestamp(3),
    CLUSTER PRIMARY KEY ("id")
);




CREATE TABLE IF NOT EXISTS "elec_licence"(
    "id" BIGINT NOT NULL ,
    "elec_licence_id" VARCHAR(50 char)  NOT NULL,
    "licence_name" VARCHAR(255 char)  NULL DEFAULT NULL,
    "licence_basic_code" VARCHAR(255 char)  NULL DEFAULT NULL,
    "licence_abbreviation" VARCHAR(255 char)  NULL DEFAULT NULL,
    "group_id" VARCHAR(50 char)  NULL DEFAULT NULL,
    "group_name1" VARCHAR(100 char)  NULL DEFAULT NULL,
    "industry_department_id" VARCHAR(36 char)  NULL DEFAULT NULL,
    "industry_department" VARCHAR(255 char)  NULL DEFAULT NULL,
    "certification_level" VARCHAR(255 char)  NULL DEFAULT NULL,
    "holder_type" VARCHAR(255 char)  NULL DEFAULT NULL,
    "licence_type" VARCHAR(255 char)  NULL DEFAULT NULL,
    "use_limit" VARCHAR(255 char)  NULL DEFAULT NULL,
    "prov_overall_plan_sign_issue" VARCHAR(255 char)  NULL DEFAULT NULL,
    "release_cancel_time" VARCHAR(255 char)  NULL DEFAULT NULL,
    "remark" text  NULL DEFAULT NULL,
    "licence_state" VARCHAR(255 char)  NULL DEFAULT NULL,
    "inception_state" VARCHAR(255 char)  NULL DEFAULT NULL,
    "department" VARCHAR(255 char)  NULL DEFAULT NULL,
    "new_dept_id" VARCHAR(255 char)  NULL DEFAULT NULL,
    "new_dept" VARCHAR(255 char)  NULL DEFAULT NULL,
    "version" VARCHAR(50 char)  NULL DEFAULT NULL,
    "use_constraint_type" VARCHAR(50 char)  NULL DEFAULT NULL,
    "description" VARCHAR(1000 char)  NULL DEFAULT NULL,
    "icon_image" text  NULL DEFAULT NULL,
    "admin_org" VARCHAR(100 char)  NULL DEFAULT NULL,
    "admin_org_code" VARCHAR(50 char)  NULL DEFAULT NULL,
    "division" VARCHAR(50 char)  NULL DEFAULT NULL,
    "division_code" VARCHAR(50 char)  NULL DEFAULT NULL,
    "publish_data" datetime(0) NULL DEFAULT NULL,
    "creator" VARCHAR(50 char)  NULL DEFAULT NULL,
    "creator_name" VARCHAR(50 char)  NULL DEFAULT NULL,
    "creator_part" VARCHAR(50 char)  NULL DEFAULT NULL,
    "creator_part_name" VARCHAR(50 char)  NULL DEFAULT NULL,
    "create_time" datetime(0) NULL DEFAULT NULL,
    "updater" VARCHAR(50 char)  NULL DEFAULT NULL,
    "updater_name" VARCHAR(50 char)  NULL DEFAULT NULL,
    "updater_part" VARCHAR(50 char)  NULL DEFAULT NULL,
    "updater_part_name" VARCHAR(50 char)  NULL DEFAULT NULL,
    "update_time" datetime(0) NULL DEFAULT NULL,
    "deleter" VARCHAR(50 char)  NULL DEFAULT NULL,
    "deleter_name" VARCHAR(50 char)  NULL DEFAULT NULL,
    "deleter_part" VARCHAR(50 char)  NULL DEFAULT NULL,
    "deleter_part_name" VARCHAR(50 char)  NULL DEFAULT NULL,
    "delete_time" datetime(0) NULL DEFAULT NULL,
    "orgcode" VARCHAR(50 char)  NULL DEFAULT NULL,
    "orgname" VARCHAR(50 char)  NULL DEFAULT NULL,
    "creation_time" datetime(0) NULL DEFAULT NULL,
    "last_modificator" VARCHAR(50 char)  NULL DEFAULT NULL,
    "last_modification_time" VARCHAR(50 char)  NULL DEFAULT NULL,
    "shared_type" SMALLINT NULL DEFAULT NULL,
    "is_provincial_management" SMALLINT NULL DEFAULT 2,
    "new_org_id" VARCHAR(50 char)  NULL DEFAULT NULL,
    "new_org" VARCHAR(255 char)  NULL DEFAULT NULL,
    "is_new_add" VARCHAR(2 char)  NULL DEFAULT 'y',
    "apply_num_base" double NULL DEFAULT NULL,
    "res_quality" SMALLINT NULL DEFAULT NULL,
    "apply_num" double NULL DEFAULT NULL,
    "score" double NULL DEFAULT 0,
    "evaluators_num" VARCHAR(255 char)  NULL DEFAULT NULL,
    "is_collection" VARCHAR(255 char)  NULL DEFAULT NULL,
    "type" VARCHAR(255 char)  NULL DEFAULT NULL,
    "release_department" VARCHAR(255 char)  NULL DEFAULT NULL,
    "release_department_name" VARCHAR(255 char)  NULL DEFAULT NULL,
    "release_time" datetime(0) NULL DEFAULT NULL,
    "audit_department" VARCHAR(255 char)  NULL DEFAULT NULL,
    "audit_department_name" VARCHAR(255 char)  NULL DEFAULT NULL,
    "expire" VARCHAR(255 char)  NULL DEFAULT NULL,
    "catalogue_id" VARCHAR(50 char)  NULL DEFAULT NULL,
    "delete_flag" VARCHAR(2 char)  NULL DEFAULT '0',
    "flow_node_id" VARCHAR(50 char) NULL DEFAULT NULL,
    "flow_node_name" VARCHAR(200 char) NULL DEFAULT NULL,
    "flow_id" VARCHAR(50 char) NULL DEFAULT NULL,
    "flow_name" VARCHAR(200 char) NULL DEFAULT NULL,
    "flow_version" VARCHAR(10 char) NULL DEFAULT NULL,
    "audit_advice" text  NULL DEFAULT NULL,
    "proc_def_key" VARCHAR(128 char) NOT NULL DEFAULT '',
    "flow_apply_id" VARCHAR(50 char) NULL DEFAULT '',
    "audit_type" VARCHAR(50 char)  NOT NULL DEFAULT 'unpublished',
    "audit_state" TINYINT NULL DEFAULT NULL,
    "online_status" VARCHAR(20 char)  NOT NULL DEFAULT 'notline',
    "online_time" datetime(0) NULL DEFAULT NULL,
    CLUSTER PRIMARY KEY ("elec_licence_id")
);



CREATE TABLE IF NOT EXISTS "elec_licence_column"(
    "id" BIGINT NOT NULL IDENTITY(1, 1),
    "elec_licence_column_id" VARCHAR(50 char)  NOT NULL,
    "elec_licence_id" VARCHAR(50 char)  NULL DEFAULT NULL,
    "technical_name" VARCHAR(255 char)  NOT NULL,
    "business_name" VARCHAR(255 char)  NULL DEFAULT NULL,
    "phonetic_abbreviation" VARCHAR(100 char)  NULL DEFAULT NULL,
    "control_type" VARCHAR(100 char)  NULL DEFAULT NULL,
    "data_type" VARCHAR(100 char)  NULL DEFAULT NULL,
    "size" INT NULL DEFAULT NULL,
    "accuracy" VARCHAR(10 char)  NULL DEFAULT NULL,
    "correspond_standard_attribute" VARCHAR(100 char)  NULL DEFAULT NULL,
    "example_data" VARCHAR(500 char)  NULL DEFAULT NULL,
    "is_show" VARCHAR(100 char)  NULL DEFAULT NULL,
    "is_controlled" VARCHAR(100 char)  NULL DEFAULT NULL,
    "value_range" VARCHAR(100 char)  NULL DEFAULT NULL,
    "licence_basic_code" VARCHAR(255 char)  NULL DEFAULT NULL,
    "item_id" VARCHAR(255 char)  NULL DEFAULT NULL,
    "index" VARCHAR(255 char)  NULL DEFAULT NULL,
    "colspan" VARCHAR(255 char)  NULL DEFAULT NULL,
    "placeholder" VARCHAR(255 char)  NULL DEFAULT NULL,
    "description" VARCHAR(255 char)  NULL DEFAULT NULL,
    "is_allow_null" VARCHAR(255 char)  NULL DEFAULT NULL,
    "file_suffix" VARCHAR(255 char)  NULL DEFAULT NULL,
    "file_data" VARCHAR(255 char)  NULL DEFAULT NULL,
    "addon" VARCHAR(255 char)  NULL DEFAULT NULL,
    "rows" VARCHAR(255 char)  NULL DEFAULT NULL,
    "options" VARCHAR(1000 char)  NULL DEFAULT NULL,
    "head" VARCHAR(255 char)  NULL DEFAULT NULL,
    "is_init_item" VARCHAR(255 char)  NULL DEFAULT NULL,
    "cols" VARCHAR(255 char)  NULL DEFAULT NULL,
    "date_view_format" VARCHAR(255 char)  NULL DEFAULT NULL,
    "is_sensitive" VARCHAR(255 char)  NULL DEFAULT NULL,
    "data_edit_type" VARCHAR(255 char)  NULL DEFAULT NULL,
    "childrens" VARCHAR(255 char)  NULL DEFAULT NULL,
    "type" VARCHAR(10 char)  NULL DEFAULT NULL,
    "delete_flag" VARCHAR(2 char)  NULL DEFAULT '0',
    "creator" VARCHAR(50 char)  NULL DEFAULT NULL,
    "creator_name" VARCHAR(50 char)  NULL DEFAULT NULL,
    "creator_part" VARCHAR(50 char)  NULL DEFAULT NULL,
    "creator_part_name" VARCHAR(50 char)  NULL DEFAULT NULL,
    "create_time" datetime(0) NULL DEFAULT NULL,
    "updater" VARCHAR(50 char)  NULL DEFAULT NULL,
    "updater_name" VARCHAR(50 char)  NULL DEFAULT NULL,
    "updater_part" VARCHAR(50 char)  NULL DEFAULT NULL,
    "updater_part_name" VARCHAR(50 char)  NULL DEFAULT NULL,
    "update_time" datetime(0) NULL DEFAULT NULL,
    "deleter" VARCHAR(50 char)  NULL DEFAULT NULL,
    "deleter_name" VARCHAR(50 char)  NULL DEFAULT NULL,
    "deleter_part" VARCHAR(50 char)  NULL DEFAULT NULL,
    "deleter_part_name" VARCHAR(50 char)  NULL DEFAULT NULL,
    "delete_time" datetime(0) NULL DEFAULT NULL,
    "orgcode" VARCHAR(50 char)  NULL DEFAULT NULL,
    "orgname" VARCHAR(50 char)  NULL DEFAULT NULL,
    "af_data_type" VARCHAR(255 char)  NULL DEFAULT NULL,
    CLUSTER PRIMARY KEY ("id")
);



CREATE TABLE IF NOT EXISTS "classify"
(
    "id"          BIGINT NOT NULL IDENTITY(1,1),
    "classify_id" VARCHAR(36 char)     NOT NULL,
    "name"        VARCHAR(255 char) NOT NULL,
    "parent_id"   VARCHAR(36 char)     NOT NULL,
    "path_id"     VARCHAR(255 char)   NOT NULL,
    "path"        text         NOT NULL,
    "created_at"  datetime(3) NOT NULL,
    "created_by"  VARCHAR(36 char)     NOT NULL,
    "deleted_at"  BIGINT DEFAULT NULL,
    "deleted_by"  VARCHAR(36 char) DEFAULT NULL,
    CLUSTER PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS classify_idx_classify_id ON classify("classify_id");


CREATE TABLE IF NOT EXISTS "t_my_favorite" (
  "id" BIGINT  NOT NULL,
  "res_type" TINYINT NOT NULL,
  "res_id" VARCHAR(64 char) NOT NULL,
  "created_at" DATETIME(3) NOT NULL DEFAULT current_timestamp(3),
  "created_by" VARCHAR(36 char) NOT NULL,
  CLUSTER PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS uni_my_favorite ON t_my_favorite("created_by","res_type","res_id");




CREATE TABLE IF NOT EXISTS "audit_log"
(
    "id"                  BIGINT NOT NULL IDENTITY(1,1),
    "catalog_id"          BIGINT NOT NULL,
    "audit_type"          VARCHAR(255 char) NOT NULL,
    "audit_state"         INT NOT NULL,
    "audit_time"          datetime(3) NOT NULL,
    "audit_resource_type" INT NOT NULL,
    CLUSTER PRIMARY KEY ("id")
);



CREATE TABLE if not EXISTS "t_data_push_model"(
    "id"    BIGINT  NOT NULL  IDENTITY(1,1),
    "name" VARCHAR(128 char) NOT NULL,
    "description" VARCHAR(300 char) DEFAULT NULL,
    "responsible_person_id" VARCHAR(36 char) NOT NULL,
    "channel" TINYINT  NOT NULL default 1,
    "push_error"   text   NULL,
    "push_status"  TINYINT NOT NULL default 0,
    "operation" TINYINT NOT NULL  default 0,
    "transmit_mode" TINYINT NOT NULL  default 0,
    "increment_field" VARCHAR(36 char)  default '',
    "increment_timestamp" BIGINT  DEFAULT 0,
    "primary_key" VARCHAR(128 char)  default '',
    "schedule_type" VARCHAR(32 char) NOT NULL,
    "schedule_time"  VARCHAR(64 char) NOT NULL DEFAULT 0,
    "schedule_start" VARCHAR(64 char) DEFAULT NULL,
    "schedule_end"   VARCHAR(64 char) DEFAULT NULL,
    "draft_schedule"  text    NULL,
    "crontab_expr"   VARCHAR(64 char) DEFAULT '',
    "source_catalog_id"   BIGINT  NOT NULL,
    "source_department_id" VARCHAR(36 char)  NOT NULL,
    "source_datasource_id" BIGINT  NOT NULL,
    "source_datasource_uuid" VARCHAR(36 char)  NOT NULL,
    "source_hua_ao_id" VARCHAR(255 char) default NULL,
    "source_table_id" VARCHAR(36 char) NOT NULL,
    "source_table_name" VARCHAR(128 char)  NOT NULL default '',
    "target_datasource_id" BIGINT NOT NULL,
    "target_sandbox_id" VARCHAR(36 char)  NOT NULL default '',
    "target_department_id" VARCHAR(36 char)  NOT NULL,
    "target_datasource_uuid" VARCHAR(36 char) NOT NULL,
    "target_hua_ao_id" VARCHAR(255 char) default NULL,
    "target_table_exists" TINYINT NOT NULL  default 0,
    "target_table_name" VARCHAR(128 char)  NOT NULL default '',
    "filter_condition" text    NULL,
    "is_desensitization" TINYINT NOT NULL default 0,
    "create_sql"    text null ,
    "insert_sql"    text null ,
    "update_sql"    text null ,
    "update_existing_data_flag"   int NOT NULL default 0,
    "dolphin_workflow_id" VARCHAR(36 char) NOT NULL  default '',
    "audit_state" TINYINT NOT NULL default 0,
    "apply_id"    VARCHAR(64 char) DEFAULT '',
    "audit_advice" text null,
    "proc_def_key" VARCHAR(128 char) NOT NULL DEFAULT '',
    "created_at" datetime(3) NOT NULL DEFAULT current_timestamp(3),
    "creator_uid" VARCHAR(36 char) DEFAULT NULL,
    "creator_name" VARCHAR(255 char) DEFAULT NULL,
    "f_third_user_id" VARCHAR(255 char) default NULL,
    "f_third_dept_id" VARCHAR(255 char) default NULL,
    "updated_at" datetime(0) NOT NULL DEFAULT current_timestamp(),
    "updater_uid" VARCHAR(36 char) DEFAULT NULL,
    "updater_name" VARCHAR(255 char) DEFAULT NULL,
    "deleted_at"  BIGINT   DEFAULT NULL,
    CLUSTER PRIMARY KEY ("id")
);




CREATE TABLE if not EXISTS "t_data_push_fields"(
    "id"    BIGINT  NOT NULL  IDENTITY(1,1),
    "model_id"   BIGINT  NOT NULL,
    "source_tech_name"  VARCHAR(255 char) NOT NULL,
    "technical_name" VARCHAR(255 char) NOT NULL,
    "business_name" VARCHAR(255 char) DEFAULT NULL,
    "data_type" VARCHAR(255 char) NOT NULL,
    "data_length" INT NOT NULL,
    "data_accuracy" INT default NULL,
    "primary_key" TINYINT default 0,
    "is_nullable" VARCHAR(30 char) NOT NULL,
    "comment" VARCHAR(128 char) DEFAULT '',
    "desensitization_rule_id" VARCHAR(36 char) NOT NULL default '',
    CLUSTER PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS t_data_push_fields_idx_model_id ON t_data_push_fields("model_id");



CREATE TABLE IF NOT EXISTS "t_file_resource" (
    "id" BIGINT  NOT NULL  IDENTITY(1,1),
    "name" VARCHAR(500 char) NOT NULL,
    "code" VARCHAR(50 char) NOT NULL,
    "department_id" VARCHAR(36 char) NOT NULL,
    "description" VARCHAR(1000 char) DEFAULT NULL,
    "publish_status" VARCHAR(20 char) NOT NULL DEFAULT 'unpublished',
    "published_at" datetime(3) DEFAULT NULL,
    "audit_apply_sn" BIGINT  NOT NULL DEFAULT 0,
    "audit_advice" text null,
    "proc_def_key" VARCHAR(128 char) NOT NULL DEFAULT '',
    "flow_apply_id" VARCHAR(50 char) DEFAULT '',
    "flow_node_id" VARCHAR(50 char) DEFAULT NULL,
    "flow_node_name" VARCHAR(200 char) DEFAULT NULL,
    "flow_id" VARCHAR(50 char) DEFAULT NULL,
    "flow_name" VARCHAR(200 char) DEFAULT NULL,
    "flow_version" VARCHAR(10 char) DEFAULT NULL,
    "audit_state" TINYINT DEFAULT NULL,
    "created_at" datetime(3) NOT NULL DEFAULT current_timestamp(3),
    "creator_uid" VARCHAR(50 char) NOT NULL DEFAULT '',
    "updated_at" datetime(3) DEFAULT NULL,
    "updater_uid" VARCHAR(50 char) DEFAULT NULL,
    "deleted_at" datetime(3) DEFAULT NULL,
    "deleter_uid" VARCHAR(50 char) DEFAULT NULL,
    CLUSTER PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS t_file_resource_t_file_resource_code_uk ON t_file_resource("code");



CREATE TABLE IF NOT EXISTS "t_data_comprehension_template"
(
    "id"                         VARCHAR(36 char)     NOT NULL,
    "name"                       VARCHAR(255 char) NOT NULL,
    "description"                text     DEFAULT NULL,
    "business_object"            TINYINT DEFAULT NULL,
    "time_range"                 TINYINT DEFAULT NULL,
    "time_field_comprehension"   TINYINT DEFAULT NULL,
    "spatial_range"              TINYINT DEFAULT NULL,
    "spatial_field_comprehension"  TINYINT DEFAULT NULL,
    "business_special_dimension" TINYINT DEFAULT NULL,
    "compound_expression"        TINYINT DEFAULT NULL,
    "service_range"              TINYINT DEFAULT NULL,
    "service_areas"              TINYINT DEFAULT NULL,
    "front_support"              TINYINT DEFAULT NULL,
    "negative_support"           TINYINT DEFAULT NULL,
    "protect_control"            TINYINT DEFAULT NULL,
    "promote_push"               TINYINT DEFAULT NULL,
    "created_at"                 datetime(3) NOT NULL,
    "created_uid"                VARCHAR(36 char)     NOT NULL,
    "updated_at"                 datetime(3) DEFAULT NULL,
    "updated_uid"                VARCHAR(36 char) DEFAULT NULL,
    "deleted_at"                 BIGINT DEFAULT NULL,
    "deleted_uid"                VARCHAR(36 char) DEFAULT NULL,
    CLUSTER PRIMARY KEY ("id")
);



CREATE TABLE IF NOT EXISTS "t_data_catalog_search_history" (
    "catalog_search_history_id" BIGINT NOT NULL  IDENTITY(1,1),
    "id" VARCHAR(255 char) DEFAULT '',
    "data_catalog_id" BIGINT NOT NULL DEFAULT 0,
    "fields" text null,
    "fields_details" text null,
    "configs" text null,
    "type" VARCHAR(255 char) DEFAULT NULL,
    "department_path" text null,
    "total_count" INT DEFAULT 0,
    "created_at" datetime(0) DEFAULT NULL,
    "created_by_uid" VARCHAR(255 char) DEFAULT '',
    "updated_at" datetime(0) DEFAULT NULL,
    "updated_by_uid" VARCHAR(255 char) DEFAULT '',
    "deleted_at" INT DEFAULT 0,
    CLUSTER PRIMARY KEY ("catalog_search_history_id")
);

CREATE INDEX IF NOT EXISTS t_data_catalog_search_history_idx ON t_data_catalog_search_history("id");



CREATE TABLE IF NOT EXISTS "t_data_catalog_search_template" (
    "catalog_search_template_id" BIGINT NOT NULL  IDENTITY(1,1),
    "id" VARCHAR(255 char) DEFAULT '',
    "data_catalog_id" BIGINT NOT NULL DEFAULT 0,
    "name" VARCHAR(255 char) DEFAULT '',
    "description" VARCHAR(255 char) DEFAULT '',
    "type" VARCHAR(255 char) DEFAULT '',
    "department_path" VARCHAR(255 char) DEFAULT '',
    "fields" text null,
    "fields_details" text null,
    "configs" text null,
    "created_at" datetime(0) DEFAULT NULL,
    "created_by_uid" VARCHAR(255 char) DEFAULT '',
    "updated_at" datetime(0) DEFAULT NULL,
    "updated_by_uid" VARCHAR(255 char) DEFAULT '',
    "deleted_at" INT DEFAULT 0,
    CLUSTER PRIMARY KEY ("catalog_search_template_id")
);

CREATE INDEX IF NOT EXISTS t_data_catalog_search_template_idx ON t_data_catalog_search_template("id");
CREATE INDEX IF NOT EXISTS t_data_catalog_search_template_namex ON t_data_catalog_search_template("name");



CREATE TABLE IF NOT EXISTS "t_data_catalog_resource" (
    "id" BIGINT NOT NULL  IDENTITY(1,1),
    "catalog_id" BIGINT NOT NULL,
    "resource_id" VARCHAR(50 char) NOT NULL,
    "request_format" VARCHAR(100 char) ,
    "response_format" VARCHAR(100 char) ,
    "scheduling_plan" TINYINT ,
    "interval" TINYINT,
    "time" VARCHAR(100 char),
    CLUSTER PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS t_data_catalog_resource_catalog_id_btr ON t_data_catalog_resource("catalog_id");




CREATE TABLE IF NOT EXISTS "statistics_overview" (
    "id" VARCHAR(38 char),
    "total_data_count" BIGINT NOT NULL DEFAULT 0,
    "total_table_count" BIGINT NOT NULL DEFAULT 0,
    "service_usage_count" BIGINT NOT NULL DEFAULT 0,
    "shared_data_count" BIGINT NOT NULL DEFAULT 0,
    "update_time" datetime(0) DEFAULT CURRENT_TIMESTAMP,
    CLUSTER PRIMARY KEY (id)
);


CREATE TABLE IF NOT EXISTS "statistics_service" (
    "id" VARCHAR(38 char),
    "type" TINYINT NOT NULL,
    "quantity" INT DEFAULT 0,
    "business_time" VARCHAR(20 char),
    "create_time" datetime(0) DEFAULT CURRENT_TIMESTAMP,
    "week" INT,
    "catalog" VARCHAR(20 char),
    CLUSTER PRIMARY KEY (id)
);


INSERT INTO af_data_catalog.statistics_overview
/*+IGNORE_ROW_ON_DUPKEY_INDEX(statistics_overview(id))*/
(id, total_data_count, total_table_count, service_usage_count, shared_data_count, update_time)
VALUES('1', 100, 200, 300, 400, '2024-11-22 12:11:12');




INSERT INTO af_data_catalog.statistics_service
/*+IGNORE_ROW_ON_DUPKEY_INDEX(statistics_service(id))*/
(id, "type", quantity, business_time, create_time, week, "catalog")
VALUES('1', 1, 100, '2025-02', '2025-05-26 17:26:40', 4, '1');


INSERT INTO af_data_catalog.statistics_service
/*+IGNORE_ROW_ON_DUPKEY_INDEX(statistics_service(id))*/
(id, "type", quantity, business_time, create_time, week, "catalog")
VALUES('10', 1, 200, '2025-03', '2025-05-28 15:02:07', 1, '2');


INSERT INTO af_data_catalog.statistics_service
/*+IGNORE_ROW_ON_DUPKEY_INDEX(statistics_service(id))*/
(id, "type", quantity, business_time, create_time, week, "catalog")
VALUES('11', 1, 300, '2025-03', '2025-05-28 15:02:07', 2, '2');


INSERT INTO af_data_catalog.statistics_service
/*+IGNORE_ROW_ON_DUPKEY_INDEX(statistics_service(id))*/
(id, "type", quantity, business_time, create_time, week, "catalog")
VALUES('12', 1, 400, '2025-03', '2025-05-28 15:02:07', 3, '2');


INSERT INTO af_data_catalog.statistics_service
/*+IGNORE_ROW_ON_DUPKEY_INDEX(statistics_service(id))*/
(id, "type", quantity, business_time, create_time, week, "catalog")
VALUES('13', 2, 101, '2025-02', '2025-05-28 17:45:51', 4, '2');

INSERT INTO af_data_catalog.statistics_service
/*+IGNORE_ROW_ON_DUPKEY_INDEX(statistics_service(id))*/
(id, "type", quantity, business_time, create_time, week, "catalog")
VALUES('14', 2, 201, '2025-03', '2025-05-28 17:45:51', 3, '2');

INSERT INTO af_data_catalog.statistics_service
/*+IGNORE_ROW_ON_DUPKEY_INDEX(statistics_service(id))*/
(id, "type", quantity, business_time, create_time, week, "catalog")
VALUES('15', 2, 301, '2025-03', '2025-05-28 17:45:51', 2, '2');

INSERT INTO af_data_catalog.statistics_service
/*+IGNORE_ROW_ON_DUPKEY_INDEX(statistics_service(id))*/
(id, "type", quantity, business_time, create_time, week, "catalog")
VALUES('16', 2, 401, '2025-03', '2025-05-28 17:45:51', 1, '2');

INSERT INTO af_data_catalog.statistics_service
/*+IGNORE_ROW_ON_DUPKEY_INDEX(statistics_service(id))*/
(id, "type", quantity, business_time, create_time, week, "catalog")
VALUES('2', 1, 200, '2025-03', '2025-05-27 10:19:37', 1, '1');

INSERT INTO af_data_catalog.statistics_service
/*+IGNORE_ROW_ON_DUPKEY_INDEX(statistics_service(id))*/
(id, "type", quantity, business_time, create_time, week, "catalog")
VALUES('3', 1, 300, '2025-03', '2025-05-27 10:22:02', 2, '1');

INSERT INTO af_data_catalog.statistics_service
/*+IGNORE_ROW_ON_DUPKEY_INDEX(statistics_service(id))*/
(id, "type", quantity, business_time, create_time, week, "catalog")
VALUES('4', 1, 400, '2025-03', '2025-05-27 10:22:02', 3, '1');

INSERT INTO af_data_catalog.statistics_service
/*+IGNORE_ROW_ON_DUPKEY_INDEX(statistics_service(id))*/
(id, "type", quantity, business_time, create_time, week, "catalog")
VALUES('5', 2, 102, '2025-02', '2025-05-27 10:22:02', 4, '1');

INSERT INTO af_data_catalog.statistics_service
/*+IGNORE_ROW_ON_DUPKEY_INDEX(statistics_service(id))*/
(id, "type", quantity, business_time, create_time, week, "catalog")
VALUES('6', 2, 202, '2025-03', '2025-05-27 10:22:02', 1, '1');

INSERT INTO af_data_catalog.statistics_service
/*+IGNORE_ROW_ON_DUPKEY_INDEX(statistics_service(id))*/
(id, "type", quantity, business_time, create_time, week, "catalog")
VALUES('7', 2, 302, '2025-03', '2025-05-27 10:22:02', 2, '1');

INSERT INTO af_data_catalog.statistics_service
/*+IGNORE_ROW_ON_DUPKEY_INDEX(statistics_service(id))*/
(id, "type", quantity, business_time, create_time, week, "catalog")
VALUES('8', 2, 402, '2025-03', '2025-05-27 10:22:02', 3, '1');

INSERT INTO af_data_catalog.statistics_service
/*+IGNORE_ROW_ON_DUPKEY_INDEX(statistics_service(id))*/
(id, "type", quantity, business_time, create_time, week, "catalog")
VALUES('9', 1, 100, '2025-02', '2025-05-28 15:02:07', 4, '2');



CREATE TABLE IF NOT EXISTS "t_data_catalog_apply" (
    "id" BIGINT NOT NULL IDENTITY(1,1),
    "catalog_id" BIGINT NOT NULL,
    "apply_num" INT DEFAULT 0,
    "create_time" DATETIME(3) DEFAULT CURRENT_TIMESTAMP,
    CLUSTER PRIMARY KEY (id)
);



CREATE TABLE IF NOT EXISTS "t_system_operation_detail" (
    "id" VARCHAR(36 char) NOT NULL,
    "catalog_id" BIGINT NOT NULL,
    "department_id" VARCHAR(36 char) DEFAULT NULL,
    "info_system_id" VARCHAR(36 char) DEFAULT NULL,
    "form_view_id" VARCHAR(36 char) NOT NULL,
    "technical_name" VARCHAR(255 char) NOT NULL,
    "business_name" VARCHAR(255 char) NOT NULL,
    "acceptance_time" datetime(0) DEFAULT NULL,
    "first_aggregation_time" datetime(0) DEFAULT NULL,
    "update_cycle" TINYINT DEFAULT NULL,
    "field_count" INT DEFAULT NULL,
    "latest_data_count" INT DEFAULT NULL,
    "has_quality_issue" TINYINT DEFAULT NULL,
    "issue_remark" text null,
    "quality_check" TINYINT DEFAULT NULL,
    "data_update" TINYINT DEFAULT NULL,
    "created_at" datetime(3) NOT NULL,
    "updated_at" datetime(3) NOT NULL,
    CLUSTER PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS t_system_operation_detail_idx_form_view_id ON t_system_operation_detail("form_view_id");



CREATE TABLE IF NOT EXISTS "t_form_data_count" (
    "id" VARCHAR(36 char) NOT NULL,
    "form_view_id" VARCHAR(36 char) NOT NULL,
    "data_count" INT NOT NULL,
    "created_at" datetime(3) NOT NULL,
    CLUSTER PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS t_form_data_count_idx_form_view_id ON t_form_data_count("form_view_id");



CREATE TABLE IF NOT EXISTS "t_rule_config" (
    "id" VARCHAR(36 char) NOT NULL,
    "rule_name" VARCHAR(128 char) NOT NULL,
    "update_timeliness_condition" VARCHAR(10 char) DEFAULT NULL,
    "update_timeliness_value" FLOAT DEFAULT NULL,
    "quality_pass_condition" VARCHAR(10 char) DEFAULT NULL,
    "quality_pass_value" FLOAT DEFAULT NULL,
    "logical_operator" VARCHAR(3 char) DEFAULT NULL,
    CLUSTER PRIMARY KEY ("id")
);


INSERT INTO "t_rule_config" /*+IGNORE_ROW_ON_DUPKEY_INDEX(t_rule_config(id))*/
    ("id", "rule_name", "update_timeliness_condition", "update_timeliness_value", "quality_pass_condition", "quality_pass_value", "logical_operator")
    VALUES('7013eef3-89b1-421d-bf29-09440c89139c','normal_update',NULL,'80',NULL,'0',NULL);

INSERT INTO "t_rule_config" /*+IGNORE_ROW_ON_DUPKEY_INDEX(t_rule_config(id))*/
    ("id", "rule_name", "update_timeliness_condition", "update_timeliness_value", "quality_pass_condition",  "quality_pass_value", "logical_operator")
    VALUES('7a063091-1690-442c-a555-c96179c01218','yellow_card','≥','50','≥','50','OR');

INSERT INTO "t_rule_config" /*+IGNORE_ROW_ON_DUPKEY_INDEX(t_rule_config(id))*/
    ("id", "rule_name", "update_timeliness_condition", "update_timeliness_value", "quality_pass_condition","quality_pass_value", "logical_operator")
    VALUES('7bff8f7a-447e-4baa-bb8e-2b27076659ff','red_card','<','50','<','50','OR');

INSERT INTO "t_rule_config" /*+IGNORE_ROW_ON_DUPKEY_INDEX(t_rule_config(id))*/
    ("id", "rule_name", "update_timeliness_condition", "update_timeliness_value", "quality_pass_condition","quality_pass_value", "logical_operator")
    VALUES('7f84f2c7-ac2c-446d-845f-7a73d62958ba','green_card','≥','80','≥','80','AND');



CREATE TABLE IF NOT EXISTS "t_apply_scope" (
     "id" VARCHAR(36 char) NOT NULL,
     "apply_scope_id" BIGINT NOT NULL,
     "name" VARCHAR(255 char) DEFAULT NULL,
     "deleted_at" BIGINT DEFAULT 0,
     CLUSTER PRIMARY KEY ("apply_scope_id")
);

CREATE INDEX IF NOT EXISTS t_apply_scope_idx_apply_scope_id ON t_apply_scope("id");


INSERT INTO "t_apply_scope"("id", "apply_scope_id", "name", "deleted_at")
    select '0b3326bf-5e2a-8c9e-1c7a-95ef5d7366da', 567701209553568061, '接口服务', 0 FROM DUAL
    WHERE NOT EXISTS (SELECT 1 FROM "t_apply_scope" WHERE apply_scope_id = 567701209553568061);

CREATE TABLE IF NOT EXISTS "t_category_apply_scope_relation" (
    "id" BIGINT NOT NULL IDENTITY(1,1),
    "category_id" VARCHAR(36 char) NOT NULL,
    "apply_scope_id" VARCHAR(36 char) NOT NULL,
    "required" TINYINT NOT NULL DEFAULT 0,
    "deleted_at" BIGINT DEFAULT 0,
    CLUSTER PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS t_category_apply_scope_relation_idx_category_id ON t_category_apply_scope_relation("category_id");
CREATE INDEX IF NOT EXISTS t_category_apply_scope_relation_idx_apply_scope_id ON t_category_apply_scope_relation("apply_scope_id");



CREATE TABLE IF NOT EXISTS "t_data_interface_apply" (
    "id" BIGINT NOT NULL IDENTITY(1,1),
    "interface_id" VARCHAR(255 char) NOT NULL,
    "apply_num" INT DEFAULT 0,
    "biz_date" VARCHAR(30 char) DEFAULT NULL,
    CLUSTER PRIMARY KEY (id)
);




CREATE TABLE IF NOT EXISTS "t_data_interface_aggregate" (
     "id" BIGINT NOT NULL IDENTITY(1, 1),
    "interface_id" VARCHAR(255 char) NOT NULL,
    "apply_num" INT DEFAULT 0,
    CLUSTER PRIMARY KEY (id)
);


CREATE TABLE IF NOT EXISTS "t_res_feedback" (
    "id" bigint NOT NULL ,
    "res_id" VARCHAR(64 char) NOT NULL ,
    "res_type" TINYINT NOT NULL ,
    "feedback_type" TINYINT NOT NULL ,
    "feedback_desc" VARCHAR(300 char) NOT NULL ,
    "status" TINYINT NOT NULL ,
    "created_at" datetime(3) NOT NULL DEFAULT current_timestamp(3) ,
    "created_by" VARCHAR(36 char) NOT NULL ,
    "updated_at" datetime(3) NOT NULL DEFAULT current_timestamp(3) ,
    "replied_at" datetime(3) DEFAULT NULL ,
    CLUSTER PRIMARY KEY ("id")
    );

CREATE INDEX  IF NOT EXISTS  idx_feedback_type ON  t_res_feedback("feedback_type");
CREATE INDEX  IF NOT EXISTS  idx_res_type    on     t_res_feedback("res_type");
CREATE INDEX  IF NOT EXISTS  idx_feedback_status on  t_res_feedback("status");
CREATE INDEX  IF NOT EXISTS  idx_feedback_created_by on  t_res_feedback("created_by");



CREATE TABLE IF NOT EXISTS "t_target" (
    "id" BIGINT NOT NULL IDENTITY(1,1) ,
    "target_name" VARCHAR(128 char) NOT NULL ,
    "target_type" TINYINT NOT NULL DEFAULT 1 ,
    "department_id" VARCHAR(36 char) NOT NULL ,
    "description" TEXT ,
    "start_date" DATE NOT NULL ,
    "end_date" DATE NULL ,
    "status" TINYINT NOT NULL DEFAULT 1 ,
    "responsible_uid" VARCHAR(36 char) NOT NULL ,
    "employee_id" text NOT NULL,
    "evaluation_content" text ,
    "created_at" DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ,
    "created_by" VARCHAR(36 char) NOT NULL ,
    "updated_at" DATETIME(3) DEFAULT NULL,
    "updated_by" VARCHAR(36 char) DEFAULT NULL ,
    CLUSTER PRIMARY KEY ("id")
    ) ;

CREATE INDEX  IF NOT EXISTS  idx_department_id on t_target(department_id);
CREATE INDEX  IF NOT EXISTS  idx_start_end_date  on t_target(start_date, end_date);
CREATE INDEX  IF NOT EXISTS  idx_status  on t_target(status);

CREATE TABLE  IF NOT EXISTS "t_target_plan" (
   "id" bigint NOT NULL IDENTITY(1, 1) ,
   "target_id" bigint NOT NULL ,
   "plan_type" TINYINT NOT NULL ,
   "plan_name" VARCHAR(128 char) NOT NULL ,
   "plan_desc" text null ,
   "responsible_uid" VARCHAR(50 char) NOT NULL ,
   "plan_quantity" TINYINT NOT NULL ,
   "actual_quantity" TINYINT DEFAULT NULL ,
   "status" TINYINT NOT NULL DEFAULT 0 ,
   "related_data_collection_plan_id" text null ,
   "related_data_collection_plan_name" VARCHAR(255 char) DEFAULT NULL ,
   "created_at" datetime(3) NOT NULL DEFAULT current_timestamp(3) ,
   "created_by" VARCHAR(36 char) NOT NULL ,
   "updated_at" datetime(3) DEFAULT NULL,
   "updated_by" VARCHAR(36 char) DEFAULT NULL ,
   "business_model_quantity" int DEFAULT NULL ,
   "business_process_quantity" int DEFAULT NULL ,
   "business_table_quantity" int DEFAULT NULL ,
   "business_model_actual_quantity" int DEFAULT NULL ,
   "business_process_actual_quantity" int DEFAULT NULL ,
   "business_table_actual_quantity" int DEFAULT NULL ,
   "data_process_explore_quantity" int DEFAULT NULL ,
   "data_process_fusion_quantity" int DEFAULT NULL ,
   "data_process_explore_actual_quantity" int DEFAULT NULL ,
   "data_process_fusion_actual_quantity" int DEFAULT NULL ,
   "data_understanding_quantity" int DEFAULT NULL ,
   "data_understanding_actual_quantity" int DEFAULT NULL ,
   "related_data_process_plan_id" text null ,
   "related_data_understanding_plan_id" text null ,
   "data_collection_quantity" int DEFAULT NULL ,
   "data_collection_actual_quantity" int DEFAULT NULL ,
   "assessment_type" TINYINT DEFAULT NULL ,
    CLUSTER PRIMARY KEY ("id")
) ;

CREATE INDEX  IF NOT EXISTS "idx_target_id" on t_target_plan("target_id");
CREATE INDEX  IF NOT EXISTS "idx_plan_type"  on t_target_plan("plan_type");
CREATE INDEX  IF NOT EXISTS "idx_responsible_uid"  on t_target_plan("responsible_uid");
CREATE INDEX  IF NOT EXISTS "idx_status"  on t_target_plan("status");
CREATE INDEX  IF NOT EXISTS "idx_plan_quantity"  on t_target_plan("plan_quantity");


CREATE TABLE IF NOT EXISTS "category_node_ext" (
    "id" BIGINT NOT NULL ,
    "category_node_id" VARCHAR(36 char)  NOT NULL   ,
    "category_id" VARCHAR(36 char)  NOT NULL  ,
    "parent_id" VARCHAR(36 char)  NOT NULL ,
    "name" VARCHAR(128 char) NOT NULL ,
    "owner" VARCHAR(128 char) NOT NULL DEFAULT ''  ,
    "owner_uid" VARCHAR(36 char)  DEFAULT NULL ,
    "required" TINYINT NOT NULL DEFAULT 0 ,
    "selected" TINYINT NOT NULL DEFAULT 0  ,
    "sort_weight" BIGINT NOT NULL ,
    "created_at" datetime(3) NOT NULL DEFAULT current_timestamp(3) ,
    "creator_uid" VARCHAR(36 char)  DEFAULT NULL ,
    "creator_name" VARCHAR(255 char) DEFAULT NULL ,
    "updated_at" datetime NOT NULL DEFAULT current_timestamp() ,
    "updater_uid" VARCHAR(36 char)  DEFAULT NULL ,
    "updater_name" VARCHAR(255 char) DEFAULT NULL ,
    "deleted_at" BIGINT DEFAULT 0  ,
    "deleter_uid" VARCHAR(36 char)  DEFAULT NULL ,
    "deleter_name" VARCHAR(255 char) DEFAULT NULL ,
    CLUSTER PRIMARY KEY ("id")
    ) ;

CREATE INDEX  IF NOT EXISTS "ux_category_node_ext_node_id" on category_node_ext("category_node_id");
CREATE INDEX  IF NOT EXISTS "ux_category_node_ext_sort"  on category_node_ext("category_id","parent_id","sort_weight","deleted_at");
CREATE INDEX  IF NOT EXISTS "ux_category_node_ext_name"  on category_node_ext("category_id","parent_id","name","deleted_at");