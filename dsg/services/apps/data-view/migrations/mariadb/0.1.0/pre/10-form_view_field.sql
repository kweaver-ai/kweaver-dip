use af_main;
-- ALTER TABLE form_view_field ADD COLUMN if not exists grade_id BIGINT(20) NULL DEFAULT NULL COMMENT '分级标签id' AFTER match_score;

-- ALTER TABLE form_view_field ADD COLUMN if not exists grade_type int(1) NULL DEFAULT NULL COMMENT '数据分级标签获得方式 1：auto（自动匹配分级） 2：manual（人工选择分级）' AFTER grade_id;