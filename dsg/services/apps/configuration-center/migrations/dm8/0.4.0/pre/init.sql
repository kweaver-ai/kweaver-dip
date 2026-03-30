SET SCHEMA af_configuration;

CREATE TABLE IF NOT EXISTS "configuration" (
    "key" VARCHAR(255 char) NOT NULL,
    "value" VARCHAR(255 char) DEFAULT NULL,
    "type" TINYINT NOT NULL DEFAULT 1,
    CLUSTER PRIMARY KEY ("key")
);

CREATE INDEX IF NOT EXISTS configuration_configuration_type_IDX ON configuration("type");


INSERT INTO "configuration"("key","value","type")

SELECT 'AISampleDataShow', 'YES', '4'

FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'AISampleDataShow');


INSERT INTO "configuration" ("key","value","type")

SELECT 'AlgServerConf', '{"app_id":"NZ55ab9qSdbI3NlGR5x", "service_id":"24ecd8ce3a934ecd89b6fc0ec3aa545c"}', '5'

FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'AlgServerConf');


INSERT INTO "configuration" ("key","value","type")

SELECT 'BIAnalysis', 'http://10.4.132.124:9080', '2'

FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'BIAnalysis');


INSERT INTO "configuration" ("key","value","type")

SELECT 'BusinessKnowledgeNetwork', 'https://10.4.132.124', '2'

FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'BusinessKnowledgeNetwork');


INSERT INTO "configuration" ("key","value","type")

SELECT 'Dolphin', 'http://36.152.209.113:12345', '2'

FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'Dolphin');


INSERT INTO "configuration" ("key","value","type")

SELECT 'provider', '', '3'

FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'provider');


INSERT INTO "configuration" ("key","value","type")

SELECT 'Standardization', 'http://standardization:80', '2'

FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'Standardization');


INSERT INTO "configuration" ("key","value","type")

SELECT '产业大脑', 'https://cydn-demo.aishu.cn/home/homePage', '1'

FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = '产业大脑');


INSERT INTO "configuration" ("key","value","type")

SELECT '指标溯源与影响分析', 'https://anyfabric-demo.aishu.cn/anyfabric/data-catalog/developing', '1'

FROM DUAL WHERE NOT EXISTS( SELECT "key" FROM "configuration" WHERE "key" = '指标溯源与影响分析');


INSERT INTO "configuration" ("key","value","type")

SELECT '流程可视化监控与分析', 'https://anyfabric-demo.aishu.cn/anyfabric/data-catalog/developing', '1'

FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = '流程可视化监控与分析');


INSERT INTO "configuration"("key","value","type")

SELECT 'min_score', '0.80', '6'

FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'min_score');


INSERT INTO "configuration"("key","value","type")

SELECT 'dept_layer', '4', '6'

FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'dept_layer');


INSERT INTO "configuration"("key","value","type")

SELECT 'domain_layer', '3', '6'

FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'domain_layer');


INSERT INTO "configuration"("key","value","type")

SELECT 'top_n', '20', '6'

FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'top_n');


INSERT INTO "configuration"("key","value","type")

SELECT 'q_bus_domain_weight', '0.5', '6'

FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'q_bus_domain_weight');

INSERT INTO "configuration"("key","value","type")

SELECT 'q_bus_domain_used_weight', '0.6', '6'

FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'q_bus_domain_used_weight');

INSERT INTO "configuration"("key","value","type")

SELECT 'q_bus_domain_unused_weight', '0.4', '6'

FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'q_bus_domain_unused_weight');


INSERT INTO "configuration"("key","value","type")

SELECT 'q_dept_weight', '0.3', '6'

FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'q_dept_weight');

INSERT INTO "configuration"("key","value","type")

SELECT 'q_dept_used_weight', '0.3', '6'

FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'q_dept_used_weight');

INSERT INTO "configuration"("key","value","type")

SELECT 'q_dept_unused_weight', '0.3', '6'

FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'q_dept_unused_weight');

INSERT INTO "configuration"("key","value","type")

SELECT 'q_info_sys_weight', '0.2', '6'

FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'q_info_sys_weight');


INSERT INTO "configuration"("key","value","type")

SELECT 'q_info_sys_used_weight', '0.3', '6'

FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'q_info_sys_used_weight');

INSERT INTO "configuration"("key","value","type")

SELECT 'q_info_sys_unused_weight', '0.3', '6'

FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'q_info_sys_unused_weight');


INSERT INTO "configuration"("key","value","type")

SELECT 's_bus_domain_weight', '0.5', '6'

FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 's_bus_domain_weight');

INSERT INTO "configuration"("key","value","type")

SELECT 's_bus_domain_used_weight', '0.6', '6'

FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 's_bus_domain_used_weight');

INSERT INTO "configuration"("key","value","type")

SELECT 's_bus_domain_unused_weight', '0.4', '6'

FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 's_bus_domain_unused_weight');

INSERT INTO "configuration"("key","value","type")

SELECT 's_dept_weight', '0.3', '6'

FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 's_dept_weight');

INSERT INTO "configuration"("key","value","type")

SELECT 's_dept_used_weight', '0.3', '6'

FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 's_dept_used_weight');

INSERT INTO "configuration"("key","value","type")

SELECT 's_dept_unused_weight', '0.3', '6'

FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 's_dept_unused_weight');


INSERT INTO "configuration"("key","value","type")

SELECT 's_info_sys_weight', '0.2', '6'

FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 's_info_sys_weight');

INSERT INTO "configuration"("key","value","type")

SELECT 's_info_sys_used_weight', '0.3', '6'

FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 's_info_sys_used_weight');

INSERT INTO "configuration"("key","value","type")

SELECT 's_info_sys_unused_weight', '0.3', '6'

FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 's_info_sys_unused_weight');


INSERT INTO "configuration"("key","value","type")

SELECT 'r_std_type_weight_0', '0.006', '6'

FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'r_std_type_weight_0');

INSERT INTO "configuration"("key","value","type")

SELECT 'r_std_type_weight_1', '0.007', '6'

FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'r_std_type_weight_1');

INSERT INTO "configuration"("key","value","type")

SELECT 'r_std_type_weight_2', '0.008', '6'

FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'r_std_type_weight_2');

INSERT INTO "configuration"("key","value","type")

SELECT 'r_std_type_weight_3', '0.009', '6'

FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'r_std_type_weight_3');

INSERT INTO "configuration"("key","value","type")

SELECT 'r_std_type_weight_4', '0.001', '6'

FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'r_std_type_weight_4');

INSERT INTO "configuration"("key","value","type")

SELECT 'r_std_type_weight_5', '0.005', '6'

FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'r_std_type_weight_5');

INSERT INTO "configuration"("key","value","type")

SELECT 'r_std_type_weight_6', '0.004', '6'

FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'r_std_type_weight_6');

INSERT INTO "configuration"("key","value","type")

SELECT 'r_std_type_weight_99', '0.0', '6'

FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'r_std_type_weight_99');

INSERT INTO "configuration"("key","value","type")

SELECT 'r_default_department_id', '9060f92a-3c6c-11f0-9815-12b58a7f919c', '6'

FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'r_default_department_id');

INSERT INTO "configuration"("key","value","type")

SELECT 'direct_qa', 'false', '8'

FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'direct_qa');

INSERT INTO "configuration"("key","value","type")

SELECT 'sql_limit', '100', '8'

FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'sql_limit');

INSERT INTO "configuration"("key","value","type")

SELECT 'sailor_agent_react_mode', 'true', '8'

FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'sailor_agent_react_mode');

INSERT INTO "configuration"("key","value","type")

SELECT 'sailor_agent_indicator_recall_top_k', '4', '8'

FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'sailor_agent_indicator_recall_top_k');

INSERT INTO "configuration"("key","value","type")

SELECT 'sailor_task_ex_time', '86400', '9'

FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'sailor_task_ex_time');

INSERT INTO "configuration"("key","value","type")

SELECT 'sailor_llm_input_len', '4000', '9'

FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'sailor_llm_input_len');

INSERT INTO "configuration"("key","value","type")

SELECT 'sailor_llm_out_len', '4000', '9'

FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'sailor_llm_out_len');

INSERT INTO "configuration"("key","value","type")

SELECT 'sailor_agent_llm_input_len', '8000', '9'

FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'sailor_agent_llm_input_len');

INSERT INTO "configuration"("key","value","type")

SELECT 'sailor_agent_llm_out_len', '8000', '9'

FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'sailor_agent_llm_out_len');

INSERT INTO "configuration"("key","value","type")

SELECT 'sailor_agent_return_record_limit', '-1', '9'

FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'sailor_agent_return_record_limit');

INSERT INTO "configuration"("key","value","type")

SELECT 'sailor_agent_return_data_limit', '-1', '9'

FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'sailor_agent_return_data_limit');

INSERT INTO "configuration"("key","value","type")

SELECT 'dimension_num_limit', '-1', '9'

FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'dimension_num_limit');


INSERT INTO "configuration"("key","value","type")

SELECT 'government_data_share', 'false', '0'

FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'government_data_share');

INSERT INTO "configuration"("key","value","type")

SELECT 'local_app', 'true', '0'

FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'local_app');

INSERT INTO "configuration"("key","value","type")

SELECT 'using', '0', '0'

FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'using');

INSERT INTO "configuration"("key","value","type")

SELECT 'cssjj', 'false', '0'

FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'cssjj');


INSERT INTO "configuration"("key","value","type")

SELECT '1', '业务表', '10'

FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = '1' and "type"='10');

INSERT INTO "configuration"("key","value","type")

SELECT '2', '信息资源目录', '10'

FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = '2' and "type"='10');



INSERT INTO "configuration"("key", value, "type") SELECT 'rec_label.query.query_min_score', '0.75', '6' FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'rec_label.query.query_min_score' and "type"='6');


INSERT INTO "configuration"("key", value, "type") SELECT 'rec_label.query.vector_min_score', '0.75', '6' FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'rec_label.query.vector_min_score' and "type"='6');


INSERT INTO "configuration"("key", value, "type") SELECT 'rec_label.query.top_n', '10', '6' FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'rec_label.query.top_n' and "type"='6');


INSERT INTO "configuration"("key", value, "type") SELECT 'rec_label.filter.llm.with_execute', 'False', '6' FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'rec_label.filter.llm.with_execute' and "type"='6');


INSERT INTO "configuration"("key", value, "type") SELECT 'rec_label.filter.llm.prompt_name', 'recommend_filter', '6' FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'rec_label.filter.llm.prompt_name' and "type"='6');


INSERT INTO "configuration"("key", value, "type") SELECT 'rec_label.filter.ml.with_execute', 'False', '6' FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'rec_label.filter.ml.with_execute' and "type"='6');


INSERT INTO "configuration"("key", value, "type") SELECT 'rec_label.filter.ml.name', '', '6' FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'rec_label.filter.ml.name' and "type"='6');


INSERT INTO "configuration"("key", value, "type") SELECT 'rec_label.filter.rule.with_execute', 'False', '6' FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'rec_label.filter.rule.with_execute' and "type"='6');


INSERT INTO "configuration"("key", value, "type") SELECT 'rec_label.filter.rule.name', '', '6' FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'rec_label.filter.rule.name' and "type"='6');

INSERT INTO "configuration"("key", value, "type") SELECT 'rec_llm_input_len', '8000', '6' FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'rec_llm_input_len' and "type"='6');

INSERT INTO "configuration"("key", value, "type") SELECT 'rec_llm_output_len', '8000', '6' FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'rec_llm_output_len' and "type"='6');


INSERT INTO "configuration"("key", value, "type") SELECT 'dimension_num_limit', '-1', '9' FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'dimension_num_limit' and "type"='9');

INSERT INTO "configuration"("key", value, "type") SELECT 'data_market_llm_temperature', '0.2', '9' FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'data_market_llm_temperature' and "type"='9');


INSERT INTO "configuration"("key","value","type")

SELECT 'sailor_search_if_history_qa_enhance', '0', '9'

FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'sailor_search_if_history_qa_enhance' and "type"='9');


INSERT INTO "configuration"("key","value","type")

SELECT 'sailor_search_if_kecc', '0', '9'

FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'sailor_search_if_kecc' and "type"='9');


INSERT INTO "configuration"("key","value","type")

SELECT 'sailor_search_if_auth_in_find_data_qa', '1', '9'

FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'sailor_search_if_auth_in_find_data_qa' and "type"='9');


INSERT INTO "configuration"("key","value","type")

SELECT 'sailor_vec_min_score_analysis_search', '0.5', '9'

FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'sailor_vec_min_score_analysis_search' and "type"='9');


INSERT INTO "configuration"("key","value","type")

SELECT 'sailor_vec_knn_k_analysis_search', '20', '9'

FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'sailor_vec_knn_k_analysis_search' and "type"='9');


INSERT INTO "configuration"("key","value","type")

SELECT 'sailor_vec_size_analysis_search', '20', '9'

FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'sailor_vec_size_analysis_search' and "type"='9');


INSERT INTO "configuration"("key","value","type")

SELECT 'sailor_vec_min_score_kecc', '0.5', '9'

FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'sailor_vec_min_score_kecc' and "type"='9');


INSERT INTO "configuration"("key","value","type")

SELECT 'sailor_vec_knn_k_kecc', '10', '9'

FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'sailor_vec_knn_k_kecc' and "type"='9');


INSERT INTO "configuration"("key","value","type")

SELECT 'sailor_vec_size_kecc', '10', '9'

FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'sailor_vec_size_kecc' and "type"='9');


INSERT INTO "configuration"("key","value","type")

SELECT 'kg_id_kecc', '6839', '9'

FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'kg_id_kecc' and "type"='9');


INSERT INTO "configuration"("key","value","type")

SELECT 'sailor_vec_min_score_history_qa', '0.7', '9'

FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'sailor_vec_min_score_history_qa' and "type"='9');


INSERT INTO "configuration"("key","value","type")

SELECT 'sailor_vec_knn_k_history_qa', '10', '9'

FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'sailor_vec_knn_k_history_qa' and "type"='9');


INSERT INTO "configuration"("key","value","type")

SELECT 'sailor_vec_size_history_qa', '10', '9'

FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'sailor_vec_size_history_qa' and "type"='9');


INSERT INTO "configuration"("key","value","type")

SELECT 'kg_id_history_qa', '19467', '9'

FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'kg_id_history_qa' and "type"='9');


INSERT INTO "configuration"("key","value","type")

SELECT 'sailor_token_tactics_history_qa', '1', '9'

FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'sailor_token_tactics_history_qa' and "type"='9');



INSERT INTO "configuration"("key","value","type")

SELECT 'sailor_search_qa_llm_temperature', '0', '9'

FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'sailor_search_qa_llm_temperature' and "type"='9');


INSERT INTO "configuration"("key","value","type")

SELECT 'sailor_search_qa_llm_top_p', '1', '9'

FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'sailor_search_qa_llm_top_p' and "type"='9');


INSERT INTO "configuration"("key","value","type")

SELECT 'sailor_search_qa_llm_presence_penalty', '0', '9'

FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'sailor_search_qa_llm_presence_penalty' and "type"='9');


INSERT INTO "configuration"("key","value","type")

SELECT 'sailor_search_qa_llm_frequency_penalty', '0', '9'

FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'sailor_search_qa_llm_frequency_penalty' and "type"='9');


INSERT INTO "configuration"("key","value","type")

SELECT 'sailor_search_qa_llm_max_tokens', '8000', '9'

FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'sailor_search_qa_llm_max_tokens' and "type"='9');


INSERT INTO "configuration"("key","value","type")

SELECT 'sailor_search_qa_llm_input_len', '4000', '9'

FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'sailor_search_qa_llm_input_len' and "type"='9');


INSERT INTO "configuration"("key","value","type")

SELECT 'sailor_search_qa_llm_output_len', '4000', '9'

FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'sailor_search_qa_llm_output_len' and "type"='9');


INSERT INTO "configuration"("key","value","type")

SELECT 'search_dip_agent_key', '01KH0FXDT9SKRNKRB59S4PTMF8', '8'

FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'search_dip_agent_key' and "type"='8');




INSERT INTO "configuration"("key", value, "type") SELECT 'diagnosis_completeness_weight', '0.3334', '11' FROM DUAL

WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'diagnosis_completeness_weight' and "type"='11');

INSERT INTO "configuration"("key", value, "type") SELECT 'diagnosis_maturity_weight', '0.3333', '11' FROM DUAL

WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'diagnosis_maturity_weight' and "type"='11');

INSERT INTO "configuration"("key", value, "type") SELECT 'diagnosis_consistency_weight', '0.3333', '11' FROM DUAL

WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'diagnosis_consistency_weight' and "type"='11');



INSERT INTO "configuration"("key", value, "type") SELECT 'diagnosis_business_maturity_weight', '0.3334', '11' FROM DUAL

WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'diagnosis_business_maturity_weight' and "type"='11');

INSERT INTO "configuration"("key", value, "type") SELECT 'diagnosis_system_maturity_weight', '0.3333', '11' FROM DUAL

WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'diagnosis_system_maturity_weight' and "type"='11');

INSERT INTO "configuration"("key", value, "type") SELECT 'diagnosis_data_maturity_weight', '0.3333', '11' FROM DUAL

WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'diagnosis_data_maturity_weight' and "type"='11');




INSERT INTO "configuration"("key", value, "type") SELECT 'diagnosis_standard_consistency_weight', '0.3334', '11' FROM DUAL

WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'diagnosis_standard_consistency_weight' and "type"='11');

INSERT INTO "configuration"("key", value, "type") SELECT 'diagnosis_flowchart_consistency_weight', '0.3333', '11' FROM DUAL

WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'diagnosis_flowchart_consistency_weight' and "type"='11');

INSERT INTO "configuration"("key", value, "type") SELECT 'diagnosis_indicator_consistency_weight', '0.3333', '11' FROM DUAL

WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'diagnosis_indicator_consistency_weight' and "type"='11');




INSERT INTO "configuration"("key", value, "type") SELECT 'diagnosis_business_standardized_weight', '0.3334', '11' FROM DUAL

WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'diagnosis_business_standardized_weight' and "type"='11');

INSERT INTO "configuration"("key", value, "type") SELECT 'diagnosis_flowchart_closed_loop_weight', '0.3333', '11' FROM DUAL

WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'diagnosis_flowchart_closed_loop_weight' and "type"='11');

INSERT INTO "configuration"("key", value, "type") SELECT 'diagnosis_flowchart_redundancy_weight', '0.3333', '11' FROM DUAL

WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'diagnosis_flowchart_redundancy_weight' and "type"='11');




INSERT INTO "configuration"("key", value, "type") SELECT 'diagnosis_business_informatization_weight', '0.3333', '11' FROM DUAL

WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'diagnosis_business_informatization_weight' and "type"='11');

INSERT INTO "configuration"("key", value, "type") SELECT 'diagnosis_data_perfection_weight', '0.3333', '11' FROM DUAL

WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'diagnosis_data_perfection_weight' and "type"='11');

INSERT INTO "configuration"("key", value, "type") SELECT 'diagnosis_data_standardized_weight', '0.3334', '11' FROM DUAL

WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'diagnosis_data_standardized_weight' and "type"='11');



INSERT INTO "configuration"("key","value","type")

SELECT 'sample_data_count', '5', '0'

FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'sample_data_count');

INSERT INTO "configuration"("key","value","type")

SELECT 'sample_data_type', 'synthetic', '0'

FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'sample_data_type');

INSERT INTO "configuration" ("key","value","type")
SELECT 'digital_human', '1', '12'
FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'digital_human' );



CREATE TABLE IF NOT EXISTS "datasource" (
    "data_source_id" BIGINT NOT NULL IDENTITY(1, 1),
    "id" VARCHAR(36 char) NOT NULL,
    "info_system_id" VARCHAR(36 char) DEFAULT NULL,
    "name" VARCHAR(128 char) NOT NULL,
    "catalog_name" VARCHAR(255 char) NOT NULL DEFAULT '',
    "host" VARCHAR(256 char) NOT NULL,
    "port" INT NOT NULL,
    "username" VARCHAR(128 char) NOT NULL,
    "password" VARCHAR(1024 char) NOT NULL,
    "database_name" VARCHAR(128 char) NOT NULL,
    "schema" VARCHAR(128 char) NOT NULL,
    "type_name" VARCHAR(128 char) NOT NULL,
    "source_type" TINYINT DEFAULT 1 NOT NULL,
    "created_at" datetime(3) NOT NULL DEFAULT current_timestamp(3),
    "created_by_uid" VARCHAR(36 char)  DEFAULT NULL,
    "updated_at" datetime(3) NOT NULL DEFAULT current_timestamp(3) ,
    "updated_by_uid" VARCHAR(36 char) DEFAULT NULL,
    "excel_protocol" VARCHAR(128 char),
    "excel_base" VARCHAR(128 char),
    "department_id"  VARCHAR(36 char),
    "enabled"  TINYINT,
    "hua_ao_id"  VARCHAR(256 char),
    "connect_status"  TINYINT DEFAULT 1,
    CLUSTER PRIMARY KEY ("data_source_id")
    );

CREATE UNIQUE INDEX IF NOT EXISTS datasource_uk_datasource ON datasource("info_system_id","name");



CREATE TABLE IF NOT EXISTS "flowchart" (
    "id" VARCHAR(36 char) NOT NULL,
    "name" VARCHAR(128 char) NOT NULL DEFAULT '',
    "description" VARCHAR(255 char) NOT NULL DEFAULT '',
    "edit_status" TINYINT NOT NULL DEFAULT 1,
    "current_version_id" VARCHAR(36 char) NOT NULL DEFAULT '',
    "editing_version_id" VARCHAR(36 char) NOT NULL DEFAULT '',
    "cloned_by_id" VARCHAR(36 char) NOT NULL DEFAULT '',
    "cloned_by_template_id" VARCHAR(36 char) NOT NULL DEFAULT '',
    "created_at" datetime(3) NOT NULL DEFAULT current_timestamp(3),
    "created_by_uid" VARCHAR(36 char) NOT NULL DEFAULT '',
    "updated_at" datetime(3) NOT NULL DEFAULT current_timestamp(3) ,
    "updated_by_uid" VARCHAR(36 char) NOT NULL DEFAULT '',
    "deleted_at" BIGINT NOT NULL DEFAULT 0,
    CLUSTER PRIMARY KEY ("id")
    );



CREATE TABLE IF NOT EXISTS "flowchart_node_config" (
    "id" VARCHAR(36 char) NOT NULL,
    "start_mode" TINYINT NOT NULL DEFAULT 1,
    "completion_mode" TINYINT NOT NULL DEFAULT 1,
    "node_id" VARCHAR(36 char) NOT NULL DEFAULT '',
    "flowchart_version_id" VARCHAR(36 char) NOT NULL DEFAULT '',
    "deleted_at" BIGINT NOT NULL DEFAULT 0,
    CLUSTER PRIMARY KEY ("id")
    );

CREATE INDEX IF NOT EXISTS flowchart_node_config_idx_node_id ON flowchart_node_config("node_id");
CREATE INDEX IF NOT EXISTS flowchart_node_config_idx_flowchart_version_id ON flowchart_node_config("flowchart_version_id");



CREATE TABLE IF NOT EXISTS "flowchart_node_task" (
            "id" VARCHAR(36 char) NOT NULL,
    "name" VARCHAR(128 char) NOT NULL DEFAULT '',
    "completion_mode" TINYINT NOT NULL DEFAULT 1,
    "node_id" VARCHAR(36 char) NOT NULL DEFAULT '',
    "node_unit_id" VARCHAR(40 char) NOT NULL,
    "flowchart_version_id" VARCHAR(36 char) NOT NULL DEFAULT '',
    "task_type" INT NOT NULL DEFAULT 1,
    "work_order_type" INT NOT NULL DEFAULT 0,
    "deleted_at" BIGINT NOT NULL DEFAULT 0,
    CLUSTER PRIMARY KEY ("id")
    );

CREATE INDEX IF NOT EXISTS flowchart_node_task_idx_flowchart_version_id_node_unit_id ON flowchart_node_task("flowchart_version_id","node_unit_id");



CREATE TABLE IF NOT EXISTS "flowchart_unit" (
       "id" VARCHAR(36 char) NOT NULL,
    "unit_type" TINYINT NOT NULL,
    "unit_id" VARCHAR(40 char) NOT NULL,
    "name" VARCHAR(128 char) NOT NULL DEFAULT '',
    "description" VARCHAR(255 char) NOT NULL DEFAULT '',
    "parent_id" VARCHAR(36 char) NOT NULL DEFAULT '',
    "parent_unit_id" VARCHAR(40 char) NOT NULL DEFAULT '',
    "source_id" VARCHAR(36 char) NOT NULL DEFAULT '',
    "source_unit_id" VARCHAR(40 char) NOT NULL DEFAULT '',
    "target_id" VARCHAR(36 char) NOT NULL DEFAULT '',
    "target_unit_id" VARCHAR(40 char) NOT NULL DEFAULT '',
    "unit_order" INT NOT NULL DEFAULT 0,
    "flowchart_version_id" VARCHAR(36 char) NOT NULL DEFAULT '',
    "deleted_at" BIGINT NOT NULL DEFAULT 0,
    CLUSTER PRIMARY KEY ("id")
    );

CREATE INDEX IF NOT EXISTS flowchart_unit_idx_flowchart_version_id_unit_id_unit_type ON flowchart_unit("flowchart_version_id","unit_id","unit_type");



CREATE TABLE IF NOT EXISTS "flowchart_version" (
          "id" VARCHAR(36 char) NOT NULL,
    "name" VARCHAR(32 char) NOT NULL DEFAULT '',
    "version" INT NOT NULL DEFAULT 1,
    "edit_status" TINYINT NOT NULL DEFAULT 1,
    "image" text DEFAULT NULL,
    "flowchart_id" VARCHAR(36 char) NOT NULL DEFAULT '',
    "draw_properties" text DEFAULT NULL,
    "created_at" datetime(3) NOT NULL DEFAULT current_timestamp(3),
    "created_by_uid" VARCHAR(36 char) NOT NULL DEFAULT '',
    "updated_at" datetime(3) NOT NULL DEFAULT current_timestamp(3) ,
    "updated_by_uid" VARCHAR(36 char) NOT NULL DEFAULT '',
    "deleted_at" BIGINT NOT NULL DEFAULT 0,
    CLUSTER PRIMARY KEY ("id")
    );

CREATE INDEX IF NOT EXISTS flowchart_version_idx_flowchart_id_edit_status ON flowchart_version("flowchart_id","edit_status");



CREATE TABLE IF NOT EXISTS "mq_message" (
   "id" VARCHAR(36 char) NOT NULL,
    "topic" VARCHAR(255 char) NOT NULL,
    "message" text NOT NULL,
    "created_at" datetime(3) NOT NULL DEFAULT current_timestamp(3),
    "updated_at" datetime(3) NOT NULL DEFAULT current_timestamp(3) ,
    CLUSTER PRIMARY KEY ("id")
    );



CREATE TABLE IF NOT EXISTS "object" (
    "id" VARCHAR(36 char) NOT NULL,
    "name" VARCHAR(255 char) NOT NULL,
    "path_id" text NOT NULL,
    "path" text NOT NULL,
    "type" TINYINT DEFAULT NULL,
    "attribute" text DEFAULT NULL,
    "f_priority"  INT  NULL   ,
    "is_register" INT default 1 ,
    "register_at" DATETIME(3) NULL ,
    "dept_tag" VARCHAR(255 char) ,
    "f_third_dept_id"  VARCHAR(36 char)  NULL  ,
    "created_at" datetime(3) NOT NULL DEFAULT current_timestamp(3),
    "updated_at" datetime(3) NOT NULL DEFAULT current_timestamp(3) ,
    "deleted_at" BIGINT NOT NULL DEFAULT 0,
    CLUSTER PRIMARY KEY ("id")
);

-- CREATE INDEX IF NOT EXISTS object_idx_path_id ON object("path_id", 500);

CREATE TABLE IF NOT EXISTS "resource" (
    "id" BIGINT IDENTITY(1,1) NOT NULL,
    "role_id" VARCHAR(36 char) NOT NULL,
    "type" TINYINT NOT NULL,
    "sub_type" TINYINT NOT NULL,
    "value" INT NOT NULL,
    CLUSTER PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS idx_resource_role_id ON resource("role_id");
CREATE INDEX IF NOT EXISTS idx_resource_type ON resource("type");



CREATE TABLE IF NOT EXISTS "system_role" (
    "id" VARCHAR(36 char) NOT NULL,
    "name" VARCHAR(128 char) NOT NULL,
    "description" VARCHAR(300 char) DEFAULT NULL,
    "color" VARCHAR(8 char) DEFAULT NULL,
    "icon" VARCHAR(255 char) DEFAULT NULL,
    "type" VARCHAR(64 char) NOT NULL,
    "scope" VARCHAR(63 char) NOT NULL,
    "system" TINYINT  NOT NULL DEFAULT 0,
    "created_at" datetime(3) NOT NULL DEFAULT current_timestamp(3),
    "created_by" VARCHAR(36 char) NOT NULL,
    "updated_at" datetime(3) NOT NULL DEFAULT current_timestamp(3) ,
    "updated_by" VARCHAR(36 char) DEFAULT NULL,
    "deleted_at" BIGINT NOT NULL DEFAULT 0,
    CLUSTER PRIMARY KEY ("id")
    );



INSERT INTO "system_role"("id","name","color","icon","type","scope","system","created_at","updated_at","deleted_at","description","created_by","updated_by")

SELECT'0000663b-46a9-45e4-b6f7-a6bd8c18bd46', '普通用户', '#5B91FF', 'normal',  'Internal','All','1', '2021-07-22 16:51:50.582', '2021-07-22 16:51:50.582', '0',null,'266c6a42-6131-4d62-8f39-853e7093701c','266c6a42-6131-4d62-8f39-853e7093701c'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "system_role" WHERE "id" = '0000663b-46a9-45e4-b6f7-a6bd8c18bd46');


INSERT INTO "system_role"("id","name","color","icon","type","scope","system","created_at","updated_at","deleted_at","description","created_by","updated_by")

SELECT'00005871-cedd-4216-bde0-94ced210e898', '数据开发工程师', '#FF822F', 'data-development-engineer', 'Internal','All','1', '2021-07-22 16:51:50.582', '2021-07-22 16:51:50.582', '0',null,'266c6a42-6131-4d62-8f39-853e7093701c','266c6a42-6131-4d62-8f39-853e7093701c'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "system_role" WHERE "id" = '00005871-cedd-4216-bde0-94ced210e898');


INSERT INTO "system_role"("id","name","color","icon","type","scope","system","created_at","updated_at","deleted_at","description","created_by","updated_by")

SELECT'00004606-f318-450f-bc53-f0720b27acff', '数据运营工程师', '#FFBA30', 'data-operation-engineer', 'Internal','All','1', '2021-07-22 16:51:50.582', '2021-07-22 16:51:50.582', '0',null,'266c6a42-6131-4d62-8f39-853e7093701c','266c6a42-6131-4d62-8f39-853e7093701c'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "system_role" WHERE "id" = '00004606-f318-450f-bc53-f0720b27acff');


INSERT INTO "system_role"("id","name","color","icon","type","scope","system","created_at","updated_at","deleted_at","description","created_by","updated_by")

SELECT'00003148-fbbf-4879-988d-54af7c98c7ed', '数据管家', '#3AC4FF', 'data-butler', 'Internal','All','1', '2021-07-22 16:51:50.582', '2021-07-22 16:51:50.582', '0',null,'266c6a42-6131-4d62-8f39-853e7093701c','266c6a42-6131-4d62-8f39-853e7093701c'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "system_role" WHERE "id" = '00003148-fbbf-4879-988d-54af7c98c7ed');


INSERT INTO "system_role"("id","name","color","icon","type","scope","system","created_at","updated_at","deleted_at","description","created_by","updated_by")

SELECT'00002fb7-1e54-4ce1-bc02-626cb1f85f62', '数据Owner', '#14CEAA', 'data-owner', 'Internal','All','1', '2021-07-22 16:51:50.582', '2021-07-22 16:51:50.582', '0',null,'266c6a42-6131-4d62-8f39-853e7093701c','266c6a42-6131-4d62-8f39-853e7093701c'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "system_role" WHERE "id" = '00002fb7-1e54-4ce1-bc02-626cb1f85f62');


INSERT INTO "system_role"("id","name","color","icon","type","scope","system","created_at","updated_at","deleted_at","description","created_by","updated_by")

SELECT'00007030-4e75-4c5e-aa56-f1bdf7044791', '应用开发者', '#F25DCB', 'application-developer',  'Internal','All','1', '2021-07-22 16:51:50.582', '2021-07-22 16:51:50.582', '0',null,'266c6a42-6131-4d62-8f39-853e7093701c','266c6a42-6131-4d62-8f39-853e7093701c'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "system_role" WHERE "id" = '00007030-4e75-4c5e-aa56-f1bdf7044791');


INSERT INTO "system_role"("id","name","color","icon","type","scope","system","created_at","updated_at","deleted_at","description","created_by","updated_by")

SELECT '00001f64-209f-4260-91f8-c61c6f820136', '系统管理员', '#8C7BEB', 'tc-system-mgm', 'Internal','All','1', '2021-07-22 16:51:50.582', '2021-07-22 16:51:50.582', '0',null,'266c6a42-6131-4d62-8f39-853e7093701c','266c6a42-6131-4d62-8f39-853e7093701c'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "system_role" WHERE "id" = '00001f64-209f-4260-91f8-c61c6f820136');



INSERT INTO "system_role"("id","name","color","icon","type","scope","system","created_at","updated_at","deleted_at","description","created_by","updated_by")

SELECT '00008516-45b3-44c9-9188-ca656969e20f', '安全管理员', '#F25D5D', 'security-mgm',  'Internal','All','1', '2021-07-22 16:51:50.582', '2021-07-22 16:51:50.582', '0',null,'266c6a42-6131-4d62-8f39-853e7093701c','266c6a42-6131-4d62-8f39-853e7093701c'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "system_role" WHERE "id" = '00008516-45b3-44c9-9188-ca656969e20f');



INSERT INTO "system_role"("id","name","color","icon","type","scope","system","created_at","updated_at","deleted_at","description","created_by","updated_by")

SELECT '00108516-45b3-44c9-9188-ca656969e20g', '门户管理员', '#6A81FF', 'protol-mgm',  'Internal','All','1', '2021-07-22 16:51:50.582', '2021-07-22 16:51:50.582', '0',null,'266c6a42-6131-4d62-8f39-853e7093701c','266c6a42-6131-4d62-8f39-853e7093701c'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "system_role" WHERE "id" = '00108516-45b3-44c9-9188-ca656969e20g');


CREATE TABLE IF NOT EXISTS "user" (
    "id" VARCHAR(36 char) NOT NULL ,
    "name" VARCHAR(255 char) DEFAULT NULL,
    "status" TINYINT  NOT NULL DEFAULT 1,
    "user_type" TINYINT NOT NULL DEFAULT 1,
    "phone_number" VARCHAR(20 char) DEFAULT NULL,
    "mail_address" VARCHAR(128 char) DEFAULT NULL,
    "login_name" VARCHAR(255 char) DEFAULT NULL,
    "scope" VARCHAR(64 char) NOT NULL DEFAULT 'CurrentDepartment',
    "is_registered" INT default 0 ,
    "register_at" DATETIME(3)  NULL ,
    "third_service_id" VARCHAR(36 char)  NULL ,
    "f_third_user_id"  VARCHAR(36 char)  NULL  ,
    "updated_at" datetime(3) NOT NULL DEFAULT current_timestamp(3) ,
    "updated_by" VARCHAR(36 char) DEFAULT NULL,
    "sex" varchar(1 char) NULL,
    CLUSTER PRIMARY KEY ("id")
);



CREATE TABLE IF NOT EXISTS "user_roles" (
     "id" VARCHAR(36 char) NOT NULL,
    "user_id" VARCHAR(36 char) NOT NULL,
    "role_id" VARCHAR(36 char) NOT NULL,
    "created_at" datetime(3) NOT NULL DEFAULT current_timestamp(3),
    CLUSTER PRIMARY KEY ("user_id","role_id")
);



CREATE TABLE IF NOT EXISTS "info_system" (
    "info_ststem_id" BIGINT NOT NULL IDENTITY(1,1),
    "id" VARCHAR(36 char) NOT NULL,
    "name" VARCHAR(255 char) NOT NULL,
    "description" VARCHAR(300 char) DEFAULT NULL,
    "department_id" VARCHAR(36 char) NOT NULL,
    "acceptance_at" BIGINT  NOT NULL DEFAULT 0,
    "is_register_gateway" TINYINT DEFAULT 0,
    "system_identifier" VARCHAR(36 char) DEFAULT NULL,
    "register_at" datetime(3) DEFAULT NULL,
    "created_at" datetime(0) NOT NULL default CURRENT_TIMESTAMP(3),
    "created_by_uid" VARCHAR(36 char) NOT NULL,
    "updated_at" datetime(0) NOT NULL default CURRENT_TIMESTAMP(3),
    "updated_by_uid" VARCHAR(36 char) NOT NULL,
    "deleted_at" BIGINT NOT NULL,
    "js_department_id" VARCHAR(36 char)  NULL ,
    "status" TINYINT NULL DEFAULT 0 ,
    CLUSTER PRIMARY KEY ("info_ststem_id")
 );




CREATE TABLE IF NOT EXISTS "code_generation_rules" (
    "snowflake_id"              BIGINT  NOT NULL ,
    "id"                        VARCHAR(36 char)    NOT NULL,
    "name"                      VARCHAR(255 char)    NOT NULL,
    "type"                      VARCHAR(255 char)    NOT NULL,
    "prefix"                    VARCHAR(8 char)         NOT NULL,
    "prefix_enabled"            BIT         NOT NULL,
    "rule_code"                 VARCHAR(255 char)    NOT NULL,
    "rule_code_enabled"         BIT         NOT NULL,
    "code_separator"            VARCHAR(255 char)    NOT NULL,
    "code_separator_enabled"    BIT         NOT NULL,
    "digital_code_type"         VARCHAR(255 char)    NOT NULL,
    "digital_code_width"        INTEGER         NOT NULL,
    "digital_code_starting"     INTEGER         NOT NULL,
    "digital_code_ending"       INTEGER         NOT NULL,
    "updater_id"    VARCHAR(36 char)        NOT NULL,
    "created_at"    DATETIME(3) NOT NULL  DEFAULT CURRENT_TIMESTAMP(3),
    "updated_at"    DATETIME(3) NOT NULL  DEFAULT CURRENT_TIMESTAMP(3),
    "deleted_at"    BIGINT  NOT NULL  DEFAULT 0,
    CLUSTER PRIMARY KEY("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS code_generation_rules_idx_code_generation_rules_id_deleted_at ON code_generation_rules("id", "deleted_at");
CREATE UNIQUE INDEX IF NOT EXISTS code_generation_rules_idx_code_generation_rules_name_deleted_at ON code_generation_rules("name", "deleted_at");
CREATE INDEX IF NOT EXISTS code_generation_rules_idx_code_generation_rules_deleted_at ON code_generation_rules("deleted_at");

INSERT INTO "code_generation_rules" ("snowflake_id", "id", "name", "type", "prefix", "prefix_enabled", "rule_code",  "rule_code_enabled", "code_separator", "code_separator_enabled", "digital_code_type", "digital_code_width", "digital_code_starting", "digital_code_ending", "updater_id", "created_at", "updated_at", "deleted_at")
select 550436800397747979, '64ee8dac-1992-88ff-69b9-1798dd6b9235', '数据分析', 'DataAnalRequire', 'SJFX', 1, 'YYYYMMDD', 1, '/', 1, 'Sequence', 6, 1, 999999, '00000000-0000-0000-0000-000000000000', '2025-04-11 14:58:19.595', '2025-04-11 14:58:19.595', 0
from DUAL WHERE NOT EXISTS(select id from "code_generation_rules" where id='64ee8dac-1992-88ff-69b9-1798dd6b9235');




CREATE TABLE IF NOT EXISTS "sequence_code_generation_statuses" (
    "snowflake_id"  BIGINT  NOT NULL ,
    "id"                   VARCHAR(36 char)    NOT NULL  DEFAULT SYS_GUID(),
    "rule_id"               VARCHAR(36 char)        NOT NULL,
    "prefix"                VARCHAR(8 char)         NOT NULL,
    "rule_code"             VARCHAR(255 char)    NOT NULL,
    "code_separator"        VARCHAR(255 char)    NOT NULL,
    "digital_code_width"    INTEGER         NOT NULL,
    "digital_code"  INTEGER NOT NULL,
    "created_at"    DATETIME(3) NOT NULL  DEFAULT CURRENT_TIMESTAMP(3),
    "updated_at"    DATETIME(3) NOT NULL  DEFAULT CURRENT_TIMESTAMP(3),
    "deleted_at"    BIGINT  NOT NULL  DEFAULT 0,
    CLUSTER PRIMARY KEY("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS sequence_code_generation_statuses_idx_sequence_code_generation_statuses_id_deleted_at ON sequence_code_generation_statuses("id", "deleted_at");
CREATE UNIQUE INDEX IF NOT EXISTS sequence_code_generation_statuses_idx_sequence_code_generation_statuses_all_prefix ON sequence_code_generation_statuses("rule_id", "prefix", "rule_code", "code_separator", "digital_code_width");
CREATE INDEX IF NOT EXISTS sequence_code_generation_statuses_idx_sequence_code_generation_statuses_deleted_at ON sequence_code_generation_statuses("deleted_at");




CREATE TABLE IF NOT EXISTS "data_grade"
(
    id             BIGINT           not null  IDENTITY(1, 1),
    parent_id      VARCHAR(36 char)    default '0'      null,
    name           VARCHAR(255 char)                             not null,
    sort_weight    BIGINT                           null,
    node_type      INT                                      null,
    icon           VARCHAR(100 char)                             null,
    description    VARCHAR(300 char)                             null,
    sensitive_attri VARCHAR(20 char) null,
    secret_attri VARCHAR(20 char) null,
    share_condition VARCHAR(20 char) null,
    data_protection_query BIT  not null default 0,
    created_at     datetime(3) default current_timestamp(3) not null,
    created_by_uid VARCHAR(36 char)                                 null,
    updated_at     datetime(3) default current_timestamp(3) not null ,
    updated_by_uid VARCHAR(36 char)                                 null,
    deleted_at     BIGINT      default 0                    not null,
    CLUSTER PRIMARY KEY("id")
) ;
set IDENTITY_INSERT "data_grade" ON;
INSERT INTO "data_grade"(id, parent_id, name, sort_weight, node_type, icon, description, created_at, created_by_uid, updated_at, updated_by_uid, deleted_at)
SELECT 1, '0', 'top', null, 2, '', '', '2024-05-11 11:04:15.613', '111111', '2024-05-13 11:23:23.805', '111111', 0
FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "data_grade" WHERE "id" = '1');

INSERT INTO "configuration"("key","value","type")

SELECT 'data_grade_label', 'close', '7'

FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'data_grade_label');




CREATE TABLE IF NOT EXISTS  "audit_process_bind" (
    "id" BIGINT  NOT NULL  IDENTITY(1, 1),
    "audit_type" VARCHAR(50 char) NOT NULL,
    "proc_def_key" VARCHAR(128 char) NOT NULL,
    "service_type" VARCHAR(128 char) DEFAULT NULL,
    "create_time" datetime(0) NOT NULL DEFAULT current_timestamp(),
    "created_by_uid" VARCHAR(50 char) NOT NULL,
    "update_time" datetime(0) NOT NULL DEFAULT current_timestamp(),
    "updated_by_uid" VARCHAR(50 char) DEFAULT NULL,
    CLUSTER PRIMARY KEY ("id")
    );

CREATE UNIQUE INDEX IF NOT EXISTS audit_process_bind_audit_process_bind_unique ON audit_process_bind("audit_type");
CREATE INDEX IF NOT EXISTS audit_process_bind_audit_process_bind_audit_type_IDX ON audit_process_bind("audit_type");




CREATE TABLE IF NOT EXISTS  "cdc_task" (
  "database" VARCHAR(255 char) NOT NULL,
    "table" VARCHAR(255 char) NOT NULL,
    "columns" VARCHAR(255 char) NOT NULL,
    "topic" VARCHAR(255 char) NOT NULL,
    "group_id" VARCHAR(255 char) NOT NULL,
    "id" VARCHAR(255 char) NOT NULL,
    "updated_at" datetime(3) NOT NULL,
    CLUSTER PRIMARY KEY ("id")
);





CREATE TABLE IF NOT EXISTS  "app" (
    "id" BIGINT  NOT NULL  IDENTITY(1, 1),
    "apps_id" VARCHAR(36 char) NOT NULL DEFAULT SYS_GUID(),
    "published_version_id" BIGINT  NOT NULL,
    "editing_version_id" BIGINT  DEFAULT NULL,
    "report_published_version_id" BIGINT  DEFAULT NULL,
    "report_editing_version_id" BIGINT  DEFAULT NULL,
    "mark" VARCHAR(10 char) NOT NULL DEFAULT 'common',
    "created_at" datetime(3) NOT NULL  DEFAULT current_timestamp(3),
    "creator_uid" VARCHAR(36 char) NOT NULL,
    "creator_name" VARCHAR(255 char) DEFAULT NULL,
    "updated_at" datetime(3) NOT NULL DEFAULT current_timestamp(3),
    "updater_uid" VARCHAR(36 char) NOT NULL,
    "updater_name" VARCHAR(255 char) DEFAULT NULL,
    "deleted_at"  BIGINT NOT NULL DEFAULT 0,
    CLUSTER PRIMARY KEY ("id")
);




CREATE TABLE IF NOT EXISTS  "app_history" (
    "id" BIGINT  NOT NULL  IDENTITY(1, 1),
    "app_id" BIGINT  NOT NULL,
    "name" VARCHAR(128 char) NOT NULL,
    "description" VARCHAR(300 char) DEFAULT NULL,
    "info_system" VARCHAR(36 char)  DEFAULT NULL,
    "application_developer_id" VARCHAR(36 char) NOT NULL,
    "pass_id" VARCHAR(128 char)  DEFAULT NULL,
    "token" VARCHAR(36 char)  DEFAULT NULL,
    "app_type" VARCHAR(36 char)  DEFAULT NULL,
    "ip_addr" text DEFAULT NULL,
    "is_register_gateway" TINYINT DEFAULT 0,
    "register_at" datetime(3) DEFAULT NULL,
    "account_id" VARCHAR(36 char) DEFAULT NULL,
    "account_name" VARCHAR(255 char) DEFAULT NULL,
    "account_passowrd" VARCHAR(1028 char) DEFAULT NULL,
    "province_app_id" VARCHAR(300 char) DEFAULT NULL,
    "access_key" VARCHAR(300 char) DEFAULT NULL,
    "access_secret" VARCHAR(300 char) DEFAULT NULL,
    "province_ip" VARCHAR(36 char) DEFAULT NULL,
    "province_url" VARCHAR(300 char) DEFAULT NULL,
    "contact_name" VARCHAR(100 char) DEFAULT NULL,
    "contact_phone" VARCHAR(50 char) DEFAULT NULL,
    "area_id" VARCHAR(64 char)  DEFAULT NULL,
    "range_id" VARCHAR(64 char) DEFAULT NULL,
    "department_id" VARCHAR(36 char)  DEFAULT NULL,
    "org_code" VARCHAR(64 char) DEFAULT NULL,
    "deploy_place" VARCHAR(100 char) DEFAULT '',
    "status" TINYINT DEFAULT NULL,
    "reject_reason" VARCHAR(300 char) DEFAULT NULL,
    "cancel_reason" VARCHAR(300 char) DEFAULT NULL,
    "audit_id" BIGINT DEFAULT NULL,
    "audit_proc_inst_id" VARCHAR(64 char) DEFAULT NULL,
    "audit_result" VARCHAR(64 char) DEFAULT NULL,
    "report_audit_status" TINYINT DEFAULT NULL,
    "report_reject_reason" VARCHAR(300 char) DEFAULT NULL,
    "report_cancel_reason" VARCHAR(300 char) DEFAULT NULL,
    "report_audit_id" BIGINT DEFAULT NULL,
    "report_audit_proc_inst_id" VARCHAR(64 char) DEFAULT NULL,
    "report_audit_result" VARCHAR(64 char) DEFAULT NULL,
    "report_status" TINYINT DEFAULT NULL,
    "province_id" BIGINT  DEFAULT NULL,
    "reported_at" datetime(3) DEFAULT NULL,
    "updated_at" datetime(3) NOT NULL DEFAULT current_timestamp(3),
    "updater_uid" VARCHAR(36 char) NOT NULL,
    "updater_name" VARCHAR(255 char) DEFAULT NULL,
    "deleted_at"  BIGINT NOT NULL DEFAULT 0,
    CLUSTER PRIMARY KEY ("id")
    );



CREATE TABLE IF NOT EXISTS "t_dict" (
    "id" BIGINT NOT NULL  IDENTITY(1, 1),
    "f_type" VARCHAR(100 char)  NOT NULL,
    "name" VARCHAR(128 char) NOT NULL,
    "f_description" VARCHAR(512 char)  DEFAULT NULL,
    "f_version" VARCHAR(10 char)  default 'V1.0.0'  not null,
    "created_at" datetime(0) NOT NULL,
    "creator_uid" VARCHAR(36 char) DEFAULT NULL,
    "creator_name" VARCHAR(255 char) DEFAULT NULL,
    "updated_at" datetime(0) DEFAULT NULL,
    "updater_uid" VARCHAR(36 char) DEFAULT NULL,
    "updater_name" VARCHAR(255 char) DEFAULT NULL,
    "deleted_at"    BIGINT  default 0  not null,
    "sszd_flag"    SMALLINT  default 1  not null,
    CLUSTER PRIMARY KEY ("id")
    );

CREATE INDEX IF NOT EXISTS t_dict_dict_type_index ON t_dict("f_type");

set IDENTITY_INSERT "t_dict" ON;
insert into "t_dict" ("id","f_type","name","f_description","created_at","updated_at","sszd_flag")
select 43,'catalog-feedback-type','目录反馈类型','应用于目录反馈的反馈类型字段','2024-12-17 14:28:55','2024-12-17 14:28:55',0
from dual where not exists (select "id" from t_dict where "id" = 43);

insert into "t_dict" ("id","f_type","name","f_description","created_at","updated_at","sszd_flag")
select 45,'business-matters-type','业务事项类型','应用于目录业务事项字段','2024-12-17 14:28:55','2024-12-17 14:28:55',0
from dual where not exists (select "id" from t_dict where "id" = 45);


CREATE TABLE IF NOT EXISTS "t_dict_item" (
    "id" BIGINT NOT NULL IDENTITY(1, 1),
    "dict_id" BIGINT NOT NULL,
    "f_type" VARCHAR(100 char) NOT NULL,
    "f_key" VARCHAR(64 char) NOT NULL,
    "f_value" VARCHAR(100 char) NOT NULL,
    "f_description" VARCHAR(512 char) DEFAULT NULL,
    "f_sort" INT NOT NULL DEFAULT '0',
    "created_at" datetime(0) NOT NULL,
    "creator_uid" VARCHAR(36 char) DEFAULT NULL,
    "creator_name" VARCHAR(255 char) DEFAULT NULL,
    CLUSTER PRIMARY KEY ("id")
    );

CREATE INDEX IF NOT EXISTS t_dict_item_dict_id_index ON t_dict_item("dict_id");
CREATE INDEX IF NOT EXISTS t_dict_item_dict_type_index ON t_dict_item("f_type");

set IDENTITY_INSERT "t_dict_item" ON;

insert into "t_dict_item" ("id","f_type","f_key","f_value","f_description","created_at","dict_id","f_sort") select 447,'catalog-feedback-type','1','目录信息错误',null,'2024-12-17 14:28:55',43,1    from dual where not exists (select "id" from t_dict_item where "id" = 447);
insert into "t_dict_item" ("id","f_type","f_key","f_value","f_description","created_at","dict_id","f_sort") select 448,'catalog-feedback-type','2','数据质量问题',null,'2024-12-17 14:28:55',43,2    from dual where not exists (select "id" from t_dict_item where "id" = 448);
insert into "t_dict_item" ("id","f_type","f_key","f_value","f_description","created_at","dict_id","f_sort") select 449,'catalog-feedback-type','3','挂接资源和目录不一致',null,'2024-12-17 14:28:55',43,3    from dual where not exists (select "id" from t_dict_item where "id" = 449);
insert into "t_dict_item" ("id","f_type","f_key","f_value","f_description","created_at","dict_id","f_sort") select 450,'catalog-feedback-type','4','接口问题',null,'2024-12-17 14:28:55',43,4    from dual where not exists (select "id" from t_dict_item where "id" = 450);
insert into "t_dict_item" ("id","f_type","f_key","f_value","f_description","created_at","dict_id","f_sort") select 451,'catalog-feedback-type','5','其他',null,'2024-12-17 14:28:55',43,5    from dual where not exists (select "id" from t_dict_item where "id" = 451);

insert into "t_dict_item" ("id","f_type","f_key","f_value","f_description","created_at","dict_id","f_sort")
select 455,'business-matters-type','111','行政确认','行政确认的描述','2024-12-17 14:28:55',45,0
from dual where not exists (select "id" from t_dict_item where "id" = 455);

insert into "t_dict_item" ("id","f_type","f_key","f_value","f_description","created_at","dict_id","f_sort")
select 456,'business-matters-type','222','行政奖励','行政奖励的描述','2024-12-17 14:28:55',45,1
from dual where not exists (select "id" from t_dict_item where "id" = 456);

insert into "t_dict_item" ("id","f_type","f_key","f_value","f_description","created_at","dict_id","f_sort")
select 457,'business-matters-type','333','其他','其他','2024-12-17 14:28:55',45,1
from dual where not exists (select "id" from t_dict_item where "id" = 457);



CREATE TABLE IF NOT EXISTS "t_firm" (
    "id" BIGINT NOT NULL  IDENTITY(1, 1),
    "name" VARCHAR(128 char)  NOT NULL ,
    "uniform_code" VARCHAR(18 char) NOT NULL ,
    "legal_represent" VARCHAR(128 char) NOT NULL,
    "contact_phone" VARCHAR(20 char) NOT NULL,
    "created_at" DATETIME(3) NOT NULL,
    "created_by" VARCHAR(36 char) NOT NULL,
    "updated_at" DATETIME(3) DEFAULT NULL,
    "updated_by" VARCHAR(36 char) DEFAULT NULL,
    "deleted_at" DATETIME(3) DEFAULT NULL,
    "deleted_by" VARCHAR(36 char) DEFAULT NULL,
    CLUSTER PRIMARY KEY ("id")
);


CREATE TABLE IF NOT EXISTS "t_firm_history" (
                                        "id" BIGINT NOT NULL  IDENTITY(1, 1),
    "name" VARCHAR(128 char)  NOT NULL ,
    "uniform_code" VARCHAR(18 char) NOT NULL ,
    "legal_represent" VARCHAR(128 char) NOT NULL,
    "contact_phone" VARCHAR(20 char) NOT NULL,
    "created_at" DATETIME(3) NOT NULL,
    "created_by" VARCHAR(36 char) NOT NULL,
    "updated_at" DATETIME(3) DEFAULT NULL,
    "updated_by" VARCHAR(36 char) DEFAULT NULL,
    "deleted_at" DATETIME(3) DEFAULT NULL,
    "deleted_by" VARCHAR(36 char) DEFAULT NULL,
    CLUSTER PRIMARY KEY ("id")
    );


CREATE TABLE IF NOT EXISTS "front_end_processors" (
    "id"                    VARCHAR(36 char)        NOT NULL,
    "order_id"              VARCHAR(32 char)     NOT NULL ,
    "creator_id"            VARCHAR(36 char)        NOT NULL,
    "updater_id"            VARCHAR(36 char)        NULL        DEFAULT NULL,
    "requester_id"          VARCHAR(36 char)        NULL        DEFAULT NULL,
    "recipient_id"          VARCHAR(36 char)        NULL        DEFAULT NULL,
    "creation_timestamp"    DATETIME(3)     NOT NULL    DEFAULT current_timestamp(3),
    "update_timestamp"      DATETIME(3)     NULL        DEFAULT NULL,
    "request_timestamp"     DATETIME(3)     NULL        DEFAULT NULL,
    "allocation_timestamp"  DATETIME(3)     NULL        DEFAULT NULL,
    "receipt_timestamp"     DATETIME(3)     NULL        DEFAULT NULL,
    "reclaim_timestamp"     DATETIME(3)     NULL        DEFAULT NULL,
    "deletion_timestamp"    DATETIME(3)     NULL        DEFAULT NULL,
    "department_id"         VARCHAR(36 char)        NOT NULL,
    "department_address"    VARCHAR(300 char)    NOT NULL,
    "contact_name"          VARCHAR(128 char)    NOT NULL,
    "contact_phone"         VARCHAR(20 char)     NULL        DEFAULT NULL,
    "contact_mobile"        VARCHAR(20 char)     NULL        DEFAULT NULL,
    "contact_mail"          VARCHAR(128 char)    NULL        DEFAULT NULL,
    "comment"               VARCHAR(800 char)    NULL        DEFAULT NULL,
    "is_draft"              TINYINT      NOT NULL    DEFAULT 0,
    "node_ip"               VARCHAR(256 char)    NULL        DEFAULT NULL,
    "node_port"             INT         NULL        DEFAULT NULL,
    "node_name"             VARCHAR(128 char)    NULL        DEFAULT NULL,
    "administrator_name"    VARCHAR(255 char)    NULL        DEFAULT NULL,
    "administrator_phone"   VARCHAR(20 char)     NULL        DEFAULT NULL,
    "phase"                 INT         NOT NULL,
    "apply_id"              VARCHAR(36 char)        NULL        DEFAULT NULL,
    "administrator_fax" VARCHAR(255 char) DEFAULT NULL  ,
    "administrator_email" VARCHAR(255 char) DEFAULT NULL  ,
    "deployment_area" VARCHAR(255 char) DEFAULT NULL   ,
    "deployment_system" VARCHAR(256 char) DEFAULT NULL  ,
    "protection_level" VARCHAR(20 char) DEFAULT NULL  ,
    "reject_reason" VARCHAR(300 char)   ,
    "apply_type" VARCHAR(20 char) DEFAULT NULL  ,
    CLUSTER PRIMARY KEY     ("id")
);

CREATE TABLE IF NOT EXISTS "menu"
(
    "id"   BIGINT IDENTITY(1,1) NOT NULL,
    "platform" INT NOT NULL,
    "value"  text NOT NULL,
    CLUSTER PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "t_address_book" (
    "id" BIGINT NOT NULL  IDENTITY(1, 1),
    "name" VARCHAR(128 char)  NOT NULL,
    "department_id" VARCHAR(36 char) DEFAULT NULL,
    "contact_phone" VARCHAR(20 char) NOT NULL,
    "contact_mail" VARCHAR(128 char) NULL DEFAULT NULL,
    "created_at" DATETIME(3) NOT NULL,
    "created_by" VARCHAR(36 char) NOT NULL,
    "updated_at" DATETIME(3) DEFAULT NULL,
    "updated_by" VARCHAR(36 char) DEFAULT NULL,
    "deleted_at" DATETIME(3) DEFAULT NULL,
    "deleted_by" VARCHAR(36 char) DEFAULT NULL,
    CLUSTER PRIMARY KEY ("id")
);



CREATE TABLE IF NOT EXISTS "t_object_subtype" (
    "id" VARCHAR(36 char) NOT NULL,
    "subtype" TINYINT DEFAULT NULL,
    "created_at" DATETIME(3) NOT NULL,
    "created_by" VARCHAR(36 char) NOT NULL,
    "updated_at" DATETIME(3) DEFAULT NULL,
    "updated_by" VARCHAR(36 char) DEFAULT NULL,
    "deleted_at" DATETIME(3) DEFAULT NULL,
    "deleted_by" VARCHAR(36 char) DEFAULT NULL,
    "main_dept_type" TINYINT DEFAULT NULL,
    CLUSTER PRIMARY KEY ("id")
);



CREATE TABLE IF NOT EXISTS "t_object_main_business" (
    "id" BIGINT NOT NULL   IDENTITY(1, 1),
    "object_id" VARCHAR(36 char) NOT NULL,
    "name" VARCHAR(128 char)  NOT NULL,
    "abbreviation_name" VARCHAR(128 char)  NOT NULL,
    "created_at" DATETIME(3) NOT NULL,
    "created_by" VARCHAR(36 char) NOT NULL,
    "updated_at" DATETIME(3) DEFAULT NULL,
    "updated_by" VARCHAR(36 char) DEFAULT NULL,
    "deleted_at" DATETIME(3) DEFAULT NULL,
    "deleted_by" VARCHAR(36 char) DEFAULT NULL,
    CLUSTER PRIMARY KEY ("id")
    );



CREATE TABLE IF NOT EXISTS "t_alarm_rule" (
     "id" BIGINT NOT NULL  IDENTITY(1, 1),
     "type" VARCHAR(255 char)  NOT NULL ,
    "deadline_time" BIGINT NOT NULL,
    "deadline_reminder" VARCHAR(255 char) NOT NULL,
    "beforehand_time" BIGINT NOT NULL,
    "beforehand_reminder" VARCHAR(255 char) NOT NULL,
    "updated_at" DATETIME(3) DEFAULT NULL,
    "updated_by" VARCHAR(36 char) DEFAULT NULL,
    CLUSTER PRIMARY KEY ("id")
);

set IDENTITY_INSERT "t_alarm_rule" ON;
INSERT INTO "t_alarm_rule" ("id","type","deadline_time","deadline_reminder","beforehand_time","beforehand_reminder", "updated_at", "updated_by")

select 1, 'data_quality', 30, '【工单名称(工单编号)】 已到截止时间，请及时处理！', 5, '【工单名称(工单编号)】 距离截止日期仅剩 X 天，请及时处理！', '2025-03-21 17:33:00.000', '266c6a42-6131-4d62-8f39-853e7093701c'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "t_alarm_rule" WHERE "id" = 1 and "type"='data_quality');




CREATE TABLE IF NOT EXISTS "permissions" (
    "id"            VARCHAR(36 char)        NOT NULL,
    "created_at"    DATETIME(3)     NOT NULL,
    "updated_at"    DATETIME(3)     NOT NULL,
    "deleted_at"    DATETIME(3)     DEFAULT NULL,
    "name"      VARCHAR(128 char)    NOT NULL,
    "description"   VARCHAR(300 char)    NULL,
    "category"  VARCHAR(128 char)    NOT NULL,
    CLUSTER PRIMARY KEY ("id")
    );








CREATE TABLE IF NOT EXISTS "permission_resources" (
    "id"            VARCHAR(36 char)        NOT NULL,
    "service_name" VARCHAR(128 char) NOT NULL,
    "action_id" VARCHAR(36 char) NOT NULL  default '',
    "path" VARCHAR(255 char) NOT NULL,
    "method" VARCHAR(32 char) NOT NULL,
    "action" VARCHAR(32 char) NOT NULL,
    "scope" VARCHAR(32 char) NOT NULL,
    "permission_id" VARCHAR(36 char) NOT NULL default '',
    "permission_name" VARCHAR(128 char) NOT NULL  default '',
    CLUSTER PRIMARY KEY ("id")
    );




CREATE TABLE IF NOT EXISTS  "auth_service_casbin_rule" (
    "id" BIGINT  NOT NULL IDENTITY(1, 1),
    "ptype" VARCHAR(100 char) DEFAULT NULL,
    "v0" VARCHAR(100 char) DEFAULT NULL,
    "v1" VARCHAR(100 char) DEFAULT NULL,
    "v2" VARCHAR(100 char) DEFAULT NULL,
    "v3" VARCHAR(100 char) DEFAULT NULL,
    "v4" VARCHAR(100 char) DEFAULT NULL,
    "v5" VARCHAR(100 char) DEFAULT NULL,
    CLUSTER PRIMARY KEY ("id")
    );

CREATE UNIQUE INDEX IF NOT EXISTS idx_auth_service_casbin_rule ON auth_service_casbin_rule("ptype","v0","v1","v2","v3","v4","v5");


CREATE TABLE IF NOT EXISTS "role_groups" (
    "id"            VARCHAR(36 char)        NOT NULL,
    "created_at"    DATETIME(3)     NOT NULL,
    "updated_at"    DATETIME(3)     NOT NULL,
    "deleted_at"    DATETIME(3)     DEFAULT NULL,
    "name"          VARCHAR(128 char)    NOT NULL,
    "description"   VARCHAR(300 char)    NOT NULL,
    CLUSTER PRIMARY KEY ("id")
    );




CREATE TABLE IF NOT EXISTS "permission_permission_resource_bindings" (
    "scope"                     VARCHAR(128 char)    NOT NULL,
    "permission_id"             VARCHAR(36 char)        NOT NULL,
    "permission_resource_id"    VARCHAR(36 char)        NOT NULL,
    "action"                    VARCHAR(128 char)    NOT NULL,
    "condition"                 VARCHAR(128 char)    NOT NULL,
    CLUSTER PRIMARY KEY ("permission_id", "permission_resource_id")
);





CREATE TABLE IF NOT EXISTS "user_permission_bindings" (
    "id"            VARCHAR(36 char)    NOT NULL,
    "user_id"       VARCHAR(36 char)    NOT NULL,
    "permission_id" VARCHAR(36 char)    NOT NULL,
    CLUSTER PRIMARY KEY ("user_id", "permission_id")
);




CREATE TABLE IF NOT EXISTS "user_role_bindings" (
    "id"            VARCHAR(36 char)    NOT NULL,
    "user_id"   VARCHAR(36 char)    NOT NULL,
    "role_id"   VARCHAR(36 char)    NOT NULL,
    CLUSTER PRIMARY KEY ("user_id", "role_id")
    );




CREATE TABLE IF NOT EXISTS "user_role_group_bindings" (
    "id"            VARCHAR(36 char)    NOT NULL,
    "user_id"       VARCHAR(36 char)    NOT NULL,
    "role_group_id" VARCHAR(36 char)    NOT NULL,
    CLUSTER PRIMARY KEY ("user_id", "role_group_id")
    );




CREATE TABLE IF NOT EXISTS "role_permission_bindings" (
                 "id"            VARCHAR(36 char)    NOT NULL,
    "role_id"       VARCHAR(36 char)    NOT NULL,
    "permission_id" VARCHAR(36 char)    NOT NULL,
    CLUSTER PRIMARY KEY ("role_id", "permission_id")
    );




CREATE TABLE IF NOT EXISTS "role_group_role_bindings" (
   "id"            VARCHAR(36 char)    NOT NULL,
    "role_group_id" VARCHAR(36 char)    NOT NULL,
    "role_id"       VARCHAR(36 char)    NOT NULL,
    CLUSTER PRIMARY KEY ("role_group_id", "role_id")
    );


INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '167d41c2-4b37-47e1-9c29-d103c4873f4f','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理数据分类分级','Operation',NULL FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '167d41c2-4b37-47e1-9c29-d103c4873f4f');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '18abfb60-5b18-4e63-9010-63fce5b5eb3e','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'审计用户操作','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '18abfb60-5b18-4e63-9010-63fce5b5eb3e');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '211783fe-b79a-49f3-8a90-3402635b7456','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'数据安全管理','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '211783fe-b79a-49f3-8a90-3402635b7456');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '29d08b27-1974-48de-8979-bcb222b90f72','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理数据模型','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '29d08b27-1974-48de-8979-bcb222b90f72');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '2c809154-54a9-4bca-9017-92bec902e12a','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理数据质量工单','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '2c809154-54a9-4bca-9017-92bec902e12a');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '31c09e56-cf9a-42fd-aea5-9ee7fa781cd0','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理业务域层级','Basic',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '31c09e56-cf9a-42fd-aea5-9ee7fa781cd0');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '3273957b-f811-4639-9e08-3e6133fd891a','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'审核数据理解工单','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '3273957b-f811-4639-9e08-3e6133fd891a');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '3db2f019-678b-4030-b57f-5a7db667b826','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'处理质量工单','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '3db2f019-678b-4030-b57f-5a7db667b826');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '41095041-05dc-4139-b6cd-e786079db2ab','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理用户和角色','Basic',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '41095041-05dc-4139-b6cd-e786079db2ab');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '421d78c1-72e7-477c-8825-7c5cc83fa15b','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理通用配置','Basic',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '421d78c1-72e7-477c-8825-7c5cc83fa15b');


INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '473a7956-25f6-4f1b-846b-94e71dc058cb','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理数据运营流程','Basic',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '473a7956-25f6-4f1b-846b-94e71dc058cb');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '49604f6f-dfc2-4faf-9aa8-69c05cc297b0','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'审核归集计划','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '49604f6f-dfc2-4faf-9aa8-69c05cc297b0');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '4ce45b8b-d19c-435b-81ce-f3abf561b21a','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理接口服务','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '4ce45b8b-d19c-435b-81ce-f3abf561b21a');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '4cfdc28e-97f4-445b-9968-f575d61896e9','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'审核数据理解计划','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '4cfdc28e-97f4-445b-9968-f575d61896e9');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '5c100c9e-5f93-48fb-92ef-d5a898aa3fe0','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'需求分析和实施','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '5c100c9e-5f93-48fb-92ef-d5a898aa3fe0');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '67b4198b-4dd4-4029-a716-286e378d14b7','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'审核数据推送','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '67b4198b-4dd4-4029-a716-286e378d14b7');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '68e247dd-831b-4b5d-8f13-6c5ae5983c07','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理数据理解工单和任务','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '68e247dd-831b-4b5d-8f13-6c5ae5983c07');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '68e736d6-6a77-4b64-ad89-ead3d6c22c00','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理指标','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '68e736d6-6a77-4b64-ad89-ead3d6c22c00');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '7c4f09cb-ab38-45c9-8224-843f8b6a373f','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理编码生成规则','Basic',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '7c4f09cb-ab38-45c9-8224-843f8b6a373f');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '7efe085c-c675-4517-a276-967d3cfa234d','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理前置机','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '7efe085c-c675-4517-a276-967d3cfa234d');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '818be06d-d3ea-4f4f-815b-8704ae403ba6','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理数据标准','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '818be06d-d3ea-4f4f-815b-8704ae403ba6');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '834ee866-5ca0-419a-b84d-477694bd5d39','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理业务架构','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '834ee866-5ca0-419a-b84d-477694bd5d39');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '8860f32c-e57f-4d01-979a-bd26654596fd','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'基础权限','BasicPermission',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '8860f32c-e57f-4d01-979a-bd26654596fd');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '8e7406af-482f-4e6d-ac9e-37b19c69c717','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'分析和实施供需对接','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '8e7406af-482f-4e6d-ac9e-37b19c69c717');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '9070e117-273b-4c70-8b93-1aecdee05b28','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理审核策略','Basic',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '9070e117-273b-4c70-8b93-1aecdee05b28');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '982eaf56-74fb-484a-a390-e205d4c80d95','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理库表','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '982eaf56-74fb-484a-a390-e205d4c80d95');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '9976db14-47b6-4c55-9d20-a86096635e6b','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理数据质量','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '9976db14-47b6-4c55-9d20-a86096635e6b');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '9b976ebf-fc9c-4f0d-aff9-af6624881cd9','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理数据调研报告','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '9b976ebf-fc9c-4f0d-aff9-af6624881cd9');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '9c95aa01-6559-48e7-88f3-dbd1b50f1798','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'访问数据资源','Service',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '9c95aa01-6559-48e7-88f3-dbd1b50f1798');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '9cf7c7c8-7b75-47a8-b390-245072dcffb1','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理数据归集工单','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '9cf7c7c8-7b75-47a8-b390-245072dcffb1');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '9f20e636-d09d-4439-b74d-6db0f5cd420f','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理数据字典','Basic',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '9f20e636-d09d-4439-b74d-6db0f5cd420f');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT 'a5603c74-569e-4a75-bac4-d15d76c84a56','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理理解模板','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = 'a5603c74-569e-4a75-bac4-d15d76c84a56');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT 'a9aea8b6-8961-49b4-92ea-453ce2408470','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理数据运营项目','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = 'a9aea8b6-8961-49b4-92ea-453ce2408470');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT 'ab9ce811-e5fd-4b44-9d93-926a90427ab6','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理集成应用','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = 'ab9ce811-e5fd-4b44-9d93-926a90427ab6');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT 'af703060-4f7a-4638-ac4a-c0d3c3af00d0','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'审核质量工单','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = 'af703060-4f7a-4638-ac4a-c0d3c3af00d0');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT 'afbcdb6c-cb85-4a0c-82ee-68c9f1465684','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理数据资源授权','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = 'afbcdb6c-cb85-4a0c-82ee-68c9f1465684');


INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT 'c4be2537-7d5e-494f-890f-4ecf6d958476','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'审核归集工单','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = 'c4be2537-7d5e-494f-890f-4ecf6d958476');


INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT 'dc9cb4f2-ff4b-4b7f-a8ae-3747071b7dd0','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理数据归集计划','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = 'dc9cb4f2-ff4b-4b7f-a8ae-3747071b7dd0');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT 'df5733b3-40bf-4edd-8ce4-e8f540f8cf90','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理数据推送','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = 'df5733b3-40bf-4edd-8ce4-e8f540f8cf90');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT 'dfd1ef75-6cea-4cf8-8827-cfdad6414aec','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'查看理解报告','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = 'dfd1ef75-6cea-4cf8-8827-cfdad6414aec');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT 'e2883f33-466c-4e86-a151-fdd291a9a892','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理数据理解计划','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = 'e2883f33-466c-4e86-a151-fdd291a9a892');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT 'e2c2f816-1454-4e8f-b11d-1e99bff07702','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'分析和实施共享申请','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = 'e2c2f816-1454-4e8f-b11d-1e99bff07702');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT 'e9a9bdc9-bc2e-4222-87ba-5d3751ec6a04','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理数据源','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = 'e9a9bdc9-bc2e-4222-87ba-5d3751ec6a04');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT 'ecb6e712-1b7f-492a-8cb3-0f7fc299a0f2','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'发起数据分析需求','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = 'ecb6e712-1b7f-492a-8cb3-0f7fc299a0f2');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT 'edb4492e-a69c-4fc9-9609-2ba88b1624ca','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'审核数据理解报告','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = 'edb4492e-a69c-4fc9-9609-2ba88b1624ca');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT 'efb46db2-02f0-46a9-902e-ca587685785f','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'发起数据供需对接','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = 'efb46db2-02f0-46a9-902e-ca587685785f');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT 'f1019a3a-8e99-49f6-bf3a-bf350fcb2b87','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'审核供需对接','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = 'f1019a3a-8e99-49f6-bf3a-bf350fcb2b87');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT 'f34ea9b3-0121-4e4e-8303-df989ee958da','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理业务模型、数据模型和业务诊断','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = 'f34ea9b3-0121-4e4e-8303-df989ee958da');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT 'f9138813-cb42-408e-993b-9de758c0e6f9','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理资源目录','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = 'f9138813-cb42-408e-993b-9de758c0e6f9');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT 'f99d1a54-5e2f-42cc-b35c-614a57c2a6ad','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'发起共享申请','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = 'f99d1a54-5e2f-42cc-b35c-614a57c2a6ad');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT 'fa77a70c-37c9-46fd-a805-3a4265fb28b9','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理信息系统','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = 'fa77a70c-37c9-46fd-a805-3a4265fb28b9');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT 'f077a70c-37c9-46fd-a805-3a4265fb28b0','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理门户的信息展示','Information',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = 'f077a70c-37c9-46fd-a805-3a4265fb28b0');


INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '0077a70c-37c9-46fd-a805-3a4265fb2800','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理厂商名录','Basic',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '0077a70c-37c9-46fd-a805-3a4265fb2800');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '0077a70c-37c9-46fd-a805-3a4265fb2801','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理消息设置','Basic',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '0077a70c-37c9-46fd-a805-3a4265fb2801');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '0077a70c-37c9-46fd-a805-3a4265fb2802','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理积分规则','Basic',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '0077a70c-37c9-46fd-a805-3a4265fb2802');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '0077a70c-37c9-46fd-a805-3a4265fb2803','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理通讯录','Basic',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '0077a70c-37c9-46fd-a805-3a4265fb2803');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '0077a70c-37c9-46fd-a805-3a4265fb2804','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理业务文件','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '0077a70c-37c9-46fd-a805-3a4265fb2804');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '0077a70c-37c9-46fd-a805-3a4265fb2805','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理业务标签','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '0077a70c-37c9-46fd-a805-3a4265fb2805');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '0077a70c-37c9-46fd-a805-3a4265fb2806','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理文件资源','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '0077a70c-37c9-46fd-a805-3a4265fb2806');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '0077a70c-37c9-46fd-a805-3a4265fb2807','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理数据沙箱','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '0077a70c-37c9-46fd-a805-3a4265fb2807');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '0077a70c-37c9-46fd-a805-3a4265fb2808','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理数据价值评估','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '0077a70c-37c9-46fd-a805-3a4265fb2808');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '0077a70c-37c9-46fd-a805-3a4265fb2809','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理数据归集清单','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '0077a70c-37c9-46fd-a805-3a4265fb2809');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '0077a70c-37c9-46fd-a805-3a4265fb2810','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理数据处理计划','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '0077a70c-37c9-46fd-a805-3a4265fb2810');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '0077a70c-37c9-46fd-a805-3a4265fb2811','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理标准化工单','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '0077a70c-37c9-46fd-a805-3a4265fb2811');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '0077a70c-37c9-46fd-a805-3a4265fb2812','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理质量检测工单','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '0077a70c-37c9-46fd-a805-3a4265fb2812');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '0077a70c-37c9-46fd-a805-3a4265fb2813','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理数据融合工单','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '0077a70c-37c9-46fd-a805-3a4265fb2813');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '0077a70c-37c9-46fd-a805-3a4265fb2814','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理租户申请','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '0077a70c-37c9-46fd-a805-3a4265fb2814');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '0077a70c-37c9-46fd-a805-3a4265fb2815','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'发起数据成效反馈','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '0077a70c-37c9-46fd-a805-3a4265fb2815');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '0077a70c-37c9-46fd-a805-3a4265fb2816','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'处理数据成效反馈','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '0077a70c-37c9-46fd-a805-3a4265fb2816');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '0077a70c-37c9-46fd-a805-3a4265fb2817','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理数据可信度评估','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '0077a70c-37c9-46fd-a805-3a4265fb2817');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '0077a70c-37c9-46fd-a805-3a4265fb2818','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理资源负面清单','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '0077a70c-37c9-46fd-a805-3a4265fb2818');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '0077a70c-37c9-46fd-a805-3a4265fb2819','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理工单信息','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '0077a70c-37c9-46fd-a805-3a4265fb2819');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '0077a70c-37c9-46fd-a805-3a4265fb2820','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理工单任务','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '0077a70c-37c9-46fd-a805-3a4265fb2820');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '0077a70c-37c9-46fd-a805-3a4265fb2821','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'审核业务标签','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '0077a70c-37c9-46fd-a805-3a4265fb2821');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '0077a70c-37c9-46fd-a805-3a4265fb2822','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'审核业务架构','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '0077a70c-37c9-46fd-a805-3a4265fb2822');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '0077a70c-37c9-46fd-a805-3a4265fb2823','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'审核业务模型','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '0077a70c-37c9-46fd-a805-3a4265fb2823');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '0077a70c-37c9-46fd-a805-3a4265fb2824','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'审核数据模型','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '0077a70c-37c9-46fd-a805-3a4265fb2824');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '0077a70c-37c9-46fd-a805-3a4265fb2825','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'审核业务诊断报告','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '0077a70c-37c9-46fd-a805-3a4265fb2825');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '0077a70c-37c9-46fd-a805-3a4265fb2826','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'审核工单信息','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '0077a70c-37c9-46fd-a805-3a4265fb2826');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '0077a70c-37c9-46fd-a805-3a4265fb2827','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'审核集成应用','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '0077a70c-37c9-46fd-a805-3a4265fb2827');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '0077a70c-37c9-46fd-a805-3a4265fb2830','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'审核调研报告','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '0077a70c-37c9-46fd-a805-3a4265fb2830');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '0077a70c-37c9-46fd-a805-3a4265fb2831','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'审核归集清单','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '0077a70c-37c9-46fd-a805-3a4265fb2831');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '0077a70c-37c9-46fd-a805-3a4265fb2832','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'审核文件资源','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '0077a70c-37c9-46fd-a805-3a4265fb2832');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '0077a70c-37c9-46fd-a805-3a4265fb2833','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'审核信息资源目录','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '0077a70c-37c9-46fd-a805-3a4265fb2833');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '0077a70c-37c9-46fd-a805-3a4265fb2834','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'审核数据资源目录','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '0077a70c-37c9-46fd-a805-3a4265fb2834');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '0077a70c-37c9-46fd-a805-3a4265fb2835','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'审核开放目录','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '0077a70c-37c9-46fd-a805-3a4265fb2835');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '0077a70c-37c9-46fd-a805-3a4265fb2836','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'审核前置机申请','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '0077a70c-37c9-46fd-a805-3a4265fb2836');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '0077a70c-37c9-46fd-a805-3a4265fb2837','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'审核标准化工单','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '0077a70c-37c9-46fd-a805-3a4265fb2837');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '0077a70c-37c9-46fd-a805-3a4265fb2838','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'审核数据处理计划','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '0077a70c-37c9-46fd-a805-3a4265fb2838');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '0077a70c-37c9-46fd-a805-3a4265fb2839','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'审核质量检测工单','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '0077a70c-37c9-46fd-a805-3a4265fb2839');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '0077a70c-37c9-46fd-a805-3a4265fb2840','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'审核数据融合工单','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '0077a70c-37c9-46fd-a805-3a4265fb2840');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '0077a70c-37c9-46fd-a805-3a4265fb2842','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'审核租户申请','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '0077a70c-37c9-46fd-a805-3a4265fb2842');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '0077a70c-37c9-46fd-a805-3a4265fb2847','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'审核共享申请申报','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '0077a70c-37c9-46fd-a805-3a4265fb2847');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '0077a70c-37c9-46fd-a805-3a4265fb2848','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'审核共享申请分析结论','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '0077a70c-37c9-46fd-a805-3a4265fb2848');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '0077a70c-37c9-46fd-a805-3a4265fb2849','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'共享申请数据提供方审核','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '0077a70c-37c9-46fd-a805-3a4265fb2849');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '0077a70c-37c9-46fd-a805-3a4265fb2850','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'审核数据成效反馈','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '0077a70c-37c9-46fd-a805-3a4265fb2850');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '0077a70c-37c9-46fd-a805-3a4265fb2851','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'审核数据分析需求申报','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '0077a70c-37c9-46fd-a805-3a4265fb2851');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '0077a70c-37c9-46fd-a805-3a4265fb2852','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'审核数据分析需求结论','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '0077a70c-37c9-46fd-a805-3a4265fb2852');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '0077a70c-37c9-46fd-a805-3a4265fb2854','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'审核数据沙箱','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '0077a70c-37c9-46fd-a805-3a4265fb2854');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '0077a70c-37c9-46fd-a805-3a4265fb2855','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'审核数据目录上报','SszdZone',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '0077a70c-37c9-46fd-a805-3a4265fb2855');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '0077a70c-37c9-46fd-a805-3a4265fb2856','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'审核数据资源上报','SszdZone',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '0077a70c-37c9-46fd-a805-3a4265fb2856');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '0077a70c-37c9-46fd-a805-3a4265fb2857','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'审核数据需求','SszdZone',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '0077a70c-37c9-46fd-a805-3a4265fb2857');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '0077a70c-37c9-46fd-a805-3a4265fb2858','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'审核共享资源','SszdZone',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '0077a70c-37c9-46fd-a805-3a4265fb2858');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '0077a70c-37c9-46fd-a805-3a4265fb2859','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'审核数据异议','SszdZone',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '0077a70c-37c9-46fd-a805-3a4265fb2859');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '0077a70c-37c9-46fd-a805-3a4265fb2860','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'审核集成应用上报','SszdZone',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '0077a70c-37c9-46fd-a805-3a4265fb2860');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '0077a70c-37c9-46fd-a805-3a4265fb2861','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'发起数据目录上报','SszdZone',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '0077a70c-37c9-46fd-a805-3a4265fb2861');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '0077a70c-37c9-46fd-a805-3a4265fb2862','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'发起数据资源上报','SszdZone',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '0077a70c-37c9-46fd-a805-3a4265fb2862');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '0077a70c-37c9-46fd-a805-3a4265fb2863','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'发起需求申请','SszdZone',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '0077a70c-37c9-46fd-a805-3a4265fb2863');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '0077a70c-37c9-46fd-a805-3a4265fb2864','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'需求签收和实施','SszdZone',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '0077a70c-37c9-46fd-a805-3a4265fb2864');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '0077a70c-37c9-46fd-a805-3a4265fb2865','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理共享申请和订阅','SszdZone',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '0077a70c-37c9-46fd-a805-3a4265fb2865');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '0077a70c-37c9-46fd-a805-3a4265fb2866','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理待处理共享申请','SszdZone',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '0077a70c-37c9-46fd-a805-3a4265fb2866');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '0077a70c-37c9-46fd-a805-3a4265fb2867','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'发起应用案例上报','SszdZone',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '0077a70c-37c9-46fd-a805-3a4265fb2867');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '0077a70c-37c9-46fd-a805-3a4265fb2868','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'查看省级应用案例','SszdZone',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '0077a70c-37c9-46fd-a805-3a4265fb2868');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '0077a70c-37c9-46fd-a805-3a4265fb2869','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理集成应用','SszdZone',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '0077a70c-37c9-46fd-a805-3a4265fb2869');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '0077a70c-37c9-46fd-a805-3a4265fb2870','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'申请前置机','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '0077a70c-37c9-46fd-a805-3a4265fb2870');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '0077a70c-37c9-46fd-a805-3a4265fb2871','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'审核数据分析成果出库','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '0077a70c-37c9-46fd-a805-3a4265fb2871');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '0077a70c-37c9-46fd-a805-3a4265fb2872','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'处理分析需求成效反馈','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '0077a70c-37c9-46fd-a805-3a4265fb2872');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '0077a70c-37c9-46fd-a805-3a4265fb2873','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'审核分析需求成效反馈','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '0077a70c-37c9-46fd-a805-3a4265fb2873');


INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '0077a70c-37c9-46fd-a805-3a4265fb2874','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理电子证照目录','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '0077a70c-37c9-46fd-a805-3a4265fb2874');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '0077a70c-37c9-46fd-a805-3a4265fb2875','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理目录分类','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '0077a70c-37c9-46fd-a805-3a4265fb2875');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '0077a70c-37c9-46fd-a805-3a4265fb2876','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理开放目录','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '0077a70c-37c9-46fd-a805-3a4265fb2876');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '0077a70c-37c9-46fd-a805-3a4265fb2877','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'完善数据分析需求','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '0077a70c-37c9-46fd-a805-3a4265fb2877');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '0077a70c-37c9-46fd-a805-3a4265fb2878','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'实施数据分析需求','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '0077a70c-37c9-46fd-a805-3a4265fb2878');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '0077a70c-37c9-46fd-a805-3a4265fb2879','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'确认数据分析需求成果','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '0077a70c-37c9-46fd-a805-3a4265fb2879');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '0077a70c-37c9-46fd-a805-3a4265fb2880','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'处理数据分析需求成果出库','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '0077a70c-37c9-46fd-a805-3a4265fb2880');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '0077a70c-37c9-46fd-a805-3a4265fb2881','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'反馈数据分析需求成效','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '0077a70c-37c9-46fd-a805-3a4265fb2881');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '0077a70c-37c9-46fd-a805-3a4265fb2882','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理需求分析成果目录','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '0077a70c-37c9-46fd-a805-3a4265fb2882');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '0077a70c-37c9-46fd-a805-3a4265fb2883','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'申请数据沙箱','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '0077a70c-37c9-46fd-a805-3a4265fb2883');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '0077a70c-37c9-46fd-a805-3a4265fb2884','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'实施数据沙箱','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '0077a70c-37c9-46fd-a805-3a4265fb2884');


INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '0077a70c-37c9-46fd-a805-3a4265fb2886','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'确认数据推送','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '0077a70c-37c9-46fd-a805-3a4265fb2886');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '0077a70c-37c9-46fd-a805-3a4265fb2887','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'确认需求资源','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '0077a70c-37c9-46fd-a805-3a4265fb2887');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '0077a70c-37c9-46fd-a805-3a4265fb2888','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'管理系统运行评价','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '0077a70c-37c9-46fd-a805-3a4265fb2888');

INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description") SELECT '0077a70c-37c9-46fd-a805-3a4265fb2889','2025-04-30 17:03:44.807','2025-04-30 17:03:44.807',NULL,'数据质量检测模板','Operation',NULL  FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '0077a70c-37c9-46fd-a805-3a4265fb2889');




INSERT INTO "role_permission_bindings" ("id", "role_id","permission_id")

SELECT '10108516-45b3-44c9-9188-ca656969e01g', '0000663b-46a9-45e4-b6f7-a6bd8c18bd46', '9c95aa01-6559-48e7-88f3-dbd1b50f1798'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "role_permission_bindings" WHERE "id" = '10108516-45b3-44c9-9188-ca656969e01g');

INSERT INTO "role_permission_bindings" ("id", "role_id","permission_id")

SELECT '10108516-45b3-44c9-9188-ca656969e02g', '0000663b-46a9-45e4-b6f7-a6bd8c18bd46', 'ecb6e712-1b7f-492a-8cb3-0f7fc299a0f2'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "role_permission_bindings" WHERE "id" = '10108516-45b3-44c9-9188-ca656969e02g');

INSERT INTO "role_permission_bindings" ("id", "role_id","permission_id")

SELECT '10108516-45b3-44c9-9188-ca656969e03g', '00008516-45b3-44c9-9188-ca656969e20f', '211783fe-b79a-49f3-8a90-3402635b7456'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "role_permission_bindings" WHERE "id" = '10108516-45b3-44c9-9188-ca656969e03g');

INSERT INTO "role_permission_bindings" ("id", "role_id","permission_id")

SELECT '10108516-45b3-44c9-9188-ca656969e04g', '00008516-45b3-44c9-9188-ca656969e20f', '9c95aa01-6559-48e7-88f3-dbd1b50f1798'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "role_permission_bindings" WHERE "id" = '10108516-45b3-44c9-9188-ca656969e04g');

INSERT INTO "role_permission_bindings" ("id", "role_id","permission_id")

SELECT '10108516-45b3-44c9-9188-ca656969e05g', '00005871-cedd-4216-bde0-94ced210e898', '9c95aa01-6559-48e7-88f3-dbd1b50f1798'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "role_permission_bindings" WHERE "id" = '10108516-45b3-44c9-9188-ca656969e05g');

INSERT INTO "role_permission_bindings" ("id", "role_id","permission_id")

SELECT '10108516-45b3-44c9-9188-ca656969e06g', '00005871-cedd-4216-bde0-94ced210e898', '29d08b27-1974-48de-8979-bcb222b90f72'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "role_permission_bindings" WHERE "id" = '10108516-45b3-44c9-9188-ca656969e06g');

INSERT INTO "role_permission_bindings" ("id", "role_id","permission_id")

SELECT '10108516-45b3-44c9-9188-ca656969e07g', '00005871-cedd-4216-bde0-94ced210e898', '68e736d6-6a77-4b64-ad89-ead3d6c22c00'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "role_permission_bindings" WHERE "id" = '10108516-45b3-44c9-9188-ca656969e07g');

INSERT INTO "role_permission_bindings" ("id", "role_id","permission_id")

SELECT '10108516-45b3-44c9-9188-ca656969e08g', '00005871-cedd-4216-bde0-94ced210e898', '982eaf56-74fb-484a-a390-e205d4c80d95'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "role_permission_bindings" WHERE "id" = '10108516-45b3-44c9-9188-ca656969e08g');

INSERT INTO "role_permission_bindings" ("id", "role_id","permission_id")

SELECT '10108516-45b3-44c9-9188-ca656969e09g', '00004606-f318-450f-bc53-f0720b27acff', '9c95aa01-6559-48e7-88f3-dbd1b50f1798'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "role_permission_bindings" WHERE "id" = '10108516-45b3-44c9-9188-ca656969e09g');

INSERT INTO "role_permission_bindings" ("id", "role_id","permission_id")

SELECT '10108516-45b3-44c9-9188-ca656969e10g', '00004606-f318-450f-bc53-f0720b27acff', 'f34ea9b3-0121-4e4e-8303-df989ee958da'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "role_permission_bindings" WHERE "id" = '10108516-45b3-44c9-9188-ca656969e10g');

INSERT INTO "role_permission_bindings" ("id", "role_id","permission_id")

SELECT '10108516-45b3-44c9-9188-ca656969e11g', '00004606-f318-450f-bc53-f0720b27acff', '473a7956-25f6-4f1b-846b-94e71dc058cb'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "role_permission_bindings" WHERE "id" = '10108516-45b3-44c9-9188-ca656969e11g');

INSERT INTO "role_permission_bindings" ("id", "role_id","permission_id")

SELECT '10108516-45b3-44c9-9188-ca656969e12g', '00004606-f318-450f-bc53-f0720b27acff', '982eaf56-74fb-484a-a390-e205d4c80d95'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "role_permission_bindings" WHERE "id" = '10108516-45b3-44c9-9188-ca656969e12g');

INSERT INTO "role_permission_bindings" ("id", "role_id","permission_id")

SELECT '10108516-45b3-44c9-9188-ca656969e13g', '00004606-f318-450f-bc53-f0720b27acff', '68e736d6-6a77-4b64-ad89-ead3d6c22c00'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "role_permission_bindings" WHERE "id" = '10108516-45b3-44c9-9188-ca656969e13g');

INSERT INTO "role_permission_bindings" ("id", "role_id","permission_id")

SELECT '10108516-45b3-44c9-9188-ca656969e14g', '00004606-f318-450f-bc53-f0720b27acff', '4ce45b8b-d19c-435b-81ce-f3abf561b21a'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "role_permission_bindings" WHERE "id" = '10108516-45b3-44c9-9188-ca656969e14g');

INSERT INTO "role_permission_bindings" ("id", "role_id","permission_id")

SELECT '10108516-45b3-44c9-9188-ca656969e15g', '00004606-f318-450f-bc53-f0720b27acff', 'f9138813-cb42-408e-993b-9de758c0e6f9'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "role_permission_bindings" WHERE "id" = '10108516-45b3-44c9-9188-ca656969e15g');


INSERT INTO "role_permission_bindings" ("id", "role_id","permission_id")

SELECT '10108516-45b3-44c9-9188-ca656969e55g', '00003148-fbbf-4879-988d-54af7c98c7ed', '49604f6f-dfc2-4faf-9aa8-69c05cc297b0'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "role_permission_bindings" WHERE "id" = '10108516-45b3-44c9-9188-ca656969e55g');

INSERT INTO "role_permission_bindings" ("id", "role_id","permission_id")

SELECT '10108516-45b3-44c9-9188-ca656969e56g', '00003148-fbbf-4879-988d-54af7c98c7ed', 'c4be2537-7d5e-494f-890f-4ecf6d958476'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "role_permission_bindings" WHERE "id" = '10108516-45b3-44c9-9188-ca656969e56g');

INSERT INTO "role_permission_bindings" ("id", "role_id","permission_id")

SELECT '10108516-45b3-44c9-9188-ca656969e57g', '00003148-fbbf-4879-988d-54af7c98c7ed', '0077a70c-37c9-46fd-a805-3a4265fb2830'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "role_permission_bindings" WHERE "id" = '10108516-45b3-44c9-9188-ca656969e57g');

INSERT INTO "role_permission_bindings" ("id", "role_id","permission_id")

SELECT '10108516-45b3-44c9-9188-ca656969e58g', '00003148-fbbf-4879-988d-54af7c98c7ed', 'af703060-4f7a-4638-ac4a-c0d3c3af00d0'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "role_permission_bindings" WHERE "id" = '10108516-45b3-44c9-9188-ca656969e58g');

INSERT INTO "role_permission_bindings" ("id", "role_id","permission_id")

SELECT '10108516-45b3-44c9-9188-ca656969e59g', '00003148-fbbf-4879-988d-54af7c98c7ed', '4cfdc28e-97f4-445b-9968-f575d61896e9'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "role_permission_bindings" WHERE "id" = '10108516-45b3-44c9-9188-ca656969e59g');

INSERT INTO "role_permission_bindings" ("id", "role_id","permission_id")

SELECT '10108516-45b3-44c9-9188-ca656969e60g', '00003148-fbbf-4879-988d-54af7c98c7ed', '3273957b-f811-4639-9e08-3e6133fd891a'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "role_permission_bindings" WHERE "id" = '10108516-45b3-44c9-9188-ca656969e60g');

INSERT INTO "role_permission_bindings" ("id", "role_id","permission_id")

SELECT '10108516-45b3-44c9-9188-ca656969e61g', '00003148-fbbf-4879-988d-54af7c98c7ed', 'edb4492e-a69c-4fc9-9609-2ba88b1624ca'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "role_permission_bindings" WHERE "id" = '10108516-45b3-44c9-9188-ca656969e61g');

INSERT INTO "role_permission_bindings" ("id", "role_id","permission_id")

SELECT '10108516-45b3-44c9-9188-ca656969e62g', '00003148-fbbf-4879-988d-54af7c98c7ed', '0077a70c-37c9-46fd-a805-3a4265fb2847'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "role_permission_bindings" WHERE "id" = '10108516-45b3-44c9-9188-ca656969e62g');

INSERT INTO "role_permission_bindings" ("id", "role_id","permission_id")

SELECT '10108516-45b3-44c9-9188-ca656969e63g', '00003148-fbbf-4879-988d-54af7c98c7ed', '0077a70c-37c9-46fd-a805-3a4265fb2851'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "role_permission_bindings" WHERE "id" = '10108516-45b3-44c9-9188-ca656969e63g');

INSERT INTO "role_permission_bindings" ("id", "role_id","permission_id")

SELECT '10108516-45b3-44c9-9188-ca656969e64g', '00003148-fbbf-4879-988d-54af7c98c7ed', '0077a70c-37c9-46fd-a805-3a4265fb2848'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "role_permission_bindings" WHERE "id" = '10108516-45b3-44c9-9188-ca656969e64g');

INSERT INTO "role_permission_bindings" ("id", "role_id","permission_id")

SELECT '10108516-45b3-44c9-9188-ca656969e65g', '00003148-fbbf-4879-988d-54af7c98c7ed', '0077a70c-37c9-46fd-a805-3a4265fb2852'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "role_permission_bindings" WHERE "id" = '10108516-45b3-44c9-9188-ca656969e65g');

INSERT INTO "role_permission_bindings" ("id", "role_id","permission_id")

SELECT '10108516-45b3-44c9-9188-ca656969e66g', '00003148-fbbf-4879-988d-54af7c98c7ed', '67b4198b-4dd4-4029-a716-286e378d14b7'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "role_permission_bindings" WHERE "id" = '10108516-45b3-44c9-9188-ca656969e66g');


INSERT INTO "role_permission_bindings" ("id", "role_id","permission_id")

SELECT '10108516-45b3-44c9-9188-ca656969e16g', '00003148-fbbf-4879-988d-54af7c98c7ed', '9c95aa01-6559-48e7-88f3-dbd1b50f1798'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "role_permission_bindings" WHERE "id" = '10108516-45b3-44c9-9188-ca656969e16g');

INSERT INTO "role_permission_bindings" ("id", "role_id","permission_id")

SELECT '10108516-45b3-44c9-9188-ca656969e27g', '00003148-fbbf-4879-988d-54af7c98c7ed', 'a9aea8b6-8961-49b4-92ea-453ce2408470'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "role_permission_bindings" WHERE "id" = '10108516-45b3-44c9-9188-ca656969e27g');

INSERT INTO "role_permission_bindings" ("id", "role_id","permission_id")

SELECT '10108516-45b3-44c9-9188-ca656969e28g', '00003148-fbbf-4879-988d-54af7c98c7ed', 'f34ea9b3-0121-4e4e-8303-df989ee958da'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "role_permission_bindings" WHERE "id" = '10108516-45b3-44c9-9188-ca656969e28g');

INSERT INTO "role_permission_bindings" ("id", "role_id","permission_id")

SELECT '10108516-45b3-44c9-9188-ca656969e29g', '00003148-fbbf-4879-988d-54af7c98c7ed', '818be06d-d3ea-4f4f-815b-8704ae403ba6'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "role_permission_bindings" WHERE "id" = '10108516-45b3-44c9-9188-ca656969e29g');



INSERT INTO "role_permission_bindings" ("id", "role_id","permission_id")

SELECT '10108516-45b3-44c9-9188-ca656969e67g', '00002fb7-1e54-4ce1-bc02-626cb1f85f62', '49604f6f-dfc2-4faf-9aa8-69c05cc297b0'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "role_permission_bindings" WHERE "id" = '10108516-45b3-44c9-9188-ca656969e67g');

INSERT INTO "role_permission_bindings" ("id", "role_id","permission_id")

SELECT '10108516-45b3-44c9-9188-ca656969e68g', '00002fb7-1e54-4ce1-bc02-626cb1f85f62', 'c4be2537-7d5e-494f-890f-4ecf6d958476'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "role_permission_bindings" WHERE "id" = '10108516-45b3-44c9-9188-ca656969e68g');

INSERT INTO "role_permission_bindings" ("id", "role_id","permission_id")

SELECT '10108516-45b3-44c9-9188-ca656969e69g', '00002fb7-1e54-4ce1-bc02-626cb1f85f62', '0077a70c-37c9-46fd-a805-3a4265fb2830'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "role_permission_bindings" WHERE "id" = '10108516-45b3-44c9-9188-ca656969e69g');

INSERT INTO "role_permission_bindings" ("id", "role_id","permission_id")

SELECT '10108516-45b3-44c9-9188-ca656969e70g', '00002fb7-1e54-4ce1-bc02-626cb1f85f62', 'af703060-4f7a-4638-ac4a-c0d3c3af00d0'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "role_permission_bindings" WHERE "id" = '10108516-45b3-44c9-9188-ca656969e70g');

INSERT INTO "role_permission_bindings" ("id", "role_id","permission_id")

SELECT '10108516-45b3-44c9-9188-ca656969e71g', '00002fb7-1e54-4ce1-bc02-626cb1f85f62', '4cfdc28e-97f4-445b-9968-f575d61896e9'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "role_permission_bindings" WHERE "id" = '10108516-45b3-44c9-9188-ca656969e71g');

INSERT INTO "role_permission_bindings" ("id", "role_id","permission_id")

SELECT '10108516-45b3-44c9-9188-ca656969e72g', '00002fb7-1e54-4ce1-bc02-626cb1f85f62', '3273957b-f811-4639-9e08-3e6133fd891a'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "role_permission_bindings" WHERE "id" = '10108516-45b3-44c9-9188-ca656969e72g');

INSERT INTO "role_permission_bindings" ("id", "role_id","permission_id")

SELECT '10108516-45b3-44c9-9188-ca656969e73g', '00002fb7-1e54-4ce1-bc02-626cb1f85f62', 'edb4492e-a69c-4fc9-9609-2ba88b1624ca'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "role_permission_bindings" WHERE "id" = '10108516-45b3-44c9-9188-ca656969e73g');

INSERT INTO "role_permission_bindings" ("id", "role_id","permission_id")

SELECT '10108516-45b3-44c9-9188-ca656969e74g', '00002fb7-1e54-4ce1-bc02-626cb1f85f62', '0077a70c-37c9-46fd-a805-3a4265fb2847'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "role_permission_bindings" WHERE "id" = '10108516-45b3-44c9-9188-ca656969e74g');

INSERT INTO "role_permission_bindings" ("id", "role_id","permission_id")

SELECT '10108516-45b3-44c9-9188-ca656969e75g', '00002fb7-1e54-4ce1-bc02-626cb1f85f62', '0077a70c-37c9-46fd-a805-3a4265fb2851'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "role_permission_bindings" WHERE "id" = '10108516-45b3-44c9-9188-ca656969e75g');

INSERT INTO "role_permission_bindings" ("id", "role_id","permission_id")

SELECT '10108516-45b3-44c9-9188-ca656969e76g', '00002fb7-1e54-4ce1-bc02-626cb1f85f62', '0077a70c-37c9-46fd-a805-3a4265fb2848'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "role_permission_bindings" WHERE "id" = '10108516-45b3-44c9-9188-ca656969e76g');

INSERT INTO "role_permission_bindings" ("id", "role_id","permission_id")

SELECT '10108516-45b3-44c9-9188-ca656969e77g', '00002fb7-1e54-4ce1-bc02-626cb1f85f62', '0077a70c-37c9-46fd-a805-3a4265fb2852'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "role_permission_bindings" WHERE "id" = '10108516-45b3-44c9-9188-ca656969e77g');

INSERT INTO "role_permission_bindings" ("id", "role_id","permission_id")

SELECT '10108516-45b3-44c9-9188-ca656969e78g', '00002fb7-1e54-4ce1-bc02-626cb1f85f62', '67b4198b-4dd4-4029-a716-286e378d14b7'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "role_permission_bindings" WHERE "id" = '10108516-45b3-44c9-9188-ca656969e78g');


INSERT INTO "role_permission_bindings" ("id", "role_id","permission_id")

SELECT '10108516-45b3-44c9-9188-ca656969e32g', '00002fb7-1e54-4ce1-bc02-626cb1f85f62', 'f34ea9b3-0121-4e4e-8303-df989ee958da'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "role_permission_bindings" WHERE "id" = '10108516-45b3-44c9-9188-ca656969e32g');

INSERT INTO "role_permission_bindings" ("id", "role_id","permission_id")

SELECT '10108516-45b3-44c9-9188-ca656969e30g', '00002fb7-1e54-4ce1-bc02-626cb1f85f62', 'afbcdb6c-cb85-4a0c-82ee-68c9f1465684'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "role_permission_bindings" WHERE "id" = '10108516-45b3-44c9-9188-ca656969e30g');

INSERT INTO "role_permission_bindings" ("id", "role_id","permission_id")

SELECT '10108516-45b3-44c9-9188-ca656969e31g', '00002fb7-1e54-4ce1-bc02-626cb1f85f62', '9c95aa01-6559-48e7-88f3-dbd1b50f1798'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "role_permission_bindings" WHERE "id" = '10108516-45b3-44c9-9188-ca656969e31g');

INSERT INTO "role_permission_bindings" ("id", "role_id","permission_id")

SELECT '10108516-45b3-44c9-9188-ca656969e42g', '00002fb7-1e54-4ce1-bc02-626cb1f85f62', 'a9aea8b6-8961-49b4-92ea-453ce2408470'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "role_permission_bindings" WHERE "id" = '10108516-45b3-44c9-9188-ca656969e42g');

INSERT INTO "role_permission_bindings" ("id", "role_id","permission_id")

SELECT '10108516-45b3-44c9-9188-ca656969e43g', '00002fb7-1e54-4ce1-bc02-626cb1f85f62', '818be06d-d3ea-4f4f-815b-8704ae403ba6'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "role_permission_bindings" WHERE "id" = '10108516-45b3-44c9-9188-ca656969e43g');

INSERT INTO "role_permission_bindings" ("id", "role_id","permission_id")

SELECT '10108516-45b3-44c9-9188-ca656969e44g', '00007030-4e75-4c5e-aa56-f1bdf7044791', 'ab9ce811-e5fd-4b44-9d93-926a90427ab6'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "role_permission_bindings" WHERE "id" = '10108516-45b3-44c9-9188-ca656969e44g');

INSERT INTO "role_permission_bindings" ("id", "role_id","permission_id")

SELECT '10108516-45b3-44c9-9188-ca656969e45g', '00007030-4e75-4c5e-aa56-f1bdf7044791', '9c95aa01-6559-48e7-88f3-dbd1b50f1798'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "role_permission_bindings" WHERE "id" = '10108516-45b3-44c9-9188-ca656969e45g');

INSERT INTO "role_permission_bindings" ("id", "role_id","permission_id")

SELECT '10108516-45b3-44c9-9188-ca656969e40g', '00001f64-209f-4260-91f8-c61c6f820136', '473a7956-25f6-4f1b-846b-94e71dc058cb'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "role_permission_bindings" WHERE "id" = '10108516-45b3-44c9-9188-ca656969e40g');

INSERT INTO "role_permission_bindings" ("id", "role_id","permission_id")

SELECT '10108516-45b3-44c9-9188-ca656969e46g', '00001f64-209f-4260-91f8-c61c6f820136', '41095041-05dc-4139-b6cd-e786079db2ab'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "role_permission_bindings" WHERE "id" = '10108516-45b3-44c9-9188-ca656969e46g');

INSERT INTO "role_permission_bindings" ("id", "role_id","permission_id")

SELECT '10108516-45b3-44c9-9188-ca656969e47g', '00001f64-209f-4260-91f8-c61c6f820136', 'fa77a70c-37c9-46fd-a805-3a4265fb28b9'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "role_permission_bindings" WHERE "id" = '10108516-45b3-44c9-9188-ca656969e47g');

INSERT INTO "role_permission_bindings" ("id", "role_id","permission_id")

SELECT '10108516-45b3-44c9-9188-ca656969e48g', '00001f64-209f-4260-91f8-c61c6f820136', '31c09e56-cf9a-42fd-aea5-9ee7fa781cd0'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "role_permission_bindings" WHERE "id" = '10108516-45b3-44c9-9188-ca656969e48g');

INSERT INTO "role_permission_bindings" ("id", "role_id","permission_id")

SELECT '10108516-45b3-44c9-9188-ca656969e49g', '00001f64-209f-4260-91f8-c61c6f820136', 'e9a9bdc9-bc2e-4222-87ba-5d3751ec6a04'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "role_permission_bindings" WHERE "id" = '10108516-45b3-44c9-9188-ca656969e49g');

INSERT INTO "role_permission_bindings" ("id", "role_id","permission_id")

SELECT '10108516-45b3-44c9-9188-ca656969e50g', '00001f64-209f-4260-91f8-c61c6f820136', '167d41c2-4b37-47e1-9c29-d103c4873f4f'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "role_permission_bindings" WHERE "id" = '10108516-45b3-44c9-9188-ca656969e50g');

INSERT INTO "role_permission_bindings" ("id", "role_id","permission_id")

SELECT '10108516-45b3-44c9-9188-ca656969e50g', '00001f64-209f-4260-91f8-c61c6f820136', '473a7956-25f6-4f1b-846b-94e71dc058cb'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "role_permission_bindings" WHERE "id" = '10108516-45b3-44c9-9188-ca656969e50g');

INSERT INTO "role_permission_bindings" ("id", "role_id","permission_id")

SELECT '10108516-45b3-44c9-9188-ca656969e51g', '00001f64-209f-4260-91f8-c61c6f820136', '9070e117-273b-4c70-8b93-1aecdee05b28'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "role_permission_bindings" WHERE "id" = '10108516-45b3-44c9-9188-ca656969e51g');

INSERT INTO "role_permission_bindings" ("id", "role_id","permission_id")

SELECT '10108516-45b3-44c9-9188-ca656969e52g', '00001f64-209f-4260-91f8-c61c6f820136', '7c4f09cb-ab38-45c9-8224-843f8b6a373f'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "role_permission_bindings" WHERE "id" = '10108516-45b3-44c9-9188-ca656969e52g');

INSERT INTO "role_permission_bindings" ("id", "role_id","permission_id")

SELECT '10108516-45b3-44c9-9188-ca656969e53g', '00001f64-209f-4260-91f8-c61c6f820136', '18abfb60-5b18-4e63-9010-63fce5b5eb3e'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "role_permission_bindings" WHERE "id" = '10108516-45b3-44c9-9188-ca656969e53g');

INSERT INTO "role_permission_bindings" ("id", "role_id","permission_id")

SELECT '10108516-45b3-44c9-9188-ca656969e54g', '00108516-45b3-44c9-9188-ca656969e20g', 'f077a70c-37c9-46fd-a805-3a4265fb28b0'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "role_permission_bindings" WHERE "id" = '10108516-45b3-44c9-9188-ca656969e54g');

INSERT INTO "role_permission_bindings" ("id", "role_id","permission_id")

SELECT '10108516-45b3-44c9-9188-ca656969e80g', '00108516-45b3-44c9-9188-ca656969e20g', '9c95aa01-6559-48e7-88f3-dbd1b50f1798'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "role_permission_bindings" WHERE "id" = '10108516-45b3-44c9-9188-ca656969e80g');


INSERT INTO "role_permission_bindings" ("id", "role_id","permission_id")

SELECT '10108516-45b3-44c9-9188-ca656969e81g', '00004606-f318-450f-bc53-f0720b27acff', '5c100c9e-5f93-48fb-92ef-d5a898aa3fe0'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "role_permission_bindings" WHERE "id" = '10108516-45b3-44c9-9188-ca656969e81g');






INSERT INTO "user_role_bindings" ("id","user_id", "role_id")

SELECT '0100a2d9-c244-4d09-8e44-c2fea0e0e3f0', '266c6a42-6131-4d62-8f39-853e7093701c', '00001f64-209f-4260-91f8-c61c6f820136'

FROM DUAL WHERE NOT EXISTS(SELECT "id" FROM "user_role_bindings" WHERE "id" = '0100a2d9-c244-4d09-8e44-c2fea0e0e3f0');




CREATE TABLE IF NOT EXISTS "t_platform_zone" (
    "platform_zone_id" BIGINT NOT NULL  IDENTITY(1, 1),
    "id" VARCHAR(36 char) NOT NULL,
    "description" VARCHAR(50 char) NOT NULL DEFAULT '',
    "image_data" TEXT NOT NULL,
    "sort_weight" BIGINT NOT NULL DEFAULT 0,
    CLUSTER PRIMARY KEY ("platform_zone_id")
    );



CREATE TABLE IF NOT EXISTS "t_platform_zone_history_record" (
    "platform_zone_history_record_id" BIGINT NOT NULL  IDENTITY(1, 1),
    "id" VARCHAR(36 char) NOT NULL,
    "updated_at" datetime(3) NOT NULL DEFAULT current_timestamp(3) ,
    "updated_by" VARCHAR(36 char) DEFAULT NULL,
    CLUSTER PRIMARY KEY ("platform_zone_history_record_id")
    );



CREATE TABLE IF NOT EXISTS "t_platform_service" (
    "platform_zone_service_id" BIGINT NOT NULL  IDENTITY(1, 1),
    "id" VARCHAR(36 char) NOT NULL,
    "name" VARCHAR(255 char) NOT NULL,
    "description" VARCHAR(50 char) NOT NULL DEFAULT '',
    "url" VARCHAR(1024 char) NOT NULL,
    "image_data" TEXT NOT NULL,
    "is_enabled" BIT NOT NULL,
    "sort_weight" BIGINT NOT NULL DEFAULT 0,
    CLUSTER PRIMARY KEY ("platform_zone_service_id")
);


CREATE TABLE IF NOT EXISTS "t_carousel_case"
(
    "id"     VARCHAR(36 char) NOT NULL,
    "application_example_id"     VARCHAR(36 char)  NULL,
    "name" VARCHAR(256 char) NOT NULL,
    "uuid" VARCHAR(256 char) NOT NULL,
    "size" BIGINT NOT NULL DEFAULT 0,
    "save_path" text NOT NULL,
    "created_at" datetime(3) NOT NULL DEFAULT current_timestamp(3),
    "created_by" VARCHAR(64 char) DEFAULT NULL,
    "updated_at" datetime(3) NOT NULL DEFAULT current_timestamp(3) ,
    "type" VARCHAR(36 char) NULL,
    "interval_seconds" VARCHAR(36 char) NOT NULL default 3,
    "state"  VARCHAR(36 char) NOT NULL default 0,
    "is_top" VARCHAR(36 char) NOT NULL default 1,
    sort_order INT ,
    CLUSTER PRIMARY KEY ("id")
);



CREATE TABLE IF NOT EXISTS "t_cms_content" (
      "id" VARCHAR(38 char) NOT NULL,
    "title" VARCHAR(255 char) NOT NULL,
    "summary" VARCHAR(500 char) DEFAULT NULL,
    "content" text NOT NULL,
    "type" VARCHAR(10 char) NOT NULL DEFAULT '0',
    "status" VARCHAR(10 char) NOT NULL DEFAULT '0',
    "home_show" VARCHAR(10 char) NOT NULL DEFAULT '0',
    "image_id" VARCHAR(38 char)  NULL  DEFAULT null,
    "save_path" VARCHAR(200 char)  NULL  DEFAULT null,
    "size" BIGINT  NULL  DEFAULT null,
    "publish_time" datetime(0) DEFAULT NULL,
    "creator_id" VARCHAR(38 char) DEFAULT NULL,
    "updater_id" VARCHAR(38 char) DEFAULT NULL,
    "create_time" VARCHAR(38 char) NOT NULL,
    "update_time" VARCHAR(38 char) NOT NULL,
    "is_deleted" VARCHAR(11 char) NOT NULL DEFAULT '0',
    CLUSTER PRIMARY KEY ("id")
);




CREATE TABLE IF NOT EXISTS "t_help_document" (
    "id" VARCHAR(38 char) NOT NULL,
    "title" VARCHAR(255 char) NOT NULL,
    "type" VARCHAR(10 char) NOT NULL,
    "status" VARCHAR(10 char) NOT NULL DEFAULT '0',
    "image_id" VARCHAR(38 char)  NULL  DEFAULT null,
    "save_path" VARCHAR(200 char)  NULL  DEFAULT null,
    "size" BIGINT  NULL  DEFAULT null,
    "is_deleted" VARCHAR(10 char) NOT NULL DEFAULT '0',
    "created_at" datetime(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" datetime(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "published_at" VARCHAR(38 char) DEFAULT NULL,
    "created_by" VARCHAR(64 char) DEFAULT NULL,
    "updated_by" VARCHAR(64 char) DEFAULT NULL,
    CLUSTER PRIMARY KEY ("id")
);




CREATE TABLE IF NOT EXISTS "front_end_item" (
    "id" VARCHAR(36 char) NOT NULL,
    "front_end_id" VARCHAR(36 char) NOT NULL,
    "operator_system" VARCHAR(128 char) DEFAULT NULL,
    "computer_resource" VARCHAR(128 char) DEFAULT NULL,
    "disk_space" INT DEFAULT NULL,
    "library_number" INT DEFAULT NULL,
    "updated_at" VARCHAR(30 char) DEFAULT NULL,
    "deleted_at" VARCHAR(30 char) DEFAULT NULL,
    "created_at" VARCHAR(30 char) DEFAULT NULL,
    "node_ip" VARCHAR(100 char) DEFAULT NULL,
    "node_port" INT DEFAULT NULL,
    "node_name" VARCHAR(256 char) DEFAULT NULL,
    "administrator_name" VARCHAR(256 char) DEFAULT NULL,
    "administrator_phone" VARCHAR(256 char) DEFAULT NULL,
    "status" VARCHAR(200 char) DEFAULT NULL,
    CLUSTER PRIMARY KEY ("id")
    );




CREATE TABLE IF NOT EXISTS "front_end_library" (
    "id" VARCHAR(36 char) NOT NULL,
    "front_end_id" VARCHAR(36 char) NOT NULL,
    "type" VARCHAR(36 char) DEFAULT NULL,
    "name" VARCHAR(256 char) DEFAULT NULL,
    "username" VARCHAR(256 char) DEFAULT NULL,
    "password" VARCHAR(256 char) DEFAULT NULL,
    "business_name" VARCHAR(256 char) DEFAULT NULL,
    "comment" VARCHAR(300 char) DEFAULT NULL,
    "updated_at" VARCHAR(100 char) DEFAULT NULL,
    "created_at" VARCHAR(100 char) DEFAULT NULL,
    "deleted_at" VARCHAR(30 char) DEFAULT NULL,
    "front_end_item_id" VARCHAR(36 char) NOT NULL,
    "version" VARCHAR(256 char) DEFAULT NULL,
    "update_time" VARCHAR(100 char) DEFAULT NULL,
    CLUSTER PRIMARY KEY ("id","front_end_id","front_end_item_id")
);














CREATE TABLE IF NOT EXISTS "liyue_registrations" (
    "id" VARCHAR(36 char) NOT NULL,
    "liyue_id" VARCHAR(38 char) NOT NULL,
    "user_id" VARCHAR(500 char) NOT NULL,
    "type" TINYINT DEFAULT NULL,
    CLUSTER PRIMARY KEY ("id")
);


INSERT INTO "configuration"("key","value","type")
        SELECT 'platform_zone_display', 'list', '0'
            FROM DUAL WHERE NOT EXISTS(SELECT "key" FROM "configuration" WHERE "key" = 'platform_zone_display');


INSERT INTO "permissions" ("id", "created_at", "updated_at", "deleted_at", "name", "category", "description")
        SELECT '0077a70c-37c9-46fd-a805-3a4265fb2890','2025-08-12 11:03:44.807','2025-08-12 11:03:44.807',NULL,'管理工单模板','Basic',NULL  FROM DUAL
            WHERE NOT EXISTS(SELECT "id" FROM "permissions" WHERE "id" = '0077a70c-37c9-46fd-a805-3a4265fb2890');

CREATE TABLE IF NOT EXISTS "audit_policy" (
     "sid" BIGINT  NOT NULL,
     "id" VARCHAR(36 char) NOT NULL,
    "name" VARCHAR(128 char) NOT NULL,
    "description" VARCHAR(300 char) NOT NULL DEFAULT '',
    "type" VARCHAR(36 char) NOT NULL,
    "status" VARCHAR(36 char) NOT NULL,
    "resources_count" INT NOT NULL DEFAULT 0,
    "audit_type" VARCHAR(50 char) NOT NULL,
    "proc_def_key" VARCHAR(128 char) NOT NULL,
    "service_type" VARCHAR(128 char) DEFAULT NULL,
    "created_at" datetime(3) NOT NULL DEFAULT current_timestamp(3),
    "created_by_uid" VARCHAR(36 char) NOT NULL,
    "updated_at" datetime(3) NOT NULL DEFAULT current_timestamp(3) ,
    "updated_by_uid" VARCHAR(36 char) NOT NULL DEFAULT '',
    "deleted_at" BIGINT DEFAULT 0,
    CLUSTER PRIMARY KEY ("id")
    );

CREATE UNIQUE INDEX IF NOT EXISTS audit_policy_audit_policy_name ON audit_policy("name","deleted_at");



CREATE TABLE IF NOT EXISTS "audit_policy_resources" (
               "sid" BIGINT  NOT NULL,
               "id" VARCHAR(36 char) NOT NULL,
    "audit_policy_id" VARCHAR(36 char) NOT NULL,
    "type" VARCHAR(36 char) NOT NULL,
    "deleted_at" BIGINT DEFAULT 0,
    CLUSTER PRIMARY KEY ("sid")
    );


INSERT INTO "audit_policy" ("sid","id","name","description","type","status","resources_count","audit_type","proc_def_key","service_type","created_by_uid","updated_by_uid","deleted_at")

SELECT 000000000000000001,sys_guid(),'逻辑视图审核策略','作用于全部逻辑视图的权限申请','built-in-data-view','not-enabled',0,'af-data-permission-request','','auth-service','266c6a42-6131-4d62-8f39-853e7093701c','266c6a42-6131-4d62-8f39-853e7093701c',0

FROM DUAL WHERE NOT EXISTS(SELECT "sid" FROM "audit_policy" WHERE "sid" = 000000000000000001);


INSERT INTO "audit_policy" ("sid","id","name","description","type","status","resources_count","audit_type","proc_def_key","service_type","created_by_uid","updated_by_uid","deleted_at")

SELECT 000000000000000002,sys_guid(),'指标审核策略','作用于全部指标的权限申请','built-in-indicator','not-enabled',0,'af-data-permission-request','','auth-service','266c6a42-6131-4d62-8f39-853e7093701c','266c6a42-6131-4d62-8f39-853e7093701c',0

FROM DUAL WHERE NOT EXISTS(SELECT "sid" FROM "audit_policy" WHERE "sid" = 000000000000000002);


INSERT INTO "audit_policy" ("sid","id","name","description","type","status","resources_count","audit_type","proc_def_key","service_type","created_by_uid","updated_by_uid","deleted_at")

SELECT 000000000000000003,sys_guid(),'接口服务审核策略','作用于全部接口服务的权限申请','built-in-interface-svc','not-enabled',0,'af-data-permission-request','','auth-service','266c6a42-6131-4d62-8f39-853e7093701c','266c6a42-6131-4d62-8f39-853e7093701c',0

FROM DUAL WHERE NOT EXISTS(SELECT "sid" FROM "audit_policy" WHERE "sid" = 000000000000000003);


CREATE TABLE IF NOT EXISTS  "business_matters" (
    "id" BIGINT  NOT NULL ,
    "business_matters_id" VARCHAR(36 char) NOT NULL  ,
    "name" VARCHAR(128 char) NOT NULL ,
    "type_key" VARCHAR(64 char) NOT NULL ,
    "department_id" VARCHAR(36 char)  NOT NULL ,
    "materials_number" INT NOT NULL DEFAULT 0  ,
    "created_at" datetime(3) NOT NULL  DEFAULT current_timestamp(3) ,
    "creator_uid" VARCHAR(36 char) NOT NULL ,
    "updated_at" datetime(3) NOT NULL DEFAULT current_timestamp(3) ,
    "updater_uid" VARCHAR(36 char) NOT NULL  ,
    "deleted_at"  BIGINT NOT NULL DEFAULT 0  ,
    CLUSTER PRIMARY KEY ("id")
    ) ;
CREATE UNIQUE INDEX IF NOT EXISTS uk_business_matters_name ON business_matters("name","deleted_at");






