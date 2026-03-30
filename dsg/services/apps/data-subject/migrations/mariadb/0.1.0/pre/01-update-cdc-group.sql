USE af_main;

CREATE TABLE IF NOT EXISTS  `cdc_task` (
    `database` varchar(255) NOT NULL COMMENT '同步库名',
    `table` varchar(255) NOT NULL COMMENT '同步表名',
    `columns` varchar(255) NOT NULL COMMENT '同步的列，多个列写在一起，用 , 隔开',
    `topic` varchar(255) NOT NULL COMMENT '数据变动投递消息的topic',
    `group_id` varchar(255) NOT NULL COMMENT '当前记录对应的group id',
    `id` varchar(255) NOT NULL COMMENT '当前同步记录id',
    `updated_at` datetime(3) NOT NULL COMMENT '当前同步记录时间',
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

update af_main.cdc_task set group_id='af.auth-service' where  group_id='auth-service'