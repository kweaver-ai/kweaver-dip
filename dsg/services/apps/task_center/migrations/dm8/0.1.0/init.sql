SET SCHEMA af_tasks;

CREATE TABLE IF NOT EXISTS "operation_log" (
    "id" VARCHAR(36 char) NOT NULL,
    "obj" VARCHAR(255 char) NOT NULL,
    "obj_id" VARCHAR(36 char) NOT NULL,
    "name" VARCHAR(255 char) DEFAULT NULL,
    "success" TINYINT DEFAULT 1,
    "result" VARCHAR(1024 char) DEFAULT NULL,
    "created_by_uid" VARCHAR(36 char) NOT NULL,
    "deleted_at" BIGINT NOT NULL DEFAULT 0,
    "created_at" datetime(3) NOT NULL DEFAULT current_timestamp(3),
    CLUSTER PRIMARY KEY ("id")
    );

CREATE INDEX IF NOT EXISTS operation_log_idx_obj_id ON operation_log("obj_id");



CREATE TABLE IF NOT EXISTS "task_relation_data" (
    "id" VARCHAR(36 char) NOT NULL,
    "mid" BIGINT NOT NULL,
    "task_id" VARCHAR(36 char) NOT NULL,
    "project_id" VARCHAR(36 char) NOT NULL,
    "business_model_id" VARCHAR(36 char) DEFAULT NULL,
    "data" text,
    "updated_by_uid" VARCHAR(36 char) DEFAULT NULL,
    "updated_at" datetime(3) DEFAULT current_timestamp(3),
    "deleted_at" BIGINT  NOT NULL DEFAULT 0,
    CLUSTER PRIMARY KEY ("id")
    );

CREATE UNIQUE INDEX IF NOT EXISTS task_relation_data_task_id_idx ON task_relation_data("task_id","deleted_at");
CREATE INDEX IF NOT EXISTS task_relation_data_project_id_idx ON task_relation_data("project_id","deleted_at");



CREATE TABLE IF NOT EXISTS "tc_flow_info" (
    "id" VARCHAR(36 char) NOT NULL,
    "flow_id" VARCHAR(36 char) NOT NULL,
    "flow_version" VARCHAR(36 char) NOT NULL,
    "flow_name" VARCHAR(128 char) NOT NULL,
    "node_completion_mode" VARCHAR(128 char) NOT NULL,
    "node_start_mode" VARCHAR(128 char) NOT NULL,
    "node_id" VARCHAR(36 char) NOT NULL,
    "node_name" VARCHAR(128 char) NOT NULL,
    "node_unit_id" VARCHAR(36 char) NOT NULL,
    "prev_node_ids" VARCHAR(2048 char) DEFAULT NULL,
    "prev_node_unit_ids" VARCHAR(2048 char) DEFAULT NULL,
    "task_completion_mode" VARCHAR(128 char) NOT NULL,
    "stage_id" VARCHAR(36 char) DEFAULT NULL,
    "stage_name" VARCHAR(128 char) DEFAULT NULL,
    "stage_order" INT DEFAULT 0,
    "stage_unit_id" VARCHAR(36 char) DEFAULT NULL,
    "task_type" INT NOT NULL DEFAULT 1,
    "work_order_type" VARCHAR(10 char) DEFAULT NULL,
    CLUSTER PRIMARY KEY ("id")
    );



CREATE TABLE IF NOT EXISTS "tc_flow_view" (
    "mid" VARCHAR(36 char) NOT NULL,
    "id" VARCHAR(36 char) NOT NULL,
    "name" VARCHAR(128 char) NOT NULL DEFAULT '',
    "version" VARCHAR(36 char) NOT NULL,
    "content" text ,
    "created_at" datetime(3) NOT NULL DEFAULT current_timestamp(3),
    "created_by_uid" VARCHAR(36 char) NOT NULL DEFAULT '',
    "updated_at" datetime(3) NOT NULL DEFAULT current_timestamp(3),
    "updated_by_uid" VARCHAR(36 char) NOT NULL DEFAULT '',
    CLUSTER PRIMARY KEY ("mid")
    );

CREATE UNIQUE INDEX IF NOT EXISTS tc_flow_view_uk_id_version ON tc_flow_view("id","version");



CREATE TABLE IF NOT EXISTS "tc_member" (
    "id" VARCHAR(36 char) NOT NULL,
    "obj" TINYINT  NOT NULL,
    "obj_id" VARCHAR(36 char) NOT NULL,
    "role_id" VARCHAR(36 char)  NULL,
    "user_id" VARCHAR(36 char) NOT NULL,
    "created_at" datetime(3) NOT NULL DEFAULT current_timestamp(3),
    "deleted_at" BIGINT NOT NULL DEFAULT 0,
    CLUSTER PRIMARY KEY ("id")
    );



CREATE TABLE IF NOT EXISTS "tc_oss" (
    "id" VARCHAR(36 char) NOT NULL,
    "appendix" VARCHAR(128 char) NOT NULL,
    "size" BIGINT  NOT NULL DEFAULT 0,
    "created_at" datetime(3) NOT NULL DEFAULT current_timestamp(3),
    "updated_at" datetime(3) NOT NULL DEFAULT current_timestamp(3),
    "deleted_at" BIGINT NOT NULL DEFAULT 0,
    "file_uuid" VARCHAR(128 char) NOT NULL,
    CLUSTER PRIMARY KEY ("id")
    );



CREATE TABLE IF NOT EXISTS "tc_project" (
    "id" VARCHAR(36 char) NOT NULL,
    "name" VARCHAR(128 char) NOT NULL,
    "description" VARCHAR(255 char) DEFAULT NULL,
    "image" VARCHAR(2048 char) DEFAULT NULL,
    "flow_id" VARCHAR(36 char) NOT NULL,
    "flow_version" VARCHAR(36 char) NOT NULL,
    "status" TINYINT  DEFAULT 1,
    "priority" TINYINT  DEFAULT 1,
    "owner_id" VARCHAR(36 char) NOT NULL,
    "deadline" BIGINT  DEFAULT NULL,
    "complete_time" BIGINT  DEFAULT NULL,
    "project_type" INT NOT NULL DEFAULT 1,
    "created_by_uid" VARCHAR(36 char) NOT NULL,
    "created_at" datetime(3) NOT NULL DEFAULT current_timestamp(3),
    "updated_by_uid" VARCHAR(36 char) DEFAULT NULL,
    "updated_at" datetime(3) NOT NULL DEFAULT current_timestamp(3),
    "deleted_at" BIGINT NOT NULL DEFAULT 0,
    "third_project_id"  VARCHAR(36 char)  NULL,
    CLUSTER PRIMARY KEY ("id")
    );

CREATE UNIQUE INDEX IF NOT EXISTS tc_project_uk_name ON tc_project("name","deleted_at");



CREATE TABLE IF NOT EXISTS "tc_task" (
    "id" VARCHAR(36 char) NOT NULL,
    "name" VARCHAR(128 char) NOT NULL,
    "description" VARCHAR(255 char) DEFAULT NULL,
    "project_id" VARCHAR(36 char) NOT NULL,
    "work_order_id" VARCHAR(36 char) NOT NULL,
    "parent_task_id" VARCHAR(36 char) DEFAULT NULL,
    "flow_id" VARCHAR(36 char) DEFAULT NULL,
    "flow_version" VARCHAR(36 char) DEFAULT NULL,
    "stage_id" VARCHAR(36 char) DEFAULT NULL,
    "node_id" VARCHAR(36 char) NOT NULL,
    "status" TINYINT  DEFAULT 1,
    "config_status" TINYINT NOT NULL DEFAULT 1,
    "priority" TINYINT  DEFAULT 1,
    "executor_id" VARCHAR(36 char) NOT NULL,
    "deadline" BIGINT  DEFAULT NULL,
    "complete_time" BIGINT  NOT NULL DEFAULT 0,
    "created_by_uid" VARCHAR(36 char) NOT NULL,
    "created_at" datetime(3) NOT NULL DEFAULT current_timestamp(3),
    "updated_by_uid" VARCHAR(36 char) DEFAULT NULL,
    "updated_at" datetime(3) NOT NULL DEFAULT current_timestamp(3),
    "deleted_at" BIGINT NOT NULL DEFAULT 0,
    "task_type" INT NOT NULL DEFAULT 1,
    "business_model_id" VARCHAR(36 char) DEFAULT NULL,
    "executable_status" TINYINT  NOT NULL DEFAULT 2,
    "org_type" INT DEFAULT NULL,
    "subject_domain_id" VARCHAR(36 char) NOT NULL,
    "data_comprehension_catalog_id" text,
    "data_comprehension_template_id" VARCHAR(36 char),
    "model_child_task_types"  VARCHAR(20 char)  null,
    CLUSTER PRIMARY KEY ("id")
    );


CREATE TABLE IF NOT EXISTS "user" (
    "id" VARCHAR(36 char) NOT NULL,
    "name" VARCHAR(255 char) DEFAULT NULL,
    "status" TINYINT  NOT NULL DEFAULT 1,
    "user_type" TINYINT NOT NULL DEFAULT 1,
    CLUSTER PRIMARY KEY ("id")
    );

CREATE UNIQUE INDEX IF NOT EXISTS user_t_user_id ON "user"("id");



CREATE TABLE IF NOT EXISTS "data_comprehension_plan" (
                                                         "data_comprehension_plan_id" BIGINT  NOT NULL,
                                                         "id" VARCHAR(36 char) NOT NULL,
    "name" VARCHAR(128 char) NOT NULL,
    "responsible_uid" VARCHAR(36 char) NOT NULL,
    "started_at" BIGINT  NOT NULL,
    "finished_at" BIGINT  DEFAULT NULL,
    "task_id" VARCHAR(36 char) DEFAULT NULL,
    "attachment_id" VARCHAR(36 char) DEFAULT NULL,
    "attachment_name" VARCHAR(255 char) DEFAULT NULL,
    "content" text  ,
    "opinion" VARCHAR(300 char) DEFAULT '',
    "audit_status" TINYINT DEFAULT NULL,
    "audit_id" BIGINT DEFAULT NULL,
    "audit_proc_inst_id" VARCHAR(64 char) DEFAULT NULL,
    "audit_result" VARCHAR(64 char) DEFAULT NULL,
    "reject_reason" VARCHAR(300 char) DEFAULT NULL,
    "cancel_reason" VARCHAR(300 char) DEFAULT NULL,
    "status" TINYINT DEFAULT NULL,
    "created_at" datetime(3) NOT NULL DEFAULT current_timestamp(3),
    "created_by_uid" VARCHAR(36 char) NOT NULL,
    "updated_at" datetime(3) NOT NULL DEFAULT current_timestamp(3),
    "updated_by_uid" VARCHAR(36 char) NOT NULL,
    "deleted_at" BIGINT DEFAULT 0,
    CLUSTER PRIMARY KEY ("data_comprehension_plan_id")
    );

CREATE UNIQUE INDEX IF NOT EXISTS data_comprehension_plan_data_comprehension_plan_name ON data_comprehension_plan("name","deleted_at");



CREATE TABLE IF NOT EXISTS "data_aggregation_plan" (
                                                       "data_aggregation_plan_id" BIGINT  NOT NULL,
                                                       "id" VARCHAR(36 char) NOT NULL,
    "name" VARCHAR(128 char) NOT NULL,
    "responsible_uid" VARCHAR(36 char) NOT NULL,
    "priority" VARCHAR(64 char) NOT NULL,
    "started_at" BIGINT  NOT NULL,
    "finished_at" BIGINT  DEFAULT NULL,
    "auto_start" TINYINT NOT NULL,
    "content" text ,
    "opinion" VARCHAR(300 char) DEFAULT '',
    "audit_status" TINYINT DEFAULT NULL,
    "audit_id" BIGINT DEFAULT NULL,
    "audit_proc_inst_id" VARCHAR(64 char) DEFAULT NULL,
    "audit_result" VARCHAR(64 char) DEFAULT NULL,
    "reject_reason" VARCHAR(300 char) DEFAULT NULL,
    "cancel_reason" VARCHAR(300 char) DEFAULT NULL,
    "status" TINYINT DEFAULT NULL,
    "created_at" datetime(3) NOT NULL DEFAULT current_timestamp(3),
    "created_by_uid" VARCHAR(36 char) NOT NULL,
    "updated_at" datetime(3) NOT NULL DEFAULT current_timestamp(3),
    "updated_by_uid" VARCHAR(36 char) NOT NULL,
    "deleted_at" BIGINT DEFAULT 0,
    CLUSTER PRIMARY KEY ("data_aggregation_plan_id")
    );

CREATE UNIQUE INDEX IF NOT EXISTS data_aggregation_plan_data_aggregation_plan_name ON data_aggregation_plan("name","deleted_at");



CREATE TABLE IF NOT EXISTS "data_processing_plan" (
                                                      "data_processing_plan_id" BIGINT  NOT NULL,
                                                      "id" VARCHAR(36 char) NOT NULL,
    "name" VARCHAR(128 char) NOT NULL,
    "responsible_uid" VARCHAR(36 char) NOT NULL,
    "priority" VARCHAR(64 char) NOT NULL,
    "started_at" BIGINT  NOT NULL,
    "finished_at" BIGINT  DEFAULT NULL,
    "content" text,
    "opinion" VARCHAR(800 char) DEFAULT '',
    "audit_status" TINYINT DEFAULT NULL,
    "audit_id" BIGINT DEFAULT NULL,
    "audit_proc_inst_id" VARCHAR(64 char) DEFAULT NULL,
    "audit_result" VARCHAR(64 char) DEFAULT NULL,
    "reject_reason" VARCHAR(300 char) DEFAULT NULL,
    "cancel_reason" VARCHAR(300 char) DEFAULT NULL,
    "status" TINYINT DEFAULT NULL,
    "created_at" datetime(3) NOT NULL DEFAULT current_timestamp(3),
    "created_by_uid" VARCHAR(36 char) NOT NULL,
    "updated_at" datetime(3) NOT NULL DEFAULT current_timestamp(3),
    "updated_by_uid" VARCHAR(36 char) NOT NULL,
    "deleted_at" BIGINT DEFAULT 0,
    CLUSTER PRIMARY KEY ("data_processing_plan_id")
    );

CREATE UNIQUE INDEX IF NOT EXISTS data_processing_plan_data_processing_plan_name ON data_processing_plan("name","deleted_at");

CREATE TABLE IF NOT EXISTS "work_order" (
                                            "id" BIGINT NOT NULL,
                                            "work_order_id" VARCHAR(36 char) NOT NULL,
    "name" VARCHAR(128 char) NOT NULL,
    "code" VARCHAR(255 char) NOT NULL DEFAULT '',
    "type" TINYINT NOT NULL,
    "status" TINYINT NOT NULL,
    "draft" TINYINT NOT NULL,
    "responsible_uid" VARCHAR(36 char) DEFAULT '',
    "data_source_department_id" VARCHAR(36 char) NULL,
    "priority" TINYINT DEFAULT NULL,
    "finished_at" DATE DEFAULT NULL,
    "catalog_ids" text NULL,
    "data_aggregation_inventory_id" VARCHAR(36 char) NOT NULL,
    "business_forms" text,
    "description" VARCHAR(800 char) DEFAULT '',
    "remark" text,
    "processing_instructions" VARCHAR(255 char) DEFAULT '',
    "audit_id" BIGINT DEFAULT NULL,
    "audit_status" TINYINT DEFAULT NULL,
    "audit_description" VARCHAR(255 char) DEFAULT '',
    "source_type" TINYINT DEFAULT NULL,
    "source_id" VARCHAR(36 char) DEFAULT '',
    "source_ids" text,
    "created_by_uid" VARCHAR(36 char) NOT NULL,
    "created_at" DATETIME(3) NOT NULL,
    "updated_by_uid" VARCHAR(36 char) DEFAULT NULL,
    "updated_at" DATETIME(3) DEFAULT NULL,
    "acceptance_at" DATETIME(3) DEFAULT NULL,
    "deleted_at" BIGINT NOT NULL,
    "process_at" DATETIME(3) DEFAULT NULL,
    "report_id" VARCHAR(64 char) DEFAULT NULL,
    "report_version" TINYINT DEFAULT NULL,
    "report_at" datetime(3) DEFAULT NULL,
    "reject_reason" VARCHAR(300 char) DEFAULT NULL,
    "remind" TINYINT DEFAULT NULL,
    "score" TINYINT DEFAULT NULL,
    "feedback_content" VARCHAR(300 char) DEFAULT NULL,
    "feedback_at" datetime(3) DEFAULT NULL,
    "feedback_by" VARCHAR(36 char) DEFAULT NULL,
    "synced" BIT NOT NULL DEFAULT '0',
    "node_id" VARCHAR(36 char) DEFAULT NULL,
    "stage_id" VARCHAR(36 char) DEFAULT NULL,
    "department_id" VARCHAR(36 char) DEFAULT NULL,
    CLUSTER PRIMARY KEY ("id")
    );

CREATE INDEX IF NOT EXISTS work_order_idx_work_order_id ON work_order("work_order_id");

CREATE TABLE IF NOT EXISTS "work_order_tasks" (
    "id"            VARCHAR(36 char)        NOT NULL,
    "name"          VARCHAR(128 char)    NOT NULL,
    "created_at"    DATETIME(3)     NOT NULL,
    "updated_at"    DATETIME(3)     NOT NULL,
    "third_party_id"    VARCHAR(36 char)        NOT NULL,
    "work_order_id"     VARCHAR(36 char)        NOT NULL,
    "status"            VARCHAR(64 char)     NOT NULL,
    "reason"            VARCHAR(512 char)    NOT NULL,
    "link"              VARCHAR(512 char)    NOT NULL,
    CLUSTER PRIMARY KEY ("id")
    );

CREATE INDEX IF NOT EXISTS work_order_tasks_idx_work_order_id ON work_order_tasks("work_order_id");




CREATE TABLE IF NOT EXISTS "work_order_data_aggregation_details" (
    "id"         VARCHAR(36 char)        NOT NULL,
    "department_id"         VARCHAR(36 char)        NOT NULL,
    "source_datasource_id"  VARCHAR(256 char)    NOT NULL,
    "source_table_name"     VARCHAR(256 char)    NOT NULL,
    "target_datasource_id"  VARCHAR(256 char)    NOT NULL,
    "target_table_name"     VARCHAR(256 char)    NOT NULL,
    "count"                 INTEGER         NOT NULL,
    CLUSTER PRIMARY KEY ("id", "source_datasource_id", "source_table_name")
    );




CREATE TABLE IF NOT EXISTS "work_order_data_fusion_details" (
    "id"         VARCHAR(36 char)        NOT NULL,
    "datasource_id"     VARCHAR(36 char),
    "datasource_name"   VARCHAR(128 char),
    "data_table"        VARCHAR(128 char),
    CLUSTER PRIMARY KEY ("id")
    );




CREATE TABLE IF NOT EXISTS "work_order_data_quality_audit_details" (
    "id"         VARCHAR(36 char)        NOT NULL,
    "work_order_id"     VARCHAR(36 char)        NOT NULL,
    "datasource_id"     VARCHAR(36 char),
    "datasource_name"   VARCHAR(128 char),
    "data_table"        VARCHAR(128 char),
    "detection_scheme"  VARCHAR(128 char),
    "status"            VARCHAR(64 char)     NOT NULL,
    "reason"            VARCHAR(512 char)    NOT NULL,
    "link"              VARCHAR(512 char)    NOT NULL,
    CLUSTER PRIMARY KEY ("id")
    );




CREATE TABLE IF NOT EXISTS "work_order_form_view_fields" (
    "work_order_id" VARCHAR(36 char) NOT NULL,
    "form_view_id" VARCHAR(36 char) NOT NULL,
    "form_view_field_id" VARCHAR(36 char) NOT NULL,
    "standard_required" BIT NOT NULL,
    "data_element_id" BIGINT NOT NULL,
    CLUSTER PRIMARY KEY ("work_order_id", "form_view_id", "form_view_field_id")
    );


CREATE TABLE IF NOT EXISTS "data_aggregation_inventories" (
    "id"                VARCHAR(36 char)        NOT NULL,
    "code"              VARCHAR(21 char)     NOT NULL,
    "name"              VARCHAR(128 char)    NOT NULL,
    "creation_method"   INTEGER         NOT NULL,
    "department_id"     VARCHAR(36 char)        NOT NULL,
    "apply_id"          VARCHAR(36 char)        NOT NULL,
    "status"            INTEGER         NOT NULL,
    "created_at"        DATETIME(3)     NOT NULL,
    "creator_id"        VARCHAR(36 char)        NOT NULL,
    "requested_at"      DATETIME(3)                 DEFAULT NULL,
    "requester_id"        VARCHAR(36 char)        NOT NULL,
    "deleted_at"        BIGINT      NOT NULL,
    CLUSTER PRIMARY KEY ("id", "code")
    );

CREATE INDEX IF NOT EXISTS data_aggregation_inventories_list ON data_aggregation_inventories("name", "apply_id", "department_id", "status", "requested_at", "deleted_at");




CREATE TABLE IF NOT EXISTS "data_aggregation_resources" (
    "id"                            VARCHAR(36 char)      NOT NULL,
    "data_view_id"                  VARCHAR(36 char)      NOT NULL,
    "data_aggregation_inventory_id" VARCHAR(36 char)      NOT NULL,
    "work_order_id"                 VARCHAR(36 char)      NOT NULL,
    "collection_method"             INTEGER       NOT NULL,
    "sync_frequency"                INTEGER       NOT NULL,
    "business_form_id"              VARCHAR(36 char)      NOT NULL,
    "data_table_name"               VARCHAR(128 char)  DEFAULT  '',
    "target_datasource_id"          VARCHAR(36 char)      NOT NULL,
    "updated_at"                    BIGINT    NOT NULL,
    "deleted_at"                    BIGINT    NOT NULL,
    CLUSTER PRIMARY KEY ("id")
    );

CREATE UNIQUE INDEX IF NOT EXISTS data_aggregation_resources_data_view_inventory_order_id ON data_aggregation_resources("data_view_id", "data_aggregation_inventory_id", "work_order_id", "deleted_at");






CREATE TABLE IF NOT EXISTS "data_research_report" (
                                                      "data_research_report_id" BIGINT  NOT NULL,
                                                      "id" VARCHAR(36 char) NOT NULL,
    "name" VARCHAR(128 char) NOT NULL,
    "work_order_id" VARCHAR(36 char) NOT NULL,
    "research_purpose" VARCHAR(300 char) NOT NULL DEFAULT '',
    "research_object" VARCHAR(300 char) NOT NULL DEFAULT '',
    "research_method" VARCHAR(300 char) NOT NULL DEFAULT '',
    "research_content" text ,
    "research_conclusion" VARCHAR(800 char) NOT NULL DEFAULT '',
    "remark" VARCHAR(800 char) NOT NULL DEFAULT '',
    "audit_status" TINYINT DEFAULT NULL,
    "audit_id" BIGINT DEFAULT NULL,
    "audit_proc_inst_id" VARCHAR(64 char) DEFAULT NULL,
    "audit_result" VARCHAR(64 char) DEFAULT NULL,
    "reject_reason" VARCHAR(300 char) DEFAULT NULL,
    "cancel_reason" VARCHAR(300 char) DEFAULT NULL,
    "declaration_status" TINYINT NOT NULL,
    "created_at" datetime(3) NOT NULL DEFAULT current_timestamp(3),
    "created_by_uid" VARCHAR(36 char) NOT NULL,
    "updated_at" datetime(3) NOT NULL DEFAULT current_timestamp(3),
    "updated_by_uid" VARCHAR(36 char) NOT NULL DEFAULT '',
    "deleted_at" BIGINT DEFAULT 0,
    CLUSTER PRIMARY KEY ("data_research_report_id")
    );

CREATE UNIQUE INDEX IF NOT EXISTS data_research_report_data_research_report_name ON data_research_report("name","deleted_at");



CREATE TABLE IF NOT EXISTS "data_research_report_change_audit" (
                                                                   "data_research_report_id" BIGINT  NOT NULL,
                                                                   "id" VARCHAR(36 char) NOT NULL,
    "work_order_id" VARCHAR(36 char) NOT NULL,
    "research_purpose" VARCHAR(300 char) NOT NULL DEFAULT '',
    "research_object" VARCHAR(300 char) NOT NULL DEFAULT '',
    "research_method" VARCHAR(300 char) NOT NULL DEFAULT '',
    "research_content" text  ,
    "research_conclusion" VARCHAR(800 char) NOT NULL DEFAULT '',
    "remark" VARCHAR(800 char) NOT NULL DEFAULT '',
    "created_at" datetime(3) NOT NULL DEFAULT current_timestamp(3),
    "created_by_uid" VARCHAR(36 char) NOT NULL,
    "updated_at" datetime(3) NOT NULL DEFAULT current_timestamp(3),
    "updated_by_uid" VARCHAR(36 char) NOT NULL DEFAULT '',
    "deleted_at" BIGINT DEFAULT 0,
    CLUSTER PRIMARY KEY ("data_research_report_id")
    );

CREATE INDEX IF NOT EXISTS data_research_report_change_audit_idx_deleted_at ON data_research_report_change_audit("deleted_at");
CREATE INDEX IF NOT EXISTS data_research_report_change_audit_idx_id ON data_research_report_change_audit("id","deleted_at");



CREATE TABLE IF NOT EXISTS "points_rule_config" (
                                                    "point_rule_config_id" BIGINT  NOT NULL,
                                                    "id" VARCHAR(36 char) NOT NULL,
    "code" VARCHAR(128 char) NOT NULL,
    "rule_type" VARCHAR(36 char) NOT NULL,
    "config" text,
    "period" text,
    "created_at" datetime(3) NOT NULL DEFAULT current_timestamp(3),
    "created_by_uid" VARCHAR(36 char) NOT NULL,
    "updated_at" datetime(3) NOT NULL DEFAULT current_timestamp(3),
    "updated_by_uid" VARCHAR(36 char) NOT NULL,
    "deleted_at" BIGINT DEFAULT 0,
    CLUSTER PRIMARY KEY ("point_rule_config_id")
    );

CREATE UNIQUE INDEX IF NOT EXISTS points_rule_config_point_rule_config_code ON points_rule_config("code","deleted_at");



CREATE TABLE IF NOT EXISTS "points_event" (
                                              "point_event_id" BIGINT  NOT NULL,
                                              "id" VARCHAR(36 char) NOT NULL,
    "code" VARCHAR(128 char) NOT NULL,
    "business_module" VARCHAR(128 char) NOT NULL,
    "points_object_type" VARCHAR(10 char) NOT NULL,
    "points_object_id" VARCHAR(36 char) NOT NULL,
    "points_object_name" VARCHAR(1024 char) NOT NULL,
    "points_value" INT NOT NULL,
    "created_at" datetime(3) NOT NULL DEFAULT current_timestamp(3),
    CLUSTER PRIMARY KEY ("point_event_id")
    );



CREATE TABLE IF NOT EXISTS "points_event_top_department" (
                                                             "point_event_top_department_id" BIGINT  NOT NULL,
                                                             "id" VARCHAR(36 char) NOT NULL,
    "department_id" VARCHAR(36 char) NOT NULL,
    "department_name" VARCHAR(1024 char) NOT NULL,
    "department_path" VARCHAR(1024 char) NOT NULL,
    "points_event_id" BIGINT  NOT NULL,
    "created_at" datetime(3) NOT NULL DEFAULT current_timestamp(3),
    CLUSTER PRIMARY KEY ("point_event_top_department_id")
    );




CREATE TABLE IF NOT EXISTS "t_work_order_extend" (
                                                     "id" BIGINT NOT NULL,
                                                     "work_order_id" VARCHAR(36 char) NOT NULL,
    "extend_key" VARCHAR(255 char)  NOT NULL,
    "extend_value" VARCHAR(255 char)  NOT NULL,
    "fusion_type" INT  NOT NULL  DEFAULT 1,
    "exec_sql" text   NULL,
    "scene_sql" text   NULL,
    "scene_analysis_id"  VARCHAR(36 char)  NULL,
    "run_cron_strategy"  VARCHAR(36 char)  NULL,
    "datasource_id"  VARCHAR(36 char)  NULL,
    "run_start_at"  datetime(3) DEFAULT NULL,
    "run_end_at" datetime(3) DEFAULT NULL,
    "deleted_at" DATETIME(3) DEFAULT NULL,
    CLUSTER PRIMARY KEY ("id")
    );

CREATE INDEX IF NOT EXISTS t_work_order_extend_idx_extend_work_order_id ON t_work_order_extend("work_order_id");



CREATE TABLE IF NOT EXISTS  "t_fusion_field" (
                                                 "id" BIGINT NOT NULL,
                                                 "c_name" VARCHAR(255 char)  NOT NULL,
    "e_name" VARCHAR(255 char)  NOT NULL,
    "work_order_id" VARCHAR(36 char) NOT NULL,
    "standard_id" BIGINT DEFAULT NULL,
    "code_table_id" BIGINT DEFAULT NULL,
    "code_rule_id" BIGINT DEFAULT NULL,
    "data_range" text NULL,
    "data_type" INT  NOT NULL,
    "data_length" INT  DEFAULT NULL,
    "data_accuracy" INT DEFAULT NULL,
    "primary_key" TINYINT DEFAULT NULL,
    "is_required" TINYINT DEFAULT NULL,
    "is_increment" TINYINT DEFAULT NULL,
    "is_standard" TINYINT DEFAULT NULL,
    "field_relationship" VARCHAR(128 char) NOT NULL DEFAULT '',
    "catalog_id" BIGINT  DEFAULT NULL,
    "info_item_id" BIGINT DEFAULT NULL,
    "index" INT NOT NULL,
    "created_by_uid" VARCHAR(36 char) NOT NULL,
    "created_at" DATETIME(3) NOT NULL,
    "updated_by_uid" VARCHAR(36 char) DEFAULT NULL,
    "updated_at" DATETIME(3) DEFAULT NULL,
    "deleted_by_uid" VARCHAR(36 char) DEFAULT NULL,
    "deleted_at" DATETIME(3) DEFAULT NULL,
    CLUSTER PRIMARY KEY ("id")
    );

CREATE INDEX IF NOT EXISTS t_fusion_field_idx_t_fusion_field_work_order_id ON t_fusion_field("work_order_id");


CREATE TABLE IF NOT EXISTS "data_quality_improvement" (
    "id" VARCHAR(36 char) NOT NULL,
    "work_order_id" VARCHAR(36 char) NOT NULL,
    "field_id" VARCHAR(36 char) NOT NULL,
    "rule_id" VARCHAR(36 char) NOT NULL,
    "rule_name" VARCHAR(255 char) NOT NULL,
    "dimension" VARCHAR(255 char) NOT NULL,
    "inspected_count" INT NOT NULL,
    "issue_count" INT NOT NULL,
    "score" FLOAT NOT NULL,
    "deleted_at" BIGINT NOT NULL,
    CLUSTER PRIMARY KEY ("id")
    );

CREATE INDEX IF NOT EXISTS data_quality_improvement_idx_work_order_id ON data_quality_improvement("work_order_id");




CREATE TABLE IF NOT EXISTS  "t_quality_audit_form_view_relation" (
                                                                     "id" BIGINT NOT NULL,
                                                                     "work_order_id" VARCHAR(36 char) NOT NULL,
    "form_view_id" VARCHAR(36 char) NOT NULL,
    "datasource_id" VARCHAR(36 char)  DEFAULT NULL,
    "status"  TINYINT DEFAULT NULL,
    "created_by_uid" VARCHAR(36 char) NOT NULL,
    "created_at" DATETIME(3) NOT NULL,
    "updated_by_uid" VARCHAR(36 char) DEFAULT NULL,
    "updated_at" DATETIME(3) DEFAULT NULL,
    "deleted_by_uid" VARCHAR(36 char) DEFAULT NULL,
    "deleted_at" DATETIME(3) DEFAULT NULL,
    CLUSTER PRIMARY KEY ("id")
    );

CREATE INDEX IF NOT EXISTS t_quality_audit_form_view_relation_idx_quality_audit_work_order_id ON t_quality_audit_form_view_relation("work_order_id");




CREATE TABLE IF NOT EXISTS "tc_tenant_app" (
                                               "tenant_application_id" BIGINT NOT NULL,
                                               "id" VARCHAR(100 char) DEFAULT NULL,
    "application_name" VARCHAR(150 char) DEFAULT NULL,
    "application_code" VARCHAR(100 char) DEFAULT NULL,
    "tenant_name" VARCHAR(150 char) DEFAULT NULL,
    "tenant_admin_id" VARCHAR(150 char) DEFAULT NULL,
    "business_unit_id" VARCHAR(100 char) DEFAULT NULL,
    "business_unit_contactor_id" VARCHAR(100 char) DEFAULT NULL,
    "business_unit_phone" VARCHAR(150 char) DEFAULT NULL,
    "business_unit_email" VARCHAR(150 char) DEFAULT NULL,
    "business_unit_fax" VARCHAR(150 char) DEFAULT NULL,
    "maintenance_unit_id" VARCHAR(100 char) DEFAULT NULL,
    "maintenance_unit_name" VARCHAR(150 char) DEFAULT NULL,
    "maintenance_unit_contactor_id" VARCHAR(100 char) DEFAULT NULL,
    "maintenance_unit_contactor_name" VARCHAR(150 char) DEFAULT NULL,
    "maintenance_unit_phone" VARCHAR(150 char) DEFAULT NULL,
    "maintenance_unit_email" VARCHAR(150 char) DEFAULT NULL,
    "status" TINYINT DEFAULT NULL,
    "audit_id" BIGINT DEFAULT NULL,
    "audit_proc_inst_id" VARCHAR(64 char) DEFAULT NULL,
    "audit_result" VARCHAR(64 char) DEFAULT NULL,
    "reject_reason" VARCHAR(300 char) DEFAULT NULL,
    "cancel_reason" VARCHAR(300 char) DEFAULT NULL,
    "declaration_status" TINYINT DEFAULT NULL,
    "audit_status" TINYINT DEFAULT NULL,
    "created_by_uid" VARCHAR(36 char) DEFAULT NULL,
    "created_at" datetime(0) DEFAULT NULL,
    "updated_by_uid" VARCHAR(100 char) DEFAULT NULL,
    "updated_at" datetime(0) DEFAULT NULL,
    "deleted_at" INT DEFAULT 0,
    CLUSTER PRIMARY KEY ("tenant_application_id")
    );

CREATE INDEX IF NOT EXISTS tc_tenant_app_tc_tenant_app_id_IDX ON tc_tenant_app("id");
CREATE INDEX IF NOT EXISTS tc_tenant_app_tc_tenant_app_tenant_application_id_IDX ON tc_tenant_app("tenant_application_id");




CREATE TABLE IF NOT EXISTS "tc_tenant_app_db_account" (
                                                          "database_account_id" BIGINT NOT NULL,
                                                          "id" VARCHAR(100 char) DEFAULT NULL,
    "tenant_application_id" VARCHAR(100 char) DEFAULT NULL,
    "database_type" VARCHAR(100 char) DEFAULT NULL,
    "database_name" VARCHAR(150 char) DEFAULT NULL,
    "tenant_account" VARCHAR(150 char) DEFAULT NULL,
    "tenant_passwd" VARCHAR(150 char) DEFAULT NULL,
    "project_name" VARCHAR(150 char) DEFAULT NULL,
    "actual_allocated_resources" text,
    "user_authentication_hadoop" text,
    "user_authentication_hbase" text,
    "user_authentication_hive" text,
    "created_by_uid" VARCHAR(100 char) DEFAULT NULL,
    "created_at" datetime(0) DEFAULT NULL,
    "updated_by_uid" VARCHAR(100 char) DEFAULT NULL,
    "updated_at" VARCHAR(100 char) DEFAULT NULL,
    "deleted_at" INT DEFAULT NULL,
    CLUSTER PRIMARY KEY ("database_account_id")
    );

CREATE INDEX IF NOT EXISTS tc_tenant_app_db_account_tc_tenant_app_db_account_id_IDX ON tc_tenant_app_db_account("id");
CREATE INDEX IF NOT EXISTS tc_tenant_app_db_account_tc_tenant_app_db_account_tenant_application_id_IDX ON tc_tenant_app_db_account("tenant_application_id");




CREATE TABLE IF NOT EXISTS "tc_tenant_app_db_data_resource" (
                                                                "data_resource_id" BIGINT DEFAULT NULL,
                                                                "id" VARCHAR(100 char) DEFAULT NULL,
    "tenant_application_id" VARCHAR(100 char) DEFAULT NULL,
    "database_account_id" VARCHAR(100 char) DEFAULT NULL,
    "data_catalog_id" VARCHAR(100 char) DEFAULT NULL,
    "data_catalog_name" VARCHAR(150 char) DEFAULT NULL,
    "data_catalog_code" VARCHAR(100 char) DEFAULT NULL,
    "mount_resource_id" VARCHAR(100 char) DEFAULT NULL,
    "mount_resource_name" VARCHAR(300 char) DEFAULT NULL,
    "mount_resource_code" VARCHAR(100 char) DEFAULT NULL,
    "data_source_id" VARCHAR(100 char) DEFAULT NULL,
    "data_source_name" VARCHAR(150 char) DEFAULT NULL,
    "apply_permission" VARCHAR(100 char) DEFAULT NULL,
    "apply_purpose" text ,
    "created_by_uid" VARCHAR(100 char) DEFAULT NULL,
    "created_at" datetime(0) DEFAULT NULL,
    "updated_by_uid" VARCHAR(100 char) DEFAULT NULL,
    "updated_at" datetime(0) DEFAULT NULL,
    "deleted_at" INT DEFAULT NULL,
    CLUSTER PRIMARY KEY ("data_resource_id")
    );

CREATE INDEX IF NOT EXISTS tc_tenant_app_db_data_resource_idx_id ON tc_tenant_app_db_data_resource("id");
CREATE INDEX IF NOT EXISTS tc_tenant_app_db_data_resource_idx_tenant_application_id ON tc_tenant_app_db_data_resource("tenant_application_id");





CREATE TABLE if not EXISTS "db_sandbox"(
                                           "sid"    BIGINT  NOT NULL,
                                           "id"   VARCHAR(36 char)  NOT NULL,
    "department_id" VARCHAR(36 char)  NOT NULL,
    "department_name" VARCHAR(128 char)  default '',
    "status" TINYINT NOT NULL default 0,
    "project_id" VARCHAR(128 char) NOT NULL,
    "total_space" INT NULL default 0,
    "valid_start" BIGINT  DEFAULT 0,
    "valid_end"   BIGINT  DEFAULT 0,
    "applicant_id"  VARCHAR(36 char) DEFAULT NULL,
    "applicant_name" VARCHAR(255 char) DEFAULT NULL,
    "applicant_phone" VARCHAR(255 char) DEFAULT NULL,
    "executed_time"  datetime(3) DEFAULT NULL,
    "datasource_id" VARCHAR(36 char) NOT NULL,
    "datasource_name" VARCHAR(128 char) NOT NULL,
    "datasource_type_name" VARCHAR(128 char) NOT NULL,
    "database_name" VARCHAR(128 char) NOT NULL,
    "username" VARCHAR(128 char) NOT NULL,
    "password" VARCHAR(1024 char) NOT NULL,
    "recent_data_set"  VARCHAR(128 char) default '',
    "updated_at" datetime(0) NOT NULL DEFAULT current_timestamp(),
    "updater_uid" VARCHAR(36 char) DEFAULT NULL,
    "deleted_at"  BIGINT   DEFAULT NULL,
    CLUSTER PRIMARY KEY ("id")
    );



CREATE TABLE IF NOT EXISTS "db_sandbox_apply" (
                                                  "sid"  BIGINT  NOT NULL,
                                                  "id" VARCHAR(36 char) NOT NULL,
    "sandbox_id"  VARCHAR(36 char) NOT NULL,
    "applicant_id"  VARCHAR(36 char) DEFAULT NULL,
    "applicant_name" VARCHAR(255 char) DEFAULT NULL,
    "applicant_phone" VARCHAR(255 char) DEFAULT NULL,
    "request_space" INT NULL default 0,
    "status"  TINYINT NOT NULL default 0,
    "operation" TINYINT NOT NULL  default 0,
    "audit_state" TINYINT NOT NULL default 0,
    "audit_id"    VARCHAR(64 char) DEFAULT '',
    "audit_advice" text ,
    "proc_def_key" VARCHAR(128 char) NOT NULL DEFAULT '',
    "result" TINYINT NOT NULL default 0,
    "reason" VARCHAR(1024 char) DEFAULT NULL,
    "apply_time" datetime(3) NOT NULL DEFAULT current_timestamp(3),
    "updated_at" datetime(0) NOT NULL DEFAULT current_timestamp(),
    "updater_uid" VARCHAR(36 char) DEFAULT NULL,
    "deleted_at"  BIGINT   DEFAULT NULL,
    CLUSTER PRIMARY KEY ("id")
    );



CREATE TABLE if not EXISTS "db_sandbox_execution"(
                                                     "sid" BIGINT  NOT NULL,
                                                     "id"  VARCHAR(36 char) NOT NULL,
    "sandbox_id"   VARCHAR(36 char) NOT NULL,
    "apply_id"   VARCHAR(36 char)  NOT NULL,
    "description" VARCHAR(1024 char) NOT NULL,
    "execute_type"  TINYINT NOT NULL default 0,
    "execute_status"  TINYINT NOT NULL default 0,
    "executor_id"  VARCHAR(36 char) DEFAULT NULL,
    "executor_name" VARCHAR(255 char) DEFAULT NULL,
    "executor_phone" VARCHAR(255 char) DEFAULT NULL,
    "executed_time"  datetime(3) DEFAULT NULL,
    "created_at" datetime(3) NOT NULL DEFAULT current_timestamp(3),
    "creator_uid" VARCHAR(36 char) DEFAULT NULL,
    "updated_at" datetime(0) NOT NULL DEFAULT current_timestamp(),
    "updater_uid" VARCHAR(36 char) DEFAULT NULL,
    "deleted_at"  BIGINT   DEFAULT NULL,
    CLUSTER PRIMARY KEY ("id")
    );

CREATE TABLE if not EXISTS "db_sandbox_log"(
                                               "sid" BIGINT  NOT NULL,
                                               "id"  VARCHAR(36 char) NOT NULL,
    "apply_id"   VARCHAR(36 char) NOT NULL,
    "execute_step"  TINYINT NOT NULL default 0,
    "executor_id"  VARCHAR(36 char) DEFAULT NULL,
    "executor_name" VARCHAR(255 char) DEFAULT NULL,
    "execute_time"  datetime(3) NOT NULL DEFAULT current_timestamp(),
    CLUSTER PRIMARY KEY ("id")
    );

CREATE TABLE IF NOT EXISTS "work_order_template" (
                                                     "id" BIGINT   NOT NULL IDENTITY(1, 1),
    "ticket_type" VARCHAR(50 char) NOT NULL ,
    "template_name" VARCHAR(128 char) NOT NULL  ,
    "description" VARCHAR(500 char) DEFAULT NULL  ,
    "created_by_uid" VARCHAR(50 char) NOT NULL ,
    "created_at" datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ,
    "updated_time" datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ,
    "updated_by_uid" VARCHAR(50 char) NOT NULL ,
    "is_builtin" TINYINT NOT NULL DEFAULT '0' ,
    "status" TINYINT NOT NULL DEFAULT '1' ,
    "is_deleted" TINYINT NOT NULL DEFAULT '0' ,
    CLUSTER PRIMARY KEY ("id")
    );
CREATE INDEX IF NOT EXISTS work_order_template_idx_ticket_type ON work_order_template("ticket_type");
CREATE INDEX IF NOT EXISTS work_order_template_idx_status ON work_order_template("status");
CREATE INDEX IF NOT EXISTS work_order_template_idx_is_deleted ON work_order_template("is_deleted");


INSERT INTO "work_order_template" ("ticket_type", "template_name", "description", "created_by_uid", "updated_by_uid", "is_builtin", "status", "is_deleted") VALUES
                                                                                                                                                                ('data_aggregation', '数据归集工单模板', '', '', '', 1, 1, 0),
                                                                                                                                                                ('data_standardization', '标准化工单模', '', '', '', 1, 1, 0),
                                                                                                                                                                ('data_quality_audit', '质量检测工单模', '', '', '', 1, 1, 0),
                                                                                                                                                                ('data_fusion', '数据融合工单模板', '', '', '', 1, 1, 0);

CREATE TABLE IF NOT EXISTS "work_order_quality_overview" (
    "department_id" VARCHAR(36 char) NOT NULL  ,
    "table_count"  BIGINT NOT NULL ,
    "qualitied_table_count"  BIGINT NOT NULL  ,
    "processed_table_count"  BIGINT NOT NULL  ,
    "question_table_count"  BIGINT NOT NULL ,
    "start_process_table_count"  BIGINT NOT NULL ,
    "processing_table_count"  BIGINT NOT NULL ,
    "not_process_table_count"  BIGINT NOT NULL ,
    "quality_rate"  VARCHAR(10 char) NOT NULL ,
    "created_at" datetime(3) NOT NULL DEFAULT current_timestamp(3) ,
    CLUSTER PRIMARY KEY ("department_id")
    );
CREATE INDEX IF NOT EXISTS work_order_quality_overview_idx_department_id ON work_order_quality_overview("department_id");


-- 工单模板管理'
CREATE TABLE IF NOT EXISTS "t_work_order_manage_template" (
    "id" BIGINT NOT NULL COMMENT '主键ID，雪花算',
    "template_name" VARCHAR(128 char) NOT NULL COMMENT '工单模板名称',
    "template_type" VARCHAR(50 char) NOT NULL COMMENT '工单模板类型',
    "description" VARCHAR(500 char) DEFAULT NULL COMMENT '模板描述',
    "content" json DEFAULT NULL COMMENT '模板内容（JSON格式',
    "version" INT NOT NULL DEFAULT '1' COMMENT '当前版本',
    "is_active" TINYINT  NOT NULL DEFAULT 1 COMMENT '是否启用0-禁用1-启用',
    "reference_count" BIGINT NOT NULL DEFAULT 0 COMMENT '引用计数',
    "created_at" datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
    "created_by" VARCHAR(50 char) NOT NULL COMMENT '创建人UID',
    "updated_at" datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)  COMMENT '更新时间',
    "updated_by" VARCHAR(50 char) NOT NULL COMMENT '更新人UID',
    "is_deleted" TINYINT  NOT NULL DEFAULT 0 COMMENT '是否删除0-否，1-是',
    CLUSTER PRIMARY KEY ("id")
    );

-- 工单模板历史版本'
CREATE TABLE IF NOT EXISTS "t_work_order_manage_template_version" (
    "id" BIGINT NOT NULL ,
    "template_id" BIGINT NOT NULL,
    "version" INT NOT NULL,
    "template_name" VARCHAR(128 char) NOT NULL,
    "template_type" VARCHAR(50 char) NOT NULL,
    "description" VARCHAR(500 char) DEFAULT NULL,
    "content" json ,
    "created_at" datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    "created_by" VARCHAR(50 char) NOT NULL  ,
    CLUSTER  PRIMARY KEY ("id")
    );

-- 用户通知
CREATE TABLE  IF NOT EXISTS  "notifications" (
    "id"                        VARCHAR(36 char)    NOT NULL,
    "created_at"                DATETIME(3) NOT NULL,
    "updated_at"                DATETIME(3) NOT NULL,
    "deleted_at"                DATETIME(3) NULL,
    "recipient_id"              VARCHAR(36 char)    NOT NULL  ,
    "reason"                    VARCHAR(63 char) NOT NULL   ,
    "message"                   TEXT        NOT NULL  ,
    "work_order_id"             VARCHAR(36 char)    NOT NULL  ,
    "work_order_alarm_index"    TINYINT     NULL      ,
    "read"                      TINYINT  NOT NULL   ,
    CLUSTER PRIMARY KEY ("id")
    ) ;
CREATE INDEX IF NOT EXISTS notifications_idx_work_order ON notifications("work_order_id", "work_order_alarm_index");

CREATE TABLE IF NOT EXISTS "work_order_alarms" (
    "id"                    VARCHAR(36 char)    NOT NULL,
    "created_at"            DATETIME(3) NOT NULL,
    "updated_at"            DATETIME(3) NOT NULL,
    "deleted_at"            DATETIME(3) NULL,
    "work_order_id"         VARCHAR(36 char)    NOT NULL,
    "deadline"              DATETIME(3) NOT NULL,
    "last_notified_at"      DATETIME(3) NULL        DEFAULT NULL,
    CLUSTER PRIMARY KEY ("id")
    );

CREATE UNIQUE INDEX IF NOT EXISTS work_order_alarms_idx_work_order_id ON work_order_alarms("work_order_id");


