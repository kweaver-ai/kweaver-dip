USE data_application_service;

CREATE TABLE IF NOT EXISTS `service_call_record` (
    `id` BIGINT(20) NOT NULL COMMENT '唯一id，雪花算法',
    `service_id` CHAR(36) NOT NULL COMMENT '接口uuid',
    `service_department_id` CHAR(36) NULL DEFAULT NULL COMMENT '服务方部门id',
    `service_system_id` CHAR(36) NULL DEFAULT NULL COMMENT '服务方信息系统id',
    `service_app_id` CHAR(36) NULL DEFAULT NULL COMMENT '服务方应用id',
    `remote_address` VARCHAR(255) NULL DEFAULT NULL COMMENT '调用方地址',
    `forward_for` VARCHAR(255) NULL DEFAULT NULL COMMENT 'HTTP请求参数X-Forward-For',
    `user_identification` VARCHAR(255) NULL DEFAULT NULL COMMENT '调用方身份标识',
    `call_department_id` CHAR(36) NULL DEFAULT NULL COMMENT '调用方部门id（非通用属性，可能会调整）',
    `call_info_system_id` CHAR(36) NULL DEFAULT NULL COMMENT '调用方信息系统id（非通用属性，可能会调整）',
    `call_app_id` CHAR(36) NULL DEFAULT NULL COMMENT '调用方应用id（非通用属性，可能会调整）',
    `call_start_time` DATETIME NOT NULL COMMENT '调用开始时间',
    `call_end_time` DATETIME NULL DEFAULT NULL COMMENT '调用结束时间',
    `call_http_code` INT(11) NULL DEFAULT NULL COMMENT '调用返回http状态码',
    `call_status` INT(11) NULL DEFAULT 0 COMMENT '调用状态：0失败，1成功',
    `error_message` TEXT NULL COMMENT '报错信息',
    `call_other_message` TEXT NULL COMMENT '其他调用信息（预留）',
    `record_time` DATETIME NULL DEFAULT NULL COMMENT '日志记录时间',
    PRIMARY KEY (`id`),
    key `idx_service_id` (`service_id`)
) COMMENT='接口调用记录表';