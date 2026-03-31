USE af_configuration;
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
SELECT 'using', '0', '0'
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
SELECT 'r_default_department_id', '9060f92a-3c6c-11f0-9815-12b58a7f919c', '6'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'r_default_department_id' );

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

USE af_configuration;
INSERT  INTO `configuration`(`key`,`value`,`type`)
SELECT 'sailor_search_qa_cites_num_limit', '50', '9'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'sailor_search_qa_cites_num_limit' and `type`='9');

USE af_configuration;
INSERT  INTO `configuration`(`key`,`value`,`type`)
SELECT 'kn_id_catalog', 'cognitive_search_data_catalog', '9'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'kn_id_catalog' and `type`='9');

USE af_configuration;
INSERT  INTO `configuration`(`key`,`value`,`type`)
SELECT 'kn_id_resource', 'cognitive_search_data_resource', '9'
FROM DUAL WHERE NOT EXISTS(SELECT `key` FROM `configuration` WHERE `key` = 'kn_id_catalog' and `type`='9');
