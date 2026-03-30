package service_stats

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/dto"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/domain"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

type ServiceStatsController struct {
	domain *domain.ServiceStatsDomain
}

func NewServiceStatsController(domain *domain.ServiceStatsDomain) *ServiceStatsController {
	return &ServiceStatsController{
		domain: domain,
	}
}

// ServiceTopData 接口top数据
//
//	@Description	接口top数据
//	@Tags			接口统计
//	@Summary		接口top数据
//	@Accept			json
//	@Produce		json
//	@Param			_	query		dto.ServiceTopDataReq	true	"请求参数"
//	@Success		200	{object}	dto.ServiceTopDataRes	"成功响应参数"
//	@Failure		400	{object}	rest.HttpError			"失败响应参数"
//	@Router			/api/data-application-service/frontend/v1/stats/top-data [get]
func (s *ServiceStatsController) ServiceTopData(c *gin.Context) {
	req := &dto.ServiceTopDataReq{}

	_, err := form_validator.BindQueryAndValid(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		if errors.As(err, &form_validator.ValidErrors{}) {
			ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
			return
		}

		ginx.ResErrJson(c, errorcode.Desc(errorcode.PublicRequestParameterError))
		return
	}

	res, err := s.domain.ServiceTopData(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// ServiceAssetCount 接口资产统计数据
//
//	@Description	接口资产统计数据
//	@Tags			接口统计
//	@Summary		接口资产统计数据
//	@Accept			json
//	@Produce		json
//	@Param			_	query		dto.ServiceAssetCountReq	true	"请求参数"
//	@Success		200	{object}	dto.ServiceAssetCountRes	"成功响应参数"
//	@Failure		400	{object}	rest.HttpError				"失败响应参数"
//	@Router			/api/data-application-service/frontend/v1/stats/asset-count [get]
func (s *ServiceStatsController) ServiceAssetCount(c *gin.Context) {
	req := &dto.ServiceAssetCountReq{}

	_, err := form_validator.BindQueryAndValid(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		if errors.As(err, &form_validator.ValidErrors{}) {
			ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
			return
		}

		ginx.ResErrJson(c, errorcode.Desc(errorcode.PublicRequestParameterError))
		return
	}

	res, err := s.domain.ServiceAssetCount(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// SubjectRelationCountGet 获取主题域关联的Service数量
//
//	@Description	获取主题域关联的Service数量
//	@Tags			获取主题域关联的Service数量统计
//	@Summary		返回各个主题域ID所关联的Service数量
//	@Accept			json
//	@Produce		json
//	@Param			_	query		dto.QueryDomainServiceArgs	true	"请求参数"
//	@Success		200	{object}	dto.QueryDomainServicesResp	"成功响应参数"
//	@Failure		400	{object}	rest.HttpError				"失败响应参数"
//	@Router			/api/data-application-service/internal/v1/stats/subject-relation-count [post]
func (s *ServiceStatsController) SubjectRelationCountGet(c *gin.Context) {
	req := &dto.QueryDomainServiceArgs{}
	_, err := form_validator.BindJsonAndValid(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		if errors.As(err, &form_validator.ValidErrors{}) {
			ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
			return
		}

		ginx.ResErrJson(c, errorcode.Desc(errorcode.PublicRequestParameterError))
		return
	}

	res, err := s.domain.SubjectRelationServiceCount(c, req)
	if err != nil {
		ginx.ResErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}
