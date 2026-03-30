USE af_data_catalog;

-- af_data_catalog.t_business_logic_entity_by_business_domain definition

CREATE TABLE IF NOT EXISTS `t_business_logic_entity_by_business_domain` (
    `id` bigint(20) NOT NULL COMMENT '唯一id，雪花算法',
    `business_domain_id` char(36)  NOT NULL COMMENT '业务域id',
    `business_domain_name` varchar(128)  NOT NULL COMMENT '业务域名称',
    `business_logic_entity_count` int(11) NOT NULL COMMENT '已发布的业务逻辑实体数量',
    PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '业务逻辑实体分布信息（业务域视角）';

-- af_data_catalog.t_business_logic_entity_by_department definition

CREATE TABLE IF NOT EXISTS `t_business_logic_entity_by_department` (
    `id` bigint(20) NOT NULL COMMENT '唯一id，雪花算法',
    `department_id` char(36)  NOT NULL COMMENT '一级部门id',
    `department_name` varchar(255)  NOT NULL COMMENT '一级部门名称',
    `business_logic_entity_count` int(11) NOT NULL COMMENT '已发布的业务逻辑实体数量',
    PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '业务逻辑实体分布信息（部门视角）';

-- af_data_catalog.t_catalog_code_sequence definition

CREATE TABLE IF NOT EXISTS `t_catalog_code_sequence` (
    `id` bigint(20) NOT NULL COMMENT '唯一id，雪花算法',
    `code_prefix` varchar(40)  NOT NULL COMMENT '目录编码前缀部分（类、项、目码+细目码）',
    `order_code` mediumint(6) NOT NULL COMMENT '目录编码顺序码，不足6位高位补0',
    `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) COMMENT '创建时间',
    `updated_at` datetime(3) DEFAULT NULL COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `t_catalog_code_sequence_un` (`code_prefix`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '目录顺序码记录表';

-- af_data_catalog.t_catalog_code_title definition

CREATE TABLE IF NOT EXISTS `t_catalog_code_title` (
    `id` bigint(20) NOT NULL COMMENT '唯一id，雪花算法',
    `code` varchar(50)  NOT NULL COMMENT '目录编码',
    `title` varchar(500)  NOT NULL COMMENT '目录名称',
    PRIMARY KEY (`id`),
    UNIQUE KEY `t_catalog_code_title_un` (`title`),
    KEY `idx_catalog_code_title_code` (`code`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '目录名称记录表';

-- af_data_catalog.t_client_info definition

CREATE TABLE IF NOT EXISTS `t_client_info` (
    `id` bigint(20) NOT NULL COMMENT '唯一id，雪花算法',
    `client_id` char(36)  NOT NULL COMMENT '客户端id',
    `client_secret` varchar(128)  NOT NULL COMMENT '客户端密钥',
    PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '客户端id密钥信息';

-- af_data_catalog.t_data_assets_info definition

CREATE TABLE IF NOT EXISTS `t_data_assets_info` (
    `id` bigint(20) NOT NULL COMMENT '唯一id，雪花算法',
    `business_domain_count` int(11) NOT NULL COMMENT '业务域数量',
    `subject_domain_count` int(11) NOT NULL COMMENT '主题域数量',
    `business_object_count` int(11) NOT NULL COMMENT '业务对象数量',
    `business_logic_entity_count` int(11) NOT NULL COMMENT '已发布的业务逻辑实体数量',
    `business_attributes_count` int(11) NOT NULL COMMENT '业务属性数量',
    PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '数据资产L1-L5数量';

-- af_data_catalog.t_data_catalog definitio`

CREATE TABLE IF NOT EXISTS `t_data_catalog` (
    `id` bigint(20) NOT NULL COMMENT '唯一id，雪花算法',
    `code` varchar(50)  NOT NULL COMMENT '目录编码',
    `title` varchar(500)  NOT NULL COMMENT '目录名称',
    `group_id` bigint(20) NOT NULL DEFAULT 0 COMMENT '数据资源目录分类ID',
    `group_name` varchar(128)  NOT NULL DEFAULT '' COMMENT '数据资源目录分类名称',
    `theme_id` bigint(20) DEFAULT NULL COMMENT '主题分类ID',
    `theme_name` varchar(100)  DEFAULT NULL COMMENT '主题分类名称',
    `forward_version_id` bigint(20) DEFAULT NULL COMMENT '当前目录前一版本目录ID',
    `description` varchar(1000)  DEFAULT NULL COMMENT '资源目录描述',
    `data_range` tinyint(2) DEFAULT NULL COMMENT '数据范围：字典DM_DATA_SJFW，01全市 02市直 03区县',
    `update_cycle` tinyint(2) DEFAULT NULL COMMENT '更新频率 参考数据字典：GXZQ，1不定时 2实时 3每日 4每周 5每月 6每季度 7每半年 8每年 9其他',
    `data_kind` tinyint(2) NOT NULL COMMENT '基础信息分类 1 人 2 地 4 事 8 物 16 组织 32 其他  可组合，如 人和地 即 1|2 = 3',
    `shared_type` tinyint(2) NOT NULL COMMENT '共享属性 1 无条件共享 2 有条件共享 3 不予共享',
    `shared_condition` varchar(255)  DEFAULT NULL COMMENT '共享条件',
    `column_unshared` tinyint(2) NOT NULL COMMENT '信息项不予共享',
    `open_type` tinyint(2) NOT NULL COMMENT '开放属性 1 向公众开放 2 不向公众开放',
    `open_condition` varchar(255)  DEFAULT NULL COMMENT '开放条件',
    `shared_mode` tinyint(2) NOT NULL COMMENT '共享方式 1 共享平台方式 2 邮件方式 3 介质方式',
    `physical_deletion` tinyint(2) DEFAULT NULL COMMENT '挂接实体资源是否存在物理删除（1 是 ; 0 否）',
    `sync_mechanism` tinyint(2) DEFAULT NULL COMMENT '数据归集机制（1 增量 ; 2 全量） ----归集到数据中台',
    `sync_frequency` varchar(128)  DEFAULT NULL COMMENT '数据归集频率 ----归集到数据中台',
    `view_count` smallint(4) NOT NULL DEFAULT 0 COMMENT '挂接逻辑视图数量',
    `api_count` smallint(4) NOT NULL DEFAULT 0 COMMENT '挂接接口数量',
    `file_count` smallint(4) NOT NULL DEFAULT 0 COMMENT '挂接文件资源数量',
    `flow_node_id` varchar(50)  DEFAULT NULL COMMENT '目录当前所处审核流程结点ID',
    `flow_node_name` varchar(200)  DEFAULT NULL COMMENT '目录当前所处审核流程结点名称',
    `flow_id` varchar(50)  DEFAULT NULL COMMENT '审批流程实例ID',
    `flow_name` varchar(200)  DEFAULT NULL COMMENT '审批流程名称',
    `flow_version` varchar(10)  DEFAULT NULL COMMENT '审批流程版本',
    `department_id` char(36)  NOT NULL COMMENT '所属部门ID',
    `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) COMMENT '创建时间',
    `creator_uid` varchar(50)  NOT NULL DEFAULT '' COMMENT '创建用户ID',
    `updated_at` datetime(3) DEFAULT NULL COMMENT '更新时间',
    `updater_uid` varchar(50)  DEFAULT NULL COMMENT '更新用户ID',
    `source` tinyint(2) NOT NULL DEFAULT 1 COMMENT '数据来源 1 认知平台自动创建 2 人工创建',
    `table_type` tinyint(2) DEFAULT NULL COMMENT '库表类型 1 贴源表 2 标准表',
    `current_version` tinyint(2) NOT NULL DEFAULT 1 COMMENT '是否现行版本 0 否 1 是',
    `publish_flag` tinyint(2) NOT NULL DEFAULT 0 COMMENT '是否发布到超市 （1 是 ; 0 否）',
    `data_kind_flag` tinyint(2) NOT NULL DEFAULT 0 COMMENT '基础信息分类是否智能推荐 （1 是 ; 0 否）',
    `label_flag` tinyint(2) NOT NULL DEFAULT 0 COMMENT '标签是否智能推荐 （1 是 ; 0 否）',
    `src_event_flag` tinyint(2) NOT NULL DEFAULT 0 COMMENT '来源业务场景是否智能推荐 （1 是 ; 0 否）',
    `rel_event_flag` tinyint(2) NOT NULL DEFAULT 0 COMMENT '关联业务场景是否智能推荐 （1 是 ; 0 否）',
    `system_flag` tinyint(2) NOT NULL DEFAULT 0 COMMENT '关联信息系统是否智能推荐 （1 是 ; 0 否）',
    `rel_catalog_flag` tinyint(2) NOT NULL DEFAULT 0 COMMENT '关联目录是否智能推荐 （1 是 ; 0 否）',
    `published_at` datetime(3) DEFAULT NULL COMMENT '上线发布时间',
    `is_indexed` tinyint(2) DEFAULT NULL COMMENT '是否已建ES索引，0 否 1 是',
    `audit_apply_sn` bigint(20) NOT NULL DEFAULT 0 COMMENT '发起审核申请序号',
    `audit_advice` text null COMMENT '审核意见，仅驳回时有用',
    `owner_id` varchar(50)  NOT NULL DEFAULT '' COMMENT '目录数据owner的用户ID',
    `owner_name` varchar(128)  NOT NULL DEFAULT '' COMMENT '目录数据owner的用户名称',
    `is_canceled` tinyint(2) DEFAULT NULL COMMENT '目录下线时针对该目录的关联申请是否已撤销，0 待撤销 1 已撤销',
    `proc_def_key` varchar(128)  NOT NULL DEFAULT '' COMMENT '审核流程key',
    `flow_apply_id` varchar(50)  DEFAULT '' COMMENT '审核流程ID',
    `online_status` varchar(20) NOT NULL DEFAULT 'notline' COMMENT '接口状态 未上线 notline、已上线 online、已下线offline、上线审核中up-auditing、下线审核中down-auditing、上线审核未通过up-reject、下线审核未通过down-reject、已下线（上线审核中）offline-up-auditing、已下线（上线审核未通过）offline-up-reject',
    `online_time` datetime DEFAULT NULL COMMENT '上线时间',
    `audit_type` varchar(50) NOT NULL DEFAULT 'unpublished' COMMENT '审核类型 unpublished 未发布 af-data-view-online上线审核 af-data-view-offline 下线审核',
    `audit_state` tinyint(2) DEFAULT NULL COMMENT '审核状态，1 审核中  2 通过  3 驳回',
    `publish_status` varchar(20) NOT NULL DEFAULT 'unpublished' COMMENT '发布状态 未发布unpublished 、发布审核中pub-auditing、已发布published、发布审核未通过pub-reject、变更审核中change-auditing、变更审核未通过change-reject',
    `app_scene_classify` tinyint(2) DEFAULT NULL COMMENT '应用场景分类 1 政务服务、2 公共服务、3 监管、4 其他',
    `source_department_id` char(36) NOT NULL COMMENT '数据资源来源部门id',
    `data_related_matters` varchar(255) NOT NULL COMMENT '数据所属事项',
    `business_matters` text NOT NULL COMMENT '业务事项',
    `data_classify` varchar(50) NOT NULL COMMENT '数据分级 标签',
    `data_domain` tinyint(2) COMMENT '数据所在领域',
    `data_level` tinyint(2) COMMENT '数据所在层级',
    `time_range` varchar(100) COMMENT '数据时间范围',
    `provider_channel` tinyint(2) COMMENT '提供渠道',
    `administrative_code` tinyint(2) COMMENT '行政区划代码',
    `central_department_code` tinyint(2) COMMENT '中央业务指导部门代码',
    `processing_level` varchar(100) COMMENT '数据加工程度',
    `catalog_tag` tinyint(2) COMMENT '目录标签',
    `is_electronic_proof` tinyint(2) COMMENT '是否电子证明编码',
    `other_app_scene_classify` varchar(100) COMMENT '其他应用场景分类',
    `other_update_cycle` varchar(100) COMMENT '其他更新频率',
    `draft_id` bigint(20) NOT NULL DEFAULT 0  COMMENT '草稿id',
    `apply_num` int(11) NOT NULL COMMENT '申请量',
    `explore_job_id` VARCHAR(64)  DEFAULT NULL COMMENT '探查作业ID',
    `explore_job_version` INT(11) DEFAULT NULL COMMENT '探查作业版本',
    `operation_authorized` tinyint(2) COMMENT '是否可授权运营字段',
    `is_import` tinyint(2) DEFAULT 0 COMMENT '是否导入',
    PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '目录表';

-- af_data_catalog.t_data_catalog_audit_flow_bind definition

CREATE TABLE IF NOT EXISTS `t_data_catalog_audit_flow_bind` (
    `id` bigint(20) NOT NULL COMMENT '唯一id，雪花算法',
    `audit_type` varchar(128)  NOT NULL COMMENT '审核类型：\naf-data-catalog-online 上线审核\naf-data-catalog-change 变更审核\naf-data-catalog-offline 下线审核\naf-data-catalog-publish 发布审核\naf-data-catalog-download 下载审核',
    `proc_def_key` varchar(128)  NOT NULL COMMENT '审核流程key',
    `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) COMMENT '创建时间',
    `creator_uid` varchar(50)  NOT NULL DEFAULT '' COMMENT '创建用户ID',
    `updated_at` datetime(3) DEFAULT NULL COMMENT '更新时间',
    `updater_uid` varchar(50)  DEFAULT NULL COMMENT '更新用户ID',
    PRIMARY KEY (`id`),
    UNIQUE KEY `t_data_catalog_audit_flow_bind_un` (`audit_type`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '审核流程绑定记录表';

-- af_data_catalog.t_data_catalog_column definition

CREATE TABLE IF NOT EXISTS `t_data_catalog_column` (
    `primary_id` int(11)  NOT NULL AUTO_INCREMENT  COMMENT '主键id',
    `id` bigint(20) NOT NULL COMMENT '唯一id，雪花算法',
    `catalog_id` bigint(20) NOT NULL COMMENT '数据资源目录ID',
    `technical_name` varchar(255) NOT NULL COMMENT '技术名称',
    `business_name` varchar(255) DEFAULT NULL COMMENT '业务名称',
    `source_id` char(36) NOT NULL COMMENT '来源id',
    `data_format` tinyint(2) DEFAULT NULL COMMENT '字段类型 0:数字型 1:字符型 2:日期型 3:日期时间型 5:布尔型 6:其他 7:小数型 8:高精度型 9:时间型',
    `data_length` int(11) DEFAULT NULL COMMENT '字段长度',
    `data_precision` tinyint(2) DEFAULT NULL COMMENT '数据精度',
    `ranges` varchar(200)  DEFAULT NULL COMMENT '字段值域',
    `shared_type` tinyint(2) DEFAULT NULL COMMENT '共享属性 1 无条件共享 2 有条件共享 3 不予共享',
    `open_type` tinyint(2) DEFAULT NULL COMMENT '开放属性 1 向公众开放 2 不向公众开放',
    `timestamp_flag` tinyint(2) DEFAULT NULL COMMENT '是否时间戳（1 是 ; 0 否）',
    `primary_flag` tinyint(2) DEFAULT NULL COMMENT '是否主键（1 是 ; 0 否）',
    `null_flag` tinyint(2) DEFAULT NULL COMMENT '是否为空（1 是 ; 0 否）',
    `classified_flag` tinyint(2) DEFAULT NULL COMMENT '是否涉密属性（1 是 ; 0 否）',
    `sensitive_flag` tinyint(2) DEFAULT NULL COMMENT '是否敏感属性（1 是 ; 0 否）',
    `description` varchar(2048)  NOT NULL DEFAULT '' COMMENT '字段描述，对应元数据field_comment',
    `shared_condition` varchar(255)  DEFAULT NULL COMMENT '共享条件',
    `open_condition` varchar(255)  DEFAULT NULL COMMENT '开放条件',
    `ai_description` varchar(2048)  DEFAULT '' COMMENT 'AI数据理解下生成的字段描述',
    `standard_code` varchar(30) NULL COMMENT '数据标准code',
    `code_table_id` varchar(30) NULL COMMENT '码表ID',
    `source_system` varchar(255) NULL COMMENT '来源系统',
    `source_system_level` tinyint(2) NULL COMMENT '来源系统分级 1 自建自用 2 国直（国家部委统一平台） 3省直（省级统一平台） 4市直（市级统一平台） 5县直（县级统一平台）',
    `info_item_level` tinyint(2) NULL COMMENT '信息项分级 1级 2级 3级 4级',
    `index` int NOT NULL COMMENT '信息项顺序',
    KEY `id_key` (`id`),
    UNIQUE KEY `t_data_catalog_column_un` ( `catalog_id`,  `technical_name` ),
    PRIMARY KEY (`primary_id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '目录关联信息项表';

-- af_data_catalog.t_data_catalog_column_history definition

CREATE TABLE IF NOT EXISTS `t_data_catalog_column_history` (
    `primary_id` int(11)  NOT NULL  COMMENT '主键id',
    `id` bigint(20) NOT NULL COMMENT '唯一id，雪花算法',
    `catalog_id` bigint(20) NOT NULL COMMENT '数据资源目录ID',
    `technical_name` varchar(255) NOT NULL COMMENT '技术名称',
    `business_name` varchar(255) DEFAULT NULL COMMENT '业务名称',
    `source_id` char(36) NOT NULL COMMENT '来源id',
    `data_format` tinyint(2) DEFAULT NULL COMMENT '字段类型 0:数字型 1:字符型 2:日期型 3:日期时间型 5:布尔型 6:其他 7:小数型 8:高精度型 9:时间型',
    `data_length` int(11) DEFAULT NULL COMMENT '字段长度',
    `data_precision` tinyint(2) DEFAULT NULL COMMENT '数据精度',
    `ranges` varchar(200)  DEFAULT NULL COMMENT '字段值域',
    `shared_type` tinyint(2) DEFAULT NULL COMMENT '共享属性 1 无条件共享 2 有条件共享 3 不予共享',
    `open_type` tinyint(2) DEFAULT NULL COMMENT '开放属性 1 向公众开放 2 不向公众开放',
    `timestamp_flag` tinyint(2) DEFAULT NULL COMMENT '是否时间戳（1 是 ; 0 否）',
    `primary_flag` tinyint(2) DEFAULT NULL COMMENT '是否主键（1 是 ; 0 否）',
    `null_flag` tinyint(2) DEFAULT NULL COMMENT '是否为空（1 是 ; 0 否）',
    `classified_flag` tinyint(2) DEFAULT NULL COMMENT '是否涉密属性（1 是 ; 0 否）',
    `sensitive_flag` tinyint(2) DEFAULT NULL COMMENT '是否敏感属性（1 是 ; 0 否）',
    `description` varchar(2048)  NOT NULL DEFAULT '' COMMENT '字段描述，对应元数据field_comment',
    `shared_condition` varchar(255)  DEFAULT NULL COMMENT '共享条件',
    `open_condition` varchar(255)  DEFAULT NULL COMMENT '开放条件',
    `ai_description` varchar(2048)  DEFAULT '' COMMENT 'AI数据理解下生成的字段描述',
    `standard_code` varchar(30) NULL COMMENT '数据标准code',
    `code_table_id` varchar(30) NULL COMMENT '码表ID',
    `source_system` varchar(255) NULL COMMENT '来源系统',
    `source_system_level` tinyint(2) NULL COMMENT '来源系统分级 1 自建自用 2 国直（国家部委统一平台） 3省直（省级统一平台） 4市直（市级统一平台） 5县直（县级统一平台）',
    `info_item_level` tinyint(2) NULL COMMENT '信息项分级 1级 2级 3级 4级',
    `index` int NOT NULL COMMENT '信息项顺序',
    PRIMARY KEY (`primary_id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- af_data_catalog.t_data_catalog_download_apply definition

CREATE TABLE IF NOT EXISTS `t_data_catalog_download_apply` (
    `id` bigint(20) NOT NULL COMMENT '唯一id，雪花算法',
    `uid` varchar(50)  NOT NULL COMMENT '用户ID',
    `code` varchar(50)  NOT NULL COMMENT '目录编码',
    `apply_days` tinyint(4) NOT NULL COMMENT '申请天数（7、15、30天）',
    `apply_reason` varchar(800)  NOT NULL COMMENT '申请理由',
    `audit_apply_sn` bigint(20) NOT NULL DEFAULT 0 COMMENT '发起审核申请序号',
    `audit_type` varchar(100)  NOT NULL DEFAULT 'af-data-catalog-download' COMMENT '审核类型，默认af-data-catalog-download',
    `state` tinyint(4) NOT NULL DEFAULT 1 COMMENT '申请审核状态\n1 审核中\n2 审核通过\n3 审核不通过',
    `created_at` datetime NOT NULL DEFAULT current_timestamp() COMMENT '审核创建时间',
    `updated_at` datetime NOT NULL DEFAULT current_timestamp() COMMENT '审核结果更新时间',
    `flow_id` varchar(50)  DEFAULT NULL COMMENT '审批流程实例ID',
    `proc_def_key` varchar(128)  NOT NULL DEFAULT '' COMMENT '审核流程key',
    `flow_apply_id` varchar(50)  DEFAULT '' COMMENT '审核流程ID',
    UNIQUE KEY `t_data_catalog_download_apply_un` ( `code`,  `uid`,  `audit_apply_sn` ),
    PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '数据下载申请记录表';

-- af_data_catalog.t_data_catalog_history definition

CREATE TABLE IF NOT EXISTS `t_data_catalog_history` (
    `id` bigint(20) NOT NULL COMMENT '唯一id，雪花算法',
    `code` varchar(50)  NOT NULL COMMENT '目录编码',
    `title` varchar(500)  NOT NULL COMMENT '目录名称',
    `group_id` bigint(20) NOT NULL DEFAULT 0 COMMENT '数据资源目录分类ID',
    `group_name` varchar(128)  NOT NULL DEFAULT '' COMMENT '数据资源目录分类名称',
    `theme_id` bigint(20) DEFAULT NULL COMMENT '主题分类ID',
    `theme_name` varchar(100)  DEFAULT NULL COMMENT '主题分类名称',
    `forward_version_id` bigint(20) DEFAULT NULL COMMENT '当前目录前一版本目录ID',
    `description` varchar(1000)  DEFAULT NULL COMMENT '资源目录描述',
    `data_range` tinyint(2) DEFAULT NULL COMMENT '数据范围：字典DM_DATA_SJFW，01全市 02市直 03区县',
    `update_cycle` tinyint(2) DEFAULT NULL COMMENT '更新频率 参考数据字典：GXZQ，1不定时 2实时 3每日 4每周 5每月 6每季度 7每半年 8每年 9其他',
    `data_kind` tinyint(2) NOT NULL COMMENT '基础信息分类 1 人 2 地 4 事 8 物 16 组织 32 其他  可组合，如 人和地 即 1|2 = 3',
    `shared_type` tinyint(2) NOT NULL COMMENT '共享属性 1 无条件共享 2 有条件共享 3 不予共享',
    `shared_condition` varchar(255)  DEFAULT NULL COMMENT '共享条件',
    `column_unshared` tinyint(2) NOT NULL COMMENT '信息项不予共享',
    `open_type` tinyint(2) NOT NULL COMMENT '开放属性 1 向公众开放 2 不向公众开放',
    `open_condition` varchar(255)  DEFAULT NULL COMMENT '开放条件',
    `shared_mode` tinyint(2) NOT NULL COMMENT '共享方式 1 共享平台方式 2 邮件方式 3 介质方式',
    `physical_deletion` tinyint(2) DEFAULT NULL COMMENT '挂接实体资源是否存在物理删除（1 是 ; 0 否）',
    `sync_mechanism` tinyint(2) DEFAULT NULL COMMENT '数据归集机制（1 增量 ; 2 全量） ----归集到数据中台',
    `sync_frequency` varchar(128)  DEFAULT NULL COMMENT '数据归集频率 ----归集到数据中台',
    `view_count` smallint(4) NOT NULL DEFAULT 0 COMMENT '挂接逻辑视图数量',
    `api_count` smallint(4) NOT NULL DEFAULT 0 COMMENT '挂接接口数量',
    `file_count` smallint(4) NOT NULL DEFAULT 0 COMMENT '挂接文件资源数量',
    `flow_node_id` varchar(50)  DEFAULT NULL COMMENT '目录当前所处审核流程结点ID',
    `flow_node_name` varchar(200)  DEFAULT NULL COMMENT '目录当前所处审核流程结点名称',
    `flow_id` varchar(50)  DEFAULT NULL COMMENT '审批流程实例ID',
    `flow_name` varchar(200)  DEFAULT NULL COMMENT '审批流程名称',
    `flow_version` varchar(10)  DEFAULT NULL COMMENT '审批流程版本',
    `department_id` char(36)  NOT NULL COMMENT '所属部门ID',
    `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) COMMENT '创建时间',
    `creator_uid` varchar(50)  NOT NULL DEFAULT '' COMMENT '创建用户ID',
    `updated_at` datetime(3) DEFAULT NULL COMMENT '更新时间',
    `updater_uid` varchar(50)  DEFAULT NULL COMMENT '更新用户ID',
    `source` tinyint(2) NOT NULL DEFAULT 1 COMMENT '数据来源 1 认知平台自动创建 2 人工创建',
    `table_type` tinyint(2) DEFAULT NULL COMMENT '库表类型 1 贴源表 2 标准表',
    `current_version` tinyint(2) NOT NULL DEFAULT 1 COMMENT '是否现行版本 0 否 1 是',
    `publish_flag` tinyint(2) NOT NULL DEFAULT 0 COMMENT '是否发布到超市 （1 是 ; 0 否）',
    `data_kind_flag` tinyint(2) NOT NULL DEFAULT 0 COMMENT '基础信息分类是否智能推荐 （1 是 ; 0 否）',
    `label_flag` tinyint(2) NOT NULL DEFAULT 0 COMMENT '标签是否智能推荐 （1 是 ; 0 否）',
    `src_event_flag` tinyint(2) NOT NULL DEFAULT 0 COMMENT '来源业务场景是否智能推荐 （1 是 ; 0 否）',
    `rel_event_flag` tinyint(2) NOT NULL DEFAULT 0 COMMENT '关联业务场景是否智能推荐 （1 是 ; 0 否）',
    `system_flag` tinyint(2) NOT NULL DEFAULT 0 COMMENT '关联信息系统是否智能推荐 （1 是 ; 0 否）',
    `rel_catalog_flag` tinyint(2) NOT NULL DEFAULT 0 COMMENT '关联目录是否智能推荐 （1 是 ; 0 否）',
    `published_at` datetime(3) DEFAULT NULL COMMENT '上线发布时间',
    `is_indexed` tinyint(2) DEFAULT NULL COMMENT '是否已建ES索引，0 否 1 是',
    `audit_apply_sn` bigint(20) NOT NULL DEFAULT 0 COMMENT '发起审核申请序号',
    `audit_advice` text null COMMENT '审核意见，仅驳回时有用',
    `owner_id` varchar(50)  NOT NULL DEFAULT '' COMMENT '目录数据owner的用户ID',
    `owner_name` varchar(128)  NOT NULL DEFAULT '' COMMENT '目录数据owner的用户名称',
    `is_canceled` tinyint(2) DEFAULT NULL COMMENT '目录下线时针对该目录的关联申请是否已撤销，0 待撤销 1 已撤销',
    `proc_def_key` varchar(128)  NOT NULL DEFAULT '' COMMENT '审核流程key',
    `flow_apply_id` varchar(50)  DEFAULT '' COMMENT '审核流程ID',
    `online_status` varchar(20) NOT NULL DEFAULT 'notline' COMMENT '接口状态 未上线 notline、已上线 online、已下线offline、上线审核中up-auditing、下线审核中down-auditing、上线审核未通过up-reject、下线审核未通过down-reject',
    `online_time` datetime DEFAULT NULL COMMENT '上线时间',
    `audit_type` varchar(50) NOT NULL DEFAULT 'unpublished' COMMENT '审核类型 unpublished 未发布 af-data-view-online上线审核 af-data-view-offline 下线审核',
    `audit_state` tinyint(2) DEFAULT NULL COMMENT '审核状态，1 审核中  2 通过  3 驳回',
    `publish_status` varchar(20) NOT NULL DEFAULT 'unpublished' COMMENT '发布状态 未发布unpublished 、发布审核中pub-auditing、已发布published、发布审核未通过pub-reject、变更审核中change-auditing、变更审核未通过change-reject',
    `app_scene_classify` tinyint(2) DEFAULT NULL COMMENT '应用场景分类 1 政务服务、2 公共服务、3 监管、4 其他',
    `source_department_id` char(36) NOT NULL COMMENT '数据资源来源部门id',
    `data_related_matters` varchar(255) NOT NULL COMMENT '数据所属事项',
    `business_matters` text NOT NULL COMMENT '业务事项',
    `data_classify` varchar(50) NOT NULL COMMENT '数据分级 标签',
    `data_domain` tinyint(2) COMMENT '数据所在领域',
    `data_level` tinyint(2) COMMENT '数据所在层级',
    `time_range` varchar(100) COMMENT '数据时间范围',
    `provider_channel` tinyint(2) COMMENT '提供渠道',
    `administrative_code` tinyint(2) COMMENT '行政区划代码',
    `central_department_code` tinyint(2) COMMENT '中央业务指导部门代码',
    `processing_level` varchar(100) COMMENT '数据加工程度',
    `catalog_tag` tinyint(2) COMMENT '目录标签',
    `is_electronic_proof` tinyint(2) COMMENT '是否电子证明编码',
    `other_app_scene_classify` varchar(100) COMMENT '其他应用场景分类',
    `other_update_cycle` varchar(100) COMMENT '其他更新频率',
    `draft_id` bigint(20) NOT NULL DEFAULT 0  COMMENT '草稿id',
    `apply_num` int(11) NOT NULL COMMENT '申请量',
    `explore_job_id` VARCHAR(64)  DEFAULT NULL COMMENT '探查作业ID',
    `explore_job_version` INT(11) DEFAULT NULL COMMENT '探查作业版本',
    `operation_authorized` tinyint(2) COMMENT '是否可授权运营字段',
    `is_import` tinyint(2) DEFAULT 0 COMMENT '是否导入',
    PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- af_data_catalog.t_data_catalog_info definition

CREATE TABLE IF NOT EXISTS `t_data_catalog_info` (
    `id` bigint(20) NOT NULL COMMENT '唯一id，雪花算法',
    `catalog_id` bigint(20) NOT NULL COMMENT '数据资源目录ID',
    `info_type` tinyint(2) NOT NULL COMMENT '关联信息类型 1 标签 2 来源业务场景 3 关联业务场景 4 关联系统 5 关联表、字段 6 业务域',
    `info_key` varchar(50)  NOT NULL COMMENT '关联信息key（仅当info_type为5时为关联目录ID，其它情况下为ID或枚举值）',
    `info_value` varchar(1000)  NOT NULL COMMENT '关联信息名称（info_type为5时表示关联目录及其信息项的json字符串）',
    UNIQUE KEY `t_data_catalog_info_un` ( `catalog_id`,  `info_type`,  `info_key` ),
    PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '目录关联信息表';

-- af_data_catalog.t_data_catalog_info_history definition

CREATE TABLE IF NOT EXISTS `t_data_catalog_info_history` (
    `id` bigint(20) NOT NULL COMMENT '唯一id，雪花算法',
    `catalog_id` bigint(20) NOT NULL COMMENT '数据资源目录ID',
    `info_type` tinyint(2) NOT NULL COMMENT '关联信息类型 1 标签 2 来源业务场景 3 关联业务场景 4 关联系统 5 关联表、字段',
    `info_key` varchar(50)  NOT NULL COMMENT '关联信息key（仅当info_type为5时为关联目录ID，其它情况下为ID或枚举值）',
    `info_value` varchar(1000)  NOT NULL COMMENT '关联信息名称（info_type为5时表示关联目录及其信息项的json字符串）',
    PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;


-- af_data_catalog.t_data_catalog_stats_info definition

CREATE TABLE IF NOT EXISTS `t_data_catalog_stats_info` (
    `id` bigint(20) NOT NULL COMMENT '唯一id，雪花算法',
    `code` varchar(50) NOT NULL COMMENT '目录编码',
    `apply_num` int(10)  NOT NULL DEFAULT 0 COMMENT '申请数',
    `preview_num` int(10)  NOT NULL DEFAULT 0 COMMENT '预览数',
    `created_at` datetime NOT NULL DEFAULT current_timestamp() COMMENT '创建时间',
    `updated_at` datetime NOT NULL DEFAULT current_timestamp() COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `t_data_catalog_stats_info_un` (`code`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '数据目录统计信息表';

-- af_data_catalog.t_data_comprehension_details definition

CREATE TABLE IF NOT EXISTS `t_data_comprehension_details` (
    `catalog_id` bigint(20) NOT NULL COMMENT '唯一id，雪花算法',
    `template_id` char(36) NOT NULL COMMENT '数据理解模板id',
    `task_id` char(36) NOT NULL COMMENT '任务id',
    `code` varchar(50)  NOT NULL COMMENT '数据目录编码',
    `status` tinyint(4) DEFAULT 1 COMMENT '报告状态，1未生成, 2已通过, 3审批中，4审批未通过',
    `details` text    NULL COMMENT 'json类型字段，数据理解详情',
    `mark` tinyint(4) DEFAULT 1 COMMENT '红点标记，1没有改动，2任务模块改动，3编目改动，4都改动',
    `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) COMMENT '创建时间',
    `creator_uid` varchar(50)  NOT NULL DEFAULT '' COMMENT '创建用户ID',
    `creator_name` varchar(128)  NOT NULL DEFAULT '' COMMENT '创建用户名称',
    `updated_at` datetime(3) DEFAULT NULL COMMENT '更新时间',
    `updater_uid` varchar(50)  DEFAULT NULL COMMENT '更新用户ID',
    `apply_id` bigint NOT NULL COMMENT '审核申请id',
    `proc_def_key` varchar(128) NOT NULL DEFAULT '' COMMENT '审核流程key',
    `audit_advice` text null COMMENT '审核意见，仅驳回时有用',
    `updater_name` varchar(128)  DEFAULT NULL COMMENT '更新用户名称',
    `deleted_at` bigint(20) NOT NULL DEFAULT 0 COMMENT '删除时间（逻辑删除）',
    PRIMARY KEY (`catalog_id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '数据理解详细信息表';

-- af_data_catalog.t_standardization_info definition

CREATE TABLE IF NOT EXISTS `t_standardization_info` (
    `id` bigint(20) NOT NULL COMMENT '唯一id，雪花算法',
    `business_domain_id` char(36)  NOT NULL COMMENT '业务域id',
    `business_domain_name` varchar(128)  NOT NULL COMMENT '业务域名称',
    `standardized_fields` int(11) NOT NULL COMMENT '已标准化字段数',
    `total_fields` int(11) NOT NULL COMMENT '总字段数',
    PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '业务域数据标准化率';

-- af_data_catalog.t_user_data_catalog_rel definition

CREATE TABLE IF NOT EXISTS `t_user_data_catalog_rel` (
    `id` bigint(20) NOT NULL COMMENT '唯一id，雪花算法',
    `uid` varchar(50)  NOT NULL COMMENT '用户ID',
    `code` varchar(50)  NOT NULL COMMENT '目录编码',
    `apply_id` bigint(20) NOT NULL COMMENT '申请记录ID',
    `created_at` datetime NOT NULL DEFAULT current_timestamp() COMMENT '记录创建时间',
    `updated_at` datetime NOT NULL DEFAULT current_timestamp() COMMENT '记录更新时间',
    `expired_at` datetime DEFAULT NULL COMMENT '权限过期时间',
    `expired_flag` tinyint(4) NOT NULL COMMENT '权限过期标记\n1 未过期\n2 已过期',
    PRIMARY KEY (`id`),
    UNIQUE KEY `t_user_data_catalog_rel_un` (`code`, `uid`, `apply_id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '用户已获目录下载权限记录表';

-- af_data_catalog.t_user_data_catalog_stats_info definition

CREATE TABLE IF NOT EXISTS `t_user_data_catalog_stats_info` (
    `id` bigint(20) NOT NULL COMMENT '唯一id，雪花算法',
    `code` varchar(50)  NOT NULL COMMENT '目录编码',
    `user_id` varchar(50)  NOT NULL COMMENT '用户ID',
    `preview_num` int(11) NOT NULL DEFAULT 0 COMMENT '预览数，默认0',
    `created_at` datetime NOT NULL DEFAULT current_timestamp() COMMENT '创建时间',
    `updated_at` datetime NOT NULL DEFAULT current_timestamp() COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_code_userid` (`code`, `user_id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '用户数据目录统计信息表';

-- af_data_catalog.tree_info definition

CREATE TABLE IF NOT EXISTS `tree_info` (
    `id` bigint(20) NOT NULL COMMENT '主键，雪花id',
    `name` varchar(128)  NOT NULL DEFAULT '' COMMENT '目录组名称',
    `root_node_id` bigint(20) NOT NULL COMMENT '目录组的根目录类别id，基本不变，冗余',
    `created_at` datetime NOT NULL DEFAULT current_timestamp() COMMENT '创建时间',
    `created_by_uid` char(36)  NOT NULL DEFAULT '' COMMENT '创建用户ID',
    `updated_at` datetime NOT NULL DEFAULT current_timestamp() COMMENT '更新时间',
    `updated_by_uid` char(36)  NOT NULL DEFAULT '' COMMENT '更新用户ID',
    `deleted_at` bigint(20) NOT NULL DEFAULT 0 COMMENT '删除时间（逻辑删除）',
    PRIMARY KEY (`id`),
    UNIQUE KEY `ux_deleted_at_name` (`deleted_at`, `name`),
    KEY `ix_created_at` (`created_at`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '目录组信息表';

-- af_data_catalog.tree_node definition

CREATE TABLE IF NOT EXISTS `tree_node` (
    `id` bigint(20) NOT NULL COMMENT '主键，雪花id',
    `tree_id` bigint(20) NOT NULL COMMENT '所属目录组',
    `parent_id` bigint(20) NOT NULL DEFAULT 0 COMMENT '父目录类别id，为0表示没有父id',
    `name` varchar(128)  NOT NULL DEFAULT '' COMMENT '目录类别名称',
    `describe` varchar(512)  NOT NULL DEFAULT '' COMMENT '目录类别描述',
    `category_num` char(36)  NOT NULL DEFAULT '' COMMENT '类目编码',
    `mgm_dep_id` char(36)  NOT NULL DEFAULT '' COMMENT '管理部门id',
    `mgm_dep_name` varchar(128)  NOT NULL DEFAULT '' COMMENT '管理部门名称',
    `sort_weight` bigint(20) NOT NULL COMMENT '排序权重',
    `created_at` datetime NOT NULL DEFAULT current_timestamp() COMMENT '创建时间',
    `created_by_uid` char(36)  NOT NULL DEFAULT '' COMMENT '创建用户ID',
    `updated_at` datetime NOT NULL DEFAULT current_timestamp() COMMENT '更新时间',
    `updated_by_uid` char(36)  NOT NULL DEFAULT '' COMMENT '更新用户ID',
    `deleted_at` bigint(20) NOT NULL DEFAULT 0 COMMENT '删除时间（逻辑删除）',
    UNIQUE KEY `ux_deleted_at_tree_id_parent_id_sort_weight` (  `deleted_at`,  `tree_id`,  `parent_id`,  `sort_weight`),
    UNIQUE KEY `ux_deleted_at_tree_id_parent_id_name` ( `deleted_at`, `tree_id`,  `parent_id`, `name`  ),
    PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '目录类别信息表';

INSERT INTO `tree_info` (`id`, `name`, `root_node_id`, `created_by_uid`, `updated_by_uid`) SELECT 1, '资源分类', 1, 'admin', 'admin' FROM DUAL WHERE NOT EXISTS (SELECT `id` FROM `tree_info` WHERE `id` = 1);
INSERT INTO `tree_node` ( `id`, `tree_id`, `parent_id`, `name`, `sort_weight`, `created_by_uid`, `updated_by_uid` ) SELECT 1, 1, 0, '资源分类', 0, 'admin', 'admin' FROM DUAL WHERE NOT EXISTS (SELECT `id` FROM `tree_node` WHERE `id` = 1);


CREATE TABLE IF NOT EXISTS `category` (
    `id` bigint(20) NOT NULL COMMENT '唯一id，雪花算法',
    `category_id` char(36) NOT NULL DEFAULT UUID() COMMENT '类目ID',
    `name` varchar(32) NOT NULL COMMENT '类目名称',
    `using` tinyint(4) NOT NULL COMMENT '类目是否停用启用，bool：0：不是；1：是',
    `type` varchar(36) NOT NULL COMMENT '类目的类型：系统、自定义',
    `required` tinyint(4) NOT NULL COMMENT '是否必填，bool：0：不是；1：是',
    `description` varchar(512) DEFAULT '' COMMENT '类目描述',
    `sort_weight` bigint(20) NOT NULL COMMENT '排序权重',
    `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) COMMENT '创建时间',
    `creator_uid` varchar(36) DEFAULT NULL COMMENT '创建用户ID',
    `creator_name` varchar(255) DEFAULT NULL COMMENT '创建用户名称',
    `updated_at` datetime NOT NULL DEFAULT current_timestamp() COMMENT '更新时间',
    `updater_uid` varchar(36) DEFAULT NULL COMMENT '更新用户ID',
    `updater_name` varchar(255) DEFAULT NULL COMMENT '更新用户名称',
    `deleted_at` bigint(20) DEFAULT NULL COMMENT '删除时间（逻辑删除）',
    `deleter_uid` varchar(36) DEFAULT NULL COMMENT '删除用户ID',
    `deleter_name` varchar(255) DEFAULT NULL COMMENT '删除用户名称',
    PRIMARY KEY (`category_id`) USING BTREE,
    UNIQUE KEY `unique_index_name_code_delete_at` (`name`, `deleted_at`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '类目信息表';

CREATE TABLE IF NOT EXISTS `category_node` (
    `id` bigint(20) NOT NULL COMMENT '唯一id，雪花算法',
    `category_node_id` char(36) NOT NULL DEFAULT UUID() COMMENT '类目树节点ID',
    `category_id` char(36) NOT NULL DEFAULT UUID() COMMENT '所属类目ID',
    `parent_id` char(36) NOT NULL DEFAULT UUID() COMMENT '父类别节点id，为0表示没有父id',
    `name` varchar(128) NOT NULL COMMENT '类目节点名称',
    `owner` varchar(128) NOT NULL COMMENT '类目节点所有者的名称',
    `owner_uid` varchar(36) DEFAULT NULL COMMENT '类目节点所有者的ID',
    `sort_weight` bigint(20) NOT NULL COMMENT '排序权重',
    `required` tinyint(4) NOT NULL DEFAULT 0 COMMENT '是否必填，0否 1是',
    `selected` tinyint(4) NOT NULL DEFAULT 0 COMMENT '是否选中，0否 1是',
    `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) COMMENT '创建时间',
    `creator_uid` varchar(36) DEFAULT NULL COMMENT '创建用户ID',
    `creator_name` varchar(255) DEFAULT NULL COMMENT '创建用户名称',
    `updated_at` datetime NOT NULL DEFAULT current_timestamp() COMMENT '更新时间',
    `updater_uid` varchar(36) DEFAULT NULL COMMENT '更新用户ID',
    `updater_name` varchar(255) DEFAULT NULL COMMENT '更新用户名称',
    `deleted_at` bigint(20) DEFAULT NULL COMMENT '删除时间（逻辑删除）',
    `deleter_uid` varchar(36) DEFAULT NULL COMMENT '删除用户ID',
    `deleter_name` varchar(255) DEFAULT NULL COMMENT '删除用户名称',
    UNIQUE KEY `ux_category_id_parent_id_name_deleted_at` ( `category_id`, `parent_id`, `name`, `deleted_at` ),
    UNIQUE KEY `ux_category_id_parent_id_sort_weight_deleted_at` ( `category_id`, `parent_id`, `sort_weight`, `deleted_at` ),
    PRIMARY KEY (`category_node_id`) USING BTREE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '类目树节点信息';

INSERT INTO `category` (`name`, `using`, `type`, `required`, `description`, `sort_weight`, `creator_uid`, `creator_name`, `updater_uid`, `updater_name`, `deleted_at`, `deleter_uid`, `deleter_name`, `category_id`, `id`) SELECT '组织架构', 1, 'system', 0, '', 2147483648, '', '', '', '', '0', '', '', '00000000-0000-0000-0000-000000000001', 000000000000000001 FROM DUAL WHERE NOT EXISTS (SELECT `category_id` FROM `category` WHERE `category_id` = '00000000-0000-0000-0000-000000000001');

INSERT INTO `category` (`name`, `using`, `type`, `required`, `description`, `sort_weight`, `creator_uid`, `creator_name`, `updater_uid`, `updater_name`, `deleted_at`, `deleter_uid`, `deleter_name`, `category_id`, `id`) SELECT '信息系统', 0, 'system', 0, '', 2147483648, '', '', '', '', '0', '', '', '00000000-0000-0000-0000-000000000002', 000000000000000002 FROM DUAL WHERE NOT EXISTS (SELECT `category_id` FROM `category` WHERE `category_id` = '00000000-0000-0000-0000-000000000002');

CREATE TABLE IF NOT EXISTS `t_data_resource` (
    `id` bigint(20) NOT NULL COMMENT '标识',
    `resource_id` varchar(125) NOT NULL COMMENT '数据资源id',
    `name` varchar(255) NOT NULL COMMENT '数据资源名称',
    `code` varchar(255) NOT NULL COMMENT '统一编目编码',
    `type` tinyint(4) NOT NULL COMMENT '数据资源类型 枚举值 1：逻辑视图 2：接口 3:文件资源',
    `view_id` char(36)  COMMENT '数据资源类型 为 2：接口 时候类型为接口生成方式来源视图id',
    `interface_count` int  COMMENT '生成接口数量',
    `department_id` char(36) NOT NULL DEFAULT '' COMMENT '所属部门',
    `subject_id` char(36) NOT NULL DEFAULT '' COMMENT '所属主题',
    `request_format` varchar(100) COMMENT '请求报文格式',
    `response_format` varchar(100) COMMENT '响应报文格式',
    `scheduling_plan` tinyint(2) COMMENT '调度计划 1 一次性、2按分钟、3按天、4按周、5按月',
    `interval` tinyint(2) COMMENT '间隔',
    `time` varchar(100) COMMENT '时间',
    `catalog_id` bigint(20) NOT NULL COMMENT '数据资源目录ID',
    `publish_at` datetime(3) NOT NULL COMMENT '发布时间',
    `status` tinyint(4) NOT NULL DEFAULT 1 COMMENT ' 视图状态,1正常,2删除',
    PRIMARY KEY (`id`),
    UNIQUE KEY `t_data_resource_code_uk` (`code`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '数据资源表';

CREATE TABLE IF NOT EXISTS `t_data_catalog_category` (
    `id` bigint(20) NOT NULL,
    `category_id` char(36) NOT NULL COMMENT '类目ID',
    `category_type` tinyint(4) NOT NULL COMMENT '类目类型 1:所属部门 2:信息系统 3:所属主题 4 ：自定义',
    `catalog_id` bigint(20) NOT NULL COMMENT '数据目录ID',
    PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '类目目录关联表';

CREATE TABLE IF NOT EXISTS `t_data_resource_history` (
    `id` bigint(20) NOT NULL COMMENT '标识',
    `resource_id` varchar(125)  NOT NULL COMMENT '数据资源id',
    `name` varchar(255) NOT NULL COMMENT '数据资源名称',
    `code` varchar(255) NOT NULL COMMENT '统一编目编码',
    `type` tinyint(4) NOT NULL COMMENT '数据资源类型 枚举值 1：逻辑视图 2：接口 3:文件资源',
    `view_id` char(36)   COMMENT '数据资源类型 为 2：接口 时候类型为接口生成方式来源视图id',
    `interface_count` int  COMMENT '生成接口数量',
    `department_id` char(36) NOT NULL DEFAULT '' COMMENT '所属部门',
    `subject_id` char(36) NOT NULL DEFAULT '' COMMENT '所属主题',
    `request_format` varchar(100) COMMENT '请求报文格式',
    `response_format` varchar(100) COMMENT '响应报文格式',
    `scheduling_plan` tinyint(2) COMMENT '调度计划 1 一次性、2按分钟、3按天、4按周、5按月',
    `interval` tinyint(2) COMMENT '间隔',
    `time` varchar(100) COMMENT '时间',
    `catalog_id` bigint(20) NOT NULL COMMENT '数据资源目录ID',
    `publish_at` datetime(3) NOT NULL COMMENT '发布时间',
    `status` tinyint(4) NOT NULL DEFAULT 1 COMMENT ' 视图状态,1正常,2删除',
    PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '数据资源表历史表';

CREATE TABLE IF NOT EXISTS `t_data_catalog_category_history` (
    `id` bigint(20) NOT NULL,
    `category_id` char(36) NOT NULL COMMENT '类目ID',
    `category_type` tinyint(4) NOT NULL COMMENT '类目类型 1:所属部门 2:信息系统 3:所属主题 4 ：自定义',
    `catalog_id` bigint(20) NOT NULL COMMENT '数据目录ID',
    PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '类目目录关联表历史表';

CREATE TABLE IF NOT EXISTS `t_api` (
    `id` char(36) NOT NULL,
    `catalog_id` bigint(20) NOT NULL COMMENT '数据资源目录ID',
    `body_type` tinyint(2) NOT NULL COMMENT '请求类型',
    `param_type` varchar(255) NOT NULL COMMENT '参数类型',
    `name` varchar(255) NOT NULL COMMENT '参数名',
    `is_array` tinyint(2) NOT NULL COMMENT '是否数组',
    `has_content` tinyint(2) DEFAULT NULL COMMENT '是否有内容',
    PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `t_api_history` (
    `id` char(36) NOT NULL,
    `catalog_id` bigint(20) NOT NULL COMMENT '数据资源目录ID',
    `body_type` tinyint(2) NOT NULL COMMENT '请求类型',
    `param_type` varchar(255) NOT NULL COMMENT '参数类型',
    `name` varchar(255) NOT NULL COMMENT '参数名',
    `is_array` tinyint(2) NOT NULL COMMENT '是否数组',
    `has_content` tinyint(2) DEFAULT NULL COMMENT '是否有内容',
    PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- [信息资源目录]
CREATE TABLE IF NOT EXISTS `t_info_resource_catalog` (
    -- [基本信息]
    f_id BIGINT NOT NULL COMMENT '主键ID',
    f_name VARCHAR(128) NOT NULL COMMENT '信息资源目录名称',
    f_code VARCHAR(255) NOT NULL COMMENT '信息资源目录编码',
    f_data_range TINYINT NOT NULL COMMENT '数据范围',
    f_update_cycle TINYINT NOT NULL COMMENT '更新周期',
    f_office_business_responsibility VARCHAR(300) NOT NULL COMMENT '处室业务职责',
    f_description VARCHAR(255) NOT NULL COMMENT '信息资源目录描述', -- [/]
    -- [共享信息]
    f_shared_type TINYINT NOT NULL COMMENT '共享属性',
    f_shared_message VARCHAR(128) NOT NULL COMMENT '共享信息：共享属性为不予共享时是不予共享依据，共享属性为有条件共享时是共享条件',
    f_shared_mode TINYINT NOT NULL COMMENT '共享方式', -- [/]
    -- [开放信息]
    f_open_type TINYINT NOT NULL COMMENT '开放属性',
    f_open_condition VARCHAR(128) NOT NULL COMMENT '开放条件', -- [/]
    -- [状态信息]
    f_publish_status TINYINT NOT NULL COMMENT '发布状态',
    f_publish_at BIGINT NOT NULL COMMENT '发布时间',
    f_online_status TINYINT NOT NULL COMMENT '上线状态',
    f_online_at BIGINT NOT NULL COMMENT '上线时间',
    f_update_at BIGINT NOT NULL COMMENT '更新时间',
    f_delete_at BIGINT NOT NULL COMMENT '删除时间',
    f_audit_id BIGINT NOT NULL COMMENT '审核ID',
    f_audit_msg VARCHAR(2400) NOT NULL COMMENT '最后一次审核意见', -- [/]
    -- [变更新增字段]
    f_current_version tinyint(2) NOT NULL DEFAULT '1' COMMENT '是否现行版本 0 否 1 是',
    f_alter_uid VARCHAR(36) NOT NULL DEFAULT '' COMMENT '变更创建人ID',
    f_alter_name VARCHAR(255) NOT NULL DEFAULT '' COMMENT '变更创建人名称',
    f_alter_at BIGINT NOT NULL DEFAULT '0' COMMENT '变更创建时间',
    f_pre_id BIGINT NOT NULL DEFAULT '0' COMMENT '前一版本ID',
    f_next_id BIGINT NOT NULL DEFAULT '0' COMMENT '后一版本ID',
    label_ids varchar(150)  NULL COMMENT '标签ID',
    f_alter_audit_msg text null COMMENT '最后一次变更审核意见', -- [/]
    PRIMARY KEY (f_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '信息资源目录';
-- [/]

-- [信息资源目录来源信息(来源业务表/来源部门)]
CREATE TABLE IF NOT EXISTS `t_info_resource_catalog_source_info` (
    f_id BIGINT NOT NULL COMMENT '信息资源目录ID',
    -- [来源业务表]
    f_business_form_id CHAR(36) NOT NULL COMMENT '来源业务表ID',
    f_business_form_name VARCHAR(128) NOT NULL COMMENT '来源业务表名称', -- [/]
    -- [来源部门]
    f_department_id CHAR(36) NOT NULL COMMENT '来源部门ID',
    f_department_name VARCHAR(128) NOT NULL COMMENT '来源部门名称', -- [/]
    PRIMARY KEY (f_id),
    UNIQUE KEY uk_business_form_id (f_business_form_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '信息资源目录来源信息';
-- [/]

-- [信息资源目录关联项(所属部门/所属处室/业务流程/信息系统/数据资源目录/信息类/信息项)]
CREATE TABLE IF NOT EXISTS `t_info_resource_catalog_related_item` (
    f_id BIGINT NOT NULL AUTO_INCREMENT COMMENT '自增主键',
    f_info_resource_catalog_id BIGINT NOT NULL COMMENT '信息资源目录ID',
    -- [关联项信息]
    f_related_item_id VARCHAR(50) NOT NULL COMMENT '关联项ID',
    f_related_item_name VARCHAR(255) NOT NULL COMMENT '关联项名称',
    f_relation_type int NOT NULL COMMENT '关联类型', -- [/]
    f_related_item_data_type varchar(128) not null default '' comment '关联信息项类型',
    UNIQUE KEY uk_info_resource_catalog_related_item ( f_info_resource_catalog_id, f_related_item_id,  f_relation_type ),
    PRIMARY KEY (f_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '信息资源目录关联项';
-- [/]

-- [信息资源关联类目节点]
CREATE TABLE IF NOT EXISTS `t_info_resource_catalog_category_node` (
    f_id BIGINT NOT NULL AUTO_INCREMENT COMMENT '自增主键',
    f_category_node_id VARCHAR(50) NOT NULL COMMENT '类目节点ID',
    f_category_cate_id CHAR(36) NOT NULL COMMENT '类目分类ID',
    f_info_resource_catalog_id BIGINT NOT NULL COMMENT '信息资源目录ID',
    UNIQUE KEY uk_category_info_resource_catalog (  f_category_node_id,  f_category_cate_id, f_info_resource_catalog_id ),
    PRIMARY KEY (f_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '信息资源目录关联类目';
-- [/]

-- [业务场景]
CREATE TABLE IF NOT EXISTS `t_business_scene` (
    f_id BIGINT NOT NULL AUTO_INCREMENT COMMENT '自增主键',
    f_type TINYINT NOT NULL COMMENT '业务类型',
    f_value VARCHAR(128) NOT NULL COMMENT '业务场景',
    f_info_resource_catalog_id BIGINT NOT NULL COMMENT '所属信息资源目录ID',
    f_related_type TINYINT NOT NULL COMMENT '关联类型',
    PRIMARY KEY (f_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '业务场景';
-- [/]

-- [信息资源目录下属信息项]
CREATE TABLE IF NOT EXISTS `t_info_resource_catalog_column` (
    f_id BIGINT NOT NULL COMMENT '主键ID',
    f_name VARCHAR(255) NOT NULL COMMENT '信息项名称',
    -- [变更新增字段]
    f_field_name_en VARCHAR(128) NOT NULL DEFAULT '' COMMENT '对应业务表字段英文名称',
    f_field_name_cn VARCHAR(255) NOT NULL DEFAULT '' COMMENT '对应业务表字段中文名称', -- [/]
    -- [字段元数据]
    f_data_type TINYINT NOT NULL COMMENT '数据类型',
    f_data_length BIGINT NOT NULL COMMENT '数据长度',
    f_data_range VARCHAR(128) NOT NULL COMMENT '数据值域', -- [/]
    -- [字段属性]

    f_is_sensitive TINYINT NOT NULL COMMENT '是否敏感属性：0-否；1-是',
    f_is_secret TINYINT NOT NULL COMMENT '是否涉密属性：0-否；1-是',
    f_is_incremental TINYINT NOT NULL COMMENT '是否增量属性：0-否；1-是',
    f_is_primary_key TINYINT NOT NULL COMMENT '是否主键属性：0-否；1-是',
    `f_is_local_generated` TINYINT NOT NULL COMMENT '是否本部门产生：0-否；1-是',
    f_is_standardized TINYINT NOT NULL COMMENT '是否标准化属性：0-否；1-是', -- [/]
    f_info_resource_catalog_id BIGINT NOT NULL COMMENT '所属信息资源目录ID',
    f_order SMALLINT NOT NULL COMMENT '排序索引',
    UNIQUE KEY uk_info_resource_catalog_column (  f_name,  f_info_resource_catalog_id ),
    PRIMARY KEY (f_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '信息资源目录下属信息项';
-- [/]

-- [信息项关联信息]
CREATE TABLE IF NOT EXISTS `t_info_resource_catalog_column_related_info` (
    f_id BIGINT NOT NULL COMMENT '信息项ID',
    -- [关联代码集]
    f_code_set_id BIGINT NOT NULL COMMENT '关联代码集ID',
    f_code_set_name VARCHAR(128) NOT NULL COMMENT '关联代码集名称', -- [/]
    -- [关联数据元]
    f_data_refer_id BIGINT NOT NULL COMMENT '关联数据元ID',
    f_data_refer_name VARCHAR(128) NOT NULL COMMENT '关联数据元名称', -- [/]
    PRIMARY KEY (f_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '信息资源目录下属信息项关联信息';
-- [/]

-- [未编目业务表]
CREATE TABLE IF NOT EXISTS `t_business_form_not_cataloged` (
    f_id CHAR(36) NOT NULL COMMENT '业务表ID',
    f_name VARCHAR(128) NOT NULL COMMENT '业务表名称',
    f_description  VARCHAR(255) DEFAULT '' COMMENT '业务表描述',
    f_info_system_id text null COMMENT '信息系统ID数组',
    f_department_id CHAR(36) DEFAULT NULL COMMENT '所属部门ID',
    f_business_domain_id  CHAR(36)  DEFAULT '' COMMENT '主干业务ID',
    f_business_model_id  CHAR(36)  DEFAULT '' COMMENT '业务模型ID',
    f_update_at BIGINT NOT NULL COMMENT '更新时间',
    PRIMARY KEY (f_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '未编目业务表';
-- [/]


CREATE TABLE IF NOT EXISTS `t_catalog_feedback` (
  `id` bigint(20) NOT NULL COMMENT '唯一id，雪花算法',
  `catalog_id` bigint(20) NOT NULL COMMENT '目录ID',
  `feedback_type` VARCHAR(10) NOT NULL COMMENT '反馈类型',
  `feedback_desc` VARCHAR(300) NOT NULL COMMENT '反馈描述',
  `status` tinyint(2) NOT NULL COMMENT '反馈状态 1 待处理 9 已回复',
  `created_at` DATETIME(3) NOT NULL DEFAULT current_timestamp(3) COMMENT '创建/反馈时间',
  `created_by` CHAR(36) NOT NULL COMMENT '创建/反馈人ID',
  `updated_at` DATETIME(3) NOT NULL DEFAULT current_timestamp(3) COMMENT '更新时间',
  `replied_at` DATETIME(3) DEFAULT NULL COMMENT '反馈回复时间',
  PRIMARY KEY (`id`),
  KEY `idx_feedback_type` (`feedback_type`),
  KEY `idx_feedback_status` (`status`),
  KEY `idx_feedback_created_by` (`created_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='目录反馈记录表';

CREATE TABLE IF NOT EXISTS `t_catalog_feedback_op_log` (
  `id` bigint(20) NOT NULL COMMENT '唯一id，雪花算法',
  `feedback_id` bigint(20) NOT NULL COMMENT '目录反馈ID',
  `uid` VARCHAR(36) NOT NULL COMMENT '操作人ID',
  `op_type` tinyint(2) NOT NULL COMMENT '操作类型 1 反馈创建/提交 9 反馈回复',
  `extend_info` TEXT NOT NULL COMMENT '扩展信息，json字符串\n字段说明：reply_content 反馈内容（仅处理类型为反馈回复时有）',
  `created_at` DATETIME(3) NOT NULL DEFAULT current_timestamp(3) COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_log_feedback_id` (`feedback_id`),
  KEY `idx_log_op_type` (`op_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='目录反馈操作记录表';


-- af_data_catalog.t_open_catalog definition

CREATE TABLE IF NOT EXISTS `t_open_catalog` (
    `id` bigint(20) NOT NULL COMMENT '唯一id，雪花算法',
    `catalog_id` bigint(20) NOT NULL COMMENT '数据资源目录ID',
    `open_type` tinyint(2) NOT NULL COMMENT '开放方式 1 无条件开放 2 有条件开放',
    `open_level` tinyint(2) DEFAULT NULL COMMENT '开放级别 1 实名认证开放 2 审核开放',
    `open_status` varchar(20) NOT NULL DEFAULT 'notOpen' COMMENT '开放状态 未开放 notOpen、已开放 opened',
    `open_at` datetime(3) DEFAULT NULL COMMENT '开放时间',
    `audit_apply_sn` bigint(20) NOT NULL DEFAULT 0 COMMENT '发起审核申请序号',
    `audit_advice` text null COMMENT '审核意见，仅驳回时有用',
    `proc_def_key` varchar(128)  NOT NULL DEFAULT '' COMMENT '审核流程key',
    `flow_apply_id` varchar(50)  DEFAULT '' COMMENT '审核流程ID',
    `flow_node_id` varchar(50)  DEFAULT NULL COMMENT '目录当前所处审核流程结点ID',
    `flow_node_name` varchar(200)  DEFAULT NULL COMMENT '目录当前所处审核流程结点名称',
    `flow_id` varchar(50)  DEFAULT NULL COMMENT '审批流程实例ID',
    `flow_name` varchar(200)  DEFAULT NULL COMMENT '审批流程名称',
    `flow_version` varchar(10)  DEFAULT NULL COMMENT '审批流程版本',
    `audit_state` tinyint(2) DEFAULT NULL COMMENT '审核状态， 1 审核中  2 通过  3 驳回 4 未完成',
    `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) COMMENT '创建时间',
    `creator_uid` varchar(50)  NOT NULL DEFAULT '' COMMENT '创建用户ID',
    `updated_at` datetime(3) DEFAULT NULL COMMENT '更新时间',
    `updater_uid` varchar(50)  DEFAULT NULL COMMENT '更新用户ID',
    `deleted_at` datetime(3) DEFAULT NULL COMMENT '删除时间',
    `delete_uid` varchar(50)  DEFAULT NULL COMMENT '删除用户ID',
    PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='开放目录表';


-- af_data_catalog.t_data_catalog_score definition

CREATE TABLE IF NOT EXISTS `t_data_catalog_score` (
    `id` bigint(20) NOT NULL COMMENT '唯一id，雪花算法',
    `catalog_id` bigint(20) NOT NULL COMMENT '数据资源目录ID',
    `score` tinyint(2) NOT NULL COMMENT '评分',
    `scored_uid` varchar(50)  NOT NULL DEFAULT '' COMMENT '评分用户ID',
    `scored_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) COMMENT '评分时间',
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='目录评分记录表';


CREATE TABLE IF NOT EXISTS `elec_licence`(
    `id` bigint(20) NOT NULL COMMENT '标识',
    `elec_licence_id` varchar(50)  NOT NULL COMMENT 'id',
    `licence_name` varchar(255)  NULL DEFAULT NULL COMMENT '证照名称（源字段name）',
    `licence_basic_code` varchar(255)  NULL DEFAULT NULL COMMENT '证照目录基本码（源字段license_item_code）',
    `licence_abbreviation` varchar(255)  NULL DEFAULT NULL COMMENT '证照简称（源字段short_name）',
    `group_id` varchar(50)  NULL DEFAULT NULL COMMENT '资源分类id',
    `group_name1` varchar(100)  NULL DEFAULT NULL COMMENT '资源分类名称',
    `industry_department_id` char(36)  NULL DEFAULT NULL,
    `industry_department` varchar(255)  NULL DEFAULT NULL COMMENT '行业部门（源字段resp_org）',
    `certification_level` varchar(255)  NULL DEFAULT NULL COMMENT '发证级别（源字段issue_rank）',
    `holder_type` varchar(255)  NULL DEFAULT NULL COMMENT '持证者类型定义：0 个人, 1 机构, 2 个人和机构（源字段holder_type）',
    `licence_type` varchar(255)  NULL DEFAULT NULL COMMENT '证照类型定义：1 证明文件, 2 批文批复,3 鉴定报告,4 其他文件（源字段type）',
    `use_limit` varchar(255)  NULL DEFAULT NULL COMMENT '使用限制',
    `prov_overall_plan_sign_issue` varchar(255)  NULL DEFAULT NULL COMMENT '省统筹签发',
    `release_cancel_time` varchar(255)  NULL DEFAULT NULL COMMENT '发布/注销时间',
    `remark` text  NULL DEFAULT NULL COMMENT '备注（源字段remark）',
    `licence_state` varchar(255)  NULL DEFAULT NULL COMMENT '证照状态定义：0 未发布,2 已发布,3 已注销 （源字段status）',
    `inception_state` varchar(255)  NULL DEFAULT NULL COMMENT '开通状态定义：0 未开通, 1 已开通',
    `department` varchar(255)  NULL DEFAULT NULL COMMENT '所属部门',
    `new_dept_id` varchar(255)  NULL DEFAULT NULL COMMENT '目录编制部门id（编办版）',
    `new_dept` varchar(255)  NULL DEFAULT NULL COMMENT '目录编制部门名称（编办版）',
    `version` varchar(50)  NULL DEFAULT NULL COMMENT '电子证照目录版本号（源字段version）',
    `use_constraint_type` varchar(50)  NULL DEFAULT NULL COMMENT '共享使用类型（源字段use_constraint_type）',
    `description` varchar(1000)  NULL DEFAULT NULL COMMENT '证照描述（源字段description）',
    `icon_image` text  NULL DEFAULT NULL COMMENT '证照缩略图（源字段icon_image）',
    `admin_org` varchar(100)  NULL DEFAULT NULL COMMENT '目录编制部门名称（源字段admin_org）',
    `admin_org_code` varchar(50)  NULL DEFAULT NULL COMMENT '目录编制部门组织机构代码（源字段admin_org_code）',
    `division` varchar(50)  NULL DEFAULT NULL COMMENT '目录编制部门行政区划（源字段division）',
    `division_code` varchar(50)  NULL DEFAULT NULL COMMENT '目录编制部门行政区划代码（源字段division_code）',
    `publish_data` datetime(0) NULL DEFAULT NULL COMMENT '共享使用类型（源字段publish_data）',
    `creator` varchar(50)  NULL DEFAULT NULL COMMENT '创建人',
    `creator_name` varchar(50)  NULL DEFAULT NULL COMMENT '创建人名称',
    `creator_part` varchar(50)  NULL DEFAULT NULL COMMENT '创建人部门',
    `creator_part_name` varchar(50)  NULL DEFAULT NULL COMMENT '创建人部门名称',
    `create_time` datetime(0) NULL DEFAULT NULL COMMENT '创建时间',
    `updater` varchar(50)  NULL DEFAULT NULL COMMENT '修改人',
    `updater_name` varchar(50)  NULL DEFAULT NULL COMMENT '修改人名称',
    `updater_part` varchar(50)  NULL DEFAULT NULL COMMENT '修改人部门',
    `updater_part_name` varchar(50)  NULL DEFAULT NULL COMMENT '修改人部门名称',
    `update_time` datetime(0) NULL DEFAULT NULL COMMENT '修改时间',
    `deleter` varchar(50)  NULL DEFAULT NULL COMMENT '删除人',
    `deleter_name` varchar(50)  NULL DEFAULT NULL COMMENT '删除人名称',
    `deleter_part` varchar(50)  NULL DEFAULT NULL COMMENT '删除人部门',
    `deleter_part_name` varchar(50)  NULL DEFAULT NULL COMMENT '删除人部门名称',
    `delete_time` datetime(0) NULL DEFAULT NULL COMMENT '删除时间',
    `orgcode` varchar(50)  NULL DEFAULT NULL COMMENT '所属部门',
    `orgname` varchar(50)  NULL DEFAULT NULL COMMENT '所属部门名称',
    `creation_time` datetime(0) NULL DEFAULT NULL COMMENT '创建时间（源字段creation_time）',
    `last_modificator` varchar(50)  NULL DEFAULT NULL COMMENT '最后修改者（源字段last_modificator）',
    `last_modification_time` varchar(50)  NULL DEFAULT NULL COMMENT '最后修改时间（源字段last_modification_time）',
    `shared_type` smallint(2) NULL DEFAULT NULL COMMENT '共享情况：1 依事项共享；2 有条件共享',
    `is_provincial_management` smallint(2) NULL DEFAULT 2 COMMENT '是否省管：1是；2不是',
    `new_org_id` varchar(50)  NULL DEFAULT NULL,
    `new_org` varchar(255)  NULL DEFAULT NULL COMMENT '目录编制部门名称（统一认证版）',
    `is_new_add` varchar(2)  NULL DEFAULT 'y' COMMENT '是否新增',
    `apply_num_base` double NULL DEFAULT NULL COMMENT '申请量基数',
    `res_quality` smallint(2) NULL DEFAULT NULL COMMENT '??Դ????  1:???? 2:?Ƶ? 3:?̵',
    `apply_num` double NULL DEFAULT NULL COMMENT '申请量',
    `score` double NULL DEFAULT 0 COMMENT '评分',
    `evaluators_num` varchar(255)  NULL DEFAULT NULL COMMENT '评价人数',
    `is_collection` varchar(255)  NULL DEFAULT NULL COMMENT '是否收藏',
    `type` varchar(255)  NULL DEFAULT NULL COMMENT '证照主体（法人/个人）',
    `release_department` varchar(255)  NULL DEFAULT NULL COMMENT '颁发部门',
    `release_department_name` varchar(255)  NULL DEFAULT NULL COMMENT '颁发部门名称',
    `release_time` datetime(0) NULL DEFAULT NULL COMMENT '发布时间',
    `audit_department` varchar(255)  NULL DEFAULT NULL COMMENT '审核部门',
    `audit_department_name` varchar(255)  NULL DEFAULT NULL COMMENT '审核部门名称',
    `expire` varchar(255)  NULL DEFAULT NULL COMMENT '有效期',
    `catalogue_id` varchar(50)  NULL DEFAULT NULL COMMENT '关联目录id',
    `delete_flag` varchar(2)  NULL DEFAULT '0' COMMENT '删除标志 0-未删除 1-已删除',
    `flow_node_id` varchar(50)  NULL DEFAULT NULL COMMENT '目录当前所处审核流程结点ID',
    `flow_node_name` varchar(200)  NULL DEFAULT NULL COMMENT '目录当前所处审核流程结点名称',
    `flow_id` varchar(50)  NULL DEFAULT NULL COMMENT '审批流程实例ID',
    `flow_name` varchar(200)  NULL DEFAULT NULL COMMENT '审批流程名称',
    `flow_version` varchar(10)  NULL DEFAULT NULL COMMENT '审批流程版本',
    `audit_advice` text  NULL DEFAULT NULL COMMENT '审核意见，仅驳回时有用',
    `proc_def_key` varchar(128)  NOT NULL DEFAULT '' COMMENT '审核流程key',
    `flow_apply_id` varchar(50)  NULL DEFAULT '' COMMENT '审核流程ID',
    `audit_type` varchar(50)  NOT NULL DEFAULT 'unpublished' COMMENT '审核类型 unpublished 未发布 af-data-view-online上线审核 af-data-view-offline 下线审核',
    `audit_state` tinyint(2) NULL DEFAULT NULL COMMENT '审核状态，1 审核中  2 通过  3 驳回',
    `online_status` varchar(20)  NOT NULL DEFAULT 'notline' COMMENT '接口状态 未上线 notline、已上线 online、已下线offline、上线审核中up-auditing、下线审核中down-auditing、上线审核未通过up-reject、下线审核未通过down-reject',
    `online_time` datetime(0) NULL DEFAULT NULL COMMENT '上线时间',
    PRIMARY KEY (`elec_licence_id`)
    ) ENGINE=InnoDB   COMMENT='电子证照目录表';

CREATE TABLE IF NOT EXISTS `elec_licence_column`(
    `id` bigint(20) NOT NULL COMMENT '标识',
    `elec_licence_column_id` varchar(50)  NOT NULL COMMENT 'id',
    `elec_licence_id` varchar(50)  NULL DEFAULT NULL COMMENT '证照id',
    `technical_name` varchar(255)  NOT NULL COMMENT '技术名称',
    `business_name` varchar(255)  NULL DEFAULT NULL COMMENT '业务名称',
    `phonetic_abbreviation` varchar(100)  NULL DEFAULT NULL COMMENT '拼音缩写（源字段key）',
    `control_type` varchar(100)  NULL DEFAULT NULL COMMENT '控件类型代码（源字段type_code）',
    `data_type` varchar(100)  NULL DEFAULT NULL COMMENT '数据类型（源字段data_type）',
    `size` int(15) NULL DEFAULT NULL COMMENT '长度（源字段length）',
    `accuracy` varchar(10)  NULL DEFAULT NULL COMMENT '精度（源字段precision）',
    `correspond_standard_attribute` varchar(100)  NULL DEFAULT NULL COMMENT '对应标准属性',
    `example_data` varchar(500)  NULL DEFAULT NULL COMMENT '样例数据',
    `is_show` varchar(100)  NULL DEFAULT NULL COMMENT '是否显示在数据页面（源字段is_show）',
    `is_controlled` varchar(100)  NULL DEFAULT NULL COMMENT '可控',
    `value_range` varchar(100)  NULL DEFAULT NULL COMMENT '值域',
    `licence_basic_code` varchar(255)  NULL DEFAULT NULL COMMENT '证照编码',
    `item_id` varchar(255)  NULL DEFAULT NULL COMMENT '控件唯一标识（源字段item_id）',
    `index` varchar(255)  NULL DEFAULT NULL COMMENT '信息项对应的标准属性（源字段index）',
    `colspan` varchar(255)  NULL DEFAULT NULL COMMENT '数据项所占列数（源字段colspan）',
    `placeholder` varchar(255)  NULL DEFAULT NULL COMMENT '输入框提示（源字段placeholder）',
    `description` varchar(255)  NULL DEFAULT NULL COMMENT '信息语义（源字段description）',
    `is_allow_null` varchar(255)  NULL DEFAULT NULL COMMENT '可空（源字段is_allow_null）',
    `file_suffix` varchar(255)  NULL DEFAULT NULL COMMENT '文件后缀（源字段file_suffix）',
    `file_data` varchar(255)  NULL DEFAULT NULL COMMENT '文件数据（源字段file_data）',
    `addon` varchar(255)  NULL DEFAULT NULL COMMENT '后缀（源字段addon）',
    `rows` varchar(255)  NULL DEFAULT NULL COMMENT '行（源字段rows）',
    `options` varchar(1000)  NULL DEFAULT NULL COMMENT 'options',
    `head` varchar(255)  NULL DEFAULT NULL COMMENT '表格头部（源字段head）',
    `is_init_item` varchar(255)  NULL DEFAULT NULL COMMENT '是否初始项（源字段is_init_item）',
    `cols` varchar(255)  NULL DEFAULT NULL COMMENT '列（源字段cols）',
    `date_view_format` varchar(255)  NULL DEFAULT NULL COMMENT '时间显示类型（源字段date_view_format）',
    `is_sensitive` varchar(255)  NULL DEFAULT NULL COMMENT '是否敏感信息（源字段is_sensitive）',
    `data_edit_type` varchar(255)  NULL DEFAULT NULL COMMENT '多行文本框编辑类型（源字段data_edit_type）',
    `childrens` varchar(255)  NULL DEFAULT NULL COMMENT '子元素（主从控件用）（源字段childrens）',
    `type` varchar(10)  NULL DEFAULT NULL COMMENT '信息项类型（1-照面信息项; 2-明细信息项）',
    `delete_flag` varchar(2)  NULL DEFAULT '0' COMMENT '删除标志 0-未删除 1-已删除',
    `creator` varchar(50)  NULL DEFAULT NULL COMMENT '创建人',
    `creator_name` varchar(50)  NULL DEFAULT NULL COMMENT '创建人名称',
    `creator_part` varchar(50)  NULL DEFAULT NULL COMMENT '创建人部门',
    `creator_part_name` varchar(50)  NULL DEFAULT NULL COMMENT '创建人部门名称',
    `create_time` datetime(0) NULL DEFAULT NULL COMMENT '创建时间',
    `updater` varchar(50)  NULL DEFAULT NULL COMMENT '修改人',
    `updater_name` varchar(50)  NULL DEFAULT NULL COMMENT '修改人名称',
    `updater_part` varchar(50)  NULL DEFAULT NULL COMMENT '修改人部门',
    `updater_part_name` varchar(50)  NULL DEFAULT NULL COMMENT '修改人部门名称',
    `update_time` datetime(0) NULL DEFAULT NULL COMMENT '修改时间',
    `deleter` varchar(50)  NULL DEFAULT NULL COMMENT '删除人',
    `deleter_name` varchar(50)  NULL DEFAULT NULL COMMENT '删除人名称',
    `deleter_part` varchar(50)  NULL DEFAULT NULL COMMENT '删除人部门',
    `deleter_part_name` varchar(50)  NULL DEFAULT NULL COMMENT '删除人部门名称',
    `delete_time` datetime(0) NULL DEFAULT NULL COMMENT '删除时间',
    `orgcode` varchar(50)  NULL DEFAULT NULL COMMENT '所属部门',
    `orgname` varchar(50)  NULL DEFAULT NULL COMMENT '所属部门名称',
    `af_data_type` varchar(255)  NULL DEFAULT NULL,
    PRIMARY KEY (`id`) USING BTREE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='电子证照信息项表';

CREATE TABLE IF NOT EXISTS `classify`
(
    `id`          bigint(20) NOT NULL,
    `classify_id` char(36)     NOT NULL COMMENT 'uuid',
    `name`        varchar(255) NOT NULL  COMMENT '行业部门类别名称',
    `parent_id`   char(36)     NOT NULL COMMENT '父节点classify_id',
    `path_id`     varchar(255)   NOT NULL  COMMENT '路径classify_id',
    `path`        text         NOT NULL  COMMENT '路径',
    `created_at`  datetime(3) NOT NULL  COMMENT '创建时间',
    `created_by`  char(36)     NOT NULL  COMMENT '创建人',
    `deleted_at`  bigint(20) DEFAULT NULL  COMMENT '删除时间',
    `deleted_by`  char(36) DEFAULT NULL  COMMENT '删除人',
    PRIMARY KEY (`id`),
    KEY `idx_classify_id` (`classify_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci  COMMENT='行业部门类别表';

CREATE TABLE IF NOT EXISTS `t_my_favorite` (
  `id` bigint(20) NOT NULL COMMENT '唯一id，雪花算法',
  `res_type` tinyint(2) NOT NULL COMMENT '资源类型 1 数据资源目录 2 信息资源目录 3 电子证照目录',
  `res_id` VARCHAR(64) NOT NULL COMMENT '资源ID',
  `created_at` DATETIME(3) NOT NULL DEFAULT current_timestamp(3) COMMENT '创建/收藏时间',
  `created_by` CHAR(36) NOT NULL COMMENT '创建/收藏人ID',
  UNIQUE KEY `uni_my_favorite` (`created_by`,`res_type`,`res_id`),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='我的收藏记录表';

CREATE TABLE IF NOT EXISTS `audit_log`
(
    `id`                  bigint(20) NOT NULL,
    `catalog_id`          bigint(20) NOT NULL COMMENT '目录id',
    `audit_type`          varchar(255) NOT NULL COMMENT '审核类型',
    `audit_state`         int(11) NOT NULL COMMENT '审核状态',
    `audit_time`          datetime(3) NOT NULL COMMENT '审核时间',
    `audit_resource_type` int(11) NOT NULL COMMENT '审核的资源类型',
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='审核日志表';

create table if not EXISTS `t_data_push_model`(
    `id`    bigint(20) NOT NULL COMMENT '主键ID',
    `name` varchar(128) NOT NULL COMMENT '模型名',
    `description` varchar(300) DEFAULT NULL COMMENT '描述',
    `responsible_person_id` char(36) NOT NULL COMMENT '责任人',
    `channel` tinyint(4)  NOT NULL default 1 COMMENT '数据来源渠道,1web 2share_apply 3catalog_report  不填默认是web',
    `push_error`   text   NULL COMMENT '推送错误信息，为空代表推送模型正确',
    `push_status`  tinyint(4) NOT NULL default 0 COMMENT '推送状态,1待发布，2未开始，3进行中，4已结束，5已停用',
    `operation` tinyint(4) NOT NULL  default 0 COMMENT '操作,1发布审核，2变更审核，3停用审核，4启用审核',
    -- 推送策略
    `transmit_mode` tinyint(2) NOT NULL  default 0   COMMENT '传输模式（1 增量 ; 2 全量）',
    `increment_field` char(36)  default ''  COMMENT '增量字段，传输模式是增量时候填写',
    `increment_timestamp` bigint(20)  DEFAULT 0 COMMENT '增量时间，传输模式是增量时候填写',
    `primary_key` varchar(128)  default ''  COMMENT '主键，技术名称，传输模式是增量时候填写',
    -- 调度策略
    `schedule_type` varchar(32) NOT NULL  COMMENT '调度计划:ONCE一次性,PERIOD增量',
    `schedule_time`  varchar(64) NOT NULL DEFAULT 0  COMMENT '调度时间，格式 2006-01-02 15:04:05; 空:立即执行;非空:定时执行',
    `schedule_start` varchar(64) DEFAULT NULL COMMENT '计划开始日期，格式 2006-01-02',
    `schedule_end`   varchar(64) DEFAULT NULL COMMENT '计划结束日期，格式 2006-01-02',
    `draft_schedule`  text   NULL COMMENT '调度草稿',
    `crontab_expr`   varchar(64) DEFAULT '' COMMENT 'linux crontab表达式, 6级',
    -- 推送内容
    `source_catalog_id`   bigint(20) NOT NULL COMMENT '目录主键ID',
    `source_department_id` char(36)  NOT NULL COMMENT '来源表目录所在的部门ID',
    `source_datasource_id` bigint(20)  NOT NULL COMMENT '来源表所在的数据源雪花ID',
    `source_datasource_uuid` char(36)  NOT NULL COMMENT '来源表所在的数据源UUID',
    `source_hua_ao_id` varchar(255) default NULL COMMENT '来源数据的华傲ID',
    `source_table_id` char(36) NOT NULL COMMENT '来源表ID，视图的uuid',
    `source_table_name` varchar(128)  NOT NULL default '' COMMENT '来源表技术名称',
    `target_datasource_id` bigint(20) NOT NULL COMMENT '目标表所在的数据源雪花ID',
    `target_sandbox_id` char(36)  NOT NULL default '' COMMENT '目标表数据源所在沙箱ID',
    `target_department_id` char(36)  NOT NULL COMMENT  '目标表数据源所在的部门ID',
    `target_datasource_uuid` char(36) NOT NULL COMMENT '目标表所在的数据源UUID',
    `target_hua_ao_id` varchar(255) default NULL COMMENT '目标数据的华傲ID',
    `target_table_exists` tinyint(4) NOT NULL  default 0 COMMENT '目标表在本次推送是否存在，0不存在，1存在',
    `target_table_name` varchar(128)  NOT NULL default '' COMMENT '目标表名称',
    `filter_condition` text    NULL COMMENT '过滤表达式，SQL后面的where条件',
    `is_desensitization` tinyint(4) NOT NULL default 0 COMMENT '是否脱敏，0为否，1为是',
    -- dolphin 相关
    `create_sql`   text null COMMENT ' 加工模型的建表语句',
    `insert_sql`   text null COMMENT '加工模型的插入语句',
    `update_sql`   text null COMMENT '加工模型的更新语句',
    `update_existing_data_flag`   tinyint(4) NOT NULL default 0 COMMENT '是否更新已存在的数据，0不更新，1更新',
    `dolphin_workflow_id` char(36) NOT NULL  default '' COMMENT 'dolphin的工作流ID',
    -- 审核字段
    `audit_state` tinyint(4) NOT NULL default 0 COMMENT '审核状态,1审核中，2审核通过，3未通过',
    `apply_id`    varchar(64) DEFAULT '' COMMENT '审核流程ID',
    `audit_advice` text null COMMENT '审核意见，仅驳回时有用',
    `proc_def_key` varchar(128)  NOT NULL DEFAULT '' COMMENT '审核流程key',
    -- 基础字段
    `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) COMMENT '创建时间' ,
    `creator_uid` varchar(36) DEFAULT NULL COMMENT '创建用户ID',
    `creator_name` varchar(255) DEFAULT NULL COMMENT '创建用户名称',
    `f_third_user_id` varchar(255) default NULL COMMENT '创建者第三方用户ID',
    `f_third_dept_id` varchar(255) default NULL COMMENT '创建者第三方部门ID',
    `updated_at` datetime NOT NULL DEFAULT current_timestamp() COMMENT '更新时间',
    `updater_uid` varchar(36) DEFAULT NULL COMMENT '更新用户ID',
    `updater_name` varchar(255) DEFAULT NULL COMMENT '更新用户名称',
    `deleted_at`  bigint(20)   DEFAULT NULL COMMENT '删除时间（逻辑删除）' ,
    PRIMARY KEY (`id`) USING BTREE
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='数据推送表';


create table if not EXISTS `t_data_push_fields`(
    `id`    bigint(20) NOT NULL COMMENT '主键ID',
    `model_id`   bigint(20) NOT NULL COMMENT '推送模型ID',
    `source_tech_name`  varchar(255) NOT NULL  COMMENT '来源列技术名称',
    `technical_name` varchar(255) NOT NULL  COMMENT '列技术名称',
    `business_name` varchar(255) DEFAULT NULL  COMMENT '列业务名称',
    `data_type` varchar(255) NOT NULL COMMENT '数据类型',
    `data_length` int(11) NOT NULL COMMENT '数据长度',
    `data_accuracy` int(11) default NULL COMMENT '数据精度（仅DECIMAL类型）',
    `primary_key` tinyint(2) default 0 COMMENT '是否是主键,0不是，1是',
    `is_nullable` varchar(30) NOT NULL COMMENT '是否为空',
    `comment` varchar(128) DEFAULT '' COMMENT '字段注释',
    `desensitization_rule_id` char(36) NOT NULL default '' COMMENT '脱敏规则id',
    PRIMARY KEY (`id`) USING BTREE,
    KEY   `idx_model_id` (`model_id`)
    )ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='数据推送目的字段表';


CREATE TABLE IF NOT EXISTS `t_file_resource` (
    `id` bigint(20) NOT NULL COMMENT '唯一id，雪花算法',
    `name` varchar(500)  NOT NULL COMMENT '文件资源名称',
    `code` varchar(50)  NOT NULL COMMENT '文件资源编码',
    `department_id` char(36)  NOT NULL COMMENT '所属部门ID',
    `description` varchar(1000)  DEFAULT NULL COMMENT '文件资源描述',
    `publish_status` varchar(20) NOT NULL DEFAULT 'unpublished' COMMENT '发布状态 未发布unpublished 、发布审核中pub-auditing、已发布published、发布审核未通过pub-reject',
    `published_at` datetime(3) DEFAULT NULL COMMENT '发布时间',
    `audit_apply_sn` bigint(20) NOT NULL DEFAULT 0 COMMENT '发起审核申请序号',
    `audit_advice` text null COMMENT '审核意见，仅驳回时有用',
    `proc_def_key` varchar(128)  NOT NULL DEFAULT '' COMMENT '审核流程key',
    `flow_apply_id` varchar(50)  DEFAULT '' COMMENT '审核流程ID',
    `flow_node_id` varchar(50)  DEFAULT NULL COMMENT '目录当前所处审核流程结点ID',
    `flow_node_name` varchar(200)  DEFAULT NULL COMMENT '目录当前所处审核流程结点名称',
    `flow_id` varchar(50)  DEFAULT NULL COMMENT '审批流程实例ID',
    `flow_name` varchar(200)  DEFAULT NULL COMMENT '审批流程名称',
    `flow_version` varchar(10)  DEFAULT NULL COMMENT '审批流程版本',
    `audit_state` tinyint(2) DEFAULT NULL COMMENT '审核状态， 1 审核中  2 通过  3 驳回 4 未完成',
    `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) COMMENT '创建时间',
    `creator_uid` varchar(50)  NOT NULL DEFAULT '' COMMENT '创建用户ID',
    `updated_at` datetime(3) DEFAULT NULL COMMENT '更新时间',
    `updater_uid` varchar(50)  DEFAULT NULL COMMENT '更新用户ID',
    `deleted_at` datetime(3) DEFAULT NULL COMMENT '删除时间',
    `deleter_uid` varchar(50)  DEFAULT NULL COMMENT '删除用户ID',
    PRIMARY KEY (`id`),
    UNIQUE KEY `t_file_resource_code_uk` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文件资源表';

CREATE TABLE IF NOT EXISTS `t_data_comprehension_template`(
    `id`                         char(36)     NOT NULL,
    `name`                       varchar(255) NOT NULL COMMENT '理解模板名称',
    `description`                text     DEFAULT NULL COMMENT '理解模板描述',
    `business_object`            tinyint(2) DEFAULT NULL COMMENT '业务对象',
    `time_range`                 tinyint(2) DEFAULT NULL COMMENT '时间范围',
    `time_field_comprehension`   tinyint(2) DEFAULT NULL COMMENT '时间字段理解',
    `spatial_range`              tinyint(2) DEFAULT NULL COMMENT '空间范围',
    `spatial_field_comprehension`  tinyint(2) DEFAULT NULL COMMENT '空间字段理解',
    `business_special_dimension` tinyint(2) DEFAULT NULL COMMENT '业务特殊维度',
    `compound_expression`        tinyint(2) DEFAULT NULL COMMENT '复合表达',
    `service_range`              tinyint(2) DEFAULT NULL COMMENT '服务范围',
    `service_areas`              tinyint(2) DEFAULT NULL COMMENT '服务领域',
    `front_support`              tinyint(2) DEFAULT NULL COMMENT '正面支撑',
    `negative_support`           tinyint(2) DEFAULT NULL COMMENT '负面支撑',
    `protect_control`            tinyint(2) DEFAULT NULL COMMENT '保护/控制什么',
    `promote_push`               tinyint(2) DEFAULT NULL COMMENT '促进/推动什么',
    `created_at`                 datetime(3) NOT NULL COMMENT '创建时间',
    `created_uid`                char(36)     NOT NULL COMMENT '创建人',
    `updated_at`                 datetime(3) DEFAULT NULL COMMENT '更新时间',
    `updated_uid`                char(36) DEFAULT NULL COMMENT '更新人',
    `deleted_at`                 bigint(20) DEFAULT NULL COMMENT '删除时间',
    `deleted_uid`                char(36) DEFAULT NULL COMMENT '删除人',
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci  COMMENT='数据理解模板表';

CREATE TABLE IF NOT EXISTS `t_data_catalog_search_history` (
                                                               `catalog_search_history_id` bigint(20) NOT NULL COMMENT '雪花id, 单目录搜索记录',
    `id` varchar(255) DEFAULT '' COMMENT '单目录搜索id uuid',
    `data_catalog_id` bigint(255) NOT NULL DEFAULT 0 COMMENT '数据资源目录id',
    `fields` text null COMMENT '字段id',
    `fields_details` text null COMMENT '字段详情',
    `configs` text null COMMENT '配置信息',
    `type` varchar(255) DEFAULT NULL COMMENT '左侧目录类型，department\\authorization',
    `department_path` text null COMMENT '部门路径',
    `total_count` int(11) DEFAULT 0 COMMENT '搜索结果',
    `created_at` datetime DEFAULT NULL COMMENT '创建时间',
    `created_by_uid` varchar(255) DEFAULT '' COMMENT '创建者id',
    `updated_at` datetime DEFAULT NULL COMMENT '更新时间',
    `updated_by_uid` varchar(255) DEFAULT '' COMMENT '更新者',
    `deleted_at` int(11) DEFAULT 0 COMMENT '删除时间',
    PRIMARY KEY (`catalog_search_history_id`),
    KEY `idx` (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `t_data_catalog_search_template` (
                                                                `catalog_search_template_id` bigint(20) NOT NULL COMMENT '单目录搜索模板id 雪花id',
    `id` varchar(255) DEFAULT '' COMMENT '单目录搜索模板id uuid',
    `data_catalog_id` bigint(255) NOT NULL DEFAULT 0,
    `name` varchar(255) DEFAULT '' COMMENT '单目录搜索模板名称',
    `description` varchar(255) DEFAULT '' COMMENT '单目录搜索模板描述',
    `type` varchar(255) DEFAULT '' COMMENT '左侧数据目录来源类型：department、authorization',
    `department_path` varchar(255) DEFAULT '' COMMENT '部门路径，帮助前端找到目标目录',
    `fields` text null COMMENT '字段id',
    `fields_details` text null COMMENT '字段详细信息',
    `configs` text null COMMENT '配置信息',
    `created_at` datetime DEFAULT NULL COMMENT '创建时间',
    `created_by_uid` varchar(255) DEFAULT '' COMMENT '创建者id',
    `updated_at` datetime DEFAULT NULL COMMENT '更新时间',
    `updated_by_uid` varchar(255) DEFAULT '' COMMENT '更新者',
    `deleted_at` int(11) DEFAULT 0 COMMENT '删除时间',
    PRIMARY KEY (`catalog_search_template_id`),
    KEY `idx` (`id`),
    KEY `namex` (`name`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `t_data_catalog_resource` (
    `id` bigint(20) NOT NULL COMMENT '标识',
    `catalog_id` bigint(20) NOT NULL COMMENT '目录id',
    `resource_id` varchar(50) NOT NULL COMMENT '数据资源id',
    `request_format` varchar(100) COMMENT '请求报文格式',
    `response_format` varchar(100) COMMENT '响应报文格式',
    `scheduling_plan` tinyint(2) COMMENT '调度计划 1 一次性、2按分钟、3按天、4按周、5按月',
    `interval` tinyint(2) COMMENT '间隔',
    `time` varchar(100) COMMENT '时间',
    PRIMARY KEY (`id`),
    KEY `catalog_id_btr` (`catalog_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci  COMMENT='目录数据资源挂載表';


CREATE TABLE IF NOT EXISTS `statistics_overview` (
    `id` char(38)  COMMENT '主键ID',
    `total_data_count` bigint(20) NOT NULL DEFAULT 0 COMMENT '数据总量',
    `total_table_count` bigint(20) NOT NULL DEFAULT 0 COMMENT '库表总量',
    `service_usage_count` bigint(20) NOT NULL DEFAULT 0 COMMENT '服务使用次数',
    `shared_data_count` bigint(20) NOT NULL DEFAULT 0 COMMENT '共享数据总量',
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP   COMMENT '更新时间',
    primary key (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='统计概览表';



CREATE TABLE IF NOT EXISTS `statistics_service` (
    `id` char(38) COMMENT '主键',
    `type` int NOT NULL COMMENT '类型（1: 目录, 2: 接口）',
    `quantity` INT DEFAULT 0 COMMENT '上线量/申请量',
    `business_time` varchar(20)  COMMENT '日期：年-月',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `week` INT COMMENT '周数',
    `catalog` varchar(20) COMMENT '类别：1 资源申请量  2 资源上线量',
    primary key (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='统计服务榜单';

INSERT IGNORE INTO af_data_catalog.statistics_overview
(id, total_data_count, total_table_count, service_usage_count, shared_data_count, update_time)
VALUES('1', 100, 200, 300, 400, '2024-11-22 12:11:12');

INSERT IGNORE INTO af_data_catalog.statistics_service
(id, `type`, quantity, business_time, create_time, week, `catalog`)
VALUES('1', 1, 100, '2025-02', '2025-05-26 17:26:40', 4, '1');
INSERT IGNORE INTO af_data_catalog.statistics_service
(id, `type`, quantity, business_time, create_time, week, `catalog`)
VALUES('10', 1, 200, '2025-03', '2025-05-28 15:02:07', 1, '2');
INSERT IGNORE INTO af_data_catalog.statistics_service
(id, `type`, quantity, business_time, create_time, week, `catalog`)
VALUES('11', 1, 300, '2025-03', '2025-05-28 15:02:07', 2, '2');
INSERT IGNORE INTO af_data_catalog.statistics_service
(id, `type`, quantity, business_time, create_time, week, `catalog`)
VALUES('12', 1, 400, '2025-03', '2025-05-28 15:02:07', 3, '2');
INSERT IGNORE INTO af_data_catalog.statistics_service
(id, `type`, quantity, business_time, create_time, week, `catalog`)
VALUES('13', 2, 101, '2025-02', '2025-05-28 17:45:51', 4, '2');
INSERT IGNORE INTO af_data_catalog.statistics_service
(id, `type`, quantity, business_time, create_time, week, `catalog`)
VALUES('14', 2, 201, '2025-03', '2025-05-28 17:45:51', 3, '2');
INSERT IGNORE INTO af_data_catalog.statistics_service
(id, `type`, quantity, business_time, create_time, week, `catalog`)
VALUES('15', 2, 301, '2025-03', '2025-05-28 17:45:51', 2, '2');
INSERT IGNORE INTO af_data_catalog.statistics_service
(id, `type`, quantity, business_time, create_time, week, `catalog`)
VALUES('16', 2, 401, '2025-03', '2025-05-28 17:45:51', 1, '2');
INSERT IGNORE INTO af_data_catalog.statistics_service
(id, `type`, quantity, business_time, create_time, week, `catalog`)
VALUES('2', 1, 200, '2025-03', '2025-05-27 10:19:37', 1, '1');
INSERT IGNORE INTO af_data_catalog.statistics_service
(id, `type`, quantity, business_time, create_time, week, `catalog`)
VALUES('3', 1, 300, '2025-03', '2025-05-27 10:22:02', 2, '1');
INSERT IGNORE INTO af_data_catalog.statistics_service
(id, `type`, quantity, business_time, create_time, week, `catalog`)
VALUES('4', 1, 400, '2025-03', '2025-05-27 10:22:02', 3, '1');
INSERT IGNORE INTO af_data_catalog.statistics_service
(id, `type`, quantity, business_time, create_time, week, `catalog`)
VALUES('5', 2, 102, '2025-02', '2025-05-27 10:22:02', 4, '1');
INSERT IGNORE INTO af_data_catalog.statistics_service
(id, `type`, quantity, business_time, create_time, week, `catalog`)
VALUES('6', 2, 202, '2025-03', '2025-05-27 10:22:02', 1, '1');
INSERT IGNORE INTO af_data_catalog.statistics_service
(id, `type`, quantity, business_time, create_time, week, `catalog`)
VALUES('7', 2, 302, '2025-03', '2025-05-27 10:22:02', 2, '1');
INSERT IGNORE INTO af_data_catalog.statistics_service
(id, `type`, quantity, business_time, create_time, week, `catalog`)
VALUES('8', 2, 402, '2025-03', '2025-05-27 10:22:02', 3, '1');
INSERT IGNORE INTO af_data_catalog.statistics_service
(id, `type`, quantity, business_time, create_time, week, `catalog`)
VALUES('9', 1, 100, '2025-02', '2025-05-28 15:02:07', 4, '2');



CREATE TABLE IF NOT EXISTS `t_data_catalog_apply` (
    `id` bigint(20) NOT NULL COMMENT '主键',
    `catalog_id` bigint(20) NOT NULL COMMENT '目录id',
    `apply_num` INT(11) DEFAULT 0 COMMENT '申请量',
    `create_time` DATETIME(0) DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    primary key (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='数据资源申请明细';

CREATE TABLE IF NOT EXISTS `t_system_operation_detail` (
    `id` char(36) NOT NULL COMMENT 'id,uuid',
    `catalog_id` bigint(20) NOT NULL COMMENT '数据资源目录id',
    `department_id` char(36) DEFAULT NULL COMMENT '部门id',
    `info_system_id` char(36) DEFAULT NULL COMMENT '信息系统id',
    `form_view_id` char(36) NOT NULL COMMENT '视图id',
    `technical_name` varchar(255) NOT NULL COMMENT '技术名称',
    `business_name` varchar(255) NOT NULL COMMENT '业务名称',
    `acceptance_time` datetime DEFAULT NULL COMMENT '验收时间',
    `first_aggregation_time` datetime DEFAULT NULL COMMENT '首次归集时间',
    `update_cycle` tinyint(4) DEFAULT NULL COMMENT '更新频率 参考数据字典：GXZQ，1不定时 2实时 3每日 4每周 5每月 6每季度 7每半年 8每年 9其他',
    `field_count` int(11) DEFAULT NULL COMMENT '字段数',
    `latest_data_count` int(11) DEFAULT NULL COMMENT '最新数据量',
    `has_quality_issue` tinyint(4) DEFAULT NULL COMMENT '是否存在质量问题',
    `issue_remark` text null COMMENT '问题备注',
    `quality_check` tinyint(4) DEFAULT NULL COMMENT '质量检测',
    `data_update` tinyint(4) DEFAULT NULL COMMENT '数据更新',
    `created_at` datetime(3) NOT NULL COMMENT '创建时间',
    `updated_at` datetime(3) NOT NULL COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_form_view_id` (`form_view_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT = '系统运行明细表';

CREATE TABLE IF NOT EXISTS `t_form_data_count` (
    `id` char(36) NOT NULL COMMENT 'id,uuid',
    `form_view_id` char(36) NOT NULL COMMENT '视图id',
    `data_count` int(11) NOT NULL COMMENT '数据量',
    `created_at` datetime(3) NOT NULL COMMENT '创建时间',
    PRIMARY KEY (`id`),
    KEY `idx_form_view_id` (`form_view_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT = '视图数据量表';

CREATE TABLE IF NOT EXISTS `t_rule_config` (
    `id` char(36) NOT NULL COMMENT 'id,uuid',
    `rule_name` varchar(128) NOT NULL COMMENT '规则名称',
    `update_timeliness_condition` varchar(10) DEFAULT NULL COMMENT '更新及时率条件（≥,<）',
    `update_timeliness_value` float DEFAULT NULL COMMENT '更新及时率值（%）',
    `quality_pass_condition` varchar(10) DEFAULT NULL COMMENT '质量合格率条件（≥,<）',
    `quality_pass_value` float DEFAULT NULL COMMENT '质量合格率值（%）',
    `logical_operator` varchar(3) DEFAULT NULL COMMENT '逻辑运算符（AND/OR）',
    PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT = '给牌规则表';

INSERT IGNORE INTO `t_rule_config` (`id`, `rule_name`, `update_timeliness_condition`, `update_timeliness_value`, `quality_pass_condition`, `quality_pass_value`, `logical_operator`) VALUES('7013eef3-89b1-421d-bf29-09440c89139c','normal_update',NULL,'80',NULL,'0',NULL);
INSERT IGNORE INTO `t_rule_config` (`id`, `rule_name`, `update_timeliness_condition`, `update_timeliness_value`, `quality_pass_condition`, `quality_pass_value`, `logical_operator`) VALUES('7a063091-1690-442c-a555-c96179c01218','yellow_card','≥','50','≥','50','OR');
INSERT IGNORE INTO `t_rule_config` (`id`, `rule_name`, `update_timeliness_condition`, `update_timeliness_value`, `quality_pass_condition`, `quality_pass_value`, `logical_operator`) VALUES('7bff8f7a-447e-4baa-bb8e-2b27076659ff','red_card','<','50','<','50','OR');
INSERT IGNORE INTO `t_rule_config` (`id`, `rule_name`, `update_timeliness_condition`, `update_timeliness_value`, `quality_pass_condition`, `quality_pass_value`, `logical_operator`) VALUES('7f84f2c7-ac2c-446d-845f-7a73d62958ba','green_card','≥','80','≥','80','AND');

CREATE TABLE IF NOT EXISTS `t_apply_scope` (
     `id` CHAR(36) NOT NULL COMMENT '应用范围uuid',
     `apply_scope_id` BIGINT(20) NOT NULL COMMENT '唯一id，雪花算法',
     `name` VARCHAR(255) DEFAULT NULL COMMENT '应用范围名称',
     `deleted_at` BIGINT(20) DEFAULT 0 COMMENT '逻辑删除时间戳',
     PRIMARY KEY (`apply_scope_id`),
     KEY `idx_apply_scope_id` (`id`)
) COMMENT = '应用范围表';


CREATE TABLE IF NOT EXISTS `t_category_apply_scope_relation` (
    `id` BIGINT(20) NOT NULL COMMENT '唯一id，雪花算法',
    `category_id` CHAR(36) NOT NULL COMMENT '类目uuid',
    `apply_scope_id` CHAR(36) NOT NULL COMMENT '应用范围uuid',
    `required` tinyint(4) NOT NULL DEFAULT 0 COMMENT '是否必填，0否 1是',
    `deleted_at` BIGINT(20) DEFAULT 0 COMMENT '逻辑删除时间戳',
    PRIMARY KEY (`id`),
    KEY `idx_category_id` (`category_id`),
    KEY `idx_apply_scope_id` (`apply_scope_id`)
) COMMENT = '类目应用范围关系表';




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


CREATE TABLE IF NOT EXISTS `t_res_feedback` (
    `id` bigint(20) NOT NULL COMMENT '唯一id，雪花算法',
    `res_id` varchar(64) NOT NULL COMMENT '资源ID',
    `res_type` tinyint(2) NOT NULL COMMENT '资源类型 1 逻辑视图  2 接口服务  3 指标',
    `feedback_type` tinyint(2) NOT NULL COMMENT '反馈类型 1：信息有误  2：数据质量问题  3：其他',
    `feedback_desc` varchar(300) NOT NULL COMMENT '反馈描述',
    `status` tinyint(2) NOT NULL COMMENT '反馈状态 1 待处理 9 已回复',
    `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) COMMENT '创建/反馈时间',
    `created_by` char(36) NOT NULL COMMENT '创建/反馈人ID',
    `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) COMMENT '更新时间',
    `replied_at` datetime(3) DEFAULT NULL COMMENT '反馈回复时间',
    PRIMARY KEY (`id`),
    KEY `idx_feedback_type` (`feedback_type`),
    KEY `idx_res_type` (`res_type`),
    KEY `idx_feedback_status` (`status`),
    KEY `idx_feedback_created_by` (`created_by`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='资源反馈记录表';

CREATE TABLE IF NOT EXISTS `t_target` (
    `id` BIGINT  NOT NULL AUTO_INCREMENT COMMENT '唯一ID，雪花算法',
    `target_name` VARCHAR(128) NOT NULL COMMENT '目标名称',
    `target_type` int NOT NULL DEFAULT 1 COMMENT '目标类型：1=部门目标，2=个人目标',
    `department_id` CHAR(36)  NOT NULL COMMENT '责任部门ID',
    `description` TEXT COMMENT '目标描述',
    `start_date` DATE NOT NULL COMMENT '开始日期',
    `end_date` DATE NULL COMMENT '结束日期',
    `status` int NOT NULL DEFAULT 1 COMMENT '状态：1=未到期，2=待评价，3=已结束',
    `responsible_uid` char(36) NOT NULL COMMENT '责任人ID',
    `employee_id` text NOT NULL COMMENT '协助成员ID,多个用逗号分隔',
    `evaluation_content` text    null COMMENT '整体评价内容',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
    `created_by` char(36) NOT NULL COMMENT '创建人',
    `updated_at` DATETIME(3) DEFAULT   CURRENT_TIMESTAMP(3) comment '更新时间',
    `updated_by` char(36) DEFAULT NULL COMMENT '更新人',
    PRIMARY KEY (`id`),
    INDEX idx_department_id (department_id),
    INDEX idx_start_end_date (start_date, end_date),
    INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='考核目标表';

CREATE TABLE  IF NOT EXISTS `t_target_plan` (
    `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '唯一ID，雪花算法',
    `target_id` bigint(20) NOT NULL COMMENT '所属目标ID',
    `plan_type` tinyint(4) NOT NULL COMMENT '考核计划类型：1=数据获取，2=数据质量整改，3=数据资源编目，4=业务梳理,5=数据处理,6=数据理解',
    `plan_name` varchar(128) NOT NULL COMMENT '计划名称',
    `plan_desc` text null COMMENT '计划描述',
    `responsible_uid` varchar(50) NOT NULL COMMENT '责任人用户ID',
    `plan_quantity` bigint(20) NOT NULL COMMENT '计划数量（如：计划归集资源数量）',
    `actual_quantity` bigint(20) DEFAULT NULL COMMENT '实际完成数量（如：已归集资源数量）',
    `status` tinyint(4) NOT NULL DEFAULT 0 COMMENT '状态：0=未填，1=已填，2=异常',
    `related_data_collection_plan_id` text null COMMENT '关联的数据归集计划ID',
    `related_data_collection_plan_name` varchar(255) DEFAULT NULL COMMENT '关联数据归集计划名称',
    `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) COMMENT '创建时间',
    `created_by` char(36) NOT NULL COMMENT '创建人',
    `updated_at` datetime(3) DEFAULT NULL COMMENT '更新时间',
    `updated_by` char(36) DEFAULT NULL COMMENT '更新人',
    `business_model_quantity` bigint(20) DEFAULT NULL COMMENT '计划构建业务模型数量',
    `business_process_quantity` bigint(20) DEFAULT NULL COMMENT '计划梳理业务流程数量',
    `business_table_quantity` bigint(20) DEFAULT NULL COMMENT '计划设计业务表数量',
    `business_model_actual_quantity` bigint(20) DEFAULT NULL COMMENT '实际构建业务模型数量',
    `business_process_actual_quantity` bigint(20) DEFAULT NULL COMMENT '实际梳理业务流程数量',
    `business_table_actual_quantity` bigint(20) DEFAULT NULL COMMENT '实际设计业务表数量',
    `data_process_explore_quantity` bigint(20) DEFAULT NULL COMMENT '计划探查表数量（数据处理类型）',
    `data_process_fusion_quantity` bigint(20) DEFAULT NULL COMMENT '计划融合表数量（数据处理类型）',
    `data_process_explore_actual_quantity` bigint(20) DEFAULT NULL COMMENT '实际探查表数量（数据处理类型）',
    `data_process_fusion_actual_quantity` bigint(20) DEFAULT NULL COMMENT '实际融合表数量（数据处理类型）',
    `data_understanding_quantity` bigint(20) DEFAULT NULL COMMENT '计划理解数据资源目录数量（数据理解类型）',
    `data_understanding_actual_quantity` bigint(20) DEFAULT NULL COMMENT '实际理解数据资源目录数量（数据理解类型）',
    `related_data_process_plan_id` text null COMMENT '关联的数据处理计划ID（运营考核类型）',
    `related_data_understanding_plan_id` text null COMMENT '关联的数据理解计划ID（运营考核类型）',
    `data_collection_quantity` bigint(20) DEFAULT NULL COMMENT '计划归集资源数量（运营考核-数据获取类型）',
    `data_collection_actual_quantity` bigint(20) DEFAULT NULL COMMENT '实际归集资源数量（运营考核-数据获取类型）',
    `assessment_type` tinyint(2) DEFAULT NULL COMMENT '类别：1-部门考核  2-运营考核',
    PRIMARY KEY (`id`),
    KEY `idx_target_id` (`target_id`),
    KEY `idx_plan_type` (`plan_type`),
    KEY `idx_responsible_uid` (`responsible_uid`),
    KEY `idx_status` (`status`),
    KEY `idx_plan_quantity` (`plan_quantity`),
    CONSTRAINT `t_target_plan_ibfk_1` FOREIGN KEY (`target_id`) REFERENCES `t_target` (`id`) ON DELETE CASCADE
    ) ENGINE=InnoDB AUTO_INCREMENT=47 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='考核计划表（含详情与评价）';

CREATE TABLE IF NOT EXISTS `category_node_ext` (
    `id` bigint(20) NOT NULL COMMENT '唯一id，雪花算法',
    `category_node_id` char(36) NOT NULL DEFAULT UUID() COMMENT '类目树节点ID',
    `category_id` char(36) NOT NULL DEFAULT UUID() COMMENT '所属类目ID',
    `parent_id` char(36) NOT NULL DEFAULT UUID() COMMENT '父类别节点id，为0表示没有父id',
    `name` varchar(128) NOT NULL COMMENT '类目节点名称',
    `owner` varchar(128) NOT NULL DEFAULT '' COMMENT '类目节点所有者的名称',
    `owner_uid` varchar(36) DEFAULT NULL COMMENT '类目节点所有者的ID',
    `required` tinyint(4) NOT NULL DEFAULT 0 COMMENT '是否必填，0否 1是',
    `selected` tinyint(4) NOT NULL DEFAULT 0 COMMENT '是否选中，0否 1是',
    `sort_weight` bigint(20) NOT NULL COMMENT '排序权重',
    `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) COMMENT '创建时间',
    `creator_uid` varchar(36) DEFAULT NULL COMMENT '创建用户ID',
    `creator_name` varchar(255) DEFAULT NULL COMMENT '创建用户名称',
    `updated_at` datetime NOT NULL DEFAULT current_timestamp() COMMENT '更新时间',
    `updater_uid` varchar(36) DEFAULT NULL COMMENT '更新用户ID',
    `updater_name` varchar(255) DEFAULT NULL COMMENT '更新用户名称',
    `deleted_at` bigint(20) DEFAULT 0 COMMENT '删除时间（逻辑删除）',
    `deleter_uid` varchar(36) DEFAULT NULL COMMENT '删除用户ID',
    `deleter_name` varchar(255) DEFAULT NULL COMMENT '删除用户名称',
    PRIMARY KEY (`id`) USING BTREE,
    UNIQUE KEY `ux_category_node_ext_node_id` (`category_node_id`),
    UNIQUE KEY `ux_category_node_ext_sort` (`category_id`,`parent_id`,`sort_weight`,`deleted_at`),
    UNIQUE KEY `ux_category_node_ext_name` (`category_id`,`parent_id`,`name`,`deleted_at`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='类目树节点信息扩展表';


    INSERT INTO `category_node_ext` (`id`, `category_node_id`,`category_id`, `parent_id`, `name`, `required`,`selected`, `sort_weight`)
SELECT 1,'00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000002','0','信息系统',0,0,0
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `category_node_ext` WHERE `id` = 1 );

INSERT INTO `category_node_ext` (`id`, `category_node_id`,`category_id`, `parent_id`, `name`,`required`,`selected`, `sort_weight`)
SELECT 2,'d695781e-acd7-522a-a830-7f0a9015a3e2','00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000002','接口服务管理',0,0,10
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `category_node_ext` WHERE `id` = 2 );

INSERT INTO `category_node_ext` (`id`, `category_node_id`,`category_id`, `parent_id`, `name`,`required`,`selected`, `sort_weight`)
SELECT 3,'2f4aa526-9bd1-52b3-9323-4a5d5bd67801','00000000-0000-0000-0000-000000000002','d695781e-acd7-522a-a830-7f0a9015a3e2','接口列表左侧树',0,0,10
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `category_node_ext` WHERE `id` = 3 );

INSERT INTO `category_node_ext` (`id`, `category_node_id`,`category_id`, `parent_id`, `name`,`required`,`selected`, `sort_weight`)
SELECT 4,'c65c8838-4291-5b5f-a8ef-c636f820d855','00000000-0000-0000-0000-000000000002','d695781e-acd7-522a-a830-7f0a9015a3e2','数据服务超市左侧树',0,0,20
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `category_node_ext` WHERE `id` = 4 );

INSERT INTO `category_node_ext` (`id`, `category_node_id`,`category_id`, `parent_id`, `name`,`required`,`selected`, `sort_weight`)
SELECT 5,'8237777c-f985-5e3e-9a4b-ec42607e9815','00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000002','数据资源目录',0,0,20    
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `category_node_ext` WHERE `id` = 5 );   

INSERT INTO `category_node_ext` (`id`, `category_node_id`,`category_id`, `parent_id`, `name`,`required`,`selected`, `sort_weight`)
SELECT 6,'f498b676-457b-5f99-92f9-1ce8d3cb82e9','00000000-0000-0000-0000-000000000002','8237777c-f985-5e3e-9a4b-ec42607e9815','数据资源目录左侧树',0,0,10   
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `category_node_ext` WHERE `id` = 6 );   

INSERT INTO `category_node_ext` (`id`, `category_node_id`,`category_id`, `parent_id`, `name`,`required`,`selected`, `sort_weight`)
SELECT 7,'6056e4cf-759d-5aa4-9be9-e97fb70c332b','00000000-0000-0000-0000-000000000002','8237777c-f985-5e3e-9a4b-ec42607e9815','数据服务超市左侧树',0,0,20
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `category_node_ext` WHERE `id` = 7 );

INSERT INTO `category_node_ext` (`id`, `category_node_id`,`category_id`, `parent_id`, `name`, `required`,`selected`, `sort_weight`)
SELECT 8,'00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','0','信息系统',1,1,0
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `category_node_ext` WHERE `id` = 8 );

INSERT INTO `category_node_ext` (`id`, `category_node_id`,`category_id`, `parent_id`, `name`,`required`,`selected`, `sort_weight`)
SELECT 9,'a0edfc9b-3ee4-5062-8718-193b5ad9d43f','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','接口服务管理',1,1,10
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `category_node_ext` WHERE `id` = 9 );

INSERT INTO `category_node_ext` (`id`, `category_node_id`,`category_id`, `parent_id`, `name`,`required`,`selected`, `sort_weight`)
SELECT 10,'026f3c88-d4fc-54a1-b066-211988ddbad5','00000000-0000-0000-0000-000000000001','a0edfc9b-3ee4-5062-8718-193b5ad9d43f','接口列表左侧树',1,1,10
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `category_node_ext` WHERE `id` = 10 );

INSERT INTO `category_node_ext` (`id`, `category_node_id`,`category_id`, `parent_id`, `name`,`required`,`selected`, `sort_weight`)
SELECT 11,'e2fb38c6-ad64-53be-9742-bcbb1e1567e0','00000000-0000-0000-0000-000000000001','a0edfc9b-3ee4-5062-8718-193b5ad9d43f','数据服务超市左侧树',1,1,20
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `category_node_ext` WHERE `id` = 11 );

INSERT INTO `category_node_ext` (`id`, `category_node_id`,`category_id`, `parent_id`, `name`,`required`,`selected`, `sort_weight`)
SELECT 12,'4f1f634c-3fc7-5752-94a5-3e7ca1d93ef0','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','数据资源目录',1,1,20    
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `category_node_ext` WHERE `id` = 12 );   

INSERT INTO `category_node_ext` (`id`, `category_node_id`,`category_id`, `parent_id`, `name`,`required`,`selected`, `sort_weight`)
SELECT 13,'731313f1-bbf9-532b-bad2-00c4d2d5374f','00000000-0000-0000-0000-000000000001','4f1f634c-3fc7-5752-94a5-3e7ca1d93ef0','数据资源目录左侧树',1,1,10   
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `category_node_ext` WHERE `id` = 13 );   

INSERT INTO `category_node_ext` (`id`, `category_node_id`,`category_id`, `parent_id`, `name`,`required`,`selected`, `sort_weight`)
SELECT 14,'500932fb-8d55-5f12-95a8-e776c1a96726','00000000-0000-0000-0000-000000000001','4f1f634c-3fc7-5752-94a5-3e7ca1d93ef0','数据服务超市左侧树',1,1,20
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `category_node_ext` WHERE `id` = 14 );

INSERT INTO `category_node_ext` (`id`, `category_node_id`,`category_id`, `parent_id`, `name`,`required`,`selected`, `sort_weight`)
SELECT 15,'4f1f634c-3fc7-5752-94a5-3e7ca1d93ef1','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','信息资源目录',1,1,30
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `category_node_ext` WHERE `id` = 15 );

INSERT INTO `category_node_ext` (`id`, `category_node_id`,`category_id`, `parent_id`, `name`,`required`,`selected`, `sort_weight`)
SELECT 16,'731313f1-bbf9-532b-bad2-00c4d2d5374b','00000000-0000-0000-0000-000000000001','4f1f634c-3fc7-5752-94a5-3e7ca1d93ef1','信息资源目录左侧树',1,1,10
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `category_node_ext` WHERE `id` = 16 );
