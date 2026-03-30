package impl

import (
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/basic_search"
	cf "github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/configuration_center"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/databases"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/databases/af_configuration"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/mq/es"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/info_resource_catalog"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/category"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_resource_catalog"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/info_resource_catalog_statistic"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/my_favorite"
	"github.com/kweaver-ai/idrm-go-common/rest/business_grooming"
	"github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
	"github.com/kweaver-ai/idrm-go-common/rest/label"
	"github.com/kweaver-ai/idrm-go-common/rest/standardization"
	wfDriven "github.com/kweaver-ai/idrm-go-common/rest/workflow"
	"github.com/kweaver-ai/idrm-go-common/workflow"
)

// [信息资源编目领域服务实现]
type infoResourceCatalogDomain struct {
	repo                    info_resource_catalog.InfoResourceCatalogRepo
	dataResourceCatalogRepo data_resource_catalog.DataResourceCatalogRepo
	categoryRepo            category.Repo
	confCenter              configuration_center.Driven
	confCenterLocal         cf.Repo
	bizGrooming             business_grooming.Driven
	standardization         standardization.Driven
	workflow                workflow.WorkflowInterface
	docAudit                wfDriven.DocAuditDriven
	search                  basic_search.Repo
	es                      es.ESRepo
	myFavoriteRepo          my_favorite.Repo
	// 数据库表 af_configuration.objects
	objects       af_configuration.ObjectInterface
	statisticRepo info_resource_catalog_statistic.Repo
	label         label.Driven
} // [/]

// [信息资源编目领域服务构造器函数]
func NewInfoResourceCatalogDomain(
	repo info_resource_catalog.InfoResourceCatalogRepo,
	dataResourceCatalogRepo data_resource_catalog.DataResourceCatalogRepo,
	categoryRepo category.Repo,
	confCenter configuration_center.Driven,
	confCenterLocal cf.Repo,
	bizGrooming business_grooming.Driven,
	standardization standardization.Driven,
	workflow workflow.WorkflowInterface,
	docAudit wfDriven.DocAuditDriven,
	search basic_search.Repo,
	es es.ESRepo,
	myFavoriteRepo my_favorite.Repo,
	databases databases.Interface,
	statisticRepo info_resource_catalog_statistic.Repo, label label.Driven,
) info_resource_catalog.InfoResourceCatalogDomain {
	d := &infoResourceCatalogDomain{
		repo:                    repo,
		dataResourceCatalogRepo: dataResourceCatalogRepo,
		categoryRepo:            categoryRepo,
		confCenter:              confCenter,
		confCenterLocal:         confCenterLocal,
		bizGrooming:             bizGrooming,
		standardization:         standardization,
		workflow:                workflow,
		docAudit:                docAudit,
		search:                  search,
		es:                      es,
		myFavoriteRepo:          myFavoriteRepo,
		objects:                 databases.AFConfiguration().Object(),
		statisticRepo:           statisticRepo,
		label:                   label,
	}
	d.init()
	return d
} // [/]

func (d *infoResourceCatalogDomain) init() {
	d.handleAuditStatusChange()
}
