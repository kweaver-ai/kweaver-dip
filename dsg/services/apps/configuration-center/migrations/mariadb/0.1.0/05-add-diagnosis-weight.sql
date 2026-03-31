USE af_configuration;


-- 综合评价权重

INSERT INTO `configuration`(`key`, value, `type`) SELECT 'diagnosis_completeness_weight', '0.3334', '11' FROM DUAL
    WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'diagnosis_completeness_weight' and `type`='11');  -- 完整度
INSERT INTO `configuration`(`key`, value, `type`) SELECT 'diagnosis_maturity_weight', '0.3333', '11' FROM DUAL
    WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'diagnosis_maturity_weight' and `type`='11');   -- 成熟度
INSERT INTO `configuration`(`key`, value, `type`) SELECT 'diagnosis_consistency_weight', '0.3333', '11' FROM DUAL
    WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'diagnosis_consistency_weight' and `type`='11');   -- 一致性





--  成熟度
INSERT INTO `configuration`(`key`, value, `type`) SELECT 'diagnosis_business_maturity_weight', '0.3334', '11' FROM DUAL
    WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'diagnosis_business_maturity_weight' and `type`='11');   -- 业务成熟度
INSERT INTO `configuration`(`key`, value, `type`) SELECT 'diagnosis_system_maturity_weight', '0.3333', '11' FROM DUAL
    WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'diagnosis_system_maturity_weight' and `type`='11');   -- 系统成熟度
INSERT INTO `configuration`(`key`, value, `type`) SELECT 'diagnosis_data_maturity_weight', '0.3333', '11' FROM DUAL
    WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'diagnosis_data_maturity_weight' and `type`='11');   -- 数据成熟度


-- 一致性
INSERT INTO `configuration`(`key`, value, `type`) SELECT 'diagnosis_standard_consistency_weight', '0.3334', '11' FROM DUAL
    WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'diagnosis_standard_consistency_weight' and `type`='11');   -- 标准一致性
INSERT INTO `configuration`(`key`, value, `type`) SELECT 'diagnosis_flowchart_consistency_weight', '0.3333', '11' FROM DUAL
    WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'diagnosis_flowchart_consistency_weight' and `type`='11');   -- 流程一致性
INSERT INTO `configuration`(`key`, value, `type`) SELECT 'diagnosis_indicator_consistency_weight', '0.3333', '11' FROM DUAL
    WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'diagnosis_indicator_consistency_weight' and `type`='11');   -- 指标一致性


-- 业务成熟度
INSERT INTO `configuration`(`key`, value, `type`) SELECT 'diagnosis_business_standardized_weight', '0.3334', '11' FROM DUAL
    WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'diagnosis_business_standardized_weight' and `type`='11');   -- 业务标准化率
INSERT INTO `configuration`(`key`, value, `type`) SELECT 'diagnosis_flowchart_closed_loop_weight', '0.3333', '11' FROM DUAL
    WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'diagnosis_flowchart_closed_loop_weight' and `type`='11');   -- 业务闭环率
INSERT INTO `configuration`(`key`, value, `type`) SELECT 'diagnosis_flowchart_redundancy_weight', '0.3333', '11' FROM DUAL
    WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'diagnosis_flowchart_redundancy_weight' and `type`='11');   -- 流程冗余率


-- 系统成熟度
INSERT INTO `configuration`(`key`, value, `type`) SELECT 'diagnosis_business_informatization_weight', '0.3333', '11' FROM DUAL
    WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'diagnosis_business_informatization_weight' and `type`='11');   -- 业务业务信息化率
INSERT INTO `configuration`(`key`, value, `type`) SELECT 'diagnosis_data_perfection_weight', '0.3333', '11' FROM DUAL
    WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'diagnosis_data_perfection_weight' and `type`='11');   -- 数据完整度
INSERT INTO `configuration`(`key`, value, `type`) SELECT 'diagnosis_data_standardized_weight', '0.3334', '11' FROM DUAL
    WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'diagnosis_data_standardized_weight' and `type`='11');   -- 数据标准率
