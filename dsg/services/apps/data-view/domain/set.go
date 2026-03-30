package gorm

import (
	"github.com/google/wire"
	v1_13 "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driver/data_set/v1"
	classification_rule "github.com/kweaver-ai/dsg/services/apps/data-view/domain/classification_rule/v1"
	"github.com/kweaver-ai/dsg/services/apps/data-view/domain/common"
	data_lineage_processor "github.com/kweaver-ai/dsg/services/apps/data-view/domain/data_lineage/processor"
	data_lineage "github.com/kweaver-ai/dsg/services/apps/data-view/domain/data_lineage/v1"
	data_privacy_policy "github.com/kweaver-ai/dsg/services/apps/data-view/domain/data_privacy_policy/v1"
	v1_12 "github.com/kweaver-ai/dsg/services/apps/data-view/domain/data_set/v1"
	explore_rule "github.com/kweaver-ai/dsg/services/apps/data-view/domain/explore_rule/v1"
	explore_task "github.com/kweaver-ai/dsg/services/apps/data-view/domain/explore_task/v1"
	formView "github.com/kweaver-ai/dsg/services/apps/data-view/domain/form_view/v1"
	grade_rule "github.com/kweaver-ai/dsg/services/apps/data-view/domain/grade_rule/v1"
	grade_rule_group "github.com/kweaver-ai/dsg/services/apps/data-view/domain/grade_rule_group/v1"
	graph_model "github.com/kweaver-ai/dsg/services/apps/data-view/domain/graph_model/impl"
	logicView "github.com/kweaver-ai/dsg/services/apps/data-view/domain/logic_view/impl"
	recognition_algorithm "github.com/kweaver-ai/dsg/services/apps/data-view/domain/recognition_algorithm/v1"
	subView "github.com/kweaver-ai/dsg/services/apps/data-view/domain/sub_view/impl"
)

var Set = wire.NewSet(
	data_lineage.NewViewLineageUseCase,
	formView.NewFormViewUseCase,
	logicView.NewLogicViewUseCase,
	subView.NewSubViewUseCase,
	explore_task.NewExploreTaskUseCase,
	formView.NewServer,
	common.NewCommonUseCase,
	data_lineage_processor.NewFormViewInfoFetcher,
	data_privacy_policy.NewDataPrivacyPolicyUseCase,
	recognition_algorithm.NewRecognitionAlgorithmUseCase,
	classification_rule.NewClassificationRuleUseCase,
	grade_rule.NewGradeRuleUseCase,
	grade_rule_group.NewGradeRuleGroupUseCase,
	v1_12.NewDataSetUseCase,
	v1_13.NewDataSetService,
	graph_model.NewUseCase,
	explore_rule.NewExploreRuleUseCase,
)
