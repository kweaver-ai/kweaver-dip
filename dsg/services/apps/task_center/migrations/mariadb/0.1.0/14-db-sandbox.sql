USE af_tasks;

-- alter table af_tasks.`tc_member` add column if not exists `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) COMMENT '创建时间';

create table if not EXISTS `db_sandbox`(
    `sid`    bigint(20) unsigned NOT NULL COMMENT '主键雪花ID',
    `id`   char(36)  NOT NULL COMMENT '主键雪UUID',
    `department_id` char(36)  NOT NULL COMMENT '所属部门ID',
    `department_name` varchar(128)  default '' COMMENT '所属部门名称',
    `status` int(4) NOT NULL default 0 COMMENT '状态，0不可用，1可用',
    `project_id` varchar(128) NOT NULL COMMENT '项目ID',
    -- 沙箱信息
    `total_space` int(11) NULL default 0  COMMENT '总的沙箱空间，单位GB',
    `valid_start` bigint(20)  DEFAULT 0 COMMENT '有效期开始时间，单位毫秒',
    `valid_end`   bigint(20)  DEFAULT 0 COMMENT '有效期结束时间，单位毫秒',
    `applicant_id`  varchar(36) DEFAULT NULL COMMENT '申请人ID',
    `applicant_name` varchar(255) DEFAULT NULL COMMENT '申请人名称',
    `applicant_phone` varchar(255) DEFAULT NULL COMMENT '申请人手机号',
    `executed_time`  datetime(3) DEFAULT NULL  COMMENT '第一次实施完成时间',
    -- 沙箱空间信息
    `datasource_id` char(36) NOT NULL COMMENT '数据源UUID',
    `datasource_name` varchar(128) NOT NULL COMMENT '数据源名称',
    `datasource_type_name` varchar(128) NOT NULL COMMENT '数据库类型名称',
    `database_name` varchar(128) NOT NULL COMMENT '数据库名称',
    `username` varchar(128) NOT NULL COMMENT '用户名',
    `password` varchar(1024) NOT NULL COMMENT '密码',
    `recent_data_set`  varchar(128) default '' COMMENT '用户名',
    -- 基础字段
    `updated_at` datetime NOT NULL DEFAULT current_timestamp()  COMMENT '更新时间',
    `updater_uid` varchar(36) DEFAULT NULL COMMENT '更新用户ID',
    `deleted_at`  bigint(20)   DEFAULT NULL COMMENT '删除时间(逻辑删除)' ,
    PRIMARY KEY (`id`) USING BTREE
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='数据沙箱空间';

CREATE TABLE IF NOT EXISTS `db_sandbox_apply` (
    `sid`  bigint(20) unsigned NOT NULL COMMENT '主键雪花ID',
    `id` char(36) NOT NULL COMMENT '主键，uuid',
    `sandbox_id`  varchar(36) NOT NULL COMMENT '沙箱ID',
    -- 申请信息
    `applicant_id`  varchar(36) DEFAULT NULL COMMENT '申请人ID',
    `applicant_name` varchar(255) DEFAULT NULL COMMENT '申请人名称',
    `applicant_phone` varchar(255) DEFAULT NULL COMMENT '申请人手机号',
    `request_space` int(11) NULL default 0  COMMENT '申请容量，单位GB',
    `status`  int(4) NOT NULL default 0 COMMENT '状态 1申请中，2待实施，3已完成',
    `operation` int(4) NOT NULL  default 0 COMMENT '操作,1创建申请 2扩容申请',
    -- 审核字段
    `audit_state` int(4) NOT NULL default 0 COMMENT '审核状态 1审核中，2审核通过 3未通过',
    `audit_id`    varchar(64) DEFAULT '' COMMENT '审核流程ID',
    `audit_advice` text NULL COMMENT '审核意见，仅驳回时有值',
    `proc_def_key` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '审核流程key',
    -- 操作结果
    `result` int(4) NOT NULL default 0 COMMENT '申请结果,1通过 2拒绝 3撤回',
    `reason` varchar(1024) DEFAULT NULL COMMENT '申请原因',
    `apply_time` datetime(3) NOT NULL DEFAULT current_timestamp(3) COMMENT '操作时间',
    -- 基础字段
    `updated_at` datetime NOT NULL DEFAULT current_timestamp()  COMMENT '更新时间',
    `updater_uid` varchar(36) DEFAULT NULL COMMENT '更新用户ID',
    `deleted_at`  bigint(20)   DEFAULT NULL COMMENT '删除时间(逻辑删除)' ,
    PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='沙箱空间申请';

create table if not EXISTS `db_sandbox_execution`(
    `sid` bigint(20) unsigned NOT NULL COMMENT '主键雪花ID',
    `id`  char(36) NOT NULL COMMENT '主键，uuid',
    `sandbox_id`   varchar(36) NOT NULL COMMENT '沙箱ID',
    `apply_id`   varchar(36)  NOT NULL COMMENT '申请ID',
    `description` varchar(1024) NOT NULL COMMENT '实施说明',
    -- 实施信息
    `execute_type`  int(4) NOT NULL default 0 COMMENT '实施方式,1线下 2线上',
    `execute_status`  int(4) NOT NULL default 0 COMMENT '实施阶段,1待实施，2实施中，3已实施',
    `executor_id`  varchar(36) DEFAULT NULL COMMENT '实施人ID',
    `executor_name` varchar(255) DEFAULT NULL COMMENT '实施人名称',
    `executor_phone` varchar(255) DEFAULT NULL COMMENT '实施人手机号',
    `executed_time`  datetime(3) DEFAULT NULL  COMMENT '实施完成时间' ,
    -- 基础字段
    `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) COMMENT '创建时间' ,
    `creator_uid` varchar(36) DEFAULT NULL COMMENT '创建用户ID',
    `updated_at` datetime NOT NULL DEFAULT current_timestamp()  COMMENT '更新时间',
    `updater_uid` varchar(36) DEFAULT NULL COMMENT '更新用户ID',
    `deleted_at`  bigint(20)   DEFAULT NULL COMMENT '删除时间(逻辑删除)' ,
    PRIMARY KEY (`id`) USING BTREE
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='数据沙箱实施';

create table if not EXISTS `db_sandbox_log`(
    `sid` bigint(20) unsigned NOT NULL COMMENT '主键雪花ID',
    `id`  char(36) NOT NULL COMMENT '主键，uuid',
    `apply_id`   varchar(36) NOT NULL COMMENT '申请ID',
    `execute_step`  int(4) NOT NULL default 0 COMMENT '操作步骤,1申请�?扩容�?审核�?实施�?完成',
    `executor_id`  varchar(36) DEFAULT NULL COMMENT '实施人ID',
    `executor_name` varchar(255) DEFAULT NULL COMMENT '实施人名称',
    `execute_time`  datetime(0) NOT NULL DEFAULT current_timestamp() COMMENT '操作时间' ,
    PRIMARY KEY (`id`) USING BTREE
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='数据实施操作日志';
