use af_data_catalog;

-- ALTER TABLE `t_data_catalog` MODIFY COLUMN IF EXISTS `app_scene_classify` tinyint(2) DEFAULT NULL COMMENT '应用场景分类 1 政务服务、2 公共服务、3 监管、4 其他';
-- ALTER TABLE `t_data_catalog_history` MODIFY COLUMN IF EXISTS `app_scene_classify` tinyint(2) DEFAULT NULL COMMENT '应用场景分类 1 政务服务、2 公共服务、3 监管、4 其他';