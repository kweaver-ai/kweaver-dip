USE af_data_catalog;
-- ALTER TABLE `t_data_catalog` ADD COLUMN IF NOT EXISTS `column_unshared` tinyint(2) NOT NULL COMMENT '信息项不予共享';
-- ALTER TABLE `t_data_catalog_history` ADD COLUMN IF NOT EXISTS `column_unshared` tinyint(2) NOT NULL COMMENT '信息项不予共享';

UPDATE t_data_catalog  set column_unshared=1 WHERE id in (SELECT DISTINCT catalog_id FROM t_data_catalog_column where shared_type=3);
