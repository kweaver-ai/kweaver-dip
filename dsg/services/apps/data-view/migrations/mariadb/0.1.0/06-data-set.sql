use af_main;

CREATE TABLE IF NOT EXISTS `data_set` (
    data_set_id BIGINT(20) NOT NULL COMMENT '数据集雪花id',
    id VARCHAR(255) NOT NULL COMMENT '数据集uuid',
    data_set_name VARCHAR(1000) NULL DEFAULT NULL COMMENT '数据集名称' ,
    data_set_description VARCHAR(1000) NULL DEFAULT NULL COMMENT '数据集描述' ,
    created_at datetime NOT NULL DEFAULT current_timestamp() COMMENT '创建时间',
    created_by_uid VARCHAR(255) NULL DEFAULT NULL COMMENT '创建用户id' ,
    updated_at datetime NOT NULL DEFAULT current_timestamp() COMMENT '修改时间',
    updated_by_uid VARCHAR(255) NULL DEFAULT NULL COMMENT '修改用户id' ,
    deleted_at BIGINT(20) NOT NULL DEFAULT 0 COMMENT '删除时间',
    PRIMARY KEY (data_set_id),
    KEY id (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='数据集表';



CREATE TABLE IF NOT EXISTS `data_set_view_relation` (
    id VARCHAR(255) NOT NULL COMMENT '数据集uuid',
    form_view_id VARCHAR(36) NOT NULL COMMENT '数据视图uuid',
    updated_at datetime NOT NULL DEFAULT current_timestamp() COMMENT '修改时间',
    PRIMARY KEY (id, form_view_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='数据集视图关系表';


CREATE TABLE IF NOT EXISTS  recognition_algorithm (
    recognition_algorithm_id BIGINT(20) NOT NULL,
    id VARCHAR(255) NOT NULL DEFAULT '' COMMENT '识别算法uuid',
    name VARCHAR(255) NULL DEFAULT NULL COMMENT '识别算法名称',
    description VARCHAR(1024) NULL DEFAULT NULL COMMENT '识别算法描述',
    type VARCHAR(255) NULL DEFAULT NULL COMMENT '算法类型，自定义;内置',
    inner_type VARCHAR(255) NULL DEFAULT NULL COMMENT '内置类型',
    algorithm VARCHAR(1024) NULL DEFAULT NULL COMMENT '算法表达式',
    status INT(11) NOT NULL DEFAULT '0' COMMENT '0停用1启用',
    created_at DATETIME NULL DEFAULT current_timestamp() COMMENT '创建时间',
    created_by_uid VARCHAR(255) NULL DEFAULT NULL COMMENT '创建用户id',
    updated_at DATETIME NULL DEFAULT current_timestamp() COMMENT '修改时间',
    updated_by_uid VARCHAR(255) NULL DEFAULT NULL COMMENT '修改用户id',
    deleted_at BIGINT(20) NOT NULL DEFAULT '0' COMMENT '删除时间',
    PRIMARY KEY (recognition_algorithm_id),
    INDEX id (id)
    ) COMMENT='识别算法表';

INSERT INTO recognition_algorithm (recognition_algorithm_id, id, name, description, type, inner_type, algorithm, status,  created_by_uid,  updated_by_uid, deleted_at)
SELECT 1, '92efd8f2-2709-432e-b88d-317a4fbd5a01', '内置模版', '内置模版不可删除', 'inner', '默认', '-', 1, null, null, 0
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM recognition_algorithm WHERE id = '92efd8f2-2709-432e-b88d-317a4fbd5a01');

INSERT INTO recognition_algorithm (recognition_algorithm_id, id, name, description, type, inner_type, algorithm, status,  created_by_uid,  updated_by_uid, deleted_at)
SELECT 2, 'a1b2c3d4-e5f6-4321-b987-654321fedcba', '身份证', '支持18位和15位身份证号码验证', 'inner', '身份证', '^[1-9]\\d{5}(?:18|19|20)\\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[1-2]\\d|3[0-1])\\d{3}[\\dXx]$|^[1-9]\\d{5}\\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[1-2]\\d|3[0-1])\\d{3}$', 1, null, null, 0
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM recognition_algorithm WHERE id = 'a1b2c3d4-e5f6-4321-b987-654321fedcba');

INSERT INTO recognition_algorithm (recognition_algorithm_id, id, name, description, type, inner_type, algorithm, status,  created_by_uid,  updated_by_uid, deleted_at)
SELECT 3, 'b2c3d4e5-f6a7-5432-c098-765432fedcba', '手机号', '支持13、14、15、16、17、18、19开头的手机号码验证', 'inner', '手机号', '^1[3-9]\\d{9}$', 1, null, null, 0
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM recognition_algorithm WHERE id = 'b2c3d4e5-f6a7-5432-c098-765432fedcba');

INSERT INTO recognition_algorithm (recognition_algorithm_id, id, name, description, type, inner_type, algorithm, status,  created_by_uid,  updated_by_uid, deleted_at)
SELECT 4, 'c3d4e5f6-a7b8-6543-d109-876543fedcba', '邮箱', '标准邮箱地址格式验证', 'inner', '邮箱', '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$', 1, null, null, 0
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM recognition_algorithm WHERE id = 'c3d4e5f6-a7b8-6543-d109-876543fedcba');

INSERT INTO recognition_algorithm (recognition_algorithm_id, id, name, description, type, inner_type, algorithm, status,  created_by_uid,  updated_by_uid, deleted_at)
SELECT 5, 'd4e5f6a7-b8c9-7654-e210-987654fedcba', '银行卡号', '支持13-19位数字的银行卡号验证', 'inner', '银行卡号', '^[1-9]\\d{12,18}$', 1, null, null, 0
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM recognition_algorithm WHERE id = 'd4e5f6a7-b8c9-7654-e210-987654fedcba');

