use af_main;

CREATE TABLE IF NOT EXISTS classification_rule_algorithm_relation (
	classification_rule_algorithm_relation_id BIGINT(20) NOT NULL COMMENT '分类规则算法关系雪花id',
	id VARCHAR(255) NOT NULL DEFAULT '' COMMENT '分类规则算法关系uuid',
	classification_rule_id VARCHAR(255) NOT NULL DEFAULT '' COMMENT '分类规则uuid',
	recognition_algorithm_id VARCHAR(255) NOT NULL DEFAULT '' COMMENT '识别算法uuid',
	status INT(11) NOT NULL DEFAULT '0' COMMENT '0停用1启用',
	deleted_at BIGINT(20) NOT NULL DEFAULT '0' COMMENT '删除时间',
	PRIMARY KEY (classification_rule_algorithm_relation_id),
	INDEX id (id),
	INDEX classification_rule_id (classification_rule_id),
	INDEX recognition_algorithm_id (recognition_algorithm_id)
) COMMENT='分类规则算法关系';
