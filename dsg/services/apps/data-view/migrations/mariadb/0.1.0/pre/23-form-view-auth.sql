USE af_main;

-- ALTER TABLE `sub_views`  ADD COLUMN if not exists auth_scope_id char(36) DEFAULT NULL COMMENT '行列规则限定范围，可以能是行列规则ID，可能是视图ID';


CREATE TABLE if not exists `view_authed_users` (
    `id` char(36) NOT NULL,
    `view_id` char(36) NOT NULL COMMENT '视图ID',
    `user_id` char(36) NOT NULL COMMENT '用户ID',
    PRIMARY KEY (`id`),
    KEY `view_authed_users_user_id_IDX` (`user_id`,`view_id`) USING BTREE,
    KEY `view_authed_users_view_id_IDX` (`view_id`,`user_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='视图授权用户关系表';