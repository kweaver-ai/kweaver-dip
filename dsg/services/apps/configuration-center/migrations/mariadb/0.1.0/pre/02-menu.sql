USE af_configuration;

CREATE TABLE IF NOT EXISTS `menu`
(
    `id`     bigint(20) NOT NULL,
    `platform` int(11) NOT NULL COMMENT '菜单归属平台',
    `value`  text   NOT NULL COMMENT '菜单路由',
    PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;