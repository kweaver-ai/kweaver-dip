use af_main;
CREATE TABLE IF NOT EXISTS `template_rule` (
     `id` bigint(20) NOT NULL COMMENT '主键',
     `rule_id` char(36) DEFAULT NULL COMMENT '规则id',
     `rule_name` varchar(128) NOT NULL COMMENT '规则名称',
     `rule_description` varchar(300) DEFAULT NULL COMMENT '规则描述',
     `rule_level` int NOT NULL COMMENT '规则级别',
     `dimension` int NOT NULL COMMENT '维度',
     `dimension_type` int DEFAULT NULL COMMENT '维度类型',
     `source` int NOT NULL COMMENT '来源',
     `rule_config` text DEFAULT NULL COMMENT '规则配置',
     `enable` int NOT NULL COMMENT '默认检测是否启用',
     `created_at` datetime(3) DEFAULT NULL COMMENT '创建时间',
     `created_by_uid` char(36) DEFAULT NULL COMMENT '创建人',
     `updated_at` datetime(3) DEFAULT NULL COMMENT '修改时间',
     `updated_by_uid` char(36) DEFAULT NULL COMMENT '修改人',
     `deleted_at` bigint(20) NOT NULL COMMENT '删除时间',
     PRIMARY KEY (`id`),
     KEY `idx_rule_id` (`rule_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='模板规则表';

-- ALTER TABLE explore_rule_config ADD COLUMN if not exists `dimension_type` int DEFAULT NULL COMMENT '维度类型' AFTER dimension;
-- ALTER TABLE explore_rule_config ADD COLUMN if not exists `draft` int DEFAULT NULL COMMENT '是否草稿' AFTER template_id;

INSERT IGNORE INTO `template_rule` (`id`, `rule_id`, `rule_name`, `rule_description`, `rule_level`, `dimension`, `dimension_type`, `source`, `rule_config`, `enable`, `created_at`, `created_by_uid`, `updated_at`, `updated_by_uid`, `deleted_at`) values('529106505304113153','4662a178-140f-4869-88eb-57f789baf1d3','表注释检查','检查是否包含表注释','1','1',NULL,'1',NULL,'0',NULL,NULL,NULL,NULL,'0');
INSERT IGNORE INTO `template_rule` (`id`, `rule_id`, `rule_name`, `rule_description`, `rule_level`, `dimension`, `dimension_type`, `source`, `rule_config`, `enable`, `created_at`, `created_by_uid`, `updated_at`, `updated_by_uid`, `deleted_at`) values('529108382372593665','931bf4e4-914e-4bff-af0c-ca57b63d1619','字段注释检查','检查字段注释是否完整','1','1',NULL,'1',NULL,'0',NULL,NULL,NULL,NULL,'0');
INSERT IGNORE INTO `template_rule` (`id`, `rule_id`, `rule_name`, `rule_description`, `rule_level`, `dimension`, `dimension_type`, `source`, `rule_config`, `enable`, `created_at`, `created_by_uid`, `updated_at`, `updated_by_uid`, `deleted_at`) values('529108545782677505','c2c65844-5573-4306-92d7-d3f9ac2edbf6','数据类型检查','检查字段的数据类型、长度、精度和字段关联的数据标准是否相同','1','2',NULL,'1',NULL,'0',NULL,NULL,NULL,NULL,'0');
INSERT IGNORE INTO `template_rule` (`id`, `rule_id`, `rule_name`, `rule_description`, `rule_level`, `dimension`, `dimension_type`, `source`, `rule_config`, `enable`, `created_at`, `created_by_uid`, `updated_at`, `updated_by_uid`, `deleted_at`) values('529118144111837185','6d8d7fdc-8cc4-4e89-a5dd-9b8d07a685dc','重复值检查','检查字段对应的值是否存在重复记录','2','3','5','1',NULL,'0',NULL,NULL,NULL,NULL,'0');
INSERT IGNORE INTO `template_rule` (`id`, `rule_id`, `rule_name`, `rule_description`, `rule_level`, `dimension`, `dimension_type`, `source`, `rule_config`, `enable`, `created_at`, `created_by_uid`, `updated_at`, `updated_by_uid`, `deleted_at`) values('529247613954818049','0c790158-9721-41ce-b8b3-b90341575485','最大值','计算数据表中指定字段数值最大值','2','7',NULL,'1',NULL,'0',NULL,NULL,NULL,NULL,'0');
INSERT IGNORE INTO `template_rule` (`id`, `rule_id`, `rule_name`, `rule_description`, `rule_level`, `dimension`, `dimension_type`, `source`, `rule_config`, `enable`, `created_at`, `created_by_uid`, `updated_at`, `updated_by_uid`, `deleted_at`) values('529247613971595265','73271129-2ae3-47aa-83c5-6c0bf002140c','最小值','计算数据表中指定字段数值最小值','2','7',NULL,'1',NULL,'0',NULL,NULL,NULL,NULL,'0');
INSERT IGNORE INTO `template_rule` (`id`, `rule_id`, `rule_name`, `rule_description`, `rule_level`, `dimension`, `dimension_type`, `source`, `rule_config`, `enable`, `created_at`, `created_by_uid`, `updated_at`, `updated_by_uid`, `deleted_at`) values('529247613971660801','91920b32-b884-4d23-a649-0518b038bf3b','分位数','计算数据表中指定字段分位数数值情况','2','7',NULL,'1',NULL,'0',NULL,NULL,NULL,NULL,'0');
INSERT IGNORE INTO `template_rule` (`id`, `rule_id`, `rule_name`, `rule_description`, `rule_level`, `dimension`, `dimension_type`, `source`, `rule_config`, `enable`, `created_at`, `created_by_uid`, `updated_at`, `updated_by_uid`, `deleted_at`) values('529247613971726337','fd9fa13a-40db-4283-9c04-bf0ff3edcb32','平均值统计','计算数据表中指定字段（限整数型、高精度型、小数型）数值平均值','2','7',NULL,'1',NULL,'0',NULL,NULL,NULL,NULL,'0');
INSERT IGNORE INTO `template_rule` (`id`, `rule_id`, `rule_name`, `rule_description`, `rule_level`, `dimension`, `dimension_type`, `source`, `rule_config`, `enable`, `created_at`, `created_by_uid`, `updated_at`, `updated_by_uid`, `deleted_at`) values('529247613971791873','06ad1362-9545-415d-9278-265e3abe7c10','标准差统计','计算数据表中指定字段（限整数型、高精度型、小数型）数值标准差','2','7',NULL,'1',NULL,'0',NULL,NULL,NULL,NULL,'0');
INSERT IGNORE INTO `template_rule` (`id`, `rule_id`, `rule_name`, `rule_description`, `rule_level`, `dimension`, `dimension_type`, `source`, `rule_config`, `enable`, `created_at`, `created_by_uid`, `updated_at`, `updated_by_uid`, `deleted_at`) values('529247613971857409','96ac5dc0-2e5c-4397-87a7-8414dddf8179','枚举值分布','计算数据表中指定字段（限整数型、高精度型、小数型、字符型）值分布情况','2','7',NULL,'1',NULL,'0',NULL,NULL,NULL,NULL,'0');
INSERT IGNORE INTO `template_rule` (`id`, `rule_id`, `rule_name`, `rule_description`, `rule_level`, `dimension`, `dimension_type`, `source`, `rule_config`, `enable`, `created_at`, `created_by_uid`, `updated_at`, `updated_by_uid`, `deleted_at`) values('529247613971922945','95e5b917-6313-4bd0-8812-bf0d4aa68d73','天分布','计算数据表中指定字段（限日期型、日期时间型）数值按天分布情况','2','7',NULL,'1',NULL,'0',NULL,NULL,NULL,NULL,'0');
INSERT IGNORE INTO `template_rule` (`id`, `rule_id`, `rule_name`, `rule_description`, `rule_level`, `dimension`, `dimension_type`, `source`, `rule_config`, `enable`, `created_at`, `created_by_uid`, `updated_at`, `updated_by_uid`, `deleted_at`) values('529247613971988481','69c3d959-1c72-422b-959d-7135f52e4f9c','月分布','计算数据表中指定字段（限日期型、日期时间型）数值按月分布情况','2','7',NULL,'1',NULL,'0',NULL,NULL,NULL,NULL,'0');
INSERT IGNORE INTO `template_rule` (`id`, `rule_id`, `rule_name`, `rule_description`, `rule_level`, `dimension`, `dimension_type`, `source`, `rule_config`, `enable`, `created_at`, `created_by_uid`, `updated_at`, `updated_by_uid`, `deleted_at`) values('529247613972054017','709fca1a-4640-4cd7-94ed-50b1b16e0aa5','年分布','计算数据表中指定字段（限日期型、日期时间型）数值按年分布情况','2','7',NULL,'1',NULL,'0',NULL,NULL,NULL,NULL,'0');
INSERT IGNORE INTO `template_rule` (`id`, `rule_id`, `rule_name`, `rule_description`, `rule_level`, `dimension`, `dimension_type`, `source`, `rule_config`, `enable`, `created_at`, `created_by_uid`, `updated_at`, `updated_by_uid`, `deleted_at`) values('529247613972119553','ae0f6573-b3e0-4be2-8330-a643261f8a18','TRUE值数','计算数据表中指定字段（限布尔型）TRUE值行数','2','7',NULL,'1',NULL,'0',NULL,NULL,NULL,NULL,'0');
INSERT IGNORE INTO `template_rule` (`id`, `rule_id`, `rule_name`, `rule_description`, `rule_level`, `dimension`, `dimension_type`, `source`, `rule_config`, `enable`, `created_at`, `created_by_uid`, `updated_at`, `updated_by_uid`, `deleted_at`) values('529247613972185089','45a4b3cb-b93c-469d-b3b4-631a3b8db5fe','FALSE值数','计算数据表中指定字段（限布尔型）FALSE值行数','2','7',NULL,'1',NULL,'0',NULL,NULL,NULL,NULL,'0');