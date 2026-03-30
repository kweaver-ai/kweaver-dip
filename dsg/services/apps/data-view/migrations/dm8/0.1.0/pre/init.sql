SET SCHEMA af_main;

CREATE TABLE IF NOT EXISTS  "form_view" (
    "form_view_id" BIGINT NOT NULL IDENTITY(1, 1),
    "id" VARCHAR(36 char)   NOT NULL,
    "uniform_catalog_code" VARCHAR(255 char),
    "technical_name" VARCHAR(255 char) NOT NULL,
    "business_name" VARCHAR(255 char) DEFAULT NULL,
    "original_name" VARCHAR(255 char)  DEFAULT NULL,
    "type" int NOT NULL,
    "datasource_id" VARCHAR(36 char) NULL,
    "status" int NOT NULL,
    "publish_at" datetime(3),
    "edit_status" int NOT NULL,
    "owner_id" VARCHAR(512 char) NULL,
    "subject_id" VARCHAR(36 char) NULL,
    "department_id" VARCHAR(36 char) NULL,
    "info_system_id" VARCHAR(36 char) NOT NULL DEFAULT '',
    "scene_analysis_id" VARCHAR(36 char) NULL,
    "description" VARCHAR(300 char) NULL,
    "comment" text NULL,
    "created_at" datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP (3),
    "created_by_uid" VARCHAR(36 char) NOT NULL,
    "updated_at" datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP (3),
    "updated_by_uid" VARCHAR(36 char) NOT NULL,
    "deleted_at" BIGINT NOT NULL DEFAULT 0,
    "explore_job_id" VARCHAR(64 char) DEFAULT NULL,
    "explore_job_version" INT DEFAULT NULL,
    "explore_timestamp_id" VARCHAR(64 char) DEFAULT NULL,
    "explore_timestamp_version" INT DEFAULT NULL,
    "flow_id" VARCHAR(50 char) NOT NULL DEFAULT '',
    "flow_name" VARCHAR(200 char) NOT NULL DEFAULT '',
    "flow_node_id" VARCHAR(50 char) NOT NULL DEFAULT '',
    "flow_node_name" VARCHAR(200 char) NOT NULL DEFAULT '',
    "online_status" VARCHAR(20 char) NOT NULL DEFAULT 'notline',
    "audit_type" VARCHAR(50 char) NOT NULL DEFAULT 'unpublished',
    "audit_status" VARCHAR(20 char) NOT NULL DEFAULT 'unpublished',
    "apply_id" BIGINT NOT NULL,
    "proc_def_key" VARCHAR(128 char) NOT NULL DEFAULT '',
    "audit_advice" text   NULL ,
    "online_time" datetime(0) DEFAULT NULL,
    "filter_rule" text DEFAULT NULL,
    "excel_file_name" VARCHAR(128 char) DEFAULT NULL,
    "excel_sheet" VARCHAR(512 char) DEFAULT NULL,
    "start_cell" VARCHAR(50 char) DEFAULT NULL,
    "end_cell" VARCHAR(50 char) DEFAULT NULL,
    "has_headers" int DEFAULT NULL,
    "sheet_as_new_column" int DEFAULT NULL,
    "source_sign" INT DEFAULT NULL,
    "mdl_id" VARCHAR(36 char) NULL DEFAULT NULL,
    "update_cycle" INT DEFAULT 0,
    "shared_type" INT DEFAULT 0,
    "open_type" INT DEFAULT 0,
    "understand_status" int NOT NULL DEFAULT 0,
    CLUSTER PRIMARY KEY ("form_view_id")
);

CREATE UNIQUE INDEX IF NOT EXISTS form_view_uniform_catalog_code ON "form_view"("uniform_catalog_code");
CREATE INDEX IF NOT EXISTS form_view_id_btr ON "form_view"("id");




CREATE TABLE IF NOT EXISTS  "form_view_field" (
    "form_view_field_id" BIGINT NOT NULL  IDENTITY(1, 1),
    "id" VARCHAR(36 char)  NOT NULL,
    "form_view_id" VARCHAR(36 char)  NOT NULL,
    "technical_name" VARCHAR(255 char)  NOT NULL,
    "business_name" VARCHAR(255 char)  DEFAULT NULL,
    "original_name" VARCHAR(255 char)  DEFAULT NULL,
    "field_role" TINYINT DEFAULT NULL,
    "field_description" varchar(300) DEFAULT NULL,
    "comment" text  NULL,
    "status" int NOT NULL,
    "primary_key" TINYINT,
    "data_type" VARCHAR(255 char)  NOT NULL,
    "data_length" INT  NOT NULL,
    "data_accuracy" INT NOT NULL,
    "original_data_type" VARCHAR(255 char)  NOT NULL,
    "is_nullable" VARCHAR(30 char)  NOT NULL,
    "deleted_at" BIGINT NOT NULL DEFAULT 0,
    "standard_code" VARCHAR(30 char) NULL,
    "standard" VARCHAR(255 char) NULL,
    "code_table_id" VARCHAR(30 char) NULL,
    "business_timestamp" int DEFAULT NULL,
    "reset_before_data_type" VARCHAR(255 char),
    "reset_convert_rules" VARCHAR(255 char),
    "reset_data_length" INT,
    "reset_data_accuracy" INT,
    "index" INT NOT NULL,
    "subject_id" VARCHAR(36 char) NULL DEFAULT NULL,
    "classify_type" int NULL DEFAULT NULL,
    "match_score" VARCHAR(10 char) NULL DEFAULT NULL,
    "grade_id" BIGINT NULL DEFAULT NULL,
    "grade_type" int NULL DEFAULT NULL,
    "shared_type" INT DEFAULT 0,
    "open_type" INT DEFAULT 0,
    "sensitive_type" INT DEFAULT 0,
    "secret_type" INT DEFAULT 0,
    CLUSTER PRIMARY KEY ("form_view_field_id")
    );

CREATE INDEX IF NOT EXISTS form_view_field_form_view_id_btr ON "form_view_field"("form_view_id");
CREATE INDEX IF NOT EXISTS form_view_field_id_btr ON "form_view_field"("id");



CREATE TABLE IF NOT EXISTS  "datasource" (
    "data_source_id" BIGINT NOT NULL  IDENTITY(1, 1),
    "id" VARCHAR(36 char) NOT NULL,
    "info_system_id" VARCHAR(36 char) DEFAULT NULL,
    "name" VARCHAR(128 char) NOT NULL,
    "catalog_name" VARCHAR(255 char) NOT NULL DEFAULT '',
    "type_name" VARCHAR(128 char) NOT NULL,
    "host" VARCHAR(256 char) NOT NULL,
    "port" INT NOT NULL,
    "username" VARCHAR(128 char) NOT NULL,
    "password" VARCHAR(1024 char) NOT NULL,
    "database_name" VARCHAR(128 char) NOT NULL,
    "schema" VARCHAR(128 char) NOT NULL,
    "source_type" int NOT NULL DEFAULT 1,
    "created_at" datetime(3) NOT NULL DEFAULT current_timestamp(3),
    "created_by_uid" VARCHAR(36 char) DEFAULT NULL,
    "updated_at" datetime(3) NOT NULL DEFAULT current_timestamp(3),
    "updated_by_uid" VARCHAR(36 char) DEFAULT NULL,
    "data_view_source" VARCHAR(128 char) DEFAULT NULL,
    "status" int NOT NULL DEFAULT 1,
    "metadata_task_id" VARCHAR(128 char),
    "hua_ao_id" VARCHAR(128 char) DEFAULT NULL,
    "department_id" VARCHAR(36 char) DEFAULT NULL,
    CLUSTER PRIMARY KEY ("data_source_id")
);

CREATE UNIQUE INDEX IF NOT EXISTS datasource_uk_datasource ON "datasource"("info_system_id","name");
CREATE INDEX IF NOT EXISTS datasource_id_btr ON "datasource"("id");
CREATE INDEX IF NOT EXISTS datasource_idx_datasource_hua_ao_id ON "datasource"("hua_ao_id");




-- CREATE TABLE IF NOT EXISTS "scan_record" (
--     "id" BIGINT NOT NULL  IDENTITY(1, 1),
--     "datasource_id" VARCHAR(36 char) NOT NULL,
--     "scanner" VARCHAR(36 char) NOT NULL,
--     "scan_time" datetime(3) NOT NULL DEFAULT current_timestamp(3)  ,
--     CLUSTER PRIMARY KEY ("id")
--     );

-- CREATE UNIQUE INDEX IF NOT EXISTS scan_record_uk_scan_record ON scan_record("datasource_id","scanner");



CREATE TABLE IF NOT EXISTS  "form_view_sql" (
    "id" BIGINT NOT NULL  IDENTITY(1, 1),
    "form_view_id" VARCHAR(36 char)  NOT NULL,
    "sql" TEXT  NOT NULL,
    CLUSTER PRIMARY KEY ("id")
    );

CREATE UNIQUE INDEX IF NOT EXISTS form_view_sql_uk_form_view_id ON "form_view_sql"("form_view_id");



CREATE TABLE IF NOT EXISTS  "t_data_download_task" (
    "id" BIGINT NOT NULL  IDENTITY(1, 1),
    "form_view_id" VARCHAR(36 char) NOT NULL,
    "name" VARCHAR(255 char) DEFAULT NULL,
    "name_en" VARCHAR(255 char) NOT NULL,
    "detail" text  NOT NULL,
    "status" int NOT NULL,
    "remark" text  DEFAULT NULL,
    "file_uuid" VARCHAR(36 char) DEFAULT NULL,
    "created_at" datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP (3),
    "created_by" VARCHAR(36 char) NOT NULL,
    "updated_at" datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP (3),
    CLUSTER PRIMARY KEY ("id")
    );

CREATE INDEX IF NOT EXISTS t_data_download_task_idx_data_download_task_status_created_by ON "t_data_download_task"("status", "created_by");



CREATE TABLE IF NOT EXISTS "tmp_explore_sub_task" (
    "id" BIGINT NOT NULL  IDENTITY(1, 1),
    "parent_task_id" VARCHAR(36 char) NOT NULL,
    "form_view_id" VARCHAR(36 char) NOT NULL,
    "status" int NOT NULL,
    "remark" text DEFAULT NULL,
    "created_at" datetime(3) NOT NULL,
    "finished_at" datetime(3) DEFAULT NULL,
    CLUSTER PRIMARY KEY ("id")
    );

CREATE INDEX IF NOT EXISTS tmp_explore_sub_task_idx_tmp_explore_sub_task ON "tmp_explore_sub_task"("parent_task_id","status");



CREATE TABLE IF NOT EXISTS "data_classify_attribute_blacklist" (
    "id" BIGINT NOT NULL  IDENTITY(1, 1),
    "form_view_id" VARCHAR(36 char) NOT NULL,
    "field_id" VARCHAR(36 char) NOT NULL,
    "subject_id" VARCHAR(36 char) NOT NULL,
    "created_at" datetime(3) NOT NULL,
    CLUSTER PRIMARY KEY ("id")
    );

CREATE UNIQUE INDEX IF NOT EXISTS data_classify_attribute_blacklist_uni_data_classify_attribute_blacklist ON "data_classify_attribute_blacklist"("form_view_id","field_id","subject_id");




CREATE TABLE IF NOT EXISTS "sub_views" (
    "snowflake_id"  BIGINT        NOT NULL  IDENTITY(1, 1),
    "id"            VARCHAR(36 char)      NOT NULL,
    "name"          VARCHAR(255 char)  NOT NULL,
    "logic_view_id" VARCHAR(36 char)  NOT NULL,
    "auth_scope_id" VARCHAR(36 char) DEFAULT NULL,
    "detail"        BLOB      NOT NULL,
    "created_at" DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    "updated_at" DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ,
    "deleted_at" BIGINT       NOT NULL DEFAULT 0,
    CLUSTER PRIMARY KEY   ("snowflake_id")
);

CREATE UNIQUE INDEX IF NOT EXISTS sub_views_id ON "sub_views"("id");
CREATE INDEX IF NOT EXISTS sub_views_idx_sub_views_deleted_at ON "sub_views"("deleted_at");



CREATE TABLE IF NOT EXISTS "explore_task" (
    "id" BIGINT NOT NULL  IDENTITY(1, 1),
    "task_id" VARCHAR(36 char) NOT NULL,
    "type" int NOT NULL,
    "datasource_id" VARCHAR(36 char) DEFAULT '',
    "subject_ids" VARCHAR(2000 char) NULL DEFAULT NULL,
    "form_view_id" VARCHAR(36 char) DEFAULT '',
    "form_view_type" int DEFAULT NULL,
    "status" int NOT NULL,
    "config" text DEFAULT NULL,
    "remark" text DEFAULT NULL,
    "created_at" datetime(3) NOT NULL,
    "created_by_uid" VARCHAR(36 char) NOT NULL,
    "finished_at" datetime(3) DEFAULT NULL,
    "deleted_at" BIGINT DEFAULT NULL,
    "work_order_id" VARCHAR(36 char) DEFAULT NULL,
    CLUSTER PRIMARY KEY ("id")
    );

CREATE INDEX IF NOT EXISTS explore_task_idx_task_id ON "explore_task"("task_id");



CREATE TABLE IF NOT EXISTS "tmp_completion" (
    "form_view_id" VARCHAR(36 char) NOT NULL,
    "completion_id" VARCHAR(36 char) NOT NULL,
    "result" TEXT DEFAULT NULL,
    "status" int NOT NULL,
    "reason" VARCHAR(300 char) DEFAULT NULL,
    "created_at" datetime(3) NOT NULL,
    CLUSTER PRIMARY KEY ("form_view_id")
    );



CREATE TABLE IF NOT EXISTS "explore_rule_config" (
    "id" BIGINT NOT NULL  IDENTITY(1, 1),
    "rule_id" VARCHAR(36 char) DEFAULT NULL,
    "rule_name" VARCHAR(128 char) NOT NULL,
    "rule_description" VARCHAR(300 char) DEFAULT NULL,
    "rule_level" int NOT NULL,
    "form_view_id" VARCHAR(36 char) DEFAULT NULL,
    "field_id" VARCHAR(36 char) DEFAULT NULL,
    "dimension" int NOT NULL,
    "dimension_type" int DEFAULT NULL,
    "rule_config" text DEFAULT NULL,
    "enable" int NOT NULL,
    "template_id" VARCHAR(36 char) DEFAULT NULL,
    "draft" int DEFAULT NULL,
    "created_at" datetime(3) NOT NULL,
    "created_by_uid" VARCHAR(36 char) DEFAULT NULL,
    "updated_at" datetime(3) NOT NULL,
    "updated_by_uid" VARCHAR(36 char) DEFAULT NULL,
    "deleted_at" BIGINT NOT NULL,
    CLUSTER PRIMARY KEY ("id")
    );

CREATE INDEX IF NOT EXISTS explore_rule_config_idx_rule_id ON "explore_rule_config"("rule_id");




SET IDENTITY_INSERT "explore_rule_config" ON;
INSERT INTO "explore_rule_config"("id","rule_id","rule_name","rule_description","rule_level","form_view_id","field_id","dimension","dimension_type","rule_config","enable","template_id","draft","created_at","created_by_uid","updated_at","updated_by_uid","deleted_at")
 SELECT '529106505304113153', NULL, '表注释检查', '检查是否包含表注释', '1', NULL, NULL, '1', NULL, NULL, '0', '4662a178-140f-4869-88eb-57f789baf1d3', NULL, '2024-08-29 11:32:46.000', NULL, '2024-08-29 11:32:46.000', NULL, '0'
FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "explore_rule_config" WHERE "id" = '529106505304113153');


INSERT INTO "explore_rule_config"("id","rule_id","rule_name","rule_description","rule_level","form_view_id","field_id","dimension","dimension_type","rule_config","enable","template_id","draft","created_at","created_by_uid","updated_at","updated_by_uid","deleted_at")

SELECT '529108382372593665', NULL, '字段注释检查', '检查字段注释是否完整', '1', NULL, NULL, '1', NULL, NULL, '0', '931bf4e4-914e-4bff-af0c-ca57b63d1619', NULL, '2024-08-29 11:32:46.000', NULL, '2024-08-29 11:32:46.000', NULL, '0'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "explore_rule_config" WHERE "id" = '529108382372593665');


INSERT INTO "explore_rule_config"("id","rule_id","rule_name","rule_description","rule_level","form_view_id","field_id","dimension","dimension_type","rule_config","enable","template_id","draft","created_at","created_by_uid","updated_at","updated_by_uid","deleted_at")

SELECT '529108545782677505', NULL, '数据类型检查', '检查字段的数据类型、长度、精度和字段关联的数据标准是否相同', '1', NULL, NULL, '2', NULL, NULL, '0', 'c2c65844-5573-4306-92d7-d3f9ac2edbf6', NULL, '2024-08-29 11:32:46.000', NULL, '2024-08-29 11:32:46.000', NULL, '0'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "explore_rule_config" WHERE "id" = '529108545782677505');


INSERT INTO "explore_rule_config"("id","rule_id","rule_name","rule_description","rule_level","form_view_id","field_id","dimension","dimension_type","rule_config","enable","template_id","draft","created_at","created_by_uid","updated_at","updated_by_uid","deleted_at")

SELECT '529108986570473473', NULL, '空值项检查', '检查字段对应的值是否包含NULL或用户定义的空值项', '2', NULL, NULL, '1', NULL, NULL, '0', 'cf0b5b51-79f1-4cb3-8f0c-be0c3ad25e55', NULL, '2024-08-29 11:32:46.000', NULL, '2024-08-29 11:32:46.000', NULL, '0'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "explore_rule_config" WHERE "id" = '529108986570473473');


INSERT INTO "explore_rule_config"("id","rule_id","rule_name","rule_description","rule_level","form_view_id","field_id","dimension","dimension_type","rule_config","enable","template_id","draft","created_at","created_by_uid","updated_at","updated_by_uid","deleted_at")

SELECT '529109059517808641', NULL, '码值检查', '检查字段对应的值是否包含所有的码值', '2', NULL, NULL, '1', NULL, NULL, '0', 'fcbad175-862e-4d24-882c-c6dd96d9f4f2', NULL, '2024-08-29 11:32:46.000', NULL, '2024-08-29 11:32:46.000', NULL, '0'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "explore_rule_config" WHERE "id" = '529109059517808641');


INSERT INTO "explore_rule_config"("id","rule_id","rule_name","rule_description","rule_level","form_view_id","field_id","dimension","dimension_type","rule_config","enable","template_id","draft","created_at","created_by_uid","updated_at","updated_by_uid","deleted_at")

SELECT '529118144111837185', NULL, '重复值检查', '检查字段对应的值是否存在重复记录 ', '2', NULL, NULL, '3', NULL, NULL, '0', '6d8d7fdc-8cc4-4e89-a5dd-9b8d07a685dc', NULL, '2024-08-29 11:32:46.000', NULL, '2024-08-29 11:32:46.000', NULL, '0'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "explore_rule_config" WHERE "id" = '529118144111837185');


INSERT INTO "explore_rule_config"("id","rule_id","rule_name","rule_description","rule_level","form_view_id","field_id","dimension","dimension_type","rule_config","enable","template_id","draft","created_at","created_by_uid","updated_at","updated_by_uid","deleted_at")

SELECT '529118352753295361', NULL, '格式检查', '检查字段对应的值和定义的格式是否匹配', '2', NULL, NULL, '2', NULL, NULL, '0', '0e75ad19-a39b-4e41-b8f1-e3cee8880182', NULL, '2024-08-29 11:32:46.000', NULL, '2024-08-29 11:32:46.000', NULL, '0'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "explore_rule_config" WHERE "id" = '529118352753295361');


INSERT INTO "explore_rule_config"("id","rule_id","rule_name","rule_description","rule_level","form_view_id","field_id","dimension","dimension_type","rule_config","enable","template_id","draft","created_at","created_by_uid","updated_at","updated_by_uid","deleted_at")

SELECT '529118621473964033', NULL, '行数据空值项检查', '检查每一行数据否存在空值项', '3', NULL, NULL, '1', NULL, NULL, '0', '442f627c-b9bd-43f6-a3b1-b048525276a2', NULL, '2024-08-29 11:32:46.000', NULL, '2024-08-29 11:32:46.000', NULL, '0'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "explore_rule_config" WHERE "id" = '529118621473964033');


INSERT INTO "explore_rule_config"("id","rule_id","rule_name","rule_description","rule_level","form_view_id","field_id","dimension","dimension_type","rule_config","enable","template_id","draft","created_at","created_by_uid","updated_at","updated_by_uid","deleted_at")

SELECT '529118668617940993', NULL, '行数据重复值检查', '检查每一行数据是否存在重复记录', '3', NULL, NULL, '3', NULL, NULL, '0', '401f8069-21e5-4dd0-bfa8-432f2635f46c', NULL, '2024-08-29 11:32:46.000', NULL, '2024-08-29 11:32:46.000', NULL, '0'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "explore_rule_config" WHERE "id" = '529118668617940993');


INSERT INTO "explore_rule_config"("id","rule_id","rule_name","rule_description","rule_level","form_view_id","field_id","dimension","dimension_type","rule_config","enable","template_id","draft","created_at","created_by_uid","updated_at","updated_by_uid","deleted_at")

SELECT '529119079022198785', NULL, '数据及时性检查', '通过业务数据更新时间和更新周期比较', '4', NULL, NULL, '6', NULL, '{"update_period": "month"}', '0', 'f7447b7a-13a6-4190-9d0d-623af08bedea', NULL, '2024-08-29 11:32:46.000', NULL, '2024-08-29 11:32:46.000', NULL, '0'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "explore_rule_config" WHERE "id" = '529119079022198785');


INSERT INTO "explore_rule_config"("id","rule_id","rule_name","rule_description","rule_level","form_view_id","field_id","dimension","dimension_type","rule_config","enable","template_id","draft","created_at","created_by_uid","updated_at","updated_by_uid","deleted_at")

SELECT '529247613954818049', NULL, '最大值', '计算数据表中指定字段数值最大值', '2', NULL, NULL, '7', NULL, NULL, '0', '0c790158-9721-41ce-b8b3-b90341575485', NULL, '2024-08-29 11:32:46.000', NULL, '2024-08-29 11:32:46.000', NULL, '0'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "explore_rule_config" WHERE "id" = '529247613954818049');


INSERT INTO "explore_rule_config"("id","rule_id","rule_name","rule_description","rule_level","form_view_id","field_id","dimension","dimension_type","rule_config","enable","template_id","draft","created_at","created_by_uid","updated_at","updated_by_uid","deleted_at")

SELECT '529247613971595265', NULL, '最小值', '计算数据表中指定字段数值最小值', '2', NULL, NULL, '7', NULL, NULL, '0', '73271129-2ae3-47aa-83c5-6c0bf002140c', NULL, '2024-08-29 11:32:46.000', NULL, '2024-08-29 11:32:46.000', NULL, '0'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "explore_rule_config" WHERE "id" = '529247613971595265');


INSERT INTO "explore_rule_config"("id","rule_id","rule_name","rule_description","rule_level","form_view_id","field_id","dimension","dimension_type","rule_config","enable","template_id","draft","created_at","created_by_uid","updated_at","updated_by_uid","deleted_at")

SELECT '529247613971660801', NULL, '分位数', '计算数据表中指定字段分位数数值情况', '2', NULL, NULL, '7', NULL, NULL, '0', '91920b32-b884-4d23-a649-0518b038bf3b', NULL, '2024-08-29 11:32:46.000', NULL, '2024-08-29 11:32:46.000', NULL, '0'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "explore_rule_config" WHERE "id" = '529247613971660801');


INSERT INTO "explore_rule_config"("id","rule_id","rule_name","rule_description","rule_level","form_view_id","field_id","dimension","dimension_type","rule_config","enable","template_id","draft","created_at","created_by_uid","updated_at","updated_by_uid","deleted_at")

SELECT '529247613971726337', NULL, '平均值统计', '计算数据表中指定字段（限整数型、高精度型、小数型）数值平均值', '2', NULL, NULL, '7', NULL, NULL, '0', 'fd9fa13a-40db-4283-9c04-bf0ff3edcb32', NULL, '2024-08-29 11:32:46.000', NULL, '2024-08-29 11:32:46.000', NULL, '0'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "explore_rule_config" WHERE "id" = '529247613971726337');


INSERT INTO "explore_rule_config"("id","rule_id","rule_name","rule_description","rule_level","form_view_id","field_id","dimension","dimension_type","rule_config","enable","template_id","draft","created_at","created_by_uid","updated_at","updated_by_uid","deleted_at")

SELECT '529247613971791873', NULL, '标准差统计', '计算数据表中指定字段（限整数型、高精度型、小数型）数值标准差', '2', NULL, NULL, '7', NULL, NULL, '0', '06ad1362-9545-415d-9278-265e3abe7c10', NULL, '2024-08-29 11:32:46.000', NULL, '2024-08-29 11:32:46.000', NULL, '0'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "explore_rule_config" WHERE "id" = '529247613971791873');


INSERT INTO "explore_rule_config"("id","rule_id","rule_name","rule_description","rule_level","form_view_id","field_id","dimension","dimension_type","rule_config","enable","template_id","draft","created_at","created_by_uid","updated_at","updated_by_uid","deleted_at")

SELECT '529247613971857409', NULL, '枚举值分布', '计算数据表中指定字段（限整数型、高精度型、小数型、字符型）值分布情况', '2', NULL, NULL, '7', NULL, NULL, '0', '96ac5dc0-2e5c-4397-87a7-8414dddf8179', NULL, '2024-08-29 11:32:46.000', NULL, '2024-08-29 11:32:46.000', NULL, '0'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "explore_rule_config" WHERE "id" = '529247613971857409');


INSERT INTO "explore_rule_config"("id","rule_id","rule_name","rule_description","rule_level","form_view_id","field_id","dimension","dimension_type","rule_config","enable","template_id","draft","created_at","created_by_uid","updated_at","updated_by_uid","deleted_at")

SELECT '529247613971922945', NULL, '天分布', '计算数据表中指定字段（限日期型、日期时间型）数值按天分布情况', '2', NULL, NULL, '7', NULL, NULL, '0', '95e5b917-6313-4bd0-8812-bf0d4aa68d73', NULL, '2024-08-29 11:32:46.000', NULL, '2024-08-29 11:32:46.000', NULL, '0'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "explore_rule_config" WHERE "id" = '529247613971922945');


INSERT INTO "explore_rule_config"("id","rule_id","rule_name","rule_description","rule_level","form_view_id","field_id","dimension","dimension_type","rule_config","enable","template_id","draft","created_at","created_by_uid","updated_at","updated_by_uid","deleted_at")

SELECT '529247613971988481', NULL, '月分布', '计算数据表中指定字段（限日期型、日期时间型）数值按月分布情况', '2', NULL, NULL, '7', NULL, NULL, '0', '69c3d959-1c72-422b-959d-7135f52e4f9c', NULL, '2024-08-29 11:32:46.000', NULL, '2024-08-29 11:32:46.000', NULL, '0'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "explore_rule_config" WHERE "id" = '529247613971988481');


INSERT INTO "explore_rule_config"("id","rule_id","rule_name","rule_description","rule_level","form_view_id","field_id","dimension","dimension_type","rule_config","enable","template_id","draft","created_at","created_by_uid","updated_at","updated_by_uid","deleted_at")

SELECT '529247613972054017', NULL, '年分布', '计算数据表中指定字段（限日期型、日期时间型）数值按年分布情况', '2', NULL, NULL, '7', NULL, NULL, '0', '709fca1a-4640-4cd7-94ed-50b1b16e0aa5', NULL, '2024-08-29 11:32:46.000', NULL, '2024-08-29 11:32:46.000', NULL, '0'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "explore_rule_config" WHERE "id" = '529247613972054017');


INSERT INTO "explore_rule_config"("id","rule_id","rule_name","rule_description","rule_level","form_view_id","field_id","dimension","dimension_type","rule_config","enable","template_id","draft","created_at","created_by_uid","updated_at","updated_by_uid","deleted_at")

SELECT '529247613972119553', NULL, 'TRUE值数', '计算数据表中指定字段（限布尔型）TRUE值行数', '2', NULL, NULL, '7', NULL, NULL, '0', 'ae0f6573-b3e0-4be2-8330-a643261f8a18', NULL, '2024-08-29 11:32:46.000', NULL, '2024-08-29 11:32:46.000', NULL, '0'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "explore_rule_config" WHERE "id" = '529247613972119553');


INSERT INTO "explore_rule_config"("id","rule_id","rule_name","rule_description","rule_level","form_view_id","field_id","dimension","dimension_type","rule_config","enable","template_id","draft","created_at","created_by_uid","updated_at","updated_by_uid","deleted_at")

SELECT '529247613972185089', NULL, 'FALSE值数', '计算数据表中指定字段（限布尔型）FALSE值行数', '2', NULL, NULL, '7', NULL, NULL, '0', '45a4b3cb-b93c-469d-b3b4-631a3b8db5fe', NULL, '2024-08-29 11:32:46.000', NULL, '2024-08-29 11:32:46.000', NULL, '0'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "explore_rule_config" WHERE "id" = '529247613972185089');



CREATE TABLE IF NOT EXISTS "data_preview_config" (
    "id" BIGINT NOT NULL IDENTITY(1,1),
    "form_view_id" VARCHAR(36 char) NOT NULL,
    "creator_uid" VARCHAR(36 char) NOT NULL,
    "config" text DEFAULT NULL,
    CLUSTER PRIMARY KEY ("id")
    );

CREATE INDEX IF NOT EXISTS data_preview_config_idx_form_view_id ON "data_preview_config"("form_view_id");




CREATE TABLE IF NOT EXISTS "white_list_policy" (
    "white_policy_id" BIGINT NOT NULL  IDENTITY(1,1),
    "id" VARCHAR(255 char) DEFAULT '',
    "form_view_id" VARCHAR(255 char) DEFAULT '',
    "description" VARCHAR(500 char) DEFAULT '',
    "config" text DEFAULT NULL,
    "created_at" datetime(0) DEFAULT NULL,
    "created_by_uid" VARCHAR(255 char) DEFAULT '',
    "updated_at" datetime(0) DEFAULT NULL,
    "updated_by_uid" VARCHAR(255 char) DEFAULT '',
    "deleted_at" INT DEFAULT 0,
    CLUSTER PRIMARY KEY ("white_policy_id")
    );

CREATE INDEX IF NOT EXISTS white_list_policy_id ON "white_list_policy"("id");
CREATE INDEX IF NOT EXISTS white_list_policy_form_view_id ON "white_list_policy"("form_view_id");



CREATE TABLE IF NOT EXISTS "desensitization_rule" (
    "desensitization_rule_id" BIGINT NOT NULL  IDENTITY(1,1),
    "id" VARCHAR(255 char) NOT NULL DEFAULT '',
    "name" VARCHAR(255 char) DEFAULT NULL,
    "description" VARCHAR(300 char) DEFAULT '',
    "type" VARCHAR(255 char) DEFAULT '',
    "inner_type" VARCHAR(255 char) DEFAULT '',
    "algorithm" VARCHAR(255 char) DEFAULT '',
    "method" VARCHAR(255 char) DEFAULT '',
    "middle_bit" INT DEFAULT 0,
    "head_bit" INT DEFAULT NULL,
    "tail_bit" INT DEFAULT NULL,
    "created_at" datetime(0) DEFAULT NULL,
    "created_by_uid" VARCHAR(255 char) DEFAULT '',
    "updated_at" datetime(0) DEFAULT NULL,
    "updated_by_uid" VARCHAR(255 char) DEFAULT '',
    "deleted_at" INT DEFAULT 0,
    CLUSTER PRIMARY KEY ("desensitization_rule_id")
    );

CREATE INDEX IF NOT EXISTS desensitization_rule_id ON "desensitization_rule"("id");



CREATE TABLE IF NOT EXISTS "data_privacy_policy" (
    "data_privacy_policy_id" BIGINT NOT NULL  IDENTITY(1,1),
    "id" VARCHAR(255 char) NOT NULL,
    "form_view_id" VARCHAR(255 char) NOT NULL,
    "policy_description" VARCHAR(1000 char) NULL DEFAULT NULL,
    "created_at" datetime(0) NOT NULL DEFAULT current_timestamp(),
    "created_by_uid" VARCHAR(255 char) NULL DEFAULT NULL,
    "updated_at" datetime(0) NOT NULL DEFAULT current_timestamp(),
    "updated_by_uid" VARCHAR(255 char) NULL DEFAULT NULL,
    "deleted_at" BIGINT NOT NULL DEFAULT 0,
    CLUSTER PRIMARY KEY ("data_privacy_policy_id")
);
create INDEX  if not exists idex_data_privacy_policy_id on "data_privacy_policy"("id");


CREATE TABLE IF NOT EXISTS "data_privacy_policy_field" (
    "data_privacy_policy_field_id" BIGINT NOT NULL IDENTITY(1,1),
    "id" VARCHAR(255 char) NOT NULL,
    "data_privacy_policy_id" VARCHAR(255 char) NOT NULL,
    "form_view_field_id" VARCHAR(255 char) NOT NULL,
    "desensitization_rule_id" VARCHAR(255 char) NOT NULL,
    "deleted_at" BIGINT NOT NULL DEFAULT '0',
    CLUSTER PRIMARY KEY ("data_privacy_policy_field_id")
    );

create INDEX  if not exists idex_id on "data_privacy_policy_field"("id");
create INDEX  if not exists data_privacy_policy_id on "data_privacy_policy_field"("data_privacy_policy_id");
create INDEX  if not exists desensitization_rule_id on "data_privacy_policy_field"("desensitization_rule_id");


CREATE TABLE IF NOT EXISTS "t_form_view_extend" (
    "id" VARCHAR(36 char) NOT NULL,
    "is_audited" int NOT NULL,
    CLUSTER PRIMARY KEY ("id")
);



CREATE TABLE IF NOT EXISTS "recognition_algorithm" (
    "recognition_algorithm_id" BIGINT NOT NULL IDENTITY(1,1),
    "id" VARCHAR(255 char) NOT NULL DEFAULT '',
    "name" VARCHAR(255 char) NULL DEFAULT NULL,
    "description" VARCHAR(1024 char) NULL DEFAULT NULL,
    "type" VARCHAR(255 char) NULL DEFAULT NULL,
    "inner_type" VARCHAR(255 char) NULL DEFAULT NULL,
    "algorithm" VARCHAR(1024 char) NULL DEFAULT NULL,
    "status" INT NOT NULL DEFAULT '0',
    "created_at" datetime(0) NULL DEFAULT current_timestamp(),
    "created_by_uid" VARCHAR(255 char) NULL DEFAULT NULL,
    "updated_at" datetime(0) NULL DEFAULT current_timestamp(),
    "updated_by_uid" VARCHAR(255 char) NULL DEFAULT NULL,
    "deleted_at" BIGINT NOT NULL DEFAULT '0',
    CLUSTER PRIMARY KEY ("recognition_algorithm_id")
    );
create INDEX  if not exists idex_id on "recognition_algorithm"("id");


CREATE TABLE IF NOT EXISTS "classification_rule" (
    "classification_rule_id" BIGINT NOT NULL IDENTITY(1,1),
    "id" VARCHAR(255 char) NOT NULL DEFAULT '',
    "name" VARCHAR(255 char) NULL DEFAULT NULL,
    "description" VARCHAR(1024 char) NULL DEFAULT NULL,
    "type" VARCHAR(255 char) NULL DEFAULT NULL,
    "subject_id" VARCHAR(255 char) NOT NULL DEFAULT '',
    "status" INT NOT NULL DEFAULT '0',
    "created_at" datetime(0) NULL DEFAULT current_timestamp(),
    "created_by_uid" VARCHAR(255 char) NULL DEFAULT NULL,
    "updated_at" datetime(0) NULL DEFAULT current_timestamp(),
    "updated_by_uid" VARCHAR(255 char) NULL DEFAULT NULL,
    "deleted_at" BIGINT NOT NULL DEFAULT '0',
    CLUSTER PRIMARY KEY ("classification_rule_id")
    );
create INDEX  if not exists idex_id on "classification_rule"("id");

CREATE TABLE IF NOT EXISTS "classification_rule_algorithm_relation" (
    "classification_rule_algorithm_relation_id" BIGINT NOT NULL,
    "id" VARCHAR(255 char) NOT NULL DEFAULT '',
    "classification_rule_id" VARCHAR(255 char) NOT NULL DEFAULT '',
    "recognition_algorithm_id" VARCHAR(255 char) NOT NULL DEFAULT '',
    "status" INT NOT NULL DEFAULT '0',
    "deleted_at" BIGINT NOT NULL DEFAULT '0',
    CLUSTER PRIMARY KEY ("classification_rule_algorithm_relation_id")
    );
create INDEX  if not exists idex_id on "classification_rule_algorithm_relation"("id");
create INDEX  if not exists idex_classification_rule_id on "classification_rule_algorithm_relation"("classification_rule_id");
create INDEX  if not exists idex_recognition_algorithm_id on "classification_rule_algorithm_relation"("recognition_algorithm_id");

CREATE TABLE IF NOT EXISTS "grade_rule" (
    "grade_rule_id" BIGINT NOT NULL IDENTITY(1,1),
    "id" VARCHAR(255 char) NOT NULL DEFAULT '',
    "name" VARCHAR(255 char) NULL DEFAULT NULL,
    "description" VARCHAR(1024 char) NULL DEFAULT NULL,
    "subject_id" VARCHAR(255 char) NOT NULL DEFAULT '',
    "label_id" BIGINT NOT NULL DEFAULT '0',
    "logical_expression" TEXT   NULL  ,
    "type" VARCHAR(255 char) NULL DEFAULT NULL,
    "group_id" VARCHAR(36 char) DEFAULT '',
    "status" INT NOT NULL DEFAULT '0',
    "created_at" datetime(0) NULL DEFAULT current_timestamp(),
    "created_by_uid" VARCHAR(255 char) NULL DEFAULT NULL,
    "updated_at" datetime(0) NULL DEFAULT current_timestamp(),
    "updated_by_uid" VARCHAR(255 char) NULL DEFAULT NULL,
    "deleted_at" BIGINT NOT NULL DEFAULT '0',
    CLUSTER PRIMARY KEY ("grade_rule_id")
    );
create INDEX  if not exists idex_id on "grade_rule"("id");

set IDENTITY_INSERT "grade_rule" ON;

INSERT INTO "grade_rule" ("grade_rule_id", "id", "name", "description", "subject_id", "label_id", "logical_expression", "type", "status",  "created_by_uid",  "updated_by_uid", "deleted_at")

SELECT 1, '1', '默认规则', NULL, '', 0, '', 'inner', 1, NULL, NULL, 0

FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM "grade_rule" WHERE "id" = '1');




set IDENTITY_INSERT "classification_rule" ON;
INSERT INTO "classification_rule" ("classification_rule_id", "id", "name", "description", "type", "subject_id", "status",  "created_by_uid",  "updated_by_uid", "deleted_at")

SELECT 1, '1', '默认规则', NULL, 'inner', 'ef12001d-d650-4620-a0e1-7a11a930d40b', 1, null, null, 0

FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM "classification_rule" WHERE "id" = '1');


set IDENTITY_INSERT "recognition_algorithm" ON;
INSERT INTO "recognition_algorithm" ("recognition_algorithm_id", "id", "name", "description", "type", "inner_type", "algorithm", "status",  "created_by_uid", "updated_by_uid", "deleted_at")

SELECT 1, '92efd8f2-2709-432e-b88d-317a4fbd5a01', '内置模版', '内置模版不可删除', 'inner', '默认', '-', 1, null, null, 0

FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM "recognition_algorithm" WHERE "id" = '92efd8f2-2709-432e-b88d-317a4fbd5a01');


INSERT INTO recognition_algorithm (recognition_algorithm_id, id, name, description, type, inner_type, algorithm, status,  created_by_uid, updated_by_uid, deleted_at)

SELECT 2, 'a1b2c3d4-e5f6-4321-b987-654321fedcba', '身份证', '支持18位和15位身份证号码验证', 'inner', '身份证', '^[1-9]\\d{5}(?:18|19|20)\\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[1-2]\\d|3[0-1])\\d{3}[\\dXx]$|^[1-9]\\d{5}\\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[1-2]\\d|3[0-1])\\d{3}$', 1, null, null, 0

FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM "recognition_algorithm" WHERE "id" = 'a1b2c3d4-e5f6-4321-b987-654321fedcba');


INSERT INTO recognition_algorithm (recognition_algorithm_id, id, name, description, type, inner_type, algorithm, status,  created_by_uid, updated_by_uid, deleted_at)

SELECT 3, 'b2c3d4e5-f6a7-5432-c098-765432fedcba', '手机号', '支持13、14、15、16、17、18、19开头的手机号码验证', 'inner', '手机号', '^1[3-9]\\d{9}$', 1, null, null, 0

FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM "recognition_algorithm" WHERE "id" = 'b2c3d4e5-f6a7-5432-c098-765432fedcba');


INSERT INTO recognition_algorithm (recognition_algorithm_id, id, name, description, type, inner_type, algorithm, status,  created_by_uid, updated_by_uid, deleted_at)

SELECT 4, 'c3d4e5f6-a7b8-6543-d109-876543fedcba', '邮箱', '标准邮箱地址格式验证', 'inner', '邮箱', '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$', 1, null, null, 0

FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM "recognition_algorithm" WHERE "id" = 'c3d4e5f6-a7b8-6543-d109-876543fedcba');


INSERT INTO recognition_algorithm (recognition_algorithm_id, id, name, description, type, inner_type, algorithm, status,  created_by_uid, updated_by_uid, deleted_at)

SELECT 5, 'd4e5f6a7-b8c9-7654-e210-987654fedcba', '银行卡号', '支持13-19位数字的银行卡号验证', 'inner', '银行卡号', '^[1-9]\\d{12,18}$', 1, null, null, 0

FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM "recognition_algorithm" WHERE "id" = 'd4e5f6a7-b8c9-7654-e210-987654fedcba');



CREATE TABLE if not EXISTS "t_graph_model"(
    "model_id"   BIGINT  NOT NULL  IDENTITY(1, 1),
    "id"  VARCHAR(36 char) NOT NULL,
    "business_name" VARCHAR(255 char) DEFAULT NULL,
    "model_type" int NOT NULL  default 1,
    "description" VARCHAR(255 char) DEFAULT NULL,
    "subject_id"  VARCHAR(36 char)  NOT NULL,
    "technical_name" VARCHAR(255 char) NOT NULL,
    "catalog_id"  BIGINT  NOT NULL,
    "graph_id"  BIGINT  NOT NULL,
    "data_view_id"  VARCHAR(36 char) NOT NULL,
    "created_at" datetime(3) NOT NULL DEFAULT current_timestamp(3),
    "creator_uid" VARCHAR(36 char) DEFAULT NULL,
    "updated_at" datetime(0) NOT NULL DEFAULT current_timestamp(),
    "updater_uid" VARCHAR(36 char) DEFAULT NULL,
    "updater_name" VARCHAR(255 char) DEFAULT NULL,
    "deleted_at"  BIGINT   DEFAULT NULL,
    "grade_label_id" varchar(36 char) DEFAULT NULL,
    CLUSTER PRIMARY KEY ("model_id")
);

CREATE INDEX IF NOT EXISTS t_graph_model_idx_id ON "t_graph_model"("id");



CREATE TABLE if not EXISTS "t_model_single_node"(
    "id"   BIGINT  NOT NULL  IDENTITY(1, 1),
    "model_id" VARCHAR(36 char) NOT NULL,
    "meta_model_id" VARCHAR(36 char) NOT NULL,
    "display_field_id" VARCHAR(36 char) NOT NULL,
    CLUSTER PRIMARY KEY ("id")
    );

CREATE INDEX IF NOT EXISTS t_model_single_node_idx_model_id ON "t_model_single_node"("model_id");



CREATE TABLE if not EXISTS "t_model_relation"(
     "relation_id"   BIGINT  NOT NULL  IDENTITY(1, 1),
     "id"  VARCHAR(36 char) NOT NULL,
    "business_name" VARCHAR(255 char) DEFAULT NULL,
    "technical_name" VARCHAR(255 char) NOT NULL,
    "model_id" VARCHAR(36 char) NOT NULL,
    "description" VARCHAR(255 char) DEFAULT NULL,
    "start_display_field_id" VARCHAR(36 char) NOT NULL,
    "end_display_field_id" VARCHAR(36 char) NOT NULL,
    "created_at" datetime(3) NOT NULL DEFAULT current_timestamp(3),
    "updated_at" datetime(0) NOT NULL DEFAULT current_timestamp(),
    "updater_uid" VARCHAR(36 char) DEFAULT NULL,
    "updater_name" VARCHAR(255 char) DEFAULT NULL,
    CLUSTER PRIMARY KEY ("relation_id")
    );

CREATE INDEX IF NOT EXISTS t_model_relation_idx_id ON "t_model_relation"("id");



CREATE TABLE if not EXISTS "t_model_relation_link"(
    "id"   BIGINT  NOT NULL  IDENTITY(1, 1),
    "model_id" VARCHAR(36 char) NOT NULL,
    "unique_id"  VARCHAR(36 char) NOT NULL,
    "relation_id"  VARCHAR(36 char) NOT NULL,
    "start_model_id"  VARCHAR(36 char) NOT NULL,
    "start_field_id"  VARCHAR(36 char) NOT NULL,
    "end_model_id"   VARCHAR(36 char) NOT NULL,
    "end_field_id"  VARCHAR(36 char) NOT NULL,
    CLUSTER PRIMARY KEY ("id")
    );

CREATE INDEX IF NOT EXISTS t_model_relation_link_idx_relation_id ON "t_model_relation_link"("relation_id");




CREATE TABLE if not EXISTS "t_model_field"(
    "id"    BIGINT  NOT NULL  IDENTITY(1, 1),
    "field_id"  VARCHAR(36 char) NOT NULL,
    "model_id"  VARCHAR(36 char) NOT NULL,
    "technical_name" VARCHAR(255 char) NOT NULL,
    "business_name" VARCHAR(255 char) DEFAULT NULL,
    "data_type" VARCHAR(255 char) NOT NULL,
    "data_length" INT NOT NULL,
    "data_accuracy" INT NOT NULL,
    "primary_key" int default 0,
    "is_nullable" VARCHAR(30 char) NOT NULL,
    "comment" VARCHAR(128 char) DEFAULT '',
    CLUSTER PRIMARY KEY ("id")
    );

CREATE INDEX IF NOT EXISTS t_model_field_idx_model_id ON "t_model_field"("model_id");




CREATE TABLE if not EXISTS  "t_model_canvas" (
    "id" VARCHAR(36 char) NOT NULL,
    "canvas" text DEFAULT NULL,
    CLUSTER PRIMARY KEY ("id")
    );



CREATE TABLE IF NOT EXISTS "data_set" (
    "data_set_id" BIGINT NOT NULL  IDENTITY(1, 1),
    "id" VARCHAR(255 char) NOT NULL,
    "data_set_name" VARCHAR(1000 char) NULL DEFAULT NULL,
    "data_set_description" VARCHAR(1000 char) NULL DEFAULT NULL,
    "created_at" datetime(0) NOT NULL DEFAULT current_timestamp(),
    "created_by_uid" VARCHAR(255 char) NULL DEFAULT NULL,
    "updated_at" datetime(0) NOT NULL DEFAULT current_timestamp(),
    "updated_by_uid" VARCHAR(255 char) NULL DEFAULT NULL,
    "deleted_at" BIGINT NOT NULL DEFAULT 0,
    CLUSTER PRIMARY KEY ("data_set_id")
    );

CREATE INDEX IF NOT EXISTS data_set_id ON "data_set"("id");



CREATE TABLE IF NOT EXISTS "data_set_view_relation" (
    "id" VARCHAR(255 char) NOT NULL,
    "form_view_id" VARCHAR(36 char) NOT NULL,
    "updated_at" datetime(0) NOT NULL DEFAULT current_timestamp(),
    CLUSTER PRIMARY KEY ("id", "form_view_id")
    );




CREATE TABLE IF NOT EXISTS "template_rule" (
    "id" BIGINT NOT NULL  IDENTITY(1, 1),
    "rule_id" VARCHAR(36 char) DEFAULT NULL,
    "rule_name" VARCHAR(128 char) NOT NULL,
    "rule_description" VARCHAR(300 char) DEFAULT NULL,
    "rule_level" int NOT NULL,
    "dimension" int NOT NULL,
    "dimension_type" int DEFAULT NULL,
    "source" int NOT NULL,
    "rule_config" text DEFAULT NULL,
    "enable" int NOT NULL,
    "created_at" datetime(3) DEFAULT NULL,
    "created_by_uid" VARCHAR(36 char) DEFAULT NULL,
    "updated_at" datetime(3) DEFAULT NULL,
    "updated_by_uid" VARCHAR(36 char) DEFAULT NULL,
    "deleted_at" BIGINT NOT NULL,
    CLUSTER PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS template_rule_idx_rule_id ON "template_rule"("rule_id");

set IDENTITY_INSERT "template_rule" ON;

INSERT INTO "template_rule" ("id", "rule_id", "rule_name", "rule_description", "rule_level", "dimension", "dimension_type", "source", "rule_config", "enable", "created_at", "created_by_uid", "updated_at", "updated_by_uid", "deleted_at")
select '529106505304113153','4662a178-140f-4869-88eb-57f789baf1d3','表注释检查','检查是否包含表注释','1','1',NULL,'1',NULL,'0',NULL,NULL,NULL,NULL,'0'
from DUAL where NOT EXISTS(select id from "template_rule" where id='529106505304113153');

INSERT  INTO "template_rule" ("id", "rule_id", "rule_name", "rule_description", "rule_level", "dimension", "dimension_type", "source", "rule_config", "enable", "created_at", "created_by_uid", "updated_at", "updated_by_uid", "deleted_at")
 select '529108382372593665','931bf4e4-914e-4bff-af0c-ca57b63d1619','字段注释检查','检查字段注释是否完整','1','1',NULL,'1',NULL,'0',NULL,NULL,NULL,NULL,'0'
 from DUAL where not exists(select id from "template_rule" where id='529108382372593665');

INSERT  INTO "template_rule" ("id", "rule_id", "rule_name", "rule_description", "rule_level", "dimension", "dimension_type", "source", "rule_config", "enable", "created_at", "created_by_uid", "updated_at", "updated_by_uid", "deleted_at")
 select '529108545782677505','c2c65844-5573-4306-92d7-d3f9ac2edbf6','数据类型检查','检查字段的数据类型、长度、精度和字段关联的数据标准是否相同','1','2',NULL,'1',NULL,'0',NULL,NULL,NULL,NULL,'0'
 from DUAL where not exists(select id from "template_rule" where id='529108545782677505');

INSERT  INTO "template_rule" ("id", "rule_id", "rule_name", "rule_description", "rule_level", "dimension", "dimension_type", "source", "rule_config", "enable", "created_at", "created_by_uid", "updated_at", "updated_by_uid", "deleted_at")
 select '529118144111837185','6d8d7fdc-8cc4-4e89-a5dd-9b8d07a685dc','重复值检查','检查字段对应的值是否存在重复记录','2','3','5','1',NULL,'0',NULL,NULL,NULL,NULL,'0'
 from DUAL where not exists(select id from "template_rule" where id='529118144111837185');

INSERT  INTO "template_rule" ("id", "rule_id", "rule_name", "rule_description", "rule_level", "dimension", "dimension_type", "source", "rule_config", "enable", "created_at", "created_by_uid", "updated_at", "updated_by_uid", "deleted_at")
 select '529247613954818049','0c790158-9721-41ce-b8b3-b90341575485','最大值','计算数据表中指定字段数值最大值','2','7',NULL,'1',NULL,'0',NULL,NULL,NULL,NULL,'0'
 from DUAL where not exists(select id from "template_rule" where id='529247613954818049');

INSERT  INTO "template_rule" ("id", "rule_id", "rule_name", "rule_description", "rule_level", "dimension", "dimension_type", "source", "rule_config", "enable", "created_at", "created_by_uid", "updated_at", "updated_by_uid", "deleted_at")
 select '529247613971595265','73271129-2ae3-47aa-83c5-6c0bf002140c','最小值','计算数据表中指定字段数值最小值','2','7',NULL,'1',NULL,'0',NULL,NULL,NULL,NULL,'0'
 from DUAL where not exists(select id from "template_rule" where id='529247613971595265');

INSERT  INTO "template_rule" ("id", "rule_id", "rule_name", "rule_description", "rule_level", "dimension", "dimension_type", "source", "rule_config", "enable", "created_at", "created_by_uid", "updated_at", "updated_by_uid", "deleted_at")
 select '529247613971660801','91920b32-b884-4d23-a649-0518b038bf3b','分位数','计算数据表中指定字段分位数数值情况','2','7',NULL,'1',NULL,'0',NULL,NULL,NULL,NULL,'0'
 from DUAL where not exists(select id from "template_rule" where id='529247613971660801');

INSERT  INTO "template_rule" ("id", "rule_id", "rule_name", "rule_description", "rule_level", "dimension", "dimension_type", "source", "rule_config", "enable", "created_at", "created_by_uid", "updated_at", "updated_by_uid", "deleted_at")
 select '529247613971726337','fd9fa13a-40db-4283-9c04-bf0ff3edcb32','平均值统计','计算数据表中指定字段（限整数型、高精度型、小数型）数值平均值','2','7',NULL,'1',NULL,'0',NULL,NULL,NULL,NULL,'0'
 from DUAL where not exists(select id from "template_rule" where id='529247613971726337');

INSERT  INTO "template_rule" ("id", "rule_id", "rule_name", "rule_description", "rule_level", "dimension", "dimension_type", "source", "rule_config", "enable", "created_at", "created_by_uid", "updated_at", "updated_by_uid", "deleted_at")
 select '529247613971791873','06ad1362-9545-415d-9278-265e3abe7c10','标准差统计','计算数据表中指定字段（限整数型、高精度型、小数型）数值标准差','2','7',NULL,'1',NULL,'0',NULL,NULL,NULL,NULL,'0'
 from DUAL where not exists(select id from "template_rule" where id= '529247613971791873');

INSERT  INTO "template_rule" ("id", "rule_id", "rule_name", "rule_description", "rule_level", "dimension", "dimension_type", "source", "rule_config", "enable", "created_at", "created_by_uid", "updated_at", "updated_by_uid", "deleted_at")
 select '529247613971857409','96ac5dc0-2e5c-4397-87a7-8414dddf8179','枚举值分布','计算数据表中指定字段（限整数型、高精度型、小数型、字符型）值分布情况','2','7',NULL,'1',NULL,'0',NULL,NULL,NULL,NULL,'0'
 from DUAL where not exists(select id from "template_rule" where id='529247613971857409');

INSERT  INTO "template_rule" ("id", "rule_id", "rule_name", "rule_description", "rule_level", "dimension", "dimension_type", "source", "rule_config", "enable", "created_at", "created_by_uid", "updated_at", "updated_by_uid", "deleted_at")
 select '529247613971922945','95e5b917-6313-4bd0-8812-bf0d4aa68d73','天分布','计算数据表中指定字段（限日期型、日期时间型）数值按天分布情况','2','7',NULL,'1',NULL,'0',NULL,NULL,NULL,NULL,'0'
 from DUAL where not exists(select id from "template_rule" where id='529247613971922945');

INSERT  INTO "template_rule" ("id", "rule_id", "rule_name", "rule_description", "rule_level", "dimension", "dimension_type", "source", "rule_config", "enable", "created_at", "created_by_uid", "updated_at", "updated_by_uid", "deleted_at")
 select '529247613971988481','69c3d959-1c72-422b-959d-7135f52e4f9c','月分布','计算数据表中指定字段（限日期型、日期时间型）数值按月分布情况','2','7',NULL,'1',NULL,'0',NULL,NULL,NULL,NULL,'0'
 from DUAL where not exists(select id from "template_rule" where id='529247613971988481');

INSERT  INTO "template_rule" ("id", "rule_id", "rule_name", "rule_description", "rule_level", "dimension", "dimension_type", "source", "rule_config", "enable", "created_at", "created_by_uid", "updated_at", "updated_by_uid", "deleted_at")
 select '529247613972054017','709fca1a-4640-4cd7-94ed-50b1b16e0aa5','年分布','计算数据表中指定字段（限日期型、日期时间型）数值按年分布情况','2','7',NULL,'1',NULL,'0',NULL,NULL,NULL,NULL,'0'
 from DUAL where not exists(select id from "template_rule" where id='529247613972054017');

INSERT  INTO "template_rule" ("id", "rule_id", "rule_name", "rule_description", "rule_level", "dimension", "dimension_type", "source", "rule_config", "enable", "created_at", "created_by_uid", "updated_at", "updated_by_uid", "deleted_at")
 select '529247613972119553','ae0f6573-b3e0-4be2-8330-a643261f8a18','TRUE值数','计算数据表中指定字段（限布尔型）TRUE值行数','2','7',NULL,'1',NULL,'0',NULL,NULL,NULL,NULL,'0'
 from DUAL where not exists(select id from "template_rule" where id='529247613972119553');

INSERT  INTO "template_rule" ("id", "rule_id", "rule_name", "rule_description", "rule_level", "dimension", "dimension_type", "source", "rule_config", "enable", "created_at", "created_by_uid", "updated_at", "updated_by_uid", "deleted_at")
 select '529247613972185089','45a4b3cb-b93c-469d-b3b4-631a3b8db5fe','FALSE值数','计算数据表中指定字段（限布尔型）FALSE值行数','2','7',NULL,'1',NULL,'0',NULL,NULL,NULL,NULL,'0'
 from DUAL where not exists(select id from "template_rule" where id='529247613972185089');


CREATE TABLE if not exists "grade_rule_group" (
    "id" varchar(36 char) NOT NULL DEFAULT '' ,
    "name" varchar(255 char) NOT NULL DEFAULT '' ,
    "description" varchar(1024 char) DEFAULT '' ,
    "business_object_id" varchar(36 char) NOT NULL ,
    "created_at" datetime DEFAULT current_timestamp() ,
    "updated_at" datetime NOT NULL DEFAULT current_timestamp() ,
    "deleted_at" bigint  NOT NULL DEFAULT 0 ,
    CLUSTER PRIMARY KEY ("id")
) ;


create table if not EXISTS "t_model_label_rec_rel"(
    "id" bigint  NOT NULL ,
    "name" varchar(50 char) DEFAULT NULL  ,
    "description" varchar(300 char) DEFAULT NULL ,
    "related_model_ids" varchar(500 char) NOT NULL ,
    "created_at" datetime(3) NOT NULL DEFAULT current_timestamp(3)   ,
    "creator_uid" varchar(36 char) DEFAULT NULL ,
    "created_name" varchar(50 char) DEFAULT NULL ,
    "updated_at" datetime DEFAULT NULL  ,
    "updater_uid" varchar(36 char) DEFAULT NULL ,
    "updater_name" varchar(50 char) DEFAULT NULL,
    "deleted_at"  bigint    DEFAULT NULL ,
    CLUSTER PRIMARY KEY ("id")
) ;

CREATE TABLE IF NOT EXISTS "department_explore_report" (
    "id" BIGINT NOT NULL,
    "department_id" VARCHAR(36 char) NOT NULL,
    "total_views" INT NOT NULL,
    "explored_views" INT NOT NULL,
    "f_total_score" DECIMAL(10,4),
    "f_total_completeness" DECIMAL(10,4),
    "f_total_standardization" DECIMAL(10,4),
    "f_total_uniqueness" DECIMAL(10,4),
    "f_total_accuracy" DECIMAL(10,4),
    "f_total_consistency" DECIMAL(10,4),
    CLUSTER PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "department_explore_report_idx_department_id" ON "department_explore_report"("department_id");

create table if not EXISTS "user"(
    "id"        varchar(36 char)          not null  ,
    "name"      varchar(255 char)      null,
    "status"    tinyint default 1 not null  ,
    "user_type" tinyint default 1 not null ,
    CLUSTER primary key  ("id")
);