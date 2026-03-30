USE af_data_catalog;

CREATE TABLE IF NOT EXISTS `t_data_interface_apply` (
    `id` bigint(20) NOT NULL COMMENT '主键',
    `interface_id` varchar(255) NOT NULL COMMENT '接口id',
    `apply_num` INT(11) DEFAULT 0 COMMENT '申请量',
    `biz_date` varchar(30) DEFAULT NULL COMMENT '数据时间',
    primary key (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='数据接口申请明细';


CREATE TABLE IF NOT EXISTS `t_data_interface_aggregate` (
    `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键',
    `interface_id` varchar(255) NOT NULL COMMENT '接口id',
    `apply_num` INT(11) DEFAULT 0 COMMENT '申请量',
    primary key (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='数据接口申请汇总表';
