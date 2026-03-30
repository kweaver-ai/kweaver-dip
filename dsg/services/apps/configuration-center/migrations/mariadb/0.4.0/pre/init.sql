USE af_configuration;

CREATE TABLE IF NOT EXISTS `configuration` (
    `key` varchar(255) NOT NULL,
    `value` varchar(255) DEFAULT NULL,
    `type` tinyint(4) NOT NULL DEFAULT 1 COMMENT '字典类型',
    PRIMARY KEY (`key`),
    KEY `configuration_type_IDX` (`type`) USING BTREE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='字典表';

INSERT  INTO `configuration`(`key`,`value`,`type`)
SELECT 'AISampleDataShow', 'YES', '4'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'AISampleDataShow' );

INSERT INTO `configuration` (`key`,`value`,`type`)
SELECT 'AlgServerConf', '{\"app_id\":\"NZ55ab9qSdbI3NlGR5x\", \"service_id\":\"24ecd8ce3a934ecd89b6fc0ec3aa545c\"}', '5'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'AlgServerConf');

INSERT INTO `configuration` (`key`,`value`,`type`)
SELECT 'BIAnalysis', 'http://10.4.132.124:9080', '2'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'BIAnalysis' );

INSERT INTO `configuration` (`key`,`value`,`type`)
SELECT 'BusinessKnowledgeNetwork', 'https://10.4.132.124', '2'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'BusinessKnowledgeNetwork' );

INSERT INTO `configuration` (`key`,`value`,`type`)
SELECT 'Dolphin', 'http://36.152.209.113:12345', '2'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'Dolphin' );

INSERT INTO `configuration` (`key`,`value`,`type`)
SELECT 'provider', '', '3'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'provider' );

INSERT INTO `configuration` (`key`,`value`,`type`)
SELECT 'Standardization', 'http://standardization:80', '2'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'Standardization' );

INSERT INTO `configuration` (`key`,`value`,`type`)
SELECT '产业大脑', 'https://cydn-demo.aishu.cn/home/homePage', '1'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = '产业大脑' );

INSERT INTO `configuration` (`key`,`value`,`type`)
SELECT '指标溯源与影响分析', 'https://anyfabric-demo.aishu.cn/anyfabric/data-catalog/developing', '1'
FROM DUAL WHERE NOT EXISTS( SELECT `key` FROM `configuration` WHERE `key` = '指标溯源与影响分析' );

INSERT INTO `configuration` (`key`,`value`,`type`)
SELECT '流程可视化监控与分析', 'https://anyfabric-demo.aishu.cn/anyfabric/data-catalog/developing', '1'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = '流程可视化监控与分析' );

INSERT  INTO `configuration`(`key`,`value`,`type`)
SELECT 'min_score', '0.80', '6'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'min_score' );

INSERT  INTO `configuration`(`key`,`value`,`type`)
SELECT 'dept_layer', '4', '6'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'dept_layer' );

INSERT  INTO `configuration`(`key`,`value`,`type`)
SELECT 'domain_layer', '3', '6'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'domain_layer' );

INSERT  INTO `configuration`(`key`,`value`,`type`)
SELECT 'top_n', '20', '6'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'top_n' );

INSERT  INTO `configuration`(`key`,`value`,`type`)
SELECT 'q_bus_domain_weight', '0.5', '6'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'q_bus_domain_weight' );
INSERT  INTO `configuration`(`key`,`value`,`type`)
SELECT 'q_bus_domain_used_weight', '0.6', '6'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'q_bus_domain_used_weight' );
INSERT  INTO `configuration`(`key`,`value`,`type`)
SELECT 'q_bus_domain_unused_weight', '0.4', '6'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'q_bus_domain_unused_weight' );

INSERT  INTO `configuration`(`key`,`value`,`type`)
SELECT 'q_dept_weight', '0.3', '6'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'q_dept_weight' );
INSERT  INTO `configuration`(`key`,`value`,`type`)
SELECT 'q_dept_used_weight', '0.3', '6'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'q_dept_used_weight' );
INSERT  INTO `configuration`(`key`,`value`,`type`)
SELECT 'q_dept_unused_weight', '0.3', '6'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'q_dept_unused_weight' );
INSERT  INTO `configuration`(`key`,`value`,`type`)
SELECT 'q_info_sys_weight', '0.2', '6'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'q_info_sys_weight' );

INSERT  INTO `configuration`(`key`,`value`,`type`)
SELECT 'q_info_sys_used_weight', '0.3', '6'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'q_info_sys_used_weight' );
INSERT  INTO `configuration`(`key`,`value`,`type`)
SELECT 'q_info_sys_unused_weight', '0.3', '6'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'q_info_sys_unused_weight' );

INSERT  INTO `configuration`(`key`,`value`,`type`)
SELECT 's_bus_domain_weight', '0.5', '6'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 's_bus_domain_weight' );
INSERT  INTO `configuration`(`key`,`value`,`type`)
SELECT 's_bus_domain_used_weight', '0.6', '6'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 's_bus_domain_used_weight' );
INSERT  INTO `configuration`(`key`,`value`,`type`)
SELECT 's_bus_domain_unused_weight', '0.4', '6'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 's_bus_domain_unused_weight' );
INSERT  INTO `configuration`(`key`,`value`,`type`)
SELECT 's_dept_weight', '0.3', '6'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 's_dept_weight' );
INSERT  INTO `configuration`(`key`,`value`,`type`)
SELECT 's_dept_used_weight', '0.3', '6'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 's_dept_used_weight' );
INSERT  INTO `configuration`(`key`,`value`,`type`)
SELECT 's_dept_unused_weight', '0.3', '6'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 's_dept_unused_weight' );

INSERT  INTO `configuration`(`key`,`value`,`type`)
SELECT 's_info_sys_weight', '0.2', '6'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 's_info_sys_weight' );
INSERT  INTO `configuration`(`key`,`value`,`type`)
SELECT 's_info_sys_used_weight', '0.3', '6'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 's_info_sys_used_weight' );
INSERT  INTO `configuration`(`key`,`value`,`type`)
SELECT 's_info_sys_unused_weight', '0.3', '6'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 's_info_sys_unused_weight' );

INSERT  INTO `configuration`(`key`,`value`,`type`)
SELECT 'r_std_type_weight_0', '0.006', '6'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'r_std_type_weight_0' );
INSERT  INTO `configuration`(`key`,`value`,`type`)
SELECT 'r_std_type_weight_1', '0.007', '6'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'r_std_type_weight_1' );
INSERT  INTO `configuration`(`key`,`value`,`type`)
SELECT 'r_std_type_weight_2', '0.008', '6'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'r_std_type_weight_2' );
INSERT  INTO `configuration`(`key`,`value`,`type`)
SELECT 'r_std_type_weight_3', '0.009', '6'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'r_std_type_weight_3' );
INSERT  INTO `configuration`(`key`,`value`,`type`)
SELECT 'r_std_type_weight_4', '0.001', '6'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'r_std_type_weight_4' );
INSERT  INTO `configuration`(`key`,`value`,`type`)
SELECT 'r_std_type_weight_5', '0.005', '6'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'r_std_type_weight_5' );
INSERT  INTO `configuration`(`key`,`value`,`type`)
SELECT 'r_std_type_weight_6', '0.004', '6'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'r_std_type_weight_6' );
INSERT  INTO `configuration`(`key`,`value`,`type`)
SELECT 'r_std_type_weight_99', '0.0', '6'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'r_std_type_weight_99' );
INSERT  INTO `configuration`(`key`,`value`,`type`)
SELECT 'r_default_department_id', '9060f92a-3c6c-11f0-9815-12b58a7f919c', '6'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'r_default_department_id' );
INSERT  INTO `configuration`(`key`,`value`,`type`)
SELECT 'direct_qa', 'false', '8'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'direct_qa' );
INSERT  INTO `configuration`(`key`,`value`,`type`)
SELECT 'sql_limit', '100', '8'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'sql_limit' );
INSERT  INTO `configuration`(`key`,`value`,`type`)
SELECT 'sailor_agent_react_mode', 'true', '8'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'sailor_agent_react_mode' );
INSERT  INTO `configuration`(`key`,`value`,`type`)
SELECT 'sailor_agent_indicator_recall_top_k', '4', '8'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'sailor_agent_indicator_recall_top_k' );
INSERT  INTO `configuration`(`key`,`value`,`type`)
SELECT 'sailor_task_ex_time', '86400', '9'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'sailor_task_ex_time' );
INSERT  INTO `configuration`(`key`,`value`,`type`)
SELECT 'sailor_llm_input_len', '4000', '9'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'sailor_llm_input_len' );
INSERT  INTO `configuration`(`key`,`value`,`type`)
SELECT 'sailor_llm_out_len', '4000', '9'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'sailor_llm_out_len' );
INSERT  INTO `configuration`(`key`,`value`,`type`)
SELECT 'sailor_agent_llm_input_len', '8000', '9'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'sailor_agent_llm_input_len' );
INSERT  INTO `configuration`(`key`,`value`,`type`)
SELECT 'sailor_agent_llm_out_len', '8000', '9'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'sailor_agent_llm_out_len' );
INSERT  INTO `configuration`(`key`,`value`,`type`)
SELECT 'sailor_agent_return_record_limit', '-1', '9'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'sailor_agent_return_record_limit' );
INSERT  INTO `configuration`(`key`,`value`,`type`)
SELECT 'sailor_agent_return_data_limit', '-1', '9'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'sailor_agent_return_data_limit' );
INSERT  INTO `configuration`(`key`,`value`,`type`)
SELECT 'dimension_num_limit', '-1', '9'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'dimension_num_limit' );

INSERT  INTO `configuration`(`key`,`value`,`type`)
SELECT 'government_data_share', 'false', '0'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'government_data_share' );
INSERT  INTO `configuration`(`key`,`value`,`type`)
SELECT 'local_app', 'true', '0'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'local_app' );
INSERT  INTO `configuration`(`key`,`value`,`type`)
SELECT 'using', '1', '0'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'using' );
INSERT  INTO `configuration`(`key`,`value`,`type`)
SELECT 'cssjj', 'false', '0'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'cssjj' );

INSERT  INTO `configuration`(`key`,`value`,`type`)
SELECT '1', '业务表', '10'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = '1' and `type`='10');
INSERT  INTO `configuration`(`key`,`value`,`type`)
SELECT '2', '信息资源目录', '10'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = '2' and `type`='10');

INSERT  INTO `configuration`(`key`,`value`,`type`)
SELECT 'third_party', 'false', '0'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'third_party' );

INSERT  INTO `configuration`(`key`,`value`,`type`)
SELECT 'quality_pass_score', '100', '0'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'quality_pass_score' );

INSERT  INTO `configuration`(`key`,`value`,`type`)
SELECT 'quality_exemption_score', '100', '0'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'quality_exemption_score' );


INSERT INTO `configuration`(`key`, value, `type`) SELECT 'rec_label.query.query_min_score', '0.75', '6' FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'rec_label.query.query_min_score' and `type`='6');

INSERT INTO `configuration`(`key`, value, `type`) SELECT 'rec_label.query.vector_min_score', '0.75', '6' FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'rec_label.query.vector_min_score' and `type`='6');

INSERT INTO `configuration`(`key`, value, `type`) SELECT 'rec_label.query.top_n', '10', '6' FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'rec_label.query.top_n' and `type`='6');

INSERT INTO `configuration`(`key`, value, `type`) SELECT 'rec_label.filter.llm.with_execute', 'False', '6' FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'rec_label.filter.llm.with_execute' and `type`='6');

INSERT INTO `configuration`(`key`, value, `type`) SELECT 'rec_label.filter.llm.prompt_name', 'recommend_filter', '6' FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'rec_label.filter.llm.prompt_name' and `type`='6');

INSERT INTO `configuration`(`key`, value, `type`) SELECT 'rec_label.filter.ml.with_execute', 'False', '6' FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'rec_label.filter.ml.with_execute' and `type`='6');

INSERT INTO `configuration`(`key`, value, `type`) SELECT 'rec_label.filter.ml.name', '', '6' FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'rec_label.filter.ml.name' and `type`='6');

INSERT INTO `configuration`(`key`, value, `type`) SELECT 'rec_label.filter.rule.with_execute', 'False', '6' FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'rec_label.filter.rule.with_execute' and `type`='6');

INSERT INTO `configuration`(`key`, value, `type`) SELECT 'rec_label.filter.rule.name', '', '6' FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'rec_label.filter.rule.name' and `type`='6');
INSERT INTO `configuration`(`key`, value, `type`) SELECT 'rec_llm_input_len', '8000', '6' FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'rec_llm_input_len' and `type`='6');
INSERT INTO `configuration`(`key`, value, `type`) SELECT 'rec_llm_output_len', '8000', '6' FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'rec_llm_output_len' and `type`='6');

INSERT INTO `configuration`(`key`, value, `type`) SELECT 'dimension_num_limit', '-1', '9' FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'dimension_num_limit' and `type`='9');
INSERT INTO `configuration`(`key`, value, `type`) SELECT 'data_market_llm_temperature', '0.2', '9' FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'data_market_llm_temperature' and `type`='9');

INSERT  INTO `configuration`(`key`,`value`,`type`)
SELECT 'sailor_search_if_history_qa_enhance', '0', '9'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'sailor_search_if_history_qa_enhance' and `type`='9');

INSERT  INTO `configuration`(`key`,`value`,`type`)
SELECT 'sailor_search_if_kecc', '0', '9'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'sailor_search_if_kecc' and `type`='9');

INSERT  INTO `configuration`(`key`,`value`,`type`)
SELECT 'sailor_search_if_auth_in_find_data_qa', '1', '9'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'sailor_search_if_auth_in_find_data_qa' and `type`='9');

INSERT  INTO `configuration`(`key`,`value`,`type`)
SELECT 'sailor_vec_min_score_analysis_search', '0.5', '9'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'sailor_vec_min_score_analysis_search' and `type`='9');

INSERT  INTO `configuration`(`key`,`value`,`type`)
SELECT 'sailor_vec_knn_k_analysis_search', '20', '9'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'sailor_vec_knn_k_analysis_search' and `type`='9');

INSERT  INTO `configuration`(`key`,`value`,`type`)
SELECT 'sailor_vec_size_analysis_search', '20', '9'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'sailor_vec_size_analysis_search' and `type`='9');

INSERT  INTO `configuration`(`key`,`value`,`type`)
SELECT 'sailor_vec_min_score_kecc', '0.5', '9'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'sailor_vec_min_score_kecc' and `type`='9');

INSERT  INTO `configuration`(`key`,`value`,`type`)
SELECT 'sailor_vec_knn_k_kecc', '10', '9'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'sailor_vec_knn_k_kecc' and `type`='9');

INSERT  INTO `configuration`(`key`,`value`,`type`)
SELECT 'sailor_vec_size_kecc', '10', '9'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'sailor_vec_size_kecc' and `type`='9');

INSERT  INTO `configuration`(`key`,`value`,`type`)
SELECT 'kg_id_kecc', '6839', '9'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'kg_id_kecc' and `type`='9');

INSERT  INTO `configuration`(`key`,`value`,`type`)
SELECT 'sailor_vec_min_score_history_qa', '0.7', '9'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'sailor_vec_min_score_history_qa' and `type`='9');

INSERT  INTO `configuration`(`key`,`value`,`type`)
SELECT 'sailor_vec_knn_k_history_qa', '10', '9'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'sailor_vec_knn_k_history_qa' and `type`='9');

INSERT  INTO `configuration`(`key`,`value`,`type`)
SELECT 'sailor_vec_size_history_qa', '10', '9'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'sailor_vec_size_history_qa' and `type`='9');

INSERT  INTO `configuration`(`key`,`value`,`type`)
SELECT 'kg_id_history_qa', '19467', '9'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'kg_id_history_qa' and `type`='9');

INSERT  INTO `configuration`(`key`,`value`,`type`)
SELECT 'sailor_token_tactics_history_qa', '1', '9'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'sailor_token_tactics_history_qa' and `type`='9');


INSERT  INTO `configuration`(`key`,`value`,`type`)
SELECT 'sailor_search_qa_llm_temperature', '0', '9'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'sailor_search_qa_llm_temperature' and `type`='9');

INSERT  INTO `configuration`(`key`,`value`,`type`)
SELECT 'sailor_search_qa_llm_top_p', '1', '9'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'sailor_search_qa_llm_top_p' and `type`='9');

INSERT  INTO `configuration`(`key`,`value`,`type`)
SELECT 'sailor_search_qa_llm_presence_penalty', '0', '9'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'sailor_search_qa_llm_presence_penalty' and `type`='9');

INSERT  INTO `configuration`(`key`,`value`,`type`)
SELECT 'sailor_search_qa_llm_frequency_penalty', '0', '9'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'sailor_search_qa_llm_frequency_penalty' and `type`='9');

INSERT  INTO `configuration`(`key`,`value`,`type`)
SELECT 'sailor_search_qa_llm_max_tokens', '8000', '9'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'sailor_search_qa_llm_max_tokens' and `type`='9');

INSERT  INTO `configuration`(`key`,`value`,`type`)
SELECT 'sailor_search_qa_llm_input_len', '4000', '9'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'sailor_search_qa_llm_input_len' and `type`='9');

INSERT  INTO `configuration`(`key`,`value`,`type`)
SELECT 'sailor_search_qa_llm_output_len', '4000', '9'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'sailor_search_qa_llm_output_len' and `type`='9');

INSERT  INTO `configuration`(`key`,`value`,`type`)
SELECT 'search_dip_agent_key', '01KH0FXDT9SKRNKRB59S4PTMF8', '8'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'search_dip_agent_key' and `type`='8');



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

-- 样例数据
INSERT  INTO `configuration`(`key`,`value`,`type`)
SELECT 'sample_data_count', '5', '0'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'sample_data_count' );
INSERT  INTO `configuration`(`key`,`value`,`type`)
SELECT 'sample_data_type', 'synthetic', '0'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'sample_data_type' );

-- 是否数字员工菜单1是、0否
INSERT INTO `configuration` (`key`,`value`,`type`)
SELECT 'digital_human', '1', '12'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'digital_human' );

CREATE TABLE IF NOT EXISTS `datasource` (
    `data_source_id` bigint(20) NOT NULL COMMENT '数据源雪花id',
    `id` char(36) NOT NULL COMMENT '数据源业务id',
    `info_system_id` char(36) DEFAULT NULL COMMENT '信息系统id',
    `name` varchar(128) NOT NULL COMMENT '数据源名称',
    `catalog_name` varchar(255) NOT NULL DEFAULT '' COMMENT '数据源catalog名称',
    `host` varchar(256) NOT NULL COMMENT '连接地址',
    `port` int(11) NOT NULL COMMENT '端口',
    `username` varchar(128) NOT NULL COMMENT '用户名',
    `password` varchar(1024) NOT NULL COMMENT '密码',
    `database_name` varchar(128) NOT NULL COMMENT '数据库名称',
    `schema` varchar(128) NOT NULL COMMENT '数据库模式',
    `type_name` varchar(128) NOT NULL COMMENT '数据库类型名称',
    `source_type` TINYINT DEFAULT 1 NOT NULL COMMENT '数据源类型 1:信息系统、2:数据仓库、 3：数据沙箱',
    `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) COMMENT '创建时间',
    `created_by_uid` char(36)  DEFAULT NULL,
    `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3)  COMMENT '更新时间',
    `updated_by_uid` char(36) DEFAULT NULL,
    `excel_protocol` varchar(128) COMMENT 'excel 存储位置',
    `excel_base` varchar(128) COMMENT 'excel 路径',
    `department_id`  char(36)  COMMENT '关联部门id',
    `enabled`  tinyint(2)  COMMENT '是否启用',
    `hua_ao_id`  varchar(256)  COMMENT '华傲数据源id',
    `connect_status`  tinyint(2) DEFAULT 1  COMMENT '连接状态 1已连接 2未连接',
    PRIMARY KEY (`data_source_id`),
    UNIQUE KEY `uk_datasource` (`info_system_id`,`name`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `flowchart` (
    `id` varchar(36) NOT NULL COMMENT '主键，uuid',
    `name` varchar(128) NOT NULL DEFAULT '' COMMENT '运营流程名称',
    `description` varchar(255) NOT NULL DEFAULT '' COMMENT '运营流程描述说明',
    `edit_status` tinyint(4) NOT NULL DEFAULT 1 COMMENT '当前版本运营流程编辑状态，枚举：1：新建中；2：正常；3：编辑中',
    `current_version_id` varchar(36) NOT NULL DEFAULT '' COMMENT '当前使用的已发布运营流程版本ID',
    `editing_version_id` varchar(36) NOT NULL DEFAULT '' COMMENT '正在编辑的运营流程版本ID',
    `cloned_by_id` varchar(36) NOT NULL DEFAULT '' COMMENT '复用的运营流程ID，空表示没有复用',
    `cloned_by_template_id` varchar(36) NOT NULL DEFAULT '' COMMENT '复用的运营流程模版ID，空表示没有复用',
    `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) COMMENT '创建时间',
    `created_by_uid` varchar(36) NOT NULL DEFAULT '' COMMENT '创建用户ID',
    `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3)  COMMENT '更新时间',
    `updated_by_uid` varchar(36) NOT NULL DEFAULT '' COMMENT '更新用户ID',
    `deleted_at` bigint(20) NOT NULL DEFAULT 0 COMMENT '删除时间（逻辑删除）',
    PRIMARY KEY (`id`) USING BTREE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='运营流程';

CREATE TABLE IF NOT EXISTS `flowchart_node_config` (
    `id` varchar(36) NOT NULL COMMENT '主键，uuid',
    `start_mode` tinyint(4) NOT NULL DEFAULT 1 COMMENT '启动方式，枚举：1：任一前序节点完成；2：全部前序节点完成；3：任一前序节点处于非未启动',
    `completion_mode` tinyint(4) NOT NULL DEFAULT 1 COMMENT '完成方式，枚举：1：手动确认；2：自动完成',
    `node_id` varchar(36) NOT NULL DEFAULT '' COMMENT '节点ID，flowchart_unit表的id字段',
    `flowchart_version_id` varchar(36) NOT NULL DEFAULT '' COMMENT '运营流程版本ID',
    `deleted_at` bigint(20) NOT NULL DEFAULT 0 COMMENT '删除时间（逻辑删除）',
    PRIMARY KEY (`id`) USING BTREE,
    KEY `idx_node_id` (`node_id`),
    KEY `idx_flowchart_version_id` (`flowchart_version_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='运营流程节点配置信息';

CREATE TABLE IF NOT EXISTS `flowchart_node_task` (
    `id` varchar(36) NOT NULL COMMENT '主键，uuid',
    `name` varchar(128) NOT NULL DEFAULT '' COMMENT '任务类型名称',
    `completion_mode` tinyint(4) NOT NULL DEFAULT 1 COMMENT '完成方式，枚举：1：手动确认；2：自动完成',
    `node_id` varchar(36) NOT NULL DEFAULT '' COMMENT '节点ID，flowchart_unit表的id字段',
    `node_unit_id` varchar(40) NOT NULL COMMENT '节点组件ID，冗余',
    `flowchart_version_id` varchar(36) NOT NULL DEFAULT '' COMMENT '运营流程版本ID',
    `task_type` int(11) NOT NULL DEFAULT 1 COMMENT '任务类型数组，取值范围:1 普通任务（默认），2 新建模型类任务，4 标准化任务。',
    `work_order_type` int(11) NOT NULL DEFAULT 0 COMMENT '任务类型数组。',
    `deleted_at` bigint(20) NOT NULL DEFAULT 0 COMMENT '删除时间（逻辑删除）',
    PRIMARY KEY (`id`) USING BTREE,
    KEY `idx_flowchart_version_id_node_unit_id` (`flowchart_version_id`,`node_unit_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='运营流程节点任务配置信息';

CREATE TABLE IF NOT EXISTS `flowchart_unit` (
    `id` varchar(36) NOT NULL COMMENT '主键，uuid',
    `unit_type` tinyint(4) NOT NULL COMMENT '单元类型，枚举：1：阶段；2：节点；3：连接线',
    `unit_id` varchar(40) NOT NULL COMMENT '单元ID',
    `name` varchar(128) NOT NULL DEFAULT '' COMMENT '单元名称',
    `description` varchar(255) NOT NULL DEFAULT '' COMMENT '单元描述说明',
    `parent_id` varchar(36) NOT NULL DEFAULT '' COMMENT '所属单元ID',
    `parent_unit_id` varchar(40) NOT NULL DEFAULT '' COMMENT '所属单元ID，冗余',
    `source_id` varchar(36) NOT NULL DEFAULT '' COMMENT '来源单元ID',
    `source_unit_id` varchar(40) NOT NULL DEFAULT '' COMMENT '来源单元ID，冗余',
    `target_id` varchar(36) NOT NULL DEFAULT '' COMMENT '目标单元ID',
    `target_unit_id` varchar(40) NOT NULL DEFAULT '' COMMENT '目标单元ID，冗余',
    `unit_order` int(11) NOT NULL DEFAULT 0 COMMENT '单元次序，目前主要为阶段的先后顺序，从1开始',
    `flowchart_version_id` varchar(36) NOT NULL DEFAULT '' COMMENT '运营流程版本ID',
    `deleted_at` bigint(20) NOT NULL DEFAULT 0 COMMENT '删除时间（逻辑删除）',
    PRIMARY KEY (`id`) USING BTREE,
    KEY `idx_flowchart_version_id_unit_id_unit_type` (`flowchart_version_id`,`unit_id`,`unit_type`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='运营流程组件信息';

CREATE TABLE IF NOT EXISTS `flowchart_version` (
    `id` varchar(36) NOT NULL COMMENT '主键，uuid',
    `name` varchar(32) NOT NULL DEFAULT '' COMMENT '运营流程版本名称，eg:v1',
    `version` int(11) NOT NULL DEFAULT 1 COMMENT '运营流程版本',
    `edit_status` tinyint(4) NOT NULL DEFAULT 1 COMMENT '当前版本运营流程编辑状态，枚举：2：正常；3：编辑中',
    `image` mediumtext DEFAULT NULL COMMENT '图片文件内容，base64编码',
    `flowchart_id` varchar(36) NOT NULL DEFAULT '' COMMENT '运营流程ID',
    `draw_properties` mediumtext DEFAULT NULL COMMENT '图形属性，包含位置、形状、大小等',
    `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) COMMENT '创建时间',
    `created_by_uid` varchar(36) NOT NULL DEFAULT '' COMMENT '创建用户ID',
    `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3)  COMMENT '更新时间',
    `updated_by_uid` varchar(36) NOT NULL DEFAULT '' COMMENT '更新用户ID',
    `deleted_at` bigint(20) NOT NULL DEFAULT 0 COMMENT '删除时间（逻辑删除）',
    PRIMARY KEY (`id`) USING BTREE,
    KEY `idx_flowchart_id_edit_status` (`flowchart_id`,`edit_status`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='运营流程版本信息';

CREATE TABLE IF NOT EXISTS `mq_message` (
    `id` char(36) NOT NULL COMMENT '主键，uuid',
    `topic` varchar(255) NOT NULL COMMENT '消息的topic',
    `message` longtext  NOT NULL COMMENT 'json类型字段,NSQ消息体',
    `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) COMMENT '创建时间',
    `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3)  COMMENT '更新时间',
    PRIMARY KEY (`id`) USING BTREE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci  COMMENT='NSQ消息暂存表';

CREATE TABLE IF NOT EXISTS `object` (
    `id` char(36) NOT NULL COMMENT '对象ID',
    `name` varchar(255) NOT NULL COMMENT '对象名称',
    `path_id` text NOT NULL COMMENT '路径ID',
    `path` text NOT NULL COMMENT '路径',
    `type` tinyint(4) DEFAULT NULL COMMENT '类型：1：组织，2：部门',
    `attribute` text DEFAULT NULL COMMENT '属性信息：包括简称、机构编码、信用代码等',
    `f_third_dept_id`  varchar(36)  NULL  COMMENT '第三方部门ID' ,
    `is_register` int(11) default 1 COMMENT '是否注册：1-未注册，2-已注册',
    `register_at` DATETIME(3) NULL COMMENT '注册时间',
    `dept_tag` VARCHAR(255) COMMENT '机构标识',
    `f_priority` int(11) null comment '部门优先级',
    `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) COMMENT '创建时间',
    `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3)  COMMENT '更新时间',
    `deleted_at` bigint(20) NOT NULL DEFAULT 0 COMMENT '删除时间（逻辑删除）',
    PRIMARY KEY (`id`),
    KEY `idx_path_id` (`path_id`(500))
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='对象表';



CREATE TABLE IF NOT EXISTS `resource` (
    `id` bigint(20) NOT NULL COMMENT '资源标识',
    `role_id` char(36) NOT NULL COMMENT '角色标识',
    `type` tinyint(4) NOT NULL COMMENT '权限类型，枚举值参考GoCommon/access_control',
    `sub_type` tinyint(4) NOT NULL COMMENT '权限子类型，枚举值参考GoCommon/access_control',
    `value` int(11) NOT NULL COMMENT '权限值',
    PRIMARY KEY (`id`),
    KEY `resource _role_id` (`role_id`) USING BTREE,
    KEY `resource _type` (`type`) USING BTREE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `system_role` (
    `id` char(36) NOT NULL COMMENT '主键，uuid',
    `name` varchar(128) NOT NULL COMMENT '角色名称',
    `description` varchar(300) DEFAULT NULL COMMENT '描述',
    `color` char(8) DEFAULT NULL COMMENT '角色背景色',
    `icon` varchar(255) DEFAULT NULL COMMENT '角色图标',
    `type` varchar(64) NOT NULL COMMENT '类型',
    `scope` varchar(63) NOT NULL COMMENT '权限范围',
    -- Deprecated: use type instead.
    `system` tinyint(3) unsigned NOT NULL DEFAULT 0 COMMENT '是否是系统默认的角色1表示是默认，0表示不是',
    `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) COMMENT '创建时间',
    `created_by` varchar(36) NOT NULL COMMENT '创建人ID',
    `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3)  COMMENT '更新时间',
    `updated_by` varchar(36) DEFAULT NULL COMMENT '更新人ID',
    `deleted_at` bigint(20) NOT NULL DEFAULT 0 COMMENT '删除时间（逻辑删除）',
    PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统角色表';


INSERT INTO `system_role`(`id`,`name`,`color`,`icon`,`type`,`scope`,`system`,`created_at`,`updated_at`,`deleted_at`,`description`,`created_by`,`updated_by`)
SELECT'0000663b-46a9-45e4-b6f7-a6bd8c18bd46', '普通用户', '#5B91FF', 'normal',  'Internal','All','1', '2021-07-22 16:51:50.582', '2021-07-22 16:51:50.582', '0',null,'266c6a42-6131-4d62-8f39-853e7093701c','266c6a42-6131-4d62-8f39-853e7093701c'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `system_role` WHERE `id` = '0000663b-46a9-45e4-b6f7-a6bd8c18bd46');

INSERT INTO `system_role`(`id`,`name`,`color`,`icon`,`type`,`scope`,`system`,`created_at`,`updated_at`,`deleted_at`,`description`,`created_by`,`updated_by`)
SELECT'00005871-cedd-4216-bde0-94ced210e898', '数据开发工程师', '#FF822F', 'data-development-engineer', 'Internal','All','1', '2021-07-22 16:51:50.582', '2021-07-22 16:51:50.582', '0',null,'266c6a42-6131-4d62-8f39-853e7093701c','266c6a42-6131-4d62-8f39-853e7093701c'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `system_role` WHERE `id` = '00005871-cedd-4216-bde0-94ced210e898');

INSERT INTO `system_role`(`id`,`name`,`color`,`icon`,`type`,`scope`,`system`,`created_at`,`updated_at`,`deleted_at`,`description`,`created_by`,`updated_by`)
SELECT'00004606-f318-450f-bc53-f0720b27acff', '数据运营工程师', '#FFBA30', 'data-operation-engineer', 'Internal','All','1', '2021-07-22 16:51:50.582', '2021-07-22 16:51:50.582', '0',null,'266c6a42-6131-4d62-8f39-853e7093701c','266c6a42-6131-4d62-8f39-853e7093701c'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `system_role` WHERE `id` = '00004606-f318-450f-bc53-f0720b27acff');

INSERT INTO `system_role`(`id`,`name`,`color`,`icon`,`type`,`scope`,`system`,`created_at`,`updated_at`,`deleted_at`,`description`,`created_by`,`updated_by`)
SELECT'00003148-fbbf-4879-988d-54af7c98c7ed', '数据管家', '#3AC4FF', 'data-butler', 'Internal','All','1', '2021-07-22 16:51:50.582', '2021-07-22 16:51:50.582', '0',null,'266c6a42-6131-4d62-8f39-853e7093701c','266c6a42-6131-4d62-8f39-853e7093701c'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `system_role` WHERE `id` = '00003148-fbbf-4879-988d-54af7c98c7ed');

INSERT INTO `system_role`(`id`,`name`,`color`,`icon`,`type`,`scope`,`system`,`created_at`,`updated_at`,`deleted_at`,`description`,`created_by`,`updated_by`)
SELECT'00002fb7-1e54-4ce1-bc02-626cb1f85f62', '数据Owner', '#14CEAA', 'data-owner', 'Internal','All','1', '2021-07-22 16:51:50.582', '2021-07-22 16:51:50.582', '0',null,'266c6a42-6131-4d62-8f39-853e7093701c','266c6a42-6131-4d62-8f39-853e7093701c'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `system_role` WHERE `id` = '00002fb7-1e54-4ce1-bc02-626cb1f85f62');

INSERT INTO `system_role`(`id`,`name`,`color`,`icon`,`type`,`scope`,`system`,`created_at`,`updated_at`,`deleted_at`,`description`,`created_by`,`updated_by`)
SELECT'00007030-4e75-4c5e-aa56-f1bdf7044791', '应用开发者', '#F25DCB', 'application-developer',  'Internal','All','1', '2021-07-22 16:51:50.582', '2021-07-22 16:51:50.582', '0',null,'266c6a42-6131-4d62-8f39-853e7093701c','266c6a42-6131-4d62-8f39-853e7093701c'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `system_role` WHERE `id` = '00007030-4e75-4c5e-aa56-f1bdf7044791');

INSERT INTO `system_role`(`id`,`name`,`color`,`icon`,`type`,`scope`,`system`,`created_at`,`updated_at`,`deleted_at`,`description`,`created_by`,`updated_by`)
SELECT '00001f64-209f-4260-91f8-c61c6f820136', '系统管理员', '#8C7BEB', 'tc-system-mgm', 'Internal','All','1', '2021-07-22 16:51:50.582', '2021-07-22 16:51:50.582', '0',null,'266c6a42-6131-4d62-8f39-853e7093701c','266c6a42-6131-4d62-8f39-853e7093701c'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `system_role` WHERE `id` = '00001f64-209f-4260-91f8-c61c6f820136' );


INSERT INTO `system_role`(`id`,`name`,`color`,`icon`,`type`,`scope`,`system`,`created_at`,`updated_at`,`deleted_at`,`description`,`created_by`,`updated_by`)
SELECT '00008516-45b3-44c9-9188-ca656969e20f', '安全管理员', '#F25D5D', 'security-mgm',  'Internal','All','1', '2021-07-22 16:51:50.582', '2021-07-22 16:51:50.582', '0',null,'266c6a42-6131-4d62-8f39-853e7093701c','266c6a42-6131-4d62-8f39-853e7093701c'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `system_role` WHERE `id` = '00008516-45b3-44c9-9188-ca656969e20f' );


INSERT INTO `system_role`(`id`,`name`,`color`,`icon`,`type`,`scope`,`system`,`created_at`,`updated_at`,`deleted_at`,`description`,`created_by`,`updated_by`)
SELECT '00108516-45b3-44c9-9188-ca656969e20g', '门户管理员', '#6A81FF', 'protol-mgm',  'Internal','All','1', '2021-07-22 16:51:50.582', '2021-07-22 16:51:50.582', '0',null,'266c6a42-6131-4d62-8f39-853e7093701c','266c6a42-6131-4d62-8f39-853e7093701c'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `system_role` WHERE `id` = '00108516-45b3-44c9-9188-ca656969e20g' );


CREATE TABLE IF NOT EXISTS `user` (
    `id` varchar(36) NOT NULL COMMENT '主键，uuid',
    `name` varchar(255) DEFAULT NULL,
    `status` tinyint  NOT NULL DEFAULT 1 COMMENT '用户状态,1正常,2删除',
    `user_type` tinyint(4) NOT NULL DEFAULT 1 COMMENT '用户分类 （1 普通用户， 2 AF应用）',
    `phone_number` VARCHAR(20) DEFAULT NULL COMMENT '手机号码',
    `mail_address` VARCHAR(128) DEFAULT NULL COMMENT '邮箱地址',
    `login_name` varchar(255) DEFAULT NULL COMMENT '登录名',
    `scope` varchar(64) NOT NULL DEFAULT 'CurrentDepartment' COMMENT '权限范围',
    `is_registered` int(11) default 0 COMMENT '是否注册：0-未注册，1-已注册',
    `register_at` DATETIME(3)  NULL COMMENT '注册时间',
    `third_service_id` varchar(36)  NULL COMMENT '第三方服务ID',
    `f_third_user_id`  varchar(36)  NULL  COMMENT '第三方用户ID' ,
    `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3)  COMMENT '更新时间',
    `updated_by` varchar(36) DEFAULT NULL COMMENT '更新人ID',
    `sex` varchar(1) NULL  COMMENT '性别：男、女',
    PRIMARY KEY (`id`),
    UNIQUE KEY `c_user_id` (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- Deprecated: Use user_role_bindings instead
CREATE TABLE IF NOT EXISTS `user_roles` (
    `id` char(36) NOT NULL COMMENT 'uuid',
    `user_id` char(36) NOT NULL COMMENT '用户ID，uuid',
    `role_id` char(36) NOT NULL COMMENT '角色ID，uuid',
    `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) COMMENT '创建时间',
    PRIMARY KEY (`user_id`,`role_id`) USING BTREE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci  COMMENT='角色和用户关系表';

CREATE TABLE IF NOT EXISTS `info_system` (
    `info_ststem_id` bigint NOT NULL COMMENT '信息系统雪花id',
    `id` char(36)  NOT NULL COMMENT '信息系统业务id',
    `name` varchar(255)   NOT NULL COMMENT '信息系统名称',
    `description` varchar(300)   DEFAULT NULL COMMENT '信息系统描述',
    `department_id` char(36) NOT NULL COMMENT '部门ID',
    `acceptance_at` bigint(20) unsigned NOT NULL DEFAULT 0 COMMENT '验收时间',
    `is_register_gateway` tinyint(4) DEFAULT 0 COMMENT '是否注册到网关（长沙使用），bool：0：不是；1：是',
    `system_identifier` char(36) DEFAULT NULL COMMENT '系统标识',
    `register_at` datetime(3) DEFAULT NULL COMMENT '注册时间',
    `created_at`  datetime(3) NOT NULL default current_timestamp(3)  COMMENT '创建时间',
    `created_by_uid` char(36) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '创建用户ID',
    `updated_at` datetime(3) NOT NULL default current_timestamp(3) COMMENT '更新时间',
    `updated_by_uid` char(36) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '更新用户ID',
    `deleted_at` bigint NOT NULL COMMENT '删除时间',
    `js_department_id` varchar(36)  NULL COMMENT '建设部门ID',
    `status` tinyint(4) NULL DEFAULT 0 COMMENT '状态1已建、2拟建、3在建',
    PRIMARY KEY (`info_ststem_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 统一编目的编码生成规则
CREATE TABLE IF NOT EXISTS `code_generation_rules` (
    `snowflake_id`  BIGINT(20)  NOT NULL                  COMMENT '雪花 ID 无业务意义',
    `id`            CHAR(36)    NOT NULL     COMMENT 'ID',

    `name`                      VARCHAR(255)    NOT NULL    COMMENT '名称，不允许重复',
    `type`                      VARCHAR(255)    NOT NULL    COMMENT '类型，表示编码生成规则适用于哪一种数据资产',
    `prefix`                    CHAR(8)         NOT NULL    COMMENT '前缀，支持 2-6 个大写字母',
    `prefix_enabled`            BOOLEAN         NOT NULL    COMMENT '是否启用前缀',
    `rule_code`                 VARCHAR(255)    NOT NULL    COMMENT '规则码',
    `rule_code_enabled`         BOOLEAN         NOT NULL    COMMENT '是否启用规则码',
    `code_separator`            VARCHAR(255)    NOT NULL    COMMENT '编码分隔符',
    `code_separator_enabled`    BOOLEAN         NOT NULL    COMMENT '是否启用编码分隔符',
    `digital_code_type`         VARCHAR(255)    NOT NULL    COMMENT '数字码类型',
    `digital_code_width`        INTEGER         NOT NULL    COMMENT '数字码位数',
    `digital_code_starting`     INTEGER         NOT NULL    COMMENT '数字码起始值',
    `digital_code_ending`       INTEGER         NOT NULL    COMMENT '数字码终止值',

    `updater_id`    CHAR(36)        NOT NULL    COMMENT '更新编码生成规则的用户的 ID',

    `created_at`    DATETIME(3) NOT NULL  DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at`    DATETIME(3) NOT NULL  DEFAULT CURRENT_TIMESTAMP(3),
    `deleted_at`    BIGINT(20)  NOT NULL  DEFAULT 0,

    UNIQUE KEY(`snowflake_id`),
    UNIQUE KEY `idx_code_generation_rules_id_deleted_at` (`id`, `deleted_at`),
    UNIQUE KEY `idx_code_generation_rules_name_deleted_at` (`name`, `deleted_at`),
    KEY `idx_code_generation_rules_deleted_at` (`deleted_at`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 编码生成规则的顺序码类型的数字码生成状态
CREATE TABLE IF NOT EXISTS `sequence_code_generation_statuses` (
    `snowflake_id`  BIGINT(20)  NOT NULL                  COMMENT '雪花 ID 无业务意义',
    `id`            CHAR(36)    NOT NULL   COMMENT 'ID',

    `rule_id`               CHAR(36)        NOT NULL    COMMENT '顺序码所属的编码生成规则的 ID',
    `prefix`                CHAR(8)         NOT NULL    COMMENT '前缀，未启用时为空',
    `rule_code`             VARCHAR(255)    NOT NULL    COMMENT '规则码，未启用时为空',
    `code_separator`        VARCHAR(255)    NOT NULL    COMMENT '编码分隔符，未启用时为 0',
    `digital_code_width`    INTEGER         NOT NULL    COMMENT '数字码位数',

    `digital_code`  INTEGER NOT NULL    COMMENT '数字码',

    `created_at`    DATETIME(3) NOT NULL  DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at`    DATETIME(3) NOT NULL  DEFAULT CURRENT_TIMESTAMP(3),
    `deleted_at`    BIGINT(20)  NOT NULL  DEFAULT 0,

    PRIMARY KEY(`id`),
    UNIQUE KEY(`snowflake_id`),
    UNIQUE KEY `idx_sequence_code_generation_statuses_id_deleted_at` (`id`, `deleted_at`),
    UNIQUE KEY `idx_sequence_code_generation_statuses_all_prefix` (`rule_id`, `prefix`, `rule_code`, `code_separator`, `digital_code_width`),
    KEY `idx_sequence_code_generation_statuses_deleted_at` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- auto-generated definition
create table IF NOT EXISTS `data_grade`
(
    id             bigint                                   not null comment '雪花id',
    parent_id      char(36)    default '0'                  null comment '父节点ID  0代表根节点',
    name           varchar(255)                             not null comment '标签名称/分组名称',
    sort_weight    bigint unsigned                          null comment '在同一级下的顺序位置 ',
    node_type      int                                      null comment '1:node 2:group',
    icon           varchar(100)                             null comment '图标',
    description     varchar(300)                             null comment '描述',
    sensitive_attri varchar(20) null comment '敏感属性预设',
    secret_attri    varchar(20) null comment '涉密属性预设',
    share_condition varchar(20) null comment '共享条件：不共享，有条件共享，无条件共享',
    data_protection_query BOOLEAN not null default false comment '数据保护查询开关',
    created_at     datetime(3) default current_timestamp(3) not null comment '创建时间',
    created_by_uid char(36)                                 null,
    updated_at     datetime(3) default current_timestamp(3) not null comment '更新时间',
    updated_by_uid char(36)                                 null,
    deleted_at     bigint      default 0                    not null comment '删除时间',
    PRIMARY KEY (`id`)
) ;


INSERT INTO `data_grade`(id, parent_id, name, sort_weight, node_type, icon, description, created_at, created_by_uid, updated_at, updated_by_uid, deleted_at)
SELECT 1, '0', 'top', null, 2, '', '', '2024-05-11 11:04:15.613', '111111', '2024-05-13 11:23:23.805', '111111', 0
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `data_grade` WHERE `id` = '1');

INSERT  INTO `configuration`(`key`,`value`,`type`)
SELECT 'data_grade_label', 'close', '7'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'data_grade_label' );

-- 审核流程绑定表
CREATE TABLE IF NOT EXISTS  `audit_process_bind` (
    `id` bigint(20) unsigned NOT NULL COMMENT '主键',
    `audit_type` varchar(50) NOT NULL COMMENT '审核类型 af-data-view-publish 发布审核 af-data-view-online 上线审核  af-data-view-offline 上线审核',
    `proc_def_key` varchar(128) NOT NULL COMMENT '审核流程key',
    `service_type` varchar(128) DEFAULT NULL COMMENT '所属业务模块，如逻辑视图业务为data-view',
    `create_time` datetime NOT NULL DEFAULT current_timestamp() COMMENT '创建时间',
    `created_by_uid` varchar(50) NOT NULL COMMENT '创建人id',
    `update_time` datetime NOT NULL DEFAULT current_timestamp() COMMENT '更新时间',
    `updated_by_uid` varchar(50) DEFAULT NULL COMMENT '编辑人id',
    UNIQUE KEY `audit_process_bind_unique` (`audit_type`),
    KEY `audit_process_bind_audit_type_IDX` (`audit_type`) USING BTREE,
    PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='审核流程绑定表';


CREATE TABLE IF NOT EXISTS  `cdc_task` (
    `database` varchar(255) NOT NULL COMMENT '同步库名',
    `table` varchar(255) NOT NULL COMMENT '同步表名',
    `columns` varchar(255) NOT NULL COMMENT '同步的列，多个列写在一起，用 , 隔开',
    `topic` varchar(255) NOT NULL COMMENT '数据变动投递消息的topic',
    `group_id` varchar(255) NOT NULL COMMENT '当前记录对应的group id',
    `id` varchar(255) NOT NULL COMMENT '当前同步记录id',
    `updated_at` datetime(3) NOT NULL COMMENT '当前同步记录时间',
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 应用授权管理表
CREATE TABLE IF NOT EXISTS  `app` (
    `id` bigint(20) unsigned NOT NULL COMMENT '雪花id',
    `apps_id` CHAR(36) NOT NULL   COMMENT '对象ID, uuid',
    `published_version_id` bigint(20) unsigned NOT NULL COMMENT '已发布版本',
    `editing_version_id` bigint(20) unsigned DEFAULT NULL COMMENT '当前编辑版本',
    `report_published_version_id` bigint(20) unsigned DEFAULT NULL COMMENT '已上报成功版本',
    `report_editing_version_id` bigint(20) unsigned DEFAULT NULL COMMENT '上报中的版本',
    `mark` CHAR(10) NOT NULL DEFAULT 'common'  COMMENT '应用标识',
    `created_at` datetime(3) NOT NULL  DEFAULT current_timestamp(3) COMMENT '创建时间',
    `creator_uid` varchar(36) NOT NULL COMMENT '创建用户ID',
    `creator_name` varchar(255) DEFAULT NULL COMMENT '创建用户名称',
    `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3)  COMMENT '更新时间',
    `updater_uid` varchar(36) NOT NULL COMMENT '更新用户ID',
    `updater_name` varchar(255) DEFAULT NULL COMMENT '更新用户名称',
    `deleted_at`  bigint(20) NOT NULL DEFAULT 0 COMMENT '删除时间（逻辑删除）',
    PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='应用授权管理表';

-- 应用授权管理版本表
CREATE TABLE IF NOT EXISTS  `app_history` (
    -- 基础信息
    `id` bigint(20) unsigned NOT NULL COMMENT '雪花id',
    `app_id` bigint(20) unsigned NOT NULL COMMENT '应用雪花id',
    `name` varchar(128) NOT NULL COMMENT '应用名称',
    `description` varchar(300) DEFAULT NULL COMMENT '应用描述',
    `info_system` char(36)  DEFAULT NULL COMMENT '信息系统',
    `application_developer_id` char(36) NOT NULL  COMMENT '应用开发者账号ID',
    `pass_id` char(128)  DEFAULT NULL COMMENT 'PassID',
    `token` char(36)  DEFAULT NULL COMMENT 'token',
    `app_type` char(36)  DEFAULT NULL COMMENT '应用类型',
    `ip_addr` longtext  DEFAULT NULL COMMENT 'json类型字段, 关联ip和port',
    `is_register_gateway` tinyint(4) DEFAULT 0 COMMENT '是否注册到网关（长沙使用），bool：0：不是；1：是',
    `register_at` datetime(3) DEFAULT NULL COMMENT '注册时间',
    -- 账号信息
    `account_id` char(36) DEFAULT NULL  COMMENT '账号ID',
    `account_name` varchar(255) DEFAULT NULL COMMENT '账户名称',
    `account_passowrd` varchar(1028) DEFAULT NULL COMMENT '账户密码',
    -- 省注册信息
    `province_app_id` varchar(300) DEFAULT NULL COMMENT '省平台注册ID',
	`access_key` varchar(300) DEFAULT NULL COMMENT '省平台应用key',
	`access_secret` varchar(300) DEFAULT NULL COMMENT '省平台应用secret',
	`province_ip` char(36) DEFAULT NULL  COMMENT '对外提供ip地址',
	`province_url` varchar(300) DEFAULT NULL COMMENT '对外提供url地址',
	`contact_name` char(100) DEFAULT NULL  COMMENT '联系人姓名',
	`contact_phone` char(50) DEFAULT NULL  COMMENT '联系人联系方式',
	`area_id` varchar(64)  DEFAULT NULL  COMMENT '应用领域ID',
	`range_id` varchar(64) DEFAULT NULL COMMENT '应用范围ID',
    `department_id` char(36)  DEFAULT NULL COMMENT '所属部门',
	`org_code` char(64) DEFAULT NULL COMMENT '应用系统所属组织机构编码',
	`deploy_place` char(100) DEFAULT ''  COMMENT '部署地点',
    -- 创建审核信息
    `status` TINYINT(2) DEFAULT NULL COMMENT '审核状态 1 审核中， 2 拒绝， 3 撤回， 4 通过',
    `reject_reason` VARCHAR(300) DEFAULT NULL COMMENT '驳回原因',
    `cancel_reason` VARCHAR(300) DEFAULT NULL COMMENT '需求撤销原因',
    `audit_id` bigint(20) DEFAULT NULL COMMENT '审核记录ID',
    `audit_proc_inst_id` VARCHAR(64) DEFAULT NULL COMMENT '审核实例ID',
    `audit_result` VARCHAR(64) DEFAULT NULL COMMENT '审核结果 pass 通过 reject 拒绝 undone 撤销',
    -- 上报审核信息
    `report_audit_status` TINYINT(2) DEFAULT NULL COMMENT '审核状态  1 审核中， 2 拒绝， 3 撤回， 4 通过',
    `report_reject_reason` VARCHAR(300) DEFAULT NULL COMMENT '驳回原因',
    `report_cancel_reason` VARCHAR(300) DEFAULT NULL COMMENT '需求撤销原因',
    `report_audit_id` bigint(20) DEFAULT NULL COMMENT '审核记录ID',
    `report_audit_proc_inst_id` VARCHAR(64) DEFAULT NULL COMMENT '审核实例ID',
    `report_audit_result` VARCHAR(64) DEFAULT NULL COMMENT '审核结果 pass 通过 reject 拒绝 undone 撤销',
    -- 上报成功后信息
    `report_status` TINYINT(2) DEFAULT NULL COMMENT '是否成功 1 成功 2 失败',
    `province_id` bigint(20) unsigned DEFAULT NULL COMMENT 'sszd雪花id',
    `reported_at` datetime(3) DEFAULT NULL  COMMENT '上报时间',
    -- 其他信息
    `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3)  COMMENT '更新时间',
    `updater_uid` varchar(36) NOT NULL COMMENT '更新用户ID',
    `updater_name` varchar(255) DEFAULT NULL COMMENT '更新用户名称',
    `deleted_at`  bigint(20) NOT NULL DEFAULT 0 COMMENT '删除时间（逻辑删除）',
    PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='应用授权管理表';

CREATE TABLE IF NOT EXISTS `t_dict` (
     `id` bigint NOT NULL COMMENT '唯一id，雪花算法',
     `f_type` varchar(100)  NOT NULL COMMENT '字典类型',
    `name` varchar(128) NOT NULL COMMENT '字典名称',
    `f_description` varchar(512)  DEFAULT NULL COMMENT '描述',
    `f_version` varchar(10)  default 'V1.0.0'  not null COMMENT '版本号',
    `created_at` datetime NOT NULL COMMENT '创建时间',
    `creator_uid` varchar(36) DEFAULT NULL COMMENT '创建用户ID',
    `creator_name` varchar(255) DEFAULT NULL COMMENT '创建用户名称',
    `updated_at` datetime DEFAULT NULL  COMMENT '更新时间',
    `updater_uid` varchar(36) DEFAULT NULL COMMENT '更新用户ID',
    `updater_name` varchar(255) DEFAULT NULL COMMENT '更新用户名称',
    `deleted_at`    bigint  default 0  not null comment '删除时间',
    `sszd_flag`    smallint  default 1  not null  comment '是否省市直达1是0否',
    PRIMARY KEY (`id`),
    INDEX dict_type_index (`f_type`)
    )  COMMENT='字典表';

CREATE TABLE IF NOT EXISTS `t_dict_item` (
    `id` bigint(20) NOT NULL COMMENT '唯一id，雪花算法',
    `dict_id` bigint NOT NULL COMMENT '字典ID',
    `f_type` varchar(100) NOT NULL COMMENT '字典类型 area 所属领域、应用领域【应用系统】 scene 应用场景 scene-type 应用场景类型 one-thing 高效办成“一件事” range 应用范围 sensitive-level 敏感级别 catalog-share-type 数据目录共享类型 catalog-open-type 数据目录开放类型 resource-share-type 数据资源共享类型 resource-open-type 数据资源开放类型 resource-type 数据资源类型 column-type 字段类型 serve-type 服务类型 use-scope 使用范围 update-cycle 更新周期 is-publish 是否发布 share-type 共享类型 data-region 数据区域范围 level-type 数据所属层级 open-type 开放类型 certification-type 是否电子证照编码 net-type 提供渠道 data-processing 数据加工程度 data-backflow 是否回流地市（州） backflow-region 回流是否能区分地市（州） field-type 数据所属领域 org-code 统一社会信用代码 division-code 行政区划代码 center-dept-code 中央业务指导（实施）部门代码 data-sensitive-class 数据分级 catalog-tag 目录标签 system-class 系统所属分类',
    `f_key` varchar(64) NOT NULL COMMENT '键（字典码）',
    `f_value` varchar(100) NOT NULL COMMENT '值（值名称）',
    `f_description` varchar(512) DEFAULT NULL COMMENT '码值备注',
    `f_sort` int(3) NOT NULL DEFAULT '0' COMMENT '排序（升序）',
    `created_at` datetime NOT NULL  COMMENT '创建时间',
    `creator_uid` varchar(36) DEFAULT NULL COMMENT '创建用户ID',
    `creator_name` varchar(255) DEFAULT NULL COMMENT '创建用户名称',
    INDEX dict_id_index (`dict_id`),
    INDEX dict_type_index (`f_type`),
    PRIMARY KEY (`id`)
    )  COMMENT='字典属性值表';


insert into `t_dict` (`id`,`f_type`,`name`,`f_description`,`created_at`,`updated_at`,`sszd_flag`)
select 43,'catalog-feedback-type','目录反馈类型','应用于目录反馈的反馈类型字段','2024-12-17 14:28:55','2024-12-17 14:28:55',0
from dual where not exists (select `id` from t_dict where `id` = 43);

insert into `t_dict` (`id`,`f_type`,`name`,`f_description`,`created_at`,`updated_at`,`sszd_flag`)
select 45,'business-matters-type','业务事项类型','应用于目录业务事项字段','2024-12-17 14:28:55','2024-12-17 14:28:55',0
from dual where not exists (select `id` from t_dict where `id` = 45);

insert into `t_dict_item` (`id`,`f_type`,`f_key`,`f_value`,`f_description`,`created_at`,`dict_id`,`f_sort`) select 447,'catalog-feedback-type','1','目录信息错误',null,'2024-12-17 14:28:55',43,1    from dual where not exists (select `id` from t_dict_item where `id` = 447);
insert into `t_dict_item` (`id`,`f_type`,`f_key`,`f_value`,`f_description`,`created_at`,`dict_id`,`f_sort`) select 448,'catalog-feedback-type','2','数据质量问题',null,'2024-12-17 14:28:55',43,2    from dual where not exists (select `id` from t_dict_item where `id` = 448);
insert into `t_dict_item` (`id`,`f_type`,`f_key`,`f_value`,`f_description`,`created_at`,`dict_id`,`f_sort`) select 449,'catalog-feedback-type','3','挂接资源和目录不一致',null,'2024-12-17 14:28:55',43,3    from dual where not exists (select `id` from t_dict_item where `id` = 449);
insert into `t_dict_item` (`id`,`f_type`,`f_key`,`f_value`,`f_description`,`created_at`,`dict_id`,`f_sort`) select 450,'catalog-feedback-type','4','接口问题',null,'2024-12-17 14:28:55',43,4    from dual where not exists (select `id` from t_dict_item where `id` = 450);
insert into `t_dict_item` (`id`,`f_type`,`f_key`,`f_value`,`f_description`,`created_at`,`dict_id`,`f_sort`) select 451,'catalog-feedback-type','5','其他',null,'2024-12-17 14:28:55',43,5    from dual where not exists (select `id` from t_dict_item where `id` = 451);

insert into `t_dict_item` (`id`,`f_type`,`f_key`,`f_value`,`f_description`,`created_at`,`dict_id`,`f_sort`)
select 455,'business-matters-type','111','行政确认','行政确认的描述','2024-12-17 14:28:55',45,0
from dual where not exists (select `id` from t_dict_item where `id` = 455);

insert into `t_dict_item` (`id`,`f_type`,`f_key`,`f_value`,`f_description`,`created_at`,`dict_id`,`f_sort`)
select 456,'business-matters-type','222','行政奖励','行政奖励的描述','2024-12-17 14:28:55',45,1
from dual where not exists (select `id` from t_dict_item where `id` = 456);

insert into `t_dict_item` (`id`,`f_type`,`f_key`,`f_value`,`f_description`,`created_at`,`dict_id`,`f_sort`)
select 457,'business-matters-type','333','其他','其他','2024-12-17 14:28:55',45,1
from dual where not exists (select `id` from t_dict_item where `id` = 457);

CREATE TABLE IF NOT EXISTS `t_firm` (
    `id` BIGINT NOT NULL COMMENT '唯一id，雪花算法',
    `name` VARCHAR(128)  NOT NULL COMMENT '厂商名称',
    `uniform_code` VARCHAR(18) NOT NULL COMMENT '统一社会信用代码',
    `legal_represent` VARCHAR(128) NOT NULL COMMENT '法定代表名称',
    `contact_phone` VARCHAR(20) NOT NULL COMMENT '联系电话',
    `created_at` DATETIME(3) NOT NULL COMMENT '创建时间',
    `created_by` VARCHAR(36) NOT NULL COMMENT '创建用户ID',
    `updated_at` DATETIME(3) DEFAULT NULL  COMMENT '更新时间',
    `updated_by` VARCHAR(36) DEFAULT NULL COMMENT '更新用户ID',
    `deleted_at` DATETIME(3) DEFAULT NULL  COMMENT '删除时间',
    `deleted_by` VARCHAR(36) DEFAULT NULL COMMENT '删除用户ID',
    UNIQUE KEY uni_firm_name (`name`),
    UNIQUE KEY uni_firm_uniform_code (`uniform_code`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='厂商表';

CREATE TABLE IF NOT EXISTS `t_firm_history` (
    `id` BIGINT NOT NULL COMMENT '唯一id，雪花算法',
    `name` VARCHAR(128)  NOT NULL COMMENT '厂商名称',
    `uniform_code` VARCHAR(18) NOT NULL COMMENT '统一社会信用代码',
    `legal_represent` VARCHAR(128) NOT NULL COMMENT '法定代表名称',
    `contact_phone` VARCHAR(20) NOT NULL COMMENT '联系电话',
    `created_at` DATETIME(3) NOT NULL COMMENT '创建时间',
    `created_by` VARCHAR(36) NOT NULL COMMENT '创建用户ID',
    `updated_at` DATETIME(3) DEFAULT NULL  COMMENT '更新时间',
    `updated_by` VARCHAR(36) DEFAULT NULL COMMENT '更新用户ID',
    `deleted_at` DATETIME(3) DEFAULT NULL  COMMENT '删除时间',
    `deleted_by` VARCHAR(36) DEFAULT NULL COMMENT '删除用户ID',
    UNIQUE KEY uni_firm_name (`name`),
    UNIQUE KEY uni_firm_uniform_code (`uniform_code`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB  COMMENT='厂商表';


-- 前置机
CREATE TABLE IF NOT EXISTS `front_end_processors` (
    `id`                    CHAR(36)        NOT NULL                                    COMMENT 'ID',
    `order_id`              VARCHAR(32)     NOT NULL                                    COMMENT '申请单号',
    `creator_id`            CHAR(36)        NOT NULL                                    COMMENT '创建者 ID',
    `updater_id`            CHAR(36)        NULL        DEFAULT NULL                    COMMENT '更新者 ID',
    `requester_id`          CHAR(36)        NULL        DEFAULT NULL                    COMMENT '申请者 ID',
    `recipient_id`          CHAR(36)        NULL        DEFAULT NULL                    COMMENT '签收者 ID',
    `creation_timestamp`    DATETIME(3)     NOT NULL    DEFAULT current_timestamp(3)    COMMENT '创建时间',
    `update_timestamp`      DATETIME(3)     NULL        DEFAULT NULL                    COMMENT '更新时间',
    `request_timestamp`     DATETIME(3)     NULL        DEFAULT NULL                    COMMENT '申请时间',
    `allocation_timestamp`  DATETIME(3)     NULL        DEFAULT NULL                    COMMENT '分配时间',
    `receipt_timestamp`     DATETIME(3)     NULL        DEFAULT NULL                    COMMENT '签收时间',
    `reclaim_timestamp`     DATETIME(3)     NULL        DEFAULT NULL                    COMMENT '回收时间',
    `deletion_timestamp`    DATETIME(3)     NULL        DEFAULT NULL                    COMMENT '删除时间',
    `department_id`         CHAR(36)        NOT NULL                                    COMMENT '所属部门 ID',
    `department_address`    VARCHAR(300)    NOT NULL                                    COMMENT '所属部门地址',
    `contact_name`          VARCHAR(128)    NOT NULL                                    COMMENT '联系人姓名',
    `contact_phone`         VARCHAR(20)     NULL        DEFAULT NULL                    COMMENT '联系人电话',
    `contact_mobile`        VARCHAR(20)     NULL        DEFAULT NULL                    COMMENT '联系人手机',
    `contact_mail`          VARCHAR(128)    NULL        DEFAULT NULL                    COMMENT '联系人邮箱',
    `comment`               VARCHAR(800)    NULL        DEFAULT NULL                    COMMENT '申请理由',
	`is_draft`              TINYINT(4)      NOT NULL    DEFAULT 0                       COMMENT '是否为草稿、暂存',
    `node_ip`               VARCHAR(256)    NULL        DEFAULT NULL                    COMMENT '节点 IP',
    `node_port`             INT(11)         NULL        DEFAULT NULL                    COMMENT '节点端口号',
    `node_name`             VARCHAR(128)    NULL        DEFAULT NULL                    COMMENT '节点名称',
    `administrator_name`    VARCHAR(255)    NULL        DEFAULT NULL                    COMMENT '技术负责人姓名',
    `administrator_phone`   VARCHAR(20)     NULL        DEFAULT NULL                    COMMENT '技术负责人电话',
    `phase`                 INT(11)         NOT NULL                                    COMMENT '在生命周期所处阶段',
    `apply_id`              CHAR(36)        NULL        DEFAULT NULL                    COMMENT 'workflow 审核 apply id',
    `administrator_fax` VARCHAR(20) DEFAULT NULL COMMENT '技术联系人传真',
    `administrator_email` VARCHAR(255) DEFAULT NULL COMMENT '技术联系人邮箱',
    `deployment_area` VARCHAR(20) DEFAULT NULL COMMENT '部署区域, 1：外部数据中心区域，2：内部数据中心区域，3：业务数据库区域',
    `deployment_system` VARCHAR(256) DEFAULT NULL COMMENT '运行业务系统',
    `protection_level` VARCHAR(20) DEFAULT NULL COMMENT '业务系统保护级别',
    `apply_type` VARCHAR(20) DEFAULT NULL COMMENT '申请类型, 1: 前置机申请，2：前置库申请',
    `reject_reason` varchar(300)   COMMENT '驳回原因',
    UNIQUE INDEX    (`order_id`)    USING BTREE,
    PRIMARY KEY     (`id`)          USING BTREE
) COMMENT='前置机' COLLATE='utf8mb4_unicode_ci' ENGINE=InnoDB;


CREATE TABLE IF NOT EXISTS `menu`
(
    `id`     bigint(20) NOT NULL,
    `platform` int(11) NOT NULL COMMENT '菜单归属平台',
    `value`  text  NOT NULL COMMENT '菜单路由',
    PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci ;

CREATE TABLE IF NOT EXISTS `t_address_book` (
    `id` BIGINT NOT NULL COMMENT '唯一id，雪花算法',
    `name` VARCHAR(128)  NOT NULL COMMENT '人员名称',
    `department_id` char(36) DEFAULT NULL COMMENT '所属部门ID',
    `contact_phone` VARCHAR(20) NOT NULL COMMENT '手机号码',
    `contact_mail` VARCHAR(128) NULL DEFAULT NULL COMMENT '邮箱地址',
    `created_at` DATETIME(3) NOT NULL COMMENT '创建时间',
    `created_by` VARCHAR(36) NOT NULL COMMENT '创建用户ID',
    `updated_at` DATETIME(3) DEFAULT NULL  COMMENT '更新时间',
    `updated_by` VARCHAR(36) DEFAULT NULL COMMENT '更新用户ID',
    `deleted_at` DATETIME(3) DEFAULT NULL  COMMENT '删除时间',
    `deleted_by` VARCHAR(36) DEFAULT NULL COMMENT '删除用户ID',
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='通讯录人员信息记录表';

CREATE TABLE IF NOT EXISTS `t_object_subtype` (
    `id` char(36) NOT NULL COMMENT '对象ID',
    `subtype` tinyint(4) DEFAULT NULL COMMENT '子类型',
    `main_dept_type` tinyint(4) DEFAULT NULL COMMENT '主部门类型，1主部门0非主部门',
    `created_at` DATETIME(3) NOT NULL COMMENT '创建时间',
    `created_by` VARCHAR(36) NOT NULL COMMENT '创建用户ID',
    `updated_at` DATETIME(3) DEFAULT NULL  COMMENT '更新时间',
    `updated_by` VARCHAR(36) DEFAULT NULL COMMENT '更新用户ID',
    `deleted_at` DATETIME(3) DEFAULT NULL  COMMENT '删除时间',
    `deleted_by` VARCHAR(36) DEFAULT NULL COMMENT '删除用户ID',
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='对象类型表';

CREATE TABLE IF NOT EXISTS `t_object_main_business` (
    `id` BIGINT NOT NULL COMMENT '唯一id，雪花算法',
    `object_id` char(36) NOT NULL COMMENT '对象ID',
    `name` VARCHAR(128)  NOT NULL COMMENT '主干业务名称',
    `abbreviation_name` VARCHAR(128)  NOT NULL COMMENT '主干业务简称',
    `created_at` DATETIME(3) NOT NULL COMMENT '创建时间',
    `created_by` VARCHAR(36) NOT NULL COMMENT '创建用户ID',
    `updated_at` DATETIME(3) DEFAULT NULL  COMMENT '更新时间',
    `updated_by` VARCHAR(36) DEFAULT NULL COMMENT '更新用户ID',
    `deleted_at` DATETIME(3) DEFAULT NULL  COMMENT '删除时间',
    `deleted_by` VARCHAR(36) DEFAULT NULL COMMENT '删除用户ID',
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='对象主干业务表';

CREATE TABLE IF NOT EXISTS `t_alarm_rule` (
    `id` BIGINT NOT NULL COMMENT '唯一id，雪花算法',
    `type` VARCHAR(255)  NOT NULL COMMENT '规则类型',
    `deadline_time` BIGINT NOT NULL COMMENT '截止告警时间',
    `deadline_reminder` VARCHAR(36) NOT NULL COMMENT '截止告警内容',
    `beforehand_time` BIGINT NOT NULL COMMENT '提前告警时间',
    `beforehand_reminder` VARCHAR(36) NOT NULL COMMENT '提前告警内容',
    `updated_at` DATETIME(3) DEFAULT NULL  COMMENT '更新时间',
    `updated_by` VARCHAR(36) DEFAULT NULL COMMENT '更新用户ID',
    UNIQUE KEY t_alarm_rule_type (`type`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='告警规则记录表';

INSERT INTO `t_alarm_rule` (`id`,`type`,`deadline_time`,`deadline_reminder`,`beforehand_time`,`beforehand_reminder`, `updated_at`, `updated_by`)
select 1, 'data_quality', 30, '【工单名称(工单编号)】 已到截止时间，请及时处理！', 5, '【工单名称(工单编号)】 距离截止日期仅剩 X 天，请及时处理！', '2025-03-21 17:33:00.000', '266c6a42-6131-4d62-8f39-853e7093701c'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `t_alarm_rule` WHERE `id` = 1 and `type`='data_quality');

-- 权限
CREATE TABLE IF NOT EXISTS `permissions` (
    `id`            CHAR(36)        NOT NULL,
    `created_at`    DATETIME(3)     NOT NULL,
    `updated_at`    DATETIME(3)     NOT NULL,
    `deleted_at`    DATETIME(3)     DEFAULT NULL,

    `name`      VARCHAR(128)    NOT NULL    COMMENT '名称',
    `description`   VARCHAR(300)    NULL    COMMENT '描述',
    `category`  VARCHAR(128)    NOT NULL    COMMENT '分类',
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='权限';

CREATE TABLE IF NOT EXISTS `permission_resources` (
     `id`            CHAR(36)        NOT NULL,
    `service_name` varchar(128) NOT NULL COMMENT '服务名称',
    `action_id` char(36) NOT NULL  default ''  COMMENT 'path.method.action 的md5值',
    `path` varchar(255) NOT NULL COMMENT '接口路径',
    `method` varchar(32) NOT NULL COMMENT '接口方法',
    `action` varchar(32) NOT NULL COMMENT '动作',
    `scope` varchar(32) NOT NULL COMMENT  '范围',
    `permission_id` char(36) NOT NULL default '' COMMENT '权限ID',
    `permission_name` varchar(128) NOT NULL  default ''  COMMENT '权限名称',
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='权限资源';


CREATE TABLE IF NOT EXISTS  `auth_service_casbin_rule` (
    `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
    `ptype` varchar(100) DEFAULT NULL,
    `v0` varchar(100) DEFAULT NULL,
    `v1` varchar(100) DEFAULT NULL,
    `v2` varchar(100) DEFAULT NULL,
    `v3` varchar(100) DEFAULT NULL,
    `v4` varchar(100) DEFAULT NULL,
    `v5` varchar(100) DEFAULT NULL,
    UNIQUE KEY `idx_auth_service_casbin_rule` (`ptype`,`v0`,`v1`,`v2`,`v3`,`v4`,`v5`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 角色组
CREATE TABLE IF NOT EXISTS `role_groups` (
    `id`            CHAR(36)        NOT NULL,
    `created_at`    DATETIME(3)     NOT NULL,
    `updated_at`    DATETIME(3)     NOT NULL,
    `deleted_at`    DATETIME(3)     DEFAULT NULL,

    `name`          VARCHAR(128)    NOT NULL    COMMENT '名称',
    `description`   VARCHAR(300)    NOT NULL    COMMENT '描述',
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色组';

-- 权限、权限资源绑定
CREATE TABLE IF NOT EXISTS `permission_permission_resource_bindings` (
    `scope`                     VARCHAR(128)    NOT NULL    COMMENT '范围',
    `permission_id`             CHAR(36)        NOT NULL    COMMENT '权限 ID',
    `permission_resource_id`    CHAR(36)        NOT NULL    COMMENT '权限资源 ID',
    `action`                    VARCHAR(128)    NOT NULL    COMMENT '操作',
    `condition`                 VARCHAR(128)    NOT NULL    COMMENT '条件',
    PRIMARY KEY (`permission_id`, `permission_resource_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='权限、权限资源绑定';


-- 用户、权限绑定
CREATE TABLE IF NOT EXISTS `user_permission_bindings` (
    `id`            CHAR(36)    NOT NULL,
    `user_id`       CHAR(36)    NOT NULL    COMMENT '用户 ID',
    `permission_id` CHAR(36)    NOT NULL    COMMENT '权限 ID',
    PRIMARY KEY (`user_id`, `permission_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户、权限绑定';

-- 用户、角色绑定
CREATE TABLE IF NOT EXISTS `user_role_bindings` (
    `id`            CHAR(36)    NOT NULL,
    `user_id`   CHAR(36)    NOT NULL    COMMENT '用户 ID',
    `role_id`   CHAR(36)    NOT NULL    COMMENT '角色 ID',
    PRIMARY KEY (`user_id`, `role_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户、角色绑定';

-- 用户、角色组绑定
CREATE TABLE IF NOT EXISTS `user_role_group_bindings` (
    `id`            CHAR(36)    NOT NULL,
    `user_id`       CHAR(36)    NOT NULL    COMMENT '用户 ID',
    `role_group_id` CHAR(36)    NOT NULL    COMMENT '角色组 ID',
    PRIMARY KEY (`user_id`, `role_group_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户、角色组绑定';

-- 角色、权限绑定
CREATE TABLE IF NOT EXISTS `role_permission_bindings` (
    `id`            CHAR(36)    NOT NULL,
    `role_id`       CHAR(36)    NOT NULL    COMMENT '用户 ID',
    `permission_id` CHAR(36)    NOT NULL    COMMENT '权限 ID',
    PRIMARY KEY (`role_id`, `permission_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色、权限绑定';

-- 角色组、角色绑定
CREATE TABLE IF NOT EXISTS `role_group_role_bindings` (
    `id`            CHAR(36)    NOT NULL,
    `role_group_id` CHAR(36)    NOT NULL    COMMENT '角色组 ID',
    `role_id`       CHAR(36)    NOT NULL    COMMENT '角色 ID',
    PRIMARY KEY (`role_group_id`, `role_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色组、角色绑定';

insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '167d41c2-4b37-47e1-9c29-d103c4873f4f','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理数据分类分级','Operation',NULL FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '167d41c2-4b37-47e1-9c29-d103c4873f4f'  );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '18abfb60-5b18-4e63-9010-63fce5b5eb3e','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'审计用户操作','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '18abfb60-5b18-4e63-9010-63fce5b5eb3e' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '211783fe-b79a-49f3-8a90-3402635b7456','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'数据安全管理','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '211783fe-b79a-49f3-8a90-3402635b7456' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '29d08b27-1974-48de-8979-bcb222b90f72','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理数据模型','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '29d08b27-1974-48de-8979-bcb222b90f72' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '2c809154-54a9-4bca-9017-92bec902e12a','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理数据质量工单','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '2c809154-54a9-4bca-9017-92bec902e12a' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '31c09e56-cf9a-42fd-aea5-9ee7fa781cd0','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理业务域层级','Basic',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '31c09e56-cf9a-42fd-aea5-9ee7fa781cd0' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '3273957b-f811-4639-9e08-3e6133fd891a','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'审核数据理解工单','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '3273957b-f811-4639-9e08-3e6133fd891a' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '3db2f019-678b-4030-b57f-5a7db667b826','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'处理质量工单','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '3db2f019-678b-4030-b57f-5a7db667b826' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '41095041-05dc-4139-b6cd-e786079db2ab','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理用户和角色','Basic',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '41095041-05dc-4139-b6cd-e786079db2ab' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '421d78c1-72e7-477c-8825-7c5cc83fa15b','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理通用配置','Basic',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '421d78c1-72e7-477c-8825-7c5cc83fa15b' );
-- insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '441f6e13-0867-44bf-8531-b4753a507f72','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'调研报告审核','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '441f6e13-0867-44bf-8531-b4753a507f72' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '473a7956-25f6-4f1b-846b-94e71dc058cb','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理数据运营流程','Basic',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '473a7956-25f6-4f1b-846b-94e71dc058cb' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '49604f6f-dfc2-4faf-9aa8-69c05cc297b0','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'审核归集计划','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '49604f6f-dfc2-4faf-9aa8-69c05cc297b0' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '4ce45b8b-d19c-435b-81ce-f3abf561b21a','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理接口服务','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '4ce45b8b-d19c-435b-81ce-f3abf561b21a' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '4cfdc28e-97f4-445b-9968-f575d61896e9','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'审核数据理解计划','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '4cfdc28e-97f4-445b-9968-f575d61896e9' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '5c100c9e-5f93-48fb-92ef-d5a898aa3fe0','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'需求分析和实施','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '5c100c9e-5f93-48fb-92ef-d5a898aa3fe0' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '67b4198b-4dd4-4029-a716-286e378d14b7','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'审核数据推送','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '67b4198b-4dd4-4029-a716-286e378d14b7' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '68e247dd-831b-4b5d-8f13-6c5ae5983c07','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理数据理解工单和任务','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '68e247dd-831b-4b5d-8f13-6c5ae5983c07' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '68e736d6-6a77-4b64-ad89-ead3d6c22c00','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理指标','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '68e736d6-6a77-4b64-ad89-ead3d6c22c00' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '7c4f09cb-ab38-45c9-8224-843f8b6a373f','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理编码生成规则','Basic',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '7c4f09cb-ab38-45c9-8224-843f8b6a373f' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '7efe085c-c675-4517-a276-967d3cfa234d','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理前置机','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '7efe085c-c675-4517-a276-967d3cfa234d' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '818be06d-d3ea-4f4f-815b-8704ae403ba6','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理数据标准','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '818be06d-d3ea-4f4f-815b-8704ae403ba6' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '834ee866-5ca0-419a-b84d-477694bd5d39','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理业务架构','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '834ee866-5ca0-419a-b84d-477694bd5d39' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '8860f32c-e57f-4d01-979a-bd26654596fd','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'基础权限','BasicPermission',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '8860f32c-e57f-4d01-979a-bd26654596fd' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '8e7406af-482f-4e6d-ac9e-37b19c69c717','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'分析和实施供需对接','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '8e7406af-482f-4e6d-ac9e-37b19c69c717' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '9070e117-273b-4c70-8b93-1aecdee05b28','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理审核策略','Basic',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '9070e117-273b-4c70-8b93-1aecdee05b28' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '982eaf56-74fb-484a-a390-e205d4c80d95','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理库表','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '982eaf56-74fb-484a-a390-e205d4c80d95' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '9976db14-47b6-4c55-9d20-a86096635e6b','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理数据质量','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '9976db14-47b6-4c55-9d20-a86096635e6b' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '9b976ebf-fc9c-4f0d-aff9-af6624881cd9','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理数据调研报告','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '9b976ebf-fc9c-4f0d-aff9-af6624881cd9' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '9c95aa01-6559-48e7-88f3-dbd1b50f1798','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'访问数据资源','Service',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '9c95aa01-6559-48e7-88f3-dbd1b50f1798' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '9cf7c7c8-7b75-47a8-b390-245072dcffb1','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理数据归集工单','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '9cf7c7c8-7b75-47a8-b390-245072dcffb1' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '9f20e636-d09d-4439-b74d-6db0f5cd420f','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理数据字典','Basic',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '9f20e636-d09d-4439-b74d-6db0f5cd420f' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT 'a5603c74-569e-4a75-bac4-d15d76c84a56','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理理解模板','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = 'a5603c74-569e-4a75-bac4-d15d76c84a56' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT 'a9aea8b6-8961-49b4-92ea-453ce2408470','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理数据运营项目','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = 'a9aea8b6-8961-49b4-92ea-453ce2408470' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT 'ab9ce811-e5fd-4b44-9d93-926a90427ab6','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理集成应用','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = 'ab9ce811-e5fd-4b44-9d93-926a90427ab6' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT 'af703060-4f7a-4638-ac4a-c0d3c3af00d0','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'审核质量工单','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = 'af703060-4f7a-4638-ac4a-c0d3c3af00d0' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT 'afbcdb6c-cb85-4a0c-82ee-68c9f1465684','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理数据资源授权','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = 'afbcdb6c-cb85-4a0c-82ee-68c9f1465684' );
-- insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT 'b2e55beb-e906-4649-8169-c3e8a499ebaa','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'审核共享申请','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = 'b2e55beb-e906-4649-8169-c3e8a499ebaa' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT 'c4be2537-7d5e-494f-890f-4ecf6d958476','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'审核归集工单','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = 'c4be2537-7d5e-494f-890f-4ecf6d958476' );
-- insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT 'ce83dad2-567c-487c-aa7a-f231d32cb93b','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'分析和实施数据分析需求','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = 'ce83dad2-567c-487c-aa7a-f231d32cb93b' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT 'dc9cb4f2-ff4b-4b7f-a8ae-3747071b7dd0','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理数据归集计划','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = 'dc9cb4f2-ff4b-4b7f-a8ae-3747071b7dd0' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT 'df5733b3-40bf-4edd-8ce4-e8f540f8cf90','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理数据推送','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = 'df5733b3-40bf-4edd-8ce4-e8f540f8cf90' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT 'dfd1ef75-6cea-4cf8-8827-cfdad6414aec','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'查看理解报告','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = 'dfd1ef75-6cea-4cf8-8827-cfdad6414aec' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT 'e2883f33-466c-4e86-a151-fdd291a9a892','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理数据理解计划','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = 'e2883f33-466c-4e86-a151-fdd291a9a892' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT 'e2c2f816-1454-4e8f-b11d-1e99bff07702','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'分析和实施共享申请','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = 'e2c2f816-1454-4e8f-b11d-1e99bff07702' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT 'e9a9bdc9-bc2e-4222-87ba-5d3751ec6a04','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理数据源','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = 'e9a9bdc9-bc2e-4222-87ba-5d3751ec6a04' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT 'ecb6e712-1b7f-492a-8cb3-0f7fc299a0f2','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'发起数据分析需求','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = 'ecb6e712-1b7f-492a-8cb3-0f7fc299a0f2' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT 'edb4492e-a69c-4fc9-9609-2ba88b1624ca','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'审核数据理解报告','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = 'edb4492e-a69c-4fc9-9609-2ba88b1624ca' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT 'efb46db2-02f0-46a9-902e-ca587685785f','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'发起数据供需对接','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = 'efb46db2-02f0-46a9-902e-ca587685785f' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT 'f1019a3a-8e99-49f6-bf3a-bf350fcb2b87','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'审核供需对接','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = 'f1019a3a-8e99-49f6-bf3a-bf350fcb2b87' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT 'f34ea9b3-0121-4e4e-8303-df989ee958da','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理业务模型、数据模型和业务诊断','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = 'f34ea9b3-0121-4e4e-8303-df989ee958da' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT 'f9138813-cb42-408e-993b-9de758c0e6f9','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理资源目录','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = 'f9138813-cb42-408e-993b-9de758c0e6f9' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT 'f99d1a54-5e2f-42cc-b35c-614a57c2a6ad','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'发起共享申请','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = 'f99d1a54-5e2f-42cc-b35c-614a57c2a6ad' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT 'fa77a70c-37c9-46fd-a805-3a4265fb28b9','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理信息系统','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = 'fa77a70c-37c9-46fd-a805-3a4265fb28b9' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT 'f077a70c-37c9-46fd-a805-3a4265fb28b0','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理门户的信息展示','Information',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = 'f077a70c-37c9-46fd-a805-3a4265fb28b0' );

insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2800','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理厂商名录','Basic',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2800' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2801','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理消息设置','Basic',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2801' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2802','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理积分规则','Basic',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2802' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2803','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理通讯录','Basic',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2803' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2804','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理业务文件','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2804' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2805','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理业务标签','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2805' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2806','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理文件资源','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2806' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2807','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理数据沙箱','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2807' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2808','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理数据价值评估','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2808' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2809','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理数据归集清单','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2809' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2810','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理数据处理计划','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2810' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2811','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理标准化工单','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2811' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2812','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理质量检测工单','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2812' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2813','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理数据融合工单','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2813' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2814','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理租户申请','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2814' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2815','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'发起数据成效反馈','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2815' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2816','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'处理数据成效反馈','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2816' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2817','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理数据可信度评估','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2817' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2818','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理资源负面清单','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2818' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2819','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理工单信息','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2819' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2820','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理工单任务','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2820' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2821','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'审核业务标签','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2821' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2822','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'审核业务架构','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2822' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2823','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'审核业务模型','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2823' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2824','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'审核数据模型','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2824' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2825','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'审核业务诊断报告','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2825' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2826','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'审核工单信息','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2826' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2827','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'审核集成应用','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2827' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2830','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'审核调研报告','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2830' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2831','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'审核归集清单','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2831' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2832','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'审核文件资源','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2832' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2833','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'审核信息资源目录','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2833' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2834','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'审核数据资源目录','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2834' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2835','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'审核开放目录','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2835' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2836','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'审核前置机申请','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2836' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2837','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'审核标准化工单','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2837' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2838','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'审核数据处理计划','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2838' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2839','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'审核质量检测工单','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2839' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2840','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'审核数据融合工单','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2840' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2842','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'审核租户申请','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2842' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2847','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'审核共享申请申报','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2847' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2848','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'审核共享申请分析结论','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2848' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2849','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'共享申请数据提供方审核','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2849' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2850','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'审核数据成效反馈','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2850' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2851','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'审核数据分析需求申报','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2851' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2852','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'审核数据分析需求结论','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2852' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2854','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'审核数据沙箱','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2854' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2855','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'审核数据目录上报','SszdZone',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2855' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2856','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'审核数据资源上报','SszdZone',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2856' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2857','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'审核数据需求','SszdZone',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2857' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2858','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'审核共享资源','SszdZone',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2858' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2859','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'审核数据异议','SszdZone',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2859' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2860','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'审核集成应用上报','SszdZone',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2860' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2861','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'发起数据目录上报','SszdZone',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2861' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2862','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'发起数据资源上报','SszdZone',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2862' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2863','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'发起需求申请','SszdZone',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2863' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2864','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'需求签收和实施','SszdZone',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2864' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2865','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理共享申请和订阅','SszdZone',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2865' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2866','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理待处理共享申请','SszdZone',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2866' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2867','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'发起应用案例上报','SszdZone',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2867' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2868','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'查看省级应用案例','SszdZone',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2868' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2869','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理集成应用','SszdZone',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2869' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2870','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'申请前置机','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2870' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2871','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'审核数据分析成果出库','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2871' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2872','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'处理分析需求成效反馈','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2872' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2873','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'审核分析需求成效反馈','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2873' );

insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2874','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理电子证照目录','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2874' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2875','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理目录分类','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2875' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2876','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理开放目录','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2876' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2877','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'完善数据分析需求','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2877' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2878','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'实施数据分析需求','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2878' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2879','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'确认数据分析需求成果','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2879' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2880','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'处理数据分析需求成果出库','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2880' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2881','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'反馈数据分析需求成效','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2881' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2882','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理需求分析成果目录','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2882' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2883','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'申请数据沙箱','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2883' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2884','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'实施数据沙箱','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2884' );
-- insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2885','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理接口概览','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2885' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2886','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'确认数据推送','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2886' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2887','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'确认需求资源','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2887' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2888','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理系统运行评价','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2888' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`) SELECT '0077a70c-37c9-46fd-a805-3a4265fb2889','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'数据质量检测模板','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '0077a70c-37c9-46fd-a805-3a4265fb2889' );
insert into `permissions` (`id`, `created_at`, `updated_at`, `deleted_at`, `name`, `category`, `description`)
SELECT '3c11eadd-8259-11f0-9f49-0eb42bdf8fb1','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'业务事项管理','Operation',NULL
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `permissions` WHERE `id` = '3c11eadd-8259-11f0-9f49-0eb42bdf8fb1' );




INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e01g', '0000663b-46a9-45e4-b6f7-a6bd8c18bd46', '9c95aa01-6559-48e7-88f3-dbd1b50f1798'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e01g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e02g', '0000663b-46a9-45e4-b6f7-a6bd8c18bd46', 'ecb6e712-1b7f-492a-8cb3-0f7fc299a0f2'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e02g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e03g', '00008516-45b3-44c9-9188-ca656969e20f', '211783fe-b79a-49f3-8a90-3402635b7456'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e03g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e04g', '00008516-45b3-44c9-9188-ca656969e20f', '9c95aa01-6559-48e7-88f3-dbd1b50f1798'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e04g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e05g', '00005871-cedd-4216-bde0-94ced210e898', '9c95aa01-6559-48e7-88f3-dbd1b50f1798'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e05g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e06g', '00005871-cedd-4216-bde0-94ced210e898', '29d08b27-1974-48de-8979-bcb222b90f72'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e06g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e07g', '00005871-cedd-4216-bde0-94ced210e898', '68e736d6-6a77-4b64-ad89-ead3d6c22c00'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e07g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e08g', '00005871-cedd-4216-bde0-94ced210e898', '982eaf56-74fb-484a-a390-e205d4c80d95'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e08g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e09g', '00004606-f318-450f-bc53-f0720b27acff', '9c95aa01-6559-48e7-88f3-dbd1b50f1798'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e09g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e10g', '00004606-f318-450f-bc53-f0720b27acff', 'f34ea9b3-0121-4e4e-8303-df989ee958da'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e10g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e11g', '00004606-f318-450f-bc53-f0720b27acff', '473a7956-25f6-4f1b-846b-94e71dc058cb'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e11g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e12g', '00004606-f318-450f-bc53-f0720b27acff', '982eaf56-74fb-484a-a390-e205d4c80d95'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e12g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e13g', '00004606-f318-450f-bc53-f0720b27acff', '68e736d6-6a77-4b64-ad89-ead3d6c22c00'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e13g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e14g', '00004606-f318-450f-bc53-f0720b27acff', '4ce45b8b-d19c-435b-81ce-f3abf561b21a'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e14g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e15g', '00004606-f318-450f-bc53-f0720b27acff', 'f9138813-cb42-408e-993b-9de758c0e6f9'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e15g' );

INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e55g', '00003148-fbbf-4879-988d-54af7c98c7ed', '49604f6f-dfc2-4faf-9aa8-69c05cc297b0'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e55g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e56g', '00003148-fbbf-4879-988d-54af7c98c7ed', 'c4be2537-7d5e-494f-890f-4ecf6d958476'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e56g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e57g', '00003148-fbbf-4879-988d-54af7c98c7ed', '0077a70c-37c9-46fd-a805-3a4265fb2830'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e57g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e58g', '00003148-fbbf-4879-988d-54af7c98c7ed', 'af703060-4f7a-4638-ac4a-c0d3c3af00d0'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e58g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e59g', '00003148-fbbf-4879-988d-54af7c98c7ed', '4cfdc28e-97f4-445b-9968-f575d61896e9'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e59g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e60g', '00003148-fbbf-4879-988d-54af7c98c7ed', '3273957b-f811-4639-9e08-3e6133fd891a'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e60g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e61g', '00003148-fbbf-4879-988d-54af7c98c7ed', 'edb4492e-a69c-4fc9-9609-2ba88b1624ca'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e61g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e62g', '00003148-fbbf-4879-988d-54af7c98c7ed', '0077a70c-37c9-46fd-a805-3a4265fb2847'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e62g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e63g', '00003148-fbbf-4879-988d-54af7c98c7ed', '0077a70c-37c9-46fd-a805-3a4265fb2851'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e63g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e64g', '00003148-fbbf-4879-988d-54af7c98c7ed', '0077a70c-37c9-46fd-a805-3a4265fb2848'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e64g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e65g', '00003148-fbbf-4879-988d-54af7c98c7ed', '0077a70c-37c9-46fd-a805-3a4265fb2852'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e65g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e66g', '00003148-fbbf-4879-988d-54af7c98c7ed', '67b4198b-4dd4-4029-a716-286e378d14b7'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e66g' );

INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e16g', '00003148-fbbf-4879-988d-54af7c98c7ed', '9c95aa01-6559-48e7-88f3-dbd1b50f1798'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e16g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e27g', '00003148-fbbf-4879-988d-54af7c98c7ed', 'a9aea8b6-8961-49b4-92ea-453ce2408470'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e27g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e28g', '00003148-fbbf-4879-988d-54af7c98c7ed', 'f34ea9b3-0121-4e4e-8303-df989ee958da'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e28g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e29g', '00003148-fbbf-4879-988d-54af7c98c7ed', '818be06d-d3ea-4f4f-815b-8704ae403ba6'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e29g' );


INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e67g', '00002fb7-1e54-4ce1-bc02-626cb1f85f62', '49604f6f-dfc2-4faf-9aa8-69c05cc297b0'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e67g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e68g', '00002fb7-1e54-4ce1-bc02-626cb1f85f62', 'c4be2537-7d5e-494f-890f-4ecf6d958476'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e68g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e69g', '00002fb7-1e54-4ce1-bc02-626cb1f85f62', '0077a70c-37c9-46fd-a805-3a4265fb2830'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e69g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e70g', '00002fb7-1e54-4ce1-bc02-626cb1f85f62', 'af703060-4f7a-4638-ac4a-c0d3c3af00d0'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e70g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e71g', '00002fb7-1e54-4ce1-bc02-626cb1f85f62', '4cfdc28e-97f4-445b-9968-f575d61896e9'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e71g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e72g', '00002fb7-1e54-4ce1-bc02-626cb1f85f62', '3273957b-f811-4639-9e08-3e6133fd891a'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e72g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e73g', '00002fb7-1e54-4ce1-bc02-626cb1f85f62', 'edb4492e-a69c-4fc9-9609-2ba88b1624ca'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e73g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e74g', '00002fb7-1e54-4ce1-bc02-626cb1f85f62', '0077a70c-37c9-46fd-a805-3a4265fb2847'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e74g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e75g', '00002fb7-1e54-4ce1-bc02-626cb1f85f62', '0077a70c-37c9-46fd-a805-3a4265fb2851'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e75g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e76g', '00002fb7-1e54-4ce1-bc02-626cb1f85f62', '0077a70c-37c9-46fd-a805-3a4265fb2848'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e76g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e77g', '00002fb7-1e54-4ce1-bc02-626cb1f85f62', '0077a70c-37c9-46fd-a805-3a4265fb2852'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e77g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e78g', '00002fb7-1e54-4ce1-bc02-626cb1f85f62', '67b4198b-4dd4-4029-a716-286e378d14b7'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e78g' );

INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e32g', '00002fb7-1e54-4ce1-bc02-626cb1f85f62', 'f34ea9b3-0121-4e4e-8303-df989ee958da'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e32g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e30g', '00002fb7-1e54-4ce1-bc02-626cb1f85f62', 'afbcdb6c-cb85-4a0c-82ee-68c9f1465684'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e30g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e31g', '00002fb7-1e54-4ce1-bc02-626cb1f85f62', '9c95aa01-6559-48e7-88f3-dbd1b50f1798'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e31g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e42g', '00002fb7-1e54-4ce1-bc02-626cb1f85f62', 'a9aea8b6-8961-49b4-92ea-453ce2408470'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e42g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e43g', '00002fb7-1e54-4ce1-bc02-626cb1f85f62', '818be06d-d3ea-4f4f-815b-8704ae403ba6'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e43g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e44g', '00007030-4e75-4c5e-aa56-f1bdf7044791', 'ab9ce811-e5fd-4b44-9d93-926a90427ab6'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e44g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e45g', '00007030-4e75-4c5e-aa56-f1bdf7044791', '9c95aa01-6559-48e7-88f3-dbd1b50f1798'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e45g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e40g', '00001f64-209f-4260-91f8-c61c6f820136', '473a7956-25f6-4f1b-846b-94e71dc058cb'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e40g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e46g', '00001f64-209f-4260-91f8-c61c6f820136', '41095041-05dc-4139-b6cd-e786079db2ab'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e46g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e47g', '00001f64-209f-4260-91f8-c61c6f820136', 'fa77a70c-37c9-46fd-a805-3a4265fb28b9'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e47g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e48g', '00001f64-209f-4260-91f8-c61c6f820136', '31c09e56-cf9a-42fd-aea5-9ee7fa781cd0'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e48g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e49g', '00001f64-209f-4260-91f8-c61c6f820136', 'e9a9bdc9-bc2e-4222-87ba-5d3751ec6a04'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e49g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e50g', '00001f64-209f-4260-91f8-c61c6f820136', '167d41c2-4b37-47e1-9c29-d103c4873f4f'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e50g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e50g', '00001f64-209f-4260-91f8-c61c6f820136', '473a7956-25f6-4f1b-846b-94e71dc058cb'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e50g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e51g', '00001f64-209f-4260-91f8-c61c6f820136', '9070e117-273b-4c70-8b93-1aecdee05b28'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e51g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e52g', '00001f64-209f-4260-91f8-c61c6f820136', '7c4f09cb-ab38-45c9-8224-843f8b6a373f'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e52g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e53g', '00001f64-209f-4260-91f8-c61c6f820136', '18abfb60-5b18-4e63-9010-63fce5b5eb3e'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e53g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e54g', '00108516-45b3-44c9-9188-ca656969e20g', 'f077a70c-37c9-46fd-a805-3a4265fb28b0'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e54g' );
INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e80g', '00108516-45b3-44c9-9188-ca656969e20g', '9c95aa01-6559-48e7-88f3-dbd1b50f1798'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e80g' );

INSERT INTO `role_permission_bindings` (`id`, `role_id`,`permission_id`)
SELECT '10108516-45b3-44c9-9188-ca656969e81g', '00004606-f318-450f-bc53-f0720b27acff', '5c100c9e-5f93-48fb-92ef-d5a898aa3fe0'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `role_permission_bindings` WHERE `id` = '10108516-45b3-44c9-9188-ca656969e81g' );

INSERT INTO `user_role_bindings` (`id`,`user_id`, `role_id`)
SELECT '0100a2d9-c244-4d09-8e44-c2fea0e0e3f0', '266c6a42-6131-4d62-8f39-853e7093701c', '00001f64-209f-4260-91f8-c61c6f820136'
FROM DUAL WHERE NOT EXISTS(SELECT `id` FROM `user_role_bindings` WHERE `id` = '0100a2d9-c244-4d09-8e44-c2fea0e0e3f0' );


CREATE TABLE IF NOT EXISTS `t_platform_zone` (
    `platform_zone_id` BIGINT NOT NULL COMMENT '唯一id，雪花算法',
    `id` char(36) NOT NULL COMMENT '对象ID',
    `description` varchar(50) NOT NULL DEFAULT '' COMMENT '运营流程描述说明',
    `image_data` LONGTEXT NOT NULL COMMENT '图片二进制base64编码',
    `sort_weight` BIGINT NOT NULL DEFAULT 0 COMMENT '排序权重',
    PRIMARY KEY (`platform_zone_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='工作专区表';

CREATE TABLE IF NOT EXISTS `t_platform_zone_history_record` (
    `platform_zone_history_record_id` BIGINT NOT NULL COMMENT '唯一id，雪花算法',
    `id` char(36) NOT NULL COMMENT '对象ID',
    `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3)  COMMENT '更新时间',
    `updated_by` VARCHAR(36) DEFAULT NULL COMMENT '更新用户ID',
    PRIMARY KEY (`platform_zone_history_record_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='工作专区历史访问记录';

CREATE TABLE IF NOT EXISTS `t_platform_service` (
    `platform_zone_service_id` BIGINT NOT NULL COMMENT '唯一id，雪花算法',
    `id` char(36) NOT NULL COMMENT '对象ID',
    `name` varchar(255) NOT NULL COMMENT '运营流程描述说明',
    `description` varchar(50) NOT NULL DEFAULT '' COMMENT '运营流程描述说明',
    `url` varchar(1024) NOT NULL COMMENT '运营流程描述说明',
    `image_data` LONGTEXT NOT NULL COMMENT '图片二进制base64编码',
    `is_enabled` BOOLEAN NOT NULL COMMENT '是否启用',
    `sort_weight` BIGINT NOT NULL DEFAULT 0 COMMENT '排序权重',
    UNIQUE KEY t_platform_zone_id (`id`),
    PRIMARY KEY (`platform_zone_service_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='平台服务表';



CREATE TABLE IF NOT EXISTS `t_carousel_case`
(
    `id`     char(36) NOT NULL,
    `application_example_id`     char(36)  NULL,
    `name` varchar(256) NOT NULL COMMENT '文件名',
    `uuid` varchar(256) NOT NULL COMMENT 'UUID文件名',
    `size` bigint(20) NOT NULL DEFAULT 0 COMMENT '文件大小',
    `save_path` text NOT NULL COMMENT '文件保存路径',
    `sort_order` int(11) COMMENT '排序号',
    `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) COMMENT '上传时间',
    `created_by` varchar(64) DEFAULT NULL COMMENT '上传用户ID',
    `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3)  COMMENT '更新时间',
    `type` char(36) NULL COMMENT '类型,1: 轮播图例,2: 本市州示例, 3: 其他市州示例',
    `interval_seconds` char(36) NOT NULL default 3 COMMENT '轮播间隔时间',
    `state`  char(36) NOT NULL default 0 COMMENT '状态,0: 启用,1: 禁用',
    `is_top` char(36) NOT NULL default 1 COMMENT '是否置顶,0为置顶，1为非置顶',
    PRIMARY KEY (`id`)
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '轮播图案例示例';

CREATE TABLE IF NOT EXISTS `t_cms_content` (
    `id` char(38) NOT NULL COMMENT '主键ID',
    `title` varchar(255) NOT NULL COMMENT '标题',
    `summary` varchar(500) DEFAULT NULL COMMENT '摘要',
    `content` longtext NOT NULL COMMENT '正文内容',
    `type` char(10) NOT NULL DEFAULT '0' COMMENT '类型：0-新闻动态，1-政策动态',
    `status` char(10) NOT NULL DEFAULT '0' COMMENT '状态：0-已发布，1-未发布',
    `home_show` char(10) NOT NULL DEFAULT '0' COMMENT '封面图标记：0-否，1-是',
    `image_id` char(38)  NULL  DEFAULT null COMMENT '图片编号',
    `save_path` varchar(200)  NULL  DEFAULT null COMMENT '保存路径',
    `size` bigint(20)  NULL  DEFAULT null COMMENT '图片大小',
    `publish_time` datetime DEFAULT NULL COMMENT '发布时间',
    `creator_id` char(38) DEFAULT NULL COMMENT '创建人ID（关联用户表）',
    `updater_id` char(38) DEFAULT NULL COMMENT '更新人ID（关联用户表）',
    `create_time` char(38) NOT NULL COMMENT '创建时间',
    `update_time` char(38) NOT NULL  COMMENT '更新时间',
    `is_deleted` char(11) NOT NULL DEFAULT '0' COMMENT '逻辑删除：0-未删除，1-已删除',
    PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='内容信息表';


CREATE TABLE IF NOT EXISTS `t_help_document` (
    `id` char(38) NOT NULL  COMMENT '主键ID',
    `title` varchar(255) NOT NULL COMMENT '文档标题',
    `type` char(10) NOT NULL COMMENT '类型：0-使用手册，1-常见问题',
    `status` char(10) NOT NULL DEFAULT '0' COMMENT '状态：0-未发布，1-已发布',
    `image_id` char(38)  NULL  DEFAULT null COMMENT '图片编号',
    `save_path` varchar(200)  NULL  DEFAULT null COMMENT '保存路径',
    `size` bigint(20)  NULL  DEFAULT null COMMENT '图片大小',
    `is_deleted` char(10) NOT NULL DEFAULT '0' COMMENT '逻辑删除标记',
    `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP  COMMENT '更新时间',
    `published_at` varchar(38) DEFAULT NULL COMMENT '发布时间',
    `created_by` varchar(64) DEFAULT NULL COMMENT '创建用户ID',
    `updated_by` varchar(64) DEFAULT NULL COMMENT '更新用户ID',
    PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='帮助文档主表';



-- 插入 t_dict 记录前检查是否已存在该记录
INSERT INTO af_configuration.t_dict
(id, f_type, name, f_description, f_version, created_at, creator_uid, creator_name, updated_at, updater_uid, updater_name, deleted_at, sszd_flag)
SELECT 44, 'help-document', '使用手册', '帮助文档', 'V1.0.0', '2025-05-17 13:18:55', NULL, NULL, '2025-05-17 13:18:55', NULL, NULL, 0, 1
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM af_configuration.t_dict WHERE id = 44
);

-- 插入 t_dict_item 第一条记录前检查是否已存在该记录
INSERT INTO af_configuration.t_dict_item
(id, dict_id, f_type, f_key, f_value, f_description, f_sort, created_at, creator_uid, creator_name)
SELECT 452, 44, 'help-document', '1', '使用手册', NULL, 1, '2025-05-17 13:24:55', NULL, NULL
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM af_configuration.t_dict_item WHERE id = 452
);

-- 插入 t_dict_item 第二条记录前检查是否已存在该记录
INSERT INTO af_configuration.t_dict_item
(id, dict_id, f_type, f_key, f_value, f_description, f_sort, created_at, creator_uid, creator_name)
SELECT 453, 44, 'help-document', '2', '常见问题', NULL, 2, '2025-05-17 13:24:55', NULL, NULL
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM af_configuration.t_dict_item WHERE id = 453
);

-- 插入 t_dict_item 第三条记录前检查是否已存在该记录
INSERT INTO af_configuration.t_dict_item
(id, dict_id, f_type, f_key, f_value, f_description, f_sort, created_at, creator_uid, creator_name)
SELECT 454, 44, 'help-document', '3', '技术支持', NULL, 3, '2025-05-17 13:24:55', NULL, NULL
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM af_configuration.t_dict_item WHERE id = 454
);


-- 前置机列表
CREATE TABLE IF NOT EXISTS `front_end_item` (
    `id` char(36) NOT NULL COMMENT 'ID',
    `front_end_id` char(36) NOT NULL COMMENT '前置机 ID',
    `operator_system` varchar(128) DEFAULT NULL COMMENT '操作系统类型/版本',
    `computer_resource` varchar(128) DEFAULT NULL COMMENT '计算资源规格',
    `disk_space` int(11) DEFAULT NULL COMMENT '业务磁盘空间大小',
    `library_number` int(11) DEFAULT NULL COMMENT '前置库数量',
    `updated_at` varchar(30) DEFAULT NULL COMMENT '更新日期',
    `deleted_at` varchar(30) DEFAULT NULL,
    `created_at` varchar(30) DEFAULT NULL COMMENT '创建日期',
    `node_ip` varchar(100) DEFAULT NULL COMMENT '节点的IP',
    `node_port` int(11) DEFAULT NULL COMMENT '节点的端口',
    `node_name` varchar(255) DEFAULT NULL COMMENT '节点的名称',
    `administrator_name` varchar(255) DEFAULT NULL COMMENT '技术负责人姓名',
    `administrator_phone` varchar(255) DEFAULT NULL COMMENT '技术负责人电话',
    `status` varchar(200) DEFAULT NULL COMMENT 'Receipt 未签收，已使用：InUse，已回收：Reclaimed',
     PRIMARY KEY (`id`)
    ) COMMENT='前置机项目信息' COLLATE='utf8mb4_unicode_ci' ENGINE=InnoDB;

-- 前置库
CREATE TABLE IF NOT EXISTS `front_end_library` (
    `id` char(36) NOT NULL COMMENT 'ID',
    `front_end_id` char(36) NOT NULL COMMENT '前置机 ID',
    `type` char(36) DEFAULT NULL COMMENT '前置库类型',
    `name` char(255) DEFAULT NULL COMMENT '前置库名称',
    `username` char(255) DEFAULT NULL COMMENT '前置库用户名',
    `password` char(255) DEFAULT NULL COMMENT '前置库密码',
    `business_name` char(255) DEFAULT NULL COMMENT '对接业务名称',
    `comment` varchar(300) DEFAULT NULL COMMENT '前置库说明',
    `updated_at` varchar(100) DEFAULT NULL COMMENT '更新时间',
    `created_at` varchar(100) DEFAULT NULL,
    `deleted_at` varchar(30) DEFAULT NULL,
    `front_end_item_id` char(36) NOT NULL,
    `version` varchar(255) DEFAULT NULL COMMENT '前置库版本',
    `update_time` varchar(100) DEFAULT NULL,
    PRIMARY KEY (`id`,`front_end_id`,`front_end_item_id`)
    ) COMMENT='前置库信息' COLLATE='utf8mb4_unicode_ci' ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `liyue_registrations` (
    `id` varchar(36) NOT NULL COMMENT '机构注册ID',
    `liyue_id` varchar(38) NOT NULL COMMENT '对应到里约网关注册的机构、系统、应用',
    `user_id` varchar(500) NOT NULL COMMENT '负责人ID,逗号分割，默认第一个为负责人',
    `type` tinyint(4) DEFAULT NULL COMMENT '1 机构注册 2 信息系统注册  3 应用注册',
    PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='机构注册信息表';

INSERT  INTO `configuration`(`key`,`value`,`type`)
SELECT 'platform_zone_display', 'list', '0'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'platform_zone_display' );

CREATE TABLE IF NOT EXISTS  `business_matters` (
    `id` bigint(20) unsigned NOT NULL COMMENT '雪花id',
    `business_matters_id` CHAR(36) NOT NULL    COMMENT '对象ID, uuid',
    `name` varchar(128) NOT NULL COMMENT '业务事项名称',
    `type_key` varchar(64) NOT NULL COMMENT '业务事项类型key',
    `department_id` char(36)  NOT NULL COMMENT '所属部门',
    `materials_number` BIGINT unsigned NOT NULL DEFAULT 0 COMMENT '材料数',
    `created_at` datetime(3) NOT NULL  DEFAULT current_timestamp(3) COMMENT '创建时间',
    `creator_uid` varchar(36) NOT NULL COMMENT '创建用户ID',
    `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3)  COMMENT '更新时间',
    `updater_uid` varchar(36) NOT NULL COMMENT '更新用户ID',
    `deleted_at`  bigint(20) NOT NULL DEFAULT 0 COMMENT '删除时间（逻辑删除）',
    UNIQUE KEY `business_matters_name` (`name`,`deleted_at`),
    PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='业务事项表';

CREATE TABLE IF NOT EXISTS `audit_policy` (
  `sid` bigint(20) unsigned NOT NULL COMMENT '雪花id',
  `id` char(36) NOT NULL COMMENT '对象id，uuid',
  `name` varchar(128) NOT NULL COMMENT '名称',
  `description` varchar(300) NOT NULL DEFAULT '' COMMENT '描述',
  `type` char(36) NOT NULL COMMENT '类型：customize（自定义的）, built-in-interface-svc（内置接口）， built-in-data-view（内置视图）， built-in-indicator（内置指标））',
  `status` char(36) NOT NULL COMMENT '审核策略状态: not-enabled（未启用）, enabled（已启用）, disabled（已停止）',
  `resources_count` int(11) NOT NULL DEFAULT 0 COMMENT '资源数量',
  `audit_type` varchar(50) NOT NULL COMMENT '审核类型 af-data-view-publish 发布审核 af-data-view-online 上线审核  af-data-view-offline 上线审核',
  `proc_def_key` varchar(128) NOT NULL COMMENT '审核流程key',
  `service_type` varchar(128) DEFAULT NULL COMMENT '所属业务模块，如逻辑视图业务为data-view',
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) COMMENT '创建时间',
  `created_by_uid` char(36) NOT NULL COMMENT '创建用户ID',
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3)  COMMENT '更新时间',
  `updated_by_uid` char(36) NOT NULL DEFAULT '' COMMENT '更新用户ID',
  `deleted_at` bigint(20) DEFAULT 0 COMMENT '删除时间（逻辑删除）',
  UNIQUE KEY `audit_policy_name` (`name`,`deleted_at`),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='审核策略定义';

CREATE TABLE IF NOT EXISTS `audit_policy_resources` (
  `sid` bigint(20) unsigned NOT NULL COMMENT '雪花id',
  `id` char(36) NOT NULL COMMENT '资源id，uuid',
  `audit_policy_id` char(36) NOT NULL COMMENT '审核策略id，uuid',
  `type` char(36) NOT NULL COMMENT '资源类型 interface-svc（接口）， data-view（视图）， indicator（内置指标）',
  `deleted_at` bigint(20) DEFAULT 0 COMMENT '删除时间（逻辑删除）',
  PRIMARY KEY (`sid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='审核策略资源定义';

INSERT INTO `audit_policy` (`sid`,`id`,`name`,`description`,`type`,`status`,`resources_count`,`audit_type`,`proc_def_key`,`service_type`,`created_by_uid`,`updated_by_uid`,`deleted_at`)
SELECT 000000000000000001,uuid(),'逻辑视图审核策略','作用于全部逻辑视图的权限申请','built-in-data-view','not-enabled',0,'af-data-permission-request','','auth-service','266c6a42-6131-4d62-8f39-853e7093701c','266c6a42-6131-4d62-8f39-853e7093701c',0
FROM DUAL WHERE NOT EXISTS(SELECT `sid` FROM `audit_policy` WHERE `sid` = 000000000000000001 );

INSERT INTO `audit_policy` (`sid`,`id`,`name`,`description`,`type`,`status`,`resources_count`,`audit_type`,`proc_def_key`,`service_type`,`created_by_uid`,`updated_by_uid`,`deleted_at`)
SELECT 000000000000000002,uuid(),'指标审核策略','作用于全部指标的权限申请','built-in-indicator','not-enabled',0,'af-data-permission-request','','auth-service','266c6a42-6131-4d62-8f39-853e7093701c','266c6a42-6131-4d62-8f39-853e7093701c',0
FROM DUAL WHERE NOT EXISTS(SELECT `sid` FROM `audit_policy` WHERE `sid` = 000000000000000002 );

INSERT INTO `audit_policy` (`sid`,`id`,`name`,`description`,`type`,`status`,`resources_count`,`audit_type`,`proc_def_key`,`service_type`,`created_by_uid`,`updated_by_uid`,`deleted_at`)
SELECT 000000000000000003,uuid(),'接口服务审核策略','作用于全部接口服务的权限申请','built-in-interface-svc','not-enabled',0,'af-data-permission-request','','auth-service','266c6a42-6131-4d62-8f39-853e7093701c','266c6a42-6131-4d62-8f39-853e7093701c',0
FROM DUAL WHERE NOT EXISTS(SELECT `sid` FROM `audit_policy` WHERE `sid` = 000000000000000003 );

