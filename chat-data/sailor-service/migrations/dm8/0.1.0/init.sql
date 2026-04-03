SET SCHEMA af_cognitive_assistant;

CREATE TABLE if not exists "t_knowledge_network_info" (
    "m_id" BIGINT NOT NULl IDENTITY(1, 1),
    "f_id" VARCHAR(36 char) not null default '',
    "f_name" VARCHAR(128 char) not null default '',
    "f_version" INT not null default 0,
    "f_type" TINYINT not null default 0,
    "f_config_id" VARCHAR(64 char) not null default '',
    "f_real_id" VARCHAR(36 char) not null default '',
    "f_created_at" datetime(3) not null default current_timestamp(3),
    "f_updated_at" datetime(3) not null default current_timestamp(3),
    "f_deleted_at" BIGINT not null default 0,
    CLUSTER PRIMARY KEY ("m_id")
    ) ;
CREATE UNIQUE INDEX IF NOT EXISTS t_knowledge_network_info_ukid_deleted ON t_knowledge_network_info("f_id","f_deleted_at");


CREATE TABLE if not exists "t_knowledge_network_info_detail" (
     "m_id" BIGINT NOT NULl IDENTITY(1, 1),
    "f_id" VARCHAR(36 char) not null default '',
    "f_detail" text null ,
    CLUSTER PRIMARY KEY ("m_id")
    );

CREATE TABLE if not exists "t_qa_word_history" (
     "id" INT NOT NULL IDENTITY(1, 1),
    "user_id" VARCHAR(255 char) NOT NULL,
    "qword_list" text NOT NULL,
    "updated_at" datetime(0) NOT NULL,
    "created_at" datetime(0) NOT NULL,
    CLUSTER PRIMARY KEY ("id")
    );

CREATE UNIQUE INDEX IF NOT EXISTS t_qa_word_history_user_idk ON t_qa_word_history("user_id");



CREATE TABLE if not exists "t_chat_history" (
     "id" INT NOT NULL IDENTITY(1, 1),
    "user_id" VARCHAR(255 char) DEFAULT '',
    "session_id" VARCHAR(200 char) DEFAULT NULL,
    "title" VARCHAR(200 char) DEFAULT '',
    "status" VARCHAR(255 char) DEFAULT '',
    "favorite_id" VARCHAR(255 char) DEFAULT '',
    "favorite_at" datetime(0) DEFAULT NULL,
    "chat_at" datetime(0) DEFAULT NULL,
    "created_at" datetime(0) DEFAULT NULL,
    "updated_at" datetime(0) DEFAULT NULL,
    CLUSTER PRIMARY KEY ("id")
    );

CREATE INDEX IF NOT EXISTS t_chat_history_session_id ON t_chat_history("session_id");
CREATE INDEX IF NOT EXISTS t_chat_history_user_id ON t_chat_history("user_id");



CREATE TABLE if not exists "t_chat_history_detail" (
    "id" INT NOT NULL IDENTITY(1, 1),
    "session_id" VARCHAR(255 char) DEFAULT NULL,
    "qa_id" VARCHAR(255 char) DEFAULT '',
    "query" VARCHAR(255 char) DEFAULT '',
    "answer" CLOB DEFAULT NULL,
    "status" VARCHAR(255 char) DEFAULT '',
    "favorite_id" VARCHAR(255 char) DEFAULT NULL,
    "like_status" VARCHAR(255 char) DEFAULT '',
    "resource_required" text DEFAULT NULL,
    "created_at" datetime(0) DEFAULT NULL,
    "updated_at" datetime(0) DEFAULT NULL,
    CLUSTER PRIMARY KEY ("id")
    );

CREATE INDEX IF NOT EXISTS t_chat_history_detail_session_id ON t_chat_history_detail("session_id");
CREATE INDEX IF NOT EXISTS t_chat_history_detail_qa_id ON t_chat_history_detail("qa_id");
CREATE INDEX IF NOT EXISTS t_chat_history_detail_favorite_id ON t_chat_history_detail("favorite_id");



CREATE TABLE if not exists "t_assistant_config" (
    "id" INT NOT NULL IDENTITY(1, 1),
    "user_id" VARCHAR(100 char) NOT NULL,
    "type" VARCHAR(100 char) DEFAULT '',
    "config" text DEFAULT NULL,
    "created_at" date DEFAULT NULL,
    "updated_at" date DEFAULT NULL,
    CLUSTER PRIMARY KEY ("id")
    );
