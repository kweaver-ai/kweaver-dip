package driver

import (
	"github.com/google/wire"
	grade_rule_group "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driver/grade_rule_group/v1"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driver/mq/standardization"

	common_middleware "github.com/kweaver-ai/idrm-go-common/middleware/v1"

	classification_rule "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driver/classification_rule/v1"
	data_lineage "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driver/data_lineage/v1"
	data_privacy_policy "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driver/data_privacy_policy/v1"
	explore_rule "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driver/explore_rule/v1"
	explore_task "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driver/explore_task/v1"
	form_view "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driver/form_view/v1"
	grade_rule "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driver/grade_rule/v1"
	graph_model "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driver/graph_model/v1"
	logic_view "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driver/logic_view/v1"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driver/mq"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driver/mq/datasource"
	data_explore "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driver/mq/explore"
	explore "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driver/mq/explore_task"
	view "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driver/mq/form_view"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driver/mq/kafka"
	recognition_algorithm "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driver/recognition_algorithm/v1"
	sub_view "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driver/sub_view/v1"
)

var Set = wire.NewSet(
	NewRouter,
	NewHttpEngine,
	common_middleware.NewMiddleware,
	form_view.NewFormViewService,
	logic_view.NewLogicViewService,
	sub_view.NewSubViewService,
	explore_task.NewExploreTaskService,
	data_explore.NewDataExplorationHandler,
	explore.NewExploreTaskHandler,
	view.NewFormViewHandler,
	standardization.NewStandardizationHandler,
	data_privacy_policy.NewDataPrivacyPolicyService,
	recognition_algorithm.NewRecognitionAlgorithmService,
	classification_rule.NewClassificationRuleService,
	grade_rule.NewGradeRuleService,
	grade_rule_group.NewGradeRuleGroupService,
	graph_model.NewGraphModel,
	explore_rule.NewExploreRuleService,
	//mq
	datasource.NewDataSourceConsumer,
	//mq.NewKafkaConsumer,
	data_lineage.NewFormViewService,
	kafka.NewKafkaProducer,
	kafka.NewConsumerClient,
	mq.NewMQHandler,
)
