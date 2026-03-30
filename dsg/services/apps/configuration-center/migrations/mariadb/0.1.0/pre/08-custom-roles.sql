USE af_configuration;
-- ALTER TABLE af_configuration.app COLLATE=utf8mb4_unicode_ci;
-- ALTER TABLE af_configuration.app_history COLLATE=utf8mb4_unicode_ci;
-- DROP index if exists unique_index_id_delete_at on app;
-- DROP index if exists unique_index_id_delete_at on app_history;

-- 权限
CREATE TABLE IF NOT EXISTS `permissions` (
    `id`            CHAR(36)        NOT NULL,
    `created_at`    DATETIME(3)     NOT NULL,
    `updated_at`    DATETIME(3)     NOT NULL,
    `deleted_at`    DATETIME(3)     DEFAULT NULL,

    `name`      VARCHAR(128)    NOT NULL    COMMENT '名称',
    `description`   VARCHAR(300)    NULL    COMMENT '描述',
    `category`  VARCHAR(128)    NOT NULL    COMMENT '分类',
    PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='权限';

-- 权限资源，例如：
--   - 组织架构
--   - 用户信息
--   - 业务域
-- https://confluence.aishu.cn/x/zoCyDw
CREATE TABLE IF NOT EXISTS `permission_resources` (
    `id`            CHAR(36)        NOT NULL,

    `name`  VARCHAR(128)    NOT NULL    COMMENT '名称',
    `table` VARCHAR(128)    NOT NULL    COMMENT '表',
    `field` VARCHAR(128)    NOT NULL    COMMENT '字段',
    PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='权限资源';

-- 角色组
CREATE TABLE IF NOT EXISTS `role_groups` (
    `id`            CHAR(36)        NOT NULL,
    `created_at`    DATETIME(3)     NOT NULL,
    `updated_at`    DATETIME(3)     NOT NULL,
    `deleted_at`    DATETIME(3)     DEFAULT NULL,

    `name`          VARCHAR(128)    NOT NULL    COMMENT '名称',
    `description`   VARCHAR(300)    NOT NULL    COMMENT '描述',
    PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色组';

-- 权限、权限资源绑定
CREATE TABLE IF NOT EXISTS `permission_permission_resource_bindings` (
    `permission_id`             CHAR(36)        NOT NULL    COMMENT '权限 ID',
    `permission_resource_id`    CHAR(36)        NOT NULL    COMMENT '权限资源 ID',
    `action`                    VARCHAR(128)    NOT NULL    COMMENT '操作',
    PRIMARY KEY (`permission_id`, `permission_resource_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='权限、权限资源绑定';


-- 用户、权限绑定
CREATE TABLE IF NOT EXISTS `user_permission_bindings` (
    `id`            CHAR(36)    NOT NULL,
    `user_id`       CHAR(36)    NOT NULL    COMMENT '用户 ID',
    `permission_id` CHAR(36)    NOT NULL    COMMENT '权限 ID',
    PRIMARY KEY (`user_id`, `permission_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户、权限绑定';

-- 用户、角色绑定
CREATE TABLE IF NOT EXISTS `user_role_bindings` (
    `id`        CHAR(36)    NOT NULL,
    `user_id`   CHAR(36)    NOT NULL    COMMENT '用户 ID',
    `role_id`   CHAR(36)    NOT NULL    COMMENT '角色 ID',
    PRIMARY KEY (`user_id`, `role_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户、角色绑定';

-- 用户、角色组绑定
CREATE TABLE IF NOT EXISTS `user_role_group_bindings` (
    `id`            CHAR(36)    NOT NULL,
    `user_id`       CHAR(36)    NOT NULL    COMMENT '用户 ID',
    `role_group_id` CHAR(36)    NOT NULL    COMMENT '角色组 ID',
    PRIMARY KEY (`user_id`, `role_group_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户、角色组绑定';

-- 角色、权限绑定
CREATE TABLE IF NOT EXISTS `role_permission_bindings` (
    `id`            CHAR(36)    NOT NULL,
    `role_id`       CHAR(36)    NOT NULL    COMMENT '用户 ID',
    `permission_id` CHAR(36)    NOT NULL    COMMENT '权限 ID',
    PRIMARY KEY (`role_id`, `permission_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色、权限绑定';

-- 角色组、角色绑定
CREATE TABLE IF NOT EXISTS `role_group_role_bindings` (
    `id`            CHAR(36)    NOT NULL,
    `role_group_id` CHAR(36)    NOT NULL    COMMENT '角色组 ID',
    `role_id`       CHAR(36)    NOT NULL    COMMENT '角色 ID',
    PRIMARY KEY (`role_group_id`, `role_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色组、角色绑定';

-- ALTER TABLE `user`
--     ADD COLUMN IF NOT EXISTS `scope` varchar(64) NOT NULL DEFAULT 'CurrentDepartment' COMMENT '权限范围'
--     AFTER `login_name`;
-- ALTER TABLE `user` ADD COLUMN IF NOT EXISTS  `updated_by` varchar(36) DEFAULT NULL COMMENT '更新人ID';
-- ALTER TABLE `system_role` ADD COLUMN IF NOT EXISTS  `description` varchar(300) DEFAULT NULL COMMENT '描述';
-- ALTER TABLE `system_role` ADD COLUMN IF NOT EXISTS  `created_by` varchar(36) NOT NULL DEFAULT '266c6a42-6131-4d62-8f39-853e7093701c' COMMENT '创建人ID';
-- ALTER TABLE `system_role` ADD COLUMN IF NOT EXISTS  `updated_by` varchar(36) DEFAULT NULL COMMENT '更新人ID';
-- ALTER TABLE `system_role` ADD COLUMN IF NOT EXISTS  `updated_by` varchar(36) DEFAULT NULL COMMENT '更新人ID';
-- ALTER TABLE `system_role`
--     ADD COLUMN IF NOT EXISTS `type`     varchar(64) NOT NULL    COMMENT '类型'      AFTER   `icon`,
--     ADD COLUMN IF NOT EXISTS `scope`    varchar(63) NOT NULL    COMMENT '权限范围'  AFTER   `type`;
UPDATE `system_role` SET `type` = 'Internal', `scope` = 'All' WHERE `type` = '' AND `scope` = '';
UPDATE `user` SET `status` = '1' WHERE `id`='266c6a42-6131-4d62-8f39-853e7093701c';
INSERT INTO `system_role`(`id`,`name`,`color`,`icon`,`type`,`scope`,`system`,`created_at`,`updated_at`,`deleted_at`,`description`,`created_by`,`updated_by`)
SELECT '00008516-45b3-44c9-9188-ca656969e20f', '安全管理员', '#F25D5D', 'security-mgm',  'Internal','All','1', '2021-07-22 16:51:50.582', '2021-07-22 16:51:50.582', '0',null,'266c6a42-6131-4d62-8f39-853e7093701c','266c6a42-6131-4d62-8f39-853e7093701c'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `system_role` WHERE `id` = '00008516-45b3-44c9-9188-ca656969e20f' );

INSERT INTO `system_role`(`id`,`name`,`color`,`icon`,`type`,`scope`,`system`,`created_at`,`updated_at`,`deleted_at`,`description`,`created_by`,`updated_by`)
SELECT '00108516-45b3-44c9-9188-ca656969e20g', '门户管理员', '#6A81FF', 'protol-mgm',  'Internal','All','1', '2021-07-22 16:51:50.582', '2021-07-22 16:51:50.582', '0',null,'266c6a42-6131-4d62-8f39-853e7093701c','266c6a42-6131-4d62-8f39-853e7093701c'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `system_role` WHERE `id` = '00108516-45b3-44c9-9188-ca656969e20g' );

-- ALTER TABLE `system_role`  MODIFY COLUMN IF EXISTS `color` CHAR(8) DEFAULT NULL COMMENT '角色背景色';
UPDATE `system_role` SET `color` = '#6A81FF' WHERE `id` = '00108516-45b3-44c9-9188-ca656969e20g';