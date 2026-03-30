-- 为数据推送模型表添加第三方用户ID字段
-- 日期: 2025-06-09
-- 用途: 支持数据推送回调时使用第三方用户ID作为部门代码

use af_data_catalog;

-- 添加第三方用户ID字段
-- ALTER TABLE t_data_push_model ADD COLUMN IF NOT EXISTS `f_third_user_id` varchar(255) default NULL COMMENT '创建者第三方用户ID' AFTER `creator_name`;
--
-- -- 添加第三方部门ID字段
-- ALTER TABLE t_data_push_model ADD COLUMN IF NOT EXISTS `f_third_dept_id` varchar(255) default NULL COMMENT '创建者第三方部门ID' AFTER `f_third_user_id`;

-- 为现有数据回填第三方用户ID (可选，如果需要立即回填的话)
UPDATE t_data_push_model 
SET f_third_user_id = (
    SELECT u.f_third_user_id 
    FROM af_configuration.user u 
    WHERE u.id = t_data_push_model.creator_uid
) 
WHERE f_third_user_id IS NULL AND creator_uid IS NOT NULL; 