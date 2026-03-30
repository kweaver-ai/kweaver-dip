USE af_configuration;

CREATE TABLE IF NOT EXISTS `t_address_book` (
    `id` BIGINT NOT NULL COMMENT '唯一id，雪花算法',
    `name` VARCHAR(128)  NOT NULL COMMENT '人员名称',
    `department_id` char(36) DEFAULT NULL COMMENT '所属部门ID',
    `contact_phone` VARCHAR(20) NOT NULL COMMENT '手机号码',
    `contact_mail` VARCHAR(128) NULL DEFAULT NULL COMMENT '邮箱地址',
    `created_at` DATETIME(3) NOT NULL COMMENT '创建时间',
    `created_by` VARCHAR(36) NOT NULL COMMENT '创建用户ID',
    `updated_at` DATETIME(3) DEFAULT NULL  COMMENT '更新时间',
    `updated_by` VARCHAR(36) DEFAULT NULL COMMENT '更新用户ID',
    `deleted_at` DATETIME(3) DEFAULT NULL  COMMENT '删除时间',
    `deleted_by` VARCHAR(36) DEFAULT NULL COMMENT '删除用户ID',
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='通讯录人员信息记录表';

CREATE TABLE IF NOT EXISTS `t_object_subtype` (
    `id` char(36) NOT NULL COMMENT '对象ID',
    `subtype` tinyint(4) DEFAULT NULL COMMENT '子类型',
    `created_at` DATETIME(3) NOT NULL COMMENT '创建时间',
    `created_by` VARCHAR(36) NOT NULL COMMENT '创建用户ID',
    `updated_at` DATETIME(3) DEFAULT NULL  COMMENT '更新时间',
    `updated_by` VARCHAR(36) DEFAULT NULL COMMENT '更新用户ID',
    `deleted_at` DATETIME(3) DEFAULT NULL  COMMENT '删除时间',
    `deleted_by` VARCHAR(36) DEFAULT NULL COMMENT '删除用户ID',
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='对象类型表';

CREATE TABLE IF NOT EXISTS `t_object_main_business` (
  `id` BIGINT NOT NULL COMMENT '唯一id，雪花算法',
  `object_id` char(36) NOT NULL COMMENT '对象ID',
  `name` VARCHAR(128)  NOT NULL COMMENT '主干业务名称',
  `abbreviation_name` VARCHAR(128)  NOT NULL COMMENT '主干业务简称',
  `created_at` DATETIME(3) NOT NULL COMMENT '创建时间',
  `created_by` VARCHAR(36) NOT NULL COMMENT '创建用户ID',
  `updated_at` DATETIME(3) DEFAULT NULL  COMMENT '更新时间',
  `updated_by` VARCHAR(36) DEFAULT NULL COMMENT '更新用户ID',
  `deleted_at` DATETIME(3) DEFAULT NULL  COMMENT '删除时间',
  `deleted_by` VARCHAR(36) DEFAULT NULL COMMENT '删除用户ID',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='对象主干业务表';


CREATE TABLE IF NOT EXISTS `t_alarm_rule` (
    `id` BIGINT NOT NULL COMMENT '唯一id，雪花算法',
    `type` VARCHAR(255)  NOT NULL COMMENT '规则类型',
    `deadline_time` BIGINT NOT NULL COMMENT '截止告警时间',
    `deadline_reminder` VARCHAR(36) NOT NULL COMMENT '截止告警内容',
    `beforehand_time` BIGINT NOT NULL COMMENT '提前告警时间',
    `beforehand_reminder` VARCHAR(36) NOT NULL COMMENT '提前告警内容',
    `updated_at` DATETIME(3) DEFAULT NULL  COMMENT '更新时间',
    `updated_by` VARCHAR(36) DEFAULT NULL COMMENT '更新用户ID',
    PRIMARY KEY (`id`),
    UNIQUE KEY t_alarm_rule_type (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='告警规则记录表';

INSERT INTO `t_alarm_rule` (`id`,`type`,`deadline_time`,`deadline_reminder`,`beforehand_time`,`beforehand_reminder`, `updated_at`, `updated_by`)
select 1, 'data_quality', 30, '【工单名称(工单编号)】 已到截止时间，请及时处理！', 5, '【工单名称(工单编号)】 距离截止日期仅剩 X 天，请及时处理！', '2025-03-21 17:33:00.000', '266c6a42-6131-4d62-8f39-853e7093701c'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `t_alarm_rule` WHERE `id` = 1 and `type`='data_quality');