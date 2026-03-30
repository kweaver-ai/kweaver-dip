use af_main;

CREATE TABLE IF NOT EXISTS data_privacy_policy (
	data_privacy_policy_id BIGINT(20) NOT NULL COMMENT '数据隐私策略雪花id',
	id VARCHAR(255) NOT NULL COMMENT '数据隐私策略uuid',
	form_view_id VARCHAR(255) NOT NULL COMMENT '待脱敏数据视图uuid' ,
	policy_description VARCHAR(1000) NULL DEFAULT NULL COMMENT '隐私策略描述' ,
	created_at datetime NOT NULL DEFAULT current_timestamp() COMMENT '创建时间',
	created_by_uid VARCHAR(255) NULL DEFAULT NULL COMMENT '创建用户id' ,
	updated_at datetime NOT NULL DEFAULT current_timestamp() COMMENT '修改时间',
	updated_by_uid VARCHAR(255) NULL DEFAULT NULL COMMENT '修改用户id' ,
	deleted_at BIGINT(20) NOT NULL DEFAULT 0 COMMENT '删除时间',
	PRIMARY KEY (data_privacy_policy_id),
	KEY id (id),
    KEY form_view_id (form_view_id)
) COMMENT='数据隐私策略表';