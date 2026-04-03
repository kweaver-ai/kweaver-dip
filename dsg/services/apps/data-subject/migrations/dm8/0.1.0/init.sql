SET SCHEMA af_main;

CREATE TABLE IF NOT EXISTS "subject_domain" (
    "domain_id" BIGINT  NOT NULL IDENTITY(1, 1),
    "id" VARCHAR(36 char) NOT NULL,
    "name" VARCHAR(300 char) NOT NULL,
    "description" VARCHAR(255 char) NOT NULL DEFAULT '',
    "type" TINYINT NOT NULL,
    "path_id" text NOT NULL,
    "path" text NOT NULL,
    "owners" text DEFAULT NULL,
    "created_at" datetime(3) NOT NULL DEFAULT current_timestamp(3),
    "created_by_uid" VARCHAR(36 char) NOT NULL,
    "updated_at" datetime(3) NOT NULL DEFAULT current_timestamp(3),
    "updated_by_uid" VARCHAR(36 char) NOT NULL DEFAULT '',
    "deleted_at" BIGINT DEFAULT 0,
    "ref_id" text DEFAULT NULL,
    "unique" TINYINT NOT NULL,
    "standard_id" BIGINT DEFAULT NULL,
    "label_id" BIGINT  DEFAULT NULL,
    "form_field_id" VARCHAR(36 char) DEFAULT NULL,
    "form_id" VARCHAR(36 char) DEFAULT NULL,
    CLUSTER PRIMARY KEY ("domain_id")
);


CREATE INDEX IF NOT EXISTS subject_domain_id ON subject_domain("id");



CREATE TABLE IF NOT EXISTS "standard_info" (
    "id" BIGINT NOT NULL,
    "name" VARCHAR(255 char) NOT NULL,
    "name_en" VARCHAR(128 char) NOT NULL,
    "data_type" VARCHAR(128 char) NOT NULL,
    "data_length" INT DEFAULT NULL,
    "data_accuracy" TINYINT  DEFAULT NULL,
    "value_range" text NOT NULL,
    "formulate_basis" TINYINT NOT NULL,
    "code_table" text NOT NULL,
    CLUSTER PRIMARY KEY ("id")
);



CREATE TABLE IF NOT EXISTS "form_business_object_relation"  (
    "relation_id" BIGINT NOT NULL,
    "form_id" VARCHAR(36 char) NOT NULL,
    "business_object_id" VARCHAR(36 char) NOT NULL,
    "logical_entity_id" VARCHAR(36 char)  NOT NULL,
    "attribute_id" VARCHAR(36 char)  NOT NULL,
    "field_id" VARCHAR(36 char) NOT NULL,
    CLUSTER PRIMARY KEY ("relation_id")
);

CREATE INDEX IF NOT EXISTS form_business_object_relation_attribute_id ON form_business_object_relation("attribute_id");




CREATE TABLE IF NOT EXISTS  "cdc_task" (
    "database" VARCHAR(255 char) NOT NULL,
    "table" VARCHAR(255 char) NOT NULL,
    "columns" VARCHAR(255 char) NOT NULL,
    "topic" VARCHAR(255 char) NOT NULL,
    "group_id" VARCHAR(255 char) NOT NULL,
    "id" VARCHAR(255 char) NOT NULL,
    "updated_at" datetime(3) NOT NULL COMMENT '当前同步记录时间',
    CLUSTER PRIMARY KEY ("id")
);

