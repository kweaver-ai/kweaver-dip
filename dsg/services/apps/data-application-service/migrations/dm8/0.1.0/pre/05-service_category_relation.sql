SET SCHEMA data_application_service;


CREATE TABLE IF NOT EXISTS "service_category_relation" (
     "id" BIGINT NOT NULL,
     "category_id" VARCHAR(36 char) NOT NULL,
     "category_node_id" VARCHAR(36 char)  DEFAULT NULL ,
     "service_id" VARCHAR(255 char) NOT NULL,
     "deleted_at" BIGINT NOT NULL DEFAULT 0,
     CLUSTER PRIMARY KEY ("id")
     );

