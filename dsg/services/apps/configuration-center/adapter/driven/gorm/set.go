package gorm

import (
	"github.com/google/wire"
	audit_process_bind "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/audit_process_bind/impl"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/common"
	address_book "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/address_book/impl"
	alarm_rule "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/alarm_rule/impl"
	apps "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/apps/impl"
	audit_policy "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/audit_policy/impl"
	business_matters "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/business_matters/impl"
	businessStructure "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/business_structure/impl"
	carousels "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/carousels/impl"
	code_generation_rule "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/code_generation_rule/impl"
	configuration "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/configuration/impl"
	data_grade_1 "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/data_grade/impl"
	datasource "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/datasource/impl"
	dict "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/dict/impl"
	firm "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/firm/impl"
	flowchart "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/flowchart/impl"
	flowchartNodeConfig "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/flowchart_node_config/impl"
	flowchartNodeTask "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/flowchart_node_task/impl"
	flowchartUnit "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/flowchart_unit/impl"
	flowchartVersion "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/flowchart_version/impl"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/front_end_processor"
	info_system "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/info_system/impl"
	liyue_registrations "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/liyue_registrations/impl"
	menu "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/menu/impl"
	news_policy "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/news_policy/impl"
	object_main_business "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/object_main_business/impl"
	object_subtype "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/object_subtype/impl"
	permission "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/permission/impl"
	register "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/register/impl"
	resource "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/resource/impl"
	role "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/role/impl"
	role2 "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/role2/impl"
	role_group "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/role_group/impl"
	role_group_role_binding "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/role_group_role_binding/impl"
	role_permission_binding "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/role_permission_binding/impl"
	user "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/user/impl"
	user2 "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/user2/impl"
	user_permission_binding "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/user_permission_binding/impl"
	user_role_binding "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/user_role_binding/impl"
	user_role_group_binding "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/user_role_group_binding/impl"
	tool "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/tool/impl"
)

var RepositoryProviderSet = wire.NewSet(
	flowchart.NewFlowchartRepo,
	flowchartVersion.NewFlowchartVersionRepo,
	flowchartUnit.NewFlowchartUnit,
	flowchartNodeConfig.NewFlowchartNodeConfigRepo,
	flowchartNodeTask.NewFlowchartNodeTask,
	role.NewRoleRepo,
	tool.NewToolRepo,
	user.NewUserRepo,
	businessStructure.NewBusinessStructureRepo,
	common.GetQuery,
	user2.NewUserRepo,
	resource.NewResourceRepo,
	datasource.NewDataSourceRepo,
	configuration.NewConfigurationRepo,
	info_system.NewInfoSystemRepo,
	code_generation_rule.NewCodeGenerationRuleRepo,
	data_grade_1.NewDataGradeRepo,
	audit_process_bind.NewAuditProcessBindRepo,
	apps.NewAppsRepo,
	business_matters.NewBusinessMattersRepo,
	dict.NewDictRepo,
	firm.NewRepo,
	front_end_processor.NewRepository,
	menu.NewMenuRepo,
	address_book.NewRepo,
	object_main_business.NewRepo,
	object_subtype.NewRepo,
	alarm_rule.NewRepo,
	carousels.NewRepository,
	news_policy.NewRepo,
	role2.NewRepo,
	permission.NewRepo,
	role_group.NewRepo,
	role_group_role_binding.NewRepo,
	role_permission_binding.NewRepo,
	user_permission_binding.NewRepo,
	user_role_binding.NewRepo,
	user_role_group_binding.NewRepo,
	audit_policy.NewAuditPolicyRepo,
	register.NewRepo,
	liyue_registrations.NewLiyueRegistrationsRepo,
)
