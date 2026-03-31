use af_data_catalog;

CREATE TABLE IF NOT EXISTS `t_my_favorite` (
  `id` bigint(20) NOT NULL COMMENT '唯一id，雪花算法',
  `res_type` tinyint(2) NOT NULL COMMENT '资源类型 1 数据资源目录 2 信息资源目录 3 电子证照目录',
  `res_id` VARCHAR(64) NOT NULL COMMENT '资源ID',
  `created_at` DATETIME(3) NOT NULL DEFAULT current_timestamp(3) COMMENT '创建/收藏时间',
  `created_by` CHAR(36) NOT NULL COMMENT '创建/收藏人ID',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uni_my_favorite` (`created_by`,`res_type`,`res_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='我的收藏记录表';
