
USE data_application_service;



-- 子接口，接口限定规则
CREATE TABLE IF NOT EXISTS `sub_service` (
    `snowflake_id`  BIGINT        NOT NULL  COMMENT '雪花 ID，无业务意义',
    `id`            CHAR(36)      NOT NULL  COMMENT 'ID',
    `name`          VARCHAR(255)  NOT NULL  COMMENT '名称',
    `service_id`    CHAR(36)      NOT NULL  COMMENT '所属接口服务的ID',
    `auth_scope_id` CHAR(36)      NOT NULL  COMMENT '上层接口授权范围的ID',

    `row_filter_clause` TEXT          NOT NULL COMMENT '子接口的行过滤器子句',
    `detail`        BLOB          NOT NULL  COMMENT '行列规则，格式同下载任务的过滤条件',
    `created_at`    DATETIME(3)   NOT NULL  DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at`    DATETIME(3)   NOT NULL  DEFAULT CURRENT_TIMESTAMP(3) ,
    `deleted_at`    BIGINT        NOT NULL  DEFAULT 0,

    PRIMARY KEY                                               (`snowflake_id`),
    UNIQUE KEY                                                (`id`),
    KEY         `idx_sub_service_deleted_at`                  (`service_id`, `deleted_at`)
    )ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='子接口，接口限定规则';


CREATE TABLE if not exists `service_authed_users` (
    `id` char(36) NOT NULL,
    `service_id` char(36) NOT NULL COMMENT '接口服务ID',
    `user_id` char(36) NOT NULL COMMENT '用户ID',
    PRIMARY KEY (`id`),
    KEY `service_authed_users_user_id_IDX` (`user_id`,`service_id`) USING BTREE,
    KEY `service_authed_users_service_id_IDX` (`service_id`,`user_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='接口服务授权用户关系表';