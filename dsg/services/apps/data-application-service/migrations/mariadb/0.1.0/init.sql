USE data_application_service;

CREATE TABLE IF NOT EXISTS `app`
(
    `id`          bigint(20) NOT NULL COMMENT '主键',
    `uid`         varchar(50)         NOT NULL DEFAULT '' COMMENT '用户id',
    `app_id`      varchar(255)        NOT NULL DEFAULT '' COMMENT 'AppId',
    `app_secret`  varchar(255)        NOT NULL DEFAULT '' COMMENT 'AppSecret',
    `create_time` datetime            NOT NULL DEFAULT current_timestamp() COMMENT '创建时间',
    `update_time` datetime            NOT NULL DEFAULT current_timestamp()  COMMENT '更新时间',
    KEY `uid` (`uid`),
    PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4  COLLATE utf8mb4_unicode_ci  COMMENT ='用户应用表';

CREATE TABLE IF NOT EXISTS `audit_process_bind`
(
    `id`           bigint(20) NOT NULL COMMENT '主键',
    `bind_id`      varchar(255)        NOT NULL DEFAULT '' COMMENT '绑定id',
    `audit_type`   varchar(50) NOT NULL COMMENT '审核类型 af-data-application-publish 发布审核 af-data-application-change 变更审核 af-data-application-online 上线审核 af-data-application-offline 下线审核 af-data-application-request 调用审核',
    `proc_def_key` varchar(128)        NOT NULL DEFAULT '' COMMENT '审核流程key',
    `create_time`  datetime            NOT NULL DEFAULT current_timestamp() COMMENT '创建时间',
    `update_time`  datetime            NOT NULL DEFAULT current_timestamp()  COMMENT '更新时间',
    UNIQUE KEY `audit_type` (`audit_type`),
    KEY `bind_id` (`bind_id`),
    PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4  COLLATE utf8mb4_unicode_ci  COMMENT ='审核流程绑定记录表';

CREATE TABLE IF NOT EXISTS `developer`
(
    `id`             bigint(20) NOT NULL COMMENT '主键',
    `developer_id`   varchar(255)        NOT NULL DEFAULT '' COMMENT '开发商id',
    `developer_name` varchar(255)        NOT NULL DEFAULT '' COMMENT '开发商名称',
    `contact_person` varchar(255)        NOT NULL DEFAULT '' COMMENT '联系人',
    `contact_info`   varchar(255)        NOT NULL DEFAULT '' COMMENT '联系方式',
    `create_time`    datetime            NOT NULL DEFAULT current_timestamp() COMMENT '创建时间',
    `update_time`    datetime            NOT NULL DEFAULT current_timestamp()  COMMENT '更新时间',
    `delete_time`    bigint(20) NOT NULL DEFAULT 0 COMMENT '删除时间',

    KEY `developer_id` (`developer_id`),
    PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4  COLLATE utf8mb4_unicode_ci  COMMENT ='开发商表';

CREATE TABLE IF NOT EXISTS `file`
(
    `id`          bigint(20) NOT NULL COMMENT '主键',
    `file_id`     varchar(255)        NOT NULL DEFAULT '' COMMENT '文件id',
    `file_name`   varchar(255)        NOT NULL DEFAULT '' COMMENT '文件名称',
    `file_type`   varchar(255)        NOT NULL DEFAULT '' COMMENT '文件类型',
    `file_path`   varchar(255)        NOT NULL DEFAULT '' COMMENT '文件保存路径',
    `file_size`   bigint(20) NOT NULL DEFAULT 0 COMMENT '文件大小 单位字节',
    `file_hash`   varchar(255)        NOT NULL DEFAULT '' COMMENT '文件哈希值 md5',
    `create_time` datetime            NOT NULL DEFAULT current_timestamp() COMMENT '创建时间',
    `update_time` datetime            NOT NULL DEFAULT current_timestamp()  COMMENT '更新时间',
    `delete_time` bigint(20) NOT NULL DEFAULT 0 COMMENT '删除时间',

    KEY `file_id` (`file_id`),
    KEY `file_hash` (`file_hash`),
    PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4  COLLATE utf8mb4_unicode_ci  COMMENT ='文件表';

-- TODO: 合并 status, publish_status 为 status
CREATE TABLE IF NOT EXISTS `service`
(
    `id`                   bigint(20) NOT NULL COMMENT '主键',
    `service_name`         varchar(255)        NOT NULL DEFAULT '' COMMENT '接口名称',
    `service_id`           varchar(255)        NOT NULL DEFAULT '' COMMENT '接口ID',
    `service_code`         varchar(255)        NOT NULL DEFAULT '' COMMENT '接口编码',
    `service_path`         varchar(255)        NOT NULL DEFAULT '' COMMENT '接口路径',
    `status`               varchar(20)         NOT NULL DEFAULT 'notline' COMMENT '接口状态 未上线 notline、已上线 online、已下线offline、上线审核中up-auditing、下线审核中down-auditing、上线审核未通过up-reject、下线审核未通过down-reject',
    `publish_status`       varchar(20)         NOT NULL DEFAULT 'unpublished' COMMENT '发布状态 未发布unpublished 、发布审核中pub-auditing、已发布published、发布审核未通过pub-reject、变更审核中change-auditing、变更审核未通过change-reject',
    `audit_type`           varchar(50)         NOT NULL DEFAULT 'unpublished' COMMENT '审核类型 unpublished 未发布 af-data-application-publish 发布审核 af-data-application-change 变更审核 af-data-application-online上线审核 af-data-application-offline 下线审核',
    `audit_status`         varchar(20)         NOT NULL DEFAULT 'unpublished' COMMENT '审核状态 unpublished 未发布 auditing 审核中 pass 通过 reject 驳回',
    `apply_id`             varchar(255)        NOT NULL DEFAULT '' COMMENT '审核申请id',
    `proc_def_key`         varchar(128)        NOT NULL DEFAULT '' COMMENT '审核流程key',
    `audit_advice`        text   COMMENT '审核意见，仅驳回时有用',
    `online_audit_advice` text   COMMENT '上下线审核驳回意见',
    `backend_service_host` varchar(255)        NOT NULL DEFAULT '' COMMENT '后台服务域名/IP',
    `backend_service_path` varchar(255)        NOT NULL DEFAULT '' COMMENT '后台服务路径',
    `department_id`        varchar(255)        NOT NULL DEFAULT '' COMMENT '所属部门id',
    `department_name`     text   COMMENT '部门名称',
    `owner_id`            text   COMMENT '数据owner用户id',
    `owner_name`          text   COMMENT '数据owner用户名',
    `subject_domain_id`    varchar(255)        NOT NULL DEFAULT '' comment '主题域id',
    `subject_domain_name`  varchar(255)        NOT NULL DEFAULT '' comment '主题域名称',
    `create_model`         varchar(10)         NOT NULL DEFAULT '' COMMENT '创建模式 wizard 向导模式 script 脚本模式',
    `http_method`          varchar(10)         NOT NULL DEFAULT '' COMMENT '请求方式 post get',
    `return_type`          varchar(10)         NOT NULL DEFAULT '' COMMENT '返回类型 json',
    `protocol`             varchar(10)         NOT NULL DEFAULT '' COMMENT '协议 http',
    `file_id`              varchar(255)        NOT NULL DEFAULT '' COMMENT '接口文档id',
    `description`         text   COMMENT '接口说明',
    `developer_id`         varchar(255)        NOT NULL DEFAULT '' COMMENT '开发商id',
    `developer_name`       varchar(255)        NOT NULL DEFAULT '' COMMENT '开发商名称',
    `info_system_id`       VARCHAR(36)                     DEFAULT NULL COMMENT '信息系统id',
    `apps_id`              VARCHAR(36)                     DEFAULT NULL COMMENT '应用id',
    `sync_flag`            varchar(64)                  DEFAULT NULL COMMENT '同步标识(success、fail)',
    `sync_msg`             text                  DEFAULT NULL COMMENT '同步信息',
    `update_flag`          varchar(64)                  DEFAULT NULL COMMENT '更新标识(success、fail)',
    `update_msg`           text                  DEFAULT NULL COMMENT '更新信息',
    `paas_id`              varchar(255)                  DEFAULT NULL COMMENT '授权id',
    `pre_path`             varchar(255)                  DEFAULT NULL COMMENT '网关路径前缀',
    `source_type`          int             NOT NULL DEFAULT 0 COMMENT '来源类型（0原生，1迁移）',
    `rate_limiting`        int(10)    NOT NULL DEFAULT 0 COMMENT '调用频次 次/秒',
    `timeout`              int(10)    NOT NULL DEFAULT 0 COMMENT '超时时间 秒',
    `service_type`         varchar(20)         NOT NULL DEFAULT '' COMMENT '接口类型 service_generate 接口生成 service_register 接口注册',
    `flow_id`              varchar(50)         NOT NULL DEFAULT '' COMMENT '审核流程实例id',
    `flow_name`            varchar(200)        NOT NULL DEFAULT '' COMMENT '审核流程名称',
    `flow_node_id`         varchar(50)         NOT NULL DEFAULT '' COMMENT '当前所处审核流程结点id',
    `flow_node_name`       varchar(200)        NOT NULL DEFAULT '' COMMENT '当前所处审核流程结点名称',
    `changed_service_id`   char(36)                     DEFAULT NULL COMMENT '变更数据的service_id',
    `is_changed`           varchar(1)          NOT NULL DEFAULT '0' COMMENT '取值0或1，用来控制草稿版本，默认为0',
    `online_time`          datetime                     DEFAULT NULL COMMENT '上线时间',
    `publish_time`         datetime                     DEFAULT NULL COMMENT '发布时间',
    `create_time`          datetime            NOT NULL DEFAULT current_timestamp() COMMENT '创建时间',
    `created_by`           varchar(50)         NOT NULL DEFAULT '' COMMENT '接口创建者',
    `update_time`          datetime            NOT NULL DEFAULT current_timestamp()  COMMENT '更新时间',
    `update_by`            varchar(50)                  DEFAULT NULL COMMENT '接口更新者',
    `delete_time`          bigint(20) NOT NULL DEFAULT 0 COMMENT '删除时间',

    UNIQUE KEY `service_id` (`service_id`, `delete_time`),
    UNIQUE KEY `service_code` (`service_code`, `delete_time`),
    KEY `service_name` (`service_name`),
    KEY `status` (`status`),
    KEY `department_id` (`department_id`),
    KEY `subject_domain_id` (`subject_domain_id`),
    KEY `create_time` (`create_time`),
    KEY `audit_type` (`audit_type`),
    KEY `audit_status` (`audit_status`),
    KEY `apply_id` (`apply_id`),
    PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4  COLLATE utf8mb4_unicode_ci  COMMENT ='接口表';

CREATE TABLE IF NOT EXISTS `service_apply`
(
    `id`           bigint(20) NOT NULL COMMENT '主键',
    `uid`          varchar(50)         NOT NULL DEFAULT '' COMMENT '用户id',
    `service_id`   varchar(255)        NOT NULL DEFAULT '' COMMENT '接口ID',
    `apply_days`   int(10)    NOT NULL DEFAULT 0 COMMENT '申请天数',
    `apply_reason` varchar(800)        NOT NULL DEFAULT '' COMMENT '申请理由',
    `apply_id`     varchar(255)        NOT NULL DEFAULT '' COMMENT '申请id',
    `audit_type`   varchar(100)        NOT NULL DEFAULT '' COMMENT '审核类型 af-data-application-request 接口调用审核',
    `audit_status` varchar(20)         NOT NULL DEFAULT '' COMMENT '审核状态 auditing 审核中 pass 通过 reject 驳回',
    `flow_id`      varchar(50)         NOT NULL DEFAULT '' COMMENT '审批流程实例id',
    `proc_def_key` varchar(128)        NOT NULL DEFAULT '' COMMENT '审核流程key',
    `auth_time`    datetime                     DEFAULT NULL COMMENT '授权时间',
    `expired_time` datetime                     DEFAULT NULL COMMENT '过期时间',
    `create_time`  datetime            NOT NULL DEFAULT current_timestamp() COMMENT '创建时间',
    `update_time`  datetime            NOT NULL DEFAULT current_timestamp()  COMMENT '更新时间',

    UNIQUE KEY `apply` (`uid`, `service_id`, `apply_id`),
    KEY `audit_status` (`audit_status`),
    KEY `create_time` (`create_time`),
    PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4  COLLATE utf8mb4_unicode_ci  COMMENT ='接口调用申请记录';

CREATE TABLE IF NOT EXISTS `service_data_source`
(
    `id`               bigint(20) NOT NULL COMMENT '主键',
    `service_id`       varchar(255)        NOT NULL DEFAULT '' COMMENT '接口ID',
    `data_view_id`     varchar(255)        NOT NULL DEFAULT '' comment '数据视图Id',
    `data_view_name`   varchar(255)        NOT NULL DEFAULT '' comment '数据视图名称',
    `catalog_name`     varchar(255)        NOT NULL DEFAULT '' COMMENT '虚拟化引擎 catalog',
    `data_source_id`   varchar(255)        NOT NULL DEFAULT '' COMMENT '数据源id',
    `data_source_name` varchar(255)        NOT NULL DEFAULT '' COMMENT '数据源名称',
    `data_schema_id`   varchar(255)        NOT NULL DEFAULT '' COMMENT '库id（预留字段，暂无数据）',
    `data_schema_name` varchar(255)        NOT NULL DEFAULT '' COMMENT '库名',
    `data_table_id`    varchar(255)        NOT NULL DEFAULT '' COMMENT '表id（预留字段，暂无数据）',
    `data_table_name`  varchar(255)        NOT NULL DEFAULT '' COMMENT '表名',
    `create_time`      datetime            NOT NULL DEFAULT current_timestamp() COMMENT '创建时间',
    `update_time`      datetime            NOT NULL DEFAULT current_timestamp()  COMMENT '更新时间',
    `delete_time`      bigint(20) NOT NULL DEFAULT 0 COMMENT '删除时间',

    KEY `service_id` (`service_id`),
    KEY `data_view_id` (`data_view_id`),
    PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4  COLLATE utf8mb4_unicode_ci  COMMENT ='接口数据源表';

CREATE TABLE IF NOT EXISTS `service_gateway`
(
    `id`          bigint(20) NOT NULL COMMENT '主键',
    `gateway_url` varchar(255)        NOT NULL DEFAULT '' COMMENT '接口网关地址',
    `create_time` datetime            NOT NULL DEFAULT current_timestamp() COMMENT '创建时间',
    `update_time` datetime            NOT NULL DEFAULT current_timestamp()  COMMENT '更新时间',
    PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE utf8mb4_unicode_ci  COMMENT ='接口网关配置';

CREATE TABLE IF NOT EXISTS `service_param`
(
    `id`            bigint(20) NOT NULL COMMENT '主键',
    `service_id`    varchar(255)        NOT NULL DEFAULT '' COMMENT '接口ID',
    `param_type`    varchar(10)         NOT NULL DEFAULT '' COMMENT '参数类型 request 请求参数 response 返回参数',
    `cn_name`       varchar(255)        NOT NULL DEFAULT '' COMMENT '中文名称',
    `en_name`       varchar(255)        NOT NULL DEFAULT '' COMMENT '英文名称',
    `alias_name`    varchar(255)        NOT NULL DEFAULT '' COMMENT '别名',
    `description`   varchar(255)        NOT NULL DEFAULT '' COMMENT '描述',
    `data_type`     varchar(255)        NOT NULL DEFAULT '' COMMENT '数据类型',
    `required`      varchar(10)         NOT NULL DEFAULT '' COMMENT '是否必填 yes必填 no非必填',
    `operator`      varchar(10)         NOT NULL DEFAULT '' COMMENT '运算逻辑 = 等于, != 不等于, > 大于, >= 大于等于, < 小于, <= 小于等于, like 模糊匹配, in 包含, not in 不包含',
    `default_value` varchar(255)        NOT NULL DEFAULT '' COMMENT '默认值',
    `sequence`      int(10)    NOT NULL DEFAULT 0 COMMENT '序号',
    `sort`          varchar(10)         NOT NULL DEFAULT '' COMMENT '排序方式 unsorted 不排序 asc 升序 desc 降序 默认 unsorted',
    `masking`       varchar(10)         NOT NULL DEFAULT '' COMMENT '脱敏规则 plaintext 不脱敏 hash 哈希 override 覆盖 replace 替换 默认 plaintext',
    `create_time`   datetime            NOT NULL DEFAULT current_timestamp() COMMENT '创建时间',
    `update_time`   datetime            NOT NULL DEFAULT current_timestamp()  COMMENT '更新时间',
    `delete_time`   bigint(20) NOT NULL DEFAULT 0 COMMENT '删除时间',

    KEY `service_id` (`service_id`),
    PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4  COLLATE utf8mb4_unicode_ci COMMENT ='接口参数配置表';

CREATE TABLE IF NOT EXISTS `service_response_filter`
(
    `id`          bigint(20) NOT NULL COMMENT '主键',
    `service_id`  varchar(255)        NOT NULL DEFAULT '' COMMENT '接口ID',
    `param`       varchar(255)        NOT NULL DEFAULT '' COMMENT '返回结果过滤字段',
    `operator`    varchar(10)         NOT NULL DEFAULT '' COMMENT '运算逻辑 = 等于, != 不等于, > 大于, >= 大于等于, < 小于, <= 小于等于, like 模糊匹配, in 包含, not in 不包含',
    `value`       varchar(255)        NOT NULL DEFAULT '' COMMENT '返回结果过滤值 多个用逗号分隔',
    `create_time` datetime            NOT NULL DEFAULT current_timestamp() COMMENT '创建时间',
    `update_time` datetime            NOT NULL DEFAULT current_timestamp()  COMMENT '更新时间',
    `delete_time` bigint(20) NOT NULL DEFAULT 0 COMMENT '删除时间',

    KEY `service_id` (`service_id`),
    PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4  COLLATE utf8mb4_unicode_ci COMMENT ='接口返回结果过滤配置表';

CREATE TABLE IF NOT EXISTS `service_script_model`
(
    `id`               bigint(20) NOT NULL COMMENT '主键',
    `service_id`       varchar(255)        NOT NULL DEFAULT '' COMMENT '接口ID',
    `script`          text   COMMENT '查询语句',
    `page`             varchar(10)         NOT NULL DEFAULT '' COMMENT '是否分页 yes分页 no不分页',
    `page_size`        int(10)    NOT NULL DEFAULT 0 COMMENT '分页大小',
    `request_example` text   COMMENT '请求示例',
    `response_example`text   COMMENT '返回示例',
    `create_time`      datetime            NOT NULL DEFAULT current_timestamp() COMMENT '创建时间',
    `update_time`      datetime            NOT NULL DEFAULT current_timestamp()  COMMENT '更新时间',
    `delete_time`      bigint(20) NOT NULL DEFAULT 0 COMMENT '删除时间',

    UNIQUE KEY `service_id` (`delete_time`,`service_id`),
    PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE utf8mb4_unicode_ci  COMMENT ='接口脚本模型表';

CREATE TABLE IF NOT EXISTS `service_stats_info`
(
    `id`          bigint(20) NOT NULL COMMENT '主键',
    `service_id`  varchar(255)        NOT NULL DEFAULT '' COMMENT '接口ID',
    `apply_num`   bigint(20) NOT NULL DEFAULT 0 COMMENT '申请数',
    `preview_num` bigint(20) NOT NULL DEFAULT 0 COMMENT '预览数',
    `create_time` datetime            NOT NULL DEFAULT current_timestamp() COMMENT '创建时间',
    `update_time` datetime            NOT NULL DEFAULT current_timestamp()  COMMENT '更新时间',

    UNIQUE KEY `service_id` (`service_id`),
    PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4  COLLATE utf8mb4_unicode_ci COMMENT ='接口统计信息表';




CREATE TABLE IF NOT EXISTS  `cdc_task` (
    `database` varchar(255) NOT NULL COMMENT '同步库名',
    `table` varchar(255) NOT NULL COMMENT '同步表名',
    `columns` varchar(255) NOT NULL COMMENT '同步的列，多个列写在一起，用 , 隔开',
    `topic` varchar(255) NOT NULL COMMENT '数据变动投递消息的topic',
    `group_id` varchar(255) NOT NULL COMMENT '当前记录对应的group id',
    `id` varchar(255) NOT NULL COMMENT '当前同步记录id',
    `updated_at` datetime(3) NOT NULL COMMENT '当前同步记录时间',
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `service_daily_record` (
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

  UNIQUE KEY `uniq_service_date` (`service_id`, `record_date`),
    PRIMARY KEY (`f_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='接口每日统计记录表';


-- 子接口，接口限定规则
CREATE TABLE IF NOT EXISTS `sub_service` (
    `snowflake_id`  BIGINT        NOT NULL  COMMENT '雪花 ID，无业务意义',
    `id`            CHAR(36)      NOT NULL  COMMENT 'ID',
    `name`          VARCHAR(255)  NOT NULL  COMMENT '名称',
    `service_id`    CHAR(36)      NOT NULL  COMMENT '所属接口服务的ID',
    `auth_scope_id` CHAR(36)      NOT NULL  COMMENT '上层接口授权范围的ID',

    `row_filter_clause` TEXT          NOT NULL COMMENT '子接口的行过滤器子句',
    `detail`        BLOB          NOT NULL  COMMENT '行列规则，格式同下载任务的过滤条件',
    `created_at`    DATETIME(3)   NOT NULL  DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at`    DATETIME(3)   NOT NULL  DEFAULT CURRENT_TIMESTAMP(3) ,
    `deleted_at`    BIGINT        NOT NULL  DEFAULT 0,

    UNIQUE KEY                                                (`id`),
    KEY         `idx_sub_service_deleted_at`                  (`service_id`, `deleted_at`),
    PRIMARY KEY                                               (`snowflake_id`)
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='子接口，接口限定规则';

CREATE TABLE IF NOT EXISTS `service_category_relation` (
     `id` BIGINT(20) NOT NULL COMMENT '唯一id，雪花算法',
     `category_id` CHAR(36) NOT NULL COMMENT '类目id',
     `category_node_id` CHAR(36) NULL DEFAULT NULL COMMENT '类目节点id',
     `service_id` VARCHAR(255) NOT NULL COMMENT '接口服务id',
     `deleted_at` BIGINT(20) NOT NULL DEFAULT 0 COMMENT '逻辑删除时间戳',
     PRIMARY KEY (`id`)
) COMMENT='服务类目关系表';

CREATE TABLE IF NOT EXISTS `service_call_record` (
    `id` BIGINT(20) NOT NULL COMMENT '唯一id，雪花算法',
    `service_id` CHAR(36) NOT NULL COMMENT '接口uuid',
    `service_department_id` CHAR(36) NULL DEFAULT NULL COMMENT '服务方部门id',
    `service_system_id` CHAR(36) NULL DEFAULT NULL COMMENT '服务方信息系统id',
    `service_app_id` CHAR(36) NULL DEFAULT NULL COMMENT '服务方应用id',
    `remote_address` VARCHAR(255) NULL DEFAULT NULL COMMENT '调用方地址',
    `forward_for` VARCHAR(255) NULL DEFAULT NULL COMMENT 'HTTP请求参数X-Forward-For',
    `user_identification` VARCHAR(255) NULL DEFAULT NULL COMMENT '调用方身份标识',
    `call_department_id` CHAR(36) NULL DEFAULT NULL COMMENT '调用方部门id（非通用属性，可能会调整）',
    `call_info_system_id` CHAR(36) NULL DEFAULT NULL COMMENT '调用方信息系统id（非通用属性，可能会调整）',
    `call_app_id` CHAR(36) NULL DEFAULT NULL COMMENT '调用方应用id（非通用属性，可能会调整）',
    `call_start_time` DATETIME NOT NULL COMMENT '调用开始时间',
    `call_end_time` DATETIME NULL DEFAULT NULL COMMENT '调用结束时间',
    `call_http_code` INT(11) NULL DEFAULT NULL COMMENT '调用返回http状态码',
    `call_status` INT(11) NULL DEFAULT 0 COMMENT '调用状态：0失败，1成功',
    `error_message` TEXT NULL COMMENT '报错信息',
    `call_other_message` TEXT NULL COMMENT '其他调用信息（预留）',
    `record_time` DATETIME NULL DEFAULT NULL COMMENT '日志记录时间',
    KEY `idx_service_id` (`service_id`),
    PRIMARY KEY (`id`)
) COMMENT='接口调用记录表';

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


CREATE TABLE if not exists `service_authed_users` (
    `id` char(36) NOT NULL,
    `service_id` char(36) NOT NULL COMMENT '接口服务ID',
    `user_id` char(36) NOT NULL COMMENT '用户ID',
    PRIMARY KEY (`id`),
    KEY `service_authed_users_user_id_IDX` (`user_id`,`service_id`) USING BTREE,
    KEY `service_authed_users_service_id_IDX` (`service_id`,`user_id`) USING BTREE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='接口服务授权用户关系表';