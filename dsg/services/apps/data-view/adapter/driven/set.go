package gorm

import (
	"github.com/google/wire"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/callbacks"
	data_set_impl "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/data_set/impl"
	department_explore_report "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/department_explore_report/impl"
	desensitization_rule "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/desensitization_rule/impl"
	form_view_extend "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/form_view_extend/impl"
	grade_rule "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/grade_rule/impl"
	grade_rule_group "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/grade_rule_group/impl"
	graph_model "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/graph_model/impl"
	template_rule "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/template_rule/impl"
	white_list_policy "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/white_list_policy/impl"
	es "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/mq/es/impl"
	mdl "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/rest/mdl_data_model/impl"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/workflow"
	"github.com/kweaver-ai/idrm-go-common/rest"

	configuration_center2 "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/configuration_center/impl"
	data_classify_attribute_blacklist "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/data_classify_attribute_blacklist/impl"
	data_preview_config "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/data_preview_config/impl"
	data_privacy_policy "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/data_privacy_policy/impl"
	data_privacy_policy_field "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/data_privacy_policy_field/impl"
	datasourceRepo "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/datasource/impl"
	explore_rule_config "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/explore_rule_config/impl"
	explore_task "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/explore_task/impl"
	form_view "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/form_view/impl"
	form_view_field "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/form_view_field/impl"
	logic_view "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/logic_view/impl"
	scan_record "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/scan_record/impl"
	sub_view "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/sub_view/impl"
	t_data_download_task "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/t_data_download_task/impl"
	tmp_completion "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/tmp_completion/impl"
	tmp_explore_sub_task "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/tmp_explore_sub_task/impl"
	userRepo "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/user/impl"
	datasource "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/mq/datasource/impl"
	kafka_pub "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/mq/kafka/impl"
	redisson "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/redis"
	auth_service "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/rest/auth_service/impl"
	configuration_center1 "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/rest/configuration_center/impl"
	data_exploration "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/rest/data_exploration/impl"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/rest/oss_gateway"
	scene_analysis "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/rest/scene_analysis/impl"
	standardization_backend "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/rest/standardization_backend/impl"
	sailorService "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/sailor_service/impl"

	//"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/rest/configuration_center"
	classification_rule "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/classification_rule/impl"
	classification_rule_algorithm_relation "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/classification_rule_algorithm_relation/impl"
	recognition_algorithm "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/recognition_algorithm/impl"
	data_subject "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/rest/data-subject/impl"
	metadata "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/rest/metadata/impl"
	virtualization_engine "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/rest/virtualization_engine/impl"
	localmiddleware "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driver/middleware"
	af_trace "github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
)

var Set = wire.NewSet(
	af_trace.NewOtelHttpClient,
	//localmiddleware.NewUserMgnt,
	//localmiddleware.NewHydra,
	//localmiddleware.NewConfigurationCenterDriven,
	localmiddleware.NewConfigurationCenterLabelService,

	//mq
	datasource.NewMQHandleInstance,
	kafka_pub.NewKafkaProducer,
	es.NewESRepo,

	//gorm
	form_view.NewFormViewRepo,
	datasourceRepo.NewDatasourceRepo,
	white_list_policy.NewWhiteListPolicyRepo,
	userRepo.NewUserRepo,
	form_view_field.NewFormViewFieldRepo,
	scan_record.NewScanRecordRepo,
	logic_view.NewLogicViewRepo,
	t_data_download_task.NewTDataDownloadTaskRepo,
	explore_task.NewExploreTaskRepo,
	tmp_explore_sub_task.NewExploreTaskRepo,
	data_classify_attribute_blacklist.NewDataClassifyAttrBlacklistRepo,
	sub_view.NewSubViewRepo,
	tmp_completion.NewTmpCompletionRepo,
	explore_rule_config.NewExploreRuleConfigRepo,
	data_preview_config.NewDataPreviewConfigRepo,
	data_privacy_policy.NewDataPrivacyPolicyRepo,
	data_privacy_policy_field.NewDataPrivacyPolicyFieldRepo,
	desensitization_rule.NewDesensitizationRuleRepo,
	form_view_extend.NewFormViewExtendRepo,
	data_set_impl.NewDataSetRepo,
	classification_rule_algorithm_relation.NewClassificationRuleAlgorithmRelationRepo,
	classification_rule.NewClassificationRuleRepo,
	recognition_algorithm.NewRecognitionAlgorithmRepo,
	grade_rule.NewGradeRuleRepo,
	grade_rule_group.NewGradeRuleGroupRepo,
	graph_model.NewRepo,
	template_rule.NewTemplateRuleRepo,
	department_explore_report.NewDepartmentExploreReportRepo,

	//redisson
	redisson.NewRedisson,

	//rest
	configuration_center1.NewConfigurationCenterDrivenNG,
	virtualization_engine.NewVirtualizationEngine,
	metadata.NewMetadata,
	//metadata_manage_impl.NewDrivenImpl,
	scene_analysis.NewSceneAnalysisDriven,
	mdl.NewMdlDataModel,
	//standardization.NewDriven,
	//business_grooming_impl.NewDriven,
	//rest.NewCommonSceneAnalysisDriven,
	rest.Set,

	//认知助手
	sailorService.NewSailorServiceCall,
	//配置中心
	configuration_center2.NewConfigurationCenterCall,
	auth_service.NewAuthService,
	data_subject.NewDataSubject,
	standardization_backend.NewStandardizationBackend,
	data_exploration.NewDataExploration,
	oss_gateway.NewCephClient,
	//data_subject_impl.NewDataViewDriven,

	//entity_change
	databaseCallback,

	// workflow
	workflow.NewWorkflow,
	workflow.NewWFStarter,
)

var MockSet = wire.NewSet(
	af_trace.NewOtelHttpClient,
	//user_management.NewUserManagement,
	//localmiddleware.NewHydra,
	//localmiddleware.NewConfigurationCenterDriven,
	localmiddleware.NewConfigurationCenterLabelService,

	//mq
	datasource.NewMQHandleInstance,
	kafka_pub.NewKafkaProducer,
	es.NewESRepo,

	//gorm
	form_view.NewFormViewRepo,
	datasourceRepo.NewDatasourceRepo,
	white_list_policy.NewWhiteListPolicyRepo,
	userRepo.NewUserRepo,
	form_view_field.NewFormViewFieldRepo,
	scan_record.NewScanRecordRepo,
	logic_view.NewLogicViewRepo,
	t_data_download_task.NewTDataDownloadTaskRepo,
	explore_task.NewExploreTaskRepo,
	tmp_explore_sub_task.NewExploreTaskRepo,
	data_classify_attribute_blacklist.NewDataClassifyAttrBlacklistRepo,
	sub_view.NewSubViewRepo,
	tmp_completion.NewTmpCompletionRepo,
	explore_rule_config.NewExploreRuleConfigRepo,
	data_preview_config.NewDataPreviewConfigRepo,
	data_privacy_policy.NewDataPrivacyPolicyRepo,
	data_privacy_policy_field.NewDataPrivacyPolicyFieldRepo,
	desensitization_rule.NewDesensitizationRuleRepo,
	form_view_extend.NewFormViewExtendRepo,
	classification_rule_algorithm_relation.NewClassificationRuleAlgorithmRelationRepo,
	classification_rule.NewClassificationRuleRepo,
	recognition_algorithm.NewRecognitionAlgorithmRepo,
	grade_rule.NewGradeRuleRepo,
	grade_rule_group.NewGradeRuleGroupRepo,
	graph_model.NewRepo,
	data_set_impl.NewDataSetRepo,
	//redisson
	redisson.NewRedisson,
	template_rule.NewTemplateRuleRepo,

	//rest
	configuration_center1.NewConfigurationCenterDrivenNG,
	virtualization_engine.NewVirtualizationEngine,
	metadata.NewMetadata,
	//metadata_manage_impl.NewDrivenImpl,
	scene_analysis.NewSceneAnalysisDriven,
	//business_grooming_impl.NewDriven,
	//rest.NewCommonSceneAnalysisDriven,
	//认知助手
	sailorService.NewSailorServiceCall,
	//配置中心
	configuration_center2.NewConfigurationCenterCall,
	auth_service.NewAuthService,
	data_subject.NewDataSubject,
	standardization_backend.NewStandardizationBackend,
	data_exploration.NewDataExploration,
	oss_gateway.NewCephClient,
	//data_subject_impl.NewDataViewDriven,
	//standardization.NewDriven,

	// workflow
	workflow.NewWorkflow,
	workflow.NewWFStarter,
	rest.Set,

	//entity_change
	databaseCallback,
)

var databaseCallback = wire.NewSet(
	callbacks.NewTransport,
	//认知搜索资源版
	callbacks.NewEntityChangeTransport,
	callbacks.NewDataLineageTransport,
)
