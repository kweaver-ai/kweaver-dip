USE `af_configuration`;
-- ALTER TABLE `data_grade` ADD COLUMN IF NOT EXISTS `sensitive_attri` VARCHAR(20) DEFAULT NULL COMMENT '敏感属性预设';
-- ALTER TABLE `data_grade` ADD COLUMN IF NOT EXISTS `secret_attri` VARCHAR(20) DEFAULT NULL COMMENT '涉密属性预设';
-- ALTER TABLE `data_grade` ADD COLUMN IF NOT EXISTS `share_condition` VARCHAR(30) DEFAULT NULL COMMENT '共享条件：不共享，有条件共享，无条件共享';
-- ALTER TABLE `data_grade` ADD COLUMN IF NOT EXISTS `data_protection_query` BOOLEAN NOT NULL DEFAULT 0 COMMENT '数据保护查询开关';

-- ALTER TABLE `front_end_processors` ADD COLUMN IF NOT EXISTS `administrator_fax` VARCHAR(20) DEFAULT NULL COMMENT '技术联系人传真';
-- ALTER TABLE `front_end_processors` ADD COLUMN IF NOT EXISTS `administrator_email` VARCHAR(20) DEFAULT NULL COMMENT '技术联系人邮箱';
-- ALTER TABLE `front_end_processors` ADD COLUMN IF NOT EXISTS `deployment_area` VARCHAR(20) DEFAULT NULL COMMENT '部署区域, 1：外部数据中心区域，2：内部数据中心区域，3：业务数据库区域';
-- ALTER TABLE `front_end_processors` ADD COLUMN IF NOT EXISTS `deployment_system` VARCHAR(120) DEFAULT NULL COMMENT '运行业务系统';
-- ALTER TABLE `front_end_processors` ADD COLUMN IF NOT EXISTS `protection_level` VARCHAR(20) DEFAULT NULL COMMENT '业务系统保护级别';
-- ALTER TABLE `front_end_processors` ADD COLUMN IF NOT EXISTS `apply_type` VARCHAR(20) DEFAULT NULL COMMENT '申请类型, 1: 前置机申请，2：前置库申请';


-- 前置机列表
CREATE TABLE IF NOT EXISTS `front_end_item` (
    `id` char(36) NOT NULL COMMENT 'ID',
    `front_end_id` char(36) NOT NULL COMMENT '前置机 ID',
    `operator_system` varchar(128) DEFAULT NULL COMMENT '操作系统类型/版本',
    `computer_resource` varchar(128) DEFAULT NULL COMMENT '计算资源规格',
    `disk_space` int(11) DEFAULT NULL COMMENT '业务磁盘空间大小',
    `library_number` int(11) DEFAULT NULL COMMENT '前置库数量',
    `updated_at` varchar(30) DEFAULT NULL COMMENT '更新日期',
    `deleted_at` varchar(30) DEFAULT NULL,
    `created_at` varchar(30) DEFAULT NULL COMMENT '创建日期',
    `node_ip` varchar(100) DEFAULT NULL COMMENT '节点的IP',
    `node_port` int(11) DEFAULT NULL COMMENT '节点的端口',
    `node_name` varchar(100) DEFAULT NULL COMMENT '节点的名称',
    `administrator_name` varchar(100) DEFAULT NULL COMMENT '技术负责人姓名',
    `administrator_phone` varchar(100) DEFAULT NULL COMMENT '技术负责人电话',
    `status` varchar(200) DEFAULT NULL COMMENT 'Receipt 未签收，已使用：InUse，已回收：Reclaimed',
     PRIMARY KEY (`id`)
) COMMENT='前置机项目信息' COLLATE='utf8mb4_unicode_ci' ENGINE=InnoDB;

-- 前置库
CREATE TABLE IF NOT EXISTS `front_end_library` (
    `id` char(36) NOT NULL COMMENT 'ID',
    `front_end_id` char(36) NOT NULL COMMENT '前置机 ID',
    `type` char(36) DEFAULT NULL COMMENT '前置库类型',
    `name` char(36) DEFAULT NULL COMMENT '前置库名称',
    `username` char(36) DEFAULT NULL COMMENT '前置库用户名',
    `password` char(36) DEFAULT NULL COMMENT '前置库密码',
    `business_name` char(36) DEFAULT NULL COMMENT '对接业务名称',
    `comment` varchar(128) DEFAULT NULL COMMENT '前置库说明',
    `updated_at` varchar(100) DEFAULT NULL COMMENT '更新时间',
    `created_at` varchar(100) DEFAULT NULL,
    `deleted_at` varchar(30) DEFAULT NULL,
    `front_end_item_id` char(36) NOT NULL,
    `version` char(36) DEFAULT NULL,
    `update_time` varchar(100) DEFAULT NULL,
    PRIMARY KEY (`id`,`front_end_id`,`front_end_item_id`)
) COMMENT='前置库信息' COLLATE='utf8mb4_unicode_ci' ENGINE=InnoDB;





