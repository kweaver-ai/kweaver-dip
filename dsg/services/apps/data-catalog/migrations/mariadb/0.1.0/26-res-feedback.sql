USE af_data_catalog;

CREATE TABLE IF NOT EXISTS `t_res_feedback` (
    `id` bigint(20) NOT NULL COMMENT '唯一id，雪花算法',
    `res_id` varchar(64) NOT NULL COMMENT '资源ID',
    `res_type` tinyint(2) NOT NULL COMMENT '资源类型 1 逻辑视图  2 接口服务  3 指标',
    `feedback_type` tinyint(2) NOT NULL COMMENT '反馈类型 1：信息有误  2：数据质量问题  3：其他',
    `feedback_desc` varchar(300) NOT NULL COMMENT '反馈描述',
    `status` tinyint(2) NOT NULL COMMENT '反馈状态 1 待处理 9 已回复',
    `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) COMMENT '创建/反馈时间',
    `created_by` char(36) NOT NULL COMMENT '创建/反馈人ID',
    `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) COMMENT '更新时间',
    `replied_at` datetime(3) DEFAULT NULL COMMENT '反馈回复时间',
     PRIMARY KEY (`id`),
     KEY `idx_feedback_type` (`feedback_type`),
     KEY `idx_res_type` (`res_type`),
     KEY `idx_feedback_status` (`status`),
     KEY `idx_feedback_created_by` (`created_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='资源反馈记录表';
