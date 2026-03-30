USE data_application_service;

CREATE TABLE  IF NOT EXISTS  `service_daily_record` (
  `f_id` BIGINT(20) NOT NULL COMMENT '主键，雪花算法',
  `service_id` VARCHAR(255) NOT NULL COMMENT '接口id',
  `service_name` VARCHAR(255) DEFAULT NULL COMMENT '接口名称',
  `service_department_id` VARCHAR(255) DEFAULT NULL COMMENT '部门id',
  `service_department_name` VARCHAR(255) DEFAULT NULL COMMENT '部门名称',
  `service_type` VARCHAR(20) DEFAULT NULL COMMENT '接口类型',
  `record_date` DATE NOT NULL COMMENT '记录日期',
  `success_count` INT(10) DEFAULT 0 COMMENT '成功调用次数',
  `fail_count` INT(10) DEFAULT 0 COMMENT '失败调用次数',
  `online_count` INT(10) DEFAULT 0 COMMENT '上线数量',
  `apply_count` INT(10) DEFAULT 0 COMMENT '申请数量',
  PRIMARY KEY (`f_id`),
  UNIQUE KEY `uniq_service_date` (`service_id`, `record_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='接口每日统计记录表';