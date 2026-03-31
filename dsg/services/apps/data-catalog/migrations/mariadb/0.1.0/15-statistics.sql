USE af_data_catalog;

CREATE TABLE IF NOT EXISTS `statistics_overview` (
     `id` char(38)  COMMENT '主键ID',
    `total_data_count` bigint(20) NOT NULL DEFAULT 0 COMMENT '数据总量',
    `total_table_count` bigint(20) NOT NULL DEFAULT 0 COMMENT '库表总量',
    `service_usage_count` bigint(20) NOT NULL DEFAULT 0 COMMENT '服务使用次数',
    `shared_data_count` bigint(20) NOT NULL DEFAULT 0 COMMENT '共享数据总量',
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP  COMMENT '更新时间',
    primary key (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='统计概览表';



CREATE TABLE IF NOT EXISTS `statistics_service` (
     `id` char(38) COMMENT '主键',
    `type` TINYINT NOT NULL COMMENT '类型（1: 目录, 2: 接口）',
    `quantity` int DEFAULT 0 COMMENT '上线量/申请量',
    `business_time` varchar(20)  COMMENT '日期：年-月',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `week` INT COMMENT '周数',
    `catalog` varchar(20) COMMENT '类别：1 资源申请量  2 资源上线量',
    primary key (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='统计服务榜单';


CREATE TABLE IF NOT EXISTS `t_data_catalog_apply` (
    `id` bigint(20) NOT NULL COMMENT '主键',
    `catalog_id` bigint(20) NOT NULL COMMENT '目录id',
    `apply_num` INT(11) DEFAULT 0 COMMENT '申请量',
    `create_time` DATETIME(3) DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    primary key (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='数据资源申请明细';


INSERT INTO af_data_catalog.statistics_overview
(id, total_data_count, total_table_count, service_usage_count, shared_data_count, update_time)
VALUES('1', 100, 200, 300, 400, '2024-11-22 12:11:12');

INSERT INTO af_data_catalog.statistics_service
(id, `type`, quantity, business_time, create_time, week, `catalog`)
VALUES('1', 1, 100, '2025-02', '2025-05-26 17:26:40', 4, '1');
INSERT INTO af_data_catalog.statistics_service
(id, `type`, quantity, business_time, create_time, week, `catalog`)
VALUES('10', 1, 200, '2025-03', '2025-05-28 15:02:07', 1, '2');
INSERT INTO af_data_catalog.statistics_service
(id, `type`, quantity, business_time, create_time, week, `catalog`)
VALUES('11', 1, 300, '2025-03', '2025-05-28 15:02:07', 2, '2');
INSERT INTO af_data_catalog.statistics_service
(id, `type`, quantity, business_time, create_time, week, `catalog`)
VALUES('12', 1, 400, '2025-03', '2025-05-28 15:02:07', 3, '2');
INSERT INTO af_data_catalog.statistics_service
(id, `type`, quantity, business_time, create_time, week, `catalog`)
VALUES('13', 2, 101, '2025-02', '2025-05-28 17:45:51', 4, '2');
INSERT INTO af_data_catalog.statistics_service
(id, `type`, quantity, business_time, create_time, week, `catalog`)
VALUES('14', 2, 201, '2025-03', '2025-05-28 17:45:51', 3, '2');
INSERT INTO af_data_catalog.statistics_service
(id, `type`, quantity, business_time, create_time, week, `catalog`)
VALUES('15', 2, 301, '2025-03', '2025-05-28 17:45:51', 2, '2');
INSERT INTO af_data_catalog.statistics_service
(id, `type`, quantity, business_time, create_time, week, `catalog`)
VALUES('16', 2, 401, '2025-03', '2025-05-28 17:45:51', 1, '2');
INSERT INTO af_data_catalog.statistics_service
(id, `type`, quantity, business_time, create_time, week, `catalog`)
VALUES('2', 1, 200, '2025-03', '2025-05-27 10:19:37', 1, '1');
INSERT INTO af_data_catalog.statistics_service
(id, `type`, quantity, business_time, create_time, week, `catalog`)
VALUES('3', 1, 300, '2025-03', '2025-05-27 10:22:02', 2, '1');
INSERT INTO af_data_catalog.statistics_service
(id, `type`, quantity, business_time, create_time, week, `catalog`)
VALUES('4', 1, 400, '2025-03', '2025-05-27 10:22:02', 3, '1');
INSERT INTO af_data_catalog.statistics_service
(id, `type`, quantity, business_time, create_time, week, `catalog`)
VALUES('5', 2, 102, '2025-02', '2025-05-27 10:22:02', 4, '1');
INSERT INTO af_data_catalog.statistics_service
(id, `type`, quantity, business_time, create_time, week, `catalog`)
VALUES('6', 2, 202, '2025-03', '2025-05-27 10:22:02', 1, '1');
INSERT INTO af_data_catalog.statistics_service
(id, `type`, quantity, business_time, create_time, week, `catalog`)
VALUES('7', 2, 302, '2025-03', '2025-05-27 10:22:02', 2, '1');
INSERT INTO af_data_catalog.statistics_service
(id, `type`, quantity, business_time, create_time, week, `catalog`)
VALUES('8', 2, 402, '2025-03', '2025-05-27 10:22:02', 3, '1');
INSERT INTO af_data_catalog.statistics_service
(id, `type`, quantity, business_time, create_time, week, `catalog`)
VALUES('9', 1, 100, '2025-02', '2025-05-28 15:02:07', 4, '2');

