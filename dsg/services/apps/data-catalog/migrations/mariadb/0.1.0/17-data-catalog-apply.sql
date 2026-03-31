USE af_data_catalog;

CREATE TABLE IF NOT EXISTS `t_data_catalog_apply` (
    `id` bigint(20) NOT NULL COMMENT '主键',
    `catalog_id` bigint(20) NOT NULL COMMENT '目录id',
    `apply_num` INT(11) DEFAULT 0 COMMENT '申请量',
    `create_time` DATETIME(3) DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    primary key (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='数据资源申请明细';

-- 添加标签ID字段
-- ALTER TABLE t_info_resource_catalog  add column if not exists `label_ids`  varchar(150)  null  comment '标签ID';
