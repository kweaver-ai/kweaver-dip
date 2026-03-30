use data_application_service;

-- 为接口服务表(service)添加字段
-- 添加来源类型字段
-- ALTER TABLE `service` ADD COLUMN IF NOT EXISTS `source_type` TINYINT NOT NULL DEFAULT '0' COMMENT '来源类型（0原生，1迁移）' AFTER `pre_path`;