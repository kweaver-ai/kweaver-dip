/*
 * @Author: David.chen David.chen02@KweaverAI.cn
 * @Date: 2023-06-28 10:21:14
 * @LastEditors: David.chen David.chen02@KweaverAI.cn
 * @LastEditTime: 2023-07-08 15:05:54
 * @FilePath: /data-catalog/infrastructure/repository/db/gorm/set.go
 * @Description: 这是默认设置,请设置customMade, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
package gorm

import (
	"github.com/google/wire"
	apply_scope_impl "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/apply-scope/impl"
	assessment_repo "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/assessment/impl"
	logic_entity_by_business_domain "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/business_logic_entity_by_business_domain/impl"
	logic_entity_by_department "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/business_logic_entity_by_department/impl"
	catalog_feedback "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/catalog_feedback/impl"
	catalog_feedback_op_log "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/catalog_feedback_op_log/impl"
	category "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/category/impl"
	category_apply_scope_relation "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/category_apply_scope_relation/impl"
	classify "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/classify/impl"
	client_info "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/client_info/impl"
	cognitive_service_system "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/cognitive_service_system/impl"
	data_assets_info "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_assets_info/impl"
	catalog "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_catalog/impl"
	catalog_flow "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_catalog_audit_flow_bind/impl"
	catalog_sequence "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_catalog_code_sequence/impl"
	catalog_title "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_catalog_code_title/impl"
	catalog_column "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_catalog_column/impl"
	download_apply "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_catalog_download_apply/impl"
	catalog_info "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_catalog_info/impl"
	catalog_resource "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_catalog_mount_resource/impl"
	data_catalog_score "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_catalog_score/impl"
	stats_info "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_catalog_stats_info/impl"
	data_comprehension "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_comprehension/impl"
	data_comprehension_template "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_comprehension_template/impl"
	data_push_impl "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_push/impl"
	data_resource "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_resource/impl"
	data_resource_catalog "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_resource_catalog/impl"
	elec_licence "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/elec_licence/impl"
	elec_licence_column "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/elec_licence_column/impl"
	file_resource "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/file_resource/impl"
	form_data_count "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/form_data_count/impl"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/info_catalog"
	info_resource_catalog_statistic "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/info_resource_catalog_statistic/impl"
	my "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/my/impl"
	my_favorite "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/my_favorite/impl"
	open_catalog "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/open_catalog/impl"
	res_feedback "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/res_feedback/impl"
	rule_config "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/rule_config/impl"
	standardization_info "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/standardization_info/impl"
	statistics "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/statistics/impl"
	system_operation_detail "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/system_operation_detail/impl"
	tree "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/tree/impl"
	tree_node "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/tree_node/impl"
	user_catalog_rel "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/user_data_catalog_rel/impl"
	user_catalog "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/user_data_catalog_stats_info/impl"
)

var RepositoryProviderSet = wire.NewSet(
	catalog.NewRepo,
	catalog_sequence.NewRepo,
	catalog_title.NewRepo,
	catalog_column.NewRepo,
	catalog_info.NewRepo,
	catalog_resource.NewRepo,
	catalog_flow.NewRepo,
	download_apply.NewRepo,
	stats_info.NewRepo,
	user_catalog_rel.NewRepo,
	tree.NewRepo,
	tree_node.NewRepo,
	data_comprehension.NewRepo,
	data_comprehension_template.NewRepo,
	user_catalog.NewRepo,
	data_assets_info.NewRepo,
	logic_entity_by_business_domain.NewRepo,
	logic_entity_by_department.NewRepo,
	standardization_info.NewRepo,
	client_info.NewRepo,
	my.NewRepo,
	category.NewRepo,
	category.NewRepoTree,
	data_resource.NewDataResourceRepo,
	data_resource_catalog.NewDataResourceCatalogRepo,
	catalog_feedback.NewRepo,
	catalog_feedback_op_log.NewRepo,
	open_catalog.NewOpenCatalogRepo,
	data_catalog_score.NewDataCatalogScoreRepo,
	elec_licence.NewElecLicenceRepo,
	elec_licence_column.NewElecLicenceColumnRepo,
	classify.NewClassifyRepo,
	my_favorite.NewRepo,
	data_push_impl.NewRepoImpl,
	file_resource.NewFileResourceRepo,
	cognitive_service_system.NewRepoImpl,
	statistics.NewRepo,
	info_resource_catalog_statistic.NewRepo,
	system_operation_detail.NewSystemOperationDetailRepo,
	rule_config.NewRuleConfigRepo,
	form_data_count.NewFormDataCountRepo,
	apply_scope_impl.NewRepoImpl,
	category_apply_scope_relation.NewRepoImpl,
	info_catalog.NewInfoCatalogRepo,
	res_feedback.NewRepo,
	assessment_repo.NewAssessmentRepo,
)
