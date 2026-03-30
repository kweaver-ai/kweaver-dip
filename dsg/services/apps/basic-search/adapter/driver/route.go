package driver

import (
	"github.com/gin-gonic/gin"

	"github.com/kweaver-ai/dsg/services/apps/basic-search/adapter/driver/data_catalog"
	"github.com/kweaver-ai/dsg/services/apps/basic-search/adapter/driver/data_search_all"
	"github.com/kweaver-ai/dsg/services/apps/basic-search/adapter/driver/data_view"
	"github.com/kweaver-ai/dsg/services/apps/basic-search/adapter/driver/elec_license"
	"github.com/kweaver-ai/dsg/services/apps/basic-search/adapter/driver/info_catalog"
	"github.com/kweaver-ai/dsg/services/apps/basic-search/adapter/driver/info_system"
	"github.com/kweaver-ai/dsg/services/apps/basic-search/adapter/driver/interface_svc"
	"github.com/kweaver-ai/dsg/services/apps/basic-search/common/middleware"
	domain "github.com/kweaver-ai/dsg/services/apps/basic-search/domain/data_catalog"
	all_domain "github.com/kweaver-ai/dsg/services/apps/basic-search/domain/data_search_all"
	dataView_domain "github.com/kweaver-ai/dsg/services/apps/basic-search/domain/data_view"
	elec_license_domain "github.com/kweaver-ai/dsg/services/apps/basic-search/domain/elec_license"
	info_catalog_domain "github.com/kweaver-ai/dsg/services/apps/basic-search/domain/info_catalog"
	interface_domain "github.com/kweaver-ai/dsg/services/apps/basic-search/domain/interface_svc"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
)

var _ IRouter = (*Router)(nil)

type IRouter interface {
	Register(r *gin.Engine) error
}

type Router struct {
	DataCatalogSvc   data_catalog.Service
	InterfaceSvc     interface_svc.Service
	DataViewSvc      data_view.Service
	DataSearchAllSvc data_search_all.Service
	InfoCatalogSvc   info_catalog.Service
	ElecLicenseSvc   elec_license.Service
	// 信息系统
	InfoSystem info_system.Service
}

func (r *Router) Register(engine *gin.Engine) error {
	r.RegisterApi(engine)
	return nil
}

func (r *Router) RegisterApi(engine *gin.Engine) {
	basicSearchRouter := engine.Group("/api/basic-search/v1")

	{
		// 服务超市搜索router group
		basicSearchRouter.Use(trace.MiddlewareTrace()) // 用于处理trace的middleware

		{
			dataCatalogGroup := basicSearchRouter.Group("/data-catalog")
			dataCatalogGroup.POST("/search", middleware.ReqParamValidator[domain.SearchReqParam], r.DataCatalogSvc.Search)             // 搜索数据资源目录
			dataCatalogGroup.POST("/statistics", middleware.ReqParamValidator[domain.StatisticsReqParam], r.DataCatalogSvc.Statistics) // 获取数据资源目录的统计信息
		}

		{
			// 接口服务搜索router group
			interfaceSvcRouter := basicSearchRouter.Group("/interface-svc")
			interfaceSvcRouter.POST("/search", middleware.ReqParamValidator[interface_domain.SearchReqParam], r.InterfaceSvc.Search) // 搜索服务列表
		}

		{
			// 数据搜索router group （数据视图）
			totalRouter := basicSearchRouter.Group("/data-view")
			totalRouter.POST("/search", middleware.ReqParamValidator[dataView_domain.SearchReqParam], r.DataViewSvc.Search)
		}

		{
			// 全部搜索router group
			totalRouter := basicSearchRouter.Group("/data-resource")
			totalRouter.POST("/search", middleware.ReqParamValidator[all_domain.SearchAllReqParam], r.DataSearchAllSvc.SearchAll)
		}

		{
			// 全部搜索router group
			//totalRouter := basicSearchRouter.Group("/total")
			//totalRouter.POST("/search", middleware.ReqParamValidator[domain.SearchAllReqParam], r.DataCatalogSvc.SearchAll)
		}

		{
			infoCatalogGroup := basicSearchRouter.Group("/info-catalog")
			infoCatalogGroup.POST("/search", middleware.ReqParamValidator[info_catalog_domain.SearchReqParam], r.InfoCatalogSvc.Search) // 搜索信息资源目录
			// infoCatalogGroup.POST("/statistics", middleware.ReqParamValidator[info_catalog_domain.StatisticsReqParam], r.InfoCatalogSvc.Statistics) // 获取信息资源目录的统计信息
		}

		{
			elecLicenseGroup := basicSearchRouter.Group("/elec-license")
			elecLicenseGroup.POST("/search", middleware.ReqParamValidator[elec_license_domain.SearchReqParam], r.ElecLicenseSvc.Search) // 搜索电子证照目录
			// elecLicenseGroup.POST("/statistics", middleware.ReqParamValidator[info_catalog_domain.StatisticsReqParam], r.InfoCatalogSvc.Statistics) // 获取电子证照目录的统计信息
		}

		// 搜索信息系统
		basicSearchRouter.GET("info-systems/search", r.InfoSystem.Search)
		// 搜索信息系统，建议使用 GET 接口
		basicSearchRouter.POST("info-systems/search", r.InfoSystem.Search)
	}
}
