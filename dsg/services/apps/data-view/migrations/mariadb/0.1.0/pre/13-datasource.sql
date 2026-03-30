use af_main;
-- 为datasource表添加hua_ao_id字段
-- ALTER TABLE `datasource` ADD COLUMN IF NOT EXISTS `hua_ao_id` VARCHAR(128) DEFAULT NULL COMMENT '华傲（第三方）ID';

-- 为hua_ao_id字段添加索引以提升查询性能
-- ALTER TABLE `datasource` ADD INDEX IF NOT EXISTS `idx_datasource_hua_ao_id` (`hua_ao_id`);

UPDATE af_main.datasource a
INNER JOIN af_configuration.datasource b ON a.id = b.id
SET a.source_type = b.source_type
WHERE a.source_type != b.source_type OR (a.source_type IS NULL AND b.source_type IS NOT NULL);

UPDATE af_main.datasource a
INNER JOIN af_configuration.datasource b ON a.id = b.id
SET a.hua_ao_id = b.hua_ao_id 
WHERE 1 = 1;