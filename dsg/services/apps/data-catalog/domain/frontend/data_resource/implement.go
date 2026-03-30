package data_resource

import (
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/auth_service"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/basic_search"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/configuration_center"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/data_view"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/databases"
	indicator_management "github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/indicator-management"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/my_favorite"
)

// DataResourceDomain 的实现
type dataResourceDomain struct {
	// auth-service
	asRepo auth_service.Repo
	// basic-search
	bsRepo basic_search.Repo
	// configuration-center
	cfgRepo configuration_center.Repo
	// data-view
	dvRepo data_view.Repo
	// indicator-management
	imRepo indicator_management.Repo
	// 数据库
	databases databases.Interface
	// 收藏
	myFavoriteRepo my_favorite.Repo
}

var _ DataResourceDomain = &dataResourceDomain{}

func NewDataResourceDomain(
	asRepo auth_service.Repo,
	bsRepo basic_search.Repo,
	cfgRepo configuration_center.Repo,
	dvRepo data_view.Repo,
	imRepo indicator_management.Repo,
	databases databases.Interface,
	myFavoriteRepo my_favorite.Repo,
) DataResourceDomain {
	return &dataResourceDomain{
		asRepo:         asRepo,
		bsRepo:         bsRepo,
		cfgRepo:        cfgRepo,
		dvRepo:         dvRepo,
		imRepo:         imRepo,
		databases:      databases,
		myFavoriteRepo: myFavoriteRepo,
	}
}
