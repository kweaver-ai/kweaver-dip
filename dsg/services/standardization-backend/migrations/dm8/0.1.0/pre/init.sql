SET SCHEMA af_std;

CREATE TABLE IF NOT EXISTS "t_data_element_his" (
  "f_de_id" BIGINT NOT NULL DEFAULT 0,
  "f_de_code" BIGINT NOT NULL DEFAULT 0,
  "f_name_en" VARCHAR(128 CHAR) NOT NULL,
  "f_name_cn" VARCHAR(255 char) DEFAULT NULL,
  "f_synonym" VARCHAR(512 char) NOT NULL DEFAULT '',
  "f_std_type" INT NOT NULL DEFAULT 0,
  "f_data_type" INT NOT NULL DEFAULT 0,
  "f_data_length" INT   DEFAULT NULL,
  "f_data_precision" INT DEFAULT NULL,
  "f_dict_code" BIGINT NOT NULL DEFAULT 0,
  "f_description" VARCHAR(1000 char) NOT NULL DEFAULT '',
  "f_version" INT NOT NULL DEFAULT 1,
  "f_status" INT NOT NULL DEFAULT 0,
  "f_create_user" VARCHAR(128 char) NOT NULL DEFAULT '',
  "f_create_time" datetime(0) DEFAULT NULL,
  "f_update_user" VARCHAR(128 char) NOT NULL DEFAULT '',
  "f_update_time" datetime(0) DEFAULT NULL,
  "f_std_file_code" BIGINT NOT NULL DEFAULT 0,
  "f_authority_id" BIGINT NOT NULL DEFAULT 0,
  "f_catalog_id" BIGINT NOT NULL DEFAULT 0,
  "f_relation_type" VARCHAR(10 char) NOT NULL DEFAULT 'no',
  "f_isempty_flag" INT NOT NULL DEFAULT 0,
  "f_department_ids" VARCHAR(350 char) DEFAULT  NULL,
  "f_third_dept_id"  VARCHAR(36 char) DEFAULT NULL,
  CLUSTER PRIMARY KEY ("f_de_id")
  );

CREATE INDEX IF NOT EXISTS t_data_element_his_idx_conditions ON t_data_element_his("f_de_code");




CREATE TABLE IF NOT EXISTS "t_data_element_info" (
  "f_de_id" BIGINT NOT NULL DEFAULT 0,
  "f_de_code" BIGINT NOT NULL DEFAULT 0,
  "f_name_en" VARCHAR(128 char) NOT NULL,
  "f_name_cn" VARCHAR(255 char) DEFAULT NULL,
  "f_synonym" VARCHAR(512 char) NOT NULL DEFAULT '',
  "f_std_type" INT NOT NULL DEFAULT 0,
  "f_data_type" INT NOT NULL DEFAULT 0,
  "f_data_length" INT   DEFAULT null,
  "f_data_precision" INT DEFAULT NULL,
  "f_dict_code" BIGINT NOT NULL DEFAULT 0,
  "f_label_id"  BIGINT                    null,
  "f_description" VARCHAR(1000 char) NOT NULL DEFAULT '',
  "f_version" INT NOT NULL DEFAULT 1,
  "f_status" INT NOT NULL DEFAULT 0,
  "f_create_user" VARCHAR(128 char) NOT NULL DEFAULT '',
  "f_create_time" datetime(0) DEFAULT NULL,
  "f_update_user" VARCHAR(128 char) NOT NULL DEFAULT '',
  "f_update_time" datetime(0) DEFAULT NULL,
  "f_authority_id" VARCHAR(100 char) NOT NULL DEFAULT '0',
  "f_catalog_id" BIGINT NOT NULL DEFAULT 0,
  "f_deleted" BIGINT NOT NULL DEFAULT 0,
  "f_state" INT NOT NULL DEFAULT 1,
  "f_disable_reason" VARCHAR(1024 char)  DEFAULT NULL,
  "f_rule_id" BIGINT  DEFAULT NULL,
  "f_relation_type" VARCHAR(10 char) NOT NULL DEFAULT 'no',
  "f_isempty_flag" INT NOT NULL DEFAULT 0,
  "f_department_ids" VARCHAR(350 char) DEFAULT  NULL,
  "f_third_dept_id"  VARCHAR(36 char) DEFAULT NULL,
  CLUSTER PRIMARY KEY ("f_de_id")
  );

CREATE UNIQUE INDEX IF NOT EXISTS t_data_element_info_uk_code ON t_data_element_info("f_de_code","f_version");
CREATE UNIQUE INDEX IF NOT EXISTS t_data_element_info_uk_cn ON t_data_element_info("f_name_cn","f_std_type", "f_deleted","f_department_ids");
CREATE INDEX IF NOT EXISTS t_data_element_info_idx_conditions ON t_data_element_info("f_synonym","f_catalog_id","f_status","f_create_time","f_update_time");




CREATE TABLE IF NOT EXISTS "t_de_catalog_info" (
  "f_id" BIGINT NOT NULL DEFAULT 0,
  "f_catalog_name" VARCHAR(20 char) NOT NULL DEFAULT '',
  "f_description" VARCHAR(255 char) NOT NULL DEFAULT '',
  "f_level" INT NOT NULL DEFAULT 0,
  "f_parent_id" BIGINT NOT NULL DEFAULT 0,
  "f_type" INT NOT NULL DEFAULT 0,
  "f_authority_id" BIGINT NOT NULL DEFAULT 0,
  CLUSTER PRIMARY KEY ("f_id")
  );

CREATE UNIQUE INDEX IF NOT EXISTS t_de_catalog_info_uk_name ON t_de_catalog_info("f_catalog_name","f_type","f_parent_id");
CREATE INDEX IF NOT EXISTS t_de_catalog_info_idx_level_parent_id ON t_de_catalog_info("f_level","f_parent_id");




CREATE TABLE IF NOT EXISTS "t_de_dict" (
  "f_id" BIGINT NOT NULL IDENTITY(1, 1),
  "f_code" BIGINT NOT NULL,
  "f_ch_name" VARCHAR(128 char) NOT NULL,
  "f_en_name" VARCHAR(128 char) NOT NULL,
  "f_description" VARCHAR(300 char) DEFAULT NULL,
  "f_catalog_id" BIGINT NOT NULL,
  "f_version" INT NOT NULL DEFAULT 1,
  "f_authority_id" VARCHAR(100 char)  NOT NULL,
  "f_create_time" datetime(0) NOT NULL,
  "f_create_user" VARCHAR(128 char) DEFAULT NULL,
  "f_update_time" datetime(0) DEFAULT NULL,
  "f_update_user" VARCHAR(128 char) DEFAULT NULL,
  "f_org_type" INT NOT NULL,
  "f_state" INT DEFAULT 1 NOT NULL,
  "f_disable_reason" VARCHAR(1024 char) DEFAULT NULL,
  "f_deleted" BIGINT DEFAULT 0 NOT NULL,
  "f_department_ids" VARCHAR(350 char) DEFAULT  NULL,
  "f_third_dept_id"  VARCHAR(36 char) DEFAULT NULL,
  CLUSTER PRIMARY KEY ("f_id")
  );

CREATE INDEX IF NOT EXISTS uk_chname_orgtype_deleted ON t_de_dict (f_ch_name,f_org_type,f_deleted,f_department_ids);
CREATE INDEX IF NOT EXISTS uk_enname_orgtype_delete ON t_de_dict (f_en_name,f_org_type,f_deleted,f_department_ids);




CREATE TABLE IF NOT EXISTS "t_de_dict_enum" (
  "f_id" BIGINT NOT NULL IDENTITY(1, 1),
  "f_code" VARCHAR(100 char) NOT NULL,
  "f_value" VARCHAR(100 char) NOT NULL,
  "f_description" VARCHAR(300 char) DEFAULT NULL,
  "f_dict_id" BIGINT NOT NULL,
  CLUSTER PRIMARY KEY ("f_id")
  );

CREATE INDEX IF NOT EXISTS t_de_dict_enum_idx_f_dict_id ON t_de_dict_enum("f_dict_id");




CREATE TABLE IF NOT EXISTS "t_de_dict_enum_his" (
  "f_id" BIGINT NOT NULL IDENTITY(1, 1),
  "f_code" VARCHAR(100 char) NOT NULL,
  "f_value" VARCHAR(100 char) NOT NULL,
  "f_description" VARCHAR(255 char) DEFAULT NULL,
  "f_dict_id" BIGINT NOT NULL,
  CLUSTER PRIMARY KEY ("f_id")
  );

CREATE INDEX IF NOT EXISTS t_de_dict_enum_his_idx_f_dict_id ON t_de_dict_enum_his("f_dict_id");




CREATE TABLE IF NOT EXISTS "t_de_dict_his" (
  "f_id" BIGINT NOT NULL IDENTITY(1, 1),
  "f_code" BIGINT NOT NULL,
  "f_ch_name" VARCHAR(128 char) NOT NULL,
  "f_en_name" VARCHAR(128 char) NOT NULL,
  "f_description" VARCHAR(255 char) DEFAULT NULL,
  "f_catalog_id" BIGINT NOT NULL,
  "f_version" VARCHAR(10 char) NOT NULL,
  "f_status" INT NOT NULL,
  "f_authority_id" BIGINT NOT NULL,
  "f_std_file_code" BIGINT NOT NULL DEFAULT 0,
  "f_create_time" datetime(0) NOT NULL,
  "f_create_user" VARCHAR(128 char) DEFAULT NULL,
  "f_update_time" datetime(0) DEFAULT NULL,
  "f_update_user" VARCHAR(128 char) DEFAULT NULL,
  "f_org_type" INT NOT NULL,
  "f_department_ids" VARCHAR(350 char) DEFAULT  NULL,
  "f_third_dept_id"  VARCHAR(36 char) DEFAULT NULL,
  CLUSTER PRIMARY KEY ("f_id")
  );


CREATE TABLE IF NOT EXISTS "t_de_task_std_create" (
  "f_id" BIGINT NOT NULL IDENTITY(1, 1),
  "f_task_no" VARCHAR(100 char) NOT NULL,
  "f_table" VARCHAR(128 char) DEFAULT NULL,
  "f_table_description" VARCHAR(1024 char) DEFAULT NULL,
  "f_table_field" VARCHAR(8192 char) DEFAULT NULL,
  "f_status" INT NOT NULL,
  "f_create_time" datetime(0) DEFAULT NULL,
  "f_create_user" VARCHAR(128 char) DEFAULT NULL,
  "f_create_user_phone" VARCHAR(100 char) DEFAULT NULL,
  "f_update_time" datetime(0) DEFAULT NULL,
  "f_update_user" VARCHAR(128 char) DEFAULT NULL,
  "f_webhook" VARCHAR(1024 char) NOT NULL,
  CLUSTER PRIMARY KEY ("f_id")
  );




CREATE TABLE IF NOT EXISTS "t_de_task_std_create_result" (
  "f_id" BIGINT NOT NULL IDENTITY(1, 1),
  "f_task_id" BIGINT NOT NULL,
  "f_table_field" VARCHAR(128 char) NOT NULL,
  "f_table_field_description" VARCHAR(1024 char) DEFAULT NULL,
  "f_std_ref_file" VARCHAR(1024 char) DEFAULT NULL,
  "f_std_code" BIGINT DEFAULT NULL,
  "f_std_ch_name" VARCHAR(128 char) DEFAULT NULL,
  "f_std_en_name" VARCHAR(128 char) DEFAULT NULL,
  "f_rec_std_code" VARCHAR(100 char) DEFAULT NULL,
  CLUSTER PRIMARY KEY ("f_id")
  );


INSERT INTO t_de_catalog_info(f_id, f_catalog_name, f_description, f_level, f_parent_id, f_type, f_authority_id) select 11,'全部目录','',1,1,1,0 from DUAL WHERE NOT EXISTS ( SELECT f_id from t_de_catalog_info where f_id = 11);

INSERT INTO t_de_catalog_info(f_id, f_catalog_name, f_description, f_level, f_parent_id, f_type, f_authority_id) select 22,'全部目录','',1,2,2,0 from DUAL WHERE NOT EXISTS ( SELECT f_id from t_de_catalog_info where f_id = 22);

INSERT INTO t_de_catalog_info(f_id, f_catalog_name, f_description, f_level, f_parent_id, f_type, f_authority_id) select 33,'全部目录','',1,3,3,0 from DUAL WHERE NOT EXISTS ( SELECT f_id from t_de_catalog_info where f_id = 33);

INSERT INTO t_de_catalog_info(f_id, f_catalog_name, f_description, f_level, f_parent_id, f_type, f_authority_id) select 44,'全部目录','',1,4,4,0 from DUAL WHERE NOT EXISTS ( SELECT f_id from t_de_catalog_info where f_id = 44);

INSERT INTO t_de_catalog_info(f_id, f_catalog_name, f_description, f_level, f_parent_id, f_type, f_authority_id) select 331,'数字','',2,33,3,0 from DUAL WHERE NOT EXISTS ( SELECT f_id from t_de_catalog_info where f_id = 331);

INSERT INTO t_de_catalog_info(f_id, f_catalog_name, f_description, f_level, f_parent_id, f_type, f_authority_id) select 332,'字符','',2,33,3,0 from DUAL WHERE NOT EXISTS ( SELECT f_id from t_de_catalog_info where f_id = 332);

INSERT INTO t_de_catalog_info(f_id, f_catalog_name, f_description, f_level, f_parent_id, f_type, f_authority_id) select 333,'时间','',2,33,3,0 from DUAL WHERE NOT EXISTS ( SELECT f_id from t_de_catalog_info where f_id = 333);

INSERT INTO t_de_catalog_info(f_id, f_catalog_name, f_description, f_level, f_parent_id, f_type, f_authority_id) select 334,'日期','',2,33,3,0 from DUAL WHERE NOT EXISTS ( SELECT f_id from t_de_catalog_info where f_id = 334);

INSERT INTO t_de_catalog_info(f_id, f_catalog_name, f_description, f_level, f_parent_id, f_type, f_authority_id) select 335,'时间日期','',2,33,3,0 from DUAL WHERE NOT EXISTS ( SELECT f_id from t_de_catalog_info where f_id = 335);

INSERT INTO t_de_catalog_info(f_id, f_catalog_name, f_description, f_level, f_parent_id, f_type, f_authority_id) select 336,'枚举','',2,33,3,0 from DUAL WHERE NOT EXISTS ( SELECT f_id from t_de_catalog_info where f_id = 336);

INSERT INTO t_de_catalog_info(f_id, f_catalog_name, f_description, f_level, f_parent_id, f_type, f_authority_id) select 337,'编码','',2,33,3,0 from DUAL WHERE NOT EXISTS ( SELECT f_id from t_de_catalog_info where f_id = 337);







CREATE TABLE IF NOT EXISTS "t_std_file" (
  "f_id" BIGINT NOT NULL IDENTITY(1, 1),
  "f_number" VARCHAR(256 char) DEFAULT NULL,
  "f_version" INT NOT NULL DEFAULT 1,
  "f_catalog_id" BIGINT NOT NULL,
  "f_name" VARCHAR(256 char) NOT NULL,
  "f_act_date" datetime(0) DEFAULT NULL,
  "f_disable_date" datetime(0) DEFAULT NULL,
  "f_state" INT NOT NULL DEFAULT 1,
  "f_disable_reason" VARCHAR(1024 char) DEFAULT NULL,
  "f_attachment_type" INT NOT NULL DEFAULT 0,
  "f_attachment_url" VARCHAR(2048 char) DEFAULT NULL,
  "f_file_name" VARCHAR(255 char) DEFAULT NULL,
  "f_org_type" INT NOT NULL DEFAULT 0,
  "f_description" VARCHAR(300 char) DEFAULT NULL,
  "f_authority_id" VARCHAR(100 char) DEFAULT NULL,
  "f_create_time" datetime(0) DEFAULT NULL,
  "f_create_user" VARCHAR(128 char) DEFAULT NULL,
  "f_update_time" datetime(0) DEFAULT NULL,
  "f_update_user" VARCHAR(128 char) DEFAULT NULL,
  "f_deleted" BIGINT NOT NULL DEFAULT 0,
  "f_publish_date" datetime(0) DEFAULT NULL,
  "f_department_ids" VARCHAR(350 char) DEFAULT  NULL,
  "f_third_dept_id"  VARCHAR(36 char) DEFAULT NULL,
  CLUSTER PRIMARY KEY ("f_id")
  );

CREATE UNIQUE INDEX IF NOT EXISTS t_std_file_uk_name_orgtype_deleted ON t_std_file("f_name","f_org_type","f_deleted","f_department_ids");
CREATE UNIQUE INDEX IF NOT EXISTS t_std_file_uk_number_deleted ON t_std_file("f_number","f_deleted");

CREATE INDEX IF NOT EXISTS t_std_file_ik_catalog_idx ON t_std_file (f_catalog_id);



CREATE TABLE IF NOT EXISTS "t_rule" (
  "f_id" BIGINT NOT NULL IDENTITY(1, 1),
  "f_name" VARCHAR(128 char) NOT NULL,
  "f_catalog_id" BIGINT NOT NULL,
  "f_org_type" INT NOT NULL,
  "f_description" VARCHAR(300 char) DEFAULT NULL,
  "f_rule_type" INT NOT NULL DEFAULT 0,
  "f_version" INT NOT NULL DEFAULT 1,
  "f_expression" VARCHAR(1024 char) NOT NULL,
  "f_state" INT NOT NULL DEFAULT 1,
  "f_disable_reason" VARCHAR(1024 char) DEFAULT NULL,
  "f_authority_id" VARCHAR(100 char) DEFAULT NULL,
  "f_create_time" datetime(0) DEFAULT NULL,
  "f_create_user" VARCHAR(128 char) DEFAULT NULL,
  "f_update_time" datetime(0) DEFAULT NULL,
  "f_update_user" VARCHAR(128 char) DEFAULT NULL,
  "f_deleted" BIGINT NOT NULL DEFAULT 0,
  "f_department_ids" VARCHAR(350 char) DEFAULT  NULL,
  "f_third_dept_id"  VARCHAR(36 char) DEFAULT NULL,
  CLUSTER PRIMARY KEY ("f_id")
  );

CREATE UNIQUE INDEX IF NOT EXISTS t_rule_uk_name_orgtype_deleted ON t_rule("f_name","f_org_type","f_deleted","f_department_ids");



CREATE TABLE IF NOT EXISTS "t_relation_rule_file" (
    "f_id" BIGINT NOT NULL,
    "f_rule_id" BIGINT NOT NULL,
    "f_file_id" BIGINT NOT NULL,
    CLUSTER PRIMARY KEY ("f_id")
  );

CREATE UNIQUE INDEX IF NOT EXISTS t_relation_rule_file_uk_ruleid_fileid ON t_relation_rule_file("f_rule_id","f_file_id");



CREATE TABLE IF NOT EXISTS "t_relation_dict_file" (
    "f_id" BIGINT NOT NULL,
    "f_dict_id" BIGINT NOT NULL,
    "f_file_id" BIGINT NOT NULL,
    CLUSTER PRIMARY KEY ("f_id")
  );

CREATE UNIQUE INDEX IF NOT EXISTS t_relation_dict_file_uk_dictid_fileid ON t_relation_dict_file("f_dict_id","f_file_id");



CREATE TABLE IF NOT EXISTS  "t_relation_de_file" (
    "f_id" BIGINT NOT NULL,
    "f_de_id" BIGINT NOT NULL,
    "f_file_id" BIGINT NOT NULL,
    CLUSTER PRIMARY KEY ("f_id")
  );


CREATE TABLE IF NOT EXISTS "t_business_table_std_create_pool" (
  "f_id" BIGINT NOT NULL IDENTITY(1, 1),
  "f_business_table_model_id" VARCHAR(128 char) NOT NULL,
  "f_business_table_name" VARCHAR(512 char) NOT NULL,
  "f_business_table_id" VARCHAR(255 char) NOT NULL,
  "f_business_table_type" VARCHAR(255 char) NOT NULL,
  "f_business_table_field_id" VARCHAR(255 char) NOT NULL,
  "f_business_table_field_current_name" VARCHAR(512 char) NOT NULL,
  "f_business_table_field_origin_name" VARCHAR(512 char) DEFAULT NULL,
  "f_business_table_field_current_name_en" VARCHAR(512 char) NOT NULL,
  "f_business_table_field_origin_name_en" VARCHAR(512 char)  DEFAULT NULL,
  "f_business_table_field_current_std_type" VARCHAR(128 char) DEFAULT NULL,
  "f_business_table_field_origin_std_type" VARCHAR(128 char) DEFAULT NULL,
  "f_business_table_field_data_type" VARCHAR(128 char) NOT NULL,
  "f_business_table_field_data_length" INT DEFAULT NULL,
  "f_business_table_field_data_precision" INT DEFAULT NULL,
  "f_business_table_field_dict_name" VARCHAR(512 char) DEFAULT NULL,
  "f_business_table_field_rule_name" VARCHAR(512 char) DEFAULT NULL,
  "f_business_table_field_description" VARCHAR(1024 char) NULL DEFAULT NULL,
  "f_state" INT NOT NULL DEFAULT '0',
  "f_task_id" VARCHAR(128 char) NULL DEFAULT NULL,
  "f_data_element_id" BIGINT NULL DEFAULT NULL,
  "f_create_user" VARCHAR(128 char) NULL DEFAULT NULL,
  "f_update_user" VARCHAR(128 char) NULL DEFAULT NULL,
  "f_create_time" datetime(0) NULL DEFAULT NULL,
  "f_update_time" datetime(0) NULL DEFAULT NULL,
  CLUSTER PRIMARY KEY ("f_id")
  );

