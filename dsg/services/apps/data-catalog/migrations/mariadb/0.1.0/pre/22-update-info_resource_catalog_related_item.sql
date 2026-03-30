use af_data_catalog;

-- 添加类型字段
-- ALTER TABLE t_info_resource_catalog_related_item  add column if not exists `f_related_item_data_type` varchar(128) not null default '' comment '关联信息项数据类型';