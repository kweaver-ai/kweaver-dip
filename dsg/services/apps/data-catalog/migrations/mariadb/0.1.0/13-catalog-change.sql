USE af_data_catalog;
-- ALTER TABLE `t_data_catalog` ADD COLUMN IF NOT EXISTS  `draft_id` bigint(20) NOT NULL DEFAULT 0  COMMENT '草稿id' ;
-- ALTER TABLE `t_data_catalog_history` ADD COLUMN IF NOT EXISTS  `draft_id` bigint(20) NOT NULL DEFAULT 0  COMMENT '草稿id' ;
--
-- ALTER TABLE `t_data_catalog` MODIFY COLUMN IF EXISTS `data_classify` varchar(50) NOT NULL COMMENT '数据分级 标签';
-- ALTER TABLE `t_data_catalog_history` MODIFY COLUMN IF EXISTS `data_classify` varchar(50) NOT NULL COMMENT '数据分级 标签';
--
-- ALTER TABLE `t_data_catalog` DROP COLUMN IF  EXISTS   `deleted_at`;
-- ALTER TABLE `t_data_catalog` DROP COLUMN IF  EXISTS   `delete_uid`;
-- ALTER TABLE `t_data_catalog` DROP COLUMN IF  EXISTS   `delete_name`;
-- ALTER TABLE `t_data_catalog` DROP COLUMN IF  EXISTS   `updater_name`;
-- ALTER TABLE `t_data_catalog` DROP COLUMN IF  EXISTS   `creator_name`;
--
-- ALTER TABLE `t_data_catalog_history` DROP COLUMN IF  EXISTS   `deleted_at`;
-- ALTER TABLE `t_data_catalog_history` DROP COLUMN IF  EXISTS   `delete_uid`;
-- ALTER TABLE `t_data_catalog_history` DROP COLUMN IF  EXISTS   `delete_name`;
-- ALTER TABLE `t_data_catalog_history` DROP COLUMN IF  EXISTS   `updater_name`;
-- ALTER TABLE `t_data_catalog_history` DROP COLUMN IF  EXISTS   `creator_name`;


CREATE TABLE IF NOT EXISTS `t_data_catalog_resource` (
    `id` bigint(20) NOT NULL COMMENT '标识',
    `catalog_id` bigint(20) NOT NULL COMMENT '目录id',
    `resource_id` varchar(50) NOT NULL COMMENT '数据资源id',
    PRIMARY KEY (`id`),
    KEY `catalog_id_btr` (`catalog_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci  COMMENT='目录数据资源挂載表';

-- ALTER TABLE `t_data_catalog_column` DROP PRIMARY KEY;
-- ALTER TABLE `t_data_catalog_column` ADD COLUMN IF NOT EXISTS `primary_id` int(11)  NOT NULL AUTO_INCREMENT  COMMENT '主键id', ADD PRIMARY KEY （`primary_id`） ;
-- ALTER TABLE `t_data_catalog_column` ADD KEY `id_key` (`id`);
-- ALTER TABLE `t_data_catalog_column_history` ADD COLUMN IF NOT EXISTS `primary_id` int(11)  NOT NULL  COMMENT '主键id';