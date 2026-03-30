USE data_application_service;

CREATE TABLE IF NOT EXISTS gateway_collection_log (
    id INT AUTO_INCREMENT,
    collect_time DATETIME COMMENT '采集时间-每日',
    svc_id VARCHAR(50) NOT NULL COMMENT '服务ID',
    svc_name VARCHAR(50) NOT NULL COMMENT '服务名称',
    svc_belong_dept_id VARCHAR(50) COMMENT '服务所属部门名称',
    svc_belong_dept_name VARCHAR(100) COMMENT '服务所属部门ID',
    invoke_svc_dept_id VARCHAR(50) COMMENT '调用服务所属部门ID',
    invoke_svc_dept_name VARCHAR(100) COMMENT '调用服务所属部门名称',
    invoke_system_id VARCHAR(50) COMMENT '调用服务所属服务ID',
    invoke_app_id VARCHAR(50) COMMENT '调用服务所属应用ID',
    invoke_ip_port VARCHAR(50) COMMENT '调用服务IP及端口',
    invoke_num int COMMENT '调用次数',
    invoke_average_call_duration int COMMENT '平均调用时长',
    PRIMARY KEY (`id`)
) COMMENT='第三方网关采集日志表';