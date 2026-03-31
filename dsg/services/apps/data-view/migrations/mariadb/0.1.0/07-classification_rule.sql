use af_main;

CREATE TABLE IF NOT EXISTS classification_rule (
	classification_rule_id BIGINT(20) NOT NULL COMMENT '分类规则雪花id',
	id VARCHAR(255) NOT NULL DEFAULT '' COMMENT '分类规则uuid',
	name VARCHAR(255) NULL DEFAULT NULL COMMENT '分类规则名称',
	description VARCHAR(1024) NULL DEFAULT NULL COMMENT '分类规则描述',
	type VARCHAR(255) NULL DEFAULT NULL COMMENT '规则类型，custom;inner',
	subject_id VARCHAR(255) NOT NULL DEFAULT '' COMMENT '分类属性uuid',
	status INT(11) NOT NULL DEFAULT '0' COMMENT '0停用1启用',
	created_at DATETIME NULL DEFAULT current_timestamp() COMMENT '创建时间',
	created_by_uid VARCHAR(255) NULL DEFAULT NULL COMMENT '创建用户id',
	updated_at DATETIME NULL DEFAULT current_timestamp() COMMENT '修改时间',
	updated_by_uid VARCHAR(255) NULL DEFAULT NULL COMMENT '修改用户id',
	deleted_at BIGINT(20) NOT NULL DEFAULT '0' COMMENT '删除时间',
	PRIMARY KEY (classification_rule_id),
	INDEX id (id)
) COMMENT='分类规则表';


INSERT INTO classification_rule (classification_rule_id, id, name, description, type, subject_id, status, created_by_uid, updated_by_uid, deleted_at)
SELECT 1, '1', '默认规则', NULL, 'inner', 'ef12001d-d650-4620-a0e1-7a11a930d40b', 1, null, null, 0
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM classification_rule WHERE id = '1');
