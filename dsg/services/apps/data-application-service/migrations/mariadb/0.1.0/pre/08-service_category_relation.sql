USE data_application_service;

CREATE TABLE IF NOT EXISTS `service_category_relation` (
     `id` BIGINT(20) NOT NULL COMMENT '唯一id，雪花算法',
     `category_id` CHAR(36) NOT NULL COMMENT '类目id',
     `category_node_id` CHAR(36) NULL DEFAULT NULL COMMENT '类目节点id',
     `service_id` VARCHAR(255) NOT NULL COMMENT '接口服务id',
     `deleted_at` BIGINT(20) NOT NULL DEFAULT 0 COMMENT '逻辑删除时间戳',
     PRIMARY KEY (`id`)
) COMMENT='服务类目关系表';
