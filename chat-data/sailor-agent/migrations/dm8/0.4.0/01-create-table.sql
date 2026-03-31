SET SCHEMA af_cognitive_assistant;

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
