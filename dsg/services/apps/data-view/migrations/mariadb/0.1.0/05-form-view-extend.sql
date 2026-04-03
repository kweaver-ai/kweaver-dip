use af_main;

CREATE TABLE IF NOT EXISTS `t_form_view_extend` (
    `id` char(36) NOT NULL COMMENT '逻辑视图uuid',
    `is_audited` int(1) NOT NULL  COMMENT '是否已稽核',
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='逻辑视图扩展表';