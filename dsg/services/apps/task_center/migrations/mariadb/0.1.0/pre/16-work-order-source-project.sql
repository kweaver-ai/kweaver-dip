USE `af_tasks`;

-- ALTER TABLE `work_order`
--     ADD COLUMN IF NOT EXISTS `node_id`  CHAR(36) DEFAULT NULL COMMENT '工单所属项目的运营流程节点 ID，仅当来源是项目时有值',
--     ADD COLUMN IF NOT EXISTS `stage_id` CHAR(36) DEFAULT NULL COMMENT '工单所属项目的运营流程阶段 ID，仅当来源是项目时有值';
--
-- ALTER TABLE `tc_project`
--     ADD COLUMN IF NOT EXISTS `project_type` int(11) NOT NULL DEFAULT 1 COMMENT '任务类型，取值范围 1 本地创建(任务) 2 来自第三方' after complete_time;
--
-- ALTER TABLE `tc_flow_info`
--     ADD COLUMN IF NOT EXISTS `work_order_type` VARCHAR(10) DEFAULT NULL COMMENT '任务类型数组' after task_type;
