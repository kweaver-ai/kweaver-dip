SET SCHEMA af_cognitive_assistant;


CREATE TABLE IF NOT EXISTS "t_agent" (
    "agent_id"INT NOT NULL IDENTITY(1, 1),
    "id" varchar(100 char) NOT NULL,
    "adp_agent_key" varchar(100 char) NOT NULL,
    "category_ids" varchar(180 char) NULL  ,
    "deleted_at" INT DEFAULT 0,
    "created_at" date DEFAULT NULL,
    "updated_at" date DEFAULT NULL,
    CLUSTER PRIMARY KEY ("id")
    );

CREATE TABLE  if not exists "t_system_config" (
    "f_id" BIGINT NOT NULL,
    "f_config_key" VARCHAR(25 char) NOT NULL,
    "f_config_value" VARCHAR(50 char) NOT NULL,
    "f_config_group" VARCHAR(50 char) NOT NULL,
    "f_config_group_type" TINYINT NOT NULL default 0,
    "f_config_desc" VARCHAR(255 char)  NULL ,
    "f_created_at" DATETIME NOT NULL,
    "f_updated_at" DATETIME NOT NULL,
    "f_deleted_at" BIGINT not null default 0,
    "f_created_by" VARCHAR(50 char)  NULL,
    "f_updated_by" VARCHAR(50 char)  NULL,
    CLUSTER PRIMARY KEY ("f_id")
    ) ;

CREATE UNIQUE INDEX IF NOT EXISTS t_system_config_uk_config_key ON t_system_config("f_config_key","f_config_group_type","f_deleted_at");

-- set IDENTITY_INSERT "t_system_config" ON;

--
-- -- 初始化角色配置
-- INSERT INTO "t_system_config" ("f_id", "f_config_key", "f_config_value", "f_config_group", "f_config_group_type", "f_config_desc", "f_created_at", "f_updated_at", "f_deleted_at", "f_created_by", "f_updated_by")
-- VALUES
--     (1, 'ROLE_TEACHER', '教师', '用户', 0, '教师角色', NOW(), NOW(), 0, 'system', 'system'),
--     (2, 'ROLE_ADMIN', '管理员', '用户', 0, '管理员角色', NOW(), NOW(), 0, 'system', 'system');
--
-- -- 初始化组织级别配置
-- INSERT INTO "t_system_config" ("f_id", "f_config_key", "f_config_value", "f_config_group", "f_config_group_type", "f_config_desc", "f_created_at", "f_updated_at", "f_deleted_at", "f_created_by", "f_updated_by")
-- VALUES
--     (3, 'ORG_LEVEL_2', '总部', '机构', 0, '总部级别', NOW(), NOW(), 0, 'system', 'system'),
--     (4, 'ORG_LEVEL_3', '分部', '机构', 0, '分部级别', NOW(), NOW(), 0, 'system', 'system'),
--     (5, 'ORG_LEVEL_4', '分校', '机构', 0, '分校级别', NOW(), NOW(), 0, 'system', 'system'),
--     (6, 'ORG_LEVEL_5', '学习中心', '机构', 0, '学习中心级别', NOW(), NOW(), 0, 'system', 'system');
--
-- -- 初始化业务场景配置
-- INSERT INTO "t_system_config" ("f_id", "f_config_key", "f_config_value", "f_config_group", "f_config_group_type", "f_config_desc", "f_created_at", "f_updated_at", "f_deleted_at", "f_created_by", "f_updated_by")
-- VALUES
--     (7, 'BUSINESS_ENROLLED', '在籍', '招生', 0, '在籍业务场景', NOW(), NOW(), 0, 'system', 'system'),
--     (8, 'BUSINESS_GRADUATION', '毕业', '招生', 0, '毕业业务场景', NOW(), NOW(), 0, 'system', 'system'),
--     (9, 'BUSINESS_COURSE', '课程', '招生', 0, '课程业务场景', NOW(), NOW(), 0, 'system', 'system'),
--     (10, 'BUSINESS_TEST', '测验', '招生', 0, '测验业务场景', NOW(), NOW(), 0, 'system', 'system'),
--     (11, 'BUSINESS_POST', '发帖', '招生', 0, '发帖业务场景', NOW(), NOW(), 0, 'system', 'system');
--
-- -- 初始化权限范围配置
-- INSERT INTO "t_system_config" ("f_id", "f_config_key", "f_config_value", "f_config_group", "f_config_group_type", "f_config_desc", "f_created_at", "f_updated_at", "f_deleted_at", "f_created_by", "f_updated_by")
-- VALUES
--     (15, 'PERMISSION_SCOPE_ORG', '机构', '粒度', 0, '机构权限范围', NOW(), NOW(), 0, 'system', 'system'),
--     (16, 'PERMISSION_SCOPE_PERSONAL', '个人', '粒度', 0, '个人权限范围', NOW(), NOW(), 0, 'system', 'system');


CREATE TABLE  if not exists "t_memory_chunks" (
    "id"                 varchar(64 char)  not null  ,
    "document_id"        varchar(64 char)  not null  ,
    "user_id"            varchar(128 char) not null  ,
    "datasource_id"      varchar(128 char) null   ,
    "text"               text         not null  ,
    "keyword_score_hint" float        null  ,
    "embedding_json"     text         null  ,
    "start_line"         int          null  ,
    "end_line"           int          null  ,
    "metadata"           text         null  ,
    "created_at"         datetime     not null  ,
    CLUSTER PRIMARY KEY ("id")
) ;

CREATE  INDEX IF NOT EXISTS idx_memory_chunks_datasource_id ON t_memory_chunks("datasource_id");
CREATE  INDEX IF NOT EXISTS idx_memory_chunks_document_id ON t_memory_chunks("document_id");
CREATE  INDEX IF NOT EXISTS idx_memory_chunks_user_id ON t_memory_chunks("user_id");

create table  if not exists "t_memory_documents"(
    "id"             varchar(64 char)  not null  ,
    "user_id"        varchar(128 char) not null  ,
    "source_type"    varchar(32 char)  not null ,
    "datasource_id"  varchar(128 char) null  ,
    "title"          varchar(200 char) null ,
    "text"           text         not null  ,
    "location"       varchar(255 char) null  ,
    "metadata"       text         null  ,
    "segmented_text" text         null  ,
    "created_at"     datetime     not null  ,
    "updated_at"     datetime     not null  ,
    CLUSTER PRIMARY KEY ("id")
) ;

CREATE  INDEX IF NOT EXISTS idx_memory_documents_datasource_id ON t_memory_documents("datasource_id");
CREATE  INDEX IF NOT EXISTS idx_memory_documents_source_type ON t_memory_documents("source_type");
CREATE  INDEX IF NOT EXISTS idx_memory_documents_user_id ON t_memory_documents("user_id");