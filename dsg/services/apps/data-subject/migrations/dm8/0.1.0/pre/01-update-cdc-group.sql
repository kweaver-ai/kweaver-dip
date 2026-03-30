SET SCHEMA af_main;

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


UPDATE af_main.cdc_task set group_id='af.auth-service' where  group_id='auth-service'

