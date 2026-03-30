USE af_data_catalog;

-- ALTER TABLE `t_data_catalog` MODIFY COLUMN IF EXISTS `online_status` varchar(20) NOT NULL DEFAULT 'notline' COMMENT '接口状态 未上线 notline、已上线 online、已下线offline、上线审核中up-auditing、下线审核中down-auditing、上线审核未通过up-reject、下线审核未通过down-reject、已下线（上线审核中）offline-up-auditing、已下线（上线审核未通过）offline-up-reject';