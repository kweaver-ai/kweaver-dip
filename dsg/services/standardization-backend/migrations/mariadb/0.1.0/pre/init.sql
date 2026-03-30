USE af_std;

-- af_std.t_data_element_his definition
CREATE TABLE IF NOT EXISTS `t_data_element_his` (
  `f_de_id` bigint(20) NOT NULL DEFAULT 0 COMMENT '唯一标识、雪花算法',
  `f_de_code` bigint(20) NOT NULL DEFAULT 0 COMMENT '关联标识、雪花算法',
  `f_name_en` varchar(128) NOT NULL COMMENT '英文名称',
  `f_name_cn` varchar(255) DEFAULT NULL,
  `f_synonym` varchar(512) NOT NULL DEFAULT '' COMMENT '同义词',
  `f_std_type` INT(4) NOT NULL DEFAULT 0 COMMENT '标准类型',
  `f_data_type` INT(4) NOT NULL DEFAULT 0 COMMENT '数据类型',
  `f_data_length` int(11)   DEFAULT NULL COMMENT '数据长度',
  `f_data_precision` INT(4) DEFAULT NULL COMMENT '数据精度',
  `f_dict_code` bigint(20) NOT NULL DEFAULT 0 COMMENT '码表关联标识',
  `f_description` varchar(1000) NOT NULL DEFAULT '' COMMENT '数据元说明',
  `f_version` int(11) NOT NULL DEFAULT 1 COMMENT '版本号',
  `f_status` INT(4) NOT NULL DEFAULT 0 COMMENT '标准状态',
  `f_create_user` varchar(128) NOT NULL DEFAULT '' COMMENT '创建用户',
  `f_create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `f_update_user` varchar(128) NOT NULL DEFAULT '' COMMENT '更新用户',
  `f_update_time` datetime DEFAULT NULL COMMENT '更新时间',
  `f_std_file_code` bigint(20) NOT NULL DEFAULT 0 COMMENT '标准文件关联标识（目前为预留字段）',
  `f_authority_id` bigint(20) NOT NULL DEFAULT 0 COMMENT '权限域（目前为预留字段）',
  `f_catalog_id` bigint(20) NOT NULL DEFAULT 0 COMMENT '目录关联标识',
  `f_relation_type` varchar(10) NOT NULL DEFAULT 'no' COMMENT '数据元关联类型no无限制codeTable码表codeRule编码规则' ,
  `f_isempty_flag` smallint(2) NOT NULL DEFAULT 0 COMMENT '是否为空标记，1是、0否，默认否' ,
  `f_department_ids`  varchar(350)  NULL  COMMENT '部门ID' ,
  `f_third_dept_id`  varchar(36)  NULL  COMMENT '第三方部门ID' ,
  KEY `idx_conditions` (`f_de_code`) USING BTREE,
  PRIMARY KEY (`f_de_id`) USING BTREE
) COMMENT='数据元历史信息表';

-- af_std.t_data_element_info definition
CREATE TABLE IF NOT EXISTS `t_data_element_info` (
  `f_de_id` bigint(20) NOT NULL DEFAULT 0 COMMENT '唯一标识、雪花算法',
  `f_de_code` bigint(20) NOT NULL DEFAULT 0 COMMENT '关联标识、雪花算法',
  `f_name_en` varchar(128) NOT NULL COMMENT '英文名称',
  `f_name_cn` varchar(255) DEFAULT NULL,
  `f_synonym` varchar(512) NOT NULL DEFAULT '' COMMENT '同义词',
  `f_std_type` INT(4) NOT NULL DEFAULT 0 COMMENT '标准类型',
  `f_data_type` INT(4) NOT NULL DEFAULT 0 COMMENT '数据类型',
  `f_data_length` int(11)   DEFAULT null COMMENT '数据长度',
  `f_data_precision` INT(4) DEFAULT NULL COMMENT '数据精度',
  `f_dict_code` bigint(20) NOT NULL DEFAULT 0 COMMENT '码表关联标识',
  `f_label_id`  bigint                    null comment '数据分级标签',
  `f_description` varchar(1000) NOT NULL DEFAULT '' COMMENT '数据元说明',
  `f_version` int(11) NOT NULL DEFAULT 1 COMMENT '版本号',
  `f_status` INT(4) NOT NULL DEFAULT 0 COMMENT '标准状态',
  `f_create_user` varchar(128) NOT NULL DEFAULT '' COMMENT '创建用户',
  `f_create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `f_update_user` varchar(128) NOT NULL DEFAULT '' COMMENT '更新用户',
  `f_update_time` datetime DEFAULT NULL COMMENT '更新时间',
  `f_authority_id` VARCHAR(100) NOT NULL DEFAULT '0' COMMENT '权限域（目前为预留字段）',
  `f_catalog_id` bigint(20) NOT NULL DEFAULT 0 COMMENT '目录关联标识',
  `f_deleted` BIGINT(20) NOT NULL DEFAULT '0' COMMENT '删除标志id，非0表示已删除' ,
  `f_state` INT(2) NOT NULL DEFAULT '1' COMMENT '0停用，1启用' ,
  `f_disable_reason` VARCHAR(1024) NULL DEFAULT NULL COMMENT '停用原因' ,
  `f_rule_id` BIGINT(20) NULL DEFAULT NULL COMMENT '编码规则Id',
  `f_relation_type` varchar(10) NOT NULL DEFAULT 'no' COMMENT '数据元关联类型no无限制codeTable码表codeRule编码规则' ,
  `f_isempty_flag` smallint(2) NOT NULL DEFAULT 0 COMMENT '是否为空标记，1是、0否，默认否' ,
  `f_department_ids`  varchar(350)  NULL  COMMENT '部门ID' ,
  `f_third_dept_id`  varchar(36)  NULL  COMMENT '第三方部门ID' ,
  UNIQUE KEY `uk_code` (`f_de_code`,`f_version`) USING BTREE,
  UNIQUE KEY `uk_cn` (f_name_cn,f_std_type,f_deleted,f_department_ids),
  PRIMARY KEY (`f_de_id`) USING BTREE
) COMMENT='数据元基本信息表';


-- af_std.t_de_catalog_info definition
CREATE TABLE IF NOT EXISTS `t_de_catalog_info` (
  `f_id` bigint(20) NOT NULL DEFAULT 0 COMMENT '目录唯一标识',
  `f_catalog_name` varchar(20) NOT NULL DEFAULT '' COMMENT '目录名称',
  `f_description` varchar(255) NOT NULL DEFAULT '' COMMENT '目录说明',
  `f_level` INT(4) NOT NULL DEFAULT 0 COMMENT '目录级别',
  `f_parent_id` bigint(20) NOT NULL DEFAULT 0 COMMENT '父级标识',
  `f_type` INT(4) NOT NULL DEFAULT 0 COMMENT '0-根目录，1-数据元，2-码表，3-编码规则，4-标签',
  `f_authority_id` bigint(20) NOT NULL DEFAULT 0 COMMENT '权限域（目前为预留字段）',
  UNIQUE KEY `uk_name` (`f_catalog_name`,`f_type`,`f_parent_id`) USING BTREE,
  KEY `idx_level_parent_id` (`f_level`,`f_parent_id`),
  PRIMARY KEY (`f_id`)
) COMMENT='数据元目录基本信息表';

-- af_std.t_de_dict definition
CREATE TABLE IF NOT EXISTS `t_de_dict` (
  `f_id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键',
  `f_code` bigint(20) NOT NULL COMMENT '码表编码，同一码表不同状态或版本编码相同',
  `f_ch_name` varchar(128) NOT NULL COMMENT '中文名称',
  `f_en_name` varchar(128) NOT NULL COMMENT '英文名称',
  `f_description` varchar(300) DEFAULT NULL NULL COMMENT '说明',
  `f_catalog_id` bigint(20) NOT NULL COMMENT '所属目录id',
  `f_version` int(4) DEFAULT 1 NOT NULL COMMENT '版本号，从1开始',
  `f_authority_id` varchar(100) NOT NULL COMMENT '权限域（目前为预留字段）',
  `f_state` INT(2) DEFAULT 1 NOT NULL COMMENT '停用/启用:1-启用,0-停用,默认为1-启用',
  `f_disable_reason` VARCHAR(1024) NULL DEFAULT NULL COMMENT '停用原因',
  `f_deleted` BIGINT DEFAULT 0 NOT NULL COMMENT '逻辑删除标记：0-未删除，非0-已删除，默认0，删除的时候把当前值设置成当前记录的主键id；',
  `f_third_dept_id`  varchar(36)  NULL  COMMENT '第三方部门ID' ,
  `f_department_ids`  varchar(350)  NULL  COMMENT '部门ID' ,
  `f_create_time` datetime NOT NULL COMMENT '创建时间',
  `f_create_user` varchar(128) DEFAULT NULL COMMENT '创建用户（ID）',
  `f_update_time` datetime DEFAULT NULL COMMENT '修改时间',
  `f_update_user` varchar(128) DEFAULT NULL COMMENT '修改用户（ID）',
  `f_org_type` int(11) NOT NULL COMMENT '组织类型',
  UNIQUE KEY `uk_chname_orgtype_deleted` (f_ch_name,f_org_type,f_deleted,f_department_ids),
  UNIQUE KEY `uk_enname_orgtype_delete` (f_en_name,f_org_type,f_deleted,f_department_ids),
  PRIMARY KEY (`f_id`)
) COMMENT='码表';

-- af_std.t_de_dict_enum definition
CREATE TABLE IF NOT EXISTS `t_de_dict_enum` (
  `f_id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键',
  `f_code` varchar(100) NOT NULL COMMENT '编码',
  `f_value` varchar(100) NOT NULL COMMENT '编码值',
  `f_description` varchar(300) DEFAULT NULL NULL COMMENT '说明',
  `f_dict_id` bigint(20) NOT NULL COMMENT '码表的主键ID',
  KEY `idx_f_dict_id` (`f_dict_id`),
  PRIMARY KEY (`f_id`)
) COMMENT='码表枚举表';

-- af_std.t_de_dict_enum_his definition
CREATE TABLE IF NOT EXISTS `t_de_dict_enum_his` (
  `f_id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键',
  `f_code` varchar(100) NOT NULL COMMENT '码值',
  `f_value` varchar(100) NOT NULL COMMENT '码值描述',
  `f_description` varchar(255) DEFAULT NULL COMMENT '码表说明',
  `f_dict_id` bigint(20) NOT NULL COMMENT '码表的主键ID',
  KEY `idx_f_dict_id` (`f_dict_id`),
  PRIMARY KEY (`f_id`)
) COMMENT='码表枚举表';

-- af_std.t_de_dict_his definition
CREATE TABLE IF NOT EXISTS `t_de_dict_his` (
  `f_id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键',
  `f_code` bigint(20) NOT NULL COMMENT '码表编码，同一码表不同状态或版本编码相同',
  `f_ch_name` varchar(128) NOT NULL COMMENT '中文名称',
  `f_en_name` varchar(128) NOT NULL COMMENT '英文名称',
  `f_description` varchar(255) DEFAULT NULL COMMENT '业务含义',
  `f_catalog_id` bigint(20) NOT NULL COMMENT '所属目录id',
  `f_version` varchar(10) NOT NULL COMMENT '版本号，规则：V1、V2逐渐递增。',
  `f_status` int(11) NOT NULL COMMENT '码表状态（0：草稿，1：审核中，2：现行，3：退回，4：被替代，5：废弃）',
  `f_authority_id` bigint(20) NOT NULL COMMENT '权限域（目前为预留字段）',
  `f_std_file_code` bigint(20) NOT NULL DEFAULT 0 COMMENT '标准文件关联标识（目前为预留字段）',
  `f_third_dept_id`  varchar(36)  NULL  COMMENT '第三方部门ID' ,
  `f_department_ids`  varchar(350)  NULL  COMMENT '部门ID' ,
  `f_create_time` datetime NOT NULL COMMENT '创建时间',
  `f_create_user` varchar(128) DEFAULT NULL COMMENT '创建用户（ID）',
  `f_update_time` datetime DEFAULT NULL COMMENT '修改时间',
  `f_update_user` varchar(128) DEFAULT NULL COMMENT '修改用户（ID）',
  `f_org_type` int(11) NOT NULL COMMENT '组织类型',
  KEY `idx_code_state_version` (`f_code`,`f_status`,`f_version`),
  KEY `idx_state_name_code` (`f_status`,`f_ch_name`,`f_en_name`,`f_code`),
  PRIMARY KEY (`f_id`)
) COMMENT='码表历史记录表';


-- af_std.t_de_task_std_create definition
CREATE TABLE IF NOT EXISTS `t_de_task_std_create` (
  `f_id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键',
  `f_task_no` varchar(100) NOT NULL COMMENT '任务编号',
  `f_table` varchar(128) DEFAULT NULL,
  `f_table_description` varchar(1024) DEFAULT NULL COMMENT '业务表描述',
  `f_table_field` varchar(8192) DEFAULT NULL,
  `f_status` int(11) NOT NULL COMMENT '任务状态（0-未处理、 1-处理中、2-处理完成）',
  `f_create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `f_create_user` varchar(128) DEFAULT NULL COMMENT '创建用户（ID）',
  `f_create_user_phone` varchar(100) DEFAULT NULL COMMENT '创建用户联系方式',
  `f_update_time` datetime DEFAULT NULL COMMENT '修改时间',
  `f_update_user` varchar(128) DEFAULT NULL COMMENT '修改用户（ID）',
  `f_webhook` varchar(1024) NOT NULL COMMENT 'AF回调地址',
  PRIMARY KEY (`f_id`)
) COMMENT='标准创建任务表';

-- af_std.t_de_task_std_create_result definition
CREATE TABLE IF NOT EXISTS `t_de_task_std_create_result` (
  `f_id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键',
  `f_task_id` bigint(20) NOT NULL COMMENT '标准推荐任务id',
  `f_table_field` varchar(128) NOT NULL COMMENT '表字段名称',
  `f_table_field_description` varchar(1024) DEFAULT NULL COMMENT '表字段描述',
  `f_std_ref_file` varchar(1024) DEFAULT NULL COMMENT '参考标准文件',
  `f_std_code` bigint(20) DEFAULT NULL COMMENT '用户选择的标准对应的code',
  `f_std_ch_name` varchar(128) DEFAULT NULL COMMENT '标准中文名称（数据元中文名称）',
  `f_std_en_name` varchar(128) DEFAULT NULL COMMENT '标准英文名称（数据元英文名称）',
  `f_rec_std_code` varchar(100) DEFAULT NULL COMMENT '推荐算法推荐的标准code，多个逗号分割。',
  PRIMARY KEY (`f_id`)
) COMMENT='标准创建任务结果表';

insert into t_de_catalog_info(f_id, f_catalog_name, f_description, f_level, f_parent_id, f_type, f_authority_id) select 11,'全部目录','',1,1,1,0 from DUAL WHERE NOT EXISTS ( SELECT f_id from t_de_catalog_info where f_id = 11);
insert into t_de_catalog_info(f_id, f_catalog_name, f_description, f_level, f_parent_id, f_type, f_authority_id) select 22,'全部目录','',1,2,2,0 from DUAL WHERE NOT EXISTS ( SELECT f_id from t_de_catalog_info where f_id = 22);
insert into t_de_catalog_info(f_id, f_catalog_name, f_description, f_level, f_parent_id, f_type, f_authority_id) select 33,'全部目录','',1,3,3,0 from DUAL WHERE NOT EXISTS ( SELECT f_id from t_de_catalog_info where f_id = 33);
insert into t_de_catalog_info(f_id, f_catalog_name, f_description, f_level, f_parent_id, f_type, f_authority_id) select 44,'全部目录','',1,4,4,0 from DUAL WHERE NOT EXISTS ( SELECT f_id from t_de_catalog_info where f_id = 44);
insert into t_de_catalog_info(f_id, f_catalog_name, f_description, f_level, f_parent_id, f_type, f_authority_id) select 331,'数字','',2,33,3,0 from DUAL WHERE NOT EXISTS ( SELECT f_id from t_de_catalog_info where f_id = 331);
insert into t_de_catalog_info(f_id, f_catalog_name, f_description, f_level, f_parent_id, f_type, f_authority_id) select 332,'字符','',2,33,3,0 from DUAL WHERE NOT EXISTS ( SELECT f_id from t_de_catalog_info where f_id = 332);
insert into t_de_catalog_info(f_id, f_catalog_name, f_description, f_level, f_parent_id, f_type, f_authority_id) select 333,'时间','',2,33,3,0 from DUAL WHERE NOT EXISTS ( SELECT f_id from t_de_catalog_info where f_id = 333);
insert into t_de_catalog_info(f_id, f_catalog_name, f_description, f_level, f_parent_id, f_type, f_authority_id) select 334,'日期','',2,33,3,0 from DUAL WHERE NOT EXISTS ( SELECT f_id from t_de_catalog_info where f_id = 334);
insert into t_de_catalog_info(f_id, f_catalog_name, f_description, f_level, f_parent_id, f_type, f_authority_id) select 335,'时间日期','',2,33,3,0 from DUAL WHERE NOT EXISTS ( SELECT f_id from t_de_catalog_info where f_id = 335);
insert into t_de_catalog_info(f_id, f_catalog_name, f_description, f_level, f_parent_id, f_type, f_authority_id) select 336,'枚举','',2,33,3,0 from DUAL WHERE NOT EXISTS ( SELECT f_id from t_de_catalog_info where f_id = 336);
insert into t_de_catalog_info(f_id, f_catalog_name, f_description, f_level, f_parent_id, f_type, f_authority_id) select 337,'编码','',2,33,3,0 from DUAL WHERE NOT EXISTS ( SELECT f_id from t_de_catalog_info where f_id = 337);

-- ---------------------
-- 2023/11/24 add
-- ---------------------
-- 创建标准文件表（新表）
CREATE TABLE IF NOT EXISTS `t_std_file` (
  `f_id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键',
  `f_number` varchar(256) DEFAULT NULL COMMENT '标准编号',
  `f_version` int(4) NOT NULL DEFAULT 1 COMMENT '版本号，从1开始',
  `f_catalog_id` bigint(20) NOT NULL COMMENT '所属目录id',
  `f_name` varchar(256) NOT NULL COMMENT '名称',
  `f_act_date` datetime DEFAULT NULL COMMENT '实施日期',
  `f_disable_date` datetime DEFAULT NULL COMMENT '停用日期',
  `f_state` INT(2) NOT NULL DEFAULT 1 COMMENT '停用/启用:1-启用,0-停用,默认为1-启用',
  `f_disable_reason` VARCHAR(1024) NULL DEFAULT NULL COMMENT '停用原因' ,
  `f_attachment_type` INT(2) NOT NULL DEFAULT 0 COMMENT '标准文件附件类型：0-文件上传，1-填写的文件连接',
  `f_attachment_url` varchar(2048) DEFAULT NULL COMMENT '文件保存路径地址，当f_attachment_type为0时，填写文件实际存储的url，当f_attachment_type为1是填写用户自己填写url。',
  `f_file_name` varchar(255) DEFAULT NULL COMMENT '文件名称，当f_attachment_type为0时，填写文件的名称，当f_attachment_type为1是填写用户自己填写url。',
  `f_org_type` INT(2) NOT NULL DEFAULT 0 COMMENT '标准组织类型',
  `f_description` varchar(300) DEFAULT NULL COMMENT '说明',
  `f_authority_id` varchar(100) DEFAULT NULL COMMENT '权限域（目前为预留字段）',
  `f_publish_date` datetime NULL COMMENT '发布日期' ,
  `f_department_ids`  varchar(350)  NULL  COMMENT '部门ID' ,
  `f_third_dept_id`  varchar(36)  NULL  COMMENT '第三方部门ID' ,
  `f_create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `f_create_user` varchar(128) DEFAULT NULL COMMENT '创建用户（ID）',
  `f_update_time` datetime DEFAULT NULL COMMENT '修改时间',
  `f_update_user` varchar(128) DEFAULT NULL COMMENT '修改用户（ID）',
  `f_deleted` bigint(20) NOT NULL DEFAULT 0 COMMENT '逻辑删除标记：0-未删除，非0-已删除，默认0，删除的时候把当前值设置成当前记录的主键id；',
  KEY `uk_name_orgtype_deleted` (f_name,f_org_type,f_deleted,f_department_ids),
  UNIQUE KEY `uk_number_deleted` (`f_number`,`f_deleted`),
  KEY catalog_idx (f_catalog_id),
  PRIMARY KEY (`f_id`)
) COMMENT='标准文件';


-- 创建新的编码规则表
CREATE TABLE IF NOT EXISTS `t_rule` (
  `f_id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键',
  `f_name` varchar(128) NOT NULL COMMENT '名称',
  `f_catalog_id` bigint(20) NOT NULL COMMENT '所属目录id',
  `f_org_type` INT(2) NOT NULL COMMENT '标准组织类型',
  `f_description` varchar(300) DEFAULT NULL COMMENT '说明',
  `f_rule_type` INT(2) NOT NULL DEFAULT 0 COMMENT '规则类型：0-正则表达式，1-自定义配置',
  `f_version` int(4) NOT NULL DEFAULT 1 COMMENT '版本号，从1开始',
  `f_expression` varchar(1024) NOT NULL COMMENT '表达式：f_rule_type为0时是正则表达式，f_rule_type为1时是自定义配置，格式json：[{xxx},{xxxx}];',
  `f_state` INT(2) NOT NULL DEFAULT 1 COMMENT '停用/启用:1-启用,0-停用,默认为1-启用',
  `f_disable_reason` VARCHAR(1024) NULL DEFAULT NULL COMMENT '停用原因',
  `f_authority_id` varchar(100) DEFAULT NULL COMMENT '权限域（目前为预留字段）',
  `f_department_ids`  varchar(350)  NULL  COMMENT '部门ID' ,
  `f_third_dept_id`  varchar(36)  NULL  COMMENT '第三方部门ID' ,
  `f_create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `f_create_user` varchar(128) DEFAULT NULL COMMENT '创建用户（ID）',
  `f_update_time` datetime DEFAULT NULL COMMENT '修改时间',
  `f_update_user` varchar(128) DEFAULT NULL COMMENT '修改用户（ID）',
  `f_deleted` bigint(20) NOT NULL DEFAULT 0 COMMENT '逻辑删除标记：0-未删除，非0-已删除，默认0，删除的时候把当前值设置成当前记录的主键id；',
  KEY `uk_name_orgtype_deleted` (f_name,f_org_type,f_deleted,f_department_ids),
  PRIMARY KEY (`f_id`)
) COMMENT='编码规则';


-- 创建编码规则和标准文件的管理关系表
CREATE TABLE IF NOT EXISTS `t_relation_rule_file` (
  `f_id` bigint(20) NOT NULL COMMENT '唯一标识、雪花算法',
  `f_rule_id` bigint(20) NOT NULL COMMENT '数据元唯一标识',
  `f_file_id` bigint(20) NOT NULL COMMENT '文件唯一标识',
  UNIQUE KEY `uk_ruleid_fileid` (`f_rule_id`,`f_file_id`),
  PRIMARY KEY (`f_id`)
) COMMENT='编码规则-文件关系表';



-- 创建码表和标准文件的管理关系表
CREATE TABLE IF NOT EXISTS `t_relation_dict_file` (
  `f_id` bigint(20) NOT NULL COMMENT '唯一标识、雪花算法',
  `f_dict_id` bigint(20) NOT NULL COMMENT '数据元唯一标识',
  `f_file_id` bigint(20) NOT NULL COMMENT '文件唯一标识',
  UNIQUE KEY `uk_dictid_fileid` (`f_dict_id`,`f_file_id`),
  PRIMARY KEY (`f_id`)
) COMMENT='数据元-文件关系表';




-- 创建码表和标准文件的关联关系表
CREATE TABLE IF NOT EXISTS  `t_relation_de_file` (
  `f_id` BIGINT(20) NOT NULL COMMENT '唯一标识、雪花算法',
  `f_de_id` BIGINT(20) NOT NULL COMMENT '数据元唯一标识',
  `f_file_id` BIGINT(20) NOT NULL COMMENT '文件唯一标识',
  PRIMARY KEY (`f_id`)
) COMMENT='数据元-文件关系表';


-- 业务表标准待创建表
CREATE TABLE IF NOT EXISTS `t_business_table_std_create_pool` (
    `f_id` BIGINT(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `f_business_table_model_id` VARCHAR(128) NOT NULL COMMENT '业务表模型ID',
    `f_business_table_name` VARCHAR(512) NOT NULL COMMENT '业务表名称' ,
    `f_business_table_id` VARCHAR(255) NOT NULL COMMENT '业务表ID' ,
    `f_business_table_type` VARCHAR(255) NOT NULL COMMENT '业务表类型' ,
    `f_business_table_field_id` VARCHAR(255) NOT NULL COMMENT '业务表字段ID' ,
    `f_business_table_field_current_name` VARCHAR(512) NOT NULL COMMENT '业务表字段当前名称' ,
    `f_business_table_field_origin_name` VARCHAR(512) DEFAULT NULL COMMENT '业务表字段原始名称' ,
    `f_business_table_field_current_name_en` VARCHAR(512) NOT NULL COMMENT '业务表字段当前英文名称' ,
    `f_business_table_field_origin_name_en` VARCHAR(512)  DEFAULT NULL COMMENT '业务表字段原始英文名称' ,
    `f_business_table_field_current_std_type` VARCHAR(128) DEFAULT NULL COMMENT '业务表字段当前标准分类' ,
    `f_business_table_field_origin_std_type` VARCHAR(128) DEFAULT NULL COMMENT '业务表字段原始标准分类' ,
    `f_business_table_field_data_type` VARCHAR(128) NOT NULL COMMENT '数据类型' ,
    `f_business_table_field_data_length` INT(11) DEFAULT NULL COMMENT '数据长度',
    `f_business_table_field_data_precision` INT(11) DEFAULT NULL COMMENT '数据精度',
    `f_business_table_field_dict_name` VARCHAR(512) DEFAULT NULL COMMENT '码表名称' ,
    `f_business_table_field_rule_name` VARCHAR(512) DEFAULT NULL COMMENT '编码规则名称' ,
    `f_business_table_field_description` VARCHAR(1024) NULL DEFAULT NULL COMMENT '业务表字段描述' ,
    `f_state` INT(4) NOT NULL DEFAULT '0' COMMENT '状态：0-待发起，1-进行中，2-已完成未采纳，3-已采纳',
    `f_task_id` VARCHAR(128) NULL DEFAULT NULL COMMENT '任务ID' COLLATE 'utf8mb4_unicode_ci',
    `f_data_element_id` BIGINT(20) NULL DEFAULT NULL COMMENT '数据元ID',
    `f_create_user` VARCHAR(128) NULL DEFAULT NULL COMMENT '创建人（发起请求人）' ,
    `f_update_user` VARCHAR(128) NULL DEFAULT NULL COMMENT '修改人' ,
    `f_create_time` DATETIME NULL DEFAULT NULL COMMENT '创建时间',
    `f_update_time` DATETIME NULL DEFAULT NULL COMMENT '修改时间',
    PRIMARY KEY (`f_id`) USING BTREE
    ) COMMENT='业务表标准待创建表';

