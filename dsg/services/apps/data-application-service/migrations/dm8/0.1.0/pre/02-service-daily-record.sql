SET SCHEMA data_application_service;

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

