package domain

import (
	"github.com/google/wire"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/workflow"
	address_book "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/address_book/impl"
	alarm_rule "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/alarm_rule/impl"
	apps "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/apps/impl"
	audit_policy "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/audit_policy/impl"
	audit_process_bind "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/audit_process_bind/impl"
	business_matters "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/business_matters/impl"
	businessStructure "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/business_structure/impl"
	carousels "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/carousels/impl"
	code_generation_rule "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/code_generation_rule/impl"
	configuration "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/configuration/impl"
	data_garde_3 "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/data_grade/impl"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/data_masking"
	datasource "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/datasource/impl"
	dict "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/dict/impl"
	firm "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/firm/impl"
	flowchart "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/flowchart/impl"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/front_end_processor"
	info_system "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/info_system/impl"
	menu "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/menu/impl"
	news_policy "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/news_policy/impl"
	object_main_business "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/object_main_business/impl"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/permission"
	permissions "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/permissions/impl"
	register "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/register/impl"
	role "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/role/impl"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/role_group"
	role_v2 "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/role_v2/impl"
	sms_conf "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/sms_conf/impl"
	tool "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/tool/impl"
	user "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/user/impl"
	d_session "github.com/kweaver-ai/idrm-go-common/d_session/impl"
	auth_service_impl "github.com/kweaver-ai/idrm-go-common/rest/auth-service/v1"
)

// Set is biz providers.
var Set = wire.NewSet(
	businessStructure.NewBusinessStructUseCase,
	code_generation_rule.NewCodeGenerationRuleUseCase,
	flowchart.NewFlowchartUseCase,
	role.NewRoleUseCase,
	tool.NewToolUsecase,
	user.NewUser,
	datasource.NewDataSourceUseCase,
	configuration.NewConfiguration,
	permissions.NewPermissions,
	info_system.NewInfoSystemUseCase,
	data_garde_3.NewDataGrade,
	data_masking.NewSqlMaskingDomain,
	audit_process_bind.NewAuditProcessBindUseCase,
	apps.NewAuditProcessBindUseCase,
	business_matters.NewBusinessMattersUseCase,
	auth_service_impl.NewInternalForBase,
	dict.NewUseCase,
	workflow.NewWFStarter,
	firm.NewUseCase,
	front_end_processor.New,
	menu.NewUseCase,
	role_v2.NewRoleUseCase,
	d_session.NewSession,
	address_book.NewUseCase,
	object_main_business.NewUseCase,
	alarm_rule.NewUseCase,
	carousels.NewUseCase,
	register.NewUseCase,
	news_policy.NewUseCase,
	permission.New,
	role_group.New,
	audit_policy.NewAuditPolicyUseCase,
	sms_conf.NewUseCase,
)
