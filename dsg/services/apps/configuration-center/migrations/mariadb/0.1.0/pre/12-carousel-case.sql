USE af_configuration;

CREATE TABLE IF NOT EXISTS `t_carousel_case`
(
    `id`     char(36) NOT NULL,
    `application_example_id`     char(36)  NULL,
    `name` varchar(256) NOT NULL COMMENT '文件名',
    `uuid` varchar(256) NOT NULL COMMENT 'UUID文件名',
    `size` bigint(20) NOT NULL DEFAULT 0 COMMENT '文件大小',
    `save_path` text NOT NULL COMMENT '文件保存路径',
    `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) COMMENT '上传时间',
    `created_by` varchar(64) DEFAULT NULL COMMENT '上传用户ID',
    `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) COMMENT '更新时间',
    `type` char(36) NULL COMMENT '类型,1: 轮播图例,2: 本市州示例, 3: 其他市州示例',
    `interval_seconds` char(36) NOT NULL default 3 COMMENT '轮播间隔时间',
     `state`  char(36) NOT NULL default 0 COMMENT '状态,0: 启用,1: 禁用',
    `is_top` char(36) NOT NULL default 1 COMMENT '是否置顶,0为置顶，1为非置顶',
    PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '轮播图案例示例';


INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e01g', '0000663b-46a9-45e4-b6f7-a6bd8c18bd46', '9c95aa01-6559-48e7-88f3-dbd1b50f1798'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e01g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e02g', '0000663b-46a9-45e4-b6f7-a6bd8c18bd46', 'ecb6e712-1b7f-492a-8cb3-0f7fc299a0f2'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e02g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e03g', '00008516-45b3-44c9-9188-ca656969e20f', '211783fe-b79a-49f3-8a90-3402635b7456'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e03g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e04g', '00008516-45b3-44c9-9188-ca656969e20f', '9c95aa01-6559-48e7-88f3-dbd1b50f1798'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e04g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e05g', '00005871-cedd-4216-bde0-94ced210e898', '9c95aa01-6559-48e7-88f3-dbd1b50f1798'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e05g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e06g', '00005871-cedd-4216-bde0-94ced210e898', '29d08b27-1974-48de-8979-bcb222b90f72'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e06g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e07g', '00005871-cedd-4216-bde0-94ced210e898', '68e736d6-6a77-4b64-ad89-ead3d6c22c00'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e07g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e08g', '00005871-cedd-4216-bde0-94ced210e898', '982eaf56-74fb-484a-a390-e205d4c80d95'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e08g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e09g', '00004606-f318-450f-bc53-f0720b27acff', '9c95aa01-6559-48e7-88f3-dbd1b50f1798'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e09g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e10g', '00004606-f318-450f-bc53-f0720b27acff', 'f34ea9b3-0121-4e4e-8303-df989ee958da'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e10g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e11g', '00004606-f318-450f-bc53-f0720b27acff', '473a7956-25f6-4f1b-846b-94e71dc058cb'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e11g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e12g', '00004606-f318-450f-bc53-f0720b27acff', '982eaf56-74fb-484a-a390-e205d4c80d95'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e12g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e13g', '00004606-f318-450f-bc53-f0720b27acff', '68e736d6-6a77-4b64-ad89-ead3d6c22c00'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e13g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e14g', '00004606-f318-450f-bc53-f0720b27acff', '4ce45b8b-d19c-435b-81ce-f3abf561b21a'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e14g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e15g', '00004606-f318-450f-bc53-f0720b27acff', 'f9138813-cb42-408e-993b-9de758c0e6f9'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e15g' );

INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e55g', '00003148-fbbf-4879-988d-54af7c98c7ed', '49604f6f-dfc2-4faf-9aa8-69c05cc297b0'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e55g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e56g', '00003148-fbbf-4879-988d-54af7c98c7ed', 'c4be2537-7d5e-494f-890f-4ecf6d958476'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e56g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e57g', '00003148-fbbf-4879-988d-54af7c98c7ed', '0077a70c-37c9-46fd-a805-3a4265fb2830'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e57g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e58g', '00003148-fbbf-4879-988d-54af7c98c7ed', 'af703060-4f7a-4638-ac4a-c0d3c3af00d0'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e58g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e59g', '00003148-fbbf-4879-988d-54af7c98c7ed', '4cfdc28e-97f4-445b-9968-f575d61896e9'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e59g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e60g', '00003148-fbbf-4879-988d-54af7c98c7ed', '3273957b-f811-4639-9e08-3e6133fd891a'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e60g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e61g', '00003148-fbbf-4879-988d-54af7c98c7ed', 'edb4492e-a69c-4fc9-9609-2ba88b1624ca'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e61g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e62g', '00003148-fbbf-4879-988d-54af7c98c7ed', '0077a70c-37c9-46fd-a805-3a4265fb2847'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e62g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e63g', '00003148-fbbf-4879-988d-54af7c98c7ed', '0077a70c-37c9-46fd-a805-3a4265fb2851'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e63g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e64g', '00003148-fbbf-4879-988d-54af7c98c7ed', '0077a70c-37c9-46fd-a805-3a4265fb2848'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e64g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e65g', '00003148-fbbf-4879-988d-54af7c98c7ed', '0077a70c-37c9-46fd-a805-3a4265fb2852'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e65g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e66g', '00003148-fbbf-4879-988d-54af7c98c7ed', '67b4198b-4dd4-4029-a716-286e378d14b7'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e66g' );

INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e16g', '00003148-fbbf-4879-988d-54af7c98c7ed', '9c95aa01-6559-48e7-88f3-dbd1b50f1798'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e16g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e27g', '00003148-fbbf-4879-988d-54af7c98c7ed', 'a9aea8b6-8961-49b4-92ea-453ce2408470'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e27g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e28g', '00003148-fbbf-4879-988d-54af7c98c7ed', 'f34ea9b3-0121-4e4e-8303-df989ee958da'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e28g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e29g', '00003148-fbbf-4879-988d-54af7c98c7ed', '818be06d-d3ea-4f4f-815b-8704ae403ba6'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e29g' );


INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e67g', '00002fb7-1e54-4ce1-bc02-626cb1f85f62', '49604f6f-dfc2-4faf-9aa8-69c05cc297b0'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e67g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e68g', '00002fb7-1e54-4ce1-bc02-626cb1f85f62', 'c4be2537-7d5e-494f-890f-4ecf6d958476'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e68g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e69g', '00002fb7-1e54-4ce1-bc02-626cb1f85f62', '0077a70c-37c9-46fd-a805-3a4265fb2830'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e69g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e70g', '00002fb7-1e54-4ce1-bc02-626cb1f85f62', 'af703060-4f7a-4638-ac4a-c0d3c3af00d0'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e70g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e71g', '00002fb7-1e54-4ce1-bc02-626cb1f85f62', '4cfdc28e-97f4-445b-9968-f575d61896e9'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e71g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e72g', '00002fb7-1e54-4ce1-bc02-626cb1f85f62', '3273957b-f811-4639-9e08-3e6133fd891a'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e72g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e73g', '00002fb7-1e54-4ce1-bc02-626cb1f85f62', 'edb4492e-a69c-4fc9-9609-2ba88b1624ca'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e73g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e74g', '00002fb7-1e54-4ce1-bc02-626cb1f85f62', '0077a70c-37c9-46fd-a805-3a4265fb2847'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e74g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e75g', '00002fb7-1e54-4ce1-bc02-626cb1f85f62', '0077a70c-37c9-46fd-a805-3a4265fb2851'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e75g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e76g', '00002fb7-1e54-4ce1-bc02-626cb1f85f62', '0077a70c-37c9-46fd-a805-3a4265fb2848'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e76g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e77g', '00002fb7-1e54-4ce1-bc02-626cb1f85f62', '0077a70c-37c9-46fd-a805-3a4265fb2852'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e77g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e78g', '00002fb7-1e54-4ce1-bc02-626cb1f85f62', '67b4198b-4dd4-4029-a716-286e378d14b7'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e78g' );

INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e32g', '00002fb7-1e54-4ce1-bc02-626cb1f85f62', 'f34ea9b3-0121-4e4e-8303-df989ee958da'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e32g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e30g', '00002fb7-1e54-4ce1-bc02-626cb1f85f62', 'afbcdb6c-cb85-4a0c-82ee-68c9f1465684'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e30g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e31g', '00002fb7-1e54-4ce1-bc02-626cb1f85f62', '9c95aa01-6559-48e7-88f3-dbd1b50f1798'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e31g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e42g', '00002fb7-1e54-4ce1-bc02-626cb1f85f62', 'a9aea8b6-8961-49b4-92ea-453ce2408470'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e42g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e43g', '00002fb7-1e54-4ce1-bc02-626cb1f85f62', '818be06d-d3ea-4f4f-815b-8704ae403ba6'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e43g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e44g', '00007030-4e75-4c5e-aa56-f1bdf7044791', 'ab9ce811-e5fd-4b44-9d93-926a90427ab6'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e44g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e45g', '00007030-4e75-4c5e-aa56-f1bdf7044791', '9c95aa01-6559-48e7-88f3-dbd1b50f1798'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e45g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e40g', '00001f64-209f-4260-91f8-c61c6f820136', '473a7956-25f6-4f1b-846b-94e71dc058cb'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e40g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e46g', '00001f64-209f-4260-91f8-c61c6f820136', '41095041-05dc-4139-b6cd-e786079db2ab'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e46g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e47g', '00001f64-209f-4260-91f8-c61c6f820136', 'fa77a70c-37c9-46fd-a805-3a4265fb28b9'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e47g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e48g', '00001f64-209f-4260-91f8-c61c6f820136', '31c09e56-cf9a-42fd-aea5-9ee7fa781cd0'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e48g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e49g', '00001f64-209f-4260-91f8-c61c6f820136', 'e9a9bdc9-bc2e-4222-87ba-5d3751ec6a04'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e49g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e50g', '00001f64-209f-4260-91f8-c61c6f820136', '167d41c2-4b37-47e1-9c29-d103c4873f4f'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e50g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e50g', '00001f64-209f-4260-91f8-c61c6f820136', '473a7956-25f6-4f1b-846b-94e71dc058cb'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e50g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e51g', '00001f64-209f-4260-91f8-c61c6f820136', '9070e117-273b-4c70-8b93-1aecdee05b28'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e51g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e52g', '00001f64-209f-4260-91f8-c61c6f820136', '7c4f09cb-ab38-45c9-8224-843f8b6a373f'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e52g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e53g', '00001f64-209f-4260-91f8-c61c6f820136', '18abfb60-5b18-4e63-9010-63fce5b5eb3e'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e53g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e54g', '00108516-45b3-44c9-9188-ca656969e20g', 'f077a70c-37c9-46fd-a805-3a4265fb28b0'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e54g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e80g', '00108516-45b3-44c9-9188-ca656969e20g', '9c95aa01-6559-48e7-88f3-dbd1b50f1798'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e80g' );

INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e81g', '00004606-f318-450f-bc53-f0720b27acff', '5c100c9e-5f93-48fb-92ef-d5a898aa3fe0'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e81g' );

-- INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
-- SELECT '10108516-45b3-44c9-9188-ca656969e82g', '00004606-f318-450f-bc53-f0720b27acff', '0077a70c-37c9-46fd-a805-3a4265fb2885'
-- FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e82g' );

INSERT INTO `user_role_bindings` (`id`,`user_id`, `role_id`)
SELECT '0100a2d9-c244-4d09-8e44-c2fea0e0e3f0', '266c6a42-6131-4d62-8f39-853e7093701c', '00001f64-209f-4260-91f8-c61c6f820136'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `user_role_bindings` WHERE `id` = '0100a2d9-c244-4d09-8e44-c2fea0e0e3f0' );

-- delete from `role_permission_bindings` where `id` = '10108516-45b3-44c9-9188-ca656969e82g';