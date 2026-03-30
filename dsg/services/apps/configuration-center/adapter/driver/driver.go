package driver

import (
	"github.com/google/wire"
	address_book "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driver/address_book/v1"
	alarm_rule "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driver/alarm_rule/v1"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driver/apps/v1"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driver/audit_policy/v1"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driver/audit_process_bind/v1"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driver/business_matters/v1"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driver/business_structure/v1"
	carousels "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driver/carousels/v1"
	code_generation_rule "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driver/code_generation_rule/v1"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driver/configuration/v1"
	data_grade_service "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driver/data_grade/v1"
	data_masking "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driver/data_masking/v1"
	datasource "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driver/datasource/v1"
	dict_service "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driver/dict/v1"
	firm "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driver/firm/v1"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driver/flowchart/v1"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driver/front_end_processor/v1"
	info_system "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driver/info_system/v1"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driver/menu"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driver/middleware"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driver/mq"
	datasourceMQ "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driver/mq/datasource"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driver/mq/department"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driver/mq/user_mgm"
	news_policy "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driver/news_policy/v1"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driver/object_main_business/v1"
	permission "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driver/permission/v1"
	register "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driver/register/v1"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driver/role/v1"
	role_v2 "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driver/role/v2"
	role_group "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driver/role_group/v1"
	sms_conf "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driver/sms_conf/v1"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driver/tool/v1"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driver/user/v1"
)

var ServiceProviderSet = wire.NewSet(
	business_structure.NewService,
	flowchart.NewService,
	role.NewService,
	role_v2.NewService,
	tool.NewService,
	user.NewService,
	datasource.NewService,
	configuration.NewService,
	info_system.NewService,
	code_generation_rule.NewService,
	data_grade_service.NewService,
	data_masking.NewService,
	audit_process_bind.NewService,
	apps.NewService,
	business_matters.NewService,
	firm.NewService,
	menu.NewService,
	//mq.Set,
	dict_service.NewService,
	front_end_processor.New,
	address_book.NewService,
	object_main_business.NewService,
	alarm_rule.NewService,
	news_policy.NewService,
	register.NewService,
	carousels.NewService,
	role_group.NewService,
	permission.NewService,
	audit_policy.NewService,

	//mq
	department.NewHandler,
	datasourceMQ.NewHandler,
	user_mgm.NewHandler,
	mq.NewMQ,

	sms_conf.NewService,
)

var Set = wire.NewSet(
	NewHttpServer,
	ServiceProviderSet,
	RouterSet,
	middleware.NewMiddleware,
)
