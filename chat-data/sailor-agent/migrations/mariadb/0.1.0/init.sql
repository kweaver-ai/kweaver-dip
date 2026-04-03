USE af_cognitive_assistant;


CREATE TABLE IF NOT EXISTS `t_agent` (
    `agent_id` bigint(20) NOT NULL COMMENT 'af 智能体id',
    `id` varchar(100) NOT NULL COMMENT '智能体id',
    `adp_agent_key` varchar(100) NOT NULL COMMENT 'adp 智能体key',
    `category_ids` varchar(180) NULL COMMENT '分类ID列表，逗号分隔',
    `deleted_at` bigint(20) NOT NULL DEFAULT 0 COMMENT '是否删除',
    `created_at` datetime NOT NULL,
    `updated_at` datetime NOT NULL,
    PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE  if not exists `t_system_config` (
                                   `f_id` bigint(20) NOT NULL COMMENT '配置id,雪花',
                                   `f_config_key` VARCHAR(25) NOT NULL COMMENT '配置键',
                                   `f_config_value`  VARCHAR(50) NOT NULL COMMENT '配置值',
                                   `f_config_group` VARCHAR(50) NOT NULL COMMENT '配置分组',
                                   `f_config_group_type` TINYINT(2) NOT NULL default 0 COMMENT '配置分组类型0问数分类',
                                   `f_config_desc` VARCHAR(255)  NULL COMMENT '配置描述',
                                   `f_created_at` DATETIME NOT NULL COMMENT '创建时间',
                                   `f_updated_at` DATETIME NOT NULL COMMENT '更新时间',
                                   `f_deleted_at` bigint(20) NOT NULL default 0 COMMENT '删除时间',
                                   `f_created_by` VARCHAR(50)  NULL COMMENT '创建人',
                                   `f_updated_by` VARCHAR(50)  NULL COMMENT '更新人',
                                   PRIMARY KEY (`f_id`),
                                   UNIQUE KEY `uk_system_config` (`f_config_key`,`f_deleted_at`)
) ENGINE=InnoDB  comment '问数配置表';

--
-- -- 初始化角色配置
-- INSERT INTO `t_system_config` (`f_id`, `f_config_key`, `f_config_value`, `f_config_group`, `f_config_group_type`, `f_config_desc`, `f_created_at`, `f_updated_at`, `f_deleted_at`, `f_created_by`, `f_updated_by`)
-- VALUES
--     (1, 'ROLE_TEACHER', '教师', '用户', 0, '教师角色', NOW(), NOW(), 0, 'system', 'system'),
--     (2, 'ROLE_ADMIN', '管理员', '用户', 0, '管理员角色', NOW(), NOW(), 0, 'system', 'system');
--
-- -- 初始化组织级别配置
-- INSERT INTO `t_system_config` (`f_id`, `f_config_key`, `f_config_value`, `f_config_group`, `f_config_group_type`, `f_config_desc`, `f_created_at`, `f_updated_at`, `f_deleted_at`, `f_created_by`, `f_updated_by`)
-- VALUES
--     (3, 'ORG_LEVEL_2', '总部', '机构', 0, '总部级别', NOW(), NOW(), 0, 'system', 'system'),
--     (4, 'ORG_LEVEL_3', '分部', '机构', 0, '分部级别', NOW(), NOW(), 0, 'system', 'system'),
--     (5, 'ORG_LEVEL_4', '分校', '机构', 0, '分校级别', NOW(), NOW(), 0, 'system', 'system'),
--     (6, 'ORG_LEVEL_5', '学习中心', '机构', 0, '学习中心级别', NOW(), NOW(), 0, 'system', 'system');
--
-- -- 初始化业务场景配置
-- INSERT INTO `t_system_config` (`f_id`, `f_config_key`, `f_config_value`, `f_config_group`, `f_config_group_type`, `f_config_desc`, `f_created_at`, `f_updated_at`, `f_deleted_at`, `f_created_by`, `f_updated_by`)
-- VALUES
--     (7, 'BUSINESS_ENROLLED', '在籍', '招生', 0, '在籍业务场景', NOW(), NOW(), 0, 'system', 'system'),
--     (8, 'BUSINESS_GRADUATION', '毕业', '招生', 0, '毕业业务场景', NOW(), NOW(), 0, 'system', 'system'),
--     (9, 'BUSINESS_COURSE', '课程', '招生', 0, '课程业务场景', NOW(), NOW(), 0, 'system', 'system'),
--     (10, 'BUSINESS_TEST', '测验', '招生', 0, '测验业务场景', NOW(), NOW(), 0, 'system', 'system'),
--     (11, 'BUSINESS_POST', '发帖', '招生', 0, '发帖业务场景', NOW(), NOW(), 0, 'system', 'system');
--
-- -- 初始化权限范围配置
-- INSERT INTO `t_system_config` (`f_id`, `f_config_key`, `f_config_value`, `f_config_group`, `f_config_group_type`, `f_config_desc`, `f_created_at`, `f_updated_at`, `f_deleted_at`, `f_created_by`, `f_updated_by`)
-- VALUES
--     (15, 'PERMISSION_SCOPE_ORG', '机构', '粒度', 0, '机构权限范围', NOW(), NOW(), 0, 'system', 'system'),
--     (16, 'PERMISSION_SCOPE_PERSONAL', '个人', '粒度', 0, '个人权限范围', NOW(), NOW(), 0, 'system', 'system');
