use af_main;

CREATE TABLE IF NOT EXISTS data_privacy_policy_field (
	data_privacy_policy_field_id BIGINT(20) NOT NULL COMMENT '隐私策略字段雪花id',
	id VARCHAR(255) NOT NULL COMMENT '隐私策略字段uuid',
	data_privacy_policy_id VARCHAR(255) NOT NULL COMMENT '隐私策略uuid',
	form_view_field_id VARCHAR(255) NOT NULL  COMMENT '视图字段uuid' ,
	desensitization_rule_id VARCHAR(255) NOT NULL COMMENT '脱敏规则uuid' ,
	deleted_at BIGINT(20) NOT NULL DEFAULT '0' COMMENT '删除时间',
	PRIMARY KEY (data_privacy_policy_field_id),
	KEY id (id),
    KEY form_view_field_id (form_view_field_id),
	KEY data_privacy_policy_id (data_privacy_policy_id),
	KEY desensitization_rule_id (desensitization_rule_id)
) COMMENT='数据隐私策略字段表';