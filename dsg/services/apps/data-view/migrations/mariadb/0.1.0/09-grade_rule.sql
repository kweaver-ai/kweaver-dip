use af_main;

CREATE TABLE IF NOT EXISTS grade_rule (
	grade_rule_id BIGINT(20) NOT NULL COMMENT '分级规则雪花id',
	id VARCHAR(255) NOT NULL DEFAULT '' COMMENT '分级规则uuid',
	name VARCHAR(255) NULL DEFAULT NULL COMMENT '分级规则名称',
	description VARCHAR(1024) NULL DEFAULT NULL COMMENT '分级规则描述',
	subject_id VARCHAR(255) NOT NULL DEFAULT '' COMMENT '分级属性uuid',
	label_id BIGINT(20) NOT NULL DEFAULT '0' COMMENT '分级标签uuid',
	logical_expression TEXT  NULL   COMMENT '逻辑表达式',
	type VARCHAR(255) NULL DEFAULT NULL COMMENT '算法类型，custom;inner',
	status INT(11) NOT NULL DEFAULT '0' COMMENT '0停用1启用',
	created_at DATETIME NULL DEFAULT current_timestamp() COMMENT '创建时间',
	created_by_uid VARCHAR(255) NULL DEFAULT NULL COMMENT '创建用户id',
	updated_at DATETIME NULL DEFAULT current_timestamp() COMMENT '修改时间',
	updated_by_uid VARCHAR(255) NULL DEFAULT NULL COMMENT '修改用户id',
	deleted_at BIGINT(20) NOT NULL DEFAULT '0' COMMENT '删除时间',
	PRIMARY KEY (grade_rule_id) USING BTREE,
	INDEX id (id) USING BTREE
) COMMENT='分级规则表';


INSERT INTO grade_rule (grade_rule_id, id, name, description, subject_id, label_id, logical_expression, type, status, created_by_uid, updated_by_uid, deleted_at)
SELECT 1, '1', '默认规则', NULL, '', 0, '', 'inner', 1, NULL, NULL, 0
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM grade_rule WHERE id = '1');
