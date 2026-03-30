use af_main;

-- 为datasource表添加deparement_id字段
-- ALTER TABLE `datasource` ADD COLUMN IF NOT EXISTS `department_id` char(36) DEFAULT NULL COMMENT '部门id';

UPDATE af_main.datasource a
    INNER JOIN af_configuration.datasource b ON a.id = b.id
    SET a.department_id = b.department_id
WHERE 1 = 1;